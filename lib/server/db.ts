import "server-only";
import { getDatabase } from "@netlify/database";
import { AppError } from "./errors";

let cached: ReturnType<typeof getDatabase> | null = null;
function connection() {
  if (!cached) {
    try { cached = getDatabase(); }
    catch { throw new AppError("Store setup is not complete. Please try again later.", 503); }
  }
  return cached;
}

export function sql<T = unknown>(strings: TemplateStringsArray, ...params: unknown[]) {
  return connection().sql<T>(strings, ...params as never[]);
}
