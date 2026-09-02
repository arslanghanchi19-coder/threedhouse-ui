import { env } from "cloudflare:workers";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";
import {priceCart,reduceStock} from "../../../lib/checkout";

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)),
  );
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature)
      return Response.json(
        { error: "Missing Razorpay payment fields." },
        { status: 400 },
      );
    const secret = String((env as any).RAZORPAY_KEY_SECRET || "");
    if (!secret)
      return Response.json(
        { error: "Razorpay credentials are not configured." },
        { status: 500 },
      );
    const expected = await hmac(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      secret,
    );
    if (expected !== razorpay_signature)
      return Response.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    const rawItems=Array.isArray(data.items)?data.items:[];
    if (
      !data.customerName ||
      !data.phone ||
      !data.address ||
      !data.city ||
      !data.state ||
      !/^\d{6}$/.test(String(data.pincode)) ||
      !rawItems.length
    )
      return Response.json(
        { error: "Delivery details are incomplete." },
        { status: 400 },
      );
    const priced=await priceCart(rawItems),{items,subtotal,shipping,total}=priced,
      id = `TDH${Date.now().toString().slice(-9)}`;
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
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        orderStatus: "new",
        subtotal,
        shipping,
        total,
        items: JSON.stringify(items),
      });
    await reduceStock(items);
    return Response.json({
      success: true,
      order: { id, total, paymentMethod: "razorpay" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}
