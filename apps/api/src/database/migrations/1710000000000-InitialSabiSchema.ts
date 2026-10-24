import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSabiSchema1710000000000 implements MigrationInterface {
  name = "InitialSabiSchema1710000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email varchar(320) NOT NULL UNIQUE,
        display_name varchar(120) NOT NULL,
        password_hash varchar(200) NOT NULL,
        role varchar(24) NOT NULL DEFAULT 'PREGNANT_PERSON'
          CHECK (role IN ('PREGNANT_PERSON', 'MIDWIFE', 'ADMIN')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE pregnancies (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        due_date date NOT NULL,
        last_menstrual_period date,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE check_ins (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mood varchar(20) NOT NULL,
        symptoms text[] NOT NULL DEFAULT '{}',
        note varchar(1000),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX check_ins_user_created_idx ON check_ins(user_id, created_at DESC)`,
    );
    await queryRunner.query(`
      CREATE TABLE care_links (
        id uuid PRIMARY KEY,
        patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        midwife_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (patient_id, midwife_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE meal_logs (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_name varchar(160) NOT NULL,
        meal_type varchar(20) NOT NULL,
        serving_grams numeric(8,2),
        nutrients jsonb NOT NULL DEFAULT '{}'::jsonb,
        source varchar(240),
        note varchar(120),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX meal_logs_user_created_idx ON meal_logs(user_id, created_at DESC)`,
    );
    await queryRunner.query(`
      CREATE TABLE meal_plan_entries (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_date date NOT NULL,
        meal_type varchar(20) NOT NULL,
        dish_name varchar(160) NOT NULL,
        note varchar(500),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX meal_plan_user_date_idx ON meal_plan_entries(user_id, plan_date)`,
    );
    await queryRunner.query(`
      CREATE TABLE grocery_items (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(160) NOT NULL,
        quantity varchar(80),
        checked boolean NOT NULL DEFAULT false,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE push_subscriptions (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint text NOT NULL,
        keys text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, endpoint)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS push_subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS grocery_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS meal_plan_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS meal_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS care_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS check_ins`);
    await queryRunner.query(`DROP TABLE IF EXISTS pregnancies`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
