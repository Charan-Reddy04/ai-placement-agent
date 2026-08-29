import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ai-placement-agent-6gtt.onrender.com"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("placement_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
