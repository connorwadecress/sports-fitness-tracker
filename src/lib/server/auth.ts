import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "./db";

// Email and password sign-in. Passwords are hashed with scrypt; sessions are
// random tokens stored hashed, carried in an httpOnly cookie.

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "ps_session";
const SESSION_DAYS = 180;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, s, h] = stored.split("$");
  if (algo !== "scrypt" || !s || !h) return false;
  const expected = Buffer.from(h, "base64");
  const actual = await scrypt(pw, Buffer.from(s, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const q = await db();
  await q.query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [sha(token), userId, expires.toISOString()]);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}

export interface SessionUser { id: string; email: string; name: string | null }

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const q = await db();
  const rows = (await q.query(
    "select u.id, u.email, u.name from sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()",
    [sha(token)],
  )) as SessionUser[];
  return rows[0] ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const q = await db();
    await q.query("delete from sessions where token_hash = $1", [sha(token)]);
  }
  jar.delete(COOKIE);
}

/** Reject cross-site form posts: state-changing requests must come from our own origin. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("x-forwarded-host");
  } catch {
    return false;
  }
}

/** 10 failed attempts per email per 15 minutes. */
export async function tooManyAttempts(email: string): Promise<boolean> {
  const q = await db();
  const rows = (await q.query("select count(*)::int as n from login_attempts where email = $1 and at > now() - interval '15 minutes'", [email])) as { n: number }[];
  return (rows[0]?.n ?? 0) >= 10;
}

export async function recordFailedAttempt(email: string) {
  const q = await db();
  await q.query("insert into login_attempts (email) values ($1)", [email]);
  await q.query("delete from login_attempts where at < now() - interval '1 day'");
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();
