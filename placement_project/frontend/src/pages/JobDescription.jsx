import React,{useState} from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import JobCard from "../components/JobCard";
import DataTable from "../components/DataTable";
import {LoadingGrid,ErrorState,EmptyState} from "../components/StateBlock";
import {useAuth} from "../context/AuthContext";

export default function JobDescription(){
 const {user}=useAuth();const {items,error,loading}=useApiList("/jobs");const companies=useApiList(user?.role==="admin"?"/companies":null);
 const blank={company:"",title:"",description:"",skills:"",branches:"",minCgpa:"",maxBacklogs:0,minExperienceMonths:0,location:""};
 const [form,setForm]=useState(blank),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[pending,setPending]=useState(null),[confirming,setConfirming]=useState(false),[reanalyzing,setReanalyzing]=useState("");
 const apply=async(id)=>{const {data}=await api.post(`/jobs/${id}/apply`); window.location.reload(); return data;};
 const add=async e=>{e.preventDefault();setBusy(true);setMessage("");try{const {data}=await api.post("/jobs",{...form,skills:form.skills.split(",").map(x=>x.trim()).filter(Boolean),branches:form.branches.split(",").map(x=>x.trim()).filter(Boolean),requirementsConfirmed:false});setPending(data.job);setMessage("AI extracted the job requirements. Review them below before running candidate matching.");setForm(blank);}catch(e){setMessage(e.response?.data?.message||e.message)}finally{setBusy(false)}};
 const confirm=async()=>{if(!pending)return;setConfirming(true);try{const {data}=await api.post(`/jobs/${pending._id}/confirm`,{skills:pending.skills,mandatorySkills:pending.mandatorySkills,preferredSkills:pending.preferredSkills,branches:pending.branches,minCgpa:pending.minCgpa,maxBacklogs:pending.maxBacklogs,minExperienceMonths:pending.minExperienceMonths});setMessage(data.message);setPending(null);window.location.reload();}catch(e){setMessage(e.response?.data?.message||e.message)}finally{setConfirming(false)}};
 const reanalyze=async id=>{setReanalyzing(id);try{const {data}=await api.post(`/jobs/${id}/reanalyze`);setPending(data.job);setMessage("JD re-analyzed. Review the extracted requirements before confirming.");}catch(e){setMessage(e.response?.data?.message||e.message)}finally{setReanalyzing("")}};
 const looks=items?.length&&(items[0].title||items[0].role);
 return <section className="page">
  <PageHeader eyebrow={user?.role==="student"?"Placement opportunities":"Job descriptions"} title={user?.role==="student"?"Find your next placement opportunity":"Create and analyze company requirements"} description={user?.role==="student"?"Browse admin-approved opportunities, see your eligibility, apply, and track the AI placement workflow.":"AI extracts requirements first. Admin confirmation is required before eligibility and candidate matching runs."}/>
  {user?.role==="admin"&&<form onSubmit={add} className="panel" style={{display:"grid",gap:12,marginBottom:18}}>
   <h3>Add job</h3>
   <select required value={form.company} onChange={e=>setForm({...form,company:e.target.value})}><option value="">Select company</option>{(companies.items||[]).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select>
   <input required placeholder="Job title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
   <textarea required rows="7" placeholder="Paste complete job description. AI will extract only facts present in the JD." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
   <div className="auth-grid"><input placeholder="Optional skills override: React, SQL" value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})}/><input placeholder="Branches: CSE, IT" value={form.branches} onChange={e=>setForm({...form,branches:e.target.value})}/></div>
   <div className="auth-grid"><input type="number" min="0" max="10" step="0.01" placeholder="Min CGPA override" value={form.minCgpa} onChange={e=>setForm({...form,minCgpa:e.target.value})}/><input type="number" min="0" placeholder="Max backlogs" value={form.maxBacklogs} onChange={e=>setForm({...form,maxBacklogs:e.target.value})}/></div>
   <input type="number" min="0" placeholder="Min experience (months)" value={form.minExperienceMonths} onChange={e=>setForm({...form,minExperienceMonths:e.target.value})}/>
   <input placeholder="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
   <button className="auth-submit" disabled={busy}>{busy?"Analyzing JD…":"Analyze JD"}</button>{message&&<small>{message}</small>}
  </form>}
  {pending&&<div className="panel" style={{marginBottom:18}}>
   <div className="section-title"><h3>AI Extracted Requirements — Admin Review</h3></div>
   <p className="panel-sub">The AI does not get the final say. Edit these fields if needed, then confirm.</p>
   <div className="auth-grid">
    <input value={pending.title||""} onChange={e=>setPending({...pending,title:e.target.value})} placeholder="Title"/>
    <input value={(pending.branches||[]).join(", ")} onChange={e=>setPending({...pending,branches:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="Branches"/>
    <input value={(pending.skills||[]).join(", ")} onChange={e=>setPending({...pending,skills:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="Skills"/>
    <input value={(pending.mandatorySkills||[]).join(", ")} onChange={e=>setPending({...pending,mandatorySkills:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="Mandatory skills"/>
    <input value={(pending.preferredSkills||[]).join(", ")} onChange={e=>setPending({...pending,preferredSkills:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="Preferred skills"/>
    <input type="number" min="0" max="10" value={pending.minCgpa??0} onChange={e=>setPending({...pending,minCgpa:Number(e.target.value)})} placeholder="Minimum CGPA"/>
    <input type="number" min="0" value={pending.maxBacklogs??0} onChange={e=>setPending({...pending,maxBacklogs:Number(e.target.value)})} placeholder="Maximum backlogs"/>
    <input type="number" min="0" value={pending.minExperienceMonths??0} onChange={e=>setPending({...pending,minExperienceMonths:Number(e.target.value)})} placeholder="Experience months"/>
   </div>
   <button className="btn" style={{marginTop:12}} disabled={confirming} onClick={confirm}>{confirming?"Running eligibility & matching…":"Confirm requirements & run matching"}</button>
  </div>}
  {loading&&<LoadingGrid/>}{!loading&&error&&<ErrorState message={error}/>}
  {!loading&&!error&&items?.length===0&&<EmptyState title={user?.role==="student"?"No open opportunities yet":"No job descriptions yet"} message={user?.role==="student"?"The placement cell has not published a confirmed opportunity yet. Check back later.":"Add a job above."}/> }
  {!loading&&!error&&items?.length>0&&(looks?<div className="grid">{items.map((j,i)=><div key={j._id||i}><JobCard job={j} isStudent={user?.role==="student"} onApply={apply}/>{user?.role==="admin"&&j._id&&<button className="btn-ghost btn" style={{marginTop:8,width:"100%"}} disabled={reanalyzing===j._id} onClick={()=>reanalyze(j._id)}>{reanalyzing===j._id?"AI re-analyzing…":"Re-analyze JD (review before matching)"}</button>}</div>)}</div>:<div className="panel"><DataTable rows={items}/></div>)}
 </section>;
}
