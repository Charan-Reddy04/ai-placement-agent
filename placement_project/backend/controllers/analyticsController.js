import Job from "../models/Job.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import Notification from "../models/Notification.js";
import { dashboard, auditLog } from "../services/analyticsService.js";

export const getDashboard = async (req, res) => res.json({ stats: await dashboard() });
export const getAuditLog = async (req, res) => res.json(await auditLog(req.query.limit));

export const getAnalytics = async (req, res) => {
  const [jobs, students, applications, interviews, exceptions] = await Promise.all([
    Job.find({ status: "Open", requirementsConfirmed: true }).populate("company").select("title company skills mandatorySkills"),
    Student.find().select("name branch cgpa skills readinessScore placementStatus"),
    Application.find().populate("job student").sort({ matchScore: -1 }).limit(100),
    Interview.find().populate("job student panel room").sort({ date: 1, time: 1 }),
    Notification.find({ type: "exception" }).sort({ createdAt: -1 }).limit(10)
  ]);

  const demand = new Map();
  const available = new Map();
  for (const job of jobs) {
    for (const skill of job.skills || []) demand.set(skill, (demand.get(skill) || 0) + 1);
  }
  for (const student of students) {
    for (const skill of new Set(student.skills || [])) available.set(String(skill).toLowerCase(), (available.get(String(skill).toLowerCase()) || 0) + 1);
  }

  const skillGaps = [...demand.entries()]
    .map(([skill, jobDemand]) => {
      const count = available.get(String(skill).toLowerCase()) || 0;
      const gapPercent = Math.max(0, Math.round((1 - Math.min(1, count / Math.max(1, students.length))) * 100));
      return { skill, demand: jobDemand, available: count, gapPercent };
    })
    .sort((a, b) => b.demand - a.demand || b.gapPercent - a.gapPercent);

  const statusBreakdown = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const eligibleCount = applications.filter((a) => a.status !== "REJECTED").length;
  const scheduledCount = interviews.filter((i) => ["SCHEDULED", "REMINDER_SENT", "COMPLETED", "SELECTED", "NOT_SELECTED"].includes(i.status)).length;
  const selectedCount = applications.filter((a) => a.status === "SELECTED").length;
  const avgMatch = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + Number(a.matchScore || 0), 0) / applications.length)
    : 0;

  const topCandidates = applications
    .filter((a) => a.student)
    .slice(0, 10)
    .map((a, index) => ({
      rank: index + 1,
      candidate: a.student.name,
      job: a.job?.title || "Job",
      score: a.matchScore || 0,
      status: a.status,
      matchedSkills: a.matchedSkills || [],
      missingSkills: a.missingSkills || []
    }));

  res.json({
    summary: {
      students: students.length,
      openJobs: jobs.length,
      applications: applications.length,
      interviews: interviews.length,
      eligibleCandidates: eligibleCount,
      scheduledInterviews: scheduledCount,
      selectedCandidates: selectedCount,
      averageMatchScore: avgMatch,
      automationCoverage: applications.length ? Math.round((applications.filter((a) => a.matchScore != null).length / applications.length) * 100) : 0
    },
    skillGaps,
    statusBreakdown,
    topCandidates,
    exceptions: exceptions.map((n) => ({ id: n._id, title: n.title, message: n.message, createdAt: n.createdAt })),
    workflow: [
      { key: "job_analysis", label: "Job Analysis", count: jobs.length },
      { key: "eligibility", label: "Eligibility", count: eligibleCount },
      { key: "matching", label: "AI Matching", count: applications.length },
      { key: "approval", label: "Admin Approval", count: statusBreakdown.AI_RECOMMENDED || 0 },
      { key: "scheduling", label: "Scheduling", count: scheduledCount },
      { key: "notification", label: "Notifications", count: interviews.length },
      { key: "reporting", label: "Reporting", count: selectedCount }
    ]
  });
};
