import "server-only";

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function config(admin = false) {
  const url = process.env.SUPABASE_URL;
  const key = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new AppError("Store setup is not complete. Please try again later.", 503);
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co"))
    throw new AppError("Invalid Supabase configuration.", 503);
  return { url: parsed.origin, key };
}

export async function authRequest(path: string, body?: unknown, token?: string, method = "POST") {
  const {url, key} = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method, cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: {apikey:key, "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {})},
    ...(body !== undefined ? {body:JSON.stringify(body)} : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new AppError("Too many attempts. Please wait before trying again.", 429);
    throw new AppError("Unable to complete sign-in. Check your details and confirm your email.", 401);
  }
  return data;
}

export async function database<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const {url, key} = config(true);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init, cache:"no-store", signal:AbortSignal.timeout(15000),
    headers: {apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json", Prefer:"return=representation", ...init.headers},
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // Only expose deliberate validation messages from our SQL function.
    if (data.code === "P0001" && typeof data.message === "string" && data.message.startsWith("Checkout:"))
      throw new AppError(data.message, 409);
    throw new AppError("Unable to save or load store data. Please try again later.", 503);
  }
  const text = await response.text();
  return text ? JSON.parse(text) as T : null as T;
}

export function failure(error: unknown) {
  return Response.json({error:error instanceof AppError ? error.message : "Something went wrong. Please try again."},
    {status:error instanceof AppError ? error.status : 500, headers:{"Cache-Control":"no-store"}});
}

