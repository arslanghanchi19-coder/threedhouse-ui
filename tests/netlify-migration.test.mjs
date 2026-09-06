import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {z} from "zod";
import {imagePath,isAdminId,sameOrigin,safeReturnTo} from "../lib/security.mjs";

const read = path => fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
class AppError extends Error {constructor(message,status=400){super(message);this.status=status;}}
function moduleFrom(path,mocks,env={}){
 const code=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext(code,{exports,require:name=>{if(!(name in mocks))throw Error(`Unexpected import ${name}`);return mocks[name];},Response,Request,URL,AbortSignal,Error,process:{env},console});
 return exports;
}
test("repository images reject traversal, URLs, scripts and nested paths",()=>{
 assert.equal(imagePath("products/soap-dish.webp"),"/products/soap-dish.webp");
 assert.equal(imagePath("categories/Desk_1.jpg"),"/categories/Desk_1.jpg");
 for(const value of [null,"https://evil.test/a.jpg","//evil.test/a.jpg","products/../secret.jpg","products/%2e%2e/a.jpg","products/a.svg","products/a/b.jpg","products/a.jpg?x=1","products/a.jpg#x","products/a\\b.jpg"])
  assert.equal(imagePath(value),null,String(value));
});
test("owner allowlist fails closed and requires exact UUID match",()=>{
 assert.equal(isAdminId("owner",""),false);assert.equal(isAdminId("own","owner"),false);
 assert.equal(isAdminId("customer","owner"),false);assert.equal(isAdminId("owner"," owner, other "),true);
});
test("mutation origin checks reject missing, hostile and insecure origins",()=>{
 assert.equal(sameOrigin("https://threedhouse.in","https://threedhouse.in"),true);
 for(const origin of [null,"null","https://evil.test","https://threedhouse.in.evil.test"])
  assert.equal(sameOrigin(origin,"https://threedhouse.in"),false);
 assert.equal(sameOrigin("http://threedhouse.in","http://threedhouse.in"),false);
 assert.equal(sameOrigin("http://localhost:3000","http://localhost:3000"),true);
});
test("login return destinations cannot leave the store",()=>{
 for(const value of [null,"//evil.test","https://evil.test","/\\evil.test"])
  assert.equal(safeReturnTo(value),"/account");
 assert.equal(safeReturnTo("/admin"),"/admin");
});
test("media handlers redirect locally and refuse uploads without storage",async()=>{
 const route=moduleFrom("app/api/product-images/route.ts",{"../../../lib/security.mjs":{imagePath}});
 const response=route.GET(new Request("https://store.test/api/product-images?key=products/soap.webp"));
 assert.equal(response.status,307);assert.equal(response.headers.get("location"),"/products/soap.webp");
 assert.equal(route.GET(new Request("https://store.test/api/product-images?key=products/../secret.jpg")).status,404);
 assert.equal(route.POST().status,405);assert.equal(route.DELETE().status,405);
});
test("product and cart validation rejects manipulated quantities and external images",()=>{
 const {productSchema,deliverySchema}=moduleFrom("lib/server/validation.ts",{"zod":{z},"./errors":{AppError},"../security.mjs":{imagePath}});
 const product={id:1,name:"Soap dish",category:"Bathroom",price:349,stock:5,imageKeys:["products/soap.webp"]};
 assert.equal(productSchema.safeParse(product).success,true);
 for(const delta of [{price:-1},{price:1.1},{stock:-1},{imageKeys:["https://evil.test/a.jpg"]}])assert.equal(productSchema.safeParse({...product,...delta}).success,false);
 const cart={customerName:"Test Buyer",phone:"9999999999",address:"Test address",city:"Mumbai",state:"Maharashtra",pincode:"400001",paymentMethod:"cod",requestId:"a714fc76-a4ae-41b1-b14e-4f424a8d07fb",items:[{productId:1,quantity:1,color:"Stone"}]};
 assert.equal(deliverySchema.safeParse(cart).success,true);
 for(const quantity of [0,-1,1.5,101])assert.equal(deliverySchema.safeParse({...cart,items:[{productId:1,quantity,color:"Stone"}]}).success,false);
});
test("order history is filtered by verified user ID and hides owner notes",async()=>{
 let queried="";
 const route=moduleFrom("app/api/orders/route.ts",{
  zod:{z},
  "../../../lib/server/db":{sql:(strings,...values)=>{queried=strings.reduce((acc,s,i)=>acc+s+(i<values.length?JSON.stringify(values[i]):""),"");return[];}},
  "../../../lib/server/errors":{AppError,failure:()=>new Response(null,{status:500})},
  "../../../lib/server/auth":{requireUser:async()=>({id:"verified-id",admin:false}),requireAdmin:async()=>{throw new AppError("denied",403)},checkOrigin:()=>{}},
  "../../../lib/server/validation":{body:()=>{},deliverySchema:{}},
 });
 assert.equal((await route.GET()).status,200);
 assert.match(queried,/verified-id/);assert.doesNotMatch(queried,/ownerNote|select \*/);
 const disabled=await route.POST(new Request("https://store.test/api/orders",{method:"POST"}));
 assert.notEqual(disabled.status,200);
});
test("stock-lock failures nested in the DB driver's error cause map to a 409 with the checkout message",async()=>{
 const dbError=new Error("Failed query: select public.tdh_place_cod_order($1,$2,$3::jsonb,$4::jsonb)");
 dbError.cause=new Error("Checkout: Not enough stock. Please update your cart.");
 const route=moduleFrom("app/api/orders/route.ts",{
  zod:{z},
  "../../../lib/server/db":{sql:async()=>{throw dbError;}},
  "../../../lib/server/errors":{AppError,failure:(e)=>Response.json({error:e instanceof AppError?e.message:"Something went wrong. Please try again."},{status:e instanceof AppError?e.status:500})},
  "../../../lib/server/auth":{requireUser:async()=>({id:"verified-id",admin:false,email:""}),requireAdmin:async()=>{throw new AppError("denied",403)},checkOrigin:()=>{}},
  "../../../lib/server/validation":{body:async()=>({requestId:"a714fc76-a4ae-41b1-b14e-4f424a8d07fb",items:[{productId:1,quantity:1,color:"Stone"}]}),deliverySchema:{}},
 },{CHECKOUT_ENABLED:"true"});
 const response=await route.POST(new Request("https://store.test/api/orders",{method:"POST"}));
 assert.equal(response.status,409);
 assert.match((await response.json()).error,/Not enough stock/);
});
test("Clerk identity is verified via the SDK; admin status derives from ADMIN_USER_IDS",async()=>{
 let authCalls=0;
 const auth=moduleFrom("lib/server/auth.ts",{
  "server-only":{},
  "@clerk/nextjs/server":{auth:async()=>{authCalls++;return{userId:"user_customer"};},currentUser:async()=>({id:"user_customer",primaryEmailAddress:{emailAddress:"buyer@example.test"},fullName:"Buyer Example"})},
  "./errors":{AppError},
  "../security.mjs":{isAdminId,sameOrigin},
 });
 const user=await auth.getUser();assert.equal(authCalls,1);assert.equal(user.admin,false);assert.equal(user.email,"buyer@example.test");
 await assert.rejects(()=>auth.requireAdmin(),/Owner access required/);
});
test("Neon schema keeps atomic, idempotent checkout and drops the Supabase-specific role model",()=>{
 const schema=read("db/schema.sql");
 assert.match(schema,/unique \("userId", "requestId"\)/);
 assert.match(schema,/order by id for update/);
 assert.match(schema,/sum\(\(value->>'quantity'\)::integer\)/);
 assert.doesNotMatch(schema,/references auth\.users|enable row level security|\banon\b|\bauthenticated\b|service_role/);
 assert.doesNotMatch(schema,/drop table/i);
});
test("Netlify config keeps previews read-only and app routes have no Cloudflare imports",()=>{
 assert.match(read("netlify.toml"),/build:netlify/);
 assert.match(read("netlify.toml"),/CHECKOUT_ENABLED = "false"/);
 for(const folder of fs.readdirSync(new URL("../app/api/",import.meta.url))){
  if(folder==="auth")continue;
  assert.doesNotMatch(read(`app/api/${folder}/route.ts`),/cloudflare:workers|env\.BUCKET|getDb/);
 }
 assert.doesNotMatch(read("app/admin/dashboard.tsx"),/type="file"|\/api\/video-files/);
});
