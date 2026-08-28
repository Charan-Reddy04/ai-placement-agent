import React from "react";
import { Users, Briefcase } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { pick } from "../utils/normalize";

export default function PanelCard({ panel }) {
  const name = pick(panel, ["name", "panelName"], "Interview panel");
  const job = pick(panel, ["job.title", "jobTitle", "role"]);
  const interviewers = pick(panel, ["interviewers", "members"], []);
  const list = Array.isArray(interviewers)
    ? interviewers.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean).join(", ")
    : String(interviewers);

  return (
    <div className="entity-card" style={{ "--accent": "var(--sky)" }}>
      <div className="entity-card-top">
        <h4>{name}</h4>
        <StatusBadge status={panel.status || "Active"} />
      </div>
      <div className="meta-row">
        {job && <span><Briefcase size={13} /> {job}</span>}
        {list && <span><Users size={13} /> {list}</span>}
      </div>
    </div>
  );
}
