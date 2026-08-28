import React, { useEffect, useState } from "react";
import { Users, BriefcaseBusiness, CalendarDays, Trophy, AlertTriangle, ShieldCheck, UserRound, PartyPopper } from "lucide-react";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

function PlacementStatusBanner({ profile, interviews }) {
  const status = profile?.placementStatus;
  if (!status || status === "Not Placed") return null;
  const selectedInterview = interviews?.find((i) => i.status === "SELECTED");
  const companyName = selectedInterview?.job?.company?.name || selectedInterview?.job?.title;
  if (status === "Selected") {
    return (
      <div className="panel" style={{ marginBottom: 18, borderColor: "var(--green, #22c55e)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <PartyPopper size={20} color="var(--green, #22c55e)" />
          <h3 style={{ margin: 0 }}>Selected{companyName ? ` — ${companyName}` : ""}!</h3>
        </div>
        <p className="panel-sub">Congratulations — the placement cell has recorded your selection. Check Notifications for the confirmation details.</p>
      </div>
    );
  }
  if (status === "In Process") {
    return (
      <div className="panel" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>Placement status: In process</h3>
        <p className="panel-sub">Your interview has been completed and is awaiting a result from the placement cell.</p>
      </div>
    );
  }
  return null; // "Not Selected" is shown per-interview via Notifications, not as a page-wide banner.
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/analytics/dashboard").then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || "Could not load dashboard"));
    } else {
      Promise.all([api.get("/students/me"), api.get("/jobs"), api.get("/interviews")])
        .then(([p, j, i]) => { setProfile(p.data); setJobs(j.data); setInterviews(i.data); })
        .catch(e => setError(e.response?.data?.message || "Could not load your placement data"));
    }
  }, [user?.role]);

  if (user?.role === "student") {
    return (
      <section className="page">
        <PageHeader eyebrow="Student portal" title={`Welcome, ${user.name}`} description="Track your profile, open opportunities, AI preparation plans and interview schedule." />
        {error && <div className="panel"><span className="error">{error}</span></div>}
        <PlacementStatusBanner profile={profile} interviews={interviews} />
        <div className="stats">
          <DashboardCard title="CGPA" value={profile?.cgpa ?? "—"} note="Academic profile" icon={UserRound} accent="violet" />
          <DashboardCard title="Open jobs" value={jobs.length} note="Available opportunities" icon={BriefcaseBusiness} accent="sky" />
          <DashboardCard title="Applications" value={jobs.filter(j=>j.application?.studentApplied).length} note="Opportunities you applied to" icon={BriefcaseBusiness} accent="amber" />
          <DashboardCard title="Interviews" value={interviews.length} note="Your scheduled interviews" icon={CalendarDays} accent="amber" />
          <DashboardCard title="Readiness" value={profile?.readinessScore != null ? `${profile.readinessScore}%` : "—"} note="Placement readiness" icon={Trophy} accent="green" />
        </div>
        <div className="two-col">
          <div className="panel"><h3>Your profile</h3><p className="panel-sub">{profile?.course || "Course"} · {profile?.branch || "Branch"}</p><p>Skills: {profile?.skills?.join(", ") || "Add your skills during registration."}</p></div>
          <div className="panel"><h3>Placement access</h3><p className="muted">Use My Profile to edit skills, CGPA, backlogs, branch, experience and other criteria. The AI matcher uses the updated data for placement decisions; administrative operations remain restricted to placement administrators.</p></div>
        </div>
      </section>
    );
  }

  const d = data?.stats || {};
  const stages = [
    ["01", "Company Job", d.jobs ?? 0, "JD enters the placement pipeline"],
    ["02", "AI Analysis", d.jobs ?? 0, "Skills and eligibility criteria extracted"],
    ["03", "Eligibility", d.students ?? 0, "Academic, branch and skill rules"],
    ["04", "AI Matching", d.recommended ?? 0, "Candidates ranked with explanations"],
    ["05", "Admin Approval", d.pendingApprovals ?? 0, "Human reviews recommendations"],
    ["06", "Scheduling", d.interviews ?? 0, "Panel, room and slot coordination"],
    ["07", "Notification", d.interviews ?? 0, "Students receive confirmed updates"],
    ["08", "Reporting", d.offers ?? 0, "Outcomes, exceptions and insights"]
  ];

  async function reviewApplication(id, action) {
    try {
      await api.post(`/applications/${id}/${action}`);
      window.location.reload();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  }

  return (
    <section className="page">
      <PageHeader eyebrow="Admin overview" title="Placement command center" description="Operate the full poster workflow from one place: analyze jobs, verify eligibility, rank candidates, approve recommendations, coordinate interviews and monitor outcomes." />
      {error && <div className="panel" style={{ marginBottom: 18 }}><span className="error">{error}</span></div>}

      <div className="stats">
        <DashboardCard title="Students" value={d.students ?? "—"} note="Registered placement pool" icon={Users} accent="violet" />
        <DashboardCard title="Open jobs" value={d.jobs ?? "—"} note="Active company requirements" icon={BriefcaseBusiness} accent="sky" />
        <DashboardCard title="Interviews" value={d.interviews ?? "—"} note="Scheduled / upcoming" icon={CalendarDays} accent="amber" />
        <DashboardCard title="Offers" value={d.offers ?? "—"} note="Recorded selections" icon={Trophy} accent="green" />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-title"><h3>Live agent workflow</h3><span className="badge badge-green">Human-in-the-loop active</span></div>
        <p className="panel-sub">Automation moves work forward, but candidate approval remains an administrator decision.</p>
        <div className="workflow-strip">
          {stages.map(([n, label, count, note], i) => <React.Fragment key={label}>
            <div className="workflow-step">
              <span className="workflow-num">{n}</span>
              <b>{label}</b>
              <strong>{count}</strong>
              <small>{note}</small>
            </div>
            {i < stages.length - 1 && <span className="workflow-arrow">→</span>}
          </React.Fragment>)}
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="section-title"><h3>Pending admin approvals</h3><span className="pill badge-amber">{d.pendingRecommendations?.length || 0}</span></div>
          <p className="panel-sub">AI has ranked these candidates; nothing is scheduled until you approve.</p>
          {d.pendingRecommendations?.length ? d.pendingRecommendations.map(p => <div className="candidate-card" key={p.id}>
            <div><b>{p.student}</b><small>{p.job} · Match {p.score}%</small><small>{p.matchedSkills?.length ? `Matched: ${p.matchedSkills.join(", ")}` : "No matched skills recorded"}</small><small>{p.studentApplied ? "Student applied · " : "AI recommendation · "}{p.applicationSource || "AI_RECOMMENDATION"}</small></div>
            <div style={{ display: "flex", gap: 7 }}><button className="btn" onClick={() => reviewApplication(p.id, "approve")}>Approve &amp; Schedule</button><button className="btn-ghost btn" onClick={() => reviewApplication(p.id, "reject")}>Reject</button></div>
          </div>) : <div className="action"><ShieldCheck size={17}/><span>No AI recommendations are waiting for review.</span></div>}
        </div>

        <div className="panel">
          <div className="section-title"><h3>Exceptions</h3><span className="pill badge-rose">{d.exceptionCount || 0}</span></div>
          <p className="panel-sub">Items the agent could not resolve automatically.</p>
          {d.exceptions?.length ? d.exceptions.map(x => <div className="action" key={x.id}><AlertTriangle size={17}/><span><b>{x.title}</b><br />{x.message}</span></div>) : <div className="action"><ShieldCheck size={17}/><span>No unresolved exceptions.</span></div>}
          {d.pendingInterviews?.length > 0 && <div style={{ marginTop: 12 }}><b>Interview proposals needing review</b>{d.pendingInterviews.map(p => <div className="action" key={p.id}><CalendarDays size={17}/><span>{p.student} · {p.job} — {p.date} {p.time}</span></div>)}</div>}
        </div>
      </div>
    </section>
  );
}
