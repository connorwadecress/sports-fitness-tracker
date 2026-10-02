import { z } from "zod";
import { db } from "@/lib/server/db";
import { json, requireUser } from "@/lib/server/http";
import { pushConfigured, sendToUser } from "@/lib/server/push";

const Sub = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(200) }),
});

export async function GET() {
  return json({ publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null });
}

/** Save this device's push subscription. `?test=1` also sends a test notification. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  const parsed = Sub.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad subscription" }, 400);
  const q = await db();
  await q.query(
    "insert into push_subscriptions (endpoint, user_id, keys) values ($1, $2, $3) on conflict (endpoint) do update set user_id = excluded.user_id, keys = excluded.keys",
    [parsed.data.endpoint, user.id, JSON.stringify(parsed.data.keys)],
  );
  if (new URL(req.url).searchParams.get("test")) {
    await sendToUser(user.id, { title: "Notifications are on", body: "You'll get reminders for events, rehab and your daily summary.", url: "#today", tag: "test" });
  }
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  const endpoint = (await req.json().catch(() => null))?.endpoint;
  if (typeof endpoint !== "string") return json({ error: "Missing endpoint" }, 400);
  const q = await db();
  await q.query("delete from push_subscriptions where endpoint = $1 and user_id = $2", [endpoint, user.id]);
  return json({ ok: true });
}
