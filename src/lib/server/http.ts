import "server-only";
import { dbConfigured } from "./db";
import { currentUser, sameOrigin, type SessionUser } from "./auth";

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export function guard(req: Request): Response | null {
  if (!dbConfigured()) return json({ error: "Cloud sync isn't set up on this server." }, 503);
  if (req.method !== "GET" && !sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  return null;
}

/** Resolves to the signed-in user, or a 401 response. */
export async function requireUser(req: Request): Promise<SessionUser | Response> {
  const bad = guard(req);
  if (bad) return bad;
  const user = await currentUser();
  return user ?? json({ error: "Not signed in" }, 401);
}
