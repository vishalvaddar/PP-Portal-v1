// client/src/pages/Coordinator/StudentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./BatchManagement.css";
import {
  Search,
  Eye,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  ChevronDown,
  Phone,
  User,
  Mail,
  MapPin,
  BookOpen,
  Settings,
  ListChecks,
  Lock,
  Smartphone,
  Briefcase,
  History,
  Calendar,
  GraduationCap,
  MoreHorizontal,
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// --- EXPORT LOGIC IMPORTS ---
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Logo from "../../assets/RCF-PP.jpg";

const BACKEND = process.env.REACT_APP_BACKEND_API_URL;

const STUDENT_MASTER_FIELDS = [
  { id: "sl_no", label: "SL NO" },
  { id: "student_name", label: "Student Name" },
  { id: "enr_id", label: "Enrollment ID" },
  { id: "sim_name", label: "SIM Name" },
  { id: "contact_no1", label: "Student Contact" },
  { id: "contact_no2", label: "Parent Contact" },
  { id: "student_email", label: "Student Email" },
  { id: "student_email_password", label: "Email Password" },
  { id: "parent_email", label: "Parent Email" },
  { id: "gender", label: "Gender" },
  { id: "father_name", label: "Father Name" },
  { id: "father_occupation", label: "Father Occupation" },
  { id: "mother_name", label: "Mother Name" },
  { id: "mother_occupation", label: "Mother Occupation" },
  { id: "home_address", label: "Home Address" },
  { id: "current_institute_dise_code", label: "Current Institute (DISE)" },
  { id: "previous_institute_dise_code", label: "Previous Institute (DISE)" },
  { id: "teacher_name", label: "Teacher Name" },
  { id: "teacher_mobile_number", label: "Teacher Mobile" },
  { id: "recharge_status", label: "Recharge Status" },
  { id: "sponsor", label: "Sponsor" },
  { id: "active_yn", label: "Status" },
  { id: "inactive_reason", label: "Inactive Reason" },
  { id: "cohort_name", label: "Cohort" },
  { id: "batch_name", label: "Batch" },
];

export default function StudentManagement() {
  const [fullPhoto, setFullPhoto] = useState(null);
  const { user } = useAuth();
  const token = user?.token;

  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({ cohort: "", batch: "" });
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [viewStudent, setViewStudent] = useState(null);
  const [inactiveHistory, setInactiveHistory] = useState([]);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [instSearch, setInstSearch] = useState("");
  const [instOptions, setInstOptions] = useState([]);
  const [isSearchingInst, setIsSearchingInst] = useState(false);

  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [changesSummary, setChangesSummary] = useState([]);

  const [inactiveModal, setInactiveModal] = useState(null);
  const [inactiveReason, setInactiveReason] = useState("");

  const [exportOpen, setExportOpen] = useState(false);
  const [customExportModal, setCustomExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState(""); 
  const [selectedFields, setSelectedFields] = useState(["sl_no", "student_name", "enr_id", "contact_no1", "cohort_name", "batch_name", "active_yn"]);

  const axiosConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  /* ---------------- INSTITUTE SEARCH (DEBOUNCED) ---------------- */
  useEffect(() => {
    if (instSearch.length < 3 || instSearch.includes(" | ")) {
      setInstOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingInst(true);
      try {
        const { data } = await axios.get(`${BACKEND}/api/coordinator/institutes/search`, {
          ...axiosConfig(),
          params: { q: instSearch }
        });
        setInstOptions(data || []);
      } catch (e) { console.error("Search error"); }
      finally { setIsSearchingInst(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [instSearch, axiosConfig]);

  /* ---------------- FETCH DATA ---------------- */
  const fetchStudents = useCallback(() => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`${BACKEND}/api/coordinator/students`, { ...axiosConfig(), params: { cohortNumber: formData.cohort, batchId: formData.batch } })
      .then(({ data }) => {
        const uniqueData = Array.from(new Map(data.map(item => [item.student_id, item])).values());
        setStudents(uniqueData || []);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [token, formData, axiosConfig]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchInactiveHistory = async (studentId) => {
    try {
      const { data } = await axios.get(`${BACKEND}/api/coordinator/students/${studentId}/inactive-history`, axiosConfig());
      setInactiveHistory(data || []);
    } catch (err) { setInactiveHistory([]); }
  };

  const handleOpenProfile = (student) => {
    setViewStudent(student);
    fetchInactiveHistory(student.student_id);
  };

  useEffect(() => {
    if (!token) return;
    axios.get(`${BACKEND}/api/coordinator/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || []));
  }, [token, axiosConfig]);

  useEffect(() => {
    if (!token || !formData.cohort) { setBatches([]); return; }
    axios.get(`${BACKEND}/api/coordinator/batches`, { ...axiosConfig(), params: { cohort_number: formData.cohort } })
      .then(({ data }) => setBatches(data || []));
  }, [token, formData.cohort, axiosConfig]);

  /* ---------------- FILTER ---------------- */
  useEffect(() => {
    let f = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter((s) => 
        s.student_name?.toLowerCase().includes(q) || 
        String(s.enr_id ?? "").toLowerCase().includes(q) ||
        s.sim_name?.toLowerCase().includes(q) || 
        s.contact_no1?.includes(q)
      );
    }
    if (statusFilter !== "all") {
      f = f.filter((s) => (s.active_yn || "").toUpperCase() === statusFilter);
    }
    setFilteredStudents(f);
  }, [students, searchQuery, statusFilter]);

  /* ---------------- EXPORTS ---------------- */
  const toggleField = (id) => {
    setSelectedFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const getExportData = () => {
    const activeFields = STUDENT_MASTER_FIELDS.filter(f => selectedFields.includes(f.id));
    const rows = filteredStudents.map((s, index) => {
      let row = {};
      activeFields.forEach(field => {
        if (field.id === "sl_no") row[field.label] = index + 1;
        else if (field.id === "gender") row[field.label] = s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : s.gender || "-";
        else row[field.label] = s[field.id] ?? "-";
      });
      return row;
    });
    return { data: rows, headers: activeFields.map(f => f.label) };
  };

  // Helper to generate the standardized file name
  const generateFileName = () => {
    const cohortDisplayName = cohorts.find(c => String(c.cohort_number) === String(formData.cohort))?.cohort_name || "ALL COHORTS";
    const batchDisplayName = batches.find(b => String(b.batch_id) === String(formData.batch))?.batch_name || "ALL BATCHES";
    const userFileName = exportFileName.trim() ? ` - ${exportFileName}` : "";
    return `${cohortDisplayName.toUpperCase()} - ${batchDisplayName.toUpperCase()}${userFileName}`;
  };

  const exportPDF = async () => {
    const { data, headers } = getExportData();
    if (!data.length) return alert("No rows to export.");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: headers.length > 6 ? "landscape" : "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();

      let logoDataUrl = null;
      try {
        const resp = await fetch(Logo);
        const blob = await resp.blob();
        logoDataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) { console.warn("Logo failed to load"); }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("PRATIBHA POSHAK", (pageWidth - doc.getTextWidth("PRATIBHA POSHAK")) / 2, 40);
      
      doc.setFontSize(11);
      const subTitle = generateFileName(); // Shows COHORT - BATCH - USERNAME in PDF
      doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 60);

      if (logoDataUrl) doc.addImage(logoDataUrl, "JPEG", pageWidth - 80, 15, 50, 50);

      autoTable(doc, {
        startY: 85,
        head: [headers],
        body: data.map(r => Object.values(r)),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], fontSize: 8, halign: 'center' },
        styles: { fontSize: 7, halign: 'center' },
      });

      doc.save(`${generateFileName()}.pdf`);
    } catch (err) { alert("PDF Export Error"); }
    finally { 
        setExportOpen(false); 
        setCustomExportModal(false); 
        setExportFileName(""); 
    }
  };

  const exportExcel = () => {
    const { data } = getExportData();
    if (!data.length) return alert("No rows to export.");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    XLSX.writeFile(workbook, `${generateFileName()}.xlsx`);
    
    setExportOpen(false);
    setCustomExportModal(false);
    setExportFileName("");
  };

  const handleDefaultExport = (format) => {
    setSelectedFields(["sl_no", "student_name", "enr_id", "contact_no1", "cohort_name", "batch_name", "active_yn"]);
    setExportFileName(""); 
    setTimeout(() => {
        if(format === 'excel') exportExcel();
        if(format === 'pdf') exportPDF();
    }, 100);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewChanges = () => {
    const summary = [];
    Object.keys(editForm).forEach(key => {
      if (editForm[key] !== editStudent[key]) {
        const ignore = ['updated_at', 'created_at', 'batch_name', 'cohort_name', 'applicant_id', 'previous_institute_dise_code', 'current_institute', 'previous_institute'];
        if (!ignore.includes(key)) {
          summary.push({
            field: key === 'student_id' ? 'APPLICANT ID' : key.replace(/_dise_code/g, "").replace(/_/g, " ").toUpperCase(),
            from: editStudent[key] || "—",
            to: editForm[key] || "—"
          });
        }
      }
    });
    if (summary.length === 0) return window.alert("No changes detected.");
    setChangesSummary(summary);
    setShowCommitConfirm(true);
  };

  const saveEdit = async () => {
    try {
      const cleanedData = { ...editForm };
      if (editForm.current_institute_dise_code !== editStudent.current_institute_dise_code) {
        cleanedData.previous_institute_dise_code = editStudent.current_institute_dise_code;
      }
      const fieldsToRemove = ['current_institute', 'previous_institute', 'batch_name', 'cohort_name', 'cohort_number', 'inactive_reason', 'created_at', 'updated_at'];
      fieldsToRemove.forEach(f => delete cleanedData[f]);

      await axios.put(`${BACKEND}/api/coordinator/students/${editStudent.student_id}`, cleanedData, axiosConfig());
      window.alert("Student profile updated successfully!");
      setEditStudent(null);
      setShowCommitConfirm(false);
      fetchStudents();
    } catch (err) { window.alert("Failed to update student profile."); }
  };

  const handleStatusChange = async (student, newStatus) => {
    if (student.active_yn === "INACTIVE" && newStatus === "ACTIVE") {
      window.alert("YOU CANT MAKE THE STUDENT AS ACTIVE . CONTACT THE ADMIN");
      return;
    }
    if (newStatus === "INACTIVE") {
      setInactiveModal(student);
      setInactiveReason("");
    } else {
      try {
        await axios.put(`${BACKEND}/api/coordinator/students/${student.student_id}`, { active_yn: "ACTIVE" }, axiosConfig());
        fetchStudents();
      } catch (err) { window.alert("Error updating status."); }
    }
  };

  const confirmInactive = async () => {
    if (!inactiveReason.trim()) return alert("Enter reason");
    try {
      await axios.put(`${BACKEND}/api/coordinator/students/${inactiveModal.student_id}`, { active_yn: "INACTIVE", inactive_reason: inactiveReason }, axiosConfig());
      setInactiveModal(null); setInactiveReason(""); fetchStudents();
    } catch (err) { window.alert("Error."); }
  };

  return (
    <div className="full-page-container">
      {/* HEADER WITH LOGO */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={Logo} alt="RCF Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
          <div>
            <h1 className="title">Student Management</h1>
            <p className="subtitle">Coordinating {filteredStudents.length} unique student records</p>
          </div>
        </div>

        <div className="export-menu-wrapper">
          <button className="btn primary" onClick={() => setExportOpen(!exportOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div className="export-dropdown shadow-lg">
              <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Default Export</div>
              <button onClick={() => handleDefaultExport('excel')}>Excel (.xlsx)</button>
              <button onClick={() => handleDefaultExport('pdf')}>PDF (.pdf)</button>
              
              <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', marginTop: '5px' }}>Master Export</div>
              <button onClick={() => { setCustomExportModal(true); setExportOpen(false); }} style={{ color: '#2563eb', fontWeight: '600' }}>
                <Settings size={14} className="inline mr-2" /> Custom Master Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-item">
          <Filter className="input-icon" />
          <select value={formData.cohort} onChange={(e) => setFormData({ cohort: e.target.value, batch: "" })}>
            <option value="">All Cohorts</option>
            {cohorts.map((c) => (<option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>))}
          </select>
        </div>
        <div className="filter-item">
          <select value={formData.batch} disabled={!formData.cohort} onChange={(e) => setFormData((p) => ({ ...p, batch: e.target.value }))}>
            <option value="">All Batches</option>
            {batches.map((b) => (<option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>))}
          </select>
        </div>
        <div className="filter-item search-box" style={{ flex: 1 }}>
          <Search className="input-icon" />
          <input placeholder="Search Name, ID or SIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div className="table-wrapper shadow-md rounded-lg bg-white">
        <table className="students-table">
          <thead>
            <tr>
              <th style={{ width: "45px" }}>SL NO</th>
              <th>Student Name</th>
              <th>Enrollment Number</th>
              <th>Contact No</th>
              <th>Cohort</th>
              <th>Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, index) => (
              <tr key={s.student_id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <div className="student-info" style={{ display: 'flex', alignItems: 'center' }}>
                    <div onClick={() => handleOpenProfile(s)} style={{ cursor: "pointer", width: "35px", height: "35px", borderRadius: "50%", overflow: "hidden", marginRight: "10px", border: "1px solid #ddd" }}>
                      <img src={s.photo_link ? `${BACKEND}/${s.photo_link}` : "https://via.placeholder.com/35"} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => handleOpenProfile(s)} style={{ color: "#2563eb", fontWeight: "600", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px" }}>
                        {s.student_name}
                      </button>
                      <button onClick={() => { setEditStudent(s); setEditForm({...s}); setInstSearch(""); setShowCommitConfirm(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706" }}><Edit size={14} /></button>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: "600", color: "#4b5563" }}>{s.enr_id}</td>
                <td>{s.contact_no1 || "—"}</td>
                <td>{s.cohort_name}</td>
                <td>{s.batch_name}</td>
                <td>
                  <select 
                    value={s.active_yn} 
                    onChange={(e) => handleStatusChange(s, e.target.value)} 
                    className={`status-select ${s.active_yn === 'ACTIVE' ? 'active' : 'inactive'}`}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CUSTOM EXPORT MODAL */}
      {customExportModal && (
        <div className="modal">
          <div className="modal-content medium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 className="modal-title"><ListChecks className="inline mr-2" /> Master Export Settings</h3>
              <button onClick={() => setCustomExportModal(false)}><X /></button>
            </div>

            {/* --- FILE NAME INPUT --- */}
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '8px', color: '#0369a1', fontSize: '13px' }}>
                    <FileText size={16} /> Report File Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#555', marginBottom: '5px' }}>
                    <span style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                        {cohorts.find(c => String(c.cohort_number) === String(formData.cohort))?.cohort_name || "COHORT-XX"} - {batches.find(b => String(b.batch_id) === String(formData.batch))?.batch_name || "BATCH-XX"} - 
                    </span>
                </div>
                <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type custom name here..." 
                    value={exportFileName} 
                    onChange={(e) => setExportFileName(e.target.value)}
                    style={{ background: 'white' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
              {STUDENT_MASTER_FIELDS.map(field => (
                <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #f3f4f6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={selectedFields.includes(field.id)} onChange={() => toggleField(field.id)} />
                  {field.label}
                </label>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', background: '#f9fafb', padding: '15px', borderRadius: '8px', gap: '10px' }}>
                <button className="btn secondary" onClick={exportPDF}>Export PDF</button>
                <button className="btn primary" onClick={exportExcel}>Export Excel (.xlsx)</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {viewStudent && (
        <div className="modal">
          <div className="modal-content large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
               <img src={Logo} alt="Logo" style={{ width: '50px' }} />
               <button className="close-btn" onClick={() => setViewStudent(null)}><X size={20} /></button>
            </div>
            
            <div className="profile-header-card" style={{ textAlign: "center", marginBottom: 25 }}>
              <div className="avatar-lg" onClick={() => setFullPhoto(`${BACKEND}/${viewStudent.photo_link}`)}>
                <img src={viewStudent.photo_link ? `${BACKEND}/${viewStudent.photo_link}` : "https://via.placeholder.com/120"} alt="Student" />
              </div>
              <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: '#111827' }}>{viewStudent.student_name}</h2>
              <span className={`status-badge ${viewStudent.active_yn === "ACTIVE" ? "active" : "inactive"}`} style={{ fontSize: 12 }}>{viewStudent.active_yn}</span>
            </div>

            <div className="profile-sections-container">
              <div className="profile-section-block">
                <h4 className="section-title"><User size={18} /> Personal Details</h4>
                <div className="profile-grid">
                  <div><strong>Gender:</strong> {viewStudent.gender === "M" ? "Male" : viewStudent.gender === "F" ? "Female" : viewStudent.gender || "-"}</div>
                  <div><strong>Enrollment ID:</strong> {viewStudent.enr_id}</div>
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title"><BookOpen size={18} /> Academic Details</h4>
                <div className="profile-grid">
                  <div><strong>Cohort:</strong> {viewStudent.cohort_name}</div>
                  <div><strong>Batch:</strong> {viewStudent.batch_name}</div>
                  <div><strong>Sponsor:</strong> {viewStudent.sponsor || "-"}</div>
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title" style={{ color: '#be123c' }}><History size={18} /> Inactive History</h4>
                <div className="history-timeline" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {inactiveHistory.length > 0 ? (
                    inactiveHistory.map((h, i) => (
                      <div key={i} className="history-entry" style={{ padding: '8px', borderLeft: '3px solid #be123c', background: '#fff5f5', marginBottom: '8px', borderRadius: '0 4px 4px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={12} /> {new Date(h.inactive_date).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4b5563' }}><strong>Reason:</strong> {h.inactive_reason}</div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No historical records found.</p>
                  )}
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title"><Phone size={18} /> Contact Information</h4>
                <div className="profile-grid">
                  <div><strong>Student Contact:</strong> {viewStudent.contact_no1}</div>
                  <div><strong>Student Email:</strong> {viewStudent.student_email}</div>
                  <div style={{ display: 'flex', gap: '4px' }}><Lock size={12}/> <strong>Email Password:</strong> {viewStudent.student_email_password || "-"}</div>
                  <div><strong>Parent Contact:</strong> {viewStudent.contact_no2}</div>
                  <div><strong>Parent Email:</strong> {viewStudent.parent_email || "-"}</div>
                  <div className="full-row"><strong>Home Address:</strong> {viewStudent.home_address}</div>
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title"><Briefcase size={18} /> Family Details</h4>
                <div className="profile-grid">
                  <div><strong>Father:</strong> {viewStudent.father_name}</div>
                  <div><strong>Father Occ.:</strong> {viewStudent.father_occupation}</div>
                  <div><strong>Mother:</strong> {viewStudent.mother_name}</div>
                  <div><strong>Mother Occ.:</strong> {viewStudent.mother_occupation}</div>
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title"><GraduationCap size={18} /> Institute & Teacher</h4>
                <div className="profile-grid">
                  <div><strong>Current Institute:</strong> {viewStudent.current_institute} ({viewStudent.current_institute_dise_code || "N/A"})</div>
                  <div><strong>Previous Institute:</strong> {viewStudent.previous_institute} ({viewStudent.previous_institute_dise_code || "N/A"})</div>
                  <div><strong>Teacher Name:</strong> {viewStudent.teacher_name}</div>
                  <div><strong>Teacher Mobile:</strong> {viewStudent.teacher_mobile_number || "-"}</div>
                </div>
              </div>

              <div className="profile-section-block">
                <h4 className="section-title"><MoreHorizontal size={18} /> Other Details</h4>
                <div className="profile-grid">
                  <div><strong>SIM Name:</strong> <span style={{ fontWeight: 'bold' }}>{viewStudent.sim_name || "NOT ASSIGNED"}</span></div>
                  <div><strong>Recharge Status:</strong> {viewStudent.recharge_status || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editStudent && (
        <div className="modal">
          <div className="modal-content large">
            <button className="close-btn" onClick={() => { setEditStudent(null); setShowCommitConfirm(false); }}><X size={18} /></button>
            <h3 className="modal-title">
              {showCommitConfirm ? "Review & Confirm Changes" : "Edit Student Details"}
            </h3>
            
            {!showCommitConfirm ? (
              <>
                <div className="edit-form grid-2-col" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {Object.keys(editForm).map((k) => {
                    if (['applicant_id', 'photo_link', 'batch_id', 'cohort_number', 'inactive_reason', 'batch_name', 'cohort_name', 'created_at', 'updated_at', 'previous_institute_dise_code', 'current_institute', 'previous_institute'].includes(k)) return null;
                    const isLocked = ['student_id', 'enr_id', 'student_email', 'student_email_password', 'parent_email', 'student_name', 'sponsor', 'active_yn'].includes(k);

                    if (k === 'current_institute_dise_code') {
                      return (
                        <div className="form-group" key={k} style={{ gridColumn: 'span 2', position: 'relative' }}>
                          <label style={{ fontWeight: '700', color: '#1e40af' }}>Current Institute (DISE | Name)</label>
                          <div style={{ position: 'relative' }}>
                            <input type="text" className="form-input" placeholder="Type 3+ chars to search..." value={instSearch} onChange={(e) => setInstSearch(e.target.value)} />
                            {isSearchingInst && <Loader2 className="animate-spin" size={16} style={{ position: 'absolute', right: '10px', top: '10px' }} />}
                          </div>
                          {instOptions.length > 0 && (
                            <div className="inst-search-results">
                              {instOptions.map(inst => (
                                <div key={inst.dise_code} className="inst-item" onClick={() => {
                                    setEditForm(prev => ({ ...prev, current_institute_dise_code: inst.dise_code }));
                                    setInstSearch(`${inst.dise_code} | ${inst.institute_name}`);
                                    setInstOptions([]);
                                  }}>
                                  <strong>{inst.dise_code}</strong> | {inst.institute_name}
                                </div>
                              ))}
                            </div>
                          )}
                          <small>Currently mapped DISE: <strong>{editForm.current_institute_dise_code}</strong></small>
                        </div>
                      );
                    }

                    return (
                      <div className="form-group" key={k}>
                        <label style={{ textTransform: 'capitalize', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {k === 'student_id' ? 'Applicant ID' : k.replace(/_/g, " ")} {isLocked && <Lock size={12} className="text-gray-400" />}
                        </label>
                        <input name={k} value={editForm[k] || ""} onChange={handleEditChange} readOnly={isLocked} className={`form-input ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} />
                      </div>
                    )
                  })}
                </div>
                <div className="modal-actions">
                  <button className="btn secondary" onClick={() => setEditStudent(null)}>Discard</button>
                  <button className="btn primary" onClick={handleReviewChanges}>Review Changes</button>
                </div>
              </>
            ) : (
              <div className="commit-preview-container">
                <div className="change-list shadow-inner" style={{ background: '#f8fafc', borderRadius: '8px', padding: '15px' }}>
                    {changesSummary.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.field}</span>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#ef4444', textDecoration: 'line-through', fontSize: '11px' }}>{c.from}</span>
                                <ArrowRight size={14} className="mx-2 inline text-gray-400" />
                                <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '13px' }}>{c.to}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button className="btn secondary" onClick={() => setShowCommitConfirm(false)}>Back</button>
                  <button className="btn primary" onClick={saveEdit} style={{ background: '#059669', color: 'white' }}>
                    <CheckCircle size={18} className="mr-2 inline" /> Confirm & Commit Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INACTIVE MODAL */}
      {inactiveModal && (
        <div className="modal">
          <div className="modal-content small">
            <h3 className="modal-title text-red-600"><AlertTriangle className="inline w-5 h-5 mr-1" /> Confirm Deactivation</h3>
            <textarea rows={4} value={inactiveReason} onChange={(e) => setInactiveReason(e.target.value)} placeholder="Type reason here..." className="w-full border p-2 rounded" />
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => {setInactiveModal(null); setInactiveReason("");}}>Cancel</button>
              <button className="btn danger" onClick={confirmInactive}>Confirm Inactive</button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO VIEW */}
      {fullPhoto && (
        <div className="modal" onClick={() => setFullPhoto(null)}>
          <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center", padding: '10px' }} onClick={e => e.stopPropagation()}>
            <img src={fullPhoto} alt="Full View" style={{ maxWidth: "100%", borderRadius: "8px" }} />
          </div>
        </div>
      )}

      <style>{`
        .full-page-container { width: 100%; max-width: 100vw; padding: 20px; box-sizing: border-box; min-height: 100vh; background-color: #f9fafb; }
        .table-wrapper { width: 100%; overflow-x: auto; margin-top: 20px; }
        .students-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .filter-bar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .inst-search-results { position: absolute; top: 100%; left: 0; right: 0; z-index: 9999; background: white; max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-top: 5px; }
        .inst-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .inst-item:hover { background-color: #f8fafc; color: #2563eb; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .profile-sections-container { display: flex; flex-direction: column; gap: 15px; }
        .profile-section-block { border: 1px solid #e5e7eb; padding: 15px; border-radius: 10px; background: #fff; }
        .section-title { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #1e40af; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 12px; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
        .avatar-lg { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; }
        .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .form-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .status-select { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #ddd; cursor: pointer; }
        .status-select.active { color: #16a34a; }
        .status-select.inactive { color: #dc2626; }
      `}</style>
    </div>
  );
}


// // / 22/12/2025
// // client/src/pages/Coordinator/StudentManagement.jsx
// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import "./BatchManagement.css";
// import {
//   Search,
//   Eye,
//   Edit,
//   X,
//   CheckCircle,
//   AlertTriangle,
//   Filter,
//   Download,
//   ChevronDown,
//   Phone,
//   User,
//   Mail,
//   MapPin,
//   BookOpen,
//   Settings,
//   ListChecks,
//   Lock,
//   Smartphone,
//   Briefcase,
//   History,
//   Calendar,
//   GraduationCap,
//   MoreHorizontal,
//   ArrowRight,
//   Loader2
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";

// // --- EXPORT LOGIC IMPORTS ---
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";
// import Logo from "../../assets/RCF-PP.jpg";

// const BACKEND = process.env.REACT_APP_BACKEND_API_URL;

// const STUDENT_MASTER_FIELDS = [
//   { id: "sl_no", label: "SL NO" },
//   { id: "student_name", label: "Student Name" },
//   { id: "enr_id", label: "Enrollment ID" },
//   { id: "sim_name", label: "SIM Name" },
//   { id: "contact_no1", label: "Student Contact" },
//   { id: "contact_no2", label: "Parent Contact" },
//   { id: "student_email", label: "Student Email" },
//   { id: "student_email_password", label: "Email Password" },
//   { id: "parent_email", label: "Parent Email" },
//   { id: "gender", label: "Gender" },
//   { id: "father_name", label: "Father Name" },
//   { id: "father_occupation", label: "Father Occupation" },
//   { id: "mother_name", label: "Mother Name" },
//   { id: "mother_occupation", label: "Mother Occupation" },
//   { id: "home_address", label: "Home Address" },
//   { id: "current_institute_dise_code", label: "Current Institute (DISE)" },
//   { id: "previous_institute_dise_code", label: "Previous Institute (DISE)" },
//   { id: "teacher_name", label: "Teacher Name" },
//   { id: "teacher_mobile_number", label: "Teacher Mobile" },
//   { id: "recharge_status", label: "Recharge Status" },
//   { id: "sponsor", label: "Sponsor" },
//   { id: "active_yn", label: "Status" },
//   { id: "inactive_reason", label: "Inactive Reason" },
//   { id: "cohort_name", label: "Cohort" },
//   { id: "batch_name", label: "Batch" },
// ];

// export default function StudentManagement() {
//   const [fullPhoto, setFullPhoto] = useState(null);
//   const { user } = useAuth();
//   const token = user?.token;

//   const [cohorts, setCohorts] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [formData, setFormData] = useState({ cohort: "", batch: "" });
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [loading, setLoading] = useState(false);

//   const [viewStudent, setViewStudent] = useState(null);
//   const [inactiveHistory, setInactiveHistory] = useState([]);
//   const [editStudent, setEditStudent] = useState(null);
//   const [editForm, setEditForm] = useState({});

//   const [instSearch, setInstSearch] = useState("");
//   const [instOptions, setInstOptions] = useState([]);
//   const [isSearchingInst, setIsSearchingInst] = useState(false);

//   const [showCommitConfirm, setShowCommitConfirm] = useState(false);
//   const [changesSummary, setChangesSummary] = useState([]);

//   const [inactiveModal, setInactiveModal] = useState(null);
//   const [inactiveReason, setInactiveReason] = useState("");

//   const [exportOpen, setExportOpen] = useState(false);
//   const [customExportModal, setCustomExportModal] = useState(false);
//   const [selectedFields, setSelectedFields] = useState(["sl_no", "student_name", "enr_id", "contact_no1", "cohort_name", "batch_name", "active_yn"]);

//   const axiosConfig = useCallback(() => ({
//     headers: { Authorization: `Bearer ${token}` },
//   }), [token]);

//   /* ---------------- INSTITUTE SEARCH (DEBOUNCED) ---------------- */
//   useEffect(() => {
//     if (instSearch.length < 3 || instSearch.includes(" | ")) {
//       setInstOptions([]);
//       return;
//     }
//     const timer = setTimeout(async () => {
//       setIsSearchingInst(true);
//       try {
//         const { data } = await axios.get(`${BACKEND}/api/coordinator/institutes/search`, {
//           ...axiosConfig(),
//           params: { q: instSearch }
//         });
//         setInstOptions(data || []);
//       } catch (e) { console.error("Search error"); }
//       finally { setIsSearchingInst(false); }
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [instSearch, axiosConfig]);

//   /* ---------------- FETCH DATA ---------------- */
//   const fetchStudents = useCallback(() => {
//     if (!token) return;
//     setLoading(true);
//     axios
//       .get(`${BACKEND}/api/coordinator/students`, { ...axiosConfig(), params: { cohortNumber: formData.cohort, batchId: formData.batch } })
//       .then(({ data }) => {
//         const uniqueData = Array.from(new Map(data.map(item => [item.student_id, item])).values());
//         setStudents(uniqueData || []);
//       })
//       .catch(() => setStudents([]))
//       .finally(() => setLoading(false));
//   }, [token, formData, axiosConfig]);

//   useEffect(() => { fetchStudents(); }, [fetchStudents]);

//   const fetchInactiveHistory = async (studentId) => {
//     try {
//       const { data } = await axios.get(`${BACKEND}/api/coordinator/students/${studentId}/inactive-history`, axiosConfig());
//       setInactiveHistory(data || []);
//     } catch (err) { setInactiveHistory([]); }
//   };

//   const handleOpenProfile = (student) => {
//     setViewStudent(student);
//     fetchInactiveHistory(student.student_id);
//   };

//   useEffect(() => {
//     if (!token) return;
//     axios.get(`${BACKEND}/api/coordinator/cohorts`, axiosConfig()).then(({ data }) => setCohorts(data || []));
//   }, [token, axiosConfig]);

//   useEffect(() => {
//     if (!token || !formData.cohort) { setBatches([]); return; }
//     axios.get(`${BACKEND}/api/coordinator/batches`, { ...axiosConfig(), params: { cohort_number: formData.cohort } })
//       .then(({ data }) => setBatches(data || []));
//   }, [token, formData.cohort, axiosConfig]);

//   /* ---------------- FILTER ---------------- */
//   useEffect(() => {
//     let f = [...students];
//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase();
//       f = f.filter((s) => 
//         s.student_name?.toLowerCase().includes(q) || 
//         String(s.enr_id ?? "").toLowerCase().includes(q) ||
//         s.sim_name?.toLowerCase().includes(q) || 
//         s.contact_no1?.includes(q)
//       );
//     }
//     if (statusFilter !== "all") {
//       f = f.filter((s) => (s.active_yn || "").toUpperCase() === statusFilter);
//     }
//     setFilteredStudents(f);
//   }, [students, searchQuery, statusFilter]);

//   /* ---------------- EXPORTS ---------------- */
//   const toggleField = (id) => {
//     setSelectedFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
//   };

//   const getExportData = () => {
//     const activeFields = STUDENT_MASTER_FIELDS.filter(f => selectedFields.includes(f.id));
//     const rows = filteredStudents.map((s, index) => {
//       let row = {};
//       activeFields.forEach(field => {
//         if (field.id === "sl_no") row[field.label] = index + 1;
//         else if (field.id === "gender") row[field.label] = s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : s.gender || "-";
//         else row[field.label] = s[field.id] ?? "-";
//       });
//       return row;
//     });
//     return { data: rows, headers: activeFields.map(f => f.label) };
//   };

//   const exportPDF = async () => {
//     const { data, headers } = getExportData();
//     if (!data.length) return alert("No rows to export.");
//     try {
//       const doc = new jsPDF({ unit: "pt", format: "a4", orientation: headers.length > 6 ? "landscape" : "portrait" });
//       const pageWidth = doc.internal.pageSize.getWidth();

//       // Convert Logo to Base64 for embedding
//       let logoDataUrl = null;
//       try {
//         const resp = await fetch(Logo);
//         const blob = await resp.blob();
//         logoDataUrl = await new Promise((res) => {
//           const reader = new FileReader();
//           reader.onloadend = () => res(reader.result);
//           reader.readAsDataURL(blob);
//         });
//       } catch (e) { console.warn("Logo failed to load into PDF"); }

//       // Header Text
//       doc.setFont("helvetica", "bold");
//       doc.setFontSize(16);
//       doc.text("PRATIBHA POSHAK", (pageWidth - doc.getTextWidth("PRATIBHA POSHAK")) / 2, 40);
      
//       doc.setFontSize(12);
//       const cohortDisplayName = cohorts.find(c => String(c.cohort_number) === String(formData.cohort))?.cohort_name || "All Cohorts";
//       const batchDisplayName = batches.find(b => String(b.batch_id) === String(formData.batch))?.batch_name || "All Batches";
//       const subTitle = `${cohortDisplayName} - ${batchDisplayName} - STUDENT REPORT`;
//       doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 60);

//       // Add Logo on the Right
//       if (logoDataUrl) {
//         doc.addImage(logoDataUrl, "JPEG", pageWidth - 80, 15, 50, 50);
//       }

//       autoTable(doc, {
//         startY: 85,
//         head: [headers],
//         body: data.map(r => Object.values(r)),
//         theme: "grid",
//         headStyles: { fillColor: [16, 185, 129], fontSize: 8, halign: 'center' },
//         styles: { fontSize: 7, halign: 'center' },
//       });

//       doc.save("Student_Report.pdf");
//     } catch (err) { console.error(err); alert("PDF Export Error"); }
//     finally { setExportOpen(false); setCustomExportModal(false); }
//   };

//   const exportExcel = () => {
//     const { data } = getExportData();
//     if (!data.length) return alert("No rows to export.");
//     const worksheet = XLSX.utils.json_to_sheet(data);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
//     XLSX.writeFile(workbook, "Student_Report.xlsx");
//     setExportOpen(false);
//     setCustomExportModal(false);
//   };

//   const handleDefaultExport = (format) => {
//     setSelectedFields(["sl_no", "student_name", "enr_id", "contact_no1", "cohort_name", "batch_name", "active_yn"]);
//     setTimeout(() => {
//         if(format === 'excel') exportExcel();
//         if(format === 'pdf') exportPDF();
//     }, 100);
//   };

//   /* ---------------- ACTIONS ---------------- */
//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleReviewChanges = () => {
//     const summary = [];
//     Object.keys(editForm).forEach(key => {
//       if (editForm[key] !== editStudent[key]) {
//         const ignore = ['updated_at', 'created_at', 'batch_name', 'cohort_name', 'applicant_id', 'previous_institute_dise_code', 'current_institute', 'previous_institute'];
//         if (!ignore.includes(key)) {
//           summary.push({
//             field: key === 'student_id' ? 'APPLICANT ID' : key.replace(/_dise_code/g, "").replace(/_/g, " ").toUpperCase(),
//             from: editStudent[key] || "—",
//             to: editForm[key] || "—"
//           });
//         }
//       }
//     });
//     if (summary.length === 0) return window.alert("No changes detected.");
//     setChangesSummary(summary);
//     setShowCommitConfirm(true);
//   };

//   const saveEdit = async () => {
//     try {
//       const cleanedData = { ...editForm };
      
//       // LOGIC: Shift current to previous if school changed
//       if (editForm.current_institute_dise_code !== editStudent.current_institute_dise_code) {
//         cleanedData.previous_institute_dise_code = editStudent.current_institute_dise_code;
//       }

//       // Cleanup Payload for DB
//       const fieldsToRemove = ['current_institute', 'previous_institute', 'batch_name', 'cohort_name', 'cohort_number', 'inactive_reason', 'created_at', 'updated_at'];
//       fieldsToRemove.forEach(f => delete cleanedData[f]);

//       await axios.put(`${BACKEND}/api/coordinator/students/${editStudent.student_id}`, cleanedData, axiosConfig());
//       window.alert("Student profile updated successfully!");
//       setEditStudent(null);
//       setShowCommitConfirm(false);
//       fetchStudents();
//     } catch (err) { window.alert("Failed to update student profile."); }
//   };

//   const handleStatusChange = async (student, newStatus) => {
//     if (student.active_yn === "INACTIVE" && newStatus === "ACTIVE") {
//       window.alert("YOU CANT MAKE THE STUDENT AS ACTIVE . CONTACT THE ADMIN");
//       return;
//     }
//     if (newStatus === "INACTIVE") {
//       setInactiveModal(student);
//       setInactiveReason("");
//     } else {
//       try {
//         await axios.put(`${BACKEND}/api/coordinator/students/${student.student_id}`, { active_yn: "ACTIVE" }, axiosConfig());
//         fetchStudents();
//       } catch (err) { window.alert("Error updating status."); }
//     }
//   };

//   const confirmInactive = async () => {
//     if (!inactiveReason.trim()) return alert("Enter reason");
//     try {
//       await axios.put(`${BACKEND}/api/coordinator/students/${inactiveModal.student_id}`, { active_yn: "INACTIVE", inactive_reason: inactiveReason }, axiosConfig());
//       setInactiveModal(null); setInactiveReason(""); fetchStudents();
//     } catch (err) { window.alert("Error."); }
//   };

//   return (
//     <div className="full-page-container">
//       {/* HEADER WITH LOGO */}
//       <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//           <img src={Logo} alt="RCF Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
//           <div>
//             <h1 className="title">Student Management</h1>
//             <p className="subtitle">Coordinating {filteredStudents.length} unique student records</p>
//           </div>
//         </div>

//         <div className="export-menu-wrapper">
//           <button className="btn primary" onClick={() => setExportOpen(!exportOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Download size={18} /> Export <ChevronDown size={14} />
//           </button>
//           {exportOpen && (
//             <div className="export-dropdown shadow-lg">
//               <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Default Export</div>
//               <button onClick={() => handleDefaultExport('excel')}>Excel (.xlsx)</button>
//               <button onClick={() => handleDefaultExport('pdf')}>PDF (.pdf)</button>
              
//               <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', marginTop: '5px' }}>Master Export</div>
//               <button onClick={() => { setCustomExportModal(true); setExportOpen(false); }} style={{ color: '#2563eb', fontWeight: '600' }}>
//                 <Settings size={14} className="inline mr-2" /> Custom Master Export
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* FILTER BAR */}
//       <div className="filter-bar">
//         <div className="filter-item">
//           <Filter className="input-icon" />
//           <select value={formData.cohort} onChange={(e) => setFormData({ cohort: e.target.value, batch: "" })}>
//             <option value="">All Cohorts</option>
//             {cohorts.map((c) => (<option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>))}
//           </select>
//         </div>
//         <div className="filter-item">
//           <select value={formData.batch} disabled={!formData.cohort} onChange={(e) => setFormData((p) => ({ ...p, batch: e.target.value }))}>
//             <option value="">All Batches</option>
//             {batches.map((b) => (<option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>))}
//           </select>
//         </div>
//         <div className="filter-item search-box" style={{ flex: 1 }}>
//           <Search className="input-icon" />
//           <input placeholder="Search Name, ID or SIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%' }} />
//         </div>
//       </div>

//       <div className="table-wrapper shadow-md rounded-lg bg-white">
//         <table className="students-table">
//           <thead>
//             <tr>
//               <th style={{ width: "45px" }}>SL NO</th>
//               <th>Student Name</th>
//               <th>Enrollment Number</th>
//               <th>Contact No</th>
//               <th>Cohort</th>
//               <th>Batch</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredStudents.map((s, index) => (
//               <tr key={s.student_id}>
//                 <td style={{ textAlign: 'center' }}>{index + 1}</td>
//                 <td>
//                   <div className="student-info" style={{ display: 'flex', alignItems: 'center' }}>
//                     <div onClick={() => handleOpenProfile(s)} style={{ cursor: "pointer", width: "35px", height: "35px", borderRadius: "50%", overflow: "hidden", marginRight: "10px", border: "1px solid #ddd" }}>
                      
//                       {/* <img src={s.photo_link ? `${BACKEND}/${s.photo_link}` : "https://via.placeholder.com/35"} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> */}
//                       <img src={s.photo_link ? `${BACKEND}/${s.photo_link}` : "https://via.placeholder.com/35"} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                     </div>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                       <button onClick={() => handleOpenProfile(s)} style={{ color: "#2563eb", fontWeight: "600", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px" }}>
//                         {s.student_name}
//                       </button>
//                       <button onClick={() => { setEditStudent(s); setEditForm({...s}); setInstSearch(""); setShowCommitConfirm(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706" }}><Edit size={14} /></button>
//                     </div>
//                   </div>
//                 </td>
//                 <td style={{ fontWeight: "600", color: "#4b5563" }}>{s.enr_id}</td>
//                 <td>{s.contact_no1 || "—"}</td>
//                 <td>{s.cohort_name}</td>
//                 <td>{s.batch_name}</td>
//                 <td>
//                   <select 
//                     value={s.active_yn} 
//                     onChange={(e) => handleStatusChange(s, e.target.value)} 
//                     className={`status-select ${s.active_yn === 'ACTIVE' ? 'active' : 'inactive'}`}
//                   >
//                     <option value="ACTIVE">ACTIVE</option>
//                     <option value="INACTIVE">INACTIVE</option>
//                   </select>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* --- MODALS REMAIN THE SAME BUT WILL BE CENTERED WITHIN FULL PAGE --- */}

//       {/* CUSTOM EXPORT MODAL */}
//       {customExportModal && (
//         <div className="modal">
//           <div className="modal-content medium">
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//               <h3 className="modal-title"><ListChecks className="inline mr-2" /> Select Fields for Master Export</h3>
//               <button onClick={() => setCustomExportModal(false)}><X /></button>
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
//               {STUDENT_MASTER_FIELDS.map(field => (
//                 <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #f3f4f6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
//                   <input type="checkbox" checked={selectedFields.includes(field.id)} onChange={() => toggleField(field.id)} />
//                   {field.label}
//                 </label>
//               ))}
//             </div>
//             <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', background: '#f9fafb', padding: '15px', borderRadius: '8px', gap: '10px' }}>
//                 <button className="btn secondary" onClick={exportPDF}>Export PDF</button>
//                 <button className="btn primary" onClick={exportExcel}>Export Excel (.xlsx)</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* VIEW PROFILE MODAL */}
//       {viewStudent && (
//         <div className="modal">
//           <div className="modal-content large">
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
//                <img src={Logo} alt="Logo" style={{ width: '50px' }} />
//                <button className="close-btn" onClick={() => setViewStudent(null)}><X size={20} /></button>
//             </div>
            
//             <div className="profile-header-card" style={{ textAlign: "center", marginBottom: 25 }}>
//               <div className="avatar-lg" onClick={() => setFullPhoto(`${BACKEND}/${viewStudent.photo_link}`)}>
//                 <img src={viewStudent.photo_link ? `${BACKEND}/${viewStudent.photo_link}` : "https://via.placeholder.com/120"} alt="Student" />
//               </div>
//               <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: '#111827' }}>{viewStudent.student_name}</h2>
//               <span className={`status-badge ${viewStudent.active_yn === "ACTIVE" ? "active" : "inactive"}`} style={{ fontSize: 12 }}>{viewStudent.active_yn}</span>
//             </div>

//             <div className="profile-sections-container">
//               <div className="profile-section-block">
//                 <h4 className="section-title"><User size={18} /> Personal Details</h4>
//                 <div className="profile-grid">
//                   <div><strong>Gender:</strong> {viewStudent.gender === "M" ? "Male" : viewStudent.gender === "F" ? "Female" : viewStudent.gender || "-"}</div>
//                   <div><strong>Enrollment ID:</strong> {viewStudent.enr_id}</div>
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title"><BookOpen size={18} /> Academic Details</h4>
//                 <div className="profile-grid">
//                   <div><strong>Cohort:</strong> {viewStudent.cohort_name}</div>
//                   <div><strong>Batch:</strong> {viewStudent.batch_name}</div>
//                   <div><strong>Sponsor:</strong> {viewStudent.sponsor || "-"}</div>
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title" style={{ color: '#be123c' }}><History size={18} /> Inactive History</h4>
//                 <div className="history-timeline" style={{ maxHeight: '150px', overflowY: 'auto' }}>
//                   {inactiveHistory.length > 0 ? (
//                     inactiveHistory.map((h, i) => (
//                       <div key={i} className="history-entry" style={{ padding: '8px', borderLeft: '3px solid #be123c', background: '#fff5f5', marginBottom: '8px', borderRadius: '0 4px 4px 0' }}>
//                         <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
//                           <Calendar size={12} /> {new Date(h.inactive_date).toLocaleDateString('en-IN')}
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#4b5563' }}><strong>Reason:</strong> {h.inactive_reason}</div>
//                       </div>
//                     ))
//                   ) : (
//                     <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No historical records found.</p>
//                   )}
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title"><Phone size={18} /> Contact Information</h4>
//                 <div className="profile-grid">
//                   <div><strong>Student Contact:</strong> {viewStudent.contact_no1}</div>
//                   <div><strong>Student Email:</strong> {viewStudent.student_email}</div>
//                   <div style={{ display: 'flex', gap: '4px' }}><Lock size={12}/> <strong>Email Password:</strong> {viewStudent.student_email_password || "-"}</div>
//                   <div><strong>Parent Contact:</strong> {viewStudent.contact_no2}</div>
//                   <div><strong>Parent Email:</strong> {viewStudent.parent_email || "-"}</div>
//                   <div className="full-row"><strong>Home Address:</strong> {viewStudent.home_address}</div>
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title"><Briefcase size={18} /> Family Details</h4>
//                 <div className="profile-grid">
//                   <div><strong>Father:</strong> {viewStudent.father_name}</div>
//                   <div><strong>Father Occ.:</strong> {viewStudent.father_occupation}</div>
//                   <div><strong>Mother:</strong> {viewStudent.mother_name}</div>
//                   <div><strong>Mother Occ.:</strong> {viewStudent.mother_occupation}</div>
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title"><GraduationCap size={18} /> Institute & Teacher</h4>
//                 <div className="profile-grid">
//                   <div><strong>Current Institute:</strong> {viewStudent.current_institute} ({viewStudent.current_institute_dise_code || "N/A"})</div>
//                   <div><strong>Previous Institute:</strong> {viewStudent.previous_institute} ({viewStudent.previous_institute_dise_code || "N/A"})</div>
//                   <div><strong>Teacher Name:</strong> {viewStudent.teacher_name}</div>
//                   <div><strong>Teacher Mobile:</strong> {viewStudent.teacher_mobile_number || "-"}</div>
//                 </div>
//               </div>

//               <div className="profile-section-block">
//                 <h4 className="section-title"><MoreHorizontal size={18} /> Other Details</h4>
//                 <div className="profile-grid">
//                   <div><strong>SIM Name:</strong> <span style={{ fontWeight: 'bold' }}>{viewStudent.sim_name || "NOT ASSIGNED"}</span></div>
//                   <div><strong>Recharge Status:</strong> {viewStudent.recharge_status || "-"}</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* EDIT MODAL */}
//       {editStudent && (
//         <div className="modal">
//           <div className="modal-content large">
//             <button className="close-btn" onClick={() => { setEditStudent(null); setShowCommitConfirm(false); }}><X size={18} /></button>
//             <h3 className="modal-title">
//               {showCommitConfirm ? "Review & Confirm Changes" : "Edit Student Details"}
//             </h3>
            
//             {!showCommitConfirm ? (
//               <>
//                 <div className="edit-form grid-2-col" style={{ maxHeight: '450px', overflowY: 'auto' }}>
//                   {Object.keys(editForm).map((k) => {
//                     if (['applicant_id', 'photo_link', 'batch_id', 'cohort_number', 'inactive_reason', 'batch_name', 'cohort_name', 'created_at', 'updated_at', 'previous_institute_dise_code', 'current_institute', 'previous_institute'].includes(k)) return null;
                    
//                     const isLocked = ['student_id', 'enr_id', 'student_email', 'student_email_password', 'parent_email', 'student_name', 'sponsor', 'active_yn'].includes(k);

//                     if (k === 'current_institute_dise_code') {
//                       return (
//                         <div className="form-group" key={k} style={{ gridColumn: 'span 2', position: 'relative' }}>
//                           <label style={{ fontWeight: '700', color: '#1e40af' }}>Current Institute (DISE | Name)</label>
//                           <div style={{ position: 'relative' }}>
//                             <input 
//                               type="text" 
//                               className="form-input" 
//                               placeholder="Type 3+ chars to search..." 
//                               value={instSearch} 
//                               onChange={(e) => setInstSearch(e.target.value)} 
//                             />
//                             {isSearchingInst && <Loader2 className="animate-spin" size={16} style={{ position: 'absolute', right: '10px', top: '10px' }} />}
//                           </div>
//                           {instOptions.length > 0 && (
//                             <div className="inst-search-results">
//                               {instOptions.map(inst => (
//                                 <div key={inst.dise_code} className="inst-item" onClick={() => {
//                                     setEditForm(prev => ({ ...prev, current_institute_dise_code: inst.dise_code }));
//                                     setInstSearch(`${inst.dise_code} | ${inst.institute_name}`);
//                                     setInstOptions([]);
//                                   }}>
//                                   <strong>{inst.dise_code}</strong> | {inst.institute_name}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                           <small>Currently mapped DISE: <strong>{editForm.current_institute_dise_code}</strong></small>
//                         </div>
//                       );
//                     }

//                     return (
//                       <div className="form-group" key={k}>
//                         <label style={{ textTransform: 'capitalize', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
//                             {k === 'student_id' ? 'Applicant ID' : k.replace(/_/g, " ")} {isLocked && <Lock size={12} className="text-gray-400" />}
//                         </label>
//                         <input name={k} value={editForm[k] || ""} onChange={handleEditChange} readOnly={isLocked} className={`form-input ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} />
//                       </div>
//                     )
//                   })}
//                 </div>
//                 <div className="modal-actions">
//                   <button className="btn secondary" onClick={() => setEditStudent(null)}>Discard</button>
//                   <button className="btn primary" onClick={handleReviewChanges}>Review Changes</button>
//                 </div>
//               </>
//             ) : (
//               <div className="commit-preview-container">
//                 <div className="change-list shadow-inner" style={{ background: '#f8fafc', borderRadius: '8px', padding: '15px' }}>
//                     {changesSummary.map((c, i) => (
//                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.field}</span>
//                             <div style={{ textAlign: 'right' }}>
//                                 <span style={{ color: '#ef4444', textDecoration: 'line-through', fontSize: '11px' }}>{c.from}</span>
//                                 <ArrowRight size={14} className="mx-2 inline text-gray-400" />
//                                 <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '13px' }}>{c.to}</span>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="modal-actions" style={{ marginTop: '20px' }}>
//                   <button className="btn secondary" onClick={() => setShowCommitConfirm(false)}>Back</button>
//                   <button className="btn primary" onClick={saveEdit} style={{ background: '#059669', color: 'white' }}>
//                     <CheckCircle size={18} className="mr-2 inline" /> Confirm & Commit Changes
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* INACTIVE MODAL */}
//       {inactiveModal && (
//         <div className="modal">
//           <div className="modal-content small">
//             <h3 className="modal-title text-red-600"><AlertTriangle className="inline w-5 h-5 mr-1" /> Confirm Deactivation</h3>
//             <textarea rows={4} value={inactiveReason} onChange={(e) => setInactiveReason(e.target.value)} placeholder="Type reason here..." className="w-full border p-2 rounded" />
//             <div className="modal-actions">
//               <button className="btn secondary" onClick={() => {setInactiveModal(null); setInactiveReason("");}}>Cancel</button>
//               <button className="btn danger" onClick={confirmInactive}>Confirm Inactive</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* FULL PHOTO VIEW */}
//       {fullPhoto && (
//         <div className="modal" onClick={() => setFullPhoto(null)}>
//           <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center", padding: '10px' }} onClick={e => e.stopPropagation()}>
//             <img src={fullPhoto} alt="Full View" style={{ maxWidth: "100%", borderRadius: "8px" }} />
//           </div>
//         </div>
//       )}

//       <style>{`
//         /* FORCING FULL WIDTH LAYOUT */
//         .full-page-container {
//           width: 100%;
//           max-width: 100vw;
//           padding: 20px;
//           margin: 0;
//           box-sizing: border-box;
//           min-height: 100vh;
//           background-color: #f9fafb;
//         }

//         .table-wrapper {
//           width: 100%;
//           overflow-x: auto;
//           margin-top: 20px;
//         }

//         .students-table {
//           width: 100%;
//           border-collapse: collapse;
//           min-width: 1000px; /* Ensures table doesn't look squashed */
//         }

//         .filter-bar {
//           display: flex;
//           gap: 15px;
//           margin-bottom: 20px;
//           flex-wrap: wrap;
//         }

//         /* SEARCH RESULTS DROPDOWN */
//         .inst-search-results { 
//           position: absolute; 
//           top: 100%; 
//           left: 0; 
//           right: 0; 
//           z-index: 9999; 
//           background: white; 
//           max-height: 200px; 
//           overflow-y: auto; 
//           border: 1px solid #e2e8f0; 
//           border-radius: 6px; 
//           box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); 
//           margin-top: 5px; 
//         }
//         .inst-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
//         .inst-item:hover { background-color: #f8fafc; color: #2563eb; }
        
//         /* MISC STYLES */
//         .animate-spin { animation: spin 1s linear infinite; }
//         @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
//         .profile-sections-container { display: flex; flex-direction: column; gap: 15px; }
//         .profile-section-block { border: 1px solid #e5e7eb; padding: 15px; border-radius: 10px; background: #fff; }
//         .section-title { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #1e40af; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 12px; }
//         .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
//         .avatar-lg { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; }
//         .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
//         .form-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
//         .status-select { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #ddd; cursor: pointer; }
//         .status-select.active { color: #16a34a; }
//         .status-select.inactive { color: #dc2626; }
//       `}</style>
//     </div>
//   );
// }