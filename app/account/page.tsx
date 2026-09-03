"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {safeReturnTo} from "../../lib/security.mjs";

type User={id:string;email:string;displayName:string;admin:boolean};
type Order={id:string;createdAt:string;total:number;orderStatus:string;items:{name:string;quantity:number}[]};
export default function Account(){
 const [user,setUser]=useState<User|null>(null),[mode,setMode]=useState("login"),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[orders,setOrders]=useState<Order[]>([]);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  fetch("/api/auth/user").then(r=>{if(!r.ok)throw Error();return r.json()}).then(async data=>{
   if(params.has("expired"))setError("This link has expired or was already used. Request another email.");
   if(params.has("reset"))setMessage("You can now choose a new password below.");
   setUser(data.user);
   if(data.user&&!data.user.admin){const response=await fetch("/api/orders");if(!response.ok)throw Error("Unable to load your orders.");setOrders((await response.json()).orders||[])}
  }).catch(()=>setError("Unable to load your account. Please try again.")).finally(()=>setLoading(false));
 },[]);
 async function submit(action:string,event?:React.FormEvent<HTMLFormElement>){
  event?.preventDefault();setBusy(true);setError("");setMessage("");
  const values=event?Object.fromEntries(new FormData(event.currentTarget).entries()):{};
  try{
   const response=await fetch(`/api/auth/${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)}),data=await response.json();
   if(!response.ok)throw Error(data.error||"Please try again.");
   if(action==="login"){window.location.assign(safeReturnTo(new URLSearchParams(window.location.search).get("next")));return;}
   if(action==="logout"){window.location.assign("/account");return;}
   if(action==="profile")setUser(current=>current?{...current,displayName:String(values.name)}:null);
   setMessage(data.message||"Saved.");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 return <main className="account-page">
  <Link href="/" className="account-brand">THREE D HOUSE</Link><h1>My account</h1>
  {loading?<p>Loading your account…</p>:user?<>
   <p>Signed in as {user.email}</p>
   {user.admin&&<p><a href="/admin">Open store administration →</a></p>}
   <form onSubmit={e=>submit("profile",e)}><h2>Your profile</h2><label>Name<Input name="name" defaultValue={user.displayName} maxLength={100} required autoComplete="name"/></label><Button disabled={busy}>Save profile</Button></form>
   <form onSubmit={e=>submit("password",e)}><h2>Change password</h2><label>New password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></label><Button disabled={busy}>Update password</Button></form>
   {!user.admin&&<section><h2>Your orders</h2>{orders.length?orders.map(order=><article className="account-order" key={order.id}><b>Order {order.id.slice(0,8).toUpperCase()}</b><p>{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.orderStatus} · ₹{order.total.toLocaleString("en-IN")}</p><ul>{order.items.map((item,i)=><li key={i}>{item.name} × {item.quantity}</li>)}</ul></article>):<p>No orders placed with this account yet.</p>}</section>}
   <Button variant="outline" disabled={busy} onClick={()=>submit("logout")}>Sign out</Button>
  </>:<>
   <div className="account-tabs">{[["login","Sign in"],["signup","Create account"],["recover","Forgot password"]].map(([value,label])=><Button key={value} variant={mode===value?"default":"outline"} disabled={busy} onClick={()=>{setMode(value);setError("");setMessage("")}}>{label}</Button>)}</div>
   <form onSubmit={e=>submit(mode,e)}>
    {mode==="signup"&&<label>Name<Input name="name" maxLength={100} autoComplete="name" required/></label>}
    <label>Email<Input name="email" type="email" maxLength={200} autoComplete="email" required/></label>
    {mode!=="recover"&&<label>Password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete={mode==="signup"?"new-password":"current-password"} required/></label>}
    <Button disabled={busy}>{busy?"Please wait…":mode==="signup"?"Create account":mode==="recover"?"Send reset email":"Sign in"}</Button>
   </form>
   <p>Email confirmation is required. Sessions expire after one hour; sign in again when prompted.</p>
  </>}
  {error&&<p role="alert" className="account-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <p><Link href="/">← Back to the store</Link></p>
 </main>;
}
