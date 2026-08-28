import Student from "../models/Student.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export async function dashboard() {
  const [students, jobs, interviews, recommended, approved, pendingApprovals, exceptionCount, pendingRecommendations, pendingInterviews, exceptions, selected, pendingResults] = await Promise.all([
    Student.countDocuments(),
    Job.countDocuments({ status: "Open" }),
    Interview.countDocuments({ status: { $in: ["SCHEDULED", "APPROVED", "REMINDER_SENT"] } }),
    Application.countDocuments({ status: "AI_RECOMMENDED" }),
    Application.countDocuments({ status: { $in: ["APPROVED", "SCHEDULED"] } }),
    Application.countDocuments({ status: "AI_RECOMMENDED" }),
    Notification.countDocuments({ type: "exception", read: false }),
    Application.find({ status: "AI_RECOMMENDED" }).populate("job student").sort({ matchScore: -1 }).limit(8),
    Interview.find({ status: "PENDING_ADMIN_APPROVAL" }).populate("job student").sort({ date: 1, time: 1 }).limit(5),
    Notification.find({ type: "exception", read: false }).sort({ createdAt: -1 }).limit(5),
    Application.countDocuments({ status: "SELECTED" }),
    Interview.countDocuments({ status: "COMPLETED" })
  ]);

  return {
    students,
    jobs,
    interviews,
    recommended,
    approved,
    offers: selected,
    completedAwaitingResult: pendingResults,
    pendingApprovals,
    pendingRecommendations: pendingRecommendations.map((a) => ({
      id: a._id,
      studentId: a.student?._id,
      student: a.student?.name || "Candidate",
      jobId: a.job?._id,
      job: a.job?.title || "Job",
      score: a.matchScore || 0,
      matchedSkills: a.matchedSkills || [],
      missingSkills: a.missingSkills || [],
      studentApplied: Boolean(a.studentApplied),
      applicationSource: a.applicationSource || "AI_RECOMMENDATION"
    })),
    pendingInterviews: pendingInterviews.map((i) => ({
      id: i._id,
      job: i.job?.title || "Job",
      student: i.student?.name || "Candidate",
      date: i.date,
      time: i.time
    })),
    exceptionCount,
    exceptions: exceptions.map((n) => ({ id: n._id, title: n.title, message: n.message, createdAt: n.createdAt }))
  };
}

export async function auditLog(limit = 50) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 50, 200));
}
