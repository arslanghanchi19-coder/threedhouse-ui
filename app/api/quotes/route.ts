import {z} from "zod";
import {database,failure,AppError} from "../../../lib/server/supabase";
import {checkOrigin,requireAdmin,requireUser} from "../../../lib/server/auth";
import {body} from "../../../lib/server/validation";
export const dynamic="force-dynamic";
export async function GET(){try{await requireAdmin();return Response.json({quotes:await database("tdh_quotes?select=*&order=createdAt.desc&limit=200")},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return failure(e);}}
export async function POST(request:Request){
 try{
  checkOrigin(request);
  if(process.env.CHECKOUT_ENABLED!=="true")throw new AppError("Custom quote requests are not open yet.",503);
  const user=await requireUser(),data=await body(request,z.object({customerName:z.string().trim().min(2).max(100),phone:z.string().regex(/^[0-9]{10}$/),email:z.string().max(200).optional(),projectType:z.string().min(1).max(100),description:z.string().trim().min(10).max(5000),quantity:z.coerce.number().int().min(1).max(10000)}));
  const quotes=await database<unknown[]>("tdh_quotes",{method:"POST",body:JSON.stringify({...data,email:user.email,userId:user.id})});
  return Response.json({quote:quotes[0]});
 }catch(e){return failure(e);}
}
export async function PATCH(request:Request){
 try{
  checkOrigin(request);await requireAdmin();
  const data=await body(request,z.object({id:z.string().uuid(),status:z.enum(["new","reviewing","quoted","approved","closed"]),ownerNote:z.string().max(3000).default("")}));
  const {id,...rest}=data;await database(`tdh_quotes?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(rest)});
  return Response.json({updated:true});
 }catch(e){return failure(e);}
}
