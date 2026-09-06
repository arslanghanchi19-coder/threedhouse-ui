import { z } from "zod";
import { sql } from "../../../lib/server/db";
import { AppError, failure } from "../../../lib/server/errors";
import { checkOrigin, requireAdmin, requireUser } from "../../../lib/server/auth";
import { body, deliverySchema } from "../../../lib/server/validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await requireUser();
    const orders = user.admin
      ? await sql`select * from tdh_orders order by "createdAt" desc limit 200`
      : await sql`select id, "createdAt", items, total, "orderStatus", "paymentMethod", "paymentStatus", courier, "trackingNumber", "trackingUrl" from tdh_orders where "userId" = ${user.id} order by "createdAt" desc limit 200`;
    return Response.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (process.env.CHECKOUT_ENABLED !== "true") throw new AppError("Checkout is not open yet. Please check back soon.", 503);
    const user = await requireUser(), data = await body(request, deliverySchema);
    const delivery = { customerName: data.customerName, phone: data.phone, email: user.email, address: data.address, city: data.city, state: data.state, pincode: data.pincode };
    const rows = await sql<{ tdh_place_cod_order: { id: string; total: number; paymentMethod: string } }>`
      select public.tdh_place_cod_order(${user.id}, ${data.requestId}, ${JSON.stringify(delivery)}::jsonb, ${JSON.stringify(data.items)}::jsonb) as tdh_place_cod_order`;
    return Response.json({ order: rows[0].tdh_place_cod_order });
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause : e;
    if (cause instanceof Error && cause.message.includes("Checkout:")) {
      const match = cause.message.match(/Checkout:[^\n"]*/);
      return failure(new AppError(match ? match[0] : cause.message, 409));
    }
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const data = await body(request, z.object({ id: z.string().uuid(), status: z.enum(["new", "accepted", "processing", "shipped", "completed", "cancelled"]), courier: z.string().max(100).default(""), trackingNumber: z.string().max(150).default(""), trackingUrl: z.union([z.string().url().refine(u => u.startsWith("https://")), z.literal("")]).default(""), ownerNote: z.string().max(3000).default("") }));
    const rows = await sql`
      update tdh_orders set "orderStatus"=${data.status}, courier=${data.courier}, "trackingNumber"=${data.trackingNumber}, "trackingUrl"=${data.trackingUrl}, "ownerNote"=${data.ownerNote}
      where id = ${data.id} returning id`;
    if (!rows.length) throw new AppError("Order not found.", 404);
    return Response.json({ updated: true, id: data.id });
  } catch (e) { return failure(e); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const id = z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
    if (!id.success) throw new AppError("Invalid order ID.");
    await sql`delete from tdh_orders where id = ${id.data}`;
    return Response.json({ deleted: true });
  } catch (e) { return failure(e); }
}
