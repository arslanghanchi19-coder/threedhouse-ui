import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import {priceCart,reduceStock} from "../../../lib/checkout";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const rows = await getDb()
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));
  return Response.json({
    orders: rows.map((row) => ({ ...row, items: JSON.parse(row.items) })),
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const items = Array.isArray(data.items) ? data.items : [];
    if (
      !data.customerName ||
      !data.phone ||
      !data.address ||
      !data.city ||
      !data.state ||
      !/^\d{6}$/.test(String(data.pincode)) ||
      !items.length
    )
      return Response.json(
        { error: "Please complete all required delivery details." },
        { status: 400 },
      );
    if (data.paymentMethod !== "cod")
      return Response.json(
        { error: "Invalid payment method." },
        { status: 400 },
      );
    const priced=await priceCart(items),{items:safeItems,subtotal,shipping,total}=priced;
    const id = `TDH${Date.now().toString().slice(-9)}`;
    await getDb()
      .insert(orders)
      .values({
        id,
        createdAt: new Date().toISOString(),
        customerName: String(data.customerName),
        phone: String(data.phone),
        email: String(data.email || ""),
        address: String(data.address),
        city: String(data.city),
        state: String(data.state),
        pincode: String(data.pincode),
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "new",
        subtotal,
        shipping,
        total,
        items: JSON.stringify(safeItems),
      });
    await reduceStock(safeItems);
    return Response.json({ order: { id, total, paymentMethod: "cod" } });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to place order" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id)
    return Response.json({ error: "Order ID required" }, { status: 400 });
  await getDb().delete(orders).where(eq(orders.id, id));
  return Response.json({ deleted: true, id });
}

export async function PATCH(req:Request){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Sign in required"},{status:401});
 const data=await req.json();
 if(!data.id||!['new','accepted','processing','shipped','completed','cancelled'].includes(data.status))return Response.json({error:"Invalid order update"},{status:400});
 const updates={orderStatus:String(data.status),courier:String(data.courier||""),trackingNumber:String(data.trackingNumber||""),trackingUrl:String(data.trackingUrl||""),ownerNote:String(data.ownerNote||"")};
 await getDb().update(orders).set(updates).where(eq(orders.id,String(data.id)));
 return Response.json({updated:true,id:data.id,...updates});
}
