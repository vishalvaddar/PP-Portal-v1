import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { 
  Search, Download, Plus, ChevronDown, Edit, 
  CheckCircle, ExternalLink, FileText, X, Users, Layout, Filter, BookOpen, Presentation
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Logo from "../../assets/RCF-PP.jpg";
import styles from "./ClassroomManager.module.css"; 

const BACKEND = process.env.REACT_APP_BACKEND_API_URL;
const API_BASE = `${BACKEND}/api/coordinator`;

const INITIAL_FORM_STATE = {
  subject_id: "",
  teacher_id: "",
  platform_id: "",
  class_link: "",
  description: "",
  active_yn: "Y",
  created_by: 1,
  updated_by: 1
};

export default function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [autoName, setAutoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // --------------------------
  // API Fetching
  // --------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSubs, resTechs, resPlats, resCohorts, resBatches, resRooms] = await Promise.all([
        axios.get(`${API_BASE}/subjects`),
        axios.get(`${API_BASE}/teachers`),
        axios.get(`${API_BASE}/platforms`),
        axios.get(`${BACKEND}/api/batches/cohorts`),
        axios.get(`${BACKEND}/api/batches`),
        axios.get(`${API_BASE}/classrooms`)
      ]);
      setSubjects(resSubs.data || []);
      setTeachers(resTechs.data || []);
      setPlatforms(resPlats.data || []);
      setCohorts(resCohorts.data || []);
      setBatches(resBatches.data || []);
      setClassrooms(resRooms.data || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --------------------------
  // Auto-generation Logic: ARS09-MAHAJAN-B8
  // --------------------------
  useEffect(() => {
    const subject = subjects.find(s => String(s.subject_id) === String(formData.subject_id));
    const teacher = teachers.find(t => String(t.teacher_id) === String(formData.teacher_id));
    const batch = batches.find(b => String(b.id) === String(selectedBatch));

    console.log("Selected batch", selectedBatch);

    console.log("Auto-name dependencies changed:", { subject, teacher, batch });

    if (subject && teacher && batch) {
      const tName = teacher.teacher_name.split(" ")[0].toUpperCase();
      const name = `${subject.short_code}-${tName}-${batch.batch_name}`;
      setAutoName(name);
    } else {
      setAutoName("");
    }
  }, [formData.subject_id, formData.teacher_id, selectedBatch, subjects, teachers, batches]);

  // --------------------------
  // Handlers
  // --------------------------
  const handleEditClick = (c) => {
    setIsEditing(true);
    setEditingId(c.classroom_id);
    setFormData({
      subject_id: c.subject_id,
      teacher_id: c.teacher_id,
      platform_id: c.platform_id,
      class_link: c.class_link || "",
      description: c.description || "",
      active_yn: c.active_yn || "Y",
      created_by: c.created_by,
      updated_by: 1
    });
    setSelectedBatch(c.batch_id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, classroom_name: autoName, batch_id: selectedBatch };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE}/classrooms/${editingId}`, payload);
        alert("Classroom updated successfully");
      } else {
        await axios.post(`${API_BASE}/classrooms`, payload);
        alert("Classroom created successfully");
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      alert("Error saving classroom details");
    }
  };

  const fetchStudents = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/classrooms/${id}/students`);
      setStudents(res.data || []);
      // Scroll to student section
      setTimeout(() => document.getElementById('student-view')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setSelectedBatch("");
    setSelectedCohort("");
    setIsEditing(false);
    setEditingId(null);
  };

  // --------------------------
  // Export Logic (PDF/Excel)
  // --------------------------
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Classroom List", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Classroom Name", "Subject", "Teacher", "Platform"]],
      body: classrooms.map(c => [c.classroom_name, c.subject_name, c.teacher_name, c.platform_name]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save("Classrooms.pdf");
    setExportOpen(false);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(classrooms);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Classrooms");
    XLSX.writeFile(wb, "Classrooms.xlsx");
    setExportOpen(false);
  };

  const filteredRooms = classrooms.filter(c => 
    c.classroom_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="full-page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
          <div>
            <h1 className="title">Classroom Management</h1>
            <p className="subtitle">Managing {classrooms.length} active learning environments</p>
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
        <div className="filter-item search-box" style={{ flex: 1 }}>
          <Search className="input-icon" size={18} />
          <input placeholder="Search Classroom or Teacher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Create Classroom
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="table-wrapper shadow-md rounded-lg bg-white">
        <table className="students-table">
          <thead>
            <tr>
              <th>Classroom Name</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Platform</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length > 0 ? filteredRooms.map(c => (
              <tr key={c.classroom_id}>
                <td style={{ fontWeight: '700', color: '#1e40af' }}>{c.classroom_name}</td>
                <td style={{ fontWeight: '600', color: '#4b5563' }}>{c.subject_name}</td>
                <td>{c.teacher_name}</td>
                <td><span className="badge-room">{c.platform_name}</span></td>
                <td>
                  <span className={`status-pill ${c.active_yn === 'Y' ? 'active' : 'inactive'}`}>
                    {c.active_yn === 'Y' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => fetchStudents(c.classroom_id)} className="action-btn-text">
                      <Users size={16} className="inline mr-1" /> Students
                    </button>
                    <button onClick={() => handleEditClick(c)} className="action-btn edit"><Edit size={16}/></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>No classrooms found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* STUDENT PREVIEW SECTION */}
      {students.length > 0 && (
        <div id="student-view" className="table-wrapper mt-6 shadow-md rounded-lg bg-white p-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 className="modal-title"><Users size={20} className="inline mr-2"/> Assigned Students</h3>
            <button onClick={() => setStudents([])} className="close-btn"><X /></button>
          </div>
          <div className="grid-3-col">
            {students.map(s => (
              <div key={s.student_id} className="student-mini-card">
                <span className="student-name">{s.student_name}</span>
                <span className="student-id">{s.enr_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE/UPDATE MODAL */}
      {showForm && (
        <div className="modal">
          <div className="modal-content medium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="modal-title">{isEditing ? "Update Classroom" : "Create New Classroom"}</h3>
              <button onClick={() => setShowForm(false)} className="close-btn"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="edit-form grid-2-col">
              <div className="form-group">
                <label><BookOpen size={14}/> Subject</label>
                <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="form-input" required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label><Presentation size={14}/> Teacher</label>
                <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="form-input" required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label><Filter size={14}/> Cohort</label>
                <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)} className="form-input">
                  <option value="">Select Cohort</option>
                  {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label><Layout size={14}/> Batch</label>
                <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="form-input" required>
                  <option value="">Select Batch</option>
                  {batches.filter(b => b.cohort_number == selectedCohort).map(b => (
                    <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Platform</label>
                <select value={formData.platform_id} onChange={e => setFormData({...formData, platform_id: e.target.value})} className="form-input" required>
                  <option value="">Select Platform</option>
                  {platforms.map(p => <option key={p.platform_id} value={p.platform_id}>{p.platform_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Class Link</label>
                <input type="url" placeholder="https://..." value={formData.class_link} onChange={e => setFormData({...formData, class_link: e.target.value})} className="form-input" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div className="name-generation-preview">
                  <span>Target Classroom Name:</span>
                  <strong>{autoName || "Please select Subject, Teacher & Batch"}</strong>
                </div>
              </div>

              <div className="modal-actions" style={{ gridColumn: 'span 2', marginTop: '15px' }}>
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Discard</button>
                <button type="submit" className="btn primary" disabled={!autoName}>
                  <CheckCircle size={18} className="mr-2 inline" /> {isEditing ? "Update Classroom" : "Create Classroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .full-page-container { width: 100%; padding: 25px; background-color: #f9fafb; min-height: 100vh; }
        .badge-room { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid #dbeafe; }
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .status-pill.active { background: #dcfce7; color: #166534; }
        .status-pill.inactive { background: #fee2e2; color: #991b1b; }
        .action-btn-text { background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 13px; }
        .name-generation-preview { background: #f0fdf4; border: 1px dashed #22c55e; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .name-generation-preview strong { color: #166534; font-size: 16px; }
        .grid-3-col { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .student-mini-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; display: flex; flex-direction: column; }
        .student-name { font-weight: 600; color: #1e293b; font-size: 13px; }
        .student-id { font-size: 11px; color: #64748b; }
      `}</style>
    </div>
  );
}