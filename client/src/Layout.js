// Layout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAuth } from "./contexts/AuthContext";
import { navConfig } from "./config/navConfig";
import "./Layout.css"; 

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth(); // Get user from context

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Determine role, default to 'student' or handle unauthenticated state as needed
  const role = user?.role || "student";
  const navItems = navConfig[role];

  return (
    <div className="layout-wrapper">
      <Header />
      <div className="main-section">
        {/* ✅ Added dynamic class for collapsed sidebar */}
        <div className={`sidebar-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <Navbar
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            navItems={navItems}
          />
        </div>

        {/* ✅ Content margin dynamically adjusts with sidebar */}
        <div className={`content ${isSidebarCollapsed ? 'content-collapsed' : ''}`}>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
