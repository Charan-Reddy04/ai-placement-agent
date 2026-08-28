import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import JobDescription from "./pages/JobDescription";
import Candidates from "./pages/Candidates";
import Matching from "./pages/Matching";
import Eligibility from "./pages/Eligibility";
import Interviews from "./pages/Interviews";
import Panels from "./pages/Panels";
import Rooms from "./pages/Rooms";
import Notifications from "./pages/Notifications";
import SkillGap from "./pages/SkillGap";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

function Shell() {
  return <div className="app-shell"><Sidebar/><main className="main"><Navbar/><Routes>
    <Route path="/" element={<Dashboard/>}/>
    <Route path="/jobs" element={<JobDescription/>}/>
    <Route path="/interviews" element={<Interviews/>}/>
    <Route path="/notifications" element={<Notifications/>}/>

    <Route element={<ProtectedRoute roles={["student"]}/>}>
      <Route path="/profile" element={<Profile/>}/>
    </Route>

    <Route element={<ProtectedRoute roles={["admin"]}/>}>
      <Route path="/companies" element={<Companies/>}/>
      <Route path="/candidates" element={<Candidates/>}/>
      <Route path="/matching" element={<Matching/>}/>
      <Route path="/eligibility" element={<Eligibility/>}/>
      <Route path="/panels" element={<Panels/>}/>
      <Route path="/rooms" element={<Rooms/>}/>
      <Route path="/skills" element={<SkillGap/>}/>
      <Route path="/reports" element={<Reports/>}/>
    </Route>
  </Routes></main></div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="student"/>}/>
      <Route path="/register" element={<Auth mode="register"/>}/>
      <Route path="/admin-login" element={<Auth mode="admin"/>}/>
      <Route element={<ProtectedRoute/>}><Route path="/*" element={<Shell/>}/></Route>
    </Routes>
  );
}
