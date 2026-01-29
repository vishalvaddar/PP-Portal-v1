import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, MapPin, Users, Calendar, ChevronRight, Award, Navigation, ArrowRight } from "lucide-react";
import styles from "./SammelanReports.module.css"; 

const SammelanReports = () => {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/selection-reports/cohorts`)
      .then(res => {
        setCohorts(res.data);
        if (res.data.length > 0) setSelectedCohort(res.data[0].cohort_name);
      })
      .catch(err => console.error("Cohort Fetch Error:", err));
  }, []);

  const fetchData = async () => {
    if (!selectedCohort || !fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/selection-reports/sammelan-data`, {
        params: { cohort: selectedCohort, fromDate, toDate }
      });
      setData(res.data || []);
    } catch (err) { 
      console.error("Data Fetch Error:", err);
      setData([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [selectedCohort, fromDate, toDate]);

  const handleDownload = async () => {
    if (data.length === 0) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/selection-reports/download-sammelan`, 
        { cohort: selectedCohort, reportPayload: [{ blocks: data }] }, { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([res.data]));
      link.download = `Sammelan_Report_${selectedCohort}.pdf`;
      link.click();
    } catch (err) { console.error("Download Error:", err); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Sammelan Reports</h1>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.brandBadge}>
          <Award size={18} />
          <span>Sammelan Portal</span>
        </div>

        <div className={styles.fieldItem}>
          <Users size={16} className={styles.icon} />
          <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)}>
            {cohorts.map(c => <option key={c.cohort_name} value={c.cohort_name}>{c.cohort_name}</option>)}
          </select>
        </div>

        <div className={styles.fieldItem}>
          <Calendar size={16} className={styles.icon} />
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span className={styles.sep}>to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>

        <button className={styles.exportBtnGreen} onClick={handleDownload} disabled={loading || data.length === 0}>
          <Download size={18}/> <span>Export Report</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading...</div>
      ) : (
        <div className={styles.grid2}>
          {data.map((item, idx) => {
            const total = (item.boys_sel || 0) + (item.girls_sel || 0);
            const boyPct = total > 0 ? (item.boys_sel / total) * 100 : 0;
            
            return (
              <div key={idx} className={styles.floatCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.titleInfo}>
                    <h3>{item.label}</h3>
                    <div className={styles.locTag}><MapPin size={14}/> {item.event_location}</div>
                  </div>
                  <div className={styles.dateRangeBadge}>
                    <div className={styles.dateSub}>
                        <span className={styles.dateLabel}>START</span>
                        <span className={styles.dateValue}>{formatDate(item.from_date)}</span>
                    </div>
                    <ArrowRight size={14} className={styles.dateArrow} />
                    <div className={styles.dateSub}>
                        <span className={styles.dateLabel}>END</span>
                        <span className={styles.dateValue}>{formatDate(item.to_date)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.regionStrip}>
                    <Navigation size={14} /> {item.district_name} <ChevronRight size={12}/> {item.block_name}
                  </div>
                  
                  <div className={styles.visualBar}>
                    <div className={styles.boySegment} style={{ width: `${boyPct}%` }}></div>
                    <div className={styles.girlSegment} style={{ width: `${100 - boyPct}%` }}></div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                      <span className={styles.emoji}>👦</span>
                      <span className={styles.val}>{item.boys_sel || 0}</span>
                      <label>Boys</label>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.emoji}>👧</span>
                      <span className={styles.val}>{item.girls_sel || 0}</span>
                      <label>Girls</label>
                    </div>
                    <div className={`${styles.statBox} ${styles.totalHighlight}`}>
                      <span className={styles.val}>{total}</span>
                      <label>Total Attendance</label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SammelanReports;