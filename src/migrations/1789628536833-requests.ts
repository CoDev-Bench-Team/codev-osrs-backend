import { MigrationInterface, QueryRunner } from 'typeorm';

export class Requests1789628536833 implements MigrationInterface {
  name = 'Requests1789628536833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_location_enum" AS ENUM('Cebu', 'Bacolod', 'Makati', 'Pasig', 'Davao')`,
    );
    await queryRunner.query(
      `CREATE TABLE "requests" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "displayId" character varying(20) NOT NULL, "items" jsonb NOT NULL DEFAULT '[]', "status" character varying(20) NOT NULL DEFAULT 'pending_approval', "note" character varying(500), "location" "public"."requests_location_enum" NOT NULL, "timeline" jsonb NOT NULL DEFAULT '[]', "createdById" integer, "updatedById" integer, "deletedById" integer, "requesterId" integer, "approvedById" integer, CONSTRAINT "UQ_b8db731743f529e907365b2ef90" UNIQUE ("displayId"), CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59b85be6a3c16cbf27f8bdda1d" ON "requests"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ee5f1a71372fe91b670e812e0" ON "requests"  ("location") `,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_232f7e6af7107cb18d6e4f8f4f5" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_761d76ffbc40122ccada0f76f55" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_5ebb212dcbcf18fa826ab9f75d3" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_93dd6ea962d8a48df3f7448bdd5" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_93dd6ea962d8a48df3f7448bdd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_5ebb212dcbcf18fa826ab9f75d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_761d76ffbc40122ccada0f76f55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_232f7e6af7107cb18d6e4f8f4f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ee5f1a71372fe91b670e812e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59b85be6a3c16cbf27f8bdda1d"`,
    );
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TYPE "public"."requests_location_enum"`);
  }
}
