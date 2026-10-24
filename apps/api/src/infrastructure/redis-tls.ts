import { readFileSync } from "node:fs";

export function redisTlsOptions(caCertificatePath?: string) {
  return redisTlsOptionsFromConfig(caCertificatePath);
}

export function redisTlsOptionsFromConfig(
  caCertificatePath?: string,
  caCertificateBase64?: string,
) {
  const certificate = caCertificateBase64
    ? Buffer.from(caCertificateBase64, "base64")
    : caCertificatePath
      ? readFileSync(caCertificatePath)
      : undefined;
  if (!certificate?.length) return undefined;

  return {
    ca: certificate,
    rejectUnauthorized: true,
  };
}
