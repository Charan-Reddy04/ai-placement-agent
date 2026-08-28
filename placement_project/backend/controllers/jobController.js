import Job from "../models/Job.js";
import {parseJD} from "../services/jdParser.js";
import {askAI} from "../services/aiService.js";
import {runPlacementPipeline} from "../services/placementPipeline.js";
import {logAudit} from "../services/auditService.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import { checkEligibility } from "../services/eligibilityService.js";

export const list=async(req,res)=>{
  const jobs=await Job.find(
    req.user?.role==="student"
      ? {status:"Open",requirementsConfirmed:true}
      : {}
  ).populate("company").sort({createdAt:-1});

  if(req.user?.role!=="student") return res.json(jobs);

  const student=await Student.findOne({user:req.user.id});
  if(!student) return res.status(404).json({message:"Student profile not found"});
  const applications=await Application.find({student:student._id,job:{$in:jobs.map(j=>j._id)}});
  const byJob=new Map(applications.map(a=>[String(a.job),a]));
  const result=[];
  for(const job of jobs){
    const eligibility=await checkEligibility(job,student,{explain:false});
    const application=byJob.get(String(job._id));
    result.push({
      ...job.toObject(),
      eligibility:{eligible:eligibility.eligible,score:eligibility.eligibilityScore,reasons:eligibility.reasons,missingSkills:eligibility.missingSkills,matchedSkills:eligibility.matchedSkills},
      application:application?{id:application._id,status:application.status,studentApplied:Boolean(application.studentApplied),appliedAt:application.appliedAt,matchScore:application.matchScore,explanation:application.explanation}:null
    });
  }
  res.json(result);
};

export const apply = async(req,res)=>{
  const [job,student]=await Promise.all([Job.findById(req.params.id).populate("company"),Student.findOne({user:req.user.id})]);
  if(!job) return res.status(404).json({message:"Job opportunity not found"});
  if(!student) return res.status(404).json({message:"Student profile not found. Complete your profile first."});
  if(job.status!=="Open"||!job.requirementsConfirmed) return res.status(400).json({message:"This opportunity is not currently open for applications."});
  if(job.applicationDeadline && new Date(job.applicationDeadline)<new Date()) return res.status(400).json({message:"The application deadline has passed."});

  const eligibility=await checkEligibility(job,student);
  if(!eligibility.eligible){
    return res.status(400).json({message:"You are not eligible for this opportunity yet.",reasons:eligibility.reasons,missingSkills:eligibility.missingSkills});
  }

  const application=await Application.findOne({job:job._id,student:student._id});
  if(application){
    if(application.studentApplied) return res.status(409).json({message:"You have already applied for this opportunity.",application});
    application.studentApplied=true; application.appliedAt=new Date();
    application.applicationSource=application.applicationSource==="AI_RECOMMENDATION"?"BOTH":application.applicationSource;
    if(["REJECTED","AI_RECOMMENDATION"].includes(application.status)) application.status="AI_RECOMMENDED";
    await application.save();
    return res.json({message:"Application submitted. The AI placement agent will keep your profile in the admin review queue.",application});
  }

  const created=await Application.create({
    job:job._id,student:student._id,studentApplied:true,appliedAt:new Date(),applicationSource:"STUDENT_APPLICATION",
    status:"AI_RECOMMENDED",eligibilityScore:eligibility.eligibilityScore,matchedSkills:eligibility.matchedSkills,missingSkills:eligibility.missingSkills,
    explanation:"Student applied after passing the verified eligibility criteria."
  });
  res.status(201).json({message:"Application submitted successfully.",application:created});
};

export const create=async(req,res)=>{
  const parsed=await parseJD(req.body.description||"");
  const requestedSkills=Array.isArray(req.body.skills)?req.body.skills:[];
  const skills=[...new Set([...(parsed.skills||[]),...requestedSkills])];
  const mandatorySkills=[...new Set(parsed.mandatorySkills||[])];
  const overrides={};
  if(req.body.minCgpa!=="" && req.body.minCgpa!==undefined) overrides.minCgpa=Number(req.body.minCgpa);
  if(req.body.maxBacklogs!=="" && req.body.maxBacklogs!==undefined) overrides.maxBacklogs=Number(req.body.maxBacklogs);
  if(req.body.minExperienceMonths!=="" && req.body.minExperienceMonths!==undefined) overrides.minExperienceMonths=Number(req.body.minExperienceMonths);
  if(Array.isArray(req.body.branches) && req.body.branches.length) overrides.branches=req.body.branches;
  if(req.body.location) overrides.location=req.body.location;
  const job=await Job.create({
    ...req.body,...parsed,...overrides,skills,mandatorySkills,
    preferredSkills:Array.isArray(req.body.preferredSkills)?req.body.preferredSkills:(parsed.preferredSkills||[]),
    requirementsConfirmed:Boolean(req.body.requirementsConfirmed||false)
  });
  let pipeline=null;
  if(Boolean(req.body.requirementsConfirmed)){
    job.requirementsConfirmed=true;
    await job.save();
    pipeline=await runPlacementPipeline(job);
    if(pipeline.smartPlan){job.smartPlan=pipeline.smartPlan;await job.save();}
  }
  res.status(201).json({job,pipeline,aiGenerated:true,requiresConfirmation:!job.requirementsConfirmed});
};

export const confirmRequirements=async(req,res)=>{
  const job=await Job.findById(req.params.id);
  if(!job)return res.status(404).json({message:"Job not found"});
  const allowed=["title","skills","mandatorySkills","preferredSkills","branches","minCgpa","maxBacklogs","minExperienceMonths","graduationYear","education","location","salary","openings","applicationDeadline","interviewProcess","interviewMode"];
  for(const key of allowed)if(req.body[key]!==undefined)job[key]=req.body[key];
  job.requirementsConfirmed=true;await job.save();
  const pipeline=await runPlacementPipeline(job);
  if(pipeline.smartPlan){job.smartPlan=pipeline.smartPlan;await job.save();}
  await logAudit(req.user,"Job requirements confirmed","Job",job._id,`${job.title} — evaluated ${pipeline.count} students`);
  res.json({job,pipeline,message:`Requirements confirmed. Evaluated ${pipeline.count} students.`});
};

export const analyze=async(req,res)=>{
  const parsed=await parseJD(req.body.description||"");
  let plan=null;
  try { plan=await askAI(`Create a smart placement preparation plan for this verified job extraction. Return JSON {"prioritySkills":[],"interviewTopics":[],"roadmap":[{"week":1,"goals":[]}]}.
${JSON.stringify(parsed)}`,{json:true}); } catch(e){ console.warn("AI job plan failed:",e.message); }
  res.json({...parsed,smartPlan:plan});
};


export const reanalyze = async (req,res) => {
  const job=await Job.findById(req.params.id);
  if(!job)return res.status(404).json({message:"Job not found"});
  const parsed=await parseJD(job.description||"");
  job.skills=parsed.skills||[];
  job.mandatorySkills=parsed.mandatorySkills||[];
  job.preferredSkills=parsed.preferredSkills||[];
  job.branches=parsed.branches||[];
  job.minCgpa=parsed.minCgpa||0;
  job.maxBacklogs=parsed.maxBacklogs;
  job.minExperienceMonths=parsed.minExperienceMonths||0;
  job.location=parsed.location||"";
  job.requirementsConfirmed=false;
  await job.save();
  return res.json({message:"JD re-analyzed. Review and confirm the extracted requirements before matching.",job,aiGenerated:true,requiresConfirmation:true});
};
