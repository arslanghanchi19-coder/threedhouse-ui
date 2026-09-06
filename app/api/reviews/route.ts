import { z } from "zod";
import { sql } from "../../../lib/server/db";
import { AppError, failure } from "../../../lib/server/errors";
import { checkOrigin, requireUser } from "../../../lib/server/auth";
import { body, reviewSchema } from "../../../lib/server/validation";
export const dynamic = "force-dynamic";
type Review = { id: string; customerName: string; rating: number; comment: string; createdAt: string };
export async function GET(request: Request) {
  try {
    const productId = z.coerce.number().int().positive().safe().safeParse(new URL(request.url).searchParams.get("productId"));
    if (!productId.success) throw new AppError("Invalid product ID.");
    const reviews = await sql<Review>`
      select id, "customerName", rating, comment, "createdAt" from tdh_reviews
      where "productId" = ${productId.data} order by "createdAt" desc limit 100`;
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    return Response.json({ reviews, average, count: reviews.length }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const data = await body(request, reviewSchema);
    const rows = await sql<Review>`
      insert into tdh_reviews ("productId", "userId", "customerName", rating, comment)
      values (${data.productId}, ${user.id}, ${user.displayName}, ${data.rating}, ${data.comment})
      on conflict ("productId", "userId") do update set rating=excluded.rating, comment=excluded.comment, "customerName"=excluded."customerName"
      returning id, "customerName", rating, comment, "createdAt"`;
    return Response.json({ review: rows[0] });
  } catch (e) { return failure(e); }
}
