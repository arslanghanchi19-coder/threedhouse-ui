// Compatibility shim: independently hosted routes now use verified Supabase identity.
import {getUser} from "../lib/server/auth";
import {redirect} from "next/navigation";
import {safeReturnTo} from "../lib/security.mjs";
export const getChatGPTUser=getUser;
export async function requireChatGPTUser(returnTo:string){
 const user=await getUser();if(user)return user;
 redirect(chatGPTSignInPath(returnTo));
}
export function chatGPTSignInPath(returnTo="/account"){return "/account?next="+encodeURIComponent(safeReturnTo(returnTo));}
export function chatGPTSignOutPath(){return "/account";}
