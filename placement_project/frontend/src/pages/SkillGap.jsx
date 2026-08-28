import React from "react";
import useApiList from "../hooks/useApiList";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";
import { pick } from "../utils/normalize";

function SkillBar({ item }) {
  const label = pick(item, ["skill", "name", "label"], "Skill");
  const value = Number(pick(item, ["gapPercent", "percentage", "score", "value"], 0)) || 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="muted" style={{ fontFamily: "var(--font-mono)" }}>{value}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} /></div>
    </div>
  );
}

export default function SkillGap() {
  const { items, raw, error, loading } = useApiList("/analytics");
  const looksLikeSkills = items && items.length && (items[0].skill || items[0].gapPercent !== undefined || items[0].percentage !== undefined);
  const rawIsPlainObject = raw && !Array.isArray(raw) && (!items || items.length === 0);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Skill gap"
        title="Placement-readiness and skill-gap analytics"
        description="Where the candidate pool falls short of what companies are asking for, aggregated across open jobs."
      />
      {loading && <LoadingGrid count={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && looksLikeSkills && (
        <>
          {raw?.summary && <div className="stats" style={{marginBottom:18}}>
            <div className="stat-card"><div className="stat-top"><span>Students</span></div><strong>{raw.summary.students}</strong><small>Placement pool</small></div>
            <div className="stat-card"><div className="stat-top"><span>Open jobs</span></div><strong>{raw.summary.openJobs}</strong><small>Confirmed requirements</small></div>
            <div className="stat-card"><div className="stat-top"><span>Avg. match</span></div><strong>{raw.summary.averageMatchScore}%</strong><small>Candidate matching</small></div>
            <div className="stat-card"><div className="stat-top"><span>Scheduled</span></div><strong>{raw.summary.scheduledInterviews}</strong><small>Conflict-free interviews</small></div>
          </div>}
          <div className="panel">
            {items.map((s, i) => <SkillBar key={s._id || s.id || i} item={s} />)}
          </div>
        </>
      )}
      {!loading && !error && !looksLikeSkills && rawIsPlainObject && (
        <div className="stats">
          {Object.entries(raw).map(([k, v]) => (
            typeof v !== "object" && (
              <div className="stat-card" key={k}>
                <div className="stat-top"><span>{k}</span></div>
                <strong>{String(v)}</strong>
              </div>
            )
          ))}
        </div>
      )}
      {!loading && !error && !looksLikeSkills && !rawIsPlainObject && items && items.length === 0 && (
        <EmptyState title="No analytics yet" message="Skill-gap data appears once candidates are matched against jobs." />
      )}
      {!loading && !error && !looksLikeSkills && !rawIsPlainObject && items && items.length > 0 && (
        <div className="panel"><DataTable rows={items} /></div>
      )}
    </section>
  );
}
