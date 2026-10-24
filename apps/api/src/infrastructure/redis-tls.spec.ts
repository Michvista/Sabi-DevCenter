import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { redisTlsOptionsFromConfig } from "./redis-tls";

describe("redisTlsOptions", () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true });
    temporaryDirectory = undefined;
  });

  it("loads the configured CA and keeps certificate verification enabled", () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "sabi-redis-ca-"));
    const certificate = "test certificate bytes";
    const certificatePath = join(temporaryDirectory, "rumpty-ca.crt");
    writeFileSync(certificatePath, certificate);

    const options = redisTlsOptionsFromConfig(certificatePath);

    expect(options?.ca.toString()).toBe(certificate);
    expect(options?.rejectUnauthorized).toBe(true);
  });

  it("leaves default TLS configuration to ioredis when no CA is supplied", () => {
    expect(redisTlsOptionsFromConfig()).toBeUndefined();
  });

  it("loads a base64 certificate for secret-injected deployments", () => {
    const certificate = "certificate stored as a deployment secret";
    const options = redisTlsOptionsFromConfig(
      undefined,
      Buffer.from(certificate).toString("base64"),
    );

    expect(options?.ca.toString()).toBe(certificate);
    expect(options?.rejectUnauthorized).toBe(true);
  });
});
