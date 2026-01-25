// client/src/pages/Coordinator/TimeTableManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./BatchManagement.css"; 
import { useAuth } from "../../contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  Search, Download, Plus, ChevronDown, Edit, Trash2, 
  Filter, Layout, CheckCircle, ExternalLink, FileText, X, Calendar, Clock, Link as LinkIcon,
  AlertTriangle, Info
} from "lucide-react";
import Logo from "../../assets/RCF-PP.jpg";

const BACKEND = process.env.REACT_APP_BACKEND_API_URL;
const API_BASE = `${BACKEND}/api/coordinator`;
const initial = { cohort: "", batch: "" };
const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function TimeTableManagement() {
  const [form, setForm] = useState(initial);
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [editing, setEditing] = useState(null);
  const [conflictsMap, setConflictsMap] = useState({});
  const [slotForm, setSlotForm] = useState({
    classroom_id: "", day_of_week: "MONDAY", start_time: "09:00", end_time: "10:00", class_link: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState([]);

  const auth = useAuth();
  const token = auth?.user?.token;

  const axiosConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const t12 = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  /* ------------------------- FETCH LOGIC -------------------------*/
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || [])).catch(console.error);
  }, [token, axiosConfig]);

  useEffect(() => {
    if (!token || !form.cohort) {
      setFilteredBatches([]); setBatches([]); return;
    }
    axios.get(`${API_BASE}/batches?cohort_number=${form.cohort}`, axiosConfig()).then(({ data }) => {
      setBatches(data || []); setFilteredBatches(data || []);
    }).catch(console.error);
  }, [token, form.cohort, axiosConfig]);

  useEffect(() => {
    if (!token || !form.batch) {
      setClassrooms([]); setTimetable([]); return;
    }
    axios.get(`${API_BASE}/classrooms/${form.batch}`, axiosConfig()).then(({ data }) => setClassrooms(data || [])).catch(() => setClassrooms([]));
    fetchTimetable(form.batch);
  }, [token, form.batch, axiosConfig]);

  const fetchTimetable = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/timetable?batchId=${batchId}`, axiosConfig());
      setTimetable(data || []);
      setConflictsMap({});
    } catch (err) { setTimetable([]); } finally { setLoading(false); }
  };

  /* ------------------------- ACTIONS -------------------------*/
  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    if (name === "classroom_id") {
      const selected = classrooms.find(c => String(c.classroom_id) === String(value));
      setSlotForm(prev => ({ 
        ...prev, 
        classroom_id: value, 
        class_link: selected?.class_link || "" 
      }));
    } else {
      setSlotForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditClick = (row) => {
    setEditing(row);
    setSlotForm({
      classroom_id: row.classroom_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      class_link: row.class_link || "" 
    });
    setShowSlotForm(true);
  };

  const validateSlot = async () => {
    const { classroom_id, day_of_week, start_time, end_time } = slotForm;
    const params = new URLSearchParams({ classroomId: classroom_id, day: day_of_week, startTime: start_time, endTime: end_time });
    if (editing) params.append("excludeId", editing.timetable_id);

    try {
      const res = await axios.get(`${API_BASE}/timetable/check-conflict?${params.toString()}`, axiosConfig());
      if (res.data?.overlap) {
        const conflicts = res.data.conflicts || [];
        setConflictsMap(conflicts.reduce((a, c) => ({ ...a, [c.timetable_id]: true }), {}));
        setConflictDetails(conflicts);
        setShowConflictModal(true);
        return { ok: false };
      }
      return { ok: true };
    } catch (err) { return { ok: false }; }
  };

  const handleCreateOrUpdate = async () => {
    const val = await validateSlot();
    if (!val.ok) return;

    const payload = {
      batch_id: form.batch,
      classroom_id: slotForm.classroom_id,
      day: slotForm.day_of_week,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      class_link: slotForm.class_link || null
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE}/timetable/${editing.timetable_id}`, payload, axiosConfig());
        alert("Updated Successfully");
      } else {
        await axios.post(`${API_BASE}/timetable`, payload, axiosConfig());
        alert("Created Successfully");
      }
      fetchTimetable(form.batch);
      setShowSlotForm(false);
      resetSlotForm();
    } catch (err) { alert("Error saving slot"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await axios.delete(`${API_BASE}/timetable/${id}`, axiosConfig());
      fetchTimetable(form.batch);
    } catch (err) { alert("Delete failed"); }
  };

  const resetSlotForm = () => {
    setSlotForm({ classroom_id: "", day_of_week: "MONDAY", start_time: "09:00", end_time: "10:00", class_link: "" });
    setEditing(null);
    setConflictsMap({});
  };

  /* ------------------------- ORIGINAL EXPORT LOGIC (RESTORED) -------------------------*/
  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    try {
      const logoWidth = 50;
      const logoHeight = 50;
      doc.addImage(Logo, 'JPEG', pageWidth - margin - logoWidth, 20, logoWidth, logoHeight);
    } catch (e) {}

    const batchObj = filteredBatches.find(b => String(b.batch_id) === String(form.batch));
    const title = `COHORT ${form.cohort} - ${batchObj?.batch_name || "N/A"} - TIME TABLE`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, 45, { align: "center" });

    const flatRows = DAY_ORDER.filter(d => groupedTimetable[d]).flatMap(day => {
      const sessions = groupedTimetable[day];
      return sessions.map((r, index) => ({
        ...r,
        rowSpan: index === 0 ? sessions.length : 0 
      }));
    });

    autoTable(doc, {
      startY: 80,
      head: [["Day", "Time", "Subject Code", "Teacher", "Classroom", "Link"]],
      body: flatRows.map(r => [
        r.rowSpan > 0 ? { content: r.day_of_week, rowSpan: r.rowSpan } : null,
        `${t12(r.start_time)} - ${t12(r.end_time)}`,
        r.subject_code || "-",
        r.teacher_name || "-",
        r.classroom_name || "-",
        r.class_link ? "JOIN CLASS" : "-"
      ].filter(cell => cell !== null)),
      
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], halign: 'center' },
      styles: { fontSize: 8, valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'center' }                    
      },

      willDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const link = flatRows[data.row.index]?.class_link;
          if (link && link !== "-") {
            doc.setTextColor(0, 0, 255);
          }
        }
      },

      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const link = flatRows[data.row.index]?.class_link;
          if (link && link !== "-") {
            const text = data.cell.text[0];
            const textWidth = doc.getTextWidth(text);
            const startX = data.cell.x + (data.cell.width - textWidth) / 2;
            const startY = data.cell.y + data.cell.height - 5;
            doc.setDrawColor(0, 0, 255);
            doc.line(startX, startY, startX + textWidth, startY);
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link });
          }
        }
      }
    });

    doc.save("Timetable.pdf");
    setExportOpen(false);
  };

  const downloadExcel = () => {
    const rows = timetable.map(r => ({
      Day: r.day_of_week, Time: `${t12(r.start_time)} - ${t12(r.end_time)}`,
      "Subject Code": r.subject_code || "-", Teacher: r.teacher_name || "-",
      Classroom: r.classroom_name || "-", Link: r.class_link || "-"
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, "Timetable.xlsx");
    setExportOpen(false);
  };

  /* ------------------------- RENDER LOGIC -------------------------*/
  const filteredTimetable = timetable.filter(r =>
    r.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTimetable = filteredTimetable.reduce((acc, curr) => {
    if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
    acc[curr.day_of_week].push(curr);
    return acc;
  }, {});

  const orderedDays = DAY_ORDER.filter(d => groupedTimetable[d]);

  return (
    <div className="full-page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
          <div>
            <h1 className="title">Time Table Management</h1>
            <p className="subtitle">Managing {timetable.length} active scheduling slots</p>
          </div>
        </div>

        <div className="export-menu-wrapper">
          <button className="btn primary" onClick={() => setExportOpen(!exportOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div className="export-dropdown shadow-lg">
              <button onClick={downloadExcel}><FileText size={14} className="mr-2 inline"/> Excel (.xlsx)</button>
              <button onClick={downloadPDF}><FileText size={14} className="mr-2 inline"/> PDF (.pdf)</button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-item">
          <Filter className="input-icon" size={18} />
          <select value={form.cohort} onChange={e => setForm({ cohort: e.target.value, batch: "" })}>
            <option value="">All Cohorts</option>
            {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <Layout className="input-icon" size={18} />
          <select value={form.batch} disabled={!form.cohort} onChange={e => setForm({ ...form, batch: e.target.value })}>
            <option value="">Select Batch</option>
            {filteredBatches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div className="filter-item search-box" style={{ flex: 1 }}>
          <Search className="input-icon" size={18} />
          <input placeholder="Search Teacher or Subject..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {form.batch && (
            <button className="btn primary" onClick={() => { resetSlotForm(); setShowSlotForm(true); }}>
              <Plus size={18} /> Create Slot
            </button>
          )}
      </div>

      {/* DATA TABLE */}
      <div className="table-wrapper shadow-md rounded-lg bg-white">
        {form.batch ? (
          <table className="students-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Day</th>
                <th>Time Slot</th>
                <th>Subject Name</th>
                <th>Assigned Teacher</th>
                <th>Classroom</th>
                <th>Online Link</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedDays.length > 0 ? orderedDays.map(day => groupedTimetable[day].map((r, idx) => (
                <tr key={r.timetable_id} style={{ backgroundColor: conflictsMap[r.timetable_id] ? "#fff1f2" : "inherit" }}>
                  <td style={{ fontWeight: '700', color: '#1e40af' }}>{idx === 0 ? day : ""}</td>
                  <td style={{ fontWeight: '600', color: '#4b5563' }}>{t12(r.start_time)} - {t12(r.end_time)}</td>
                  <td>{r.subject_name}</td>
                  <td>{r.teacher_name}</td>
                  <td><span className="badge-room">{r.classroom_name}</span></td>
                  <td>
                    {r.class_link ? (
                      <a href={r.class_link} target="_blank" rel="noreferrer" className="link-text">
                        <ExternalLink size={14} className="inline mr-1" /> Join
                      </a>
                    ) : <span style={{color: '#9ca3af'}}>-</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => handleEditClick(r)} className="action-btn edit"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(r.timetable_id)} className="action-btn delete"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>No data found for this batch.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Calendar size={48} style={{ color: '#d1d5db', marginBottom: '10px' }} />
            <p style={{ color: '#6b7280' }}>Select Cohort & Batch to view Timetable</p>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showSlotForm && (
        <div className="modal">
          <div className="modal-content medium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="modal-title">{editing ? "Update Schedule Slot" : "Create New Schedule Slot"}</h3>
              <button onClick={() => setShowSlotForm(false)} className="close-btn"><X /></button>
            </div>
            
            <div className="edit-form grid-2-col">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Classroom</label>
                {editing ? (
                  <div className="form-input bg-gray-100">{editing.classroom_name}</div>
                ) : (
                  <select name="classroom_id" value={slotForm.classroom_id} onChange={handleSlotChange} className="form-input">
                    <option value="">Select Classroom</option>
                    {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Class Link</label>
                <input type="url" value={slotForm.class_link || ""} onChange={(e) => setSlotForm({...slotForm, class_link: e.target.value})} className="form-input" readOnly={!editing} />
              </div>
              <div className="form-group">
                <label>Day of Week</label>
                <select name="day_of_week" value={slotForm.day_of_week} onChange={handleSlotChange} className="form-input">
                  {DAY_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Start Time</label><input type="time" name="start_time" value={slotForm.start_time} onChange={handleSlotChange} className="form-input" /></div>
              <div className="form-group"><label>End Time</label><input type="time" name="end_time" value={slotForm.end_time} onChange={handleSlotChange} className="form-input" /></div>
            </div>

            <div className="modal-actions" style={{ marginTop: '25px' }}>
              <button className="btn secondary" onClick={() => setShowSlotForm(false)}>Discard</button>
              <button className="btn primary" onClick={handleCreateOrUpdate}><CheckCircle size={18} className="mr-2 inline" /> Save Slot</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT MODAL */}
      {showConflictModal && (
        <div className="modal">
          <div className="modal-content small" style={{ borderTop: '5px solid #ef4444' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '10px' }} />
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>Schedule Conflict Detected</h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>The proposed time slot overlaps with existing classes:</p>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
              {conflictDetails.map((c, i) => (
                <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i !== conflictDetails.length - 1 ? '1px solid #fecaca' : 'none' }}>
                   <div style={{ fontWeight: '700', fontSize: '14px', color: '#991b1b' }}>{i + 1}. {c.subject_name}</div>
                   <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={12}/> Teacher: {c.teacher_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Layout size={12}/> Room: {c.classroom_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12}/> {t12(c.start_time)} - {t12(c.end_time)}</div>
                   </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn primary" style={{ backgroundColor: '#ef4444', width: '100%' }} onClick={() => setShowConflictModal(false)}>
                I Understand, Let me fix it
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .full-page-container { width: 100%; padding: 25px; background-color: #f9fafb; min-height: 100vh; }
        .badge-room { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid #dbeafe; }
        .link-text { color: #10b981; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .action-btn { background: none; border: none; cursor: pointer; transition: transform 0.2s; }
        .action-btn.edit { color: #d97706; }
        .action-btn.delete { color: #dc2626; }
        .modal-content.medium { max-width: 600px; }
        .modal-content.small { max-width: 400px; }
      `}</style>
    </div>
  );
}



// // client/src/pages/Coordinator/TimeTableManagement.jsx
// import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import "./TimeTableManagement.css"; 
// import { useAuth } from "../../contexts/AuthContext";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";
// import { 
//   Search, Download, Plus, ChevronDown, Edit, Trash2, 
//   Filter, Layout, CheckCircle, ExternalLink, FileText 
// } from "lucide-react";
// import Logo from "../../assets/RCF-PP.jpg";

// const BACKEND = process.env.REACT_APP_BACKEND_API_URL;
// const API_BASE = `${BACKEND}/api/coordinator`;
// const initial = { cohort: "", batch: "" };
// const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// export default function TimeTableManagement() {
//   const [form, setForm] = useState(initial);
//   const [cohorts, setCohorts] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [filteredBatches, setFilteredBatches] = useState([]);
//   const [classrooms, setClassrooms] = useState([]);
//   const [timetable, setTimetable] = useState([]);
//   const [editing, setEditing] = useState(null);
//   const [conflictsMap, setConflictsMap] = useState({});
//   const [slotForm, setSlotForm] = useState({
//     classroom_id: "", day_of_week: "MONDAY", start_time: "09:00", end_time: "10:00", class_link: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [showSlotForm, setShowSlotForm] = useState(false);
//   const [exportOpen, setExportOpen] = useState(false);

//   const auth = useAuth();
//   const token = auth?.user?.token;

//   const axiosConfig = useCallback(() => ({
//     headers: { Authorization: `Bearer ${token}` },
//   }), [token]);

//   const t12 = (timeStr) => {
//     if (!timeStr) return "-";
//     const [hours, minutes] = timeStr.split(":");
//     let h = parseInt(hours, 10);
//     const ampm = h >= 12 ? "PM" : "AM";
//     h = h % 12 || 12;
//     return `${h}:${minutes} ${ampm}`;
//   };

//   /* ------------------------- FETCH LOGIC -------------------------*/
//   useEffect(() => {
//     if (!token) return;
//     axios.get(`${API_BASE}/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || [])).catch(console.error);
//   }, [token, axiosConfig]);

//   useEffect(() => {
//     if (!token || !form.cohort) {
//       setFilteredBatches([]); setBatches([]); return;
//     }
//     axios.get(`${API_BASE}/batches?cohort_number=${form.cohort}`, axiosConfig()).then(({ data }) => {
//       setBatches(data || []); setFilteredBatches(data || []);
//     }).catch(console.error);
//   }, [token, form.cohort, axiosConfig]);

//   useEffect(() => {
//     if (!token || !form.batch) {
//       setClassrooms([]); setTimetable([]); return;
//     }
//     axios.get(`${API_BASE}/classrooms/${form.batch}`, axiosConfig()).then(({ data }) => setClassrooms(data || [])).catch(() => setClassrooms([]));
//     fetchTimetable(form.batch);
//   }, [token, form.batch, axiosConfig]);

//   const fetchTimetable = async (batchId) => {
//     if (!batchId) return;
//     setLoading(true);
//     try {
//       const { data } = await axios.get(`${API_BASE}/timetable?batchId=${batchId}`, axiosConfig());
//       setTimetable(data || []);
//       setConflictsMap({});
//     } catch (err) { setTimetable([]); } finally { setLoading(false); }
//   };

//   /* ------------------------- ACTIONS -------------------------*/
//   const handleSlotChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "classroom_id") {
//       const selected = classrooms.find(c => String(c.classroom_id) === String(value));
//       setSlotForm(prev => ({ 
//         ...prev, 
//         classroom_id: value, 
//         class_link: selected?.class_link || "" 
//       }));
//     } else {
//       setSlotForm((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleEditClick = (row) => {
//     setEditing(row);
//     setSlotForm({
//       classroom_id: row.classroom_id,
//       day_of_week: row.day_of_week,
//       start_time: row.start_time,
//       end_time: row.end_time,
//       class_link: row.class_link || "" 
//     });
//     setShowSlotForm(true);
//   };

//   const validateSlot = async () => {
//     const { classroom_id, day_of_week, start_time, end_time } = slotForm;
//     const params = new URLSearchParams({ classroomId: classroom_id, day: day_of_week, startTime: start_time, endTime: end_time });
//     if (editing) params.append("excludeId", editing.timetable_id);

//     try {
//       const res = await axios.get(`${API_BASE}/timetable/check-conflict?${params.toString()}`, axiosConfig());
//       if (res.data?.overlap) {
//         const conflicts = res.data.conflicts || [];
//         setConflictsMap(conflicts.reduce((a, c) => ({ ...a, [c.timetable_id]: true }), {}));
//         const msg = conflicts.map((c, i) => 
//             `${i+1}) ${c.subject_name} (${c.teacher_name})\n   Room: ${c.classroom_name}\n   Time: ${t12(c.start_time)} - ${t12(c.end_time)}`
//         ).join("\n\n");
//         alert(`⚠️ CONFLICT DETECTED:\n\n${msg}`);
//         return { ok: false };
//       }
//       return { ok: true };
//     } catch (err) { return { ok: false }; }
//   };

//   const handleCreateOrUpdate = async () => {
//     const val = await validateSlot();
//     if (!val.ok) return;

//     const payload = {
//       batch_id: form.batch,
//       classroom_id: slotForm.classroom_id,
//       day: slotForm.day_of_week,
//       start_time: slotForm.start_time,
//       end_time: slotForm.end_time,
//       class_link: slotForm.class_link || null
//     };

//     try {
//       if (editing) {
//         await axios.put(`${API_BASE}/timetable/${editing.timetable_id}`, payload, axiosConfig());
//         alert("Updated Successfully");
//       } else {
//         await axios.post(`${API_BASE}/timetable`, payload, axiosConfig());
//         alert("Created Successfully");
//       }
//       fetchTimetable(form.batch);
//       setShowSlotForm(false);
//       resetSlotForm();
//     } catch (err) { alert("Error saving slot"); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this slot?")) return;
//     try {
//       await axios.delete(`${API_BASE}/timetable/${id}`, axiosConfig());
//       fetchTimetable(form.batch);
//     } catch (err) { alert("Delete failed"); }
//   };

//   const resetSlotForm = () => {
//     setSlotForm({ classroom_id: "", day_of_week: "MONDAY", start_time: "09:00", end_time: "10:00", class_link: "" });
//     setEditing(null);
//     setConflictsMap({});
//   };

//   // /* ------------------------- EXPORT -------------------------*/
//   // const downloadPDF = async () => {
//   //   const doc = new jsPDF({ unit: "pt", format: "a4" });
//   //   const pageWidth = doc.internal.pageSize.getWidth();
//   //   try { doc.addImage(Logo, 'JPEG', 40, 20, 50, 50); } catch (e) {}

//   //   const batchObj = filteredBatches.find(b => String(b.batch_id) === String(form.batch));
//   //   const title = `COHORT ${form.cohort} - ${batchObj?.batch_name || "N/A"} - TIME TABLE`;

//   //   doc.setFont("helvetica", "bold"); doc.setFontSize(14);
//   //   doc.text(title, pageWidth / 2, 45, { align: "center" });

//   //   const flatRows = DAY_ORDER.filter(d => groupedTimetable[d]).flatMap(day => groupedTimetable[day]);

//   //   autoTable(doc, {
//   //     startY: 80,
//   //     head: [["Day", "Time", "Subject Code", "Teacher", "Classroom", "Link"]],
//   //     body: flatRows.map(r => [
//   //       r.day_of_week, 
//   //       `${t12(r.start_time)} - ${t12(r.end_time)}`,
//   //       r.subject_code || "-", 
//   //       r.teacher_name || "-",
//   //       r.classroom_name || "-", 
//   //       r.class_link ? "JOIN CLASS" : "-"
        
//   //     ]),
//   //     theme: "grid",
//   //     headStyles: { fillColor: [16, 185, 129] },
//   //     styles: { fontSize: 8 },
//   //     didDrawCell: (data) => {
//   //       // Applying BLUE color and HYPERLINK only in the PDF Link column (index 5)
//   //       if (data.section === 'body' && data.column.index === 5) {
//   //           const rowIndex = data.row.index;
//   //           const link = flatRows[rowIndex]?.class_link;
//   //           if (link && link !== "-") {
//   //               doc.setTextColor(0, 0, 255); // Link in BLUE for PDF
//   //               doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link });
//   //           }
//   //       }
//   //     }
//   //   });
//   //   doc.save("Timetable.pdf");
//   // };



//   /* ------------------------- EXPORT -------------------------*/
// const downloadPDF = async () => {
//   const doc = new jsPDF({ unit: "pt", format: "a4" });
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const margin = 40;

//   // 1. Right-Aligned Logo
//   try {
//     const logoWidth = 50;
//     const logoHeight = 50;
//     doc.addImage(Logo, 'JPEG', pageWidth - margin - logoWidth, 20, logoWidth, logoHeight);
//   } catch (e) {}

//   const batchObj = filteredBatches.find(b => String(b.batch_id) === String(form.batch));
//   const title = `COHORT ${form.cohort} - ${batchObj?.batch_name || "N/A"} - TIME TABLE`;

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(14);
//   doc.text(title, pageWidth / 2, 45, { align: "center" });

//   // 2. Prepare Data with Row Spanning Logic
//   const flatRows = DAY_ORDER.filter(d => groupedTimetable[d]).flatMap(day => {
//     const sessions = groupedTimetable[day];
//     return sessions.map((r, index) => ({
//       ...r,
//       rowSpan: index === 0 ? sessions.length : 0 // Only the first session of the day gets the span count
//     }));
//   });

//   autoTable(doc, {
//     startY: 80,
//     head: [["Day", "Time", "Subject Code", "Teacher", "Classroom", "Link"]],
//     body: flatRows.map(r => [
//       // If rowSpan is 0, we pass null so autoTable knows to skip/merge this cell
//       r.rowSpan > 0 ? { content: r.day_of_week, rowSpan: r.rowSpan } : null,
//       `${t12(r.start_time)} - ${t12(r.end_time)}`,
//       r.subject_code || "-",
//       r.teacher_name || "-",
//       r.classroom_name || "-",
//       r.class_link ? "JOIN CLASS" : "-"
//     ].filter(cell => cell !== null)), // Remove the nulls so rowSpan takes effect
    
//     theme: "grid",
//     headStyles: { fillColor: [16, 185, 129], halign: 'center' },
//     styles: { fontSize: 8, valign: 'middle' },
//     columnStyles: {
//       0: { halign: 'center', fontStyle: 'bold' }, // Day Column
//       5: { halign: 'center' }                     // Link Column
//     },

//     willDrawCell: (data) => {
//       // Set text color to BLUE for the link column (Index 5)
//       if (data.section === 'body' && data.column.index === 5) {
//         const link = flatRows[data.row.index]?.class_link;
//         if (link && link !== "-") {
//           doc.setTextColor(0, 0, 255);
//         }
//       }
//     },

//     didDrawCell: (data) => {
//       if (data.section === 'body' && data.column.index === 5) {
//         const link = flatRows[data.row.index]?.class_link;
//         if (link && link !== "-") {
//           // 3. Add Underline logic
//           const text = data.cell.text[0];
//           const textWidth = doc.getTextWidth(text);
//           const startX = data.cell.x + (data.cell.width - textWidth) / 2; // Centered underline
//           const startY = data.cell.y + data.cell.height - 5;

//           doc.setDrawColor(0, 0, 255);
//           doc.line(startX, startY, startX + textWidth, startY);
//           doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link });
//         }
//       }
//     }
//   });

//   doc.save("Timetable.pdf");
// };

  

//   const downloadExcel = () => {
//     const rows = timetable.map(r => ({
//       Day: r.day_of_week, Time: `${t12(r.start_time)} - ${t12(r.end_time)}`,
//       "Subject Code": r.subject_code || "-", Teacher: r.teacher_name || "-",
//       Classroom: r.classroom_name || "-", Link: r.class_link || "-"
//     }));
//     const ws = XLSX.utils.json_to_sheet(rows);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Timetable");
//     XLSX.writeFile(wb, "Timetable.xlsx");
//   };

//   const filteredTimetable = timetable.filter(r =>
//     r.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
//     r.teacher_name?.toLowerCase().includes(search.toLowerCase())
//   );

//   const groupedTimetable = filteredTimetable.reduce((acc, curr) => {
//     if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
//     acc[curr.day_of_week].push(curr);
//     return acc;
//   }, {});

//   const orderedDays = DAY_ORDER.filter(d => groupedTimetable[d]);

//   return (
//     <div className="timetable-page">
//       <div className="container">
//         <div className="page-header">
//            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
//             <div>
//               <h1 className="title">Time Table</h1>
//               <p className="subtitle">{timetable.length} Active Slots</p>
//             </div>
//           </div>
//           <div className="export-menu-wrapper">
//             <button className="btn secondary" onClick={() => setExportOpen(!exportOpen)}>
//               <Download size={18} /> Export <ChevronDown size={14} />
//             </button>
//             {exportOpen && (
//               <div className="export-dropdown shadow-lg">
//                 <button onClick={downloadExcel}><FileText size={14}/> Excel (.xlsx)</button>
//                 <button onClick={downloadPDF}><FileText size={14}/> PDF (.pdf)</button>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="filter-bar">
//           <div className="filter-item">
//             <Filter size={18} />
//             <select value={form.cohort} onChange={e => setForm({ cohort: e.target.value, batch: "" })}>
//               <option value="">Select Cohort</option>
//               {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
//             </select>
//           </div>
//           <div className="filter-item">
//             <Layout size={18} />
//             <select value={form.batch} disabled={!form.cohort} onChange={e => setForm({ ...form, batch: e.target.value })}>
//               <option value="">Select Batch</option>
//               {filteredBatches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
//             </select>
//           </div>
//           <div className="filter-item search-box">
//             <Search size={18} />
//             <input placeholder="Search Teacher/Subject..." value={search} onChange={e => setSearch(e.target.value)} />
//           </div>
//           {form.batch && (
//             <button className="btn primary" style={{marginLeft:'auto'}} onClick={() => { resetSlotForm(); setShowSlotForm(true); }}>
//               <Plus size={18} /> Create Slot
//             </button>
//           )}
//         </div>

//         <div className="table-wrapper">
//           {form.batch ? (
//             <table className="students-table">
//               <thead>
//                 <tr>
//                   <th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Link</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orderedDays.map(day => groupedTimetable[day].map((r, idx) => (
//                     <tr key={r.timetable_id} style={{ backgroundColor: conflictsMap[r.timetable_id] ? "#fff1f2" : "inherit" }}>
//                       <td style={{fontWeight:'700'}}>{idx === 0 ? day : ""}</td>
//                       <td>{t12(r.start_time)} - {t12(r.end_time)}</td>
//                       <td style={{fontWeight:'600'}}>{r.subject_name}</td>
//                       <td>{r.teacher_name}</td>
//                       <td>{r.classroom_name}</td>
//                       <td>
//                         {r.class_link ? <a href={r.class_link} target="_blank" rel="noreferrer" style={{color:'#10b981'}}><ExternalLink size={14}/> Link</a> : "-"}
//                       </td>
//                       <td>
//                         <div style={{display:'flex', gap:'10px'}}>
//                           <button onClick={() => handleEditClick(r)} style={{color:'#d97706', border:'none', background:'none', cursor:'pointer'}}><Edit size={16}/></button>
//                           <button onClick={() => handleDelete(r.timetable_id)} style={{color:'#dc2626', border:'none', background:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
//                         </div>
//                       </td>
//                     </tr>
//                 )))}
//               </tbody>
//             </table>
//           ) : <div className="no-data" style={{padding:'50px', textAlign:'center', color:'#94a3b8'}}>Select Batch to view Timetable</div>}
//         </div>

//         {showSlotForm && (
//           <div className="modal">
//             <div className="modal-content">
//               <h3 className="title">{editing ? "Update Slot" : "Create Slot"}</h3>
//               <div className="edit-form grid-2-col" style={{marginTop:'15px'}}>
//                 <div className="form-group" style={{gridColumn: 'span 2'}}>
//                   <label>Classroom</label>
//                   {editing ? <div className="form-input" style={{background:'#f1f5f9'}}>{editing.classroom_name}</div> : (
//                     <select name="classroom_id" value={slotForm.classroom_id} onChange={handleSlotChange} className="form-input">
//                       <option value="">Select Classroom</option>
//                       {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
//                     </select>
//                   )}
//                 </div>
//                 <div className="form-group" style={{gridColumn: 'span 2'}}>
//                   <label>Class Link (Read-only on Create)</label>
//                   <input 
//                     type="url" name="class_link" value={slotForm.class_link || ""} 
//                     onChange={(e) => setSlotForm({...slotForm, class_link: e.target.value})} 
//                     className="form-input" readOnly={!editing} 
//                     style={!editing ? {backgroundColor:'#f8fafc', cursor:'not-allowed'} : {}}
//                     placeholder="Auto-populated from classroom" 
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Day</label>
//                   <select name="day_of_week" value={slotForm.day_of_week} onChange={handleSlotChange} className="form-input">
//                     {DAY_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Start Time</label>
//                   <input type="time" name="start_time" value={slotForm.start_time} onChange={handleSlotChange} className="form-input" />
//                 </div>
//                 <div className="form-group">
//                   <label>End Time</label>
//                   <input type="time" name="end_time" value={slotForm.end_time} onChange={handleSlotChange} className="form-input" />
//                 </div>
//               </div>
//               <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
//                 <button className="btn secondary" onClick={() => setShowSlotForm(false)}>Cancel</button>
//                 <button className="btn primary" onClick={handleCreateOrUpdate}><CheckCircle size={18}/> Save</button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }