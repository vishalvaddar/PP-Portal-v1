// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./BatchManagement.css";
// import {
//   Search,
//   Download,
//   Eye,
//   Edit,
//   X,
//   CheckCircle,
//   User2,
//   Phone,
//   Mail,
//   MapPin,
//   AlertTriangle,
//   Filter,
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";

// export default function StudentManagement() {
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
//   const [editStudent, setEditStudent] = useState(null);
//   const [editForm, setEditForm] = useState({});

//   const [inactiveModal, setInactiveModal] = useState(null);
//   const [inactiveReason, setInactiveReason] = useState("");

//   // Fields coordinator is allowed to edit
//   const editableFields = [
//     "student_name",
//     "father_name",
//     "father_occupation",
//     "mother_name",
//     "mother_occupation",
//     "student_email",
//     "student_email_password",
//     "home_address",
//     "current_institute",
//     "previous_institute",
//     "disecode",
//     "active_yn",
//     "inactive_reason",
//     "teacher_name",
//   ];

//   const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

//   // Fetch cohorts assigned to coordinator
//   useEffect(() => {
//     if (!token) return;
//     axios
//       .get(`${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/cohorts`, axiosConfig())
//       .then(({ data }) => setCohorts(data || []))
//       .catch((err) => {
//         console.error("Error fetching cohorts:", err);
//         setCohorts([]);
//       });
//   }, [token]);

//   // Fetch batches for selected cohort
//   useEffect(() => {
//     if (!token || !formData.cohort) {
//       setBatches([]);
//       return;
//     }
//     axios
//       .get(
//         `${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/batches?cohort_number=${formData.cohort}`,
//         axiosConfig()
//       )
//       .then(({ data }) => setBatches(data || []))
//       .catch((err) => {
//         console.error("Error fetching batches:", err);
//         setBatches([]);
//       });
//   }, [token, formData.cohort]);

//   // Fetch students for coordinator.
//   // If no cohort/batch provided, backend returns ALL students under the coordinator.
//   useEffect(() => {
//     if (!token) return;
//     setLoading(true);

//     const params = {};
//     if (formData.cohort) params.cohortNumber = formData.cohort;
//     if (formData.batch) params.batchId = formData.batch;

//     axios
//       .get(`${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/students`, {
//         ...axiosConfig(),
//         params,
//       })
//       .then(({ data }) => {
//         setStudents(data || []);
//       })
//       .catch((err) => {
//         console.error("Error fetching students:", err);
//         setStudents([]);
//       })
//       .finally(() => setLoading(false));
//   }, [token, formData]);

//   // local filtering (search & status)
//   useEffect(() => {
//     let filtered = [...students];
//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase();
//       filtered = filtered.filter(
//         (s) =>
//           (s.student_name || "").toLowerCase().includes(q) ||
//           (s.enr_id || "").toLowerCase().includes(q)
//       );
//     }
//     if (statusFilter !== "all") {
//       filtered = filtered.filter((s) => (s.active_yn || "").toLowerCase() === statusFilter);
//     }
//     setFilteredStudents(filtered);
//   }, [students, searchQuery, statusFilter]);

//   // Prepare edit form
//   const openEdit = (student) => {
//     setEditStudent(student);
//     const prefill = {};
//     editableFields.forEach((k) => {
//       prefill[k] = student[k] ?? "";
//     });
//     setEditForm(prefill);
//   };

//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditForm((p) => ({ ...p, [name]: value }));
//   };

//   const saveEdit = async () => {
//     if (!editStudent) return;
//     // Only send allowed fields
//     const payload = {};
//     editableFields.forEach((k) => {
//       if (k in editForm) payload[k] = editForm[k];
//     });

//     try {
//       await axios.put(
//         `${process.env.REACT_APP_BACKEND_API_URL}/api/students/${editStudent.student_id}`,
//         payload,
//         axiosConfig()
//       );
//       // Update UI
//       setStudents((prev) => prev.map((s) => (s.student_id === editStudent.student_id ? { ...s, ...payload } : s)));
//       setEditStudent(null);
//       alert("Student updated successfully.");
//     } catch (err) {
//       console.error("Error saving student:", err);
//       alert("Failed to save student.");
//     }
//   };

//   // Inactivate with reason
//   const openInactiveModal = (student) => {
//     setInactiveModal(student);
//     setInactiveReason(student.inactive_reason || "");
//   };

//   const confirmInactive = async () => {
//     if (!inactiveModal) return;
//     if (!inactiveReason.trim()) {
//       return alert("Please enter a reason for inactivation.");
//     }
//     try {
//       const payload = { active_yn: "inactive", inactive_reason: inactiveReason };
//       await axios.put(
//         `${process.env.REACT_APP_BACKEND_API_URL}/api/students/${inactiveModal.student_id}`,
//         payload,
//         axiosConfig()
//       );
//       setStudents((prev) =>
//         prev.map((s) => (s.student_id === inactiveModal.student_id ? { ...s, ...payload } : s))
//       );
//       setInactiveModal(null);
//       setInactiveReason("");
//       alert("Student marked as inactive.");
//     } catch (err) {
//       console.error("Error marking inactive:", err);
//       alert("Failed to set student inactive.");
//     }
//   };

//   // Export (simple CSV)
//   const handleExport = () => {
//     const rows = filteredStudents.map((s) => ({
//       student_id: s.student_id,
//       student_name: s.student_name,
//       enr_id: s.enr_id,
//       cohort: s.cohort_name,
//       batch: s.batch_name,
//       contact: s.contact_no1,
//       status: s.active_yn,
//       teacher: s.teacher_name,
//     }));
//     const csv = [
//       Object.keys(rows[0] || {}).join(","),
//       ...rows.map((r) => Object.values(r).map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")),
//     ].join("\n");
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "students_export.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="container">
//       {/* header */}
//       <div className="page-header">
//         <div>
//           <h1 className="title">Student Management</h1>
//           <p className="subtitle">Students assigned to your cohorts/batches</p>
//         </div>
//       </div>

//       {/* filters */}
//       <div className="filter-bar">
//         <div className="filter-item">
//           <Filter className="input-icon" />
//           <select
//             value={formData.cohort}
//             onChange={(e) => setFormData({ cohort: e.target.value, batch: "" })}
//           >
//             <option value="">All Cohorts</option>
//             {cohorts.map((c) => (
//               <option key={c.cohort_number ?? c.cohort_id} value={c.cohort_number ?? c.cohort_id}>
//                 {c.cohort_name || `Cohort ${c.cohort_number ?? c.cohort_id}`}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="filter-item">
//           <select
//             value={formData.batch}
//             onChange={(e) => setFormData((p) => ({ ...p, batch: e.target.value }))}
//             disabled={!formData.cohort}
//           >
//             <option value="">All Batches</option>
//             {batches.map((b) => (
//               <option key={b.batch_id} value={b.batch_id}>
//                 {b.batch_name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="filter-item search-box">
//           <Search className="input-icon" />
//           <input
//             placeholder="Search by name or enrollment ID"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>

//         <div className="filter-item">
//           <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//           </select>
//         </div>

//         <button className="export-button" onClick={handleExport}>
//           <Download className="icon" />
//           <span>Export</span>
//         </button>
//       </div>

//       {/* table */}
//       <div className="table-wrapper shadow-md rounded-lg bg-white">
//         <table className="students-table">
//           <thead>
//             <tr>
//               <th>Student</th>
//               <th>Cohort</th>
//               <th>Batch</th>
//               <th>Contact</th>
//               <th>Status</th>
//               <th style={{ width: 150 }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan="6" className="no-data">Loading...</td>
//               </tr>
//             ) : filteredStudents.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="no-data">No students found.</td>
//               </tr>
//             ) : (
//               filteredStudents.map((s) => (
//                 <tr key={s.student_id}>
//                   <td>
//                     <div className="student-info">
//                       <User2 className="icon text-blue-500 mr-2" />
//                       <div>
//                         <div className="name">{s.student_name}</div>
//                         <div className="id">{s.enr_id}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td><span className="badge">{s.cohort_name || "—"}</span></td>
//                   <td><span className="badge">{s.batch_name || "—"}</span></td>
//                   <td>
//                     <Phone className="inline w-3 h-3 mr-1 text-gray-500" />
//                     {s.contact_no1 || "—"}
//                     <div className="sub-info">Parent: {s.contact_no2 || "—"}</div>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${s.active_yn?.toLowerCase() === "active" ? "active" : "inactive"}`}>
//                       {s.active_yn || "—"}
//                     </span>
//                   </td>
//                   <td>
//                     <div className="actions">
//                       <button title="View" onClick={() => setViewStudent(s)}><Eye className="icon" /></button>
//                       <button title="Edit" onClick={() => openEdit(s)}><Edit className="icon" /></button>
//                       {s.active_yn?.toLowerCase() === "active" ? (
//                         <button title="Set Inactive" onClick={() => openInactiveModal(s)}>
//                           <AlertTriangle className="icon text-red-500" />
//                         </button>
//                       ) : null}
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* View modal - shows full student_master fields returned by backend */}
//       {viewStudent && (
//         <div className="modal">
//           <div className="modal-content large">
//             <button className="close-btn" onClick={() => setViewStudent(null)}><X size={18} /></button>
//             <h3 className="modal-title"><Eye className="inline w-5 h-5 mr-1 text-blue-500" /> Student Profile</h3>

//             <div className="profile-section">
//               <h4>Basic Details</h4>
//               <div className="profile-grid">
//                 <div><strong>Name:</strong> {viewStudent.student_name || "—"}</div>
//                 <div><strong>Enrollment ID:</strong> {viewStudent.enr_id || "—"}</div>
//                 <div><strong>Gender:</strong> {viewStudent.gender || "—"}</div>
//                 <div><strong>Status:</strong> <span className={`status-badge ${viewStudent.active_yn?.toLowerCase()==="active" ? "active":"inactive"}`}>{viewStudent.active_yn || "—"}</span></div>
//               </div>
//             </div>

//             <div className="profile-section">
//               <h4>Parent Details</h4>
//               <div className="profile-grid">
//                 <div><strong>Father:</strong> {viewStudent.father_name || "—"} ({viewStudent.father_occupation || "—"})</div>
//                 <div><strong>Mother:</strong> {viewStudent.mother_name || "—"} ({viewStudent.mother_occupation || "—"})</div>
//                 <div><strong>Parent Email:</strong> {viewStudent.parent_email || "—"}</div>
//                 <div><strong>Parent Contact:</strong> {viewStudent.contact_no2 || "—"}</div>
//               </div>
//             </div>

//             <div className="profile-section">
//               <h4>Contact & Institution</h4>
//               <div className="profile-grid">
//                 <div><Mail className="inline w-3 h-3 mr-1 text-gray-500" /> {viewStudent.student_email || "—"}</div>
//                 <div><MapPin className="inline w-3 h-3 mr-1 text-gray-500" /> {viewStudent.home_address || "—"}</div>
//                 <div><strong>Current Institute:</strong> {viewStudent.current_institute || "—"}</div>
//                 <div><strong>Previous Institute:</strong> {viewStudent.previous_institute || "—"}</div>
//                 <div><strong>DISE Code:</strong> {viewStudent.disecode || "—"}</div>
//               </div>
//             </div>

//             <div className="profile-section">
//               <h4>Academic & Others</h4>
//               <div className="profile-grid">
//                 <div><strong>Batch:</strong> {viewStudent.batch_name || "—"}</div>
//                 <div><strong>Cohort:</strong> {viewStudent.cohort_name || "—"}</div>
//                 <div><strong>Attendance %:</strong> {viewStudent.attendance ?? "—"}</div>
//                 <div><strong>Teacher:</strong> {viewStudent.teacher_name || "—"}</div>
//                 <div><strong>Inactive Reason:</strong> {viewStudent.inactive_reason || "—"}</div>
//               </div>
//             </div>

//             {/* show raw JSON (optional) */}
//             <div style={{ marginTop: 12 }}>
//               <details>
//                 <summary>Raw data</summary>
//                 <pre style={{ maxHeight: 300, overflow: "auto" }}>{JSON.stringify(viewStudent, null, 2)}</pre>
//               </details>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit modal */}
//       {editStudent && (
//         <div className="modal">
//           <div className="modal-content large">
//             <button className="close-btn" onClick={() => setEditStudent(null)}><X size={18} /></button>
//             <h3 className="modal-title"><Edit className="inline w-5 h-5 mr-1 text-amber-600" /> Edit Student</h3>

//             <div className="edit-form grid-2-col">
//               {editableFields.map((k) => (
//                 <div className="form-group" key={k}>
//                   <label>{k.replace(/_/g, " ")}</label>
//                   {k === "active_yn" ? (
//                     <select name={k} value={editForm[k] || ""} onChange={handleEditChange}>
//                       <option value="">--select--</option>
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   ) : k === "inactive_reason" ? (
//                     <input type="text" name={k} value={editForm[k] || ""} onChange={handleEditChange} placeholder="If inactive, enter reason" />
//                   ) : (
//                     <input type="text" name={k} value={editForm[k] || ""} onChange={handleEditChange} />
//                   )}
//                 </div>
//               ))}
//             </div>

//             <div className="modal-actions">
//               <button className="btn secondary" onClick={() => setEditStudent(null)}>Cancel</button>
//               <button className="btn primary" onClick={saveEdit}><CheckCircle className="inline mr-1" /> Save</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Inactive reason modal */}
//       {inactiveModal && (
//         <div className="modal">
//           <div className="modal-content small">
//             <button className="close-btn" onClick={() => setInactiveModal(null)}><X size={18} /></button>
//             <h3 className="modal-title text-red-600"><AlertTriangle className="inline w-5 h-5 mr-1" /> Mark Inactive</h3>
//             <p>Enter reason for marking <strong>{inactiveModal.student_name}</strong> inactive:</p>
//             <textarea rows={4} value={inactiveReason} onChange={(e) => setInactiveReason(e.target.value)} placeholder="Reason..." />
//             <div className="modal-actions">
//               <button className="btn secondary" onClick={() => setInactiveModal(null)}>Cancel</button>
//               <button className="btn danger" onClick={confirmInactive}><CheckCircle className="inline mr-1" /> Confirm</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// client/src/pages/Coordinator/StudentManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BatchManagement.css";
import {
  Search,
  Download,
  Eye,
  Edit,
  X,
  CheckCircle,
  User2,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Logo from "../../assets/RCF-PP.jpg";

export default function StudentManagement() {
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
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [inactiveModal, setInactiveModal] = useState(null);
  const [inactiveReason, setInactiveReason] = useState("");

  const [exportOpen, setExportOpen] = useState(false); // <-- dropdown toggle

  const editableFields = [
    "student_name",
    "father_name",
    "father_occupation",
    "mother_name",
    "mother_occupation",
    "student_email",
    "student_email_password",
    "home_address",
    "current_institute",
    "previous_institute",
    "disecode",
    "active_yn",
    "inactive_reason",
    "teacher_name",
  ];

  const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // Fetch cohorts
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/cohorts`, axiosConfig())
      .then(({ data }) => setCohorts(data || []))
      .catch(() => setCohorts([]));
  }, [token]);

  // Fetch batches
  useEffect(() => {
    if (!token || !formData.cohort) return setBatches([]);
    axios
      .get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/batches?cohort_number=${formData.cohort}`,
        axiosConfig()
      )
      .then(({ data }) => setBatches(data || []))
      .catch(() => setBatches([]));
  }, [token, formData.cohort]);

  // Fetch students
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const params = {};
    if (formData.cohort) params.cohortNumber = formData.cohort;
    if (formData.batch) params.batchId = formData.batch;

    axios
      .get(`${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/students`, {
        ...axiosConfig(),
        params,
      })
      .then(({ data }) => setStudents(data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [token, formData]);

  // Local filtering
  useEffect(() => {
    let f = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (s) =>
          s.student_name?.toLowerCase().includes(q) ||
          s.enr_id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      f = f.filter((s) => (s.active_yn ?? "").toLowerCase() === statusFilter);
    }
    setFilteredStudents(f);
  }, [students, searchQuery, statusFilter]);

  /**********************************************/
  /*               EXPORT: CSV                  */
  /**********************************************/
  const exportCSV = () => {
    if (!filteredStudents.length) {
      alert("No rows to export.");
      return;
    }

    const rows = filteredStudents.map((s) => ({
      student_id: s.student_id,
      student_name: s.student_name,
      enr_id: s.enr_id,
      cohort: s.cohort_name,
      batch: s.batch_name,
      contact: s.contact_no1,
      status: s.active_yn,
      //teacher: s.teacher_name,
    }));

    const csv = [
      Object.keys(rows[0] || {}).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Student_Report.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  /**********************************************/
/*               EXPORT: PDF                  */
/**********************************************/
/**********************************************/
/*               EXPORT: PDF                  */
/**********************************************/
const exportPDF = async () => {
  if (!filteredStudents.length) {
    alert("No rows to export.");
    return;
  }

  try {
    // PORTRAIT A4 (same style as timetable)
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    /* -------------------------
       LOAD LOGO
    -------------------------*/
    let logoDataUrl = null;
    try {
      const resp = await fetch(Logo); // imported logo
      const blob = await resp.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("⚠️ Logo load failed");
    }

    /* -------------------------
       HEADER (Cohort + Batch)
    -------------------------*/
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    const cohortName =
      cohorts.find((c) => String(c.cohort_number) === String(formData.cohort))
        ?.cohort_name || `Cohort ${formData.cohort || "-"}`;

    const batchName =
      batches.find((b) => String(b.batch_id) === String(formData.batch))
        ?.batch_name || `Batch ${formData.batch || "-"}`;

    const titleLines = [
      "PRATIBHA POSHAK",
      `${cohortName} - ${batchName} - STUDENT REPORT`,
    ];

    let baseY = 40;

    titleLines.forEach((line, i) => {
      const x = (pageWidth - doc.getTextWidth(line)) / 2;
      doc.text(line, x, baseY + i * 18);
    });

    // Add logo on the top-right
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", pageWidth - 100, 20, 60, 60);
    }

    /* -------------------------
       TABLE DATA
    -------------------------*/
    const tableData = filteredStudents.map((s) => ({
      student: s.student_name ?? "-",
      enrollment: s.enr_id ?? "-",
      cohort: s.cohort_name ?? "-",
      batch: s.batch_name ?? "-",
      contact: s.contact_no1 ?? "-",
      status: s.active_yn ?? "-",
    }));

    /* -------------------------
       AUTOTABLE EXPORT
    -------------------------*/
    autoTable(doc, {
      startY: 100,

      columns: [
        { header: "Student", dataKey: "student" },
        { header: "Enrollment", dataKey: "enrollment" },
        { header: "Cohort", dataKey: "cohort" },
        { header: "Batch", dataKey: "batch" },
        { header: "Contact", dataKey: "contact" },
        { header: "Status", dataKey: "status" },
      ],

      body: tableData,

      theme: "grid",
      tableWidth: "auto",
      margin: { left: 20, right: 20 },

      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 10,
        halign: "center",
      },

      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
      },

      columnStyles: {
        student: { cellWidth: 130 },
        enrollment: { cellWidth: 90 },
        cohort: { cellWidth: 80 },
        batch: { cellWidth: 80 },
        contact: { cellWidth: 100 },
        status: { cellWidth: 60 },
      },
    });

    /* -------------------------
       SAVE
    -------------------------*/
    doc.save("Student_Report.pdf");
  } catch (err) {
    console.error("PDF export failed", err);
    alert("Failed to generate PDF.");
  } finally {
    setExportOpen(false);
  }
};



  /**********************************************/
  /*             EXPORT: EXCEL (XLSX)           */
  /**********************************************/
  const exportExcel = () => {
    if (!filteredStudents.length) {
      alert("No rows to export.");
      return;
    }

    const exportData = filteredStudents.map((s) => ({
      "Student Name": s.student_name ?? "-",
      "Enrollment ID": s.enr_id ?? "-",
      Cohort: s.cohort_name ?? "-",
      Batch: s.batch_name ?? "-",
      "Contact No": s.contact_no1 ?? "-",
      Status: s.active_yn ?? "-",
      Teacher: s.teacher_name ?? "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // Auto column width (simple)
    const cols = Object.keys(exportData[0]).map((k) => ({ wch: Math.min(30, Math.max(8, k.length + 4)) }));
    worksheet["!cols"] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "Student_Report.xlsx");
    setExportOpen(false);
  };

  /**********************************************/
  /*               EDIT LOGIC                   */
  /**********************************************/
  const openEdit = (student) => {
    setEditStudent(student);
    const prefill = {};
    editableFields.forEach((k) => (prefill[k] = student[k] ?? ""));
    setEditForm(prefill);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editStudent) return;
    const payload = {};
    editableFields.forEach((k) => (payload[k] = editForm[k]));

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/students/${editStudent.student_id}`,
        payload,
        axiosConfig()
      );

      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === editStudent.student_id ? { ...s, ...payload } : s
        )
      );

      setEditStudent(null);
      alert("Student updated.");
    } catch (err) {
      console.error(err);
      alert("Failed to update student.");
    }
  };

  /**********************************************/
  /*             INACTIVE LOGIC                 */
  /**********************************************/
  const openInactiveModal = (student) => {
    setInactiveModal(student);
    setInactiveReason(student.inactive_reason || "");
  };

  const confirmInactive = async () => {
    if (!inactiveReason.trim()) return alert("Please enter reason.");

    const payload = { active_yn: "inactive", inactive_reason: inactiveReason };

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/students/${inactiveModal.student_id}`,
        payload,
        axiosConfig()
      );

      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === inactiveModal.student_id ? { ...s, ...payload } : s
        )
      );

      setInactiveModal(null);
      setInactiveReason("");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    }
  };

  /**********************************************/
  /*                   UI                       */
  /**********************************************/
  return (
    <div className="container">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="title">Student Management</h1>
          <p className="subtitle">Students assigned to your cohorts/batches</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="filter-item">
          <Filter className="input-icon" />
          <select
            value={formData.cohort}
            onChange={(e) => setFormData({ cohort: e.target.value, batch: "" })}
          >
            <option value="">All Cohorts</option>
            {cohorts.map((c) => (
              <option
                key={c.cohort_number ?? c.cohort_id}
                value={c.cohort_number ?? c.cohort_id}
              >
                {c.cohort_name || `Cohort ${c.cohort_number}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <select
            value={formData.batch}
            disabled={!formData.cohort}
            onChange={(e) =>
              setFormData((p) => ({ ...p, batch: e.target.value }))
            }
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item search-box">
          <Search className="input-icon" />
          <input
            placeholder="Search by name or enrollment ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* EXPORT DROPDOWN */}
        <div className="export-menu-wrapper">
          <button
            className="export-button"
            onClick={() => setExportOpen((p) => !p)}
          >
            <Download className="icon" />
            <span>Export</span>
            <ChevronDown size={16} />
          </button>

          {exportOpen && (
            <div className="export-dropdown">
              <button onClick={exportCSV}>Export as CSV</button>
              <button onClick={exportPDF}>Export as PDF</button>
              <button onClick={exportExcel}>Export as Excel</button>
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper shadow-md rounded-lg bg-white">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Cohort</th>
              <th>Batch</th>
              <th>Contact</th>
              <th>Status</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Loading...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.student_id}>
                  <td>
                    <div className="student-info">
                      <User2 className="icon text-blue-500 mr-2" />
                      <div>
                        <div className="name">{s.student_name}</div>
                        <div className="id">{s.enr_id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge">{s.cohort_name || "—"}</span>
                  </td>

                  <td>
                    <span className="badge">{s.batch_name || "—"}</span>
                  </td>

                  <td>
                    <Phone className="inline w-3 h-3 mr-1 text-gray-500" />
                    {s.contact_no1}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        (s.active_yn ?? "").toLowerCase() === "active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {s.active_yn}
                    </span>
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        title="View"
                        onClick={() => setViewStudent(s)}
                      >
                        <Eye className="icon" />
                      </button>

                      <button title="Edit" onClick={() => openEdit(s)}>
                        <Edit className="icon" />
                      </button>

                      {(s.active_yn ?? "").toLowerCase() === "active" && (
                        <button
                          title="Set Inactive"
                          onClick={() => openInactiveModal(s)}
                        >
                          <AlertTriangle className="icon text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALS BELOW — unchanged */}

      {viewStudent && (
        <div className="modal">
          <div className="modal-content large">
            <button className="close-btn" onClick={() => setViewStudent(null)}>
              <X size={18} />
            </button>
            <h3 className="modal-title">
              <Eye className="inline w-5 h-5 mr-1 text-blue-500" /> Student
              Profile
            </h3>

            <div className="profile-section">
              <h4>Basic Details</h4>
              <div className="profile-grid">
                <div>
                  <strong>Name:</strong> {viewStudent.student_name}
                </div>
                <div>
                  <strong>Enrollment ID:</strong> {viewStudent.enr_id}
                </div>
                <div>
                  <strong>Gender:</strong> {viewStudent.gender}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${
                      (viewStudent.active_yn ?? "").toLowerCase() === "active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {viewStudent.active_yn}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4>Parent Details</h4>
              <div className="profile-grid">
                <div>
                  <strong>Father:</strong> {viewStudent.father_name} (
                  {viewStudent.father_occupation})
                </div>
                <div>
                  <strong>Mother:</strong> {viewStudent.mother_name} (
                  {viewStudent.mother_occupation})
                </div>
                <div>
                  <strong>Parent Email:</strong> {viewStudent.parent_email}
                </div>
                <div>
                  <strong>Parent Contact:</strong> {viewStudent.contact_no2}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4>Contact & Institution</h4>
              <div className="profile-grid">
                <div>
                  <Mail className="inline w-3 h-3 mr-1 text-gray-500" />{" "}
                  {viewStudent.student_email}
                </div>
                <div>
                  <MapPin className="inline w-3 h-3 mr-1 text-gray-500" />{" "}
                  {viewStudent.home_address}
                </div>
                <div>
                  <strong>Current Institute:</strong>{" "}
                  {viewStudent.current_institute}
                </div>
                <div>
                  <strong>Previous Institute:</strong>{" "}
                  {viewStudent.previous_institute}
                </div>
                <div>
                  <strong>DISE Code:</strong> {viewStudent.disecode}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4>Academic & Others</h4>
              <div className="profile-grid">
                <div>
                  <strong>Batch:</strong> {viewStudent.batch_name}
                </div>
                <div>
                  <strong>Cohort:</strong> {viewStudent.cohort_name}
                </div>
                <div>
                  <strong>Teacher:</strong> {viewStudent.teacher_name}
                </div>
                <div>
                  <strong>Inactive Reason:</strong>{" "}
                  {viewStudent.inactive_reason}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editStudent && (
        <div className="modal">
          <div className="modal-content large">
            <button className="close-btn" onClick={() => setEditStudent(null)}>
              <X size={18} />
            </button>

            <h3 className="modal-title">
              <Edit className="inline w-5 h-5 mr-1 text-amber-600" /> Edit
              Student
            </h3>

            <div className="edit-form grid-2-col">
              {editableFields.map((k) => (
                <div className="form-group" key={k}>
                  <label>{k.replace(/_/g, " ")}</label>

                  {k === "active_yn" ? (
                    <select
                      name={k}
                      value={editForm[k]}
                      onChange={handleEditChange}
                    >
                      <option value="">--select--</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : k === "inactive_reason" ? (
                    <input
                      type="text"
                      name={k}
                      value={editForm[k]}
                      onChange={handleEditChange}
                      placeholder="If inactive, enter reason"
                    />
                  ) : (
                    <input
                      type="text"
                      name={k}
                      value={editForm[k]}
                      onChange={handleEditChange}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setEditStudent(null)}
              >
                Cancel
              </button>
              <button className="btn primary" onClick={saveEdit}>
                <CheckCircle className="inline mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {inactiveModal && (
        <div className="modal">
          <div className="modal-content small">
            <button
              className="close-btn"
              onClick={() => setInactiveModal(null)}
            >
              <X size={18} />
            </button>

            <h3 className="modal-title text-red-600">
              <AlertTriangle className="inline w-5 h-5 mr-1" /> Mark Inactive
            </h3>

            <p>
              Enter reason for marking{" "}
              <strong>{inactiveModal.student_name}</strong> inactive:
            </p>

            <textarea
              rows={4}
              value={inactiveReason}
              onChange={(e) => setInactiveReason(e.target.value)}
              placeholder="Reason..."
            />

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setInactiveModal(null)}
              >
                Cancel
              </button>

              <button className="btn danger" onClick={confirmInactive}>
                <CheckCircle className="inline mr-1" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE DROPDOWN CSS */}
      <style>{`
        .export-menu-wrapper {
          position: relative;
        }
        .export-dropdown {
          position: absolute;
          top: 110%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border-radius: 6px;
          padding: 6px 0;
          z-index: 999;
          min-width: 180px;
        }
        .export-dropdown button {
          width: 100%;
          text-align: left;
          padding: 8px 14px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .export-dropdown button:hover {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  );
}
