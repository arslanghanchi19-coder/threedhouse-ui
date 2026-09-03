import {z} from "zod";
import {database,failure} from "../../../lib/server/supabase";
import {checkOrigin,requireAdmin} from "../../../lib/server/auth";
import {body,categoryNames} from "../../../lib/server/validation";
import {imagePath} from "../../../lib/security.mjs";
export const dynamic="force-dynamic";
export async function GET(){try{return Response.json({categories:await database("tdh_categories?select=*&order=name.asc")});}catch(e){return failure(e);}}
export async function POST(request:Request){
 try{
  checkOrigin(request);await requireAdmin();
  const data=await body(request,z.object({name:z.enum(categoryNames),imageKey:z.string().refine(k=>k.startsWith("categories/")&&Boolean(imagePath(k))).nullable()}));
  await database("tdh_categories?on_conflict=name",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(data)});
  return Response.json({category:data});
 }catch(e){return failure(e);}
}
