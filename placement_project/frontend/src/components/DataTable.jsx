import React from "react";

function displayValue(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export default function DataTable({ rows, maxCols = 6 }) {
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]).slice(0, maxCols);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || row._id || i}>
              {columns.map((c) => <td key={c}>{displayValue(row[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
