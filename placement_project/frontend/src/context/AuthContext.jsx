import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("placement_user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("placement_token")));

  useEffect(() => {
    const token = localStorage.getItem("placement_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("placement_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("placement_token");
        localStorage.removeItem("placement_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password, type = "student") {
    const endpoint = type === "admin" ? "/auth/admin-login" : "/auth/student-login";
    const { data } = await api.post(endpoint, { email, password });
    localStorage.setItem("placement_token", data.token);
    localStorage.setItem("placement_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    return data;
  }

  function logout() {
    localStorage.removeItem("placement_token");
    localStorage.removeItem("placement_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
