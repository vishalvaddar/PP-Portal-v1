// Navbar.js
import React, { useState } from "react";
import { navConfig } from "../../config/navConfig";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.css";
import { MoveLeft, MoveRight } from "lucide-react";

// Map roles from DB to navConfig keys
const roleMap = {
  ADMIN: "admin",
  "BATCH COORDINATOR": "coordinator",
  STUDENT: "student",
  TEACHER: "teacher",
};

const Navbar = () => {
  const { user } = useAuth();
  const roleKey = roleMap[user?.role?.toUpperCase()] || "admin";
  const navItems = navConfig[roleKey] || [];

  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={`navbar${collapsed ? " collapsed" : ""}`}>
      <div className="navbar-top">
        <button
          className="navbar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navbar" : "Collapse navbar"}
          type="button"
        >
          {collapsed ? <MoveRight size={20} /> : <MoveLeft size={20} />}
          <span className={`collapse-text${collapsed ? " hide" : ""}`}>
            Collapse
          </span>
        </button>
      </div>
      <ul>
        {navItems.map((item) => (
          <li key={item.path}>
            <a href={item.path} title={collapsed ? item.label : undefined}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
