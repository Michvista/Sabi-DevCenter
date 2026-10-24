import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAntenatalVisitDate1720000000000 implements MigrationInterface {
  name = "AddAntenatalVisitDate1720000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE pregnancies ADD COLUMN next_visit_date date`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE pregnancies DROP COLUMN IF EXISTS next_visit_date`,
    );
  }
}
