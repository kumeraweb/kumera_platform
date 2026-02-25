import { createCipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getLeadosSecretKey(): Buffer {
  const secret = process.env.LEADOS_SECRETS_KEY;
  if (!secret) {
    throw new Error("Missing LEADOS_SECRETS_KEY");
  }

  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error("LEADOS_SECRETS_KEY must be base64 for 32 raw bytes");
  }

  return key;
}

export function encryptLeadosSecret(plainText: string): string {
  const iv = randomBytes(12);
  const key = getLeadosSecretKey();
  const cipher = createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}
