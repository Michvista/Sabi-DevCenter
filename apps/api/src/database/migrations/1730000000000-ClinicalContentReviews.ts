import type { MigrationInterface, QueryRunner } from "typeorm";

export class ClinicalContentReviews1730000000000 implements MigrationInterface {
  name = "ClinicalContentReviews1730000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE clinical_content_reviews (
        id uuid PRIMARY KEY,
        week integer NOT NULL CHECK (week BETWEEN 1 AND 42),
        reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status varchar(24) NOT NULL CHECK (status IN ('APPROVED', 'CHANGES_REQUESTED')),
        notes varchar(2000),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_clinical_reviews_week_created ON clinical_content_reviews (week, created_at DESC)`,
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE clinical_content_reviews`);
  }
}
