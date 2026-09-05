import { z } from "zod";
import { database, failure, AppError } from "../../../lib/server/supabase";
import { checkOrigin, requireUser } from "../../../lib/server/auth";
import { body, reviewSchema } from "../../../lib/server/validation";
export const dynamic = "force-dynamic";
type Review = { id: string; customerName: string; rating: number; comment: string; createdAt: string };
export async function GET(request: Request) {
  try {
    const productId = z.coerce.number().int().positive().safe().safeParse(new URL(request.url).searchParams.get("productId"));
    if (!productId.success) throw new AppError("Invalid product ID.");
    const reviews = await database<Review[]>(
      `tdh_reviews?productId=eq.${productId.data}&select=id,customerName,rating,comment,createdAt&order=createdAt.desc&limit=100`,
    );
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    return Response.json({ reviews, average, count: reviews.length }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const data = await body(request, reviewSchema);
    const rows = await database<Review[]>("tdh_reviews?on_conflict=productId,userId", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ productId: data.productId, userId: user.id, customerName: user.displayName, rating: data.rating, comment: data.comment }),
    });
    return Response.json({ review: rows[0] });
  } catch (e) { return failure(e); }
}
