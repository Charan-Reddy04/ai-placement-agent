import React, { useState } from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import CompanyCard from "../components/CompanyCard";
import DataTable from "../components/DataTable";
import {
  LoadingGrid,
  ErrorState,
  EmptyState,
} from "../components/StateBlock";
import { useAuth } from "../context/AuthContext";

export default function Companies() {
  const { user } = useAuth();

  const {
    items,
    error,
    loading,
  } = useApiList("/companies");

  const [form, setForm] = useState({
    name: "",
    website: "",
    contactEmail: "",
    industry: "",
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function add(e) {
    e.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      await api.post("/companies", form);

      setMessage("Company added successfully.");

      setForm({
        name: "",
        website: "",
        contactEmail: "",
        industry: "",
      });

      // Reload the React page so the newly added company
      // appears in the companies list.
      window.location.reload();
    } catch (e) {
      setMessage(
        e.response?.data?.message ||
          e.message ||
          "Failed to add company."
      );
    } finally {
      setBusy(false);
    }
  }

  const looks =
    items &&
    items.length &&
    (items[0].name || items[0].companyName);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Companies"
        title="Company management"
        description="Admins can add recruiters; the AI pipeline evaluates their jobs automatically."
      />

      {user?.role === "admin" && (
        <form
          onSubmit={add}
          className="panel"
          style={{
            display: "grid",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <h3>Add company</h3>

          <div className="auth-grid">
            <input
              required
              placeholder="Company name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Industry"
              value={form.industry}
              onChange={(e) =>
                setForm({
                  ...form,
                  industry: e.target.value,
                })
              }
            />
          </div>

          <div className="auth-grid">
            <input
              placeholder="Website"
              value={form.website}
              onChange={(e) =>
                setForm({
                  ...form,
                  website: e.target.value,
                })
              }
            />

            <input
              type="email"
              placeholder="Recruiter email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactEmail: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={busy}
          >
            {busy ? "Adding…" : "Add company"}
          </button>

          {message && <small>{message}</small>}
        </form>
      )}

      {loading && <LoadingGrid />}

      {!loading && error && (
        <ErrorState message={error} />
      )}

      {!loading &&
        !error &&
        items &&
        items.length === 0 && (
          <EmptyState
            title="No companies yet"
            message="Add a company above."
          />
        )}

      {!loading &&
        !error &&
        items &&
        items.length > 0 &&
        (looks ? (
          <div className="grid">
            {items.map((company, index) => (
              <CompanyCard
                key={company._id || index}
                company={company}
              />
            ))}
          </div>
        ) : (
          <div className="panel">
            <DataTable rows={items} />
          </div>
        ))}
    </section>
  );
}
