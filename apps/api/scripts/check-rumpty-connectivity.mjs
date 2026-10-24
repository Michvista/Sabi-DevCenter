import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import Redis from "ioredis";

dotenv.config({ path: resolve(import.meta.dirname, "../../../.env") });
const { Client } = pg;

function caFromEnv(pathKey, base64Key) {
  if (process.env[base64Key])
    return Buffer.from(process.env[base64Key], "base64");
  const path = process.env[pathKey];
  if (!path) return undefined;
  const absolute = resolve(path);
  return existsSync(absolute) ? readFileSync(absolute) : undefined;
}

async function checkPostgres() {
  if (!process.env.DATABASE_URL) return "PostgreSQL: not configured";
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslaccept");
  const ca = caFromEnv("RUMPTY_POSTGRES_CA_CERT", "RUMPTY_POSTGRES_CA_BASE64");
  const client = new Client({
    connectionString: url.toString(),
    ssl: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
    connectionTimeoutMillis: 6000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return "PostgreSQL: connected with TLS verification";
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "connection error";
    return `PostgreSQL: unavailable (${code})`;
  } finally {
    await client.end().catch(() => {});
  }
}

async function checkRedis() {
  if (!process.env.RUMPTY_REDIS_URL) return "Redis: not configured";
  const ca = caFromEnv("RUMPTY_REDIS_CA_CERT", "RUMPTY_REDIS_CA_BASE64");
  const client = new Redis(process.env.RUMPTY_REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 6000,
    maxRetriesPerRequest: 1,
    tls: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
  });
  try {
    await client.connect();
    await client.ping();
    return "Redis: connected with TLS verification";
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "connection error";
    return `Redis: unavailable (${code})`;
  } finally {
    client.disconnect();
  }
}

console.log(await checkPostgres());
console.log(await checkRedis());
