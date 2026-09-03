import {redirect} from "next/navigation";
import {getUser} from "../../lib/server/auth";
import AdminDashboard from "./dashboard";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const user=await getUser();
 if(!user)redirect("/account?next=/admin");
 if(!user.admin)return <main style={{maxWidth:600,margin:"80px auto",padding:24}}><h1>Owner access required</h1><p>This account does not have permission to manage the store.</p><a href="/account">Return to My account</a></main>;
 return <AdminDashboard owner={user.displayName} signOut="/account"/>;
}
