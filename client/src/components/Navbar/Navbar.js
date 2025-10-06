import React, { useState, useEffect } from "react";
import { navConfig } from "../../config/navConfig";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MoveLeft, MoveRight, ChevronDown, ChevronRight } from "lucide-react";
import "./Navbar.css";

const roleMap = {
  ADMIN: "admin",
  "BATCH COORDINATOR": "coordinator",
  STUDENT: "student",
  TEACHER: "teacher",
  INTERVIEWER: "interviewer",
};

const Navbar = ({ isCollapsed, toggleSidebar, navItems }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedRole = user?.role?.trim().toUpperCase();
  const roleKey = roleMap[normalizedRole];

  const navItemsToRender =
    navItems && navItems.length > 0 ? navItems : navConfig[roleKey];

  const [openSubmenus, setOpenSubmenus] = useState({});

  useEffect(() => {
    const newState = {};
    navItemsToRender?.forEach((item) => {
      if (
        item.children?.some((child) =>
          location.pathname.startsWith(child.path)
        )
      ) {
        newState[item.label] = true;
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

  const handleAction = (action) => {
    if (action === "logout") {
      logout();
      navigate("/login");
    }
  };

  if (!roleKey || !navItemsToRender) {
    return <div className="navbar">Unauthorized role or no menu found</div>;
  }

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
                      <Link to={child.path} title={child.label}>
                        <span className="nav-icon">{child.icon}</span>
                        <span className="nav-label">{child.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : item.action ? (
            <li key={item.label}>
              <button
                onClick={() => handleAction(item.action)}
                title={isCollapsed ? item.label : undefined}
                className="nav-button"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ) : (
            <li key={item.path}>
              <Link to={item.path} title={isCollapsed ? item.label : undefined}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
