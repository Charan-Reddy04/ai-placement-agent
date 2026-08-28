import Student from "../models/Student.js";
import Job from "../models/Job.js";
import { askAI } from "../services/aiService.js";
export const generate=async(req,res)=>{
 const student=await Student.findById(req.body.studentId);
 const job=await Job.findById(req.body.jobId);
 if(!student||!job)return res.status(404).json({message:"Student or job not found"});
 const result=await askAI(`Analyze skill gaps for this student targeting this job. Return JSON {"currentSkills":[],"missingSkills":[],"priorityOrder":[],"learningPlan":[{"skill":"","reason":"","practice":[]}],"interviewPreparation":[]}.
Student:${JSON.stringify(student)} Job:${JSON.stringify(job)}`,{json:true});
 res.json(result||{currentSkills:student.skills,missingSkills:[],priorityOrder:[],learningPlan:[],interviewPreparation:[]});
};
