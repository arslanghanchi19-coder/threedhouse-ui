import { database, failure, AppError } from "../../../lib/server/supabase";
import { checkOrigin, requireAdmin } from "../../../lib/server/auth";
import { body, productSchema } from "../../../lib/server/validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({products:await database("tdh_products?select=*&order=id.asc")}); }
  catch(error) { return failure(error); }
}
export async function POST(request:Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const p=await body(request,productSchema), value={...p,imageKey:p.imageKeys[0]||null};
    const rows=await database<unknown[]>("tdh_products?on_conflict=id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(value)});
    return Response.json({product:rows[0]});
  } catch(error) { return failure(error); }
}
export async function DELETE(request:Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const id=Number(new URL(request.url).searchParams.get("id"));
    if(!Number.isSafeInteger(id)||id<1)throw new AppError("Invalid product ID.");
    await database(`tdh_products?id=eq.${id}`,{method:"DELETE"});
    return Response.json({deleted:true,id});
  }catch(error){return failure(error);}
}
