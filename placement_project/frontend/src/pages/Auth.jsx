import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, GraduationCap, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth({ mode = "student" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === "register";
  const isAdmin = mode === "admin";

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", branch: "", course: "B.Tech",
    cgpa: "", backlogs: "0", graduationYear: "", skills: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) {
        const result = await register({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean)
        });
        navigate("/login", { replace: true, state: { registered: true, email: result.email, message: result.message } });
        return;
      } else {
        await login(form.email, form.password, isAdmin ? "admin" : "student");
      }
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><span className="brand-mark">AI</span><div><b>CampusAI</b><small>Placement Agent</small></div></div>
        {location.state?.registered && <div className="auth-success">{location.state.message || "Account created successfully. Please login to continue."}</div>}

        <div className="auth-heading">
          {isAdmin ? <ShieldCheck size={22} /> : isRegister ? <UserPlus size={22} /> : <GraduationCap size={22} />}
          <div>
            <h1>{isAdmin ? "Admin login" : isRegister ? "Create student account" : "Student login"}</h1>
            <p>{isAdmin ? "Placement administrators only." : isRegister ? "Register for the placement portal." : "Access your placement profile and schedules."}</p>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          {isRegister && (
            <>
              <label>Full name<input required value={form.name} onChange={update("name")} placeholder="Your name" /></label>
              <div className="auth-grid">
                <label>Phone<input value={form.phone} onChange={update("phone")} placeholder="Phone number" /></label>
                <label>Branch<input value={form.branch} onChange={update("branch")} placeholder="CSE" /></label>
              </div>
              <div className="auth-grid">
                <label>Course<input value={form.course} onChange={update("course")} placeholder="B.Tech CSE" /></label>
                <label>Graduation year<input type="number" value={form.graduationYear} onChange={update("graduationYear")} placeholder="2028" /></label>
              </div>
              <div className="auth-grid">
                <label>CGPA<input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={update("cgpa")} placeholder="8.5" /></label>
                <label>Backlogs<input type="number" min="0" value={form.backlogs} onChange={update("backlogs")} /></label>
              </div>
              <label>Skills <span className="muted">(comma separated)</span><input value={form.skills} onChange={update("skills")} placeholder="C++, React, SQL, DSA" /></label>
            </>
          )}
          <label>Email<input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Password<input type="password" required minLength={8} value={form.password} onChange={update("password")} placeholder="Minimum 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} /></label>
          <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Login"} <LogIn size={16} /></button>
        </form>

        <div className="auth-links">
          {!isAdmin && !isRegister && <button onClick={() => navigate("/register")}>Create student account</button>}
          {isRegister && <button onClick={() => navigate("/login")}>Already have an account? Login</button>}
          {!isAdmin && <button onClick={() => navigate("/admin-login")}>Admin login</button>}
          {isAdmin && <button onClick={() => navigate("/login")}>Student login</button>}
        </div>
      </div>
    </div>
  );
}
