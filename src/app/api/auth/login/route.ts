import { z } from "zod";
import { db } from "@/lib/server/db";
import { createSession, normaliseEmail, recordFailedAttempt, tooManyAttempts, verifyPassword } from "@/lib/server/auth";
import { guard, json } from "@/lib/server/http";

const Body = z.object({ email: z.string().max(200), password: z.string().max(200) });

export async function POST(req: Request) {
  const bad = guard(req);
  if (bad) return bad;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Enter your email and password." }, 400);
  const email = normaliseEmail(parsed.data.email);
  if (await tooManyAttempts(email)) return json({ error: "Too many attempts. Wait 15 minutes and try again." }, 429);

  const q = await db();
  const rows = (await q.query("select id, email, name, password_hash from users where email = $1", [email])) as
    { id: string; email: string; name: string | null; password_hash: string }[];
  const user = rows[0];
  const ok = user ? await verifyPassword(parsed.data.password, user.password_hash) : false;
  if (!user || !ok) {
    await recordFailedAttempt(email);
    return json({ error: "That email and password don't match." }, 401);
  }
  await createSession(user.id);
  return json({ user: { email: user.email, name: user.name } });
}
