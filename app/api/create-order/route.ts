import { env } from "cloudflare:workers";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {priceCart} from "../../../lib/checkout";

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as {
      items?: Array<{ price: number; quantity: number }>;
    };
    if (!Array.isArray(items) || !items.length)
      return Response.json({ error: "Cart is empty." }, { status: 400 });
    const priced=await priceCart(items);
    const amount = Math.round(priced.total * 100);
    if (!Number.isFinite(amount) || amount < 100)
      return Response.json(
        { error: "Minimum payment amount is ₹1." },
        { status: 400 },
      );
    const key_id = String((env as any).RAZORPAY_KEY_ID || ""),
      key_secret = String((env as any).RAZORPAY_KEY_SECRET || "");
    if (!key_id || !key_secret)
      return Response.json(
        { error: "Razorpay credentials are not configured." },
        { status: 500 },
      );
    const authorization=btoa(`${key_id}:${key_secret}`);
    const razorpayResponse=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:`Basic ${authorization}`,"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt:`tdh_${Date.now()}`})});
    const order=await razorpayResponse.json() as any;
    if(!razorpayResponse.ok){
      const status=razorpayResponse.status===401?401:500;
      return Response.json({error:status===401?"Razorpay authentication failed. Please regenerate the test API keys.":order?.error?.description||"Razorpay could not create the order."},{status});
    }
    return Response.json({order_id:order.id,amount:order.amount,currency:order.currency,key_id});
  } catch (error: any) {
    const status = error?.statusCode === 401 ? 401 : 500;
    return Response.json(
      {
        error:
          status === 401
            ? "Razorpay authentication failed."
            : error?.error?.description || "Unable to create Razorpay order.",
      },
      { status },
    );
  }
}
