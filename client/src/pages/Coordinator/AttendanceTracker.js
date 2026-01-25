import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import "./BatchManagement.css";
import { 
  Search, Filter, CheckCircle, Calendar, Loader2, RotateCcw, 
  Check, Download, Clock, UserX, Layout, ExternalLink, X, AlertTriangle, FileText 
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../assets/RCF-PP.jpg";

const BACKEND = process.env.REACT_APP_BACKEND_API_URL;
const API_BASE = `${BACKEND}/api/coordinator`;

export default function AttendanceManagement() {
  const auth = useAuth();
  const token = auth?.user?.token || null;
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({ cohort: "", batch: "", classroom: "", date: today, startTime: "00:00", endTime: "00:00", timetable_id: null, search: "" });
  const [activeTab, setActiveTab] = useState("manual"); 
  const [loading, setLoading] = useState(false);

  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [initialAttendanceMap, setInitialAttendanceMap] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [previewData, setPreviewData] = useState(null);
  const [previewUnmatched, setPreviewUnmatched] = useState([]);
  const [previewInactive, setPreviewInactive] = useState([]);

  const axiosConfig = useCallback(() => ({ headers: { Authorization: token ? `Bearer ${token}` : "" } }), [token]);

  const format12hr = (timeStr) => {
    if (!timeStr || timeStr === "00:00") return "-";
    const [h, m] = timeStr.split(":");
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${m} ${suffix}`;
  };

  /* ------------------------- FETCH LOGIC -------------------------*/
  const fetchAttendance = useCallback(async (sid) => {
    const sidToUse = sid !== undefined ? sid : sessionId;
    if (!token || !formData.batch || formData.startTime === "00:00") return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/attendance`, { ...axiosConfig(), params: { session_id: sidToUse, batchId: formData.batch } });
      setStudents(data || []);
      const map = {}; 
      data.forEach(s => map[s.student_id] = s.db_status || "ABSENT");
      setAttendanceMap(map); 
      setInitialAttendanceMap(map);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  }, [token, sessionId, formData.batch, formData.startTime, axiosConfig]);

  useEffect(() => { if (token) axios.get(`${API_BASE}/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || [])); }, [token, axiosConfig]);
  useEffect(() => { if (formData.cohort) axios.get(`${API_BASE}/batches?cohort_number=${formData.cohort}`, axiosConfig()).then(({ data }) => setBatches(data || [])); }, [formData.cohort, axiosConfig]);
  useEffect(() => { if (formData.batch) axios.get(`${API_BASE}/classrooms/${formData.batch}`, axiosConfig()).then(({ data }) => setClassrooms(data || [])); }, [formData.batch, axiosConfig]);

  useEffect(() => {
    if (!token || !formData.batch || !formData.classroom || !formData.date) return;
    const loadTimetableAndSession = async () => {
      setLoading(true);
      try {
        const { data: ttData } = await axios.get(`${API_BASE}/timetable`, { ...axiosConfig(), params: { batchId: formData.batch } });
        const weekday = new Date(formData.date).toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
        const daySlots = ttData.filter(s => (s.day || s.day_of_week || "").toString().toUpperCase() === weekday && String(s.classroom_id) === String(formData.classroom));
        setAvailableSlots(daySlots);

        if (daySlots.length === 0) {
          alert("No timetable slot found for this classroom on the selected date.");
          setFormData(p => ({ ...p, startTime: "00:00", endTime: "00:00", timetable_id: null }));
          setSessionId(null); setStudents([]);
        } else if (daySlots.length === 1) {
          const found = daySlots[0];
          setFormData(p => ({ ...p, startTime: found.start_time, endTime: found.end_time, timetable_id: found.timetable_id }));
          const { data: sess } = await axios.get(`${API_BASE}/attendance/session`, { ...axiosConfig(), params: { classroom_id: formData.classroom, session_date: formData.date, start_time: found.start_time } });
          if (sess?.session_id) { setSessionId(sess.session_id); fetchAttendance(sess.session_id); } 
          else { setSessionId(null); fetchAttendance(null); }
        } else {
          alert(`Found ${daySlots.length} class slots for today. Please select the correct time from the dropdown.`);
          setFormData(p => ({ ...p, startTime: "00:00", endTime: "00:00", timetable_id: null }));
          setSessionId(null);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadTimetableAndSession();
  }, [token, formData.batch, formData.classroom, formData.date, axiosConfig]);

  useEffect(() => { if (formData.startTime !== "00:00") fetchAttendance(); }, [sessionId, formData.startTime, fetchAttendance]);

  /* ------------------------- TRIGGER HANDLERS -------------------------*/
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    // TRIGGER: Erase unnecessary data when selection changes
    if (["cohort", "batch", "classroom", "date"].includes(name)) {
      setStudents([]); 
      setAttendanceMap({}); 
      setInitialAttendanceMap({});
      setSessionId(null);
      setAvailableSlots([]);
      setPreviewData(null); 
      setPreviewUnmatched([]);
      setPreviewInactive([]);

      if (name === "cohort") { setBatches([]); setClassrooms([]); }
      if (name === "batch") { setClassrooms([]); }
    }
  };

  const handleSlotChange = (startTime) => {
    // TRIGGER: Erase old data for previous slot
    setStudents([]);
    setAttendanceMap({});
    setPreviewData(null);

    const selected = availableSlots.find(s => s.start_time === startTime);
    if (selected) {
      setFormData(p => ({ ...p, startTime: selected.start_time, endTime: selected.end_time, timetable_id: selected.timetable_id }));
      axios.get(`${API_BASE}/attendance/session`, { ...axiosConfig(), params: { classroom_id: formData.classroom, session_date: formData.date, start_time: selected.start_time } })
           .then(({ data }) => setSessionId(data?.session_id || null));
    }
  };

  const setAllStatus = (status) => {
    const map = {}; 
    students.forEach(s => map[s.student_id] = status); 
    setAttendanceMap(map);
  };

  const handleSubmitAttendance = async () => {
    const changed = students.filter(s => attendanceMap[s.student_id] !== initialAttendanceMap[s.student_id]).map(s => ({ student_id: s.student_id, status: attendanceMap[s.student_id] }));
    if (!changed.length) return alert("No changes detected.");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/attendance/csv/commit`, { previewData: changed, session_date: formData.date, classroom_id: formData.classroom, start_time: formData.startTime, end_time: formData.endTime }, axiosConfig());
      alert("Attendance updated successfully."); fetchAttendance();
    } catch (e) { alert("Failed."); } finally { setLoading(false); }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append("file", file); fd.append("batch_id", formData.batch);
    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/attendance/csv/preview`, fd, { headers: { ...axiosConfig().headers, "Content-Type": "multipart/form-data" } });
      setPreviewData(data.previewData || []); setPreviewUnmatched(data.unmatchedStudents || []); setPreviewInactive(data.inactiveStudents || []);
      setActiveTab("bulk");
    } catch (e) { alert("CSV Preview failed."); } finally { setLoading(false); e.target.value = ""; }
  };

  const handleCommitCsv = async () => {
    if (!window.confirm("Commit these bulk updates?")) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/attendance/csv/commit`, { previewData, session_date: formData.date, classroom_id: formData.classroom, start_time: formData.startTime, end_time: formData.endTime }, axiosConfig());
      alert("Bulk Upload Committed."); setActiveTab("manual"); fetchAttendance();
    } catch (e) { alert("Commit failed."); } finally { setLoading(false); }
  };

  const downloadSample = async () => {
    try {
      const res = await axios.get(`${API_BASE}/attendance/csv/reference`, { ...axiosConfig(), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a"); link.href = url; link.setAttribute("download", "sample_attendance.csv");
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { alert("Download failed."); }
  };

  const filteredStudents = useMemo(() => {
    const q = (formData.search || "").toLowerCase().trim();
    return students.filter(s => s.student_name?.toLowerCase().includes(q) || s.enr_id?.toString().includes(q));
  }, [students, formData.search]);

  return (
    <div className="full-page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
          <div>
            <h1 className="title">Attendance Management</h1>
            <p className="subtitle">
              {formData.startTime !== "00:00" ? `${format12hr(formData.startTime)} - ${format12hr(formData.endTime)} | ` : ""}
              {students.length} Total Students
            </p>
          </div>
        </div>
        <div className="tab-switcher" style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn ${activeTab === 'manual' ? 'primary' : 'secondary'}`} onClick={() => setActiveTab('manual')}>Manual</button>
          <button className={`btn ${activeTab === 'bulk' ? 'primary' : 'secondary'}`} onClick={() => setActiveTab('bulk')}>Bulk Upload</button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-item">
          <Filter className="input-icon" size={18} />
          <select name="cohort" value={formData.cohort} onChange={handleChange}>
            <option value="">All Cohorts</option>
            {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <Layout className="input-icon" size={18} />
          <select name="batch" value={formData.batch} disabled={!formData.cohort} onChange={handleChange}>
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <ExternalLink className="input-icon" size={18} />
          <select name="classroom" value={formData.classroom} disabled={!formData.batch} onChange={handleChange}>
            <option value="">Classroom</option>
            {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <Calendar className="input-icon" size={18} />
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>
        {availableSlots.length > 1 && (
          <div className="filter-item">
            <Clock className="input-icon" size={18} />
            <select value={formData.startTime} onChange={(e) => handleSlotChange(e.target.value)}>
              <option value="00:00">Select Slot</option>
              {availableSlots.map((s, idx) => (<option key={idx} value={s.start_time}>{format12hr(s.start_time)}</option>))}
            </select>
          </div>
        )}
        <div className="filter-item search-box" style={{ flex: 1 }}>
          <Search className="input-icon" size={18} />
          <input placeholder="Search Students..." value={formData.search} onChange={handleChange} name="search" />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="table-wrapper shadow-md rounded-lg bg-white">
        {activeTab === 'manual' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn secondary" style={{ color: '#16a34a' }} onClick={() => setAllStatus("PRESENT")}>All Present</button>
                <button className="btn secondary" style={{ color: '#dc2626' }} onClick={() => setAllStatus("ABSENT")}>All Absent</button>
              </div>
              <button className="btn primary" onClick={handleSubmitAttendance} disabled={loading}><CheckCircle size={18} className="mr-2 inline" /> Submit Changes</button>
            </div>
            <table className="students-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>SL</th>
                  <th>Student Name</th>
                  <th>Enrollment</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'center', width: "160px" }}>Marking (L-A-P)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin inline mr-2" /> Fetching...</td></tr>
                ) : filteredStudents.map((s, idx) => (
                  <tr key={s.student_id}>
                    <td style={{ fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <div className="student-name-text" style={{ fontWeight: '700', color: '#1e40af' }}>{s.student_name}</div>
                      {s.active_yn !== 'ACTIVE' && <span className="badge-room" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', fontSize: '10px' }}>INACTIVE</span>}
                    </td>
                    <td style={{ fontWeight: '600', color: '#4b5563' }}>{s.enr_id}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{s.contact_no1}</td>
                    <td>
                      <div className="thread-marking-container">
                        <div className="thread-line"><div className={`thread-dot pos-${attendanceMap[s.student_id] === "LATE JOINED" ? "left" : attendanceMap[s.student_id] === "PRESENT" ? "right" : "center"}`} /></div>
                        <div className="thread-labels">
                          <span className={attendanceMap[s.student_id] === "LATE JOINED" ? "active-l" : ""} onClick={() => setAttendanceMap(p => ({ ...p, [s.student_id]: "LATE JOINED" }))}>L</span>
                          <span className={attendanceMap[s.student_id] === "ABSENT" ? "active-a" : ""} onClick={() => setAttendanceMap(p => ({ ...p, [s.student_id]: "ABSENT" }))}>A</span>
                          <span className={attendanceMap[s.student_id] === "PRESENT" ? "active-p" : ""} onClick={() => setAttendanceMap(p => ({ ...p, [s.student_id]: "PRESENT" }))}>P</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div style={{ padding: '30px' }}>
            <div className="actions-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={!formData.classroom || formData.startTime === "00:00"} />
                <button onClick={downloadSample} className="btn secondary" style={{ fontSize: '12px' }}>Sample Template</button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn secondary" onClick={() => { if(window.confirm("Undo commit?")) axios.post(`${API_BASE}/attendance/undo`, { session_id: sessionId }, axiosConfig()).then(() => fetchAttendance()) }} disabled={!sessionId}><RotateCcw size={16} className="mr-1 inline"/> Undo</button>
                <button className="btn primary" onClick={handleCommitCsv} disabled={!previewData}><Check size={16} className="mr-1 inline"/> Commit Bulk</button>
              </div>
            </div>
            {previewData && (
              <table className="students-table">
                <thead><tr><th style={{ width: "45px" }}>SL</th><th>Name</th><th>Joined</th><th>Duration</th><th style={{ textAlign: 'center' }}>Override</th></tr></thead>
                <tbody>
                  {previewData.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: r.status === "ABSENT" ? "#fff1f2" : "inherit" }}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: '600' }}>{r.student_name}</td>
                      <td>{r.time_joined}</td>
                      <td style={{ fontWeight: '700', color: '#2563eb' }}>{r.duration_minutes}m</td>
                      <td>
                        <div className="thread-marking-container">
                          <div className="thread-line"><div className={`thread-dot pos-${r.status === "LATE JOINED" ? "left" : r.status === "PRESENT" ? "right" : "center"}`} /></div>
                          <div className="thread-labels">
                            <span className={r.status === "LATE JOINED" ? "active-l" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="LATE JOINED"; setPreviewData(nd)}}>L</span>
                            <span className={r.status === "ABSENT" ? "active-a" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="ABSENT"; setPreviewData(nd)}}>A</span>
                            <span className={r.status === "PRESENT" ? "active-p" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="PRESENT"; setPreviewData(nd)}}>P</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              {previewUnmatched.length > 0 && (<div style={{ padding: '15px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}><div style={{ fontWeight: '700', display: 'flex', gap: '8px', color: '#92400e' }}><AlertTriangle size={18}/> Unmatched ({previewUnmatched.length})</div><div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', color: '#92400e' }}>{previewUnmatched.map((u, idx) => (<div key={idx}>• {u.student_name}</div>))}</div></div>)}
              {previewInactive.length > 0 && (<div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ fontWeight: '700', display: 'flex', gap: '8px', color: '#475569' }}><UserX size={18}/> Inactive ({previewInactive.length})</div><div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', color: '#475569' }}>{previewInactive.map((u, idx) => (<div key={idx}>• {u.student_name}</div>))}</div></div>)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .full-page-container { width: 100%; padding: 25px; background-color: #f9fafb; min-height: 100vh; }
        .badge-room { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid #dbeafe; }
        .thread-marking-container { position: relative; width: 120px; margin: 0 auto; }
        .thread-line { height: 2px; background: #e2e8f0; width: 100%; position: relative; margin: 10px 0; }
        .thread-dot { position: absolute; top: -5px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; transition: 0.3s; border: 2px solid white; }
        .pos-left { left: 0%; background: #d97706; }
        .pos-center { left: 50%; transform: translateX(-50%); background: #dc2626; }
        .pos-right { left: 92%; background: #16a34a; }
        .thread-labels { display: flex; justify-content: space-between; }
        .thread-labels span { font-size: 11px; font-weight: 800; color: #94a3b8; cursor: pointer; }
        .active-l { color: #d97706 !important; } .active-a { color: #dc2626 !important; } .active-p { color: #16a34a !important; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import axios from "axios";
// import "./BatchManagement.css";
// import { Search, Filter, CheckCircle, AlertTriangle, Calendar, Loader2, RotateCcw, Check, Download, Clock, XCircle, UserX } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";

// const BACKEND = process.env.REACT_APP_BACKEND_API_URL;
// const API_BASE = `${BACKEND}/api/coordinator`;

// export default function AttendanceManagement() {
//   const auth = useAuth();
//   const token = auth?.user?.token || null;
//   const today = new Date().toISOString().split("T")[0];

//   const [formData, setFormData] = useState({ cohort: "", batch: "", classroom: "", date: today, startTime: "00:00", endTime: "00:00", timetable_id: null, search: "" });
//   const [activeTab, setActiveTab] = useState("manual"); 
//   const [loading, setLoading] = useState(false);
//   const [freeze, setFreeze] = useState(false);

//   const [cohorts, setCohorts] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [classrooms, setClassrooms] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [attendanceMap, setAttendanceMap] = useState({});
//   const [initialAttendanceMap, setInitialAttendanceMap] = useState({});
//   const [sessionId, setSessionId] = useState(null);
//   const [availableSlots, setAvailableSlots] = useState([]);

//   const [previewData, setPreviewData] = useState(null);
//   const [previewUnmatched, setPreviewUnmatched] = useState([]);
//   const [previewInactive, setPreviewInactive] = useState([]);

//   const axiosConfig = useCallback(() => ({ headers: { Authorization: token ? `Bearer ${token}` : "" } }), [token]);

//   const format12hr = (timeStr) => {
//     if (!timeStr || timeStr === "00:00") return "";
//     const [h, m] = timeStr.split(":");
//     let hours = parseInt(h, 10);
//     const suffix = hours >= 12 ? "PM" : "AM";
//     hours = hours % 12 || 12;
//     return `${hours}:${m} ${suffix}`;
//   };

//   const fetchAttendance = useCallback(async (sid) => {
//     const sidToUse = sid !== undefined ? sid : sessionId;
//     if (!token || !formData.batch || formData.startTime === "00:00") return;
//     setLoading(true);
//     try {
//       const { data } = await axios.get(`${API_BASE}/attendance`, { ...axiosConfig(), params: { session_id: sidToUse, batchId: formData.batch } });
//       setStudents(data || []);
//       const map = {}; 
//       data.forEach(s => map[s.student_id] = s.db_status || "ABSENT");
//       setAttendanceMap(map); 
//       setInitialAttendanceMap(map);
//     } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
//   }, [token, sessionId, formData.batch, formData.startTime, axiosConfig]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((p) => ({ ...p, [name]: value }));
//     if (["cohort", "batch", "classroom", "date"].includes(name)) {
//       if (name === "cohort") { setBatches([]); setClassrooms([]); }
//       if (name === "batch") setClassrooms([]);
//       setStudents([]); setAttendanceMap({}); setInitialAttendanceMap({});
//       setPreviewData(null); setSessionId(null); setAvailableSlots([]);
//     }
//   };

//   useEffect(() => { if (token) axios.get(`${API_BASE}/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || [])); }, [token, axiosConfig]);
//   useEffect(() => { if (formData.cohort) axios.get(`${API_BASE}/batches?cohort_number=${formData.cohort}`, axiosConfig()).then(({ data }) => setBatches(data || [])); }, [formData.cohort, axiosConfig]);
//   useEffect(() => { if (formData.batch) axios.get(`${API_BASE}/classrooms/${formData.batch}`, axiosConfig()).then(({ data }) => setClassrooms(data || [])); }, [formData.batch, axiosConfig]);

//   // RESTORED: Timetable loading with multiple slot alerts and automatic session fetch
//   useEffect(() => {
//     if (!token || !formData.batch || !formData.classroom || !formData.date) return;
//     const loadTimetableAndSession = async () => {
//       setLoading(true);
//       try {
//         const { data: ttData } = await axios.get(`${API_BASE}/timetable`, { ...axiosConfig(), params: { batchId: formData.batch } });
//         const weekday = new Date(formData.date).toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
//         const daySlots = ttData.filter(s => (s.day || s.day_of_week || "").toString().toUpperCase() === weekday && String(s.classroom_id) === String(formData.classroom));
//         setAvailableSlots(daySlots);

//         if (daySlots.length === 0) {
//           alert("No timetable slot found for this classroom on the selected date.");
//           setFormData(p => ({ ...p, startTime: "00:00", endTime: "00:00", timetable_id: null }));
//           setSessionId(null); setStudents([]);
//         } else if (daySlots.length === 1) {
//           const found = daySlots[0];
//           setFormData(p => ({ ...p, startTime: found.start_time, endTime: found.end_time, timetable_id: found.timetable_id }));
//           const { data: sess } = await axios.get(`${API_BASE}/attendance/session`, { ...axiosConfig(), params: { classroom_id: formData.classroom, session_date: formData.date, start_time: found.start_time } });
//           if (sess?.session_id) { setSessionId(sess.session_id); fetchAttendance(sess.session_id); } 
//           else { setSessionId(null); fetchAttendance(null); }
//         } else {
//           // RESTORED: Alert for multiple classes
//           alert(`Found ${daySlots.length} class slots for today. Please select the correct time from the dropdown.`);
//           setFormData(p => ({ ...p, startTime: "00:00", endTime: "00:00", timetable_id: null }));
//           setSessionId(null);
//         }
//       } catch (err) { console.error(err); } finally { setLoading(false); }
//     };
//     loadTimetableAndSession();
//   }, [token, formData.batch, formData.classroom, formData.date, axiosConfig]);

//   // RESTORED: Automatic trigger when startTime or sessionId changes
//   useEffect(() => { if (formData.startTime !== "00:00") fetchAttendance(); }, [sessionId, formData.startTime, fetchAttendance]);

//   const handleSlotChange = (startTime) => {
//     const selected = availableSlots.find(s => s.start_time === startTime);
//     if (selected) {
//       setFormData(p => ({ ...p, startTime: selected.start_time, endTime: selected.end_time, timetable_id: selected.timetable_id }));
//       axios.get(`${API_BASE}/attendance/session`, { ...axiosConfig(), params: { classroom_id: formData.classroom, session_date: formData.date, start_time: selected.start_time } })
//            .then(({ data }) => setSessionId(data?.session_id || null));
//     }
//   };

//   const toggleMarker = (studentId, status) => { if (!freeze) setAttendanceMap(p => ({ ...p, [studentId]: status })); };
//   const setAllStatus = (status) => { if (!freeze) { const map = {}; students.forEach(s => map[s.student_id] = status); setAttendanceMap(map); } };

//   const handleSubmitAttendance = async () => {
//     const changed = students.filter(s => attendanceMap[s.student_id] !== initialAttendanceMap[s.student_id]).map(s => ({ student_id: s.student_id, status: attendanceMap[s.student_id] }));
//     if (!changed.length) return alert("No changes detected.");
//     try {
//       setLoading(true);
//       await axios.post(`${API_BASE}/attendance/csv/commit`, { previewData: changed, session_date: formData.date, classroom_id: formData.classroom, start_time: formData.startTime, end_time: formData.endTime }, axiosConfig());
//       alert("Attendance updated successfully."); fetchAttendance();
//     } catch (e) { alert("Failed."); } finally { setLoading(false); }
//   };

//   const handleCsvUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const fd = new FormData(); fd.append("file", file); fd.append("batch_id", formData.batch);
//     try {
//       setLoading(true);
//       const { data } = await axios.post(`${API_BASE}/attendance/csv/preview`, fd, { headers: { ...axiosConfig().headers, "Content-Type": "multipart/form-data" } });
//       setPreviewData(data.previewData || []); 
//       setPreviewUnmatched(data.unmatchedStudents || []);
//       setPreviewInactive(data.inactiveStudents || []);
//       setActiveTab("bulk");
//     } catch (e) { alert("CSV Preview failed."); } finally { setLoading(false); e.target.value = ""; }
//   };

//   const handleCommitCsv = async () => {
//     if (!window.confirm("Commit these bulk updates?")) return;
//     try {
//       setLoading(true);
//       await axios.post(`${API_BASE}/attendance/csv/commit`, { previewData, session_date: formData.date, classroom_id: formData.classroom, start_time: formData.startTime, end_time: formData.endTime }, axiosConfig());
//       alert("Bulk Upload Committed."); setActiveTab("manual"); fetchAttendance();
//     } catch (e) { alert("Commit failed."); } finally { setLoading(false); }
//   };

//   const downloadSample = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/attendance/csv/reference`, { ...axiosConfig(), responseType: "blob" });
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const link = document.createElement("a"); link.href = url; link.setAttribute("download", "sample_attendance.csv");
//       document.body.appendChild(link); link.click(); document.body.removeChild(link);
//     } catch (err) { alert("Download failed."); }
//   };

//   const filteredStudents = useMemo(() => {
//     const q = (formData.search || "").toLowerCase().trim();
//     return students.filter(s => s.student_name?.toLowerCase().includes(q) || s.enr_id?.toString().includes(q));
//   }, [students, formData.search]);

//   return (
//     <div className="full-page-container">
//       <div className="page-header">
//         <div>
//           <h1 className="title">Attendance Management</h1>
//           <p className="subtitle">{formData.startTime !== "00:00" ? `${format12hr(formData.startTime)} - ${format12hr(formData.endTime)} | ` : ""}{students.length} Students</p>
//         </div>
//         <div className="tab-switcher" style={{ display: 'flex', gap: '20px' }}>
//           <button className={`btn ${activeTab === 'manual' ? 'primary' : 'secondary'}`} onClick={() => setActiveTab('manual')}>Manual</button>
//           <button className={`btn ${activeTab === 'bulk' ? 'primary' : 'secondary'}`} onClick={() => setActiveTab('bulk')}>Bulk Upload</button>
//         </div>
//       </div>

//       <div className="filter-bar">
//         <div className="filter-item"><Filter className="input-icon" /><select name="cohort" value={formData.cohort} onChange={handleChange}><option value="">Cohort</option>{cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}</select></div>
//         <div className="filter-item"><Filter className="input-icon" /><select name="batch" value={formData.batch} disabled={!formData.cohort} onChange={handleChange}><option value="">Batch</option>{batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}</select></div>
//         <div className="filter-item"><Filter className="input-icon" /><select name="classroom" value={formData.classroom} disabled={!formData.batch} onChange={handleChange}><option value="">Classroom</option>{classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}</select></div>
//         <div className="filter-item date-box"><Calendar className="input-icon" /><input type="date" name="date" value={formData.date} onChange={handleChange} className="inline-date-input" /></div>
        
//         {availableSlots.length > 1 && (
//           <div className="filter-item slot-item">
//             <Clock className="input-icon" />
//             <select value={formData.startTime} onChange={(e) => handleSlotChange(e.target.value)}>
//               <option value="00:00">Select Time Slot</option>
//               {availableSlots.map((s, idx) => (<option key={idx} value={s.start_time}>{format12hr(s.start_time)}</option>))}
//             </select>
//           </div>
//         )}
//         <div className="filter-item search-box" style={{ flex: 1 }}><Search className="input-icon" /><input placeholder="Search Students..." value={formData.search} onChange={handleChange} name="search" /></div>
//       </div>

//       <div className="table-wrapper shadow-md rounded-lg bg-white">
//         {activeTab === 'manual' ? (
//           <>
//             <div className="actions-header">
//               <div style={{display:'flex', gap:'8px'}}>
//                 <button className="btn secondary text-green-600" onClick={() => setAllStatus("PRESENT")}>Mark All Present</button>
//                 <button className="btn secondary text-red-600" onClick={() => setAllStatus("ABSENT")}>Mark All Absent</button>
//               </div>
//               <button className="btn primary" onClick={handleSubmitAttendance} disabled={loading}><CheckCircle size={18} className="mr-1 inline" /> Submit Changes</button>
//             </div>
//             <table className="students-table">
//               <thead><tr><th style={{ width: "45px" }}>SL</th><th>Student Name</th><th>Enrollment Number</th><th>Contact</th><th style={{ textAlign: 'center' }}>Mark Attendance (L — A — P)</th></tr></thead>
//               <tbody>
//                 {loading ? <tr><td colSpan="5" className="text-center py-10"><Loader2 className="animate-spin inline mr-2" /> Loading...</td></tr> : 
//                 filteredStudents.map((s, idx) => (
//                   <tr key={s.student_id}>
//                     <td className="text-center">{idx + 1}</td>
//                     <td><div className="student-name-text">{s.student_name} {s.active_yn !== 'ACTIVE' && <span className="inactive-tag">(INACTIVE)</span>}</div></td>
//                     <td className="enr-id-text">{s.enr_id}</td>
//                     <td><div className="student-sub-text">{s.contact_no1}</div><div className="student-sub-text">{s.student_email}</div></td>
//                     <td>
//                       <div className="thread-marking-container">
//                         <div className="thread-line"><div className={`thread-dot pos-${attendanceMap[s.student_id] === "LATE JOINED" ? "left" : attendanceMap[s.student_id] === "PRESENT" ? "right" : attendanceMap[s.student_id] === "ABSENT" ? "center" : "none"}`} /></div>
//                         <div className="thread-labels">
//                           <span className={attendanceMap[s.student_id] === "LATE JOINED" ? "active-l" : ""} onClick={() => toggleMarker(s.student_id, "LATE JOINED")}>L</span>
//                           <span className={attendanceMap[s.student_id] === "ABSENT" ? "active-a" : ""} onClick={() => toggleMarker(s.student_id, "ABSENT")}>A</span>
//                           <span className={attendanceMap[s.student_id] === "PRESENT" ? "active-p" : ""} onClick={() => toggleMarker(s.student_id, "PRESENT")}>P</span>
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </>
//         ) : (
//           <div style={{ padding: '25px' }}>
//             <div className="actions-header" style={{marginBottom:'20px'}}>
//                 <div className="form-group">
//                     <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>Select Session CSV</label>
//                     <div style={{display:'flex', alignItems:'center', gap:'15px', marginTop:'5px'}}>
//                         <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={!formData.classroom || formData.startTime === "00:00"} />
//                         <a href="#" onClick={(e) => { e.preventDefault(); downloadSample(); }} className="download-sample-link">Download Sample</a>
//                     </div>
//                 </div>
//                 {/* RESTORED: BUTTONS ALIGNED TO THE RIGHT */}
//                 <div style={{display:'flex', gap:'15px'}}>
//                     <button className="btn secondary" onClick={() => { if(window.confirm("Undo last commit?")) axios.post(`${API_BASE}/attendance/undo`, { session_id: sessionId }, axiosConfig()).then(() => fetchAttendance()) }} disabled={!sessionId}><RotateCcw size={16} className="mr-1 inline"/> Undo</button>
//                     <button className="btn primary" onClick={handleCommitCsv} disabled={!previewData}><Check size={16} className="mr-1 inline"/> Commit Bulk Upload</button>
//                 </div>
//             </div>
//             {previewData && (
//               <>
//                 <table className="students-table">
//                   <thead><tr><th style={{ width: "45px" }}>SL</th><th>Student Name</th><th>Enrollment</th><th>Joined</th><th>Exited</th><th>Duration</th><th style={{ textAlign: 'center' }}>Override (L — A — P)</th></tr></thead>
//                   <tbody>
//                     {previewData.map((r, i) => (
//                       <tr key={i}>
//                         <td className="text-center">{i + 1}</td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}}><div className="student-name-text">{r.student_name}</div></td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}} className="enr-id-text">{r.enr_id}</td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}} className="student-sub-text">{r.time_joined}</td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}} className="student-sub-text">{r.time_exited}</td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}} className="font-bold text-blue-600">{r.duration_minutes}m</td>
//                         <td style={r.status === "ABSENT" ? {backgroundColor: '#fff1f2'} : {}}>
//                           <div className="thread-marking-container">
//                             <div className="thread-line"><div className={`thread-dot pos-${r.status === "LATE JOINED" ? "left" : r.status === "PRESENT" ? "right" : "center"}`} /></div>
//                             <div className="thread-labels">
//                               <span className={r.status === "LATE JOINED" ? "active-l" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="LATE JOINED"; setPreviewData(nd)}}>L</span>
//                               <span className={r.status === "ABSENT" ? "active-a" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="ABSENT"; setPreviewData(nd)}}>A</span>
//                               <span className={r.status === "PRESENT" ? "active-p" : ""} onClick={() => {const nd=[...previewData]; nd[i].status="PRESENT"; setPreviewData(nd)}}>P</span>
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 <div className="bulk-info-footer">
//                     {previewUnmatched.length > 0 && (<div className="info-card amber"><div className="info-title"><AlertTriangle size={18} /> Mismatched CSV Names ({previewUnmatched.length})</div><div className="info-list">{previewUnmatched.map((u, idx) => (<div key={idx} className="info-item">• {u.student_name} <span className="duration-pill">{u.duration_minutes}m</span></div>))}</div></div>)}
//                     {previewInactive.length > 0 && (<div className="info-card gray"><div className="info-title"><UserX size={18} /> Inactive Students Found ({previewInactive.length})</div><div className="info-list">{previewInactive.map((u, idx) => (<div key={idx} className="info-item">• {u.student_name} <span className="duration-pill">{u.duration_minutes}m</span></div>))}</div></div>)}
//                 </div>
//               </>
//             )}
//           </div>
//         )}
//       </div>

//       <style>{`
//         *:focus { outline: none !important; box-shadow: none !important; }
//         .full-page-container { width: 100%; max-width: 100vw; padding: 20px; box-sizing: border-box; background-color: #f9fafb; font-family: 'Inter', sans-serif; }
//         .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
//         .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
//         .filter-item { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0 10px; height: 38px; min-width: 120px; }
//         .filter-item .input-icon { width: 15px; height: 15px; color: #64748b; margin-right: 8px; }
//         .filter-item select, .filter-item input { border: none; background: transparent; height: 100%; width: 100%; font-size: 13px; color: #1e293b; cursor: pointer; }
//         .date-box { width: 185px !important; }
//         .search-box { flex: 1; border: 1px solid #cbd5e1; }
        
//         .actions-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; }
//         .download-sample-link { color: #2563eb; text-decoration: underline; font-weight: 600; font-size: 13px; }
        
//         .students-table { width: 100%; border-collapse: collapse; }
//         .students-table th { background: #f8fafc; padding: 12px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: left; }
//         .students-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
//         .student-name-text { font-weight: 600; color: #1e40af; display: flex; align-items: center; gap: 5px; }
//         .inactive-tag { color: #dc2626; font-size: 10px; font-weight: 900; }
        
//         .bulk-info-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
//         .info-card { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
//         .info-card.amber { background: #fffbeb; color: #92400e; }
//         .info-card.gray { background: #f8fafc; color: #475569; }
//         .info-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
//         .info-list { max-height: 150px; overflow-y: auto; }
//         .info-item { font-size: 12px; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; }
//         .duration-pill { background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-weight: bold; }

//         .thread-marking-container { position: relative; width: 140px; margin: 0 auto; padding: 10px 0; }
//         .thread-line { height: 2px; background: #e2e8f0; width: 100%; position: relative; }
//         .thread-dot { position: absolute; top: -5px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; transition: 0.3s; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
//         .pos-left { left: 0%; background: #d97706; }
//         .pos-center { left: 50%; transform: translateX(-50%); background: #dc2626; }
//         .pos-right { left: 92%; background: #16a34a; }
//         .thread-labels { display: flex; justify-content: space-between; margin-top: 10px; }
//         .thread-labels span { font-size: 11px; font-weight: 800; color: #94a3b8; cursor: pointer; }
//         .active-l { color: #d97706 !important; } .active-a { color: #dc2626 !important; } .active-p { color: #16a34a !important; }
//         .animate-spin { animation: spin 1s linear infinite; }
//         @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
//       `}</style>
//     </div>
//   );
// }