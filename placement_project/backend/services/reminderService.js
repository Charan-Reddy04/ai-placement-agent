import Interview from "../models/Interview.js";
import { createNotification } from "./notificationService.js";

const WINDOWS=[
 {key:"7d",min:144,hours:216,text:"Your interview is in about 7 days."},
 {key:"3d",min:48,hours:96,text:"Your interview is in about 3 days."},
 {key:"1d",min:12,hours:36,text:"Your interview is tomorrow."},
 {key:"1h",min:0,hours:2,text:"Your interview starts in about 1 hour."}
];
function hoursUntil(date,time){const d=new Date(`${date}T${time}:00`);return (d.getTime()-Date.now())/3600000;}
export async function sendUpcomingInterviewReminders(){
 const candidates=await Interview.find({status:{$in:["SCHEDULED","APPROVED","REMINDER_SENT"]},student:{$ne:null}}).populate("job student room");
 let sent=0;
 for(const interview of candidates){
   const h=hoursUntil(interview.date,interview.time);if(!Number.isFinite(h))continue;
   const sentTypes=new Set(interview.reminderTypes||[]);
   for(const w of WINDOWS){
     if(sentTypes.has(w.key)||h<w.min||h>w.hours)continue;
     await createNotification(interview.student._id,"Interview reminder",`${w.text} ${interview.job?.title||"Interview"} on ${interview.date} at ${interview.time}${interview.room?.name?` in ${interview.room.name}`:""}.`,"reminder");
     sentTypes.add(w.key);sent++;
   }
   interview.reminderTypes=[...sentTypes];interview.reminderSent=sentTypes.size>0;
   if(sentTypes.size)interview.status="REMINDER_SENT";
   await interview.save();
 }
 return {checked:candidates.length,sent};
}
