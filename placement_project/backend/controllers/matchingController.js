import Job from "../models/Job.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import { runMatchingAgent as matchCandidate } from "../agents/matchingAgent.js";

export const match=async(req,res)=>{
 const [job,students]=await Promise.all([Job.findById(req.params.jobId),Student.find()]);
 if(!job)return res.status(404).json({message:"Job not found"});
 if(!job.requirementsConfirmed)return res.status(409).json({message:"Job requirements have not been confirmed by an admin yet."});
 const apps=await Application.find({job:job._id}).select("student status adminNote approvedAt");
 const byStudent=new Map(apps.map(a=>[String(a.student),a]));
 const results=[];
 for(const s of students){
   const m=await matchCandidate(job,s),a=byStudent.get(String(s._id));
   // Fallback label only applies when no Application record exists yet (e.g. a
   // student added after this job was last evaluated). Mirror the same
   // eligible-AND-score>=50 rule placementPipeline uses, so this display-only
   // status never claims AI_RECOMMENDED for a candidate who fails a hard gate.
   const hardEligible=m.cgpaOk&&m.backlogOk&&m.branchOk&&m.experienceOk&&!m.hardGaps.length;
   const fallbackStatus=(hardEligible&&m.score>=50)?"AI_RECOMMENDED":"REJECTED";
   results.push({student:s,...m,applicationId:a?._id,status:a?.status||fallbackStatus,adminNote:a?.adminNote});
 }
 res.json(results.sort((a,b)=>b.score-a.score));
};
