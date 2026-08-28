import React, { useState } from "react";
import useApiList from "../hooks/useApiList";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import NotificationCard from "../components/NotificationCard";
import DataTable from "../components/DataTable";
import { LoadingGrid, ErrorState, EmptyState } from "../components/StateBlock";

export default function Notifications() {
  const { items: fetched, error, loading } = useApiList("/notifications");
  const [items, setItems] = useState(null);
  const list = items ?? fetched;
  const looksLikeNotifications = list && list.length && (list[0].message || list[0].title || list[0].subject);
  const unreadCount = list?.filter((n) => !n.read).length ?? 0;

  async function markRead(id) {
    setItems((list ?? fetched).map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n)));
    try { await api.post(`/notifications/${id}/read`); } catch { /* optimistic update stands even if this retry fails */ }
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Notifications"
        title="Student and panel communication center"
        description="Every alert the agent has sent to candidates, companies and interview panels."
      >
        {looksLikeNotifications && unreadCount > 0 && (
          <span className="pill badge-sky">{unreadCount} unread</span>
        )}
      </PageHeader>
      {loading && <LoadingGrid count={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && list && list.length === 0 && (
        <EmptyState title="No notifications" message="You're all caught up — nothing has been sent yet." />
      )}
      {!loading && !error && list && list.length > 0 && (
        looksLikeNotifications ? (
          <div className="panel">
            {list.map((n, i) => (
              <div key={n._id || n.id || i} onClick={() => !n.read && (n._id || n.id) && markRead(n._id || n.id)} style={{ cursor: !n.read ? "pointer" : "default" }}>
                <NotificationCard item={n} />
              </div>
            ))}
          </div>
        ) : (
          <div className="panel"><DataTable rows={list} /></div>
        )
      )}
    </section>
  );
}
