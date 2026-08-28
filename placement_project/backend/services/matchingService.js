import { askAI } from "./aiService.js";
import { expandSkills, matchSkills, skillEquivalent } from "./skillService.js";

function deterministicMatch(job, student) {
  const skillResult = matchSkills(job.skills || [], student.skills || []);
  const mandatory = matchSkills(job.mandatorySkills || [], student.skills || []);
  const cgpaRequired = Number(job.minCgpa || 0);
  const cgpaProvided = Number(student.cgpa || 0);
  const cgpaOk = !cgpaRequired || cgpaProvided >= cgpaRequired;
const hasBacklogRequirement =
  job.maxBacklogs !== undefined &&
  job.maxBacklogs !== null &&
  job.maxBacklogs !== "";

const backlogOk =
  !hasBacklogRequirement ||
  Number(student.backlogs || 0) <= Number(job.maxBacklogs);
  const branchOk = !job.branches?.length || job.branches.some((b) => String(b).trim().toLowerCase() === String(student.branch || "").trim().toLowerCase());
  const experienceRequired = Number(job.minExperienceMonths || 0);
  const experienceProvided = Number(student.experienceMonths || 0);
  const experienceOk = experienceProvided >= experienceRequired;

  const skillScore = skillResult.required.length
    ? (skillResult.matched.length / skillResult.required.length) * 70
    : 0;
  const criteriaScore = (cgpaOk ? 10 : 0) + (backlogOk ? 10 : 0) + (branchOk ? 5 : 0) + (experienceOk ? 5 : 0);
  const baseScore = Math.round(Math.min(100, skillScore + criteriaScore));

  return {
    score: baseScore,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
    hardGaps: mandatory.missing,
    cgpaOk,
    backlogOk,
    branchOk,
    experienceOk,
    requiredSkills: skillResult.required
  };
}

export async function matchCandidate(job, student) {
  const base = deterministicMatch(job, student);
  let ai = null;

  try {
    ai = await askAI(`You are evaluating a student for a placement job. Use ONLY the supplied facts.
Do not invent skills. Do not treat unrelated skills as matches. A stack alias such as MERN may match its concrete components, but SQL or DSA alone must NOT be treated as React/Node/MongoDB/Express.
Mandatory eligibility rules are authoritative.
Return JSON exactly: {"semanticScore":0,"matchedSkills":[],"missingSkills":[],"strengths":[],"explanation":"","interviewFocus":[]}.
semanticScore must reflect actual overlap and must not exceed 100.
JOB: ${JSON.stringify({title:job.title,skills:job.skills,mandatorySkills:job.mandatorySkills,branches:job.branches,minCgpa:job.minCgpa,maxBacklogs:job.maxBacklogs,minExperienceMonths:job.minExperienceMonths})}
STUDENT: ${JSON.stringify({skills:expandSkills(student.skills),branch:student.branch,cgpa:student.cgpa,backlogs:student.backlogs,experienceMonths:student.experienceMonths})}
DETERMINISTIC FACTS: ${JSON.stringify(base)}`, { json: true });
  } catch (e) {
    console.warn("AI matching fallback:", e.message);
  }

  const aiScore = Number(ai?.semanticScore);
  const boundedAi = Number.isFinite(aiScore) ? Math.max(0, Math.min(100, aiScore)) : base.score;
  // AI is used as a semantic second opinion, but it cannot erase factual skill gaps.
  // Keep the deterministic factual score dominant so a SQL/DSA-only candidate cannot become 100% for a MERN role.
  let score = Math.round(base.score * 0.8 + boundedAi * 0.2);
  // A candidate with missing mandatory skills or a failed hard criterion
  // can still have partial skill overlap worth surfacing - so cap the
  // (possibly AI-inflated) blended score at the uninflated deterministic
  // base score rather than crushing it to one flat number. This stops the
  // AI's semantic opinion from inflating a candidate beyond what the facts
  // support, without discarding a genuinely partial match's signal.
  if (base.hardGaps.length || !base.cgpaOk || !base.backlogOk || !base.branchOk || !base.experienceOk) {
    score = Math.min(score, base.score);
  }
  if (base.requiredSkills.length && base.matchedSkills.length === 0) score = Math.min(score, 25);
  if (base.requiredSkills.length && base.matchedSkills.length < base.requiredSkills.length) score = Math.min(score, 89);

  const matchedSkills = base.matchedSkills;
  const missingSkills = base.missingSkills;
  const explanation = ai?.explanation || `Matched ${matchedSkills.length}/${base.requiredSkills.length} required skills.${missingSkills.length ? ` Missing: ${missingSkills.join(", ")}.` : " All listed skills matched."}`;

  return {
    ...base,
    score,
    aiScore: Number.isFinite(aiScore) ? boundedAi : null,
    matchedSkills,
    missingSkills,
    strengths: Array.isArray(ai?.strengths) ? ai.strengths : matchedSkills,
    interviewFocus: Array.isArray(ai?.interviewFocus) ? ai.interviewFocus : missingSkills,
    explanation,
    aiUsed: Boolean(ai)
  };
}
