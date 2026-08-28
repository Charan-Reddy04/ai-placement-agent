import Student from "../models/Student.js";
import { expandSkills } from "../services/skillService.js";
import { refreshStudentAcrossJobs } from "../services/placementPipeline.js";
import { importStudentsFromSpreadsheet } from "../services/csvImportService.js";
import { logAudit } from "../services/auditService.js";

// Fields that feed into eligibility/matching decisions. If any of these
// change, every open job's Eligibility/Application record for this student
// is stale until we recompute it.
const ELIGIBILITY_RELEVANT_FIELDS = ["skills", "branch", "cgpa", "backlogs", "graduationYear", "experienceMonths", "certifications"];

function touchesEligibility(payload) {
  return ELIGIBILITY_RELEVANT_FIELDS.some((key) => payload[key] !== undefined);
}

function sanitizePayload(body = {}) {
  const allowed = ["name","phone","branch","course","cgpa","backlogs","graduationYear","skills","experienceMonths","experienceDetails","certifications","preferredLocations"];
  const out = {};
  for (const key of allowed) if (body[key] !== undefined) out[key] = body[key];
  if (out.skills !== undefined) out.skills = expandSkills(out.skills);
  if (out.certifications !== undefined && !Array.isArray(out.certifications)) out.certifications = String(out.certifications).split(",").map(x=>x.trim()).filter(Boolean);
  if (out.preferredLocations !== undefined && !Array.isArray(out.preferredLocations)) out.preferredLocations = String(out.preferredLocations).split(",").map(x=>x.trim()).filter(Boolean);
  for (const key of ["cgpa","backlogs","graduationYear","experienceMonths"]) if (out[key] === "" || out[key] == null) delete out[key];
  return out;
}

export const me = async (req,res) => {
  const student = await Student.findOne({user:req.user.id});
  if (!student) return res.status(404).json({message:"Student profile not found"});
  res.json(student);
};

export const list = async (req,res) => res.json(await Student.find().sort({createdAt:-1}));

export const create = async (req,res) => {
  const student = await Student.create(sanitizePayload(req.body));
  res.status(201).json(student);
  try { await refreshStudentAcrossJobs(student); }
  catch (e) { console.warn(`Eligibility refresh failed for student ${student._id}:`, e.message); }
};

export const updateMe = async (req,res) => {
  const payload = sanitizePayload(req.body);
  const student = await Student.findOneAndUpdate({user:req.user.id}, payload, {new:true,runValidators:true});
  if (!student) return res.status(404).json({message:"Student profile not found"});
  // Recompute eligibility/matching/interviews for this student against every
  // open job BEFORE responding, so the moment the student sees "profile
  // saved" their Eligibility/Matching records are already correct - not a
  // stale snapshot from before they added the skill.
  if (touchesEligibility(payload)) {
    try { await refreshStudentAcrossJobs(student); }
    catch (e) { console.warn(`Eligibility refresh failed for student ${student._id}:`, e.message); }
  }
  res.json(student);
};

export const updateByAdmin = async (req,res) => {
  const payload = sanitizePayload(req.body);
  const student = await Student.findByIdAndUpdate(req.params.id, payload, {new:true,runValidators:true});
  if (!student) return res.status(404).json({message:"Student not found"});
  if (touchesEligibility(payload)) {
    try { await refreshStudentAcrossJobs(student); }
    catch (e) { console.warn(`Eligibility refresh failed for student ${student._id}:`, e.message); }
  }
  res.json(student);
};

// Excel/CSV bulk import (spec section 1). Excel is never the source of
// truth after this: every accepted row is written straight into MongoDB
// through the same Student model/expandSkills pipeline manual entry uses.
export const importCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded. Attach a .csv, .xlsx or .xls file as 'file'." });

  const { summary, created, updated } = await importStudentsFromSpreadsheet(req.file.buffer, req.file.originalname);

  res.status(201).json({
    totalRecords: summary.total,
    imported: summary.imported,
    updated: summary.updated,
    duplicates: summary.duplicates,
    invalid: summary.invalid,
    missingData: summary.missingData,
    errors: summary.errors.slice(0, 50)
  });

  await logAudit(req.user, "Bulk student import", "Student", null, `${summary.imported} imported, ${summary.updated} updated, ${summary.invalid} invalid, ${summary.duplicates} duplicate, from ${summary.total} rows`);

  // Recompute eligibility/matching for every open job against every
  // imported/updated student, in the background, so the dashboard/matching
  // pages reflect the new pool without the admin waiting on the request.
  for (const student of [...created, ...updated]) {
    try { await refreshStudentAcrossJobs(student); }
    catch (e) { console.warn(`Eligibility refresh failed for imported student ${student._id}:`, e.message); }
  }
};
