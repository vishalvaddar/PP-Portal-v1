import React from "react";
import { Link } from "react-router-dom";
import styles from "../Admin/AdminDashboard.module.css";
import { UserCheck, FileText, CalendarDays, Plus, Upload, Search, Users} from "lucide-react";

const AdminDashboard = () => {  
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.subheading}>Welcome to Pratibha Poshak Portal - NGO Administrative System</p>

      <div className={styles.statsGrid}>
        <StatCard title="Total Applications" value="2,847" icon={<FileText size={24} />} change="+12%" />
        <StatCard title="Active Students" value="1,245" icon={<UserCheck size={24} />} change="+8%" />
        <StatCard title="Shortlisted" value="456" icon={<Users size={24} />} subtitle="Pending review" />
        <StatCard title="Upcoming Exams" value="3" icon={<CalendarDays size={24} />} subtitle="Next: 15 Nov 2024" />
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link to="/admin/admissions/new-application" className={styles.actionLink}>
              <ActionButton title="New Application" icon={<Plus size={18} />} className={styles.blue} />
            </Link>
            <Link to="/admin/admissions/bulk-upload-applications" className={styles.actionLink}>
              <ActionButton title="Bulk Upload Applications" icon={<Upload size={18} />} className={styles.green} />
            </Link>
            <Link to="/admin/admissions/search-applications" className={styles.actionLink}>
              <ActionButton title="Search Applications" icon={<Search size={18} />} className={styles.purple} />
            </Link>
            <Link to="/admin/admissions/generate-shortlist" className={styles.actionLink}>
              <ActionButton title="Generate Shortlist" icon={<Users size={18} />} className={styles.orange} />
            </Link>
          </div>
        </div>

        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <ul className={styles.activityList}>
            <ActivityItem title="New application submitted" user="Rahul Sharma" status="pending" time="2 hours ago" />
            <ActivityItem title="Shortlist generated" user="Batch 2024-A" status="completed" time="4 hours ago" />
            <ActivityItem title="Interview scheduled" user="Rehan Patel" status="scheduled" time="6 hours ago" />
          </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change, subtitle }) => (
  <div className={styles.statCard}>
    <div className={styles.iconContainer}>{icon}</div>
    <div>
      <p className={styles.cardTitle}>{title}</p>
      <p className={styles.cardValue}>{value}</p>
      {change && <p className={styles.cardChange}>{change} from last month</p>}
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
    </div>
  </div>
);

const ActionButton = ({ title, icon, className }) => (
  <button className={`${styles.actionButton} ${className}`}>
    {icon}
    <span>{title}</span>
  </button>
);

const ActivityItem = ({ title, user, status, time }) => {
  const statusClass = styles[status] || styles.pending;
  return (
    <li className={styles.activityItem}>
      <div>
        <p className={styles.activityTitle}>{title}</p>
        <p className={styles.activityUser}>{user}</p>
      </div>
      <div className={styles.activityRight}>
        <span className={`${styles.statusTag} ${statusClass}`}>{status}</span>
        <p className={styles.activityTime}>{time}</p>
      </div>
    </li>
  );
};

export default AdminDashboard;
