import { MigrationInterface, QueryRunner } from 'typeorm';

// Splits asset data so `assets` holds only catalog details and `asset_inventories`
// holds everything tracked per unit.
export class SplitAssetDetailsAndInventory1790137600000 implements MigrationInterface {
  name = 'SplitAssetDetailsAndInventory1790137600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // assets.type -> assets.category
    await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" RENAME TO "assets_category_enum"`);
    await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "type" TO "category"`);
    await queryRunner.query(`ALTER INDEX "public"."IDX_56647aa3c21954f7c7fcbc2505" RENAME TO "IDX_assets_category"`);

    // BitLocker details are per unit: copy them from each unit's asset before dropping them there.
    // The asset-level serialNumber is dropped; the unit's assetCode becomes its serial number below
    await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "bitLockerIdentifier" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "recoveryPin" character varying(255)`);
    await queryRunner.query(`
      UPDATE "asset_inventories" ai
      SET "bitLockerIdentifier" = a."bitLockerIdentifier",
          "recoveryPin" = a."recoveryPin"
      FROM "assets" a
      WHERE ai."assetId" = a."id"
    `);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "serialNumber"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "bitLockerIdentifier"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "recoveryPin"`);

    // Inactive is now tracked per unit via the Inactive status
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isActive"`);
    await queryRunner.query(`ALTER TYPE "public"."asset_inventories_status_enum" ADD VALUE 'Inactive'`);

    // model is required; existing assets without one get a placeholder
    await queryRunner.query(`UPDATE "assets" SET "model" = 'Unknown' WHERE "model" IS NULL`);
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "model" SET NOT NULL`);

    // asset_inventories.assetCode -> asset_inventories.serialNumber (optional), plus new per-unit fields
    await queryRunner.query(`ALTER TABLE "asset_inventories" RENAME COLUMN "assetCode" TO "serialNumber"`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "serialNumber" TYPE character varying(255)`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "serialNumber" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "attachmentUrl" character varying(2048)`);

    // Serial numbers are unique among non-deleted units. Blank ones are treated as unset, and
    // existing duplicates (e.g. old count-based asset codes reused after a delete) keep the
    // value on their oldest unit while the rest get their id appended
    await queryRunner.query(`UPDATE "asset_inventories" SET "serialNumber" = NULL WHERE btrim("serialNumber") = ''`);
    await queryRunner.query(`
      UPDATE "asset_inventories" ai
      SET "serialNumber" = ai."serialNumber" || '-' || ai."id"
      FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "serialNumber" ORDER BY "id") AS rn
        FROM "asset_inventories"
        WHERE "serialNumber" IS NOT NULL AND "deletedAt" IS NULL
      ) dup
      WHERE ai."id" = dup."id" AND dup.rn > 1
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_asset_inventories_serialNumber" ON "asset_inventories" ("serialNumber") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_asset_inventories_serialNumber"`);

    await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "attachmentUrl"`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "description"`);
    await queryRunner.query(`UPDATE "asset_inventories" SET "serialNumber" = 'UNIT-' || "id" WHERE "serialNumber" IS NULL`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "serialNumber" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "serialNumber" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" RENAME COLUMN "serialNumber" TO "assetCode"`);

    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "model" DROP NOT NULL`);

    // Fails if any unit is still Inactive; change those units' status before reverting
    await queryRunner.query(`ALTER TYPE "public"."asset_inventories_status_enum" RENAME TO "asset_inventories_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."asset_inventories_status_enum" AS ENUM('Available', 'Reserved', 'Assigned')`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "status" TYPE "public"."asset_inventories_status_enum" USING "status"::text::"public"."asset_inventories_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."asset_inventories_status_enum_old"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "isActive" boolean NOT NULL DEFAULT true`);

    // Restore the asset-level BitLocker columns from each asset's first unit
    await queryRunner.query(`ALTER TABLE "assets" ADD "serialNumber" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "bitLockerIdentifier" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "recoveryPin" character varying(255)`);
    await queryRunner.query(`
      UPDATE "assets" a
      SET "bitLockerIdentifier" = ai."bitLockerIdentifier",
          "recoveryPin" = ai."recoveryPin"
      FROM (
        SELECT DISTINCT ON ("assetId") "assetId", "bitLockerIdentifier", "recoveryPin"
        FROM "asset_inventories"
        ORDER BY "assetId", "id"
      ) ai
      WHERE a."id" = ai."assetId"
    `);
    await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "recoveryPin"`);
    await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "bitLockerIdentifier"`);

    await queryRunner.query(`ALTER INDEX "public"."IDX_assets_category" RENAME TO "IDX_56647aa3c21954f7c7fcbc2505"`);
    await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "category" TO "type"`);
    await queryRunner.query(`ALTER TYPE "public"."assets_category_enum" RENAME TO "assets_type_enum"`);
  }
}
