import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { makingVideos } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  try {
    const rows = await getDb().select().from(makingVideos).orderBy(desc(makingVideos.createdAt));
    return Response.json({ videos: rows });
  } catch {
    return Response.json({ videos: [] });
  }
}

export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const videoKey = String(body.videoKey || "");
    if (!title) return Response.json({ error: "Video title is required" }, { status: 400 });
    if (!videoKey.startsWith("videos/")) {
      return Response.json({ error: "Invalid video file" }, { status: 400 });
    }
    const video = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title,
      description,
      videoKey,
    };
    await getDb().insert(makingVideos).values(video);
    return Response.json({ video });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save video" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "Video ID required" }, { status: 400 });
  await getDb().delete(makingVideos).where(eq(makingVideos.id, id));
  return Response.json({ deleted: true });
}
