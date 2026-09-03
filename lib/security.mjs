/** Restrict media to public repository assets, never a URL or object-store key. */
export function imagePath(key) {
  if (typeof key !== "string" || key.length > 200) return null;
  return /^(products|categories)\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(jpg|jpeg|png|webp)$/.test(key)
    ? `/${key}` : null;
}

export function isAdminId(id, configured) {
  return typeof id === "string" && Boolean(id) &&
    String(configured || "").split(",").map(s => s.trim()).filter(Boolean).includes(id);
}

export function sameOrigin(origin, configured) {
  if (!origin || !configured) return false;
  try {
    const expected = new URL(configured);
    return origin === expected.origin &&
      (expected.protocol === "https:" ||
       (expected.protocol === "http:" && ["localhost", "127.0.0.1"].includes(expected.hostname)));
  } catch { return false; }
}

export function safeReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  try {
    const url = new URL(value, "https://store.invalid");
    return url.origin === "https://store.invalid" ? url.pathname + url.search : "/account";
  } catch { return "/account"; }
}

