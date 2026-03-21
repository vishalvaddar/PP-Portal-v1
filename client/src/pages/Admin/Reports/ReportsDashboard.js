import React from "react";
import { Link } from "react-router-dom";
import { FileText, GraduationCap, Users, LayoutGrid, ChevronRight } from "lucide-react";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs"; 
import "./ReportsDashboard.css"; 

const ReportsDashboard = () => {
  const currentPath = ['Admin', 'Academics', 'Reports'];

  const categories = [
    { 
      title: "1. Selection Reports", 
      link: "selection", 
      icon: <FileText size={32} />, 
      desc: "Detailed list of shortlisted candidates and selection status." 
    },
    { 
      title: "2. Academic Reports", 
      link: "academic", 
      icon: <GraduationCap size={32} />, 
      desc: "Student performance tracking and examination results." 
    },
    { 
      title: "3. Sammelan Reports", 
      link: "sammelan", 
      icon: <Users size={32} />, 
      desc: "Attendance and feedback data from community meetups." 
    },
    { 
      title: "Custom List", 
      link: "custom-lists", 
      icon: <LayoutGrid size={32} />, 
      desc: "Generate your own reports with custom filters." 
    }
  ];

  return (
    <div className="reports-dashboard-container">
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Academics']} />

      <header className="reports-header">
        <h1 className="reports-title">Reports Dashboard</h1>
      </header>

      <div className="reports-grid">
        {categories.map((item, index) => (
          <div key={index} className="report-card-wrapper">
            <Link to={item.link} className="report-card">
              <div className="report-icon-container">{item.icon}</div>
              <div className="report-text-content">
                <h3 className="report-card-title">{item.title}</h3>
                {/* Individual Description for each box */}
                <p className="report-card-desc">{item.desc}</p>
              </div>
            </Link>
            
           
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;