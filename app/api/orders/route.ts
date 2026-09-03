import {z} from "zod";
import {database,failure,AppError} from "../../../lib/server/supabase";
import {checkOrigin,requireAdmin,requireUser} from "../../../lib/server/auth";
import {body,deliverySchema} from "../../../lib/server/validation";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const user=await requireUser();
  const select=user.admin?"*":"id,createdAt,items,total,orderStatus,paymentMethod,paymentStatus,courier,trackingNumber,trackingUrl";
  const filter=user.admin?"":`&userId=eq.${encodeURIComponent(user.id)}`;
  return Response.json({orders:await database(`tdh_orders?select=${select}${filter}&order=createdAt.desc&limit=200`)},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return failure(e);}
}
export async function POST(request:Request){
 try{
  checkOrigin(request);
  if(process.env.CHECKOUT_ENABLED!=="true")throw new AppError("Checkout is not open yet. Please check back soon.",503);
  const user=await requireUser(),data=await body(request,deliverySchema);
  const order=await database("rpc/tdh_place_cod_order",{method:"POST",body:JSON.stringify({p_user_id:user.id,p_request_id:data.requestId,p_delivery:{...data,email:user.email,items:undefined,requestId:undefined},p_items:data.items})});
  return Response.json({order});
 }catch(e){return failure(e);}
}
export async function PATCH(request:Request){
 try{
  checkOrigin(request);await requireAdmin();
  const data=await body(request,z.object({id:z.string().uuid(),status:z.enum(["new","accepted","processing","shipped","completed","cancelled"]),courier:z.string().max(100).default(""),trackingNumber:z.string().max(150).default(""),trackingUrl:z.union([z.string().url().refine(u=>u.startsWith("https://")),z.literal("")]).default(""),ownerNote:z.string().max(3000).default("")}));
  const {id,status,...rest}=data;
  const rows=await database<unknown[]>(`tdh_orders?id=eq.${id}`,{method:"PATCH",body:JSON.stringify({...rest,orderStatus:status})});
  if(!rows.length)throw new AppError("Order not found.",404);
  return Response.json({updated:true,id});
 }catch(e){return failure(e);}
}
export async function DELETE(request:Request){
 try{
  checkOrigin(request);await requireAdmin();
  const id=z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if(!id.success)throw new AppError("Invalid order ID.");
  await database(`tdh_orders?id=eq.${id.data}`,{method:"DELETE"});
  return Response.json({deleted:true});
 }catch(e){return failure(e);}
}
