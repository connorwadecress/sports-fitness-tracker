import { z } from "zod";
import { db } from "@/lib/server/db";
import { createSession, hashPassword, normaliseEmail } from "@/lib/server/auth";
import { guard, json } from "@/lib/server/http";

const Body = z.object({
  email: z.email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(60).optional(),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  const bad = guard(req);
  if (bad) return bad;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const msg = field === "email" ? "Enter a valid email address." : field === "password" ? "Use at least 8 characters for your password." : field === "consent" ? "Please confirm consent to continue." : "Check the form and try again.";
    return json({ error: msg }, 400);
  }
  const { password, name } = parsed.data;
  const email = normaliseEmail(parsed.data.email);
  const q = await db();
  const hash = await hashPassword(password);
  const rows = (await q.query(
    "insert into users (email, password_hash, name, consent_at) values ($1, $2, $3, now()) on conflict (email) do nothing returning id, email, name",
    [email, hash, name || null],
  )) as { id: string; email: string; name: string | null }[];
  if (!rows[0]) return json({ error: "There's already an account with that email. Sign in instead." }, 409);
  await createSession(rows[0].id);
  return json({ user: { email: rows[0].email, name: rows[0].name } });
}
