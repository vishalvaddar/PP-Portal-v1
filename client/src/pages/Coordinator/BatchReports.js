
// // // Part 1 of 3 — src/components/BatchReports.js
// // import React, { useEffect, useMemo, useState } from "react";
// // import axios from "axios";
// // import {
// //   ClipboardList,
// //   Filter,
// //   Calendar,
// //   Users,
// //   Layers,
// //   BarChart3,
// //   User,
// //   Loader2,
// //   Search,
// //   X,
// //   ShieldCheck,
// //   AlertTriangle,
// //   Download,
// //   FilePlus,
// //   FileText,
// //   Printer
// // } from "lucide-react";
// // import { useAuth } from "../../contexts/AuthContext";


// // const BACKEND_BASE = "http://localhost:5000";
// // const COORDINATOR_BASE = `${BACKEND_BASE}/api/coordinator`;
// // const API_BASE = `${BACKEND_BASE}/api/coordinator/reports`;
// // const LOW_ATTENDANCE_THRESHOLD = 75.0;

// // // -----------------------------
// // // Safe display helper
// // // -----------------------------
// // // Ensures we never attempt to render an object directly.
// // // If passed an object like { "APPLIED MATHEMATICS-09": 10 }
// // // it will render the keys: "APPLIED MATHEMATICS-09"
// // const safeDisplay = (val) => {
// //   if (val === null || val === undefined) return "-";
// //   if (typeof val === "object") {
// //     // If it's an array, join items
// //     if (Array.isArray(val)) return val.map(v => safeDisplay(v)).join(", ");
// //     // If it's a plain object, prefer readable keys or stringified small values
// //     const keys = Object.keys(val);
// //     if (keys.length === 0) return "-";
// //     // If object maps name->count, return names joined
// //     return keys.join(", ");
// //   }
// //   return String(val);
// // };

// // // -----------------------------
// // // Small UI helpers
// // // -----------------------------
// // const DateInput = ({ name, label, value, onChange }) => (
// //   <div className="flex flex-col">
// //     <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
// //       <Calendar className="w-3 h-3 mr-1 text-gray-500" /> {label}
// //     </label>
// //     <input
// //       type="date"
// //       name={name}
// //       value={value}
// //       onChange={onChange}
// //       className="p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:border-emerald-500 focus:ring-emerald-500 transition duration-150"
// //     />
// //   </div>
// // );

// // // -----------------------------
// // // Main component (export default)
// // // -----------------------------
// // export default function BatchReports() {
// //   const auth = useAuth(); // expects auth.user and auth.user.token
// //   const token = auth?.user?.token;
// //   const userId = auth?.user?.id || auth?.user?.user_id || null;

// //   // default date range: last 7 days
// //   const todayISO = new Date().toISOString().split("T")[0];
// //   const sevenDaysAgoISO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

// //   const [formData, setFormData] = useState({
// //     reportType: "student_attendance", // student_attendance | absentees_report | teacher_class_counts | teacher_performance
// //     cohort: "",
// //     batch: "",
// //     classroom: "",
// //     teacherName: "",
// //     fromDate: sevenDaysAgoISO,
// //     toDate: todayISO,
// //     date: todayISO, // used when fetching attendance by date
// //   });

// //   // Metadata & data
// //   const [cohorts, setCohorts] = useState([]); // [{cohort_number, cohort_name}]
// //   const [batches, setBatches] = useState([]); // [{batch_id, batch_name,...}]
// //   const [filteredBatches, setFilteredBatches] = useState([]);
// //   const [students, setStudents] = useState([]);
// //   const [attendance, setAttendance] = useState({}); // keyed by student id or classroom etc.
// //   const [teacherOptions, setTeacherOptions] = useState([]);

// //   // UI state
// //   const [metaLoading, setMetaLoading] = useState(false);
// //   const [loading, setLoading] = useState(false); // generic loading
// //   const [reportLoading, setReportLoading] = useState(false); // when generating reports
// //   const [apiError, setApiError] = useState(null);
// //   const [reportData, setReportData] = useState(null);

// //   // ticket/action state
// //   const [actionStatuses, setActionStatuses] = useState({}); // { studentId: { status, reason } }

// //   // modal state
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [selectedStudent, setSelectedStudent] = useState(null);
// //   const [closeReason, setCloseReason] = useState("");

// //   // -----------------------------
// //   // Helpers to build headers
// //   // -----------------------------
// //   const authHeaders = useMemo(() => {
// //     return token ? { Authorization: `Bearer ${token}` } : {};
// //   }, [token]);

// //   // -----------------------------
// //   // Fetch cohorts (protected)
// //   // GET /api/coordinator/cohorts
// //   // server identifies user from token or query param - we include both
// //   // -----------------------------
// //   useEffect(() => {
// //     let cancelled = false;
// //     const loadCohorts = async () => {
// //       if (!token) return; // no auth
// //       setMetaLoading(true);
// //       setApiError(null);
// //       try {
// //         const res = await axios.get(`${COORDINATOR_BASE}/cohorts`, {
// //           headers: authHeaders,
// //           params: userId ? { userId } : {}
// //         });
// //         if (cancelled) return;
// //         const rows = (res.data || []).map(r => ({
// //           cohort_number: r.cohort_number ?? r.cohortNumber ?? r.cohort,
// //           cohort_name: r.cohort_name ?? r.cohortName ?? r.cohort_name
// //         }));
// //         setCohorts(rows);
// //         // set default cohort if not picked
// //         if (rows.length > 0 && !formData.cohort) {
// //           setFormData(fd => ({ ...fd, cohort: rows[0].cohort_number }));
// //         }
// //       } catch (err) {
// //         console.error("Error fetching cohorts:", err);
// //         setApiError("Failed to load cohorts. Check backend or auth token.");
// //       } finally {
// //         if (!cancelled) setMetaLoading(false);
// //       }
// //     };
// //     loadCohorts();
// //     return () => { cancelled = true; };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [token, userId]);

// //   // -----------------------------
// //   // Fetch batches for cohort
// //   // GET http://localhost:5000/api/coordinator/batches?cohort_number=<value>
// //   // -----------------------------
// //   useEffect(() => {
// //     let cancelled = false;
// //     const loadBatches = async () => {
// //       if (!token) return;
// //       if (!formData.cohort) {
// //         setBatches([]);
// //         setFilteredBatches([]);
// //         return;
// //       }
// //       setMetaLoading(true);
// //       setApiError(null);
// //       try {
// //         const url = `${COORDINATOR_BASE}/batches?cohort_number=${encodeURIComponent(formData.cohort)}`;
// //         const res = await axios.get(url, { headers: authHeaders });
// //         if (cancelled) return;
// //         const rows = (res.data || []).map(r => ({
// //           batch_id: r.batch_id ?? r.batchId ?? r.batch_id,
// //           batch_name: r.batch_name ?? r.batchName ?? r.batch_name,
// //           cohort_number: r.cohort_number ?? r.cohortNumber ?? r.cohort_number,
// //           cohort_name: r.cohort_name ?? r.cohortName ?? r.cohort_name
// //         }));
// //         setBatches(rows);
// //         setFilteredBatches(rows);
// //         // reset selected batch/classroom and data
// //         setFormData(prev => ({ ...prev, batch: "", classroom: "" }));
// //         setStudents([]);
// //         setAttendance({});
// //       } catch (err) {
// //         console.error("Error fetching batches:", err);
// //         setApiError("Failed to load batches. Check backend.");
// //       } finally {
// //         if (!cancelled) setMetaLoading(false);
// //       }
// //     };
// //     loadBatches();
// //     return () => { cancelled = true; };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [formData.cohort, token]);

// //   // -----------------------------
// //   // Fetch students for cohort+batch
// //   // GET http://localhost:5000/api/coordinator/students?cohortNumber=...&batchId=...
// //   // -----------------------------
// //   useEffect(() => {
// //     let cancelled = false;
// //     const loadStudents = async () => {
// //       if (!token) return;
// //       if (!formData.cohort || !formData.batch) {
// //         setStudents([]);
// //         return;
// //       }
// //       setLoading(true);
// //       setApiError(null);
// //       try {
// //         const res = await axios.get(`${COORDINATOR_BASE}/students`, {
// //           headers: authHeaders,
// //           params: {
// //             cohortNumber: formData.cohort,
// //             batchId: formData.batch,
// //           }
// //         });
// //         if (cancelled) return;
// //         const rows = res.data || [];
// //         setStudents(rows);
// //       } catch (err) {
// //         console.error("Error fetching students:", err);
// //         setApiError("Failed to load students.");
// //       } finally {
// //         if (!cancelled) setLoading(false);
// //       }
// //     };
// //     loadStudents();
// //     return () => { cancelled = true; };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [formData.batch, formData.cohort, token]);

// //   // -----------------------------
// //   // Fetch attendance report
// //   // -----------------------------
// //   const fetchAttendanceReport = async () => {
// //     if (!token) {
// //       setApiError("Not authenticated");
// //       return;
// //     }
// //     if (!formData.batch) {
// //       setApiError("Choose a batch");
// //       return;
// //     }
// //     setReportLoading(true);
// //     setApiError(null);
// //     try {
// //       const res = await axios.get(`${API_BASE}/attendance`, 
// //       {
// //         headers: authHeaders,
// //         params: {
// //           batchId: formData.batch,
// //           fromDate: formData.fromDate,
// //           toDate: formData.toDate
// //         }
// //       });
// //       setReportData(res.data || {});
// //       // initialize action statuses for students if present
// //       const stMap = {};
// //       (res.data?.students || []).forEach(s => {
// //         stMap[s.id] = { status: s.actionStatus || "N/A", reason: s.actionReason || null };
// //       });
// //       setActionStatuses(stMap);
// //     } catch (err) {
// //       console.error("Error fetching attendance report:", err);
// //       setApiError(err?.response?.data?.error || "Failed to fetch attendance report.");
// //     } finally {
// //       setReportLoading(false);
// //     }
// //   };

// //   // -----------------------------
// //   // Fetch teacher load
// //   // -----------------------------
// //   const fetchTeacherLoad = async () => {
// //     if (!token) return;
// //     setReportLoading(true);
// //     setApiError(null);
// //     try {
// //       const res = await axios.get(`${API_BASE}/teacher-load`, {
// //         headers: authHeaders,
// //         params: {
// //           fromDate: formData.fromDate,
// //           toDate: formData.toDate
// //         }
// //       });
// //       setReportData(res.data || {});
// //     } catch (err) {
// //       console.error("Error fetching teacher load:", err);
// //       setApiError("Failed to fetch teacher load.");
// //     } finally {
// //       setReportLoading(false);
// //     }
// //   };

  
// // // -----------------------------
// // // Load Teachers for Coordinator
// // // -----------------------------
// // useEffect(() => {
// //   let cancelled = false;

// //   const loadTeachers = async () => {
// //     if (!auth?.user?.token) return;

// //     try {
// //       const res = await axios.get(`${API_BASE}/coordinator-teachers`, {
// //         headers: { Authorization: `Bearer ${auth.user.token}` },
// //         params: {
// //           user_id: auth.user.user_id, // ✅ Coordinator ID
// //           fromDate: "1970-01-01",
// //           toDate: "2100-01-01",
// //         },
// //       });

// //       if (cancelled) return;

// //       // ✅ Since backend now returns array of teachers directly:
// //       const teachersData = res.data || [];

// //       // Extract unique teacher names (safely)
// //       const teachers = Array.from(
// //         new Set(
// //           teachersData
// //             .map((t) => t.teacher_name || t.name || t.teacher)
// //             .filter(Boolean)
// //         )
// //       ).sort();

// //       setTeacherOptions(teachers);
// //     } catch (err) {
// //       console.warn("Could not load teacher options:", err?.response?.data || err.message || err);
// //     }
// //   };

// //   loadTeachers();
// //   return () => {
// //     cancelled = true;
// //   };
// // }, [auth?.user?.token]);

// //   // -----------------------------
// //   // Generate report
// //   // -----------------------------
// //   const generateReport = async () => {
// //     setApiError(null);
// //     setReportData(null);
// //     if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report") {
// //       await fetchAttendanceReport();
// //     } else if (formData.reportType === "teacher_class_counts") {
// //       await fetchTeacherLoad();
// //     } 
// //   };

// //   // -----------------------------
// //   // Export helpers
// //   // -----------------------------
// //   const exportReport = (format = "json") => {
// //     if (!reportData) {
// //       alert("Generate a report first.");
// //       return;
// //     }
// //     if (format === "json") {
// //       const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
// //       const url = URL.createObjectURL(blob);
// //       const a = document.createElement("a");
// //       a.href = url;
// //       a.download = `report-${formData.reportType}-${Date.now()}.json`;
// //       a.click();
// //       URL.revokeObjectURL(url);
// //       return;
// //     }
// //     alert(`Export (${format}) is simulated. Implement server-side export for real files.`);
// //   };

// //   // -----------------------------
// //   // Ticket modal actions
// //   // -----------------------------
// //   const openCloseTicketModal = (student) => {
// //     setSelectedStudent(student);
// //     setCloseReason("");
// //     setIsModalOpen(true);
// //   };

// //   const confirmCloseTicket = () => {
// //     if (!closeReason.trim()) return;
// //     const sid = selectedStudent.id;
// //     setActionStatuses(prev => ({ ...prev, [sid]: { status: "Closed - Action Taken", reason: closeReason.trim() } }));
// //     setIsModalOpen(false);
// //   };

// //   // -----------------------------
// //   // Helpers for UI derived data & filters
// //   // -----------------------------
// //   const isReadyForExport = useMemo(() => {
// //     if (!reportData) return false;
// //     if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report")
// //       return (reportData.students || []).length > 0;
// //     if (formData.reportType === "teacher_class_counts")
// //       return (reportData.assignments || []).length > 0;
// //     if (formData.reportType === "teacher_performance")
// //       return !!reportData.teacher;
// //     return false;
// //   }, [reportData, formData.reportType]);

// //   // -----------------------------
// //   // UI render
// //   // -----------------------------
// //   return (
// //     <div className="min-h-screen p-4 bg-gray-50 font-sans">
// //       <div className="max-w-7xl mx-auto">
// //         <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
// //           <div className="p-6 bg-emerald-600 text-white flex items-start gap-4">
// //             <ClipboardList className="w-8 h-8 text-emerald-200" />
// //             <div>
// //               <h1 className="text-2xl font-extrabold">Performance & Absentees Report System</h1>
// //               <p className="text-sm opacity-90 mt-1">Cohort → Batch based attendance & teacher reports (coordinator view).</p>
// //             </div>
// //           </div>

// //           {/* Filters */}
// //           <div className="p-6 border-b border-gray-100 bg-gray-50">
// //             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
// //               <Filter className="w-5 h-5 text-emerald-600" /> Report Configuration
// //             </h3>

// //           <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
// //             <div className="md:col-span-2">
// //               <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><BarChart3 className="w-3 h-3 mr-1" /> Report Type</label>
// //               <select name="reportType" value={formData.reportType} onChange={(e)=>setFormData({...formData, reportType: e.target.value})} className="p-2 border rounded-lg w-full">
// //                 <option value="student_attendance">STUDENT ATTENDANCE</option>
// //                 <option value="teacher_class_counts">TEACHER CLASS COUNTS</option>
// //               </select>
// //             </div>

// //             {/* Cohort */}
// //             {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
// //               <div>
// //                 <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><Layers className="w-3 h-3 mr-1" /> Cohort</label>
// //                 <select name="cohort" value={formData.cohort} onChange={(e)=>setFormData(prev => ({ ...prev, cohort: e.target.value }))} className="p-2 border rounded-lg w-full">
// //                   <option value="">-- Select Cohort --</option>
// //                   {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{safeDisplay(c.cohort_name || c.cohort_number)}</option>)}
// //                 </select>
// //               </div>
// //             )}

// //             {/* Batch */}
// //             {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
// //               <div>
// //                 <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><Users className="w-3 h-3 mr-1" /> Batch</label>
// //                 <select name="batch" value={formData.batch} onChange={(e)=>setFormData(prev => ({ ...prev, batch: e.target.value }))} className="p-2 border rounded-lg w-full">
// //                   <option value="">-- Select Batch --</option>
// //                   {filteredBatches.map(b => <option key={b.batch_id} value={b.batch_id || b.batch_name}>{safeDisplay(b.batch_name || b.batch_id)}</option>)}
// //                 </select>
// //               </div>
// //             )}

// //             <DateInput name="fromDate" label="From Date" value={formData.fromDate} onChange={(e)=>setFormData(prev => ({ ...prev, fromDate: e.target.value }))} />
// //             <DateInput name="toDate" label="To Date" value={formData.toDate} onChange={(e)=>setFormData(prev => ({ ...prev, toDate: e.target.value }))} />

// //             <div className="flex items-end gap-2">
// //               <button onClick={generateReport} disabled={reportLoading} className={`px-4 py-2 rounded-lg text-white ${reportLoading ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"}`}>
// //                 {reportLoading ? <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> : null} Generate
// //               </button>

// //               <button onClick={() => exportReport("pdf")} disabled={!isReadyForExport} className={`px-4 py-2 rounded-lg text-white ${isReadyForExport ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"}`}>
// //                 <FileText className="w-4 h-4 inline-block mr-2" /> Export PDF
// //               </button>

// //               <button onClick={() => exportReport("excel")} disabled={!isReadyForExport} className={`px-4 py-2 rounded-lg text-white ${isReadyForExport ? "bg-green-600 hover:bg-green-700" : "bg-green-300 cursor-not-allowed"}`}>
// //                 <FilePlus className="w-4 h-4 inline-block mr-2" /> Export Excel
// //               </button>

// //               <button onClick={() => exportReport("json")} disabled={!isReadyForExport} className={`px-4 py-2 rounded-lg text-white ${isReadyForExport ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}>
// //                 <Download className="w-4 h-4 inline-block mr-2" /> JSON
// //               </button>
// //             </div>
// //           </div>

// //           {apiError && <div className="mt-3 text-sm text-red-600">{apiError}</div>}
// //           {metaLoading && <div className="mt-3 text-sm text-gray-500">Loading cohorts/batches...</div>}
// //           </div>

// //           {/* Report area */}
// //           <div className="p-6 min-h-[420px]">
// //             {reportLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-gray-500" /></div>}

// //             {!reportLoading && !reportData && (
// //               <div className="text-center py-20 text-gray-500">
// //                 <p className="font-semibold">No report loaded yet.</p>
// //                 <p className="text-sm">Choose filters and click Generate.</p>
// //               </div>
// //             )}

// //             {!reportLoading && reportData && (
// //               <>
// //                 {formData.reportType === "student_attendance" && (
// //                   <StudentReportView reportData={reportData} openCloseTicketModal={openCloseTicketModal} actionStatuses={actionStatuses} setActionStatuses={setActionStatuses} fromDate={formData.fromDate} toDate={formData.toDate} batch={formData.batch} />
// //                 )}

// //                 {formData.reportType === "teacher_class_counts" && (
// //                   <TeacherClassCountsView reportData={reportData} fromDate={formData.fromDate} toDate={formData.toDate} />
// //                 )}

                
// //               </>
// //             )}
// //           </div>

// //           <div className="p-4 bg-gray-100 text-xs text-gray-600 text-right border-t border-gray-200">
// //             Low attendance threshold is {LOW_ATTENDANCE_THRESHOLD}%.
// //           </div>
// //         </div>
// //       </div>

// //       {/* Close Ticket Modal */}
// //       <CloseTicketModal
// //         isOpen={isModalOpen}
// //         student={selectedStudent}
// //         reason={closeReason}
// //         setReason={setCloseReason}
// //         onClose={() => setIsModalOpen(false)}
// //         onConfirm={confirmCloseTicket}
// //       />
// //     </div>
// //   );
// // }

// // const CloseTicketModal = ({ isOpen, student, reason, setReason, onClose, onConfirm }) => {
// //   if (!isOpen) return null;
// //   return (
// //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //       <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
// //         <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
// //           <ShieldCheck className="w-5 h-5 text-emerald-600" /> Close Ticket
// //         </h3>
// //         <p className="text-sm text-gray-600 mb-3">
// //           Closing ticket for <strong>{student?.student_name || student?.name || "-"}</strong>
// //         </p>
// //         <textarea
// //           rows={3}
// //           value={reason}
// //           onChange={(e) => setReason(e.target.value)}
// //           placeholder="Enter closing reason..."
// //           className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
// //         />
// //         <div className="flex justify-end mt-4 gap-2">
// //           <button
// //             onClick={onClose}
// //             className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             onClick={onConfirm}
// //             className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
// //           >
// //             Confirm
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // -----------------------------
// // // Student Report View
// // // -----------------------------

// // const StudentReportView = ({
// //   reportData,
// //   openCloseTicketModal,
// //   actionStatuses,
// //   fromDate,
// //   toDate,
// // }) => {
// //   const students = reportData?.students || [];
// //   const cohortName = reportData?.cohort_name || "Cohort";
// //   const batchName = reportData?.batch_name || "Batch";
// //   const totalConductedBySubject = reportData?.totalConductedBySubject || {};

// //   const safeDisplay = (val) => {
// //     if (val === null || val === undefined) return "-";
// //     if (typeof val === "object") return JSON.stringify(val);
// //     return String(val);
// //   };

// //   // Collect all unique subjects
// //   const allSubjects = useMemo(() => {
// //     const subs = new Set();
// //     Object.keys(totalConductedBySubject || {}).forEach((s) => subs.add(s));
// //     if (subs.size === 0 && students.length > 0) {
// //       students.forEach((s) => {
// //         Object.keys(s.attended || {}).forEach((subj) => subs.add(subj));
// //       });
// //     }
// //     return Array.from(subs);
// //   }, [students, totalConductedBySubject]);

// //   // Subject-wise total conducted classes
// //   const subjectTotals = useMemo(() => {
// //     const totals = {};
// //     allSubjects.forEach((subj) => {
// //       totals[subj] = totalConductedBySubject?.[subj] || 0;
// //     });
// //     return totals;
// //   }, [totalConductedBySubject, allSubjects]);

// //   return (
// //     <div className="space-y-6">
// //       {/* ================= HEADER ================= */}
// //       <div className="flex justify-between items-center bg-gray-50 border rounded-lg p-4 shadow-sm">
// //         <div className="text-gray-700 font-medium">
// //           From: <span className="font-semibold">{safeDisplay(fromDate)}</span>
// //         </div>

// //         <div className="text-lg font-bold text-gray-900 text-center">
// //           {safeDisplay(cohortName)} - {safeDisplay(batchName)}-ATTENDANCE REPORT
// //         </div>

// //         <div className="text-gray-700 font-medium text-right">
// //           To: <span className="font-semibold">{safeDisplay(toDate)}</span>
// //         </div>
// //       </div>

// //       {/* ================= TABLE ================= */}
// //       {students.length === 0 ? (
// //         <p className="text-center text-gray-500 py-8">
// //           No student attendance data available.
// //         </p>
// //       ) : (
// //         <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
// //           <table className="min-w-full divide-y divide-gray-200 text-sm">
// //             <thead>
// //               <tr className="bg-gray-100">
// //                 <th className="px-4 py-2 text-left">#</th>
// //                 <th className="px-4 py-2 text-left">Student</th>

// //                 {allSubjects.map((subj) => (
// //                   <th
// //                     key={subj}
// //                     className="px-4 py-2 text-center font-semibold text-gray-700"
// //                   >
// //                     {subj}
// //                     <div className="text-gray-500 text-xs font-normal">
// //                       (Total: {subjectTotals[subj] || 0})
// //                     </div>
// //                   </th>
// //                 ))}

// //                 <th className="px-4 py-2 text-center">Attended</th>
// //                 <th className="px-4 py-2 text-center">%</th>
// //                 <th className="px-4 py-2 text-center">Status</th>
// //                 <th className="px-4 py-2 text-center">Action</th>
// //               </tr>
// //             </thead>

// //             <tbody className="divide-y divide-gray-100">
// //               {students.map((s, idx) => {
// //                 const attendedBySubject = s.attended || {};
// //                 const percent = s.attendance_percent ?? 0;
// //                 const low = percent < LOW_ATTENDANCE_THRESHOLD;
// //                 const act = actionStatuses?.[s.id] || { status: "N/A" };

// //                 return (
// //                   <tr key={s.id} className={low ? "bg-red-50" : ""}>
// //                     <td className="px-4 py-2">{idx + 1}</td>
// //                     <td className="px-4 py-2 font-medium">{s.name}</td>

// //                     {allSubjects.map((subj) => (
// //                       <td key={subj} className="px-4 py-2 text-center">
// //                         {attendedBySubject?.[subj] ?? 0}
// //                       </td>
// //                     ))}

// //                     <td className="px-4 py-2 text-center">
// //                       {s.attended_classes ?? 0}
// //                     </td>

// //                     <td className="px-4 py-2 text-center font-semibold">
// //                       {percent}%
// //                     </td>

// //                     <td className="px-4 py-2 text-center">
// //                       {low ? (
// //                         <span className="text-red-600 flex justify-center items-center gap-1 font-semibold">
// //                           <AlertTriangle className="w-4 h-4" /> Low
// //                         </span>
// //                       ) : (
// //                         <span className="text-green-600 flex justify-center items-center gap-1 font-semibold">
// //                           <ShieldCheck className="w-4 h-4" /> OK
// //                         </span>
// //                       )}
// //                     </td>

// //                     <td className="px-4 py-2 text-center">
// //                       {low && act.status !== "Closed - Action Taken" ? (
// //                         <button
// //                           onClick={() => openCloseTicketModal(s)}
// //                           className="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
// //                         >
// //                           Close Ticket
// //                         </button>
// //                       ) : (
// //                         <span className="text-xs text-gray-500">
// //                           {act.status}
// //                         </span>
// //                       )}
// //                     </td>
// //                   </tr>
// //                 );
// //               })}
// //             </tbody>
// //           </table>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };


// // // -----------------------------
// // // Teacher Class Counts View
// // // -----------------------------
// // const TeacherClassCountsView = ({ reportData, fromDate, toDate }) => {
// //   const counts = (reportData && reportData.teacherClassCounts) || [];

// //   const yearText = fromDate
// //     ? new Date(fromDate).getFullYear() +
// //       (toDate ? " - " + new Date(toDate).getFullYear() : "")
// //     : "";

// //   return (
// //     <div className="p-6 bg-white rounded-xl shadow-md">
// //       {/* Header Section */}
// //       <div className="flex justify-between items-center mb-6 border-b pb-2">
// //         <p className="text-sm text-gray-600">
// //           From: <span className="font-medium">{safeDisplay(fromDate)}</span>
// //         </p>
// //         <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
// //           <Users className="w-5 h-5 text-emerald-600" />
// //           Teacher Class Counts {yearText && `(${yearText})`}
// //         </h3>
// //         <p className="text-sm text-gray-600">
// //           To: <span className="font-medium">{safeDisplay(toDate)}</span>
// //         </p>
// //       </div>

// //       {/* Table Section */}
// //       {counts.length === 0 ? (
// //         <p className="text-center text-gray-500 py-8">
// //           No teacher class count data available.
// //         </p>
// //       ) : (
// //         <div className="overflow-x-auto border rounded-lg shadow-sm">
// //           <table className="min-w-full divide-y divide-gray-200 text-sm">
// //             <thead className="bg-gray-100">
// //               <tr>
// //                 <th className="px-4 py-2 text-left">#</th>
// //                 <th className="px-4 py-2 text-left">Teacher Name</th>
// //                 <th className="px-4 py-2 text-left">Cohort</th>
// //                 <th className="px-4 py-2 text-left">Classroom</th>
// //                 <th className="px-4 py-2 text-left">Subject</th>
// //                 <th className="px-4 py-2 text-left">Total Classes Taken</th>
// //               </tr>
// //             </thead>
// //             <tbody className="divide-y divide-gray-100">
// //               {counts.map((c, idx) => (
// //                 <tr key={idx}>
// //                   <td className="px-4 py-2">{idx + 1}</td>
// //                   <td className="px-4 py-2">{safeDisplay(c.teacher)}</td>
// //                   <td className="px-4 py-2">{safeDisplay(c.cohort)}</td>
// //                   <td className="px-4 py-2">{safeDisplay(c.classroom)}</td>
// //                   <td className="px-4 py-2">{safeDisplay(c.subject)}</td>
// //                   <td className="px-4 py-2">{safeDisplay(c.total_classes_taken)}</td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };


// // client/src/components/BatchReports.js
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import axios from "axios";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";
// import {
//   ClipboardList,
//   Filter,
//   Calendar,
//   Users,
//   Layers,
//   BarChart3,
//   Loader2,
//   ShieldCheck,
//   AlertTriangle,
//   Download,
//   FilePlus,
//   FileText
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import Logo from "../../assets/RCF-PP.jpg";

// const BACKEND_BASE = "http://localhost:5000";
// const COORDINATOR_BASE = `${BACKEND_BASE}/api/coordinator`;
// const API_BASE = `${BACKEND_BASE}/api/coordinator/reports`;
// const LOW_ATTENDANCE_THRESHOLD = 75.0;

// // -----------------------------
// // Safe display helper
// // -----------------------------
// const safeDisplay = (val) => {
//   if (val === null || val === undefined) return "-";
//   if (typeof val === "object") {
//     if (Array.isArray(val)) return val.map(v => safeDisplay(v)).join(", ");
//     const keys = Object.keys(val);
//     if (keys.length === 0) return "-";
//     return keys.join(", ");
//   }
//   return String(val);
// };

// // -----------------------------
// // Print + page styles
// // -----------------------------
// const PrintCSS = () => (
//   <style>
//     {`
//     @media print {
//       html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//       .no-print { display: none !important; }
//       .print-page { box-sizing: border-box; width: auto; padding: 18mm; margin: 6mm; border: 2px solid #0f766e; border-radius: 6px; }
//       .print-header { display:block; position:fixed; top:6mm; left:18mm; right:18mm; height:26mm; text-align:center; font-weight:700; font-size:16px; color:#0f766e; }
//       .print-header .logo { position:absolute; right:18mm; top:2mm; width:60px; height:auto; }
//       .print-body { margin-top:36mm; margin-bottom:20mm; }
//       .print-footer { display:block; position:fixed; bottom:6mm; left:18mm; right:18mm; height:12mm; text-align:center; font-size:12px; color:#374151; }
//       @page { margin: 0; }
//       .print-footer:after { content: "Page " counter(page); }
//       table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
//       tr { page-break-inside: avoid; page-break-after: auto; }
//       th, td { border: 1px solid #444; padding: 6px; font-size: 12px; }
//       th { background: #e6fffa; }
//     }
//     .screen-header { display:flex; align-items:center; gap:12px; }
//     `}
//   </style>
// );

// // -----------------------------
// // DateInput small component
// // -----------------------------
// const DateInput = ({ name, label, value, onChange }) => (
//   <div className="flex flex-col">
//     <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
//       <Calendar className="w-3 h-3 mr-1 text-gray-500" /> {label}
//     </label>
//     <input
//       type="date"
//       name={name}
//       value={value}
//       onChange={onChange}
//       className="p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:border-emerald-500 focus:ring-emerald-500 transition duration-150"
//     />
//   </div>
// );

// // -----------------------------
// // Main component
// // -----------------------------
// export default function BatchReports() {
//   const auth = useAuth();
//   const token = auth?.user?.token;
//   const userId = auth?.user?.id || auth?.user?.user_id || null;

//   const todayISO = new Date().toISOString().split("T")[0];
//   const sevenDaysAgoISO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

//   const [formData, setFormData] = useState({
//     reportType: "student_attendance",
//     cohort: "",
//     batch: "",
//     classroom: "",
//     teacherName: "",
//     fromDate: sevenDaysAgoISO,
//     toDate: todayISO,
//     date: todayISO,
//   });

//   // Metadata & data
//   const [cohorts, setCohorts] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [filteredBatches, setFilteredBatches] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [teacherOptions, setTeacherOptions] = useState([]);

//   // UI state
//   const [metaLoading, setMetaLoading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [reportLoading, setReportLoading] = useState(false);
//   const [apiError, setApiError] = useState(null);
//   const [reportData, setReportData] = useState(null);

//   // ticket/action state
//   const [actionStatuses, setActionStatuses] = useState({});

//   // modal state
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [closeReason, setCloseReason] = useState("");

//   // Export dropdown (click)
//   const [isExportOpen, setIsExportOpen] = useState(false);
//   const exportRef = useRef(null);
//   const [selectedFormat, setSelectedFormat] = useState("");

//   // -----------------------------
//   // auth headers
//   // -----------------------------
//   const authHeaders = useMemo(() => {
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   }, [token]);

//   // close export dropdown on outside click
//   useEffect(() => {
//     const onBodyClick = (e) => {
//       if (exportRef.current && !exportRef.current.contains(e.target)) {
//         setIsExportOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", onBodyClick);
//     return () => document.removeEventListener("mousedown", onBodyClick);
//   }, []);

//     // -----------------------------
//   // Fetch cohorts
//   // -----------------------------
//   useEffect(() => {
//     let cancelled = false;
//     const loadCohorts = async () => {
//       if (!token) return;
//       setMetaLoading(true);
//       setApiError(null);
//       try {
//         const res = await axios.get(`${COORDINATOR_BASE}/cohorts`, {
//           headers: authHeaders,
//           params: userId ? { userId } : {}
//         });
//         if (cancelled) return;
//         const rows = (res.data || []).map(r => ({
//           cohort_number: r.cohort_number ?? r.cohortNumber ?? r.cohort,
//           cohort_name: r.cohort_name ?? r.cohortName ?? r.cohort_name
//         }));
//         setCohorts(rows);
//         if (rows.length > 0 && !formData.cohort) {
//           setFormData(fd => ({ ...fd, cohort: rows[0].cohort_number }));
//         }
//       } catch (err) {
//         console.error("Error fetching cohorts:", err);
//         setApiError("Failed to load cohorts. Check backend or auth token.");
//       } finally {
//         if (!cancelled) setMetaLoading(false);
//       }
//     };
//     loadCohorts();
//     return () => { cancelled = true; };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   // -----------------------------
//   // Fetch batches for cohort
//   // -----------------------------
//   useEffect(() => {
//     let cancelled = false;
//     const loadBatches = async () => {
//       if (!token) return;
//       if (!formData.cohort) {
//         setBatches([]);
//         setFilteredBatches([]);
//         return;
//       }
//       setMetaLoading(true);
//       setApiError(null);
//       try {
//         const url = `${COORDINATOR_BASE}/batches?cohort_number=${encodeURIComponent(formData.cohort)}`;
//         const res = await axios.get(url, { headers: authHeaders });
//         if (cancelled) return;
//         const rows = (res.data || []).map(r => ({
//           batch_id: r.batch_id ?? r.batchId ?? r.batch_id,
//           batch_name: r.batch_name ?? r.batchName ?? r.batch_name,
//           cohort_number: r.cohort_number ?? r.cohortNumber ?? r.cohort_number,
//           cohort_name: r.cohort_name ?? r.cohortName ?? r.cohort_name
//         }));
//         setBatches(rows);
//         setFilteredBatches(rows);
//         setFormData(prev => ({ ...prev, batch: "", classroom: "" }));
//         setStudents([]);
//       } catch (err) {
//         console.error("Error fetching batches:", err);
//         setApiError("Failed to load batches. Check backend.");
//       } finally {
//         if (!cancelled) setMetaLoading(false);
//       }
//     };
//     loadBatches();
//     return () => { cancelled = true; };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formData.cohort, token]);

//   // -----------------------------
//   // Fetch students for cohort+batch (optional)
//   // -----------------------------
//   useEffect(() => {
//     let cancelled = false;
//     const loadStudents = async () => {
//       if (!token) return;
//       if (!formData.cohort || !formData.batch) {
//         setStudents([]);
//         return;
//       }
//       setLoading(true);
//       setApiError(null);
//       try {
//         const res = await axios.get(`${COORDINATOR_BASE}/students`, {
//           headers: authHeaders,
//           params: {
//             cohortNumber: formData.cohort,
//             batchId: formData.batch,
//           }
//         });
//         if (cancelled) return;
//         setStudents(res.data || []);
//       } catch (err) {
//         console.error("Error fetching students:", err);
//         setApiError("Failed to load students.");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     loadStudents();
//     return () => { cancelled = true; };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formData.batch, formData.cohort, token]);

//   // -----------------------------
//   // Load Teachers for Coordinator
//   // -----------------------------
//   useEffect(() => {
//     let cancelled = false;

//     const loadTeachers = async () => {
//       if (!auth?.user?.token) return;

//       try {
//         const res = await axios.get(`${API_BASE}/coordinator-teachers`, {
//           headers: { Authorization: `Bearer ${auth.user.token}` },
//           params: {
//             user_id: auth.user.user_id,
//             fromDate: "1970-01-01",
//             toDate: "2100-01-01",
//           },
//         });

//         if (cancelled) return;

//         const teachersData = res.data || [];

//         const teachers = Array.from(
//           new Set(
//             teachersData
//               .map((t) => t.teacher_name || t.name || t.teacher)
//               .filter(Boolean)
//           )
//         ).sort();

//         setTeacherOptions(teachers);
//       } catch (err) {
//         console.warn("Could not load teacher options:", err?.response?.data || err.message || err);
//       }
//     };

//     loadTeachers();
//     return () => {
//       cancelled = true;
//     };
//   }, [auth?.user?.token]);

//   // -----------------------------
//   // Fetch attendance report
//   // -----------------------------
//   const fetchAttendanceReport = async () => {
//     if (!token) {
//       setApiError("Not authenticated");
//       return;
//     }
//     if (!formData.batch) {
//       setApiError("Choose a batch");
//       return;
//     }
//     setReportLoading(true);
//     setApiError(null);
//     try {
//       const res = await axios.get(`${API_BASE}/attendance`, 
//       {
//         headers: authHeaders,
//         params: {
//           batchId: formData.batch,
//           fromDate: formData.fromDate,
//           toDate: formData.toDate
//         }
//       });
//       setReportData(res.data || {});
//       const stMap = {};
//       (res.data?.students || []).forEach(s => {
//         stMap[s.id] = { status: s.actionStatus || "N/A", reason: s.actionReason || null };
//       });
//       setActionStatuses(stMap);
//     } catch (err) {
//       console.error("Error fetching attendance report:", err);
//       setApiError(err?.response?.data?.error || "Failed to fetch attendance report.");
//     } finally {
//       setReportLoading(false);
//     }
//   };

//   // -----------------------------
//   // Fetch teacher load
//   // -----------------------------
//   const fetchTeacherLoad = async () => {
//     if (!token) return;
//     setReportLoading(true);
//     setApiError(null);
//     try {
//       const res = await axios.get(`${API_BASE}/teacher-load`, {
//         headers: authHeaders,
//         params: {
//           fromDate: formData.fromDate,
//           toDate: formData.toDate
//         }
//       });
//       setReportData(res.data || {});
//     } catch (err) {
//       console.error("Error fetching teacher load:", err);
//       setApiError("Failed to fetch teacher load.");
//     } finally {
//       setReportLoading(false);
//     }
//   };

//   // -----------------------------
//   // Generate report
//   // -----------------------------
//   const generateReport = async () => {
//     setApiError(null);
//     setReportData(null);
//     if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report") {
//       await fetchAttendanceReport();
//     } else if (formData.reportType === "teacher_class_counts") {
//       await fetchTeacherLoad();
//     } 
//   };

//     // -----------------------------
//   // Convert an image URL to dataURL (used for jsPDF addImage)
//   // -----------------------------
//   const imageUrlToDataURL = (url) => {
//     return fetch(url)
//       .then(res => res.blob())
//       .then(blob => new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       }));
//   };

//   // -----------------------------
//   // Export helpers (PDF + Excel + JSON)
//   // -----------------------------
//   const exportReport = async (format = "json") => {
//     if (!reportData) {
//       alert("Generate a report first.");
//       return;
//     }

//     // JSON
//     if (format === "json") {
//       const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `report-${formData.reportType}-${Date.now()}.json`;
//       a.click();
//       URL.revokeObjectURL(url);
//       return;
//     }

//     // Excel
//     if (format === "excel") {
//       const workbook = XLSX.utils.book_new();

//       // Student attendance sheet
//       if (formData.reportType === "student_attendance") {
//         const rows = [];
//         // Use subject codes directly from reportData.totalConductedBySubject keys
//         const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});

//         // build header with subjects
//         const headerWithSubjects = ["#", "Student", ...allSubjects, "Attended Classes", "Attendance %"];
//         rows.push(headerWithSubjects);

//         (reportData.students || []).forEach((st, idx) => {
//           const subjVals = allSubjects.map(code => (st.attended && st.attended[code] !== undefined ? st.attended[code] : ""));
//           rows.push([idx+1, st.name || st.student_name || "-", ...subjVals, st.attended_classes ?? 0, st.attendance_percent ?? ""]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(rows);
//         XLSX.utils.book_append_sheet(workbook, ws, "Student Attendance");
//       }

//       // Teacher class counts sheet
//       if (formData.reportType === "teacher_class_counts") {
//         const rows = [];
//         rows.push(["#", "Teacher", "Cohort", "Classroom", "Subject", "Total Classes"]);
//         (reportData.teacherClassCounts || reportData.assignments || []).forEach((r, idx) => {
//           const subjVal = r.subject_code || r.subject || r.subject_name || "";
//           rows.push([idx + 1, r.teacher || r.teacher_name, r.cohort, r.classroom, subjVal, r.total_classes_taken || r.total_classes]);
//         });
//         const ws = XLSX.utils.aoa_to_sheet(rows);
//         XLSX.utils.book_append_sheet(workbook, ws, "Teacher Class Counts");
//       }

//       XLSX.writeFile(workbook, `report-${formData.reportType}-${Date.now()}.xlsx`);
//       return;
//     }

//     // PDF
//     if (format === "pdf") {
//       try {
//         const doc = new jsPDF({ unit: "pt", format: "a4" });

//         // Add logo (converted to dataURL)
//         let logoDataUrl = null;
//         try {
//           logoDataUrl = await imageUrlToDataURL(Logo);
//         } catch (err) {
//           console.warn("Logo conversion failed, continuing without logo.", err);
//         }

//         // Header: logo on right, title center
//         const pageWidth = doc.internal.pageSize.getWidth();
//         // Add title
//         doc.setFontSize(14);
//         doc.setFont("helvetica", "bold");

//         // Title lines
//         let titleLines = [];
//         if (formData.reportType === "teacher_class_counts") {
//           const from = formData.fromDate ? new Date(formData.fromDate) : null;
//           const monthText = from ? from.toLocaleString(undefined, { month: "long", year: "numeric" }) : "";
//           titleLines.push("TEACHER CLASS COUNT REPORT");
//           if (monthText) titleLines.push(`Month: ${monthText}`);
//         } else {
//           const t = `${reportData?.cohort_name || ""} ${reportData?.batch_name ? "- " + reportData.batch_name : ""} ATTENDANCE REPORT`;
//           titleLines.push(t);
//         }

//         // center and draw title lines
//         const headerY = 40;
//         titleLines.forEach((line, idx) => {
//           const textWidth = doc.getTextWidth(line);
//           const titleX = (pageWidth - textWidth) / 2;
//           doc.text(line, titleX, headerY + idx * 18);
//         });

//         // Logo on right
//         if (logoDataUrl) {
//           const logoW = 60;
//           const logoH = 60;
//           doc.addImage(logoDataUrl, "JPEG", pageWidth - logoW - 40, headerY - 8, logoW, logoH);
//         }

//         // build table body
//         let columns = [];
//         let rows = [];

//         if (formData.reportType === "student_attendance") {
//           // build dynamic columns: subjects + total + percent
//           const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});

//           columns = ["#", "Student", ...allSubjects, "Attended", "%", "Status"];

//           (reportData.students || []).forEach((st, idx) => {
//             const subjVals = allSubjects.map(code => st.attended?.[code] ?? 0);
//             const percent = st.attendance_percent ?? 0;
//             const low = percent < LOW_ATTENDANCE_THRESHOLD;
//             rows.push([
//               idx + 1,
//               st.name || st.student_name || "-",
//               ...subjVals,
//               st.attended_classes ?? 0,
//               `${percent}%`,
//               low ? "Low" : "OK"
//             ]);
//           });
//         }

//         if (formData.reportType === "teacher_class_counts") {
//           columns = ["#", "Teacher", "Cohort", "Classroom", "Subject", "Total Classes"];
//           (reportData.teacherClassCounts || reportData.assignments || []).forEach((r, idx) => {
//             const subjVal = r.subject_code || r.subject || r.subject_name || "-";
//             rows.push([idx + 1, r.teacher || r.teacher_name || "-", r.cohort || "-", r.classroom || "-", subjVal, r.total_classes_taken || r.total_classes || 0]);
//           });
//         }

//         // Draw table below header
//         autoTable(doc, {
//           startY: 100,
//           head: [columns],
//           body: rows,
//           styles: {
//             fontSize: 10,
//             cellPadding: 6,
//           },
//           headStyles: { fillColor: [16, 185, 129] },
//           theme: "grid",
//           margin: { left: 40, right: 40 },
//           didDrawPage: function (data) {
//             const page = doc.internal.getNumberOfPages();
//             doc.setFontSize(9);
//             doc.setTextColor(120);
//             const footerText = `Generated on ${new Date().toLocaleString()}`;
//             const footerX = 40;
//             const footerY = doc.internal.pageSize.getHeight() - 30;
//             doc.text(footerText, footerX, footerY);

//             const pageLabel = `Page ${page}`;
//             const pageLabelWidth = doc.getTextWidth(pageLabel);
//             doc.text(pageLabel, doc.internal.pageSize.getWidth() - pageLabelWidth - 40, footerY);
//           }
//         });

//         doc.save(`report-${formData.reportType}-${Date.now()}.pdf`);
//       } catch (err) {
//         console.error("PDF export failed:", err);
//         alert("Failed to generate PDF.");
//       }
//       return;
//     }

//     alert(`Unsupported export format: ${format}`);
//   };

//     // -----------------------------
//   // Ticket modal actions
//   // -----------------------------
//   const openCloseTicketModal = (student) => {
//     setSelectedStudent(student);
//     setCloseReason("");
//     setIsModalOpen(true);
//   };

//   const confirmCloseTicket = () => {
//     if (!closeReason.trim()) return;
//     const sid = selectedStudent.id;
//     setActionStatuses(prev => ({ ...prev, [sid]: { status: "Closed - Action Taken", reason: closeReason.trim() } }));
//     setIsModalOpen(false);
//   };

//   // -----------------------------
//   // Helpers for UI derived data & filters
//   // -----------------------------
//   const isReadyForExport = useMemo(() => {
//     if (!reportData) return false;
//     if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report")
//       return (reportData.students || []).length > 0;
//     if (formData.reportType === "teacher_class_counts")
//       return (reportData.assignments || reportData.teacherClassCounts || []).length > 0;
//     if (formData.reportType === "teacher_performance")
//       return !!reportData.teacher;
//     return false;
//   }, [reportData, formData.reportType]);

//   // -----------------------------
//   // UI render
//   // -----------------------------
//   return (
//     <div className="min-h-screen p-4 bg-gray-50 font-sans">
//       <PrintCSS />
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

//           {/* screen header */}
//           <div className="p-6 bg-emerald-600 text-white flex items-start gap-4 no-print">
//             <ClipboardList className="w-8 h-8 text-emerald-200" />
//             <div>
//               <h1 className="text-2xl font-extrabold">Performance & Absentees Report System</h1>
//               <p className="text-sm opacity-90 mt-1">Cohort → Batch based attendance & teacher reports (coordinator view).</p>
//             </div>
//           </div>

//           {/* print header (visible only in print) */}
//           <div className="print-header" aria-hidden="true">
//             <div style={{ position: "relative" }}>
//               <div style={{ textAlign: "center" }}>
//                 {`${reportData?.cohort_name || ""} ${reportData?.batch_name ? "- " + reportData.batch_name : ""} ATTENDANCE REPORT`}
//               </div>
//               {/* logo on right */}
//               <img src={Logo} alt="Logo" className="logo" style={{ position: "absolute", right: 0, top: -4, width: 60 }} />
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="p-6 border-b border-gray-100 bg-gray-50">
//             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               <Filter className="w-5 h-5 text-emerald-600" /> Report Configuration
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
//               <div className="md:col-span-2">
//                 <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><BarChart3 className="w-3 h-3 mr-1" /> Report Type</label>
//                 <select name="reportType" value={formData.reportType} onChange={(e)=>setFormData({...formData, reportType: e.target.value})} className="p-2 border rounded-lg w-full">
//                   <option value="student_attendance">STUDENT ATTENDANCE</option>
//                   <option value="teacher_class_counts">TEACHER CLASS COUNTS</option>
//                 </select>
//               </div>

//               {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><Layers className="w-3 h-3 mr-1" /> Cohort</label>
//                   <select name="cohort" value={formData.cohort} onChange={(e)=>setFormData(prev => ({ ...prev, cohort: e.target.value }))} className="p-2 border rounded-lg w-full">
//                     <option value="">-- Select Cohort --</option>
//                     {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{safeDisplay(c.cohort_name || c.cohort_number)}</option>)}
//                   </select>
//                 </div>
//               )}

//               {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 mb-1 flex items-center"><Users className="w-3 h-3 mr-1" /> Batch</label>
//                   <select name="batch" value={formData.batch} onChange={(e)=>setFormData(prev => ({ ...prev, batch: e.target.value }))} className="p-2 border rounded-lg w-full">
//                     <option value="">-- Select Batch --</option>
//                     {filteredBatches.map(b => <option key={b.batch_id} value={b.batch_id || b.batch_name}>{safeDisplay(b.batch_name || b.batch_id)}</option>)}
//                   </select>
//                 </div>
//               )}

//               <DateInput name="fromDate" label="From Date" value={formData.fromDate} onChange={(e)=>setFormData(prev => ({ ...prev, fromDate: e.target.value }))} />
//               <DateInput name="toDate" label="To Date" value={formData.toDate} onChange={(e)=>setFormData(prev => ({ ...prev, toDate: e.target.value }))} />

//               {/* BUTTON & FORMAT ROW */}
// <div className="filter-bar flex items-center gap-3 mt-3">

//   {/* Generate Button */}
//   <button
//     onClick={generateReport}
//     disabled={reportLoading}
//     className={`px-4 py-2 h-10 rounded-lg text-white font-medium ${
//       reportLoading
//         ? "bg-gray-400"
//         : "bg-emerald-600 hover:bg-emerald-700"
//     }`}
//   >
//     {reportLoading ? (
//       <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
//     ) : null}
//     Generate
//   </button>

//   {/* Format Dropdown - EXACT SAME STYLE AS COHORT DROPDOWN */}
//   <div className="filter-item flex items-center relative">
//     <Filter className="input-icon" />
//     <select
//       value={selectedFormat}
//       onChange={(e) => setSelectedFormat(e.target.value)}
//       disabled={!isReadyForExport}
//       className={isReadyForExport ? "" : "cursor-not-allowed bg-gray-200"}
//     >
//       <option value="">Format</option>
//       <option value="pdf">PDF</option>
//       <option value="excel">Excel</option>
//       <option value="json">JSON</option>
//     </select>
//   </div>

//   {/* Export Button */}
//   <button
//     onClick={() => {
//       if (!selectedFormat) return alert("Please select a format first");
//       exportReport(selectedFormat);
//     }}
//     disabled={!isReadyForExport}
//     className={`px-4 py-2 h-10 rounded-lg text-white font-medium ${
//       isReadyForExport
//         ? "bg-blue-600 hover:bg-blue-700"
//         : "bg-blue-300 cursor-not-allowed"
//     }`}
//   >
//     Export
//   </button>

// </div>

//             </div>

//             {apiError && <div className="mt-3 text-sm text-red-600">{apiError}</div>}
//             {metaLoading && <div className="mt-3 text-sm text-gray-500">Loading cohorts/batches...</div>}
//           </div>
//           {/* Report area */}
//           <div className="p-6 min-h-[420px] print-body">
//             {reportLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-gray-500" /></div>}

//             {!reportLoading && !reportData && (
//               <div className="text-center py-20 text-gray-500">
//                 <p className="font-semibold">No report loaded yet.</p>
//                 <p className="text-sm">Choose filters and click Generate.</p>
//               </div>
//             )}

//             {!reportLoading && reportData && (
//               <>
//                 {formData.reportType === "student_attendance" && (
//                   <StudentReportView reportData={reportData} openCloseTicketModal={openCloseTicketModal} actionStatuses={actionStatuses} setActionStatuses={setActionStatuses} fromDate={formData.fromDate} toDate={formData.toDate} batch={formData.batch} />
//                 )}

//                 {formData.reportType === "teacher_class_counts" && (
//                   <TeacherClassCountsView reportData={reportData} fromDate={formData.fromDate} toDate={formData.toDate} />
//                 )}
//               </>
//             )}
//           </div>

//           <div className="p-4 bg-gray-100 text-xs text-gray-600 text-right border-t border-gray-200 no-print">
//             Low attendance threshold is {LOW_ATTENDANCE_THRESHOLD}%.
//           </div>

//           {/* print footer element (visible printing) */}
//           <div className="print-footer" aria-hidden="true"></div>

//         </div>
//       </div>

//       {/* Close Ticket Modal */}
//       <CloseTicketModal
//         isOpen={isModalOpen}
//         student={selectedStudent}
//         reason={closeReason}
//         setReason={setCloseReason}
//         onClose={() => setIsModalOpen(false)}
//         onConfirm={confirmCloseTicket}
//       />
//     </div>
//   );
// }

// // -----------------------------
// // Close Ticket Modal
// // -----------------------------
// const CloseTicketModal = ({ isOpen, student, reason, setReason, onClose, onConfirm }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
//       <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
//         <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
//           <ShieldCheck className="w-5 h-5 text-emerald-600" /> Close Ticket
//         </h3>
//         <p className="text-sm text-gray-600 mb-3">
//           Closing ticket for <strong>{student?.student_name || student?.name || "-"}</strong>
//         </p>
//         <textarea
//           rows={3}
//           value={reason}
//           onChange={(e) => setReason(e.target.value)}
//           placeholder="Enter closing reason..."
//           className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//         />
//         <div className="flex justify-end mt-4 gap-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => { onConfirm(); }}
//             className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
//           >
//             Confirm
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // -----------------------------
// // Student Report View
// // -----------------------------
// const StudentReportView = ({
//   reportData,
//   openCloseTicketModal,
//   actionStatuses,
//   fromDate,
//   toDate,
// }) => {
//   const students = reportData?.students || [];
//   const cohortName = reportData?.cohort_name || "Cohort";
//   const batchName = reportData?.batch_name || "Batch";
//   const totalConductedBySubject = reportData?.totalConductedBySubject || {};

//   const safeDisplayLocal = (val) => {
//     if (val === null || val === undefined) return "-";
//     if (typeof val === "object") return JSON.stringify(val);
//     return String(val);
//   };

//   // Collect all unique subject codes (we assume backend provides keys as subject_code)
//   const allSubjects = useMemo(() => {
//     const subs = new Set();
//     Object.keys(totalConductedBySubject || {}).forEach((s) => subs.add(s));
//     if (subs.size === 0 && students.length > 0) {
//       students.forEach((s) => {
//         Object.keys(s.attended || {}).forEach((subj) => subs.add(subj));
//       });
//     }
//     return Array.from(subs);
//   }, [students, totalConductedBySubject]);

//   // Subject-wise total conducted classes
//   const subjectTotals = useMemo(() => {
//     const totals = {};
//     allSubjects.forEach((subj) => {
//       totals[subj] = totalConductedBySubject?.[subj] || 0;
//     });
//     return totals;
//   }, [totalConductedBySubject, allSubjects]);

//   return (
//     <div className="space-y-6">
//       {/* ================= HEADER ================= */}
//       <div className="flex justify-between items-center bg-gray-50 border rounded-lg p-4 shadow-sm">
//         <div className="text-gray-700 font-medium">
//           From: <span className="font-semibold">{safeDisplayLocal(fromDate)}</span>
//         </div>

//         <div className="text-lg font-bold text-gray-900 text-center">
//           {safeDisplayLocal(cohortName)} - {safeDisplayLocal(batchName)} - ATTENDANCE REPORT
//         </div>

//         <div className="text-gray-700 font-medium text-right">
//           To: <span className="font-semibold">{safeDisplayLocal(toDate)}</span>
//         </div>
//       </div>

//       {/* ================= TABLE ================= */}
//       {students.length === 0 ? (
//         <p className="text-center text-gray-500 py-8">
//           No student attendance data available.
//         </p>
//       ) : (
//         <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
//           <table className="min-w-full divide-y divide-gray-200 text-sm">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="px-4 py-2 text-left">#</th>
//                 <th className="px-4 py-2 text-left">Student</th>

//                 {allSubjects.map((code) => (
//                   <th
//                     key={code}
//                     className="px-4 py-2 text-center font-semibold text-gray-700"
//                   >
//                     {code}
//                     <div className="text-gray-500 text-xs font-normal">
//                       (Total: {subjectTotals[code] || 0})
//                     </div>
//                   </th>
//                 ))}

//                 <th className="px-4 py-2 text-center">Attended</th>
//                 <th className="px-4 py-2 text-center">%</th>
//                 <th className="px-4 py-2 text-center">Status</th>
//                 <th className="px-4 py-2 text-center">Action</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {students.map((s, idx) => {
//                 const attendedBySubject = s.attended || {};
//                 const percent = s.attendance_percent ?? 0;
//                 const low = percent < LOW_ATTENDANCE_THRESHOLD;
//                 const act = actionStatuses?.[s.id] || { status: "N/A" };

//                 return (
//                   <tr key={s.id} className={low ? "bg-red-50" : ""}>
//                     <td className="px-4 py-2">{idx + 1}</td>
//                     <td className="px-4 py-2 font-medium">{s.name}</td>

//                     {allSubjects.map((code) => (
//                       <td key={code} className="px-4 py-2 text-center">
//                         {attendedBySubject?.[code] ?? 0}
//                       </td>
//                     ))}

//                     <td className="px-4 py-2 text-center">
//                       {s.attended_classes ?? 0}
//                     </td>

//                     <td className="px-4 py-2 text-center font-semibold">
//                       {s.attendance_percent ?? 0}%
//                     </td>

//                     <td className="px-4 py-2 text-center">
//                       {low ? (
//                         <span className="text-red-600 flex justify-center items-center gap-1 font-semibold">
//                           <AlertTriangle className="w-4 h-4" /> Low
//                         </span>
//                       ) : (
//                         <span className="text-green-600 flex justify-center items-center gap-1 font-semibold">
//                           <ShieldCheck className="w-4 h-4" /> OK
//                         </span>
//                       )}
//                     </td>

//                     <td className="px-4 py-2 text-center">
//                       {low && act.status !== "Closed - Action Taken" ? (
//                         <button
//                           onClick={() => openCloseTicketModal(s)}
//                           className="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
//                         >
//                           Close Ticket
//                         </button>
//                       ) : (
//                         <span className="text-xs text-gray-500">
//                           {act.status}
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// // -----------------------------
// // Teacher Class Counts View
// // -----------------------------
// const TeacherClassCountsView = ({ reportData, fromDate, toDate }) => {
//   const counts = (reportData && (reportData.teacherClassCounts || reportData.assignments)) || [];

//   const yearText = fromDate
//     ? new Date(fromDate).getFullYear() +
//       (toDate ? " - " + new Date(toDate).getFullYear() : "")
//     : "";

//   return (
//     <div className="p-6 bg-white rounded-xl shadow-md">
//       {/* Header Section */}
//       <div className="flex justify-between items-center mb-6 border-b pb-2">
//         <p className="text-sm text-gray-600">
//           From: <span className="font-medium">{safeDisplay(fromDate)}</span>
//         </p>
//         <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
//           <Users className="w-5 h-5 text-emerald-600" />
//           Teacher Class Counts {yearText && `(${yearText})`}
//         </h3>
//         <p className="text-sm text-gray-600">
//           To: <span className="font-medium">{safeDisplay(toDate)}</span>
//         </p>
//       </div>

//       {/* Table Section */}
//       {counts.length === 0 ? (
//         <p className="text-center text-gray-500 py-8">
//           No teacher class count data available.
//         </p>
//       ) : (
//         <div className="overflow-x-auto border rounded-lg shadow-sm">
//           <table className="min-w-full divide-y divide-gray-200 text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-4 py-2 text-left">#</th>
//                 <th className="px-4 py-2 text-left">Teacher Name</th>
//                 <th className="px-4 py-2 text-left">Cohort</th>
//                 <th className="px-4 py-2 text-left">Classroom</th>
//                 <th className="px-4 py-2 text-left">Subject</th>
//                 <th className="px-4 py-2 text-left">Total Classes Taken</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {counts.map((c, idx) => (
//                 <tr key={idx}>
//                   <td className="px-4 py-2">{idx + 1}</td>
//                   <td className="px-4 py-2">{safeDisplay(c.teacher)}</td>
//                   <td className="px-4 py-2">{safeDisplay(c.cohort)}</td>
//                   <td className="px-4 py-2">{safeDisplay(c.classroom)}</td>
//                   <td className="px-4 py-2">{safeDisplay(c.subject_code || c.subject || c.subject_name)}</td>
//                   <td className="px-4 py-2">{safeDisplay(c.total_classes_taken)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };






// client/src/pages/coordinator/BatchReports.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  ClipboardList,
  Filter,
  Calendar,
  Users,
  Layers,
  BarChart3,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../assets/RCF-PP.jpg";

import PrintCSS from "./PrintCSS";
import DateInput from "./DateInput";
import StudentReportView from "./StudentReportView";
import TeacherClassCountsView from "./TeacherClassCountsView";
import CloseTicketModal from "./CloseTicketModal";

const BACKEND_BASE = "http://localhost:5000";
const COORDINATOR_BASE = `${BACKEND_BASE}/api/coordinator`;
const API_BASE = `${BACKEND_BASE}/api/coordinator/reports`;
const LOW_ATTENDANCE_THRESHOLD = 75.0;

// Safe display helper
const safeDisplay = (val) => {
  if (val === null || val === undefined) return "-";
  if (typeof val === "object") {
    if (Array.isArray(val)) return val.map((v) => safeDisplay(v)).join(", ");
    const keys = Object.keys(val);
    if (keys.length === 0) return "-";
    return keys.join(", ");
  }
  return String(val);
};

export default function BatchReports() {
  const auth = useAuth();
  const token = auth?.user?.token;
  const userId = auth?.user?.user_id ?? auth?.user?.id ?? null;

  const todayISO = new Date().toISOString().split("T")[0];
  const sevenDaysAgoISO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    reportType: "student_attendance",
    cohort: "",
    batch: "",
    classroom: "",
    teacherName: "",
    fromDate: sevenDaysAgoISO,
    toDate: todayISO,
    date: todayISO,
  });

  // Metadata & data
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);

  // UI state
  const [metaLoading, setMetaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // ticket/action state
  const [actionStatuses, setActionStatuses] = useState({});

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [closeReason, setCloseReason] = useState("");

  // Export dropdown (click)
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);
  const [selectedFormat, setSelectedFormat] = useState("");

  // auth headers
  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // close export dropdown on outside click
  useEffect(() => {
    const onBodyClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onBodyClick);
    return () => document.removeEventListener("mousedown", onBodyClick);
  }, []);

  // Fetch cohorts
  useEffect(() => {
    let cancelled = false;
    const loadCohorts = async () => {
      if (!token) return;
      setMetaLoading(true);
      setApiError(null);
      try {
        const res = await axios.get(`${COORDINATOR_BASE}/cohorts`, {
          headers: authHeaders,
          params: userId ? { userId } : {},
        });
        if (cancelled) return;
        const rows = (res.data || []).map((r) => ({
          cohort_number: r.cohort_number ?? r.cohortNumber ?? r.cohort,
          cohort_name:
            r.cohort_name ?? r.cohortName ?? r.cohort_name ?? String(r.cohort),
        }));
        setCohorts(rows);
        if (rows.length > 0 && !formData.cohort) {
          setFormData((fd) => ({ ...fd, cohort: rows[0].cohort_number }));
        }
      } catch (err) {
        console.error("Error fetching cohorts:", err);
        setApiError("Failed to load cohorts. Check backend or auth token.");
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };
    loadCohorts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  // Fetch batches for cohort
  useEffect(() => {
    let cancelled = false;
    const loadBatches = async () => {
      if (!token) return;
      if (!formData.cohort) {
        setBatches([]);
        setFilteredBatches([]);
        return;
      }
      setMetaLoading(true);
      setApiError(null);
      try {
        const url = `${COORDINATOR_BASE}/batches?cohort_number=${encodeURIComponent(
          formData.cohort
        )}`;
        const res = await axios.get(url, { headers: authHeaders });
        if (cancelled) return;
        const rows = (res.data || []).map((r) => ({
          batch_id: r.batch_id ?? r.batchId ?? r.id,
          batch_name: r.batch_name ?? r.batchName ?? r.name,
          cohort_number: r.cohort_number ?? r.cohortNumber ?? formData.cohort,
          cohort_name: r.cohort_name ?? r.cohortName ?? "",
        }));
        setBatches(rows);
        setFilteredBatches(rows);
        setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
        setStudents([]);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setApiError("Failed to load batches. Check backend.");
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };
    loadBatches();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cohort, token]);

  // Fetch students for cohort+batch (optional)
  useEffect(() => {
    let cancelled = false;
    const loadStudents = async () => {
      if (!token) return;
      if (!formData.cohort || !formData.batch) {
        setStudents([]);
        return;
      }
      setLoading(true);
      setApiError(null);
      try {
        const res = await axios.get(`${COORDINATOR_BASE}/students`, {
          headers: authHeaders,
          params: {
            cohortNumber: formData.cohort,
            batchId: formData.batch,
          },
        });
        if (cancelled) return;
        setStudents(res.data || []);
      } catch (err) {
        console.error("Error fetching students:", err);
        setApiError("Failed to load students.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadStudents();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.batch, formData.cohort, token]);

  // Load Teachers for Coordinator
  useEffect(() => {
    let cancelled = false;

    const loadTeachers = async () => {
      if (!token) return;

      try {
        const res = await axios.get(`${API_BASE}/coordinator-teachers`, {
          headers: authHeaders,
          params: {
            user_id: userId,
            fromDate: "1970-01-01",
            toDate: "2100-01-01",
          },
        });

        if (cancelled) return;

        const teachersData = res.data || [];

        const teachers = Array.from(
          new Set(
            teachersData
              .map((t) => t.teacher_name || t.name || t.teacher)
              .filter(Boolean)
          )
        ).sort();

        setTeacherOptions(teachers);
      } catch (err) {
        console.warn(
          "Could not load teacher options:",
          err?.response?.data || err.message || err
        );
      }
    };

    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, userId]);

  // Fetch attendance report
  const fetchAttendanceReport = async () => {
    if (!token) {
      setApiError("Not authenticated");
      return;
    }
    if (!formData.batch) {
      setApiError("Choose a batch");
      return;
    }
    setReportLoading(true);
    setApiError(null);
    try {
      const res = await axios.get(`${API_BASE}/attendance`, {
        headers: authHeaders,
        params: {
          batchId: formData.batch,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
        },
      });

      const data = res.data || {};
      setReportData(data);

      const stMap = {};
      (data.students || []).forEach((s) => {
        const sid = s.student_id ?? s.id ?? s.studentId ?? s.unique_id;
        stMap[sid] = {
          status: s.actionStatus || s.status || "N/A",
          reason: s.actionReason || s.reason || null,
        };
      });
      setActionStatuses(stMap);
    } catch (err) {
      console.error("Error fetching attendance report:", err);
      setApiError(err?.response?.data?.error || "Failed to fetch attendance report.");
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch teacher load
  const fetchTeacherLoad = async () => {
    if (!token) return;
    setReportLoading(true);
    setApiError(null);
    try {
      const res = await axios.get(`${API_BASE}/teacher-load`, {
        headers: authHeaders,
        params: {
          fromDate: formData.fromDate,
          toDate: formData.toDate,
        },
      });
      setReportData(res.data || {});
    } catch (err) {
      console.error("Error fetching teacher load:", err);
      setApiError("Failed to fetch teacher load.");
    } finally {
      setReportLoading(false);
    }
  };

  // Generate report
  const generateReport = async () => {
    setApiError(null);
    setReportData(null);
    if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report") {
      await fetchAttendanceReport();
    } else if (formData.reportType === "teacher_class_counts") {
      await fetchTeacherLoad();
    }
  };

  // Convert an image URL to dataURL (used for jsPDF addImage)
  const imageUrlToDataURL = (url) => {
    return fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  };

  // Export helpers (PDF + Excel + JSON)
  const exportReport = async (format = "json") => {
    if (!reportData) {
      alert("Generate a report first.");
      return;
    }

    // JSON
    if (format === "json") {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${formData.reportType}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Excel
    if (format === "excel") {
      const workbook = XLSX.utils.book_new();

      // Student attendance sheet
      if (formData.reportType === "student_attendance") {
        const rows = [];
        const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});
        const headerWithSubjects = ["#", "Student", ...allSubjects, "Attended Classes", "Attendance %"];
        rows.push(headerWithSubjects);

        (reportData.students || []).forEach((st, idx) => {
          const subjVals = allSubjects.map((code) => (st.attended && st.attended[code] !== undefined ? st.attended[code] : ""));
          rows.push([idx + 1, st.name || st.student_name || st.full_name || "-", ...subjVals, st.attended_classes ?? 0, st.attendance_percent ?? ""]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, ws, "Student Attendance");
      }

      // Teacher class counts sheet
      if (formData.reportType === "teacher_class_counts") {
        const rows = [];
        rows.push(["#", "Teacher", "Cohort", "Classroom", "Subject", "Total Classes"]);
        (reportData.teacherClassCounts || reportData.assignments || []).forEach((r, idx) => {
          const subjVal = r.subject_code || r.subject || r.subject_name || "";
          rows.push([idx + 1, r.teacher || r.teacher_name || "-", r.cohort || "-", r.classroom || "-", subjVal, r.total_classes_taken || r.total_classes || 0]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, ws, "Teacher Class Counts");
      }

      XLSX.writeFile(workbook, `report-${formData.reportType}-${Date.now()}.xlsx`);
      return;
    }

    // PDF
    if (format === "pdf") {
      try {
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        // Add logo (converted to dataURL)
        let logoDataUrl = null;
        try {
          logoDataUrl = await imageUrlToDataURL(Logo);
        } catch (err) {
          console.warn("Logo conversion failed, continuing without logo.", err);
        }

        // Header: title center and logo on right
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");

        // Title lines
        let titleLines = [];
        if (formData.reportType === "teacher_class_counts") {
          const from = formData.fromDate ? new Date(formData.fromDate) : null;
          const monthText = from ? from.toLocaleString(undefined, { month: "long", year: "numeric" }) : "";
          titleLines.push("TEACHER CLASS COUNT REPORT");
          if (monthText) titleLines.push(`Month: ${monthText}`);
        } else {
          const t = `${reportData?.cohort_name || ""} ${reportData?.batch_name ? "- " + reportData.batch_name : ""} ATTENDANCE REPORT`;
          titleLines.push(t);
        }

        // center and draw title lines
        const headerY = 40;
        titleLines.forEach((line, idx) => {
          const textWidth = doc.getTextWidth(line);
          const titleX = (pageWidth - textWidth) / 2;
          doc.text(line, titleX, headerY + idx * 18);
        });

        // Logo on right
        if (logoDataUrl) {
          const logoW = 60;
          const logoH = 60;
          doc.addImage(logoDataUrl, "JPEG", pageWidth - logoW - 40, headerY - 8, logoW, logoH);
        }

        // build table body
        let columns = [];
        let rows = [];

        if (formData.reportType === "student_attendance") {
          const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});
          columns = ["#", "Student", ...allSubjects, "Attended", "%", "Status"];

          (reportData.students || []).forEach((st, idx) => {
            const subjVals = allSubjects.map((code) => st.attended?.[code] ?? 0);
            const percent = st.attendance_percent ?? 0;
            const low = percent < LOW_ATTENDANCE_THRESHOLD;
            rows.push([
              idx + 1,
              st.name || st.student_name || st.full_name || "-",
              ...subjVals,
              st.attended_classes ?? 0,
              `${percent}%`,
              low ? "Low" : "OK",
            ]);
          });
        }

        if (formData.reportType === "teacher_class_counts") {
          columns = ["#", "Teacher", "Cohort", "Classroom", "Subject", "Total Classes"];
          (reportData.teacherClassCounts || reportData.assignments || []).forEach((r, idx) => {
            const subjVal = r.subject_code || r.subject || r.subject_name || "-";
            rows.push([idx + 1, r.teacher || r.teacher_name || "-", r.cohort || "-", r.classroom || "-", subjVal, r.total_classes_taken || r.total_classes || 0]);
          });
        }

        // Draw table below header
        autoTable(doc, {
          startY: 100,
          head: [columns],
          body: rows,
          styles: {
            fontSize: 10,
            cellPadding: 6,
          },
          headStyles: { fillColor: [16, 185, 129] },
          theme: "grid",
          margin: { left: 40, right: 40 },
          didDrawPage: function (data) {
            const page = doc.internal.getNumberOfPages();
            doc.setFontSize(9);
            doc.setTextColor(120);
            const footerText = `Generated on ${new Date().toLocaleString()}`;
            const footerX = 40;
            const footerY = doc.internal.pageSize.getHeight() - 30;
            doc.text(footerText, footerX, footerY);

            const pageLabel = `Page ${page}`;
            const pageLabelWidth = doc.getTextWidth(pageLabel);
            doc.text(pageLabel, doc.internal.pageSize.getWidth() - pageLabelWidth - 40, footerY);
          },
        });

        doc.save(`report-${formData.reportType}-${Date.now()}.pdf`);
      } catch (err) {
        console.error("PDF export failed:", err);
        alert("Failed to generate PDF.");
      }
      return;
    }

    alert(`Unsupported export format: ${format}`);
  };

  // Ticket modal actions
  const openCloseTicketModal = (student) => {
    setSelectedStudent(student);
    setCloseReason("");
    setIsModalOpen(true);
  };

  const confirmCloseTicket = () => {
    if (!closeReason.trim()) return;
    const sid = selectedStudent?.student_id ?? selectedStudent?.id ?? selectedStudent?.studentId;
    if (!sid) return;
    setActionStatuses((prev) => ({ ...prev, [sid]: { status: "Closed - Action Taken", reason: closeReason.trim() } }));
    setIsModalOpen(false);
  };

  // Helpers for UI derived data & filters
  const isReadyForExport = useMemo(() => {
    if (!reportData) return false;
    if (formData.reportType === "student_attendance" || formData.reportType === "absentees_report")
      return (reportData.students || []).length > 0;
    if (formData.reportType === "teacher_class_counts")
      return (reportData.assignments || reportData.teacherClassCounts || []).length > 0;
    if (formData.reportType === "teacher_performance") return !!reportData.teacher;
    return false;
  }, [reportData, formData.reportType]);

  // UI render
  return (
    <div className="min-h-screen p-4 bg-gray-50 font-sans">
      <PrintCSS />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* screen header */}
          <div className="p-6 bg-emerald-600 text-white flex items-start gap-4 no-print">
            <ClipboardList className="w-8 h-8 text-emerald-200" />
            <div>
              <h1 className="text-2xl font-extrabold">Performance & Absentees Report System</h1>
              <p className="text-sm opacity-90 mt-1">Cohort → Batch based attendance & teacher reports (coordinator view).</p>
            </div>
          </div>


          {/* Filters */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" /> Report Configuration
            </h3>

            <div className="card mb-2">
              <div className="card-content form-grid">
                {/* Report Type */}
                <div className="form-group">
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1" /> Report Type
                  </label>
                  <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    className="form-select"
                  >
                    <option value="student_attendance">STUDENT ATTENDANCE</option>
                    <option value="teacher_class_counts">TEACHER CLASS COUNTS</option>
                  </select>
                </div>

                {/* Cohort */}
                {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
                  <div className="form-group">
                    <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                      <Layers className="w-3 h-3 mr-1" /> Cohort
                    </label>
                    <select
                      name="cohort"
                      value={formData.cohort}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cohort: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">-- Select Cohort --</option>
                      {cohorts.map((c) => (
                        <option key={c.cohort_number} value={c.cohort_number}>
                          {safeDisplay(c.cohort_name || c.cohort_number)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Batch */}
                {(formData.reportType === "student_attendance" || formData.reportType === "absentees_report") && (
                  <div className="form-group">
                    <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                      <Users className="w-3 h-3 mr-1" /> Batch
                    </label>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={(e) => setFormData((prev) => ({ ...prev, batch: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">-- Select Batch --</option>
                      {filteredBatches.map((b) => (
                        <option key={b.batch_id} value={b.batch_id}>
                          {safeDisplay(b.batch_name || b.batch_id)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* From Date */}
                <div className="form-group">
                  <DateInput
                    name="fromDate"
                    label="From Date"
                    value={formData.fromDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>

                {/* To Date */}
                <div className="form-group">
                  <DateInput
                    name="toDate"
                    label="To Date"
                    value={formData.toDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>

                {/* Format */}
                <div className="form-group">
                  <label className="text-xs font-medium text-gray-600 mb-1">Format</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="form-select"
                    disabled={!isReadyForExport}
                  >
                    <option value="">-- Select Format --</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                {/* Generate Button */}
                <div className="form-group mt-2">
                  <button
                    onClick={generateReport}
                    disabled={reportLoading}
                    className={`btn btn-primary w-full ${reportLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {reportLoading ? <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" /> : null}
                    Generate
                  </button>
                </div>

                {/* Export Button */}
                <div className="form-group mt-2">
                  <button
                    onClick={() => {
                      if (!selectedFormat) return alert("Please select a format first");
                      exportReport(selectedFormat);
                    }}
                    disabled={!isReadyForExport}
                    className={`btn w-full ${isReadyForExport ? "btn-secondary" : "bg-gray-300 cursor-not-allowed text-gray-600"}`}
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>

            {apiError && <div className="mt-3 text-sm text-red-600">{apiError}</div>}
            {metaLoading && <div className="mt-3 text-sm text-gray-500">Loading cohorts/batches...</div>}
          </div>

          

          {/* Report area */}
          <div className="p-6 min-h-[420px] print-body">
            {reportLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
              </div>
            )}

            {!reportLoading && !reportData && (
              <div className="text-center py-20 text-gray-500">
                <p className="font-semibold">No report loaded yet.</p>
                <p className="text-sm">Choose filters and click Generate.</p>
              </div>
            )}

            {!reportLoading && reportData && (
              <>
                {formData.reportType === "student_attendance" && (
                  <StudentReportView
                    reportData={reportData}
                    openCloseTicketModal={openCloseTicketModal}
                    actionStatuses={actionStatuses}
                    setActionStatuses={setActionStatuses}
                    fromDate={formData.fromDate}
                    toDate={formData.toDate}
                    batch={formData.batch}
                  />
                )}

                {formData.reportType === "teacher_class_counts" && (
                  <TeacherClassCountsView reportData={reportData} fromDate={formData.fromDate} toDate={formData.toDate} />
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-gray-100 text-xs text-gray-600 text-right border-t border-gray-200 no-print">
            Low attendance threshold is {LOW_ATTENDANCE_THRESHOLD}%.
          </div>

          <div className="print-footer" aria-hidden="true"></div>
        </div>
      </div>

      {/* Close Ticket Modal */}
      <CloseTicketModal
        isOpen={isModalOpen}
        student={selectedStudent}
        reason={closeReason}
        setReason={setCloseReason}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmCloseTicket}
      />
    </div>
  );
}
