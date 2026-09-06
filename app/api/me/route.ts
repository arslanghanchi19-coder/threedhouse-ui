import { getUser } from "../../../lib/server/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getUser();
  return Response.json({ admin: user?.admin ?? false }, { headers: { "Cache-Control": "private, no-store" } });
}
