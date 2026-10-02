import { db } from "@/lib/server/db";
import { destroySession } from "@/lib/server/auth";
import { json, requireUser } from "@/lib/server/http";

/** Delete the account and every record, session and push subscription with it. */
export async function DELETE(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  const q = await db();
  await q.query("delete from users where id = $1", [user.id]);
  await destroySession();
  return json({ ok: true });
}
