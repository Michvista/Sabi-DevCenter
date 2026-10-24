import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { PregnancyEntity } from "./entities/pregnancy.entity";
import { CheckInEntity } from "./entities/check-in.entity";
import { CareLinkEntity } from "./entities/care-link.entity";
import { MealLogEntity } from "./entities/meal-log.entity";
import { MealPlanEntity } from "./entities/meal-plan.entity";
import { GroceryItemEntity } from "./entities/grocery-item.entity";
import { PushSubscriptionEntity } from "./entities/push-subscription.entity";
import { ClinicalContentReviewEntity } from "./entities/clinical-content-review.entity";
import { PregnancyBookChunkEntity } from "./entities/pregnancy-book-chunk.entity";

export function createPostgresOptions(env = process.env) {
  if (!env.DATABASE_URL) return null;

  const url = new URL(env.DATABASE_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslaccept");

  let ca: Buffer | undefined;
  if (env.RUMPTY_POSTGRES_CA_BASE64) {
    ca = Buffer.from(env.RUMPTY_POSTGRES_CA_BASE64, "base64");
    if (!ca.length) throw new Error("The Postgres CA certificate is empty.");
  } else if (env.RUMPTY_POSTGRES_CA_CERT) {
    const path = resolve(env.RUMPTY_POSTGRES_CA_CERT);
    if (!existsSync(path))
      throw new Error("The Postgres CA certificate file was not found.");
    ca = readFileSync(path);
  }

  const options: TypeOrmModuleOptions = {
    type: "postgres",
    url: url.toString(),
    ssl: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
    entities: [
      UserEntity,
      PregnancyEntity,
      CheckInEntity,
      CareLinkEntity,
      MealLogEntity,
      MealPlanEntity,
      GroceryItemEntity,
      PushSubscriptionEntity,
      ClinicalContentReviewEntity,
      PregnancyBookChunkEntity,
    ],
    synchronize: false,
    migrationsRun: true,
    migrations: [resolve(__dirname, "migrations/*.{js,ts}")],
  };
  return options;
}
