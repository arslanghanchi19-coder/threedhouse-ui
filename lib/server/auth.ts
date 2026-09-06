import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AppError } from "./errors";
import { isAdminId, sameOrigin } from "../security.mjs";

export type StoreUser = {id:string; email:string; displayName:string; admin:boolean};

export async function getUser(): Promise<StoreUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || "",
    displayName: user.fullName || user.primaryEmailAddress?.emailAddress || "Customer",
    admin: isAdminId(user.id, process.env.ADMIN_USER_IDS),
  };
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
