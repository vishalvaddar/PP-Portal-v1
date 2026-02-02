import React from "react";
import { Link } from "react-router-dom";
import { FileText, GraduationCap, Users, LayoutGrid, ChevronRight } from "lucide-react";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs"; 
import "./ReportsDashboard.css"; 

const ReportsDashboard = () => {
  // Define the path for the breadcrumbs
  const currentPath = ['Admin', 'Academics', 'Reports'];
 
  const categories = [
    { title: "1. Selection Reports", link: "selection", icon: <FileText size={32} /> },
    { title: "2. Academic Reports", link: "academic", icon: <GraduationCap size={32} /> },
    { title: "3. Sammelan Reports", link: "sammelan", icon: <Users size={32} /> },
    { title: "Custom List", link: "custom-lists", icon: <LayoutGrid size={32} /> }
  ];

  return (
    <div className="reports-dashboard-container">
      {/* ADD BREADCRUMBS HERE */}
      <Breadcrumbs 
        path={currentPath} 
        nonLinkSegments={['Admin', 'Academics']} 
      />

      <header className="reports-header">
        <h1 className="reports-title">Reports </h1>
      </header>

      <div className="reports-grid">
        {categories.map((item, index) => (
          <Link key={index} to={item.link} className="report-card">
            <div className="report-icon-container">{item.icon}</div>
            <div className="report-text-content">
              <h3 className="report-card-title">{item.title}</h3>
              <p className="report-card-desc">View and download report data</p>
            </div>
            <div className="report-arrow">
              <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;