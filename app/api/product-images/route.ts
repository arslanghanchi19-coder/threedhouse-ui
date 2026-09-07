import { imagePath } from "../../../lib/security.mjs";
import { checkOrigin, requireAdmin } from "../../../lib/server/auth";
import { AppError, failure } from "../../../lib/server/errors";
import { mediaStore } from "../../../lib/server/media";

const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const maxSize = 8 * 1024 * 1024;

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  const path = imagePath(key);
  if (!path) return new Response("Not found", { status: 404 });
  const entry = await mediaStore().getWithMetadata(key!, { type: "arrayBuffer" });
  if (entry) {
    const contentType = typeof entry.metadata?.contentType === "string" ? entry.metadata.contentType : "application/octet-stream";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (entry.etag) headers.set("ETag", entry.etag);
    return new Response(entry.data, { headers });
  }
  return new Response(null, { status: 307, headers: { Location: path, "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) throw new AppError("Choose an image first");
    const ext = allowed[file.type];
    if (!ext) throw new AppError("Use a JPG, PNG or WebP image");
    if (file.size > maxSize) throw new AppError("Image must be smaller than 8 MB");
    const folder = form.get("folder") === "categories" ? "categories" : "products";
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    await mediaStore().set(key, await file.arrayBuffer(), { metadata: { contentType: file.type } });
    return Response.json({ key });
  } catch (e) { return failure(e); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const key = new URL(request.url).searchParams.get("key");
    if (!imagePath(key)) throw new AppError("Invalid image");
    await mediaStore().delete(key!);
    return Response.json({ deleted: true });
  } catch (e) { return failure(e); }
}
