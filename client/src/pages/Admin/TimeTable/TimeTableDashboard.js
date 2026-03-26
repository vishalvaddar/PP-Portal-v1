import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Save, PlusCircle, ChevronRight } from "lucide-react";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs"; 
// Import as 'styles' object
import styles from "./TimeTableDashboard.module.css"; 

const TimeTableDashboard = () => {
  const currentPath = ['Admin', 'Academics', 'Time Table'];
 
  const categories = [
    { title: "1. Active Time Table", link: "active", icon: <Calendar size={32} /> },
    { title: "2. Saved Time Table", link: "saved", icon: <Save size={32} /> },
    { title: "3. Generate Time Table", link: "generate", icon: <PlusCircle size={32} /> }
  ];

  return (
    <div className={styles['tt-dashboard-container']}>
      <Breadcrumbs 
        path={currentPath} 
        nonLinkSegments={['Admin', 'Academics']} 
      />

      <header className={styles['tt-header']}>
        <h1 className={styles['tt-title']}>Time Table Management</h1>
      </header>

      <div className={styles['tt-grid']}>
        {categories.map((item, index) => (
          <Link key={index} to={item.link} className={styles['tt-card']}>
            <div className={styles['tt-icon-container']}>{item.icon}</div>
            <div className={styles['tt-text-content']}>
              <h3 className={styles['tt-card-title']}>{item.title}</h3>
              <p className={styles['tt-card-desc']}>View and manage schedule data</p>
            </div>
            <div className={styles['tt-arrow']}>
              <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TimeTableDashboard;