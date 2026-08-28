import { useEffect, useState } from "react";
import api from "../services/api";
import { extractList } from "../utils/normalize";

// Fetches `path`, tracks loading/error, and normalizes the response into
// a plain array (`items`) while still exposing the raw payload (`raw`)
// for pages that want to read extra fields (e.g. summary stats).
export default function useApiList(path) {
  const [items, setItems] = useState(null);
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!path) { setLoading(false); setItems([]); setRaw(null); return () => {}; }
    setLoading(true);
    setError("");
    api
      .get(path)
      .then((r) => {
        if (cancelled) return;
        setRaw(r.data);
        setItems(extractList(r.data));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.response?.data?.message || e.message || "Could not load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { items, raw, error, loading };
}
