import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCareMessagesTable1750000000000 implements MigrationInterface {
  name = "AddCareMessagesTable1750000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS care_messages (
        id uuid PRIMARY KEY,
        patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        midwife_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role varchar(24) NOT NULL CHECK (sender_role IN ('PREGNANT_PERSON', 'MIDWIFE')),
        content text NOT NULL,
        read boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS care_messages_link_idx ON care_messages(patient_id, midwife_id, created_at ASC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS care_messages`);
  }
}
