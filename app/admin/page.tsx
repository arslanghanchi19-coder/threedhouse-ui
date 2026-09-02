import {requireChatGPTUser,chatGPTSignOutPath} from "../chatgpt-auth";
import AdminDashboard from "./dashboard";
export const dynamic="force-dynamic";
export default async function AdminPage(){const user=await requireChatGPTUser("/admin");return <AdminDashboard owner={user.displayName} signOut={chatGPTSignOutPath("/")}/>}
