import {eq} from "drizzle-orm";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {getDb} from "../db";
import {products} from "../db/schema";

export type CheckoutItem={productId:number;name:string;price:number;quantity:number;color:string;imageKey:string|null};
export async function priceCart(raw:any[]):Promise<{items:CheckoutItem[];subtotal:number;shipping:number;total:number}>{
 if(!Array.isArray(raw)||!raw.length)throw new Error("Cart is empty.");
 const catalogue=await getDb().select().from(products),byId=new Map(catalogue.map(p=>[p.id,p]));
 const items=raw.map(item=>{const product=byId.get(Number(item.productId));if(!product)throw new Error("A product in your cart is no longer available.");const quantity=Math.max(1,Math.floor(Number(item.quantity)||1));if(product.stock<quantity)throw new Error(`${product.name} has only ${product.stock} left in stock.`);const colors=product.color.split(",").map(c=>c.trim()).filter(Boolean),color=String(item.color||colors[0]||"Standard");if(colors.length&&!colors.includes(color))throw new Error(`Please choose an available colour for ${product.name}.`);return {productId:product.id,name:product.name,price:product.price,quantity,color,imageKey:product.imageKey}});
 const subtotal=items.reduce((sum,item)=>sum+item.price*item.quantity,0),shipping=subtotal>=999?0:99;
 return {items,subtotal,shipping,total:subtotal+shipping};
}
export async function reduceStock(items:CheckoutItem[]){for(const item of items){const [product]=await getDb().select().from(products).where(eq(products.id,item.productId));if(product)await getDb().update(products).set({stock:Math.max(0,product.stock-item.quantity)}).where(eq(products.id,item.productId))}}
