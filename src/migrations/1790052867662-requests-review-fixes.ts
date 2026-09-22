import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequestsReviewFixes1790052867662 implements MigrationInterface {
  name = 'RequestsReviewFixes1790052867662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "request_assets" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "requestId" integer, "assetId" integer, CONSTRAINT "PK_91798a7bff1188693bbf6c83abe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "requests" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "displayId" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending_approval', "purpose" character varying(500), "timeline" jsonb NOT NULL DEFAULT '[]', "createdById" integer, "updatedById" integer, "deletedById" integer, "requestorId" integer, "approvedById" integer, CONSTRAINT "UQ_b8db731743f529e907365b2ef90" UNIQUE ("displayId"), CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59b85be6a3c16cbf27f8bdda1d" ON "requests"  ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_assets" ADD CONSTRAINT "FK_268256ec21e96e7360381b7f8c9" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_assets" ADD CONSTRAINT "FK_781f6f7b1a31fee97a2c48dcd57" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_520f91e9ed442d28fa8c1f687f2" FOREIGN KEY ("requestorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_520f91e9ed442d28fa8c1f687f2"`,
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
      `ALTER TABLE "request_assets" DROP CONSTRAINT "FK_781f6f7b1a31fee97a2c48dcd57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_assets" DROP CONSTRAINT "FK_268256ec21e96e7360381b7f8c9"`,
    );
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isActive"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59b85be6a3c16cbf27f8bdda1d"`,
    );
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TABLE "request_assets"`);
  }
}
