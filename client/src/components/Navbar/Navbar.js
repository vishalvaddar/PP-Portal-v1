import React, { useState, useEffect } from "react";
import { navConfig } from "../../config/navConfig";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.css";
import { MoveLeft, MoveRight, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom"; // ✅ Added

const roleMap = {
  ADMIN: "admin",
  "BATCH COORDINATOR": "coordinator",
  STUDENT: "student",
  TEACHER: "teacher",
};

const Navbar = ({ isCollapsed, toggleSidebar, navItems }) => {
  const { user } = useAuth();
  const roleKey = roleMap[user?.role?.toUpperCase()] || "admin";
  const navItemsToRender = navItems || navConfig[roleKey];
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState({});

  // ✅ Keep submenu open if current route is inside its children
  useEffect(() => {
    const newState = {};
    navItemsToRender.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          if (location.pathname.startsWith(child.path)) {
            newState[item.label] = true;
          }
        });
      }
    });
    setOpenSubmenus((prev) => ({ ...prev, ...newState }));
  }, [location.pathname, navItemsToRender]);

  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <nav className={`navbar${isCollapsed ? " collapsed" : ""}`}>
      <div className="navbar-top">
        <button
          className="navbar-collapse-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand navbar" : "Collapse navbar"}
          type="button"
        >
          {isCollapsed ? <MoveRight size={20} /> : <MoveLeft size={20} />}
          <span className={`collapse-text${isCollapsed ? " hide" : ""}`}>
            Collapse
          </span>
        </button>
      </div>

      <ul className="nav-list">
        {navItemsToRender.map((item) =>
          item.children ? (
            <li key={item.label} className="submenu">
              <button
                className="submenu-toggle"
                onClick={() => toggleSubmenu(item.label)}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    <span className="submenu-arrow">
                      {openSubmenus[item.label] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  </>
                )}
              </button>

              {!isCollapsed && openSubmenus[item.label] && (
                <ul className="submenu-list">
                  {item.children.map((child) => (
                    <li key={child.path} className="submenu-item">
                      <a href={child.path} title={child.label}>
                        <span className="nav-icon">{child.icon}</span>
                        <span className="nav-label">{child.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <li key={item.path}>
              <a href={item.path} title={isCollapsed ? item.label : undefined}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default Navbar;