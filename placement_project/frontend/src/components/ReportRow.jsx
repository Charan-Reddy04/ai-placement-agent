import React from "react";
import { FileText } from "lucide-react";
import { pick } from "../utils/normalize";

export default function ReportRow({ item }) {
  const title = pick(item, ["title", "name"], "Report");
  const description = pick(item, ["description", "summary"], "");
  const date = pick(item, ["date", "createdAt", "generatedAt"]);

  return (
    <div className="list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ color: "var(--violet)", marginTop: 2 }}><FileText size={16} /></span>
        <div>
          <b>{title}</b>
          <small>{description}</small>
        </div>
      </div>
      {date && <span className="muted" style={{ fontSize: 12 }}>{new Date(date).toLocaleDateString?.() || date}</span>}
    </div>
  );
}
