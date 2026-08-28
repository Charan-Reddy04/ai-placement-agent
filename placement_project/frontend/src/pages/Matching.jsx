import React, { useEffect, useState } from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import MatchCard from "../components/MatchCard";
import DataTable from "../components/DataTable";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";

function SkillGapPlan({ jobId, studentId }) {
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setBusy(true); setError("");
    try { setPlan((await api.post("/skill-gap/generate", { jobId, studentId })).data); }
    catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setBusy(false); }
  }
  if (!plan && !busy && !error) return <button className="btn-ghost btn" style={{ marginTop: 8, width: "100%" }} onClick={load}>AI skill-gap &amp; learning plan</button>;
  return <div className="panel" style={{ marginTop: 8, padding: 12 }}>
    {busy && <small>Generating AI learning plan…</small>}
    {error && <small className="error">{error}</small>}
    {plan && <>
      {plan.missingSkills?.length > 0 && <p className="desc"><b>Missing:</b> {plan.missingSkills.join(", ")}</p>}
      {plan.learningPlan?.length > 0 && <ul style={{ margin: "6px 0 0 18px", fontSize: 13 }}>{plan.learningPlan.map((item, i) => <li key={i}><b>{item.skill}</b> — {item.reason}</li>)}</ul>}
    </>}
  </div>;
}

export default function Matching() {
  const { items: jobs, error: jobsError, loading: jobsLoading } = useApiList("/jobs");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [preferredDates, setPreferredDates] = useState({});
  const [busyId, setBusyId] = useState("");
  const { items: matches, error: matchError, loading: matchLoading } = useApiList(selectedJobId ? `/matching/${selectedJobId}` : null);

  useEffect(() => {
    if (jobs?.length && !selectedJobId) setSelectedJobId(jobs[0]._id);
  }, [jobs, selectedJobId]);

  const items = matches || [];
  const error = jobsError || matchError;
  const loading = jobsLoading || matchLoading;
  const looksLikeMatches = items.length > 0 && (items[0].score !== undefined || items[0].matchScore !== undefined);

  async function approve(applicationId) {
    setBusyId(applicationId);
    try {
      const preferredDate = preferredDates[applicationId] || undefined;
      await api.post(`/applications/${applicationId}/approve`, { preferredDate });
      window.location.reload();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally { setBusyId(""); }
  }

  async function reject(applicationId) {
    setBusyId(applicationId);
    try { await api.post(`/applications/${applicationId}/reject`); window.location.reload(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setBusyId(""); }
  }

  return <section className="page">
    <PageHeader eyebrow="AI matching" title="Rank candidates, explain the score, then approve" description="Eligibility is a hard gate. Matching ranks eligible candidates using factual skill overlap plus optional AI semantic reasoning. The administrator makes the final approval." />

    {!jobsLoading && jobs?.length > 0 && <div className="panel" style={{ marginBottom: 20 }}>
      <label>Select job<select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>{jobs.map(job => <option key={job._id} value={job._id}>{job.title || "Untitled Job"}</option>)}</select></label>
    </div>}

    {loading && <LoadingGrid />}
    {!loading && error && <ErrorState message={error} />}
    {!loading && !error && selectedJobId && items.length === 0 && <EmptyState title="No matches yet" message="Confirm the job requirements first, then the placement pipeline will evaluate the student pool." />}
    {!loading && !error && items.length > 0 && (looksLikeMatches ? <div className="grid">
      {items.map((m, i) => <div key={m.student?._id || m._id || i}>
        <MatchCard match={m} />
        {m.student?._id && <>
          <div className="panel" style={{ marginTop: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <small><b>Workflow:</b> {(m.status || "AI_RECOMMENDED").replaceAll("_", " ")}</small>
              {m.status === "AI_RECOMMENDED" && <span className="badge badge-amber">Human review required</span>}
            </div>
            {m.applicationId && (m.status === "AI_RECOMMENDED" || m.status === "PENDING_ADMIN_APPROVAL") && <>
              <label style={{ display: "block", marginTop: 10 }}>Preferred interview date (optional)
                <input type="date" value={preferredDates[m.applicationId] || ""} onChange={(e) => setPreferredDates(v => ({ ...v, [m.applicationId]: e.target.value }))} />
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn" disabled={busyId === m.applicationId} onClick={() => approve(m.applicationId)}>{busyId === m.applicationId ? "Scheduling…" : "Approve & Schedule"}</button>
                <button className="btn-ghost btn" disabled={busyId === m.applicationId} onClick={() => reject(m.applicationId)}>Reject</button>
              </div>
            </>}
          </div>
          <SkillGapPlan jobId={selectedJobId} studentId={m.student._id} />
        </>}
      </div>)}
    </div> : <div className="panel"><DataTable rows={items} /></div>)}
  </section>;
}
