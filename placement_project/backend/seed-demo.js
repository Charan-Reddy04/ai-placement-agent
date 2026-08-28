/**
 * SAFE end-to-end demo data.
 *
 * This script NEVER deletes users or student profiles.
 * It reuses the existing admin account and every student already in MongoDB.
 * If a friend registers later, authController.register() automatically links
 * the new login to an existing Student record (same email) or creates a new
 * Student record, then refreshes eligibility/matching for all open jobs.
 */
import mongoose from "mongoose";
import { env } from "./config/env.js";
import User from "./models/User.js";
import Student from "./models/Student.js";
import Company from "./models/Company.js";
import Job from "./models/Job.js";
import Eligibility from "./models/Eligibility.js";
import Application from "./models/Application.js";
import Panel from "./models/Panel.js";
import Room from "./models/Room.js";
import Notification from "./models/Notification.js";
import Interview from "./models/Interview.js";
import { parseJD } from "./services/jdParser.js";
import { runPlacementPipeline } from "./services/placementPipeline.js";

await mongoose.connect(env.mongoUri);

const adminEmail = "tyr07@gmail.com";
const admin = await User.findOne({ email: adminEmail });
if (!admin || admin.role !== "admin") {
  throw new Error(`Existing admin account ${adminEmail} was not found. Refusing to create or replace an admin account.`);
}

const students = await Student.find().sort({ createdAt: 1 });
console.log(`Using existing admin: ${admin.email}`);
console.log(`Using ${students.length} existing student profile(s) from MongoDB. No student records will be deleted.`);

const company = await Company.findOneAndUpdate(
  { name: "TechNova Solutions" },
  { $set: { website: "https://technova.example", contactEmail: "hr@technova.example", industry: "Software / IT" } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

const description = `TechNova Solutions is hiring Full Stack Developers for its 2027 graduate hiring program.
Candidates must have strong knowledge of JavaScript, React, Node.js, Express.js, MongoDB and SQL.
Minimum CGPA is 7.5 with no active backlogs. Eligible branches are CSE and IT.
Docker, AWS and Git are preferred. The process contains an online assessment, technical interview and HR interview.`;
const parsed = await parseJD(description);

const job = await Job.findOneAndUpdate(
  { company: company._id, title: "Full Stack Developer" },
  {
    $set: {
      description,
      skills: parsed.skills,
      mandatorySkills: parsed.mandatorySkills,
      preferredSkills: parsed.preferredSkills,
      branches: ["CSE", "IT"],
      minCgpa: 7.5,
      maxBacklogs: 0,
      minExperienceMonths: 0,
      location: "Hyderabad / Hybrid",
      status: "Open",
      requirementsConfirmed: true
    }
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

await Panel.findOneAndUpdate(
  { name: "Technical Panel A" },
  { $set: { members: ["Dr. Ramesh", "Priya Menon", "Suresh Kumar"], specialization: "JavaScript, React, Node.js, Backend Development", availableSlots: ["10:00", "11:00", "14:00", "15:00"] } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await Room.findOneAndUpdate(
  { name: "Lab 2" },
  { $set: { capacity: 30, location: "Main Campus", availableSlots: ["10:00", "11:00", "14:00", "15:00"] } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

// Only placement records belonging to this demo job are reset.
// Student/User data and records for other jobs remain untouched.
await Promise.all([
  Eligibility.deleteMany({ job: job._id }),
  Application.deleteMany({ job: job._id }),
  Interview.deleteMany({ job: job._id })
]);

const pipeline = await runPlacementPipeline(job);
if (pipeline.smartPlan) await Job.findByIdAndUpdate(job._id, { smartPlan: pipeline.smartPlan });

await Notification.create({
  recipient: admin._id,
  recipientType: "user",
  title: "AI recommendations ready",
  message: `The ${job.title} pipeline evaluated ${pipeline.count} current student profile(s). Review ranked candidates before approving anyone.`,
  type: "approval"
});

const applications = await Application.find({ job: job._id }).populate("student").sort({ matchScore: -1 });
const eligibility = await Eligibility.find({ job: job._id }).populate("student");

console.log("\n================ SAFE DEMO READY ================");
console.log(`Company: ${company.name}`);
console.log(`Job: ${job.title}`);
console.log(`Students evaluated: ${students.length}`);
console.log("\nEligibility:");
for (const row of eligibility) console.log(`  ${row.student?.name || "Student"}: ${row.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"} — ${(row.reasons || []).join("; ")}`);
console.log("\nCandidate ranking:");
applications.forEach((a, i) => console.log(`  ${i + 1}. ${a.student?.name || "Student"} — ${a.matchScore}% — ${a.status}`));
console.log("\nImportant: no interview is created by matching. Admin approval is the human gate before scheduling.");
console.log("\nAdmin: tyr07@gmail.com (use the existing password)");
console.log("Friends/new students: use Register -> Login -> Opportunities -> Apply.");
console.log("==================================================\n");

await mongoose.disconnect();
