import Interview from "../models/Interview.js";
import Panel from "../models/Panel.js";
import Room from "../models/Room.js";
import { askAI } from "./aiService.js";

const DURATION=60;
function slotRange(startHour=9,endHour=17){const out=[];for(let h=startHour;h<endHour;h++)for(const m of [0,30])out.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);return out;}
function datePlus(days){return new Date(Date.now()+days*86400000).toISOString().slice(0,10);}
function mins(t="00:00"){const [h,m]=String(t).split(":").map(Number);return (Number(h)||0)*60+(Number(m)||0);}
function overlaps(a,b,d=DURATION){return mins(a)<mins(b)+d&&mins(b)<mins(a)+d;}

export async function findConflict(payload){
  const rows=await Interview.find({date:payload.date,status:{$nin:["REJECTED","NOT_SELECTED"]}}).lean();
  return rows.find(x=>overlaps(x.time,payload.time,payload.durationMinutes||DURATION)&&
    (String(x.room)===String(payload.room)||String(x.panel)===String(payload.panel)))||null;
}

export async function autoSchedule({job,student,preferredDate,interviewFocus=[],applicationId}){
  let panels=await Panel.find(), rooms=await Room.find();
  if(!panels.length)panels=[await Panel.create({name:"Placement Panel 1",members:["Placement Officer"],specialization:job.skills?.join(", ")||job.title,availableSlots:slotRange()})];
  if(!rooms.length)rooms=[await Room.create({name:"Placement Interview Room 1",capacity:1,location:"Placement Cell",availableSlots:slotRange()})];

  // Prefer a panel whose specialization overlaps the job's required skills.
  const jobTerms=(job.skills||[]).map(x=>String(x).toLowerCase());
  panels.sort((a,b)=>{
    const score=p=>(p.specialization||"").toLowerCase().split(/[,/& ]+/).filter(Boolean)
      .filter(x=>jobTerms.some(j=>j.includes(x)||x.includes(j))).length;
    return score(b)-score(a);
  });

  const dates=preferredDate?[preferredDate,datePlus(1),datePlus(2),datePlus(3)]:[datePlus(1),datePlus(2),datePlus(3),datePlus(4)];
  const candidates=[];
  for(const date of dates){
    const existing=await Interview.find({date}).lean();
    for(const panel of panels)for(const room of rooms){
      const ps=panel.availableSlots?.length?panel.availableSlots:slotRange();
      const rs=room.availableSlots?.length?room.availableSlots:slotRange();
      const common=slotRange().filter(t=>ps.some(x=>String(x).endsWith(t)||String(x)===t)&&rs.some(x=>String(x).endsWith(t)||String(x)===t));
      for(const time of common){
        const used=existing.some(x=>x.status!=="REJECTED"&&overlaps(x.time,time)&&
          (String(x.panel)===String(panel._id)||String(x.room)===String(room._id)));
        if(!used)candidates.push({date,time,panel:panel._id,room:room._id});
      }
    }
    if(candidates.length)break;
  }
  if(!candidates.length)throw new Error("No conflict-free interview slot is available.");

  let chosen=candidates[0],aiPlan=null;
  try{
    aiPlan=await askAI(`Choose only one available interview option. Prefer a working-hour slot and a panel specialization relevant to the job. Return JSON {"index":0,"reason":"","focusAreas":[]}. JOB:${JSON.stringify({title:job.title,skills:job.skills})} FOCUS:${JSON.stringify(interviewFocus)} OPTIONS:${JSON.stringify(candidates.slice(0,60))}`,{json:true});
    if(Number.isInteger(aiPlan?.index)&&candidates[aiPlan.index])chosen=candidates[aiPlan.index];
  }catch(e){console.warn("AI scheduling fallback:",e.message);}

  const conflict=await findConflict(chosen);
  if(conflict)throw new Error("Scheduling conflict detected while creating the interview. Please retry.");

  return Interview.create({
    application:applicationId,job:job._id,student:student._id,...chosen,
    status:"SCHEDULED",round:"Technical",mode:job.interviewMode==="Online"?"Online":"In-person",
    meetingLink:job.interviewMode==="Online"?`https://meet.google.com/placement-${String(applicationId||student._id).slice(-6)}`:undefined,
    aiPlan:{reason:aiPlan?.reason||"Best available conflict-free slot",focusAreas:aiPlan?.focusAreas||interviewFocus}
  });
}

export async function createSchedule(payload){
  const conflict=await findConflict(payload);
  if(conflict){const e=new Error(`Scheduling conflict: panel/room is already occupied at ${conflict.time} on ${conflict.date}.`);e.code="SCHEDULING_CONFLICT";e.statusCode=409;throw e;}
  return Interview.create({...payload,status:payload.status||"PENDING_ADMIN_APPROVAL"});
}
