import React from "react";
import { CheckCircle2, CircleAlert, Sparkles, XCircle } from "lucide-react";
import { pick } from "../utils/normalize";

export default function MatchCard({ match }) {
  const candidate = pick(match, ["student.name", "candidate.name", "candidateName"], "Candidate");
  const job = pick(match, ["job.title", "jobTitle", "role"], "Role");
  const score = Number(pick(match, ["matchScore", "score"], 0)) || 0;
  const explanation = pick(match, ["explanation", "reason", "notes"], "No explanation available.");
  // The /matching/:jobId response has no nested `eligibility` object - it
  // spreads matchCandidate()'s deterministic fields (cgpaOk, backlogOk,
  // branchOk, experienceOk, hardGaps) directly onto the match record.
  // Derive eligibility from those real facts instead of a field that never
  // exists, which previously made every candidate render as "Eligible".
  const eligible = match.cgpaOk !== false && match.backlogOk !== false &&
    match.branchOk !== false && match.experienceOk !== false &&
    !(match.hardGaps?.length > 0);
  const matched = match.matchedSkills || match.match?.matchedSkills || [];
  const missing = match.missingSkills || match.match?.missingSkills || [];
  const focus = match.interviewFocus || match.match?.interviewFocus || [];
  const aiScore = match.aiScore ?? match.match?.aiScore;
  const status = match.status || "AI_RECOMMENDED";

  return (
    <div className="entity-card" style={{ "--accent": "var(--violet)" }}>
      <div className="entity-card-top">
        <div>
          <h4>{candidate}</h4>
          <div className="sub">for {job}</div>
        </div>
        <span className="pill"><Sparkles size={12} /> {score}% match</span>
      </div>

      <div className="progress-track" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>

      <div className="meta-row">
        <span style={{ color: eligible ? "var(--green)" : "var(--rose)" }}>
          {eligible ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {eligible ? "Eligible" : "Not eligible"}
        </span>
        {aiScore != null && <span><Sparkles size={13} /> AI semantic {aiScore}%</span>}
        <span><CircleAlert size={13} /> {status.replaceAll("_", " ")}</span>
      </div>

      <p className="desc"><b>Why:</b> {explanation}</p>
      {matched.length > 0 && <p className="desc"><b>Matched:</b> {matched.join(", ")}</p>}
      {missing.length > 0 && <p className="desc"><b>Skill gaps:</b> {missing.join(", ")}</p>}
      {focus.length > 0 && <p className="desc"><b>Interview focus:</b> {focus.join(", ")}</p>}
    </div>
  );
}
