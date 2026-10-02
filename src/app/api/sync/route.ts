import { z } from "zod";
import { db } from "@/lib/server/db";
import { json, requireUser } from "@/lib/server/http";
import { COLLECTIONS } from "@/lib/domain/types";

// Push local changes, pull everything newer than the client's cursor.
// Each upsert only wins if it is at least as new as what's stored.

const PAGE = 500;
const Body = z.object({
  cursor: z.number().int().min(0),
  changes: z.array(z.object({
    c: z.enum(COLLECTIONS as [string, ...string[]]),
    id: z.string().min(1).max(200),
    data: z.record(z.string(), z.unknown()),
    updatedAt: z.number(),
    deleted: z.boolean(),
  })).max(200),
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad sync payload" }, 400);
  const { cursor, changes } = parsed.data;
  const q = await db();

  if (changes.length) {
    const rows = changes.map((x) => ({ c: x.c, id: x.id, data: { ...x.data, id: x.id }, updated_at: Math.round(x.updatedAt), deleted: x.deleted }));
    await q.query(
      `insert into records (user_id, collection, id, data, updated_at, deleted)
       select $1, x.c, x.id, x.data, x.updated_at, x.deleted
       from jsonb_to_recordset($2::jsonb) as x(c text, id text, data jsonb, updated_at bigint, deleted boolean)
       on conflict (user_id, collection, id) do update
         set data = excluded.data, updated_at = excluded.updated_at, deleted = excluded.deleted, seq = nextval('record_seq')
         where records.updated_at <= excluded.updated_at`,
      [user.id, JSON.stringify(rows)],
    );
  }

  const out = (await q.query(
    "select collection as c, id, data, seq from records where user_id = $1 and seq > $2 order by seq limit $3",
    [user.id, cursor, PAGE + 1],
  )) as { c: string; id: string; data: unknown; seq: string }[];
  const more = out.length > PAGE;
  const page = more ? out.slice(0, PAGE) : out;
  const next = page.length ? Number(page[page.length - 1].seq) : cursor;
  return json({ cursor: next, more, changes: page.map(({ c, id, data }) => ({ c, id, data })) });
}
