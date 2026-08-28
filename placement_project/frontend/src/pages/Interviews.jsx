import React,{useState} from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ScheduleCard from "../components/ScheduleCard";
import DataTable from "../components/DataTable";
import {LoadingGrid,ErrorState,EmptyState} from "../components/StateBlock";
import {useAuth} from "../context/AuthContext";

function PrepPlan({jobId,studentId}){
 const [plan,setPlan]=useState(null); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function load(){setBusy(true);setError("");try{const {data}=await api.post("/interviews/plan",{jobId,studentId});setPlan(data)}catch(e){setError(e.response?.data?.message||e.message)}finally{setBusy(false)}}
 if(!plan&&!busy&&!error) return <button className="btn-ghost btn" style={{marginTop:8,width:"100%"}} onClick={load}>AI interview prep plan</button>;
 return <div className="panel" style={{marginTop:8,padding:12}}>
  {busy&&<small>Generating AI prep plan…</small>}
  {error&&<small className="error">{error}</small>}
  {plan&&<>
   {plan.focusAreas?.length>0&&<p className="desc"><b>Focus areas:</b> {plan.focusAreas.join(", ")}</p>}
   {plan.technicalTopics?.length>0&&<p className="desc" style={{marginTop:6}}><b>Technical topics:</b> {plan.technicalTopics.join(", ")}</p>}
   {(plan.hrQuestions?.length>0||plan.technicalTopics?.length>0)&&<ul style={{margin:"6px 0 0 18px",fontSize:13}}>{[...(plan.hrQuestions||[])].slice(0,6).map((q,i)=><li key={i}>{q}</li>)}</ul>}
   {plan.tips?.length>0&&<p className="desc"><b>Tips:</b> {plan.tips.join(" · ")}</p>}
  </>}
 </div>;
}

export default function Interviews(){
 const {user}=useAuth(); const {items,error,loading}=useApiList("/interviews"); const [busy,setBusy]=useState("");
 async function act(id,action,body){setBusy(id);try{await api.post(`/interviews/${id}/${action}`,body||{});window.location.reload()}catch(e){alert(e.response?.data?.message||e.message)}finally{setBusy("")}}
 const looks=items&&items.length&&(items[0].date||items[0].time||items[0].room);
 return <section className="page"><PageHeader eyebrow="Interviews" title="Coordinate interview schedules" description="Approved candidates are scheduled by the Scheduling Agent; admins can complete interviews and record final outcomes."/>{loading&&<LoadingGrid/>}{!loading&&error&&<ErrorState message={error}/>} {!loading&&!error&&items?.length===0&&<EmptyState title="No interviews scheduled" message="Approved candidates are passed to the Scheduling Agent, which selects a conflict-free panel, room and time."/>}{!loading&&!error&&items?.length>0&&(looks?<div className="grid">{items.map((it,i)=>{const jobId=it.job?._id||it.job;const studentId=typeof it.student==="object"?it.student?._id:it.student;return <div key={it._id||i}><ScheduleCard item={it}/>{it.meetingLink&&<a href={it.meetingLink} target="_blank" rel="noreferrer" className="btn" style={{display:"inline-block",marginTop:8}}>Join online interview</a>}
  {user?.role==="admin" && (it.status==="PENDING_ADMIN_APPROVAL" || it.status==="Pending Approval") && <div style={{display:"flex",gap:8,marginTop:8}}><button className="btn" onClick={()=>act(it._id,"approve")} disabled={busy===it._id}>Approve</button><button className="btn-ghost btn" onClick={()=>act(it._id,"reject")} disabled={busy===it._id}>Reject</button></div>}
  {user?.role==="admin" && (it.status==="SCHEDULED" || it.status==="APPROVED" || it.status==="Approved" || it.status==="REMINDER_SENT") && <div style={{display:"flex",gap:8,marginTop:8}}><button className="btn" onClick={()=>act(it._id,"complete")} disabled={busy===it._id}>Mark interview completed</button></div>}
  {user?.role==="admin" && (it.status==="COMPLETED" || it.status==="Completed") && <div style={{display:"flex",gap:8,marginTop:8}}><button className="btn" onClick={()=>act(it._id,"result",{result:"Selected"})} disabled={busy===it._id}>Mark Selected</button><button className="btn-ghost btn" onClick={()=>act(it._id,"result",{result:"Not Selected"})} disabled={busy===it._id}>Mark Not Selected</button></div>}
  {jobId&&studentId&&<PrepPlan jobId={jobId} studentId={studentId}/>}</div>})}</div>:<div className="panel"><DataTable rows={items}/></div>)}</section>;
}
