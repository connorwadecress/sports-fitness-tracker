import { dbConfigured } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export async function GET() {
  if (!dbConfigured()) return json({ configured: false, user: null });
  const user = await currentUser();
  return json({ configured: true, user: user ? { email: user.email, name: user.name } : null });
}
