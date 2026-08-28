import React from "react";
import useApiList from "../hooks/useApiList";
import PageHeader from "../components/PageHeader";
import EligibilityRow from "../components/EligibilityRow";
import DataTable from "../components/DataTable";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";

export default function Eligibility() {
  const { items, error, loading } = useApiList("/eligibility");
  const looksLikeEligibility = items && items.length && ("eligible" in items[0] || "status" in items[0]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Eligibility"
        title="Verify academic and branch eligibility"
        description="Automated checks against each job's criteria, before a candidate is surfaced for matching."
      />
      {loading && <LoadingGrid count={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && items && items.length === 0 && (
        <EmptyState title="No eligibility checks yet" message="Checks run automatically once jobs and candidates are linked." />
      )}
      {!loading && !error && items && items.length > 0 && (
        looksLikeEligibility ? (
          <div className="panel">
            {items.map((it, i) => <EligibilityRow key={it._id || it.id || i} item={it} />)}
          </div>
        ) : (
          <div className="panel"><DataTable rows={items} /></div>
        )
      )}
    </section>
  );
}
