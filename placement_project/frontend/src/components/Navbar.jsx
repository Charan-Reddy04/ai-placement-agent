import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function initials(name = "Placement Officer") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "PO";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const name = user?.name || "Placement Officer";

  return (
    <header className="navbar">
      <div>
        <span className="eyebrow">Placement Operations</span>
        <h2>AI coordination workspace</h2>
      </div>
      <div className="nav-user">
        <div className="userline">
          <div className="avatar">{initials(name)}</div>
          <div>
            <span className="name">{name}</span>
            <span className="role">{user?.role || "Administrator"}</span>
          </div>
        </div>
        <button onClick={logout}><LogOut size={15} /> Logout</button>
      </div>
    </header>
  );
}
