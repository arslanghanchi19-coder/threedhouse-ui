import { z } from "zod";
import { AppError } from "./supabase";
import { imagePath } from "../security.mjs";

export const categoryNames = ["Bathroom","Kitchen","Home Organization","Desk & Office","Planters & Décor","Personalized Gifts"] as const;
const image = z.string().refine(value => Boolean(imagePath(value)), "Use products/name.webp or categories/name.webp from the repository.");
export const productSchema = z.object({
  id:z.number().int().positive().safe(), name:z.string().trim().min(1).max(150), category:z.enum(categoryNames),
  price:z.number().int().min(1).max(1000000), stock:z.number().int().min(0).max(100000),
  material:z.string().max(50).default("PETG"), color:z.string().max(300).default(""),
  description:z.string().max(5000).default(""), imageKeys:z.array(image).max(10).default([]),
});
export const reviewSchema = z.object({
  productId:z.number().int().positive().safe(), rating:z.number().int().min(1).max(5),
  comment:z.string().trim().max(1000).default(""),
});
export const deliverySchema = z.object({
  customerName:z.string().trim().min(2).max(100), phone:z.string().regex(/^[0-9]{10}$/),
  email:z.union([z.string().email().max(200),z.literal("")]).optional().default(""),
  address:z.string().trim().min(5).max(500), city:z.string().trim().min(1).max(100),
  state:z.string().trim().min(1).max(100), pincode:z.string().regex(/^[0-9]{6}$/),
  paymentMethod:z.literal("cod"), requestId:z.string().uuid(),
  items:z.array(z.object({productId:z.number().int().positive().safe(),quantity:z.number().int().min(1).max(100),color:z.string().max(100)})).min(1).max(50),
});
export async function body<S extends z.ZodTypeAny>(request:Request, schema:S):Promise<z.output<S>> {
  const raw = await request.text();
  if (raw.length > 64000) throw new AppError("Request is too large.",413);
  let data;
  try { data = JSON.parse(raw); } catch { throw new AppError("Invalid request."); }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AppError("Please check the form fields and try again.");
  return parsed.data;
}
