"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useUser,useSignIn,useSignUp,useClerk} from "@clerk/nextjs";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {safeReturnTo} from "../../lib/security.mjs";

type Order={id:string;createdAt:string;total:number;orderStatus:string;items:{name:string;quantity:number}[];courier?:string;trackingNumber?:string;trackingUrl?:string};
const trackingStages=["new","accepted","processing","shipped","completed"];
function OrderTracking({order}:{order:Order}){
 if(order.orderStatus==="cancelled")return <p className="tracking-cancelled">This order was cancelled.</p>;
 const step=Math.max(0,trackingStages.indexOf(order.orderStatus));
 return <div className="order-tracking">
  <ol className="tracking-steps">{trackingStages.map((stage,index)=><li key={stage} className={index<step?"done":index===step?"current":""}>{stage}</li>)}</ol>
  {order.trackingNumber&&<p className="tracking-info">{order.courier||"Courier"} · {order.trackingNumber}{order.trackingUrl&&<> · <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">Track shipment</a></>}</p>}
 </div>;
}
function errorMessage(error:{longMessage?:string;message?:string}|null|undefined){
 return error?.longMessage||error?.message||"Please try again.";
}
export default function Account(){
 const {isLoaded:userLoaded,isSignedIn,user}=useUser();
 const {signIn}=useSignIn();
 const {signUp}=useSignUp();
 const {signOut}=useClerk();
 const [admin,setAdmin]=useState(false),[mode,setMode]=useState("login"),[step,setStep]=useState<"form"|"code">("form"),
  [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[orders,setOrders]=useState<Order[]>([]);
 useEffect(()=>{
  if(!userLoaded)return;
  if(!isSignedIn){setAdmin(false);setOrders([]);return}
  fetch("/api/me").then(r=>r.json()).then(async data=>{
   setAdmin(Boolean(data.admin));
   if(!data.admin){const response=await fetch("/api/orders");if(response.ok)setOrders((await response.json()).orders||[])}
  }).catch(()=>{});
 },[userLoaded,isSignedIn]);
 async function submitLogin(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!signIn)return;setBusy(true);setError("");setMessage("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   const {error:err}=await signIn.password({identifier:String(values.email),password:String(values.password)});
   if(err)throw new Error(errorMessage(err));
   if(signIn.status!=="complete")throw new Error("Please check your details and try again.");
   await signIn.finalize();
   window.location.assign(safeReturnTo(new URLSearchParams(window.location.search).get("next")));
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitSignup(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!signUp)return;setBusy(true);setError("");setMessage("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   const {error:err}=await signUp.password({emailAddress:String(values.email),password:String(values.password),firstName:String(values.name)});
   if(err)throw new Error(errorMessage(err));
   const {error:codeErr}=await signUp.verifications.sendEmailCode();
   if(codeErr)throw new Error(errorMessage(codeErr));
   setStep("code");setMessage("Enter the code we emailed you to confirm your account.");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitSignupCode(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!signUp)return;setBusy(true);setError("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   const {error:err}=await signUp.verifications.verifyEmailCode({code:String(values.code)});
   if(err)throw new Error(errorMessage(err));
   if(signUp.status!=="complete")throw new Error("Incorrect or expired code.");
   await signUp.finalize();
   window.location.assign("/account");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitRecover(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!signIn)return;setBusy(true);setError("");setMessage("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   const {error:createErr}=await signIn.create({identifier:String(values.email)});
   if(createErr)throw new Error(errorMessage(createErr));
   const {error:codeErr}=await signIn.resetPasswordEmailCode.sendCode();
   if(codeErr)throw new Error(errorMessage(codeErr));
   setStep("code");setMessage("Enter the code we emailed you, then choose a new password.");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitRecoverCode(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!signIn)return;setBusy(true);setError("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   const {error:codeErr}=await signIn.resetPasswordEmailCode.verifyCode({code:String(values.code)});
   if(codeErr)throw new Error(errorMessage(codeErr));
   const {error:passErr}=await signIn.resetPasswordEmailCode.submitPassword({password:String(values.password)});
   if(passErr)throw new Error(errorMessage(passErr));
   if(signIn.status!=="complete")throw new Error("Incorrect or expired code.");
   await signIn.finalize();
   window.location.assign("/account");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitProfile(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!user)return;setBusy(true);setError("");setMessage("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{await user.update({firstName:String(values.name)});setMessage("Profile saved.")}
  catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 async function submitPassword(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!user)return;setBusy(true);setError("");setMessage("");
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  try{
   await user.updatePassword({currentPassword:String(values.currentPassword),newPassword:String(values.password)});
   setMessage("Password updated.");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.")}finally{setBusy(false)}
 }
 const loading=!userLoaded;
 const displayName=user?.fullName||user?.primaryEmailAddress?.emailAddress||"Customer";
 return <main className="account-page">
  <Link href="/" className="account-brand">THREE D HOUSE</Link><h1>My account</h1>
  {loading?<p>Loading your account…</p>:isSignedIn?<>
   <p>Signed in as {user.primaryEmailAddress?.emailAddress}</p>
   {admin&&<p><a href="/admin">Open store administration →</a></p>}
   <form onSubmit={submitProfile}><h2>Your profile</h2><label>Name<Input name="name" defaultValue={displayName} maxLength={100} required autoComplete="name"/></label><Button disabled={busy}>Save profile</Button></form>
   <form onSubmit={submitPassword}><h2>Change password</h2><label>Current password<Input name="currentPassword" type="password" autoComplete="current-password" required/></label><label>New password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></label><Button disabled={busy}>Update password</Button></form>
   {!admin&&<section><h2>Your orders</h2>{orders.length?orders.map(order=><article className="account-order" key={order.id}><b>Order {order.id.slice(0,8).toUpperCase()}</b><p>{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.orderStatus} · ₹{order.total.toLocaleString("en-IN")}</p><ul>{order.items.map((item,i)=><li key={i}>{item.name} × {item.quantity}</li>)}</ul><OrderTracking order={order}/></article>):<p>No orders placed with this account yet.</p>}</section>}
   <Button variant="outline" disabled={busy} onClick={()=>signOut({redirectUrl:"/account"})}>Sign out</Button>
  </>:<>
   <div className="account-tabs">{[["login","Sign in"],["signup","Create account"],["recover","Forgot password"]].map(([value,label])=><Button key={value} variant={mode===value?"default":"outline"} disabled={busy} onClick={()=>{setMode(value);setStep("form");setError("");setMessage("")}}>{label}</Button>)}</div>
   {mode==="login"&&<form onSubmit={submitLogin}>
    <label>Email<Input name="email" type="email" maxLength={200} autoComplete="email" required/></label>
    <label>Password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete="current-password" required/></label>
    <Button disabled={busy}>{busy?"Please wait…":"Sign in"}</Button>
   </form>}
   {mode==="signup"&&step==="form"&&<form onSubmit={submitSignup}>
    <label>Name<Input name="name" maxLength={100} autoComplete="name" required/></label>
    <label>Email<Input name="email" type="email" maxLength={200} autoComplete="email" required/></label>
    <label>Password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></label>
    <Button disabled={busy}>{busy?"Please wait…":"Create account"}</Button>
   </form>}
   {mode==="signup"&&step==="code"&&<form onSubmit={submitSignupCode}>
    <label>Confirmation code<Input name="code" inputMode="numeric" maxLength={8} required/></label>
    <Button disabled={busy}>{busy?"Please wait…":"Confirm account"}</Button>
   </form>}
   {mode==="recover"&&step==="form"&&<form onSubmit={submitRecover}>
    <label>Email<Input name="email" type="email" maxLength={200} autoComplete="email" required/></label>
    <Button disabled={busy}>{busy?"Please wait…":"Send reset code"}</Button>
   </form>}
   {mode==="recover"&&step==="code"&&<form onSubmit={submitRecoverCode}>
    <label>Reset code<Input name="code" inputMode="numeric" maxLength={8} required/></label>
    <label>New password<Input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></label>
    <Button disabled={busy}>{busy?"Please wait…":"Set new password"}</Button>
   </form>}
   <p>Email confirmation is required to sign up.</p>
  </>}
  {error&&<p role="alert" className="account-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <p><Link href="/">← Back to the store</Link></p>
 </main>;
}
