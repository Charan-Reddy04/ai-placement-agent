import React from "react";

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </div>
  );
}
