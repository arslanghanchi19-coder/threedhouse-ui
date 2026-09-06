import { sql } from "../../../lib/server/db";
import { AppError, failure } from "../../../lib/server/errors";
import { checkOrigin, requireAdmin } from "../../../lib/server/auth";
import { body, productSchema } from "../../../lib/server/validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ products: await sql`select * from tdh_products order by id asc` }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const p = await body(request, productSchema), imageKey = p.imageKeys[0] || null;
    const rows = await sql`
      insert into tdh_products (id, name, category, price, stock, material, color, description, "imageKey", "imageKeys")
      values (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.stock}, ${p.material}, ${p.color}, ${p.description}, ${imageKey}, ${JSON.stringify(p.imageKeys)}::jsonb)
      on conflict (id) do update set name=excluded.name, category=excluded.category, price=excluded.price, stock=excluded.stock,
        material=excluded.material, color=excluded.color, description=excluded.description, "imageKey"=excluded."imageKey", "imageKeys"=excluded."imageKeys"
      returning *`;
    return Response.json({ product: rows[0] });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) throw new AppError("Invalid product ID.");
    await sql`delete from tdh_products where id = ${id}`;
    return Response.json({ deleted: true, id });
  } catch (error) { return failure(error); }
}
