import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1789793782437 implements MigrationInterface {
    name = 'Migrations1789793782437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."asset_inventories_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Ortigas', 'Davao')`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "location" "public"."asset_inventories_location_enum" NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_9ca7bcd0a8b1f6e6a8e2c1f4b6" ON "asset_inventories"  ("location") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_33264f29cb900098cf1b047dc3"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TYPE "public"."assets_location_enum"`);
        await queryRunner.query(`UPDATE "users" SET "location" = 'Ortigas' WHERE "location" = 'Pasig'`);

        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "specs"`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "ram" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "processor" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "graphics" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "operatingSystem" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "storage" character varying(255)`);

        await queryRunner.query(`ALTER TABLE "assets" ADD "serialNumber" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "bitLockerIdentifier" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "recoveryPin" character varying(255)`);

        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "price" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "supplier" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD "purchasedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "purchasedAt"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "supplier"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "price"`);

        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "recoveryPin"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "bitLockerIdentifier"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "serialNumber"`);

        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "storage"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "operatingSystem"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "graphics"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "processor"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "ram"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "specs" jsonb DEFAULT '[]'`);

        await queryRunner.query(`UPDATE "users" SET "location" = 'Pasig' WHERE "location" = 'Ortigas'`);
        await queryRunner.query(`CREATE TYPE "public"."assets_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Pasig', 'Davao')`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "location" "public"."assets_location_enum" NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_33264f29cb900098cf1b047dc3" ON "assets"  ("location") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ca7bcd0a8b1f6e6a8e2c1f4b6"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TYPE "public"."asset_inventories_location_enum"`);
    }

}
