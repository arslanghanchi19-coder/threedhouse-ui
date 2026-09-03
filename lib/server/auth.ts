import "server-only";
import { cookies } from "next/headers";
import { AppError, authRequest } from "./supabase";
import { isAdminId, sameOrigin } from "../security.mjs";

const SESSION = "tdh-session";
export type StoreUser = {id:string; email:string; displayName:string; admin:boolean};

export async function getUser(): Promise<StoreUser | null> {
  const token = (await cookies()).get(SESSION)?.value;
  if (!token) return null;
  try {
    // Verify with Supabase; never trust decoded JWT claims or identity headers.
    const user = await authRequest("user", undefined, token, "GET");
    if (!user.id || !user.email_confirmed_at) return null;
    return {id:user.id, email:user.email || "", displayName:String(user.user_metadata?.name || user.email || "Customer"),
      admin:isAdminId(user.id, process.env.ADMIN_USER_IDS)};
  } catch { return null; }
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new AppError("Please sign in.", 401);
  if (!user.admin) throw new AppError("Owner access required.", 403);
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new AppError("Please sign in at My account, then retry.", 401);
  return user;
}

export function checkOrigin(request: Request) {
  // Never derive the trusted origin from an untrusted Host/Forwarded header.
  if (!sameOrigin(request.headers.get("origin"), process.env.SITE_URL))
    throw new AppError("Request origin is not allowed.", 403);
}

export async function setSession(token:string, expires = 3600) {
  (await cookies()).set(SESSION, token, {httpOnly:true, secure:process.env.NODE_ENV === "production",
    sameSite:"lax", path:"/", maxAge:Math.max(1, Math.min(Number(expires)||3600, 3600))});
}
export async function clearSession() { (await cookies()).delete(SESSION); }
export async function sessionToken() { return (await cookies()).get(SESSION)?.value; }

