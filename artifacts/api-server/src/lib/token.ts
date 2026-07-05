import { createHmac } from "crypto";

const envSecret = process.env["SESSION_SECRET"];
if (!envSecret && process.env["NODE_ENV"] === "production") {
  console.error("FATAL: SESSION_SECRET environment variable is not set. Exiting.");
  process.exit(1);
}
if (!envSecret) {
  console.warn("WARNING: SESSION_SECRET is not set. Using insecure default (development only).");
}
const SECRET = envSecret || "garage-default-secret-change-me-do-not-use-in-production";

export function signToken(userId: number): string {
  const payload = String(userId);
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  // Constant-time comparison to prevent timing attacks
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return null;
  const userId = parseInt(payload, 10);
  if (isNaN(userId) || userId <= 0) return null;
  return userId;
}
