import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../Admin/AdminDashboard.module.css";
import { Users, FileText, CalendarDays, BookOpen, ClipboardList } from "lucide-react";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const AdminDashboard = () => {
  const { appliedConfig, loading: configLoading } = useSystemConfig();
  const [dataLoading, setDataLoading] = useState(false);
  const [stats, setStats] = useState({
    applicantCount: 0,
    shortlistedCount: 0,
    selectedCount: 0,
    cohort: { current: 0, previous: 0 }
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
          const res = await axios.get(`${api}/cohortstudentcount`, { params: { year } });
          const classcount = await axios.get(`${api}/today-classes-count`, { params: { year } });
          setStats(s => ({ ...s, cohort: res.data.data, todayClasses: classcount.data.count }));
        }
      } catch (err) {
        console.error("Data Fetch Error:", err);
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
                  label: "9th ", 
                  val: stats.cohort.counts?.current_count?.toLocaleString() || 0 
                },
                { 
                  label: "10th", 
                  val: stats.cohort.counts?.previous_count?.toLocaleString() || 0 
                }
              ]} 
            />
            <StatCard title="Today's Classes" value="12" icon={<BookOpen />} />
            <StatCard title="Attendance" value="92%" icon={<ClipboardList />} />
          </>
        )}
      </div>
    </div>
  );
};

// --- Simple Helper Components ---

const StatCard = ({ title, value, icon, details }) => (
  <div className={styles.statCard}>
    <div className={styles.iconContainer}>{icon}</div>
    <div className={styles.statInfo}>
      <p className={styles.cardTitle}>{title}</p>
      {value ? (
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

export default AdminDashboard;