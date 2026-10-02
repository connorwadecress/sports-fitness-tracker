import { destroySession } from "@/lib/server/auth";
import { guard, json } from "@/lib/server/http";

export async function POST(req: Request) {
  const bad = guard(req);
  if (bad) return bad;
  const endpoint = (await req.json().catch(() => null))?.endpoint;
  if (typeof endpoint === "string") {
    const { db } = await import("@/lib/server/db");
    await (await db()).query("delete from push_subscriptions where endpoint = $1", [endpoint]);
  }
  await destroySession();
  return json({ ok: true });
}
