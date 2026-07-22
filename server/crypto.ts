import crypto from "crypto";

/**
 * AES-256-GCM encryption for user API keys at rest.
 * Uses ENCRYPTION_KEY env var (32-byte hex string).
 * In dev, derives from JWT_SECRET if ENCRYPTION_KEY not set.
 */

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    // Accept hex or raw string; must be 32 bytes
    if (/^[0-9a-f]{64}$/i.test(key)) {
      return Buffer.from(key, "hex");
    }
    if (key.length === 32) {
      return Buffer.from(key, "utf-8");
    }
  }

  // Dev fallback: derive from JWT_SECRET
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY must be set in production (32-byte hex string)");
  }

  const fallback = process.env.JWT_SECRET || "dev-secret-change-in-production";
  return crypto.createHash("sha256").update(fallback).digest();
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length

/**
 * Encrypt a plaintext string. Returns a base64 string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: iv(12) + authTag(16) + ciphertext, base64-encoded
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt an encrypted string back to plaintext.
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(encryptedData, "base64");

  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buf.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

/**
 * Mask an API key for display (e.g., "AIzaSy...x7f2")
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
