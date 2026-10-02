import "server-only";
import webpush from "web-push";
import { db } from "./db";

export const pushConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function setup() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

export interface PushPayload { title: string; body: string; url: string; tag: string }

/** Send to every device for a user. Returns how many deliveries succeeded. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  setup();
  const q = await db();
  const subs = (await q.query("select endpoint, keys from push_subscriptions where user_id = $1", [userId])) as { endpoint: string; keys: { p256dh: string; auth: string } }[];
  let ok = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 4, urgency: "normal" });
      ok++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await q.query("delete from push_subscriptions where endpoint = $1", [s.endpoint]);
    }
  }));
  return ok;
}
