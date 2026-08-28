import React,{useState} from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import RoomCard from "../components/RoomCard";
import DataTable from "../components/DataTable";
import {LoadingGrid,ErrorState,EmptyState} from "../components/StateBlock";

export default function Rooms(){
 const {items,error,loading}=useApiList("/rooms"); const [form,setForm]=useState({name:"",capacity:1,location:"",availableSlots:""}); const [message,setMessage]=useState("");
 async function add(e){e.preventDefault();try{await api.post("/rooms",{...form,capacity:Number(form.capacity),availableSlots:form.availableSlots.split(",").map(x=>x.trim()).filter(Boolean)});window.location.reload()}catch(e){setMessage(e.response?.data?.message||e.message)}}
 const looks=items&&items.length&&(items[0].capacity!==undefined||items[0].name);
 return <section className="page"><PageHeader eyebrow="Rooms" title="Manage venues and capacity" description="Admins can add physical or virtual rooms; AI scheduling checks room availability and conflicts."/><form onSubmit={add} className="panel" style={{display:"grid",gap:12,marginBottom:18}}><h3>Add room</h3><div className="auth-grid"><input required placeholder="Room name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></div><input placeholder="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/><input placeholder="Available times, comma separated e.g. 10:00, 11:00" value={form.availableSlots} onChange={e=>setForm({...form,availableSlots:e.target.value})}/><button className="auth-submit">Add room</button>{message&&<small>{message}</small>}</form>{loading&&<LoadingGrid/>}{!loading&&error&&<ErrorState message={error}/>} {!loading&&!error&&items?.length===0&&<EmptyState title="No rooms configured" message="Add a room above or let the scheduler create a fallback room."/>}{!loading&&!error&&items?.length>0&&(looks?<div className="grid">{items.map((r,i)=><RoomCard key={r._id||i} room={r}/>)}</div>:<div className="panel"><DataTable rows={items}/></div>)}</section>;
}
