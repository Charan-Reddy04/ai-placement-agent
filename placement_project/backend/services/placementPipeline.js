import Student from "../models/Student.js";
import Job from "../models/Job.js";
import Eligibility from "../models/Eligibility.js";
import Application from "../models/Application.js";
import { runEligibilityAgent as checkEligibility } from "../agents/eligibilityAgent.js";
import { runMatchingAgent as matchCandidate } from "../agents/matchingAgent.js";
import { askAI } from "./aiService.js";
import { placementAgent } from "../agents/placementAgent.js";

// Placement readiness is a real, derived signal (average AI match score
// across every job this student has been evaluated against) rather than a
// hardcoded/fake number - the Student.readinessScore field must never be
// left at its schema default once the student has at least one evaluation.
async function updateReadiness(studentId){
  const apps=await Application.find({student:studentId}).select("matchScore");
  if(!apps.length)return;
  const avg=Math.round(apps.reduce((sum,a)=>sum+Number(a.matchScore||0),0)/apps.length);
  await Student.findByIdAndUpdate(studentId,{readinessScore:avg});
}

async function evaluatePair(job,student){
  const eligibility=await checkEligibility(job,student);
  await Eligibility.findOneAndUpdate(
    {job:job._id,student:student._id},
    {job:job._id,student:student._id,...eligibility},
    {upsert:true,new:true,setDefaultsOnInsert:true}
  );

  const match=await matchCandidate(job,student);
  const recommended=eligibility.eligible && match.score>=50;
  const existing=await Application.findOne({job:job._id,student:student._id});
  // Re-scoring must not silently undo an administrator's decision.
  let status=existing?.status;
  if(!["PENDING_ADMIN_APPROVAL","APPROVED","SCHEDULED","COMPLETED","SELECTED","NOT_SELECTED"].includes(status)){
    status=recommended?"AI_RECOMMENDED":"REJECTED";
  }
  const application=await Application.findOneAndUpdate(
    {job:job._id,student:student._id},
    {job:job._id,student:student._id,matchScore:match.score,aiScore:match.aiScore,
      matchedSkills:match.matchedSkills,missingSkills:match.missingSkills,
      explanation:match.explanation,interviewFocus:match.interviewFocus,status},
    {upsert:true,new:true,setDefaultsOnInsert:true}
  );
  await updateReadiness(student._id).catch(e=>console.warn(`Readiness update failed for ${student._id}:`,e.message));
  // CRITICAL HUMAN-IN-THE-LOOP RULE:
  // Matching creates a recommendation only. It never creates an interview.
  return {studentId:student._id,jobId:job._id,applicationId:application._id,eligibility,match,status};
}

export async function runPlacementPipeline(job){
  if(!job?.requirementsConfirmed) throw new Error("Placement pipeline is locked until an admin confirms the job requirements.");
  const students=await Student.find();
  const results=[];
  for(const student of students) results.push(await evaluatePair(job,student));
  let smartPlan=null;
  try{
    smartPlan=await askAI(`Build a placement operations plan using only these verified facts. Return JSON {"prioritySkills":[],"interviewTopics":[],"weeklyRoadmap":[]}. JOB:${JSON.stringify(job)} RESULTS:${JSON.stringify(results.slice(0,100))}`,{json:true});
  }catch(e){console.warn("Smart plan fallback:",e.message);}
  return {count:results.length,results,smartPlan,aiEnabled:results.some(r=>r.match.aiUsed||r.eligibility.aiUsed),agent:placementAgent()};
}

export async function refreshStudentAcrossJobs(student){
  const jobs=await Job.find({status:"Open",requirementsConfirmed:true});
  const results=[];
  for(const job of jobs) results.push(await evaluatePair(job,student));
  return {count:results.length,results};
}
