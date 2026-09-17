import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1789623002263 implements MigrationInterface {
    name = 'Migrations1789623002263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assets_type_enum" AS ENUM('Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices')`);
        await queryRunner.query(`CREATE TYPE "public"."assets_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Pasig', 'Davao')`);
        await queryRunner.query(`CREATE TABLE "assets" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "type" "public"."assets_type_enum" NOT NULL, "name" character varying(255) NOT NULL, "model" character varying(255), "location" "public"."assets_location_enum" NOT NULL, "lowQtyAlert" integer NOT NULL, "imageBase64" text, "specs" jsonb DEFAULT '[]', "createdById" integer, "updatedById" integer, "deletedById" integer, CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_56647aa3c21954f7c7fcbc2505" ON "assets"  ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_33264f29cb900098cf1b047dc3" ON "assets"  ("location") `);
        await queryRunner.query(`CREATE TYPE "public"."asset_inventories_status_enum" AS ENUM('Available', 'Reserved', 'Assigned')`);
        await queryRunner.query(`CREATE TABLE "asset_inventories" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "assetCode" character varying NOT NULL, "assignedAt" TIMESTAMP, "status" "public"."asset_inventories_status_enum" NOT NULL, "createdById" integer, "updatedById" integer, "deletedById" integer, "assignedToId" integer, "assetId" integer, CONSTRAINT "PK_2e1eeb5842494ad225e2f5a8dde" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a5b97fc926a328b042ec3aa4c" ON "asset_inventories"  ("assignedToId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c5be41f98a3a9c83fdc0e348d" ON "asset_inventories"  ("assetId", "status") `);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_7d36e8428c8dd5052fdf319fb93" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_ff44d8078c6dd06006826f5f275" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_0d9a5cb0cca3c47c14b4ae6bcfb" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD CONSTRAINT "FK_22258577108ac46645fa0831d49" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD CONSTRAINT "FK_78fd78de18fb77b980ba35266fd" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD CONSTRAINT "FK_775bfeb02477e09e9d28c7508cb" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD CONSTRAINT "FK_5a5b97fc926a328b042ec3aa4c0" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" ADD CONSTRAINT "FK_0a5664bd90aaecdd7ffd1b28ec9" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP CONSTRAINT "FK_0a5664bd90aaecdd7ffd1b28ec9"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP CONSTRAINT "FK_5a5b97fc926a328b042ec3aa4c0"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP CONSTRAINT "FK_775bfeb02477e09e9d28c7508cb"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP CONSTRAINT "FK_78fd78de18fb77b980ba35266fd"`);
        await queryRunner.query(`ALTER TABLE "asset_inventories" DROP CONSTRAINT "FK_22258577108ac46645fa0831d49"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_0d9a5cb0cca3c47c14b4ae6bcfb"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_ff44d8078c6dd06006826f5f275"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_7d36e8428c8dd5052fdf319fb93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c5be41f98a3a9c83fdc0e348d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a5b97fc926a328b042ec3aa4c"`);
        await queryRunner.query(`DROP TABLE "asset_inventories"`);
        await queryRunner.query(`DROP TYPE "public"."asset_inventories_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_33264f29cb900098cf1b047dc3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56647aa3c21954f7c7fcbc2505"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(`DROP TYPE "public"."assets_location_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assets_type_enum"`);
    }

}
