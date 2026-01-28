import React from "react";
import { Link } from "react-router-dom";
import styles from "../Admin/AdminDashboard.module.css";
import {
  UserCheck,
  FileText,
  CalendarDays,
  Plus,
  Upload,
  Search,
  Users,
  BookOpen,
  ClipboardList
} from "lucide-react";

import { useSystemConfig } from "../../contexts/SystemConfigContext";

const AdminDashboard = () => {

  const { appliedConfig, loading } = useSystemConfig();

  const phase = appliedConfig?.phase;

  if (loading) {
    return <div className={styles.loading}>Loading system configuration...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.subheading}>
        Welcome to RCF-Pratibha Poshak - IMAS Portal
      </p>

      {/* ================= STATS ================= */}

      {phase === "Admissions are started" && (
        <div className={styles.statsGrid}>
          <StatCard title="Total Applications" value="2,847" icon={<FileText size={24} />} />
          <StatCard title="Active Students" value="1,245" icon={<UserCheck size={24} />} />
          <StatCard title="Shortlisted" value="456" icon={<Users size={24} />} />
          <StatCard title="Upcoming Exams" value="3" icon={<CalendarDays size={24} />} />
        </div>
      )}

      {phase === "Classes are started" && (
        <div className={styles.statsGrid}>
          <StatCard title="Total Students" value="1,245" icon={<Users size={24} />} />
          <StatCard title="Active Classes" value="12" icon={<BookOpen size={24} />} />
          <StatCard title="Attendance Today" value="92%" icon={<ClipboardList size={24} />} />
        </div>
      )}

      {/* ================= QUICK ACTIONS ================= */}

      <div className={styles.mainGrid}>
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>

          <div className={styles.actionsGrid}>

            {/* ===== ADMISSIONS PHASE ===== */}

            {phase === "Admissions are started" && (
              <>
                <Link to="/admin/admissions/new-application" className={styles.actionLink}>
                  <ActionButton title="New Application" icon={<Plus size={18} />} className={styles.blue} />
                </Link>

                <Link to="/admin/admissions/bulk-upload-applications" className={styles.actionLink}>
                  <ActionButton title="Bulk Upload" icon={<Upload size={18} />} className={styles.green} />
                </Link>

                <Link to="/admin/admissions/search-applications" className={styles.actionLink}>
                  <ActionButton title="Search Applications" icon={<Search size={18} />} className={styles.purple} />
                </Link>

                <Link to="/admin/admissions/generate-shortlist" className={styles.actionLink}>
                  <ActionButton title="Generate Shortlist" icon={<Users size={18} />} className={styles.orange} />
                </Link>
              </>
            )}

            {/* ===== CLASSES PHASE ===== */}

            {phase === "Classes are started" && (
              <>
                <Link to="/admin/students" className={styles.actionLink}>
                  <ActionButton title="Manage Students" icon={<Users size={18} />} className={styles.blue} />
                </Link>

                <Link to="/admin/classes" className={styles.actionLink}>
                  <ActionButton title="Manage Classes" icon={<BookOpen size={18} />} className={styles.green} />
                </Link>

                <Link to="/admin/attendance" className={styles.actionLink}>
                  <ActionButton title="Attendance" icon={<ClipboardList size={18} />} className={styles.purple} />
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};


/* ================= SMALL COMPONENTS ================= */

const StatCard = ({ title, value, icon }) => (
  <div className={styles.statCard}>
    <div className={styles.iconContainer}>{icon}</div>
    <div>
      <p className={styles.cardTitle}>{title}</p>
      <p className={styles.cardValue}>{value}</p>
    </div>
  </div>
);

const ActionButton = ({ title, icon, className }) => (
  <button className={`${styles.actionButton} ${className}`}>
    {icon}
    <span>{title}</span>
  </button>
);

export default AdminDashboard;
