// The backend's exact response shape can vary by endpoint (a bare array,
// { data: [...] }, { students: [...] }, etc). This pulls out the first
// array it can find so pages don't need to guess the wrapper key.
export function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  const arrKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
  if (arrKey) return payload[arrKey];
  return [];
}

// First defined value among a list of candidate keys/paths on an object.
export function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}
