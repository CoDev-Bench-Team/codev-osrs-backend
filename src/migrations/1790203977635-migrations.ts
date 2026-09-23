import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1790203977635 implements MigrationInterface {
    name = 'Migrations1790203977635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_56647aa3c21954f7c7fcbc2505"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_33264f29cb900098cf1b047dc3"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."assets_type_enum"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TYPE "public"."assets_location_enum"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "specs"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "assetCode"`);
        await queryRunner.query(`CREATE TYPE "public"."assets_category_enum" AS ENUM('Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices')`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "category" "public"."assets_category_enum" NOT NULL DEFAULT 'Other Devices'`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "ram" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "processor" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "graphics" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "operatingSystem" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "storage" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "serialNumber" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "bitLockerIdentifier" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "recoveryPin" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "attachmentUrl" character varying(2048)`);
        await queryRunner.query(`CREATE TYPE "public"."asset_inventories_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao')`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "location" "public"."asset_inventories_location_enum" NOT NULL DEFAULT 'Cebu'`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "price" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "supplier" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "purchasedAt" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c5be41f98a3a9c83fdc0e348d"`);
        await queryRunner.query(`ALTER TYPE "public"."asset_inventories_status_enum" ADD VALUE 'Inactive'`);
        await queryRunner.query(`CREATE INDEX "IDX_assets_category" ON "assets"  ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_216dadb1cc8a296299498c9f84" ON "asset_inventories"  ("location") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_asset_inventories_serialNumber" ON "asset_inventories"  ("serialNumber") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_3c5be41f98a3a9c83fdc0e348d" ON "asset_inventories"  ("assetId", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3c5be41f98a3a9c83fdc0e348d"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_asset_inventories_serialNumber"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_216dadb1cc8a296299498c9f84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assets_category"`);
        await queryRunner.query(`CREATE TYPE "public"."asset_inventories_status_enum_old" AS ENUM('Available', 'Reserved', 'Assigned')`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ALTER COLUMN "status" TYPE "public"."asset_inventories_status_enum_old" USING "status"::"text"::"public"."asset_inventories_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."asset_inventories_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."asset_inventories_status_enum_old" RENAME TO "asset_inventories_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_3c5be41f98a3a9c83fdc0e348d" ON "asset_inventories" USING btree ("assetId", "status") `);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "purchasedAt"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "supplier"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TYPE "public"."asset_inventories_location_enum"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "attachmentUrl"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "recoveryPin"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "bitLockerIdentifier"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "serialNumber"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "storage"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "operatingSystem"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "graphics"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "processor"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "ram"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."assets_category_enum"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "assetCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "specs" jsonb DEFAULT '[]'`);
        await queryRunner.query(`CREATE TYPE "public"."assets_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Pasig', 'Davao')`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "location" "public"."assets_location_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."assets_type_enum" AS ENUM('Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices')`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "type" "public"."assets_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_33264f29cb900098cf1b047dc3" ON "assets" USING btree ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_56647aa3c21954f7c7fcbc2505" ON "assets" USING btree ("type") `);
    }

}
