import { afterEach, describe, expect, it } from "vitest";
import { createPostgresOptions } from "../database/postgres-options";
import { RedisQueueService } from "./redis-queue.service";
import { ObjectStorageService } from "./object-storage.service";
import { RumptyInferenceService } from "./rumpty-inference.service";

const optionalKeys = [
  "DATABASE_URL",
  "RUMPTY_REDIS_URL",
  "RUMPTY_S3_BUCKET",
  "RUMPTY_S3_ENDPOINT",
  "RUMPTY_S3_REGION",
  "RUMPTY_S3_ACCESS_KEY_ID",
  "RUMPTY_S3_SECRET_ACCESS_KEY",
  "RUMPTY_INFERENCE_API_KEY",
  "RUMPTY_INFERENCE_BASE_URL",
];

function clearProviderEnvironment() {
  for (const key of optionalKeys) delete process.env[key];
}

describe("optional provider configuration", () => {
  afterEach(clearProviderEnvironment);

  it("lets the API boot without PostgreSQL and only configures a DB when a URL exists", async () => {
    clearProviderEnvironment();
    expect(createPostgresOptions()).toBeNull();
    const options = createPostgresOptions({
      DATABASE_URL:
        "postgresql://user:pass@localhost:5432/sabi?sslmode=require",
    });
    expect(options?.type).toBe("postgres");
    expect(options?.synchronize).toBe(false);
    expect(options?.ssl).toMatchObject({ rejectUnauthorized: true });
  });

  it("does not create a Redis queue when no URL is configured", async () => {
    clearProviderEnvironment();
    const queue = new RedisQueueService();
    expect(queue.configured).toBe(false);
    await queue.onModuleDestroy();
  });

  it("fails clearly when private object storage is not configured", async () => {
    clearProviderEnvironment();
    const storage = new ObjectStorageService();
    expect(storage.configured).toBe(false);
    await expect(
      storage.putPrivateObject(
        "reports/test.txt",
        new Uint8Array([1]),
        "text/plain",
      ),
    ).rejects.toThrow(/not configured/);
  });

  it("does not allow non-clinical inference before a key is configured", async () => {
    clearProviderEnvironment();
    const inference = new RumptyInferenceService();
    expect(inference.configured).toBe(false);
    await expect(
      inference.summarizeNonClinical("A demo paragraph."),
    ).rejects.toThrow(/not configured/);
  });
});
