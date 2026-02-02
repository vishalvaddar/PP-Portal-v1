import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import styles from "../Admin/AdminDashboard.module.css";
import { 
  Users, FileText, CalendarDays, Plus, Upload, Search, BookOpen, ClipboardList 
} from "lucide-react";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const AdminDashboard = () => {
  const { appliedConfig, loading: configLoading } = useSystemConfig();
  const [dataLoading, setDataLoading] = useState(false);
  
  // Cleaned up state
  const [stats, setStats] = useState({
    applicantCount: 0,
    shortlistedCount: 0,
    selectedCount: 0,
    cohort: { counts: { current_count: 0, previous_count: 0 } }
  });

  const phase = appliedConfig?.phase;
  const year = appliedConfig?.academic_year?.split("-")[0];

  useEffect(() => {
    if (!year) return;

    const fetchDashboardData = async () => {
      setDataLoading(true);
      const api = `${process.env.REACT_APP_BACKEND_API_URL}/api/applicants`;
      
      try {
        if (phase === "Admissions are started") {
          const [resApp, resShort, resSel] = await Promise.all([
            axios.get(`${api}/count`, { params: { year } }),
            axios.get(`${api}/shortlisted/count`, { params: { year } }),
            axios.get(`${api}/selected/count`, { params: { year } })
          ]);
          setStats(s => ({ ...s, 
            applicantCount: resApp.data.count, 
            shortlistedCount: resShort.data.count, 
            selectedCount: resSel.data.count 
          }));
        } 
        else if (phase === "Classes are started") {
          // Only fetch Cohort data now
          const resCohort = await axios.get(`${api}/cohortstudentcount`, { params: { year } });
          setStats(s => ({ ...s, cohort: resCohort.data.data }));
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [year, phase]);

  if (configLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Dashboard ({year})</h1>
      <p>Welcome to Pratibha Poshak IMAS</p>

      <div className={styles.statsGrid}>
        {phase === "Admissions are started" ? (
          <>
            <StatCard title="Total Applications" value={dataLoading ? "..." : stats.applicantCount} icon={<FileText />} />
            <StatCard title="Shortlisted" value={dataLoading ? "..." : stats.shortlistedCount} icon={<Users />} />
            <StatCard title="Selected" value={dataLoading ? "..." : stats.selectedCount} icon={<CalendarDays />} />
          </>
        ) : (
          <>
            <StatCard 
              title="Cohort Students" 
              icon={<Users size={24} />} 
              details={dataLoading ? [
                { label: "9th (Current)", val: "..." },
                { label: "10th (Prev)", val: "..." }
              ] : [
                { 
                  label: "9th (Current)", 
                  val: stats.cohort.counts?.current_count?.toLocaleString() || 0 
                },
                { 
                  label: "10th (Prev)", 
                  val: stats.cohort.counts?.previous_count?.toLocaleString() || 0 
                }
              ]} 
            />
            {/* <StatCard title="Attendance Today" value="92%" icon={<ClipboardList />} /> */}
          </>
        )}
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className={styles.mainGrid}>
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {phase === "Admissions are started" ? (
              <>
                <ActionLink to="/admin/admissions/new-application" title="New Application" icon={<Plus size={18} />} colorClass={styles.blue} />
                <ActionLink to="/admin/admissions/bulk-upload-applications" title="Bulk Upload" icon={<Upload size={18} />} colorClass={styles.green} />
                <ActionLink to="/admin/admissions/search-applications" title="Search Applications" icon={<Search size={18} />} colorClass={styles.purple} />
                <ActionLink to="/admin/admissions/generate-shortlist" title="Generate Shortlist" icon={<Users size={18} />} colorClass={styles.orange} />
              </>
            ) : (
              <>
                <ActionLink to="/admin/academics/students" title="Manage Students" icon={<Users size={18} />} colorClass={styles.blue} />
                {/* <ActionLink to="/admin/academics/classes" title="Manage Classes" icon={<BookOpen size={18} />} colorClass={styles.green} />
                <ActionLink to="/admin/academics/attendance" title="Attendance" icon={<ClipboardList size={18} />} colorClass={styles.purple} /> */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= HELPERS ================= */

const StatCard = ({ title, value, icon, details }) => (
  <div className={styles.statCard}>
    <div className={styles.iconContainer}>{icon}</div>
    <div className={styles.statInfo}>
      <p className={styles.cardTitle}>{title}</p>
      {value !== undefined ? (
        <p className={styles.cardValue}>{value}</p>
      ) : (
        <div className={styles.detailsList}>
          {details?.map((d, i) => (
            <div key={i} className={styles.detailItem}>
              <span>{d.label}:</span> <strong>{d.val}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const ActionLink = ({ to, title, icon, colorClass }) => (
  <Link to={to} className={styles.actionLink}>
    <button className={`${styles.actionButton} ${colorClass}`}>
      {icon}
      <span>{title}</span>
    </button>
  </Link>
);

export default AdminDashboard;