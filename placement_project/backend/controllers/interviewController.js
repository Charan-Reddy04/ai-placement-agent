import Interview from "../models/Interview.js";
import Student from "../models/Student.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { autoSchedule } from "../services/schedulingService.js";
import { runSchedulingAgent as createSchedule } from "../agents/schedulingAgent.js";
import { askAI } from "../services/aiService.js";
import { createNotification } from "../services/notificationService.js";
import { logAudit } from "../services/auditService.js";

export const list=async(req,res)=>{
  if(req.user.role==="admin")return res.json(await Interview.find().populate("job student panel room application").sort({date:1,time:1}));
  const student=await Student.findOne({user:req.user.id}).select("_id");
  if(!student)return res.status(404).json({message:"Student profile not found"});
  res.json(await Interview.find({student:student._id}).populate("job panel room application").sort({date:1,time:1}));
};

export const create=async(req,res)=>res.status(201).json(await createSchedule(req.body));
export const auto=async(req,res)=>{
  const {jobId,studentId,preferredDate,applicationId}=req.body;
  const [job,student]=await Promise.all([Job.findById(jobId),Student.findById(studentId)]);
  if(!job||!student)return res.status(404).json({message:"Job or student not found"});
  const interview=await autoSchedule({job,student,preferredDate,applicationId});
  res.status(201).json(interview);
};

export const plan=async(req,res)=>{
  if(req.user.role!=="admin"){
    const own=await Student.findOne({user:req.user.id}).select("_id");
    if(!own||String(own._id)!==String(req.body.studentId))return res.status(403).json({message:"You can only request a prep plan for your own interviews"});
  }
  const [job,student]=await Promise.all([Job.findById(req.body.jobId),Student.findById(req.body.studentId)]);
  if(!job||!student)return res.status(404).json({message:"Job or student not found"});
  const result=await askAI(`Create a personalized interview preparation plan using only supplied facts. Return JSON {"rounds":[],"technicalTopics":[],"hrQuestions":[],"focusAreas":[],"tips":[],"sevenDayPlan":[]}. JOB:${JSON.stringify(job)} CANDIDATE:${JSON.stringify(student)}`,{json:true});
  res.json(result||{rounds:[],technicalTopics:[],hrQuestions:[],focusAreas:[],tips:[],sevenDayPlan:[]});
};

export const approve=async(req,res)=>{
  const interview=await Interview.findById(req.params.id).populate("job student panel room");
  if(!interview)return res.status(404).json({message:"Interview not found"});
  if(!["PENDING_ADMIN_APPROVAL","Pending Approval"].includes(interview.status))
    return res.status(400).json({message:`Only a pending interview can be approved (current: ${interview.status}).`});
  interview.status="SCHEDULED";interview.approvalNote=req.body.note||"Approved by placement admin";await interview.save();
  if(interview.application)await Application.findByIdAndUpdate(interview.application,{status:"SCHEDULED"});
  await createNotification(interview.student._id,"Interview scheduled",`Your ${interview.job.title} interview is confirmed for ${interview.date} at ${interview.time}.`,"interview");
  await logAudit(req.user,"Interview approved","Interview",interview._id,`${interview.student.name} - ${interview.job.title}`);
  res.json(interview);
};

export const reject=async(req,res)=>{
  const interview=await Interview.findById(req.params.id).populate("job student");
  if(!interview)return res.status(404).json({message:"Interview not found"});
  interview.status="REJECTED";interview.approvalNote=req.body.note||"Rejected by placement admin";await interview.save();
  if(interview.application)await Application.findByIdAndUpdate(interview.application,{status:"APPROVED"});
  await createNotification(interview.student._id,"Interview schedule changed",`Your ${interview.job.title} interview proposal was rejected. Placement staff will review another slot.`,"exception");
  await logAudit(req.user,"Interview rejected","Interview",interview._id,`${interview.student.name} - ${interview.job.title}`);
  res.json(interview);
};

export const complete=async(req,res)=>{
  const interview=await Interview.findById(req.params.id).populate("job student");
  if(!interview)return res.status(404).json({message:"Interview not found"});
  if(!["SCHEDULED","APPROVED","REMINDER_SENT"].includes(interview.status))
    return res.status(400).json({message:`Only a scheduled interview can be completed (current: ${interview.status}).`});
  interview.status="COMPLETED";interview.approvalNote=req.body.note||interview.approvalNote;await interview.save();
  if(interview.application)await Application.findByIdAndUpdate(interview.application,{status:"COMPLETED"});
  await Student.findByIdAndUpdate(interview.student._id,{placementStatus:"In Process"});
  await logAudit(req.user,"Interview completed","Interview",interview._id,`${interview.student.name} - ${interview.job.title}`);
  res.json(interview);
};

export const setResult=async(req,res)=>{
  // Normalize "Not Selected" / "not-selected" / "NOT SELECTED" etc. to the
  // enum's NOT_SELECTED so the frontend's human-readable label always matches.
  const result=String(req.body.result||"").trim().toUpperCase().replace(/[\s-]+/g,"_"),note=req.body.note;
  if(!["SELECTED","NOT_SELECTED"].includes(result))return res.status(400).json({message:"result must be Selected or Not Selected"});
  const interview=await Interview.findById(req.params.id).populate("job student");
  if(!interview)return res.status(404).json({message:"Interview not found"});
  if(interview.status!=="COMPLETED")return res.status(400).json({message:`Only a Completed interview can get a result (current: ${interview.status}).`});
  interview.status=result;interview.approvalNote=note||interview.approvalNote;await interview.save();
  if(interview.application)await Application.findByIdAndUpdate(interview.application,{status:result});
  await Student.findByIdAndUpdate(interview.student._id,{placementStatus:result==="SELECTED"?"Selected":"Not Selected"});
  await createNotification(interview.student._id,result==="SELECTED"?"You've been selected!":"Interview result",
    result==="SELECTED"?`Congratulations! You have been selected for ${interview.job.title}.`:`Your interview result for ${interview.job.title} is not selected this time. Check Skill Gap for improvement areas.`,
    result==="SELECTED"?"success":"info");
  await logAudit(req.user,`Candidate ${result}`,"Interview",interview._id,`${interview.student.name} - ${interview.job.title}`);
  res.json(interview);
};
