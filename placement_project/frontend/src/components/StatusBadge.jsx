import React from "react";

const MAP = {
  open: "badge-sky",
  active: "badge-sky",
  scheduled: "badge-amber",
  pending: "badge-amber",
  "pending admin approval": "badge-amber",
  "ai recommended": "badge-amber",
  "in process": "badge-amber",
  "in progress": "badge-amber",
  "reminder sent": "badge-amber",
  eligible: "badge-green",
  selected: "badge-green",
  approved: "badge-green",
  completed: "badge-green",
  offered: "badge-green",
  hired: "badge-green",
  read: "badge-slate",
  closed: "badge-slate",
  "not placed": "badge-slate",
  rejected: "badge-rose",
  "not eligible": "badge-rose",
  "not selected": "badge-rose",
  cancelled: "badge-rose",
  new: "badge-sky",
};

export default function StatusBadge({ status }) {
  const label = status || "Unknown";
  // Enum values across the API use SCREAMING_SNAKE_CASE (e.g. AI_RECOMMENDED,
  // PENDING_ADMIN_APPROVAL, NOT_SELECTED). Normalize underscores to spaces
  // before lookup so every real status hits its themed color instead of
  // silently falling back to grey.
  const cls = MAP[String(label).toLowerCase().replaceAll("_", " ")] || "badge-slate";
  return <span className={`pill ${cls}`}>{label}</span>;
}
