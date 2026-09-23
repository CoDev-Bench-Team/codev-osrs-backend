import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequestRejectionReason1790203612324 implements MigrationInterface {
  name = 'RequestRejectionReason1790203612324';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "rejectionReason" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN "rejectionReason"`,
    );
  }
}
