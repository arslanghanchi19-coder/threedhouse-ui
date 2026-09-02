import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const allowed = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const maxSize = 80 * 1024 * 1024;
const validKey = (key: string | null) => Boolean(key?.startsWith("videos/"));

export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("video");
  if (!(file instanceof File)) return Response.json({ error: "Choose a video first" }, { status: 400 });
  if (!allowed.has(file.type)) return Response.json({ error: "Use an MP4, WebM or MOV video" }, { status: 400 });
  if (file.size > maxSize) return Response.json({ error: "Video must be smaller than 80 MB" }, { status: 400 });
  const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const key = `videos/${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return Response.json({ key });
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!validKey(key)) return new Response("Not found", { status: 404 });
  const head = await env.BUCKET.head(key!);
  if (!head) return new Response("Not found", { status: 404 });
  const range = req.headers.get("range");
  const headers = new Headers();
  head.writeHttpMetadata(headers);
  headers.set("etag", head.httpEtag);
  headers.set("accept-ranges", "bytes");
  if (range?.startsWith("bytes=")) {
    const [rawStart, rawEnd] = range.slice(6).split("-");
    const start = Math.max(0, Number(rawStart) || 0);
    const end = Math.min(head.size - 1, rawEnd ? Number(rawEnd) : head.size - 1);
    if (start > end) return new Response(null, { status: 416 });
    const object = await env.BUCKET.get(key!, { range: { offset: start, length: end - start + 1 } });
    if (!object) return new Response("Not found", { status: 404 });
    headers.set("content-range", `bytes ${start}-${end}/${head.size}`);
    headers.set("content-length", String(end - start + 1));
    return new Response(object.body, { status: 206, headers });
  }
  const object = await env.BUCKET.get(key!);
  if (!object) return new Response("Not found", { status: 404 });
  headers.set("content-length", String(head.size));
  return new Response(object.body, { headers });
}

export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key");
  if (!validKey(key)) return Response.json({ error: "Invalid video" }, { status: 400 });
  await env.BUCKET.delete(key!);
  return Response.json({ deleted: true });
}
