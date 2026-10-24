import type { MigrationInterface, QueryRunner } from "typeorm";

export class PregnancyBookChunks1740000000000 implements MigrationInterface {
  name = "PregnancyBookChunks1740000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE pregnancy_book_chunks (
        week integer PRIMARY KEY CHECK (week BETWEEN 1 AND 40),
        page integer NOT NULL,
        content text NOT NULL,
        embedding jsonb NOT NULL,
        model varchar(100) NOT NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE pregnancy_book_chunks`);
  }
}
