import React from "react";

export default function DashboardCard({ title, value, note, icon: Icon, accent = "violet" }) {
  return (
    <div className="stat-card" style={{ "--accent": `var(--${accent})`, "--accent-soft": `var(--${accent}-soft)` }}>
      <div className="stat-top">
        <span>{title}</span>
        {Icon && <span className="icon-wrap"><Icon size={16} /></span>}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
