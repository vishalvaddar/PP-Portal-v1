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
        <div className="sidebar-container">
          <Navbar
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            navItems={navItems} // Pass navItems to Navbar
          />
        </div>
        <div className={`content ${isSidebarCollapsed ? 'content-collapsed' : ''}`}>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
