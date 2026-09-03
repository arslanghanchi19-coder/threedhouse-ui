import { z } from "zod";
import { AppError, authRequest, failure } from "../../../../lib/server/supabase";
import { checkOrigin, clearSession, getUser, requireUser, sessionToken, setSession } from "../../../../lib/server/auth";
import { body } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";
const credentials = z.object({email:z.string().email().max(200),password:z.string().min(8).max(128),name:z.string().max(100).optional()});
type Context = {params:Promise<{action:string}>};

export async function GET(_request:Request, {params}:Context) {
  if ((await params).action !== "user") return new Response(null,{status:404});
  return Response.json({user:await getUser()}, {headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:Request, {params}:Context) {
  try {
    checkOrigin(request);
    const {action} = await params;
    if (action === "logout") {
      const token = await sessionToken();
      if (token) await authRequest("logout",undefined,token).catch(() => {});
      await clearSession();
      return Response.json({ok:true});
    }
    if (action === "login" || action === "signup") {
      const data = await body(request,credentials);
      if (action === "signup") {
        await authRequest("signup", {email:data.email,password:data.password,data:{name:data.name||""}});
        return Response.json({message:"Check your email to confirm your account, then sign in."});
      }
      const result = await authRequest("token?grant_type=password",{email:data.email,password:data.password});
      if (!result.access_token || !result.user?.email_confirmed_at) throw new AppError("Please confirm your email first.",401);
      await setSession(result.access_token,result.expires_in);
      return Response.json({ok:true});
    }
    if (action === "recover") {
      const data = await body(request,z.object({email:z.string().email().max(200)}));
      // Keep the response identical whether the account exists or not.
      await authRequest("recover",data).catch(() => {});
      return Response.json({message:"If an account exists, a password-reset email will arrive. Follow its link."});
    }
    if (action === "password" || action === "profile") {
      await requireUser();
      const input = action === "password"
        ? await body(request,z.object({password:z.string().min(8).max(128)}))
        : await body(request,z.object({name:z.string().trim().min(1).max(100)}));
      await authRequest("user",action === "password" ? input : {data:input},await sessionToken(),"PUT");
      return Response.json({message:action === "password" ? "Password updated." : "Profile saved."});
    }
    return new Response(null,{status:404});
  } catch (error) { return failure(error); }
}
