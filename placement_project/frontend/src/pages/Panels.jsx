import React,{useState} from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import PanelCard from "../components/PanelCard";
import DataTable from "../components/DataTable";
import {LoadingGrid,ErrorState,EmptyState} from "../components/StateBlock";

export default function Panels(){
 const {items,error,loading}=useApiList("/panels"); const [form,setForm]=useState({name:"",members:"",specialization:"",availableSlots:""}); const [message,setMessage]=useState("");
 async function add(e){e.preventDefault();try{await api.post("/panels",{name:form.name,members:form.members.split(",").map(x=>x.trim()).filter(Boolean),specialization:form.specialization,availableSlots:form.availableSlots.split(",").map(x=>x.trim()).filter(Boolean)});window.location.reload()}catch(e){setMessage(e.response?.data?.message||e.message)}}
 const looks=items&&items.length&&(items[0].members||items[0].name);
 return <section className="page"><PageHeader eyebrow="Panels" title="Manage interview panels" description="Admins can add panels; AI scheduling uses panel availability and specialization."/><form onSubmit={add} className="panel" style={{display:"grid",gap:12,marginBottom:18}}><h3>Add panel</h3><div className="auth-grid"><input required placeholder="Panel name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="Specialization" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}/></div><input required placeholder="Members, comma separated" value={form.members} onChange={e=>setForm({...form,members:e.target.value})}/><input placeholder="Available times, comma separated e.g. 10:00, 11:00" value={form.availableSlots} onChange={e=>setForm({...form,availableSlots:e.target.value})}/><button className="auth-submit">Add panel</button>{message&&<small>{message}</small>}</form>{loading&&<LoadingGrid/>}{!loading&&error&&<ErrorState message={error}/>} {!loading&&!error&&items?.length===0&&<EmptyState title="No panels yet" message="Add a panel above or let the scheduler create a fallback panel."/>}{!loading&&!error&&items?.length>0&&(looks?<div className="grid">{items.map((p,i)=><PanelCard key={p._id||i} panel={p}/>)}</div>:<div className="panel"><DataTable rows={items}/></div>)}</section>;
}
