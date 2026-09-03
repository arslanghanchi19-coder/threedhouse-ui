import {imagePath} from "../../../lib/security.mjs";
export function GET(request:Request){
 const path=imagePath(new URL(request.url).searchParams.get("key"));
 if(!path)return new Response("Not found",{status:404});
 return new Response(null,{status:307,headers:{Location:path,"Cache-Control":"no-store"}});
}
function disabled(){return Response.json({error:"Images are managed in GitHub. Add files under public/products or public/categories and redeploy."},{status:405,headers:{Allow:"GET, HEAD"}});}
export const POST=disabled;
export const DELETE=disabled;
