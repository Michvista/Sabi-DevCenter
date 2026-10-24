import dotenv from "dotenv";
import { resolve } from "node:path";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { createPostgresOptions } from "./postgres-options";

dotenv.config({ path: resolve(__dirname, "../../../../.env") });
const options = createPostgresOptions();
if (!options)
  throw new Error("DATABASE_URL is required to run database migrations.");
export default new DataSource(options as never);
