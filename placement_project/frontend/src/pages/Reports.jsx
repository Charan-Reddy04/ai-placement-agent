import React, { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";

function Metric({ label, value, note }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span></div><strong>{value}</strong><small>{note}</small></div>;
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/analytics"), api.get("/analytics/audit-log?limit=25")])
      .then(([r, a]) => { setReport(r.data); setAudit(a.data); })
      .catch(e => setError(e.response?.data?.message || e.message || "Could not load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="page"><LoadingGrid count={4} /></section>;
  if (error) return <section className="page"><ErrorState message={error} /></section>;
  if (!report) return <section className="page"><EmptyState title="No reports yet" message="Run the placement pipeline to generate operational metrics." /></section>;

  const s = report.summary || {};
  return <section className="page">
    <PageHeader eyebrow="Reports & impact" title="Placement outcomes and operational intelligence" description="This report mirrors the poster's results section with live pipeline metrics, candidate rankings, skill gaps, exceptions and a traceable admin audit trail." />

    <div className="stats">
      <Metric label="Eligibility pool" value={s.eligibleCandidates ?? 0} note="Candidates passing the current workflow gate" />
      <Metric label="Average match" value={`${s.averageMatchScore ?? 0}%`} note="Across evaluated applications" />
      <Metric label="Scheduled interviews" value={s.scheduledInterviews ?? 0} note="Conflict-free schedules created" />
      <Metric label="Automation coverage" value={`${s.automationCoverage ?? 0}%`} note="Applications evaluated automatically" />
    </div>

    <div className="two-col">
      <div className="panel">
        <div className="section-title"><h3>Expected impact — measured live</h3></div>
        {[
          ["Reduced manual effort", `${s.applications ?? 0} applications evaluated by the pipeline`],
          ["Faster operations", `${s.openJobs ?? 0} active job requirement(s) processed`],
          ["Better candidate matching", `${s.averageMatchScore ?? 0}% average match score`],
          ["Transparent decisions", `${report.topCandidates?.length || 0} ranked recommendations available with explanations`],
          ["Scalable management", `${s.students ?? 0} students across ${s.openJobs ?? 0} open jobs`]
        ].map(([title, text]) => <div className="action" key={title}><span><b>{title}</b><br />{text}</span></div>)}
      </div>

      <div className="panel">
        <div className="section-title"><h3>Application status</h3></div>
        {Object.entries(report.statusBreakdown || {}).length ? Object.entries(report.statusBreakdown).map(([status, count]) => <div className="list-card" key={status}><b>{status.replaceAll("_", " ")}</b><span className="pill">{count}</span></div>) : <p className="muted">No applications yet.</p>}
      </div>
    </div>

    <div className="panel" style={{ marginTop: 18 }}>
      <div className="section-title"><h3>Top candidate ranking</h3><span className="count">Live from matching engine</span></div>
      {report.topCandidates?.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Rank</th><th>Candidate</th><th>Job</th><th>Match</th><th>Status</th><th>Skill gaps</th></tr></thead><tbody>{report.topCandidates.map(c => <tr key={`${c.rank}-${c.candidate}`}><td>#{c.rank}</td><td><b>{c.candidate}</b></td><td>{c.job}</td><td>{c.score}%</td><td>{c.status.replaceAll("_", " ")}</td><td>{c.missingSkills?.join(", ") || "None"}</td></tr>)}</tbody></table></div> : <p className="muted">No ranked candidates yet.</p>}
    </div>

    <div className="two-col">
      <div className="panel">
        <div className="section-title"><h3>Skill-gap analytics</h3></div>
        {report.skillGaps?.length ? report.skillGaps.slice(0, 10).map(g => <div key={g.skill} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>{g.skill}</b><span className="muted">{g.gapPercent}% gap</span></div><div className="progress-track" style={{ marginTop: 5 }}><div className="progress-fill" style={{ width: `${g.gapPercent}%` }} /></div><small className="muted">Demand: {g.demand} job(s) · Available students: {g.available}</small></div>) : <p className="muted">No skill-gap data yet.</p>}
      </div>

      <div className="panel">
        <div className="section-title"><h3>Exceptions</h3></div>
        {report.exceptions?.length ? report.exceptions.map(x => <div className="action" key={x.id}><span><b>{x.title}</b><br />{x.message}</span></div>) : <p className="muted">No unresolved exceptions.</p>}
      </div>
    </div>

    <div className="panel" style={{ marginTop: 18 }}>
      <div className="section-title"><h3>Audit trail</h3><span className="count">Latest 25 events</span></div>
      {audit.length ? <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{audit.map(entry => <li key={entry._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}><b>{entry.action}</b>{entry.targetType ? ` · ${entry.targetType}` : ""}<br /><small className="muted">{entry.actorName || "System"} — {entry.details || ""} — {new Date(entry.createdAt).toLocaleString()}</small></li>)}</ul> : <p className="muted">No audited actions yet.</p>}
    </div>
  </section>;
}
