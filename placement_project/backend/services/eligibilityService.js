import { matchSkills } from "./skillService.js";
import { askAI } from "./aiService.js";

export async function checkEligibility(job,student,{explain=true}={}){
  const required=job.mandatorySkills?.length?job.mandatorySkills:(job.skills||[]);
  const skillResult=matchSkills(required,student.skills||[]);
  const branchOk=!job.branches?.length||job.branches.some(b=>String(b).trim().toLowerCase()===String(student.branch||"").trim().toLowerCase());
  const minCgpa=Number(job.minCgpa||0),cgpaOk=!minCgpa||Number(student.cgpa||0)>=minCgpa;
  const maxBacklogs=Number.isFinite(Number(job.maxBacklogs))?Number(job.maxBacklogs):0;
  const backlogOk=Number(student.backlogs||0)<=maxBacklogs;
  const minExperience=Number(job.minExperienceMonths||0),experienceOk=Number(student.experienceMonths||0)>=minExperience;
  const graduationOk=!job.graduationYear||Number(student.graduationYear)===Number(job.graduationYear);
  const reasons=[];
  if(!branchOk)reasons.push(`Branch ${student.branch||"not provided"} is not accepted`);
  if(!cgpaOk)reasons.push(`CGPA ${student.cgpa??"not provided"} is below ${minCgpa}`);
  if(!backlogOk)reasons.push(`Backlogs exceed allowed limit of ${maxBacklogs}`);
  if(!experienceOk)reasons.push(`Experience ${student.experienceMonths||0} months is below required ${minExperience} months`);
  if(!graduationOk)reasons.push(`Graduation year ${student.graduationYear??"not provided"} does not match ${job.graduationYear}`);
  if(skillResult.missing.length)reasons.push(`Missing mandatory skills: ${skillResult.missing.join(", ")}`);
  const eligible=reasons.length===0;
  if(eligible)reasons.push("All mandatory academic, administrative and required-skill criteria are satisfied.");
  const criteria=[branchOk,cgpaOk,backlogOk,experienceOk,graduationOk].filter(Boolean).length;
  const ruleScore=Math.round(criteria/5*30);
  const skillScore=required.length?Math.round(skillResult.matched.length/required.length*70):70;
  const result={eligible,eligibilityScore:Math.min(100,ruleScore+skillScore),reasons,missingSkills:skillResult.missing,matchedSkills:skillResult.matched,
    criteria:{branchOk,cgpaOk,backlogOk,experienceOk,graduationOk,mandatorySkillsOk:skillResult.missing.length===0}};
  if(!explain) return {...result,aiExplanation:"",preparationAdvice:[],aiUsed:false};
  try{
    const ai=await askAI(`Explain this eligibility result without changing it. Mandatory rules are authoritative and all required skills are hard eligibility rules. Return JSON {"summary":"","preparationAdvice":[]}. JOB:${JSON.stringify(job)} CANDIDATE:${JSON.stringify(student)} FACTUAL RESULT:${JSON.stringify(result)}`,{json:true});
    return {...result,aiExplanation:ai?.summary||"",preparationAdvice:ai?.preparationAdvice||[],aiUsed:Boolean(ai)};
  }catch(e){return {...result,aiExplanation:"",preparationAdvice:[],aiUsed:false};}
}
