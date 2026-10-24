import dotenv from "dotenv";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

dotenv.config({ path: resolve(import.meta.dirname, "../../../.env") });

const email = (process.env.SABI_DEMO_EMAIL ?? "demo.pregnant@sabi.health")
  .trim()
  .toLowerCase();
const password = process.env.SABI_DEMO_PASSWORD ?? "SabiDemo2026!";
if (password.length < 12) {
  throw new Error("SABI_DEMO_PASSWORD must be at least 12 characters.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the judge demo account.");
}

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
url.searchParams.delete("sslrootcert");
url.searchParams.delete("sslaccept");
let ca;
if (process.env.RUMPTY_POSTGRES_CA_BASE64) {
  ca = Buffer.from(process.env.RUMPTY_POSTGRES_CA_BASE64, "base64");
} else if (process.env.RUMPTY_POSTGRES_CA_CERT) {
  const certPath = resolve(process.env.RUMPTY_POSTGRES_CA_CERT);
  if (!existsSync(certPath)) {
    throw new Error("RUMPTY_POSTGRES_CA_CERT points to a missing certificate.");
  }
  ca = readFileSync(certPath);
}

const { Client } = pg;
const client = new Client({
  connectionString: url.toString(),
  ssl: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
});

function hashPassword(value) {
  const salt = randomBytes(16);
  const hash = scryptSync(value, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function dateOffset(days) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function seed() {
  await client.connect();
  await client.query("BEGIN");
  try {
    const userResult = await client.query(
      `INSERT INTO users (id, email, display_name, password_hash, role)
       VALUES ($1, $2, 'Sabi Judge Demo', $3, 'PREGNANT_PERSON')
       ON CONFLICT (email) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           password_hash = EXCLUDED.password_hash,
           role = 'PREGNANT_PERSON'
       RETURNING id`,
      [randomUUID(), email, hashPassword(password)],
    );
    const userId = userResult.rows[0].id;
    const dueDate = dateOffset(84);
    const lmp = dateOffset(-196);
    await client.query(
      `INSERT INTO pregnancies (id, user_id, due_date, last_menstrual_period, next_visit_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET due_date = EXCLUDED.due_date,
           last_menstrual_period = EXCLUDED.last_menstrual_period,
           next_visit_date = EXCLUDED.next_visit_date`,
      [randomUUID(), userId, dueDate, lmp, dateOffset(7)],
    );

    const checkIns = await client.query(
      "SELECT count(*)::int AS count FROM check_ins WHERE user_id = $1",
      [userId],
    );
    if (checkIns.rows[0].count === 0) {
      for (const [daysAgo, mood, note] of [
        [3, "good", "Synthetic demo check-in; no symptoms reported."],
        [1, "calm", "Synthetic demo check-in; sample data for judges."],
      ]) {
        await client.query(
          `INSERT INTO check_ins (id, user_id, mood, symptoms, note, created_at)
           VALUES ($1, $2, $3, '{}'::text[], $4, now() - ($5 * interval '1 day'))`,
          [randomUUID(), userId, mood, note, daysAgo],
        );
      }
    }

    const meals = await client.query(
      "SELECT count(*)::int AS count FROM meal_logs WHERE user_id = $1",
      [userId],
    );
    if (meals.rows[0].count === 0) {
      const samples = [
        [
          "Oats with banana",
          "Breakfast",
          220,
          "Sample meal log; nutrient values not estimated.",
        ],
        [
          "Beans, rice and vegetables",
          "Lunch",
          380,
          "Sample meal log; nutrient values not estimated.",
        ],
      ];
      for (const [foodName, mealType, grams, note] of samples) {
        await client.query(
          `INSERT INTO meal_logs
             (id, user_id, food_name, meal_type, serving_grams, nutrients, note)
           VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6)`,
          [randomUUID(), userId, foodName, mealType, grams, note],
        );
      }
    }

    const plans = await client.query(
      "SELECT count(*)::int AS count FROM meal_plan_entries WHERE user_id = $1",
      [userId],
    );
    if (plans.rows[0].count === 0) {
      const examples = [
        [0, "Breakfast", "Oats with fruit"],
        [0, "Lunch", "Rice, beans and vegetables"],
        [0, "Dinner", "Yam with vegetable soup"],
        [1, "Breakfast", "Moi moi with fruit"],
        [1, "Lunch", "Jollof rice with beans"],
        [1, "Dinner", "Eba with okra soup"],
        [2, "Breakfast", "Pap with moi moi"],
        [2, "Lunch", "Boiled plantain with beans"],
        [2, "Dinner", "Rice with vegetable stew"],
      ];
      for (const [dayOffset, mealType, dishName] of examples) {
        await client.query(
          `INSERT INTO meal_plan_entries (id, user_id, plan_date, meal_type, dish_name, note)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            userId,
            dateOffset(Number(dayOffset)),
            mealType,
            dishName,
            "Synthetic demo meal idea; adjust to personal needs with a qualified health worker.",
          ],
        );
      }
    }

    const groceries = await client.query(
      "SELECT count(*)::int AS count FROM grocery_items WHERE user_id = $1",
      [userId],
    );
    if (groceries.rows[0].count === 0) {
      for (const [name, quantity] of [
        ["Oats", "1 pack"],
        ["Beans", "1 bag"],
        ["Banana", "6 pieces"],
        ["Vegetables", "1 bunch"],
      ]) {
        await client.query(
          `INSERT INTO grocery_items (id, user_id, name, quantity)
           VALUES ($1, $2, $3, $4)`,
          [randomUUID(), userId, name, quantity],
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Seeded the synthetic judge account: ${email}`);
    console.log(
      "Synthetic check-ins, meal examples, a pregnancy record, and groceries are ready.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

await seed();
