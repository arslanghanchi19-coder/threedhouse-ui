import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { categories } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const allowedCategories = new Set([
  "Bathroom",
  "Kitchen",
  "Home Organization",
  "Desk & Office",
  "Planters & Décor",
  "Personalized Gifts",
]);

export async function GET() {
  try {
    const rows = await getDb().select().from(categories).orderBy(asc(categories.name));
    return Response.json({ categories: rows });
  } catch {
    return Response.json({ categories: [] });
  }
}

export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "");
    const imageKey = body.imageKey ? String(body.imageKey) : null;
    if (!allowedCategories.has(name)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    if (imageKey && !imageKey.startsWith("categories/")) {
      return Response.json({ error: "Invalid category image" }, { status: 400 });
    }
    await getDb()
      .insert(categories)
      .values({ name, imageKey })
      .onConflictDoUpdate({ target: categories.name, set: { imageKey } });
    return Response.json({ category: { name, imageKey } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save category" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name") || "";
  if (!allowedCategories.has(name)) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }
  await getDb().delete(categories).where(eq(categories.name, name));
  return Response.json({ deleted: true });
}
