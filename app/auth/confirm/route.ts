import { authRequest } from "../../../lib/server/supabase";
import { setSession } from "../../../lib/server/auth";

// Supabase email templates must use this token_hash endpoint; see setup guide.
export async function GET(request:Request) {
  const url = new URL(request.url), hash=url.searchParams.get("token_hash"), type=url.searchParams.get("type");
  const origin=process.env.SITE_URL;
  if (!origin) return new Response("Store setup incomplete.",{status:503});
  try {
    if (!hash || !["signup","recovery","email"].includes(type||"")) throw new Error("Invalid link");
    const session=await authRequest("verify",{token_hash:hash,type});
    if (!session.access_token) throw new Error("Invalid session");
    await setSession(session.access_token,session.expires_in);
    return Response.redirect(new URL(type === "recovery" ? "/account?reset=1" : "/account",origin),303);
  } catch {
    return Response.redirect(new URL("/account?expired=1",origin),303);
  }
}
