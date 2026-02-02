import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ClipboardCheck, 
  UserCheck, 
  BarChart,   
  ChevronRight, 
  CheckCircle2, 
  Clock,
  SearchX 
} from "lucide-react";
import { useSystemConfig } from "../../../contexts/SystemConfigContext"; 
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs";
import styles from "./EvaluationDashboard.module.css";

const NavCard = ({ title, icon, description, link, colorClass }) => (
  <Link to={link} className={`${styles.navCard} ${styles[colorClass]}`}>
    <div className={styles.navIcon}>{icon}</div>
    <div className={styles.navContent}>
      <h3 className={styles.navTitle}>{title}</h3>
      <p className={styles.navDesc}>{description}</p>
    </div>
    <ChevronRight size={20} className={styles.navArrow} />
  </Link>
);

const EvaluationDashboard = () => {
  const { appliedConfig, loading: configLoading } = useSystemConfig();
  const [overallData, setOverallData] = useState({});
  const [jurisdictions, setJurisdictions] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Phase Blocking Logic ---
  const isClassesStarted = useMemo(() => {
    return !configLoading && appliedConfig?.phase?.trim() === "Classes are started";
  }, [appliedConfig, configLoading]);

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/evaluation-dashboard`;

  const displayYear = useMemo(() => {
    if (appliedConfig?.academic_year) {
      return appliedConfig.academic_year.split('-')[0];
    }
    return new Date().getFullYear().toString();
  }, [appliedConfig]);

  useEffect(() => {
    // 🔥 Prevent fetching stats if classes have started
    if (isClassesStarted) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ovRes, jurRes, progRes] = await Promise.all([
          fetch(`${API_BASE_URL}/overall/${displayYear}`),
          fetch(`${API_BASE_URL}/jurisdictions/${displayYear}`),
          fetch(`${API_BASE_URL}/overall-progress/${displayYear}`)
        ]);

        if (!ovRes.ok || !jurRes.ok || !progRes.ok) {
          throw new Error("Data retrieval failed.");
        }

        const ovData = await ovRes.json();
        const jurData = await jurRes.json();
        const progData = await progRes.json();

        setOverallData(ovData);
        setJurisdictions(jurData);
        setOverallProgress(progData.overallProgress || 0);
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (displayYear) fetchData();
  }, [displayYear, API_BASE_URL, isClassesStarted]);

  if (loading || configLoading) return <div className={styles.loader}><span>Syncing System Status...</span></div>;

  return (
    <main className={styles.container}>
      <Breadcrumbs path={['Admin', 'Admissions', 'Evaluation']} nonLinkSegments={['Admin', 'Admissions']} />

      <header className={styles.header}>
        <div className={styles.welcome}>
          <h1 className={styles.title}>Evaluation Dashboard</h1>
          <p className={styles.subtitle}>Academic Cycle: {displayYear}-{parseInt(displayYear) + 1}</p>
        </div>
        
        {/* 🔥 HIDE Overall Progress if Classes Started */}
        {!isClassesStarted && (
          <div className={styles.progressCard}>
            <div className={styles.progressInfo}>
              <span className={styles.progressLabel}>Total Completion</span>
              <span className={styles.progressPercent}>{overallProgress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        )}
      </header>

      <section className={styles.gridSection}>
        {/* Navigation Cards - ALWAYS KEEP THESE */}
        <div className={styles.cardRow}>
          <NavCard title="Marks Entry" icon={<ClipboardCheck size={28} />} description="Update academic scoring" link="marks-entry" colorClass="blueCard" />
          <NavCard title="Interviews" icon={<UserCheck size={28} />} description="Manage panel evaluations" link="interview" colorClass="purpleCard" />
          <NavCard title="Tracking" icon={<BarChart size={28} />} description="Live status reports" link="tracking" colorClass="orangeCard" />
        </div>

        {/* 🔥 HIDE Content if Classes Started */}
        {isClassesStarted ? (
          <div className="mt-10 p-12 bg-white rounded-2xl border border-gray-200 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Live Statistics Unavailable</h2>
            <p className="text-gray-500 mt-2">
              Detailed progress tracking and jurisdictional counts are disabled as the 
              <span className="font-bold text-red-600"> Classes Started </span> phase has commenced.
            </p>
          </div>
        ) : (
          <>
            {/* Dynamic Stats Row */}
            <div className={styles.statsGrid}>
              {Object.entries(overallData).map(([label, count]) => (
                <div key={label} className={styles.statTile}>
                  <span className={styles.statValue}>{count}</span>
                  <span className={styles.statName}>{label.replace(/([A-Z])/g, ' $1')}</span>
                </div>
              ))}
            </div>

            {/* Jurisdictions Section */}
            <div className={styles.jurisdictionList}>
              <h2 className={styles.sectionTitle}>Jurisdictional Status</h2>
              <div className={styles.tableCard}>
                {jurisdictions.length > 0 ? (
                  jurisdictions.map((j) => (
                    <div key={j.juris_code} className={styles.tableRow}>
                      <div className={styles.jurisMain}>
                        {j.progress === 100 ? 
                          <CheckCircle2 size={18} className={styles.iconSuccess} /> : 
                          <Clock size={18} className={styles.iconPending} />
                        }
                        <div className={styles.jurisText}>
                          <span className={styles.jurisName}>{j.juris_name}</span>
                          <span className={styles.jurisCode}>{j.juris_code}</span>
                        </div>
                      </div>
                      <div className={styles.jurisMeta}>
                          <div className={styles.metaInfo}>
                            <span>Pending Marks Entry: <strong>{j.counts.pendingEvaluation}</strong></span>
                            <span>Pending Interview: <strong>{j.counts.totalInterviewRequired - j.counts.completedInterview}</strong></span>
                          </div>
                          <div className={styles.miniBarContainer}>
                            <div className={styles.miniBar}><div className={styles.miniFill} style={{width: `${j.progress}%`}} /></div>
                            <span className={styles.miniLabel}>{j.progress}%</span>
                          </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <SearchX size={48} strokeWidth={1.5} />
                    <h3>No Data Found</h3>
                    <p>No active batches found for the {displayYear} academic year.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default EvaluationDashboard;