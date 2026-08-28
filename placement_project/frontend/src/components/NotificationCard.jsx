import React from "react";
import { Bell, BellDot } from "lucide-react";
import { pick } from "../utils/normalize";

export default function NotificationCard({ item }) {
  const title = pick(item, ["title", "subject"], "Notification");
  const message = pick(item, ["message", "body"], "");
  const isUnread = !item.read;

  return (
    <div className="list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ color: isUnread ? "var(--violet)" : "var(--text-faint)", marginTop: 2 }}>
          {isUnread ? <BellDot size={16} /> : <Bell size={16} />}
        </span>
        <div>
          <b>{title}</b>
          <small>{message}</small>
        </div>
      </div>
      <span className={`pill ${isUnread ? "badge-sky" : "badge-slate"}`}>{isUnread ? "New" : "Read"}</span>
    </div>
  );
}
