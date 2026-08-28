import React, { useMemo, useRef, useState } from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import CandidateCard from "../components/CandidateCard";
import DataTable from "../components/DataTable";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";

function ImportSummary({ summary, onClose }) {
  if (!summary) return null;
  const rows = [
    ["Total rows", summary.totalRecords],
    ["Imported (new)", summary.imported],
    ["Updated", summary.updated],
    ["Duplicates", summary.duplicates],
    ["Invalid", summary.invalid],
    ["Missing data (still imported)", summary.missingData]
  ];
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="section-title">
        <h3>Import summary</h3>
        <button className="btn-ghost btn" onClick={onClose}>Dismiss</button>
      </div>
      <div className="auth-grid" style={{ marginBottom: summary.errors?.length ? 12 : 0 }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ padding: "8px 12px", border: "1px solid var(--border, #2a2a2a)", borderRadius: 8 }}>
            <small style={{ display: "block", opacity: 0.7 }}>{label}</small>
            <b>{val}</b>
          </div>
        ))}
      </div>
      {summary.errors?.length > 0 && (
        <details>
          <summary>Row-level issues ({summary.errors.length}{summary.errors.length >= 50 ? "+, showing first 50" : ""})</summary>
          <ul style={{ maxHeight: 200, overflowY: "auto" }}>
            {summary.errors.map((e, i) => <li key={i}><small>{e}</small></li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function Candidates() {
  const { items, error, loading } = useApiList("/students");
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);
  const looksLikeCandidates = items && items.length && (items[0].name || items[0].fullName);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    setImportSummary(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/students/import", form, { headers: { "Content-Type": "multipart/form-data" } });
      setImportSummary(data);
    } catch (err) {
      setImportError(err.response?.data?.message || err.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const filtered = useMemo(() => {
    if (!items) return items;
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) =>
      [c.name, c.fullName, c.branch, c.department].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Candidates"
        title="Student profiles and placement pool"
        description="Everyone registered for this placement cycle, with branch, CGPA and AI match context."
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {looksLikeCandidates && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or branch…"
              className="btn-ghost btn"
              style={{ cursor: "text", minWidth: 220 }}
            />
          )}
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={handleFileSelected} />
          <button className="btn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? "Importing…" : "Import students (Excel/CSV)"}
          </button>
        </div>
      </PageHeader>
      {importError && <ErrorState message={importError} />}
      <ImportSummary summary={importSummary} onClose={() => setImportSummary(null)} />
      {loading && <LoadingGrid />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && items && items.length === 0 && (
        <EmptyState title="No candidates yet" message="Registered students will show up here once added, or import an Excel/CSV file above." />
      )}
      {!loading && !error && items && items.length > 0 && (
        looksLikeCandidates ? (
          <>
            <div className="section-title">
              <h3>Candidate pool</h3>
              <span className="count">{filtered.length} of {items.length}</span>
            </div>
            <div className="grid">
              {filtered.map((c, i) => <CandidateCard key={c._id || c.id || i} candidate={c} onSaved={()=>window.location.reload()} />)}
            </div>
            {filtered.length === 0 && <EmptyState title="No matches" message="Try a different search term." />}
          </>
        ) : (
          <div className="panel"><DataTable rows={items} /></div>
        )
      )}
    </section>
  );
}
