import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Student from "../models/Student.js";
import { autoSchedule } from "../services/schedulingService.js";
import { createNotification } from "../services/notificationService.js";
import { logAudit } from "../services/auditService.js";

export const list = async (req,res)=>{
  const filter={};
  if(req.query.job)filter.job=req.query.job;
  if(req.query.status)filter.status=req.query.status;
  const rows=await Application.find(filter).populate("job student approvedBy").sort({matchScore:-1,createdAt:-1});
  res.json(rows);
};

export const approve = async(req,res)=>{
  const application=await Application.findById(req.params.id).populate("job student");
  if(!application)return res.status(404).json({message:"Application recommendation not found"});
  if(application.status!=="AI_RECOMMENDED"&&application.status!=="PENDING_ADMIN_APPROVAL")
    return res.status(400).json({message:`Only an AI recommendation awaiting approval can be approved (current: ${application.status}).`});

  application.status="APPROVED";
  application.approvedBy=req.user.id;
  application.approvedAt=new Date();
  application.adminNote=req.body.note||"Approved by placement admin";
  await application.save();

  let interview;
  try{
    interview=await autoSchedule({
      job:application.job,
      student:application.student,
      preferredDate:req.body.preferredDate,
      interviewFocus:application.interviewFocus||[],
      applicationId:application._id
    });
  }catch(e){
    await application.save();
    await createNotification(application.student._id,"Interview scheduling needs review",
      `Your application for ${application.job.title} was approved by the placement cell, but no conflict-free interview slot was available yet.`, "exception");
    await logAudit(req.user,"Candidate approved; scheduling exception","Application",application._id,e.message);
    return res.status(409).json({message:"Candidate approved, but no conflict-free interview slot is currently available.",application,details:e.message});
  }

  application.status="SCHEDULED";
  await application.save();
  await createNotification(application.student._id,"Interview scheduled",
    `Your ${application.job.title} application was approved and your interview is scheduled for ${interview.date} at ${interview.time}.`, "interview");
  await logAudit(req.user,"Candidate approved and interview scheduled","Application",application._id,
    `${application.student.name} - ${application.job.title} - ${interview.date} ${interview.time}`);
  res.json({application,interview});
};

export const reject = async(req,res)=>{
  const application=await Application.findById(req.params.id).populate("job student");
  if(!application)return res.status(404).json({message:"Application not found"});
  if(["SCHEDULED","COMPLETED","SELECTED"].includes(application.status))
    return res.status(400).json({message:"This candidate has already progressed beyond recommendation review."});
  application.status="REJECTED";
  application.rejectedBy=req.user.id;
  application.rejectedAt=new Date();
  application.adminNote=req.body.note||"Rejected by placement admin";
  await application.save();
  await createNotification(application.student._id,"Placement recommendation updated",
    `Your recommendation for ${application.job.title} was not approved by the placement cell.`, "info");
  await logAudit(req.user,"Candidate recommendation rejected","Application",application._id,
    `${application.student.name} - ${application.job.title}. ${application.adminNote}`);
  res.json(application);
};
