import React from "react";
import { Mail, MapPin, Briefcase } from "lucide-react";
import { pick } from "../utils/normalize";

function initials(name = "") {
  return name.trim().slice(0, 2).toUpperCase() || "CO";
}

export default function CompanyCard({ company }) {
  const name = pick(company, ["name", "companyName"], "Unnamed company");
  const industry = pick(company, ["industry", "sector"]);
  const location = pick(company, ["location", "city", "hq"]);
  const email = pick(company, ["contactEmail", "email"]);
  const jobsCount = pick(company, ["jobsCount", "openJobs", "jobs.length"]);

  return (
    <div className="entity-card" style={{ "--accent": "var(--green)" }}>
      <div className="entity-card-top">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="avatar" style={{ background: "var(--green-soft)", color: "#0A8955" }}>
            {initials(name)}
          </div>
          <div>
            <h4>{name}</h4>
            {industry && <div className="sub">{industry}</div>}
          </div>
        </div>
      </div>
      <div className="meta-row">
        {location && <span><MapPin size={13} /> {location}</span>}
        {email && <span><Mail size={13} /> {email}</span>}
        {jobsCount !== undefined && <span><Briefcase size={13} /> {jobsCount} open roles</span>}
      </div>
    </div>
  );
}
