import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "deadegos_admin_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `admin:${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const expected = sign(payload);

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;
  } catch {
    return false;
  }

  const [, expiresStr] = payload.split(":");
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return false;

  return payload.startsWith("admin:");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export { SESSION_COOKIE };

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "200Orders!";
  return password === expected;
}
