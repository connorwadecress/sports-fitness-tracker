import { timingSafeEqual } from "node:crypto";
import { db, dbConfigured } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { pushConfigured, sendToUser } from "@/lib/server/push";
import { snapshotFromRows, type RecordRow } from "@/lib/server/snapshot";
import { nowIn } from "@/lib/domain/dates";
import { MAX_PUSH_PER_DAY } from "@/lib/domain/constants";
import { dueReminders, inQuietHours } from "@/lib/domain/reminders";

// Called every 10 minutes by a GitHub Actions schedule (Vercel Hobby crons
// only run daily). Sends each due reminder once, at most 3 a day, never in
// quiet hours.

const LOOKBACK_MIN = 90;

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

export async function GET(req: Request) {
  if (!authorised(req)) return json({ error: "Unauthorised" }, 401);
  if (!dbConfigured() || !pushConfigured()) return json({ skipped: "not configured" });

  const q = await db();
  const users = (await q.query("select distinct user_id from push_subscriptions")) as { user_id: string }[];
  const report: { user: string; sent: string[] }[] = [];

  for (const { user_id } of users) {
    const rows = (await q.query("select collection, data from records where user_id = $1 and not deleted", [user_id])) as RecordRow[];
    const snap = snapshotFromRows(rows);
    const now = nowIn(snap.settings.timeZone);
    if (inQuietHours(now.time)) continue;

    const due = dueReminders(snap, now, LOOKBACK_MIN);
    if (!due.length) continue;
    const sentRows = (await q.query("select key, local_date from notifications_sent where user_id = $1 and (local_date = $2 or key = any($3))", [user_id, now.date, due.map((d) => d.key)])) as { key: string; local_date: string }[];
    const already = new Set(sentRows.map((r) => r.key));
    let sentToday = sentRows.filter((r) => r.local_date === now.date).length;
    const sent: string[] = [];

    for (const r of due) {
      if (sentToday >= MAX_PUSH_PER_DAY) break;
      if (already.has(r.key)) continue;
      // Claim the key first so an overlapping run can't double-send.
      const claimed = (await q.query("insert into notifications_sent (user_id, key, local_date) values ($1, $2, $3) on conflict do nothing returning key", [user_id, r.key, now.date])) as unknown[];
      if (!claimed.length) continue;
      await sendToUser(user_id, { title: r.title, body: r.body, url: r.url, tag: r.kind });
      sentToday++;
      sent.push(r.key);
    }
    if (sent.length) report.push({ user: user_id.slice(0, 8), sent });
  }

  await q.query("delete from notifications_sent where sent_at < now() - interval '30 days'");
  return json({ ok: true, users: users.length, report });
}
