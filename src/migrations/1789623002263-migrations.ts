import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1789623002263 implements MigrationInterface {
    name = 'Migrations1789623002263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."asset_type_enum" AS ENUM('Laptop', 'Headset', 'Monitor', 'Phone', 'UPS', 'Mice', 'Wifi', 'Type C Hub', 'Other Devices')`);
        await queryRunner.query(`CREATE TYPE "public"."asset_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Pasig', 'Davao')`);
        await queryRunner.query(`CREATE TABLE "asset" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "type" "public"."asset_type_enum" NOT NULL, "name" character varying(255) NOT NULL, "model" character varying(255), "location" "public"."asset_location_enum" NOT NULL, "lowQtyAlert" integer NOT NULL, "imageUrl" character varying(2048), "specs" jsonb DEFAULT '[]', "createdById" integer, "updatedById" integer, "deletedById" integer, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_37ac8e73568722867e6a1f8346" ON "asset"  ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9364836153cfd8e6f1981951e" ON "asset"  ("location") `);
        await queryRunner.query(`CREATE TYPE "public"."asset_inventory_status_enum" AS ENUM('Available', 'Reserved', 'Assigned')`);
        await queryRunner.query(`CREATE TABLE "asset_inventory" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "assetCode" character varying NOT NULL, "assignedAt" TIMESTAMP, "status" "public"."asset_inventory_status_enum" NOT NULL, "createdById" integer, "updatedById" integer, "deletedById" integer, "assignedToId" integer, "assetId" integer, CONSTRAINT "PK_891962d9ab0269bdb51433ceb47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_434a58091b9adf1b3530b394c4" ON "asset_inventory"  ("assignedToId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ec6194bf86a2ab9afdf0f6c42" ON "asset_inventory"  ("assetId", "status") `);
        await queryRunner.query(`ALTER TABLE "asset" ADD CONSTRAINT "FK_241dade2fac8b388e19dc83f162" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset" ADD CONSTRAINT "FK_518df40f251c7cd55c564a681ce" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset" ADD CONSTRAINT "FK_e70df6b067e803c453e8c751b01" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" ADD CONSTRAINT "FK_5bcfb4590e73b9b880f89e89d4b" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" ADD CONSTRAINT "FK_3df6aa7a6fedd9b91813551d137" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" ADD CONSTRAINT "FK_6e893b13106ed67b651d0d7bea2" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" ADD CONSTRAINT "FK_434a58091b9adf1b3530b394c48" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" ADD CONSTRAINT "FK_52f4e25f253dac8ae3b9290c6b5" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_inventory" DROP CONSTRAINT "FK_52f4e25f253dac8ae3b9290c6b5"`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" DROP CONSTRAINT "FK_434a58091b9adf1b3530b394c48"`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" DROP CONSTRAINT "FK_6e893b13106ed67b651d0d7bea2"`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" DROP CONSTRAINT "FK_3df6aa7a6fedd9b91813551d137"`);
        await queryRunner.query(`ALTER TABLE "asset_inventory" DROP CONSTRAINT "FK_5bcfb4590e73b9b880f89e89d4b"`);
        await queryRunner.query(`ALTER TABLE "asset" DROP CONSTRAINT "FK_e70df6b067e803c453e8c751b01"`);
        await queryRunner.query(`ALTER TABLE "asset" DROP CONSTRAINT "FK_518df40f251c7cd55c564a681ce"`);
        await queryRunner.query(`ALTER TABLE "asset" DROP CONSTRAINT "FK_241dade2fac8b388e19dc83f162"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ec6194bf86a2ab9afdf0f6c42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_434a58091b9adf1b3530b394c4"`);
        await queryRunner.query(`DROP TABLE "asset_inventory"`);
        await queryRunner.query(`DROP TYPE "public"."asset_inventory_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9364836153cfd8e6f1981951e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37ac8e73568722867e6a1f8346"`);
        await queryRunner.query(`DROP TABLE "asset"`);
        await queryRunner.query(`DROP TYPE "public"."asset_location_enum"`);
        await queryRunner.query(`DROP TYPE "public"."asset_type_enum"`);
    }

}
