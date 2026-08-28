import React from "react";
import { AlertCircle, Inbox } from "lucide-react";

export function LoadingGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="state-block error">
      <div className="state-icon"><AlertCircle size={20} /></div>
      <h4>Couldn't load this data</h4>
      <p>{message || "Check that the backend is running and reachable, then try again."}</p>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", message }) {
  return (
    <div className="state-block">
      <div className="state-icon"><Inbox size={20} /></div>
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  );
}
