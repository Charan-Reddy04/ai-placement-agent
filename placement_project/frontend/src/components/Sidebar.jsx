import React from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, BriefcaseBusiness, Users, Sparkles, ShieldCheck,
  CalendarDays, PanelsTopLeft, DoorOpen, Bell, BarChart3, FileText, UserRound
} from "lucide-react";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/profile", "My Profile", UserRound],
  ["/companies", "Companies", Building2],
  ["/jobs", "Job Descriptions", BriefcaseBusiness],
  ["/candidates", "Candidates", Users],
  ["/matching", "AI Matching", Sparkles],
  ["/eligibility", "Eligibility", ShieldCheck],
  ["/interviews", "Interviews", CalendarDays],
  ["/panels", "Panels", PanelsTopLeft],
  ["/rooms", "Rooms", DoorOpen],
  ["/notifications", "Notifications", Bell],
  ["/skills", "Skill Gap", BarChart3],
  ["/reports", "Reports", FileText]
];

export default function Sidebar() {
  const { user } = useAuth();
  // "/profile" resolves to the student profile API (GET/PUT /students/me),
  // which is student-only server-side — never show it to an admin account,
  // which has no Student document and would just hit a 403.
  const visibleLinks = user?.role === "student"
    ? links.filter(([to]) => ["/", "/profile", "/jobs", "/interviews", "/notifications"].includes(to))
    : links.filter(([to]) => to !== "/profile");
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AI</div>
        <div><b>CampusAI</b><small>Placement Agent</small></div>
      </div>
      <nav>
        {visibleLinks.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
            <Icon size={18} /><span>{user?.role === "student" && to === "/jobs" ? "Opportunities" : label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="agent-pulse" />
        <span>Agent active · monitoring pipeline</span>
      </div>
    </aside>
  );
}
