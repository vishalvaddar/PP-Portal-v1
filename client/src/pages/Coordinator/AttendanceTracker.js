// // // AttendanceManagement.jsx
// // import React, { useState, useEffect, useMemo } from "react";
// // import axios from "axios";
// // import Papa from "papaparse";
// // import "./global.css";
// // import { useAuth } from "../../contexts/AuthContext";

// // /**
// //  * AttendanceManagement (final)
// //  *
// //  * - CSV preview & client-side parse (keeps PapaParse)
// //  * - Robust time parsing & percent calculation
// //  * - Shows matched preview rows + unmatched names + absentees
// //  * - Commit sends preview + absentees + meta to backend (/attendance/csv/commit)
// //  * - Undo calls /attendance/csv/undo
// //  * - Keeps manual attendance features
// //  */

// // const AttendanceManagement = () => {
// //   const today = new Date().toISOString().split("T")[0];

// //   const initialFormData = {
// //     cohort: "",
// //     batch: "",
// //     classroom: "",
// //     date: today,
// //     startTime: "00:00",
// //     endTime: "00:00",
// //     search: "",
// //   };

// //   const [formData, setFormData] = useState(initialFormData);
// //   const [activeTab, setActiveTab] = useState("manual"); // manual | bulk
// //   const [cohorts, setCohorts] = useState([]);
// //   const [batches, setBatches] = useState([]);
// //   const [filteredBatches, setFilteredBatches] = useState([]);
// //   const [classrooms, setClassrooms] = useState([]);
// //   const [students, setStudents] = useState([]);
// //   const [attendance, setAttendance] = useState({}); // studentId -> status
// //   const [initialAttendance, setInitialAttendance] = useState({});
// //   const [loading, setLoading] = useState(false);
// //   const [freeze, setFreeze] = useState(false);
// //   const [csvPreview, setCsvPreview] = useState(null); // array of preview rows (matched + unmatched flagged)
// //   const [csvFile, setCsvFile] = useState(null);
// //   const [unmatchedNames, setUnmatchedNames] = useState([]); // names that couldn't be matched to students
// //   const [absentees, setAbsentees] = useState([]); // computed absentees for batch/classroom
// //   const [attendanceExists, setAttendanceExists] = useState(false); // show Update vs Submit
// //   const [lastCommitExists, setLastCommitExists] = useState(false); // to show Undo button

// //   const auth = useAuth();
// //   const token = auth?.user?.token;

// //   const axiosConfig = () => ({
// //     headers: { Authorization: `Bearer ${token}` },
// //   });

// //   // ---------------------------- Small helpers ----------------------------
// //   // Try to parse time string into minutes since midnight
// //   const normalizeTimeString = (s) => {
// //     if (!s) return null;
// //     // remove stray characters except digits, colon, AM/PM letters and space
// //     let t = s.toString().replace(/\?/g, "").replace(/[^\d:apmAPM\s]/g, "").trim();
// //     // If looks like HH:MM or H:MM
// //     const hhmm = t.match(/(\d{1,2}:\d{2})/);
// //     const ampm = t.match(/(AM|PM|am|pm)/);
// //     if (hhmm) {
// //       let [h, m] = hhmm[1].split(":").map((x) => parseInt(x, 10));
// //       if (ampm) {
// //         const a = ampm[0].toUpperCase();
// //         if (a === "PM" && h !== 12) h += 12;
// //         if (a === "AM" && h === 12) h = 0;
// //       }
// //       if (h >= 0 && h < 24 && m >= 0 && m < 60) {
// //         return h * 60 + m;
// //       }
// //     }
// //     // fallback: try parse as "HHMM" digits
// //     const digits = t.match(/(\d{3,4})/);
// //     if (digits) {
// //       const d = digits[1];
// //       let h = parseInt(d.slice(0, d.length - 2), 10);
// //       let m = parseInt(d.slice(-2), 10);
// //       if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
// //     }
// //     return null;
// //   };

// //   const minutesDiff = (aMin, bMin) => {
// //     if (aMin === null || bMin === null) return 0;
// //     return Math.max(0, bMin - aMin);
// //   };

// //   const computeStatusFromPercent = (pct) => {
// //     if (pct === null || isNaN(pct)) return "ABSENT";
// //     if (pct >= 75) return "PRESENT";
// //     if (pct >= 40) return "LATE JOINED";
// //     return "ABSENT";
// //   };

// //   // Normalize backend status for UI badges
// //   const normalizeStatusForFrontend = (s) => {
// //     if (!s) return "ABSENT";
// //     const t = s.toString().toUpperCase();
// //     if (t.includes("PRES")) return "PRESENT";
// //     if (t.includes("LATE")) return "LATE JOINED";
// //     if (t.includes("ABS")) return "ABSENT";
// //     return s;
// //   };

// //   // Status color helper
// //   const getStatusColor = (status) => {
// //     if (!status) return "badge-info";
// //     const t = status.toString().toUpperCase();
// //     if (t.includes("PRES")) return "badge-success";
// //     if (t.includes("ABS")) return "badge-danger";
// //     if (t.includes("LATE")) return "badge-warning";
// //     if (t.includes("LEAVE")) return "badge-info";
// //     return "badge-info";
// //   };

// //   // ---------------------------- Event handlers ----------------------------
// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData((prev) => ({ ...prev, [name]: value }));

// //     if (name === "cohort") {
// //       const filtered = batches.filter((b) => b.cohort_number?.toString() === value.toString());
// //       setFilteredBatches(filtered);
// //       setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
// //       setStudents([]);
// //       setAttendance({});
// //       setInitialAttendance({});
// //       setFreeze(false);
// //       setAttendanceExists(false);
// //     }

// //     if (name === "batch" && value) {
// //       axios
// //         .get(`http://localhost:5000/api/coordinator/classrooms/${value}`, axiosConfig())
// //         .then(({ data }) => setClassrooms(data || []))
// //         .catch((err) => {
// //           console.error("Error fetching classrooms:", err);
// //           setClassrooms([]);
// //         });
// //       setFormData((prev) => ({ ...prev, classroom: "" }));
// //       setStudents([]);
// //       setAttendance({});
// //       setInitialAttendance({});
// //       setFreeze(false);
// //       setAttendanceExists(false);
// //     }

// //     if (["classroom", "date", "startTime", "endTime"].includes(name)) {
// //       setCsvPreview(null);
// //       setCsvFile(null);
// //       setUnmatchedNames([]);
// //       setAbsentees([]);
// //     }
// //   };

// //   const handleReset = () => {
// //     setFormData(initialFormData);
// //     setFilteredBatches([]);
// //     setClassrooms([]);
// //     setStudents([]);
// //     setAttendance({});
// //     setInitialAttendance({});
// //     setFreeze(false);
// //     setCsvPreview(null);
// //     setCsvFile(null);
// //     setUnmatchedNames([]);
// //     setAbsentees([]);
// //     setAttendanceExists(false);
// //     setLastCommitExists(false);
// //   };

// //   // ---------------------------- Fetch initial data ----------------------------
// //   useEffect(() => {
// //     if (!token) return;
// //     axios
// //       .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
// //       .then(({ data }) => setCohorts(data || []))
// //       .catch((err) => console.error("Error fetching cohorts:", err));
// //   }, [token]);

// //   useEffect(() => {
// //     if (!token || !formData.cohort) {
// //       setBatches([]);
// //       setFilteredBatches([]);
// //       return;
// //     }
// //     axios
// //       .get(`http://localhost:5000/api/coordinator/batches?cohort_number=${formData.cohort}`, axiosConfig())
// //       .then(({ data }) => {
// //         setBatches(data || []);
// //         setFilteredBatches(data || []);
// //         setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
// //         setStudents([]);
// //         setAttendance({});
// //         setInitialAttendance({});
// //         setFreeze(false);
// //         setAttendanceExists(false);
// //       })
// //       .catch((err) => {
// //         console.error("Error fetching batches:", err);
// //         setBatches([]);
// //         setFilteredBatches([]);
// //       });
// //   }, [token, formData.cohort]);

// //   useEffect(() => {
// //     if (!token) return;
// //     if (!formData.batch || !formData.cohort) return;
// //     setLoading(true);
// //     axios
// //       .get(`http://localhost:5000/api/coordinator/students`, {
// //         ...axiosConfig(),
// //         params: { cohortNumber: formData.cohort, batchId: formData.batch },
// //       })
// //       .then(({ data }) => {
// //         setStudents(data || []);
// //       })
// //       .catch((err) => {
// //         console.error("Error fetching students:", err);
// //         setStudents([]);
// //       })
// //       .finally(() => setLoading(false));
// //   }, [token, formData.batch, formData.cohort]);

// //   // Fetch existing attendance for date
// //   useEffect(() => {
// //     if (!token) return;
// //     if (!formData.batch || !formData.date) return;

// //     const fetchAttendance = async () => {
// //       setLoading(true);
// //       try {
// //         const params = {
// //           cohortNumber: formData.cohort || null,
// //           batchId: formData.batch || null,
// //           classroomId: formData.classroom || null,
// //           date: formData.date || null,
// //         };
// //         if (formData.startTime && formData.startTime !== "00:00") params.startTime = formData.startTime;
// //         if (formData.endTime && formData.endTime !== "00:00") params.endTime = formData.endTime;

// //         const { data } = await axios.get("http://localhost:5000/api/coordinator/attendance", {
// //           ...axiosConfig(),
// //           params,
// //         });

// //         const dbMap = {};
// //         (data || []).forEach((r) => {
// //           dbMap[r.student_id] = r.status;
// //         });

// //         const map = {};
// //         (students || []).forEach((s) => {
// //           map[s.student_id] = dbMap[s.student_id] || null;
// //         });

// //         setAttendance(map);
// //         setInitialAttendance(map);
// //         const existsFlag = Object.values(dbMap).length > 0;
// //         setAttendanceExists(existsFlag);

// //         const diffDays = (new Date() - new Date(formData.date)) / (1000 * 60 * 60 * 24);
// //         setFreeze(diffDays > 7);
// //       } catch (err) {
// //         console.error("Error fetching attendance", err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchAttendance();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [token, formData.batch, formData.date, formData.classroom, students]); // students included to recalc map when list available

// //   // ---------------------------- Manual attendance handlers ----------------------------
// //   const handleStatusChange = (studentId, status) => {
// //     if (freeze) return;
// //     setAttendance((prev) => ({ ...prev, [studentId]: status }));
// //   };

// //   const handleBulkAttendance = (status) => {
// //     if (freeze) return;
// //     const map = {};
// //     students.forEach((s) => (map[s.student_id] = status));
// //     setAttendance(map);
// //   };

// //   // helper: check overlap via backend
// //   const checkOverlap = async () => {
// //     if (!formData.classroom || !formData.date || !formData.startTime || !formData.endTime) return { ok: true };
// //     try {
// //       const resp = await axios.get("http://localhost:5000/api/coordinator/attendance/check-overlap", {
// //         ...axiosConfig(),
// //         params: {
// //           classroomId: formData.classroom,
// //           date: formData.date,
// //           startTime: formData.startTime,
// //           endTime: formData.endTime,
// //         },
// //       });
// //       return resp.data;
// //     } catch (err) {
// //       console.error("Error checking overlap:", err);
// //       return { ok: false, error: err };
// //     }
// //   };

// //   // compute changed rows only
// //   const computeChangedRecords = () => {
// //     const changed = [];
// //     (students || []).forEach((s) => {
// //       const before = initialAttendance[s.student_id] ?? null;
// //       const after = attendance[s.student_id] ?? null;
// //       if (before === after) return;
// //       if (!before && !after) return;
// //       if (after === null) return;
// //       changed.push({
// //         student_id: s.student_id,
// //         classroom_id: parseInt(formData.classroom),
// //         date: formData.date,
// //         start_time: formData.startTime,
// //         end_time: formData.endTime,
// //         status: after,
// //         remarks: "",
// //       });
// //     });
// //     return changed;
// //   };

// //   const handleSubmitAttendance = async () => {
// //     if (freeze) {
// //       alert("Attendance is frozen for this date (older than allowed).");
// //       return;
// //     }
// //     if (!formData.classroom) {
// //       alert("Please select a classroom.");
// //       return;
// //     }
// //     const overlapResp = await checkOverlap();
// //     if (overlapResp?.overlap) {
// //       const msg = "Time overlap detected with existing class session. Please adjust time or classroom.";
// //       alert(msg);
// //       console.warn("Overlap conflicts:", overlapResp.conflicts);
// //       return;
// //     }

// //     const changed = computeChangedRecords();
// //     if (changed.length === 0) {
// //       alert("No changes detected to submit.");
// //       return;
// //     }

// //     try {
// //       setLoading(true);
// //       const payload = { attendanceRecords: changed };
// //       await axios.post("http://localhost:5000/api/coordinator/attendance/bulk", payload, axiosConfig());
// //       alert("Attendance saved successfully!");
// //       setInitialAttendance((prev) => {
// //         const updated = { ...prev };
// //         changed.forEach((r) => {
// //           updated[r.student_id] = r.status;
// //         });
// //         return updated;
// //       });
// //       setAttendanceExists(true);
// //       setFreeze(true);
// //     } catch (err) {
// //       console.error("Error saving attendance", err);
// //       alert("Error saving attendance");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // ---------------------------- CSV Upload handling (Preview -> Commit) ----------------------------
// //   // Client-side validation of CSV structure
// //   const validateCSVStructureClient = (fileText) => {
// //     const parsed = Papa.parse(fileText, { preview: 3, skipEmptyLines: true });
// //     if (!parsed || !parsed.data || parsed.data.length < 2) {
// //       return { ok: false, error: "CSV must contain header row and at least one data row." };
// //     }
// //     const headerRow = parsed.data[0];
// //     const headers = headerRow.map((h) => (h || "").toString().trim().toUpperCase());
// //     const requiredHeaders = ["STUDENT NAME", "TIME JOINED", "TIME EXITED"];
// //     const hasRequired = requiredHeaders.every((h) => headers.includes(h));
// //     if (!hasRequired) {
// //       return { ok: false, error: `CSV headers must include: ${requiredHeaders.join(", ")}` };
// //     }
// //     return { ok: true };
// //   };

// //   // Parse CSV on client and create preview
// //   const handleCSVUpload = (e) => {
// //     if (!formData.batch || !formData.classroom || freeze) {
// //       alert("Select batch & classroom and ensure attendance is not frozen.");
// //       return;
// //     }
// //     const file = e.target.files[0];
// //     if (!file) return;
// //     setCsvFile(file);

// //     const reader = new FileReader();
// //     reader.onload = async (ev) => {
// //       const text = ev.target.result;
// //       const clientValidation = validateCSVStructureClient(text);
// //       if (!clientValidation.ok) {
// //         alert("Invalid CSV format: " + clientValidation.error);
// //         setCsvFile(null);
// //         return;
// //       }

// //       // parse fully (no header since first row is header but we want raw rows)
// //       const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
// //       const rows = parsed.data || [];

// //       if (rows.length < 3) {
// //         alert("CSV must have at least 3 rows: header, class time row, and at least one student row.");
// //         setCsvFile(null);
// //         return;
// //       }

// //       // class start/end from second row (index 1)
// //       const classStartRaw = rows[1][1] ? rows[1][1].toString().trim() : null;
// //       const classEndRaw = rows[1][2] ? rows[1][2].toString().trim() : null;
// //       const classStartMin = normalizeTimeString(classStartRaw);
// //       const classEndMin = normalizeTimeString(classEndRaw);
// //       const classDuration = minutesDiff(classStartMin, classEndMin);
// //       // If class duration is zero or null, warn but continue
// //       if (!classDuration) {
// //         console.warn("Class duration parsed as 0 - check row 2 times:", classStartRaw, classEndRaw);
// //       }

// //       // build preview: iterate from row index 2 onwards
// //       const previewRows = [];
// //       const unmatched = [];
// //       const matchedStudentIds = new Set();

// //       // Prepare map of student names -> student object (lowercase)
// //       const studentNameMap = {};
// //       (students || []).forEach((s) => {
// //         if (s.student_name) studentNameMap[s.student_name.trim().toLowerCase()] = s;
// //       });

// //       for (let i = 2; i < rows.length; i++) {
// //         const row = rows[i];
// //         // Expect: [ STUDENT NAME, TIME JOINED, TIME EXITED ]
// //         const rawName = (row[0] || "").toString().trim();
// //         const rawJoin = row[1] ? row[1].toString().trim() : "";
// //         const rawExit = row[2] ? row[2].toString().trim() : "";

// //         if (!rawName) continue;

// //         const joinMin = normalizeTimeString(rawJoin);
// //         const exitMin = normalizeTimeString(rawExit);

// //         const attendedMins = minutesDiff(joinMin, exitMin);
// //         const percent = classDuration ? Math.round((attendedMins / classDuration) * 10000) / 100 : 0; // 2 decimals

// //         const status = computeStatusFromPercent(percent);

// //         // Try to match student by exact lowercase name first, else fallback simple includes
// //         const lowerName = rawName.toLowerCase();
// //         let studentMatch = studentNameMap[lowerName];

// //         if (!studentMatch) {
// //           // fallback: find first student whose name includes the csv name or vice versa
// //           const fuzzy = (students || []).find((s) =>
// //             s.student_name && (s.student_name.toLowerCase().includes(lowerName) || lowerName.includes(s.student_name.toLowerCase()))
// //           );
// //           if (fuzzy) studentMatch = fuzzy;
// //         }

// //         if (studentMatch) {
// //           previewRows.push({
// //             student_name: studentMatch.student_name,
// //             student_id: studentMatch.student_id,
// //             batch_id: studentMatch.batch_id,
// //             join_time: rawJoin || null,
// //             exit_time: rawExit || null,
// //             attended_mins: attendedMins,
// //             attendance_percent: isNaN(percent) ? 0 : percent,
// //             status,
// //             matched: true,
// //           });
// //           matchedStudentIds.add(studentMatch.student_id);
// //         } else {
// //           // unmatched
// //           previewRows.push({
// //             student_name: rawName,
// //             student_id: null,
// //             batch_id: formData.batch || null,
// //             join_time: rawJoin || null,
// //             exit_time: rawExit || null,
// //             attended_mins: attendedMins,
// //             attendance_percent: isNaN(percent) ? 0 : percent,
// //             status,
// //             matched: false,
// //           });
// //           unmatched.push(rawName);
// //         }
// //       }

// //       // compute absentees — students in the selected batch/classroom who are not in matchedStudentIds
// //       let computedAbsentees = [];
// //       try {
// //         // Use students list filtered for batch (client has fetched students for batch)
// //         const batchStudents = (students || []).filter((s) => parseInt(s.batch_id) === parseInt(formData.batch));
// //         computedAbsentees = batchStudents
// //           .filter((s) => !matchedStudentIds.has(s.student_id))
// //           .map((s) => ({ student_id: s.student_id, student_name: s.student_name, batch_id: s.batch_id }));
// //       } catch (err) {
// //         console.error("Error computing absentees:", err);
// //         computedAbsentees = [];
// //       }

// //       // Set preview, unmatched and absentees in UI
// //       setCsvPreview(previewRows);
// //       setUnmatchedNames(unmatched);
// //       setAbsentees(computedAbsentees);

// //       // Also post file to server preview endpoint (optional) so server can validate; ignore its output for UI
// //       try {
// //         const fd = new FormData();
// //         fd.append("file", file);
// //         fd.append("classroom_id", formData.classroom);
// //         fd.append("batch_id", formData.batch);
// //         fd.append("date", formData.date);
// //         fd.append("teacherStartTime", formData.startTime);
// //         fd.append("teacherEndTime", formData.endTime);
// //         // fire and forget - server preview might perform additional checks
// //         axios.post("http://localhost:5000/api/coordinator/attendance/csv/preview", fd, {
// //           headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
// //         }).catch(e => {
// //           // don't fail preview if server preview fails
// //           console.warn("Server preview failed (non-fatal):", e?.message || e);
// //         });
// //       } catch (err) {
// //         // ignore
// //       }
// //     };

// //     reader.readAsText(file);
// //   };

// //   // Apply matched rows from preview to manual attendance map
// //   const handleApplyCsvPreviewToAttendance = () => {
// //     if (!csvPreview) {
// //       alert("Please upload a CSV for preview first.");
// //       return;
// //     }
// //     const updated = { ...attendance };
// //     csvPreview.forEach((r) => {
// //       if (r.matched && r.student_id) {
// //         updated[r.student_id] = normalizeStatusForFrontend(r.status);
// //       }
// //     });
// //     setAttendance(updated);
// //     alert("CSV preview applied to current attendance (only for matched students). Review and commit if ok.");
// //   };

// //   // Commit CSV upload after preview: send previewRows + absentees + meta to server
// //   const handleCommitCsvUpload = async () => {
// //     if (!csvFile) {
// //       alert("No CSV file selected.");
// //       return;
// //     }
// //     if (!csvPreview || csvPreview.length === 0) {
// //       alert("Please preview the CSV first.");
// //       return;
// //     }

// //     const overlapResp = await checkOverlap();
// //     if (overlapResp?.overlap) {
// //       alert("Time overlap detected. Fix class time before uploading CSV.");
// //       return;
// //     }

// //     try {
// //       setLoading(true);
// //       // Build payload: only matched rows with student_id are inserted as their computed status
// //       const previewDataToSend = csvPreview
// //         .filter((r) => r.matched && r.student_id)
// //         .map((r) => ({
// //           student_id: r.student_id,
// //           batch_id: r.batch_id || formData.batch,
// //           classroom_id: formData.classroom,
// //           attendance_date: formData.date,
// //           start_time: formData.join_time || formData.startTime,
// //           end_time: formData.exit_time || formData.endTime,
// //           status: r.status,
// //           attended_mins: r.attended_mins,
// //           attendance_percent: r.attendance_percent,
// //         }));

// //       // absentees to mark as ABSENT
// //       const absenteesToSend = (absentees || []).map((a) => ({
// //         student_id: a.student_id,
// //         batch_id: a.batch_id || formData.batch,
// //         classroom_id: formData.classroom,
// //         attendance_date: formData.date,
// //         start_time: formData.startTime,
// //         end_time: formData.endTime,
// //         status: "ABSENT",
// //       }));

// //       const payload = {
// //         previewData: previewDataToSend,
// //         absentees: absenteesToSend,
// //         unmatchedNames: unmatchedNames || [],
// //         attendanceDate: formData.date,
// //         batch_id: formData.batch,
// //         classroom_id: formData.classroom,
// //         start_time: formData.startTime,
// //         end_time: formData.endTime,
// //       };

// //       const resp = await axios.post("http://localhost:5000/api/coordinator/attendance/csv/commit", payload, axiosConfig());

// //       if (resp.data?.insertedCount || resp.data?.message) {
// //         alert("CSV attendance uploaded successfully!");
// //         // refresh attendance
// //         await refetchAttendance();
// //         setCsvFile(null);
// //         setCsvPreview(null);
// //         setUnmatchedNames([]);
// //         setAbsentees([]);
// //         setAttendanceExists(true);
// //         setFreeze(true);
// //         setLastCommitExists(true);
// //       } else {
// //         alert("CSV commit did not return expected response. Check server logs.");
// //       }
// //     } catch (err) {
// //       console.error("Error uploading CSV:", err);
// //       alert("Error uploading CSV. Check server logs.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Undo last commit for this batch/date
// //   const handleUndoLastCommit = async () => {
// //     if (!formData.batch) return alert("Select a batch to undo.");
// //     if (!window.confirm("Undo last commit for this batch & date? This will delete attendance records inserted by the last commit.")) return;

// //     try {
// //       setLoading(true);
// //       const resp = await axios.post(
// //         "http://localhost:5000/api/coordinator/attendance/csv/undo",
// //         { batch_id: formData.batch, date: formData.date, classroom_id: formData.classroom },
// //         axiosConfig()
// //       );
// //       if (resp.data?.deleted || resp.data?.message) {
// //         alert("Undo successful.");
// //         // refresh attendance
// //         await refetchAttendance();
// //         setLastCommitExists(false);
// //         setAttendanceExists(false);
// //         setFreeze(false);
// //       } else {
// //         alert("Undo may have failed — check server logs.");
// //       }
// //     } catch (err) {
// //       console.error("Error undoing last commit:", err);
// //       alert("Error undoing last commit. Check server logs.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // refetch attendance (helper)
// //   const refetchAttendance = async () => {
// //     if (!token || !formData.batch || !formData.date) return;
// //     setLoading(true);
// //     try {
// //       const params = {
// //         cohortNumber: formData.cohort || null,
// //         batchId: formData.batch || null,
// //         classroomId: formData.classroom || null,
// //         date: formData.date || null,
// //       };
// //       if (formData.startTime && formData.startTime !== "00:00") params.startTime = formData.startTime;
// //       if (formData.endTime && formData.endTime !== "00:00") params.endTime = formData.endTime;

// //       const { data } = await axios.get("http://localhost:5000/api/coordinator/attendance", {
// //         ...axiosConfig(),
// //         params,
// //       });

// //       const dbMap = {};
// //       (data || []).forEach((r) => {
// //         dbMap[r.student_id] = r.status;
// //       });

// //       const map = {};
// //       (students || []).forEach((s) => {
// //         map[s.student_id] = dbMap[s.student_id] || null;
// //       });

// //       setAttendance(map);
// //       setInitialAttendance(map);
// //     } catch (err) {
// //       console.error("Error refetching attendance:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Download reference CSV template for classroom
// //   const downloadReference = () => {
// //     if (!formData.classroom) {
// //       alert("Select a classroom to download reference CSV");
// //       return;
// //     }
// //     const url = `http://localhost:5000/api/coordinator/attendance/csv/reference`;
// //     window.open(url, "_blank");
// //   };

// //   // ---------------------------- Derived lists ----------------------------
// //   const filteredStudents = useMemo(
// //     () =>
// //       (students || []).filter(
// //         (s) =>
// //           s.student_name?.toLowerCase().includes(formData.search.toLowerCase()) ||
// //           (s.enr_id && s.enr_id.toString().includes(formData.search))
// //       ),
// //     [students, formData.search]
// //   );

// //   // ---------------------------- Render ----------------------------
// //   return (
// //     <div>
// //       <div className="page-header">
// //         <h1 className="page-title">Attendance Management</h1>
// //         <p className="page-subtitle">Mark and manage student attendance</p>
// //       </div>

// //       {/* Tabs */}
// //      <div
// //        className="tabs mt-4 mb-6 flex justify-start"
// //        style={{ gap: "12px" }} // ✅ inline gap (won’t be overridden)
// //      >
// //        <button
// //          className={`btn btn-primary ${
// //            activeTab === "manual" ? "active" : ""
// //          }`}
// //          onClick={() => setActiveTab("manual")}
// //        >
// //          Manual Attendance
// //        </button>
     
// //        <button
// //          className={`btn btn-primary ${
// //            activeTab === "bulk" ? "active" : ""
// //          }`}
// //          onClick={() => setActiveTab("bulk")}
// //        >
// //          Bulk Upload Attendance
// //        </button>
// //      </div>


// //       {/* Common Filters */}
// //       <div className="card mb-6">
// //         <div className="card-content form-grid">
// //           {/* Cohort */}
// //           <div className="form-group">
// //             <label>Cohort</label>
// //             <select name="cohort" value={formData.cohort} onChange={handleChange} className="form-select">
// //               <option value="">Select Cohort</option>
// //               {cohorts.map((c) => (
// //                 <option key={c.cohort_number} value={c.cohort_number}>
// //                   {c.cohort_name}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           {/* Batch */}
// //           <div className="form-group">
// //             <label>Batch</label>
// //             <select name="batch" value={formData.batch} onChange={handleChange} className="form-select" disabled={!formData.cohort}>
// //               <option value="">Select Batch</option>
// //               {filteredBatches.map((b) => (
// //                 <option key={b.batch_id} value={b.batch_id}>
// //                   {b.batch_name}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           {/* Classroom */}
// //           <div className="form-group">
// //             <label>Classroom</label>
// //             <select name="classroom" value={formData.classroom} onChange={handleChange} className="form-select" disabled={!formData.batch}>
// //               <option value="">Select Classroom</option>
// //               {(classrooms || []).map((c) => (
// //                 <option key={c.classroom_id} value={c.classroom_id}>
// //                   {c.classroom_name}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>


// //           {/* Date */}
// //           <div className="form-group">
// //             <label>Date</label>
// //             <input
// //               type="date"
// //               name="date"
// //               value={formData.date}
// //               onChange={handleChange}
// //               className="form-input"
// //               min={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // day before yesterday
// //               max={new Date().toISOString().split("T")[0]} // today
// //             />
// //           </div>
          

// //           {/* Start Time */}
// //           <div className="form-group">
// //             <label>Start Time</label>
// //             <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="form-input" />
// //           </div>

// //           {/* End Time */}
// //           <div className="form-group">
// //             <label>End Time</label>
// //             <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="form-input" />
// //           </div>

// //           {/* Search (manual only) */}
// //           {activeTab === "manual" && (
// //             <div className="form-group">
// //               <label>Search Student</label>
// //               <input type="text" name="search" placeholder="Search by name or ID..." value={formData.search} onChange={handleChange} className="form-input" />
// //             </div>
// //           )}
// //           {activeTab == "bulk" && (
// //           <div className="form-group">
// //             <label>Upload CSV</label>
// //             <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={freeze || !formData.classroom} className="form-input" />
// //           </div>
// //           )}

// //           </div>

// //           {/* CSV Upload (bulk only) */}
// //           {activeTab === "bulk" && (
// //             <>

// //               <div className="form-group">
// //                 <label>Actions</label>
// //                 <div style={{ display: "flex", gap: "0.5rem" }}>
// //                   <button onClick={downloadReference} className="btn btn-secondary">
// //                     Download Template
// //                   </button>
// //                   <button
// //                     onClick={() => {
// //                       if (csvPreview) handleCommitCsvUpload();
// //                       else alert("Please upload a CSV and preview before committing.");
// //                     }}
// //                     className="btn btn-primary"
// //                     disabled={!csvFile || freeze}
// //                   >
// //                     Commit CSV Upload
// //                   </button>
// //                   <button onClick={handleApplyCsvPreviewToAttendance} className="btn btn-info" disabled={!csvPreview || freeze}>
// //                     Apply CSV Preview to Attendance
// //                   </button>
// //                   <button onClick={handleUndoLastCommit} className="btn btn-warning" disabled={!lastCommitExists}>
// //                     Undo Last Commit
// //                   </button>
// //                 </div>
// //               </div>
// //             </>
// //           )}
        

// //         {/* Manual Actions */}
// //         {activeTab === "manual" && (
// //           <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
// //             <button onClick={() => handleBulkAttendance("PRESENT")} className="btn btn-success" disabled={!formData.classroom || freeze}>
// //               ✓ Mark All Present
// //             </button>
// //             <button onClick={() => handleBulkAttendance("ABSENT")} className="btn btn-danger" disabled={!formData.classroom || freeze}>
// //               ✗ Mark All Absent
// //             </button>
// //             <button onClick={handleReset} className="btn btn-secondary">
// //               Reset
// //             </button>
// //             <button onClick={handleSubmitAttendance} className="btn btn-primary" disabled={freeze || !formData.classroom}>
// //               {attendanceExists ? "Update Attendance" : "Submit Attendance"}
// //             </button>
// //           </div>
// //         )}
// //       </div>

// //       {/* CSV Preview section */}
// //       {activeTab === "bulk" && csvPreview && (
// //         <div className="card mb-6">
// //           <div className="card-header">
// //             <h3>CSV Preview ({csvPreview.length} rows)</h3>
// //           </div>
// //           <div className="card-content">
// //             <table className="table">
// //               <thead>
// //                 <tr>
// //                   <th>Student Name</th>
// //                   <th>Student ID</th>
// //                   <th>Time Joined</th>
// //                   <th>Time Exited</th>
// //                   <th>Minutes</th>
// //                   <th>Attendance %</th>
// //                   <th>Computed Status</th>
// //                   <th>Matched?</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {csvPreview.map((r, idx) => (
// //                   <tr key={idx}>
// //                     <td>{r.student_name}</td>
// //                     <td>{r.student_id || "-"}</td>
// //                     <td>{r.join_time || "-"}</td>
// //                     <td>{r.exit_time || "-"}</td>
// //                     <td>{r.attended_mins ?? "-"}</td>
// //                     <td>{r.attendance_percent ?? "-"}</td>
// //                     <td>
// //                       <span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span>
// //                     </td>
// //                     <td>{r.matched ? "YES" : "NO"}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>

// //             <div style={{ marginTop: 8 }}>
// //               <strong>Preview ready.</strong>
// //               <p>
// //                 Preview shows matched students (will be inserted/updated) and unmatched names (not present in DB). Absentees (students in batch not found in CSV) are listed below.
// //               </p>

// //               {unmatchedNames.length > 0 && (
// //                 <div style={{ marginTop: 8 }}>
// //                   <strong>Unmatched Names ({unmatchedNames.length}):</strong>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{unmatchedNames.join(", ")}</div>
// //                 </div>
// //               )}

// //               {absentees.length > 0 && (
// //                 <div style={{ marginTop: 8 }}>
// //                   <strong>Absentees ({absentees.length}):</strong>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{absentees.map(a => a.student_name).join(", ")}</div>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Student Table (manual only) */}
// //       {activeTab === "manual" && formData.batch && (
// //         <div className="card">
// //           <div className="card-header">
// //             <h3>
// //               Student List -{" "}
// //               {filteredBatches.find((b) => b.batch_id?.toString() === formData.batch)?.batch_name || "N/A"}
// //             </h3>
// //           </div>

// //           {loading ? (
// //             <div className="loading">
// //               <div className="spinner"></div>
// //             </div>
// //           ) : (
// //             <div className="table-container">
// //               <table className="table">
// //                 <thead>
// //                   <tr>
// //                     <th>Student</th>
// //                     <th>En Number</th>
// //                     <th>Contact</th>
// //                     <th>Status</th>
// //                     <th>Actions</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {filteredStudents.map((s) => (
// //                     <tr key={s.student_id}>
// //                       <td>
// //                         <div className="font-medium">{s.student_name}</div>
// //                         <div className="text-sm text-gray-500">{s.father_name}</div>
// //                       </td>
// //                       <td>{s.enr_id}</td>
// //                       <td>
// //                         <div>{s.contact_no1}</div>
// //                         <div className="text-gray-500">{s.student_email}</div>
// //                       </td>
// //                       <td>
// //                         {attendance[s.student_id] ? (
// //                           <span className={`badge ${getStatusColor(attendance[s.student_id])}`}>{attendance[s.student_id]}</span>
// //                         ) : (
// //                           <span className="badge badge-info">Not Marked</span>
// //                         )}
// //                       </td>
// //                       <td style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
// //                         <button onClick={() => handleStatusChange(s.student_id, "PRESENT")} disabled={freeze} className="attendance-btn present">
// //                           Present
// //                         </button>
// //                         <button onClick={() => handleStatusChange(s.student_id, "ABSENT")} disabled={freeze} className="attendance-btn absent">
// //                           Absent
// //                         </button>
// //                         <button onClick={() => handleStatusChange(s.student_id, "LATE JOINED")} disabled={freeze} className="attendance-btn late">
// //                           Late
// //                         </button>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default AttendanceManagement;





// // AttendanceManagement.jsx — Part 1/4
// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import Papa from "papaparse";
// import "./global.css";
// import { useAuth } from "../../contexts/AuthContext";

// /**
//  * AttendanceManagement (final)
//  *
//  * Strict mode:
//  *  - Alert only after DATE is selected and timetable slot not found
//  *  - Students load only if timetable slot exists (startTime/endTime filled)
//  *
//  * CSV preview:
//  *  - Only show students who belong to selected batch+classroom
//  *  - Collect CSV rows for other students in unmatchedNames and show creatively
//  */

// const AttendanceManagement = () => {
//   //const today = new Date().toISOString().split("T")[0];
//   const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

//   const initialFormData = {
//     cohort: "",
//     batch: "",
//     classroom: "",
//     date: currentMonth,
//     startTime: "00:00",
//     endTime: "00:00",
//     search: "",
//   };

//   const [formData, setFormData] = useState(initialFormData);
//   const [activeTab, setActiveTab] = useState("manual"); // manual | bulk
//   const [cohorts, setCohorts] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [filteredBatches, setFilteredBatches] = useState([]);
//   const [classrooms, setClassrooms] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [attendance, setAttendance] = useState({});
//   const [initialAttendance, setInitialAttendance] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [freeze, setFreeze] = useState(false);
//   const [csvPreview, setCsvPreview] = useState(null);
//   const [csvFile, setCsvFile] = useState(null);
//   const [unmatchedNames, setUnmatchedNames] = useState([]);
//   const [absentees, setAbsentees] = useState([]);
//   const [attendanceExists, setAttendanceExists] = useState(false);
//   const [lastCommitExists, setLastCommitExists] = useState(false);

//   const auth = useAuth();
//   const token = auth?.user?.token;

//   const axiosConfig = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   // ------------------- helpers -------------------
//   const normalizeTimeString = (s) => {
//     if (!s) return null;
//     let t = s.toString().replace(/\?/g, "").replace(/[^\d:apmAPM\s]/g, "").trim();
//     const hhmm = t.match(/(\d{1,2}:\d{2})/);
//     const ampm = t.match(/(AM|PM|am|pm)/);
//     if (hhmm) {
//       let [h, m] = hhmm[1].split(":").map((x) => parseInt(x, 10));
//       if (ampm) {
//         const a = ampm[0].toUpperCase();
//         if (a === "PM" && h !== 12) h += 12;
//         if (a === "AM" && h === 12) h = 0;
//       }
//       if (h >= 0 && h < 24 && m >= 0 && m < 60) {
//         return h * 60 + m;
//       }
//     }
//     const digits = t.match(/(\d{3,4})/);
//     if (digits) {
//       const d = digits[1];
//       let h = parseInt(d.slice(0, d.length - 2), 10);
//       let m = parseInt(d.slice(-2), 10);
//       if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
//     }
//     return null;
//   };

//   const minutesDiff = (aMin, bMin) => {
//     if (aMin === null || bMin === null) return 0;
//     return Math.max(0, bMin - aMin);
//   };

//   const computeStatusFromPercent = (pct) => {
//     if (pct === null || isNaN(pct)) return "ABSENT";
//     if (pct >= 75) return "PRESENT";
//     if (pct >= 40) return "LATE JOINED";
//     return "ABSENT";
//   };

//   const normalizeStatusForFrontend = (s) => {
//     if (!s) return "ABSENT";
//     const t = s.toString().toUpperCase();
//     if (t.includes("PRES")) return "PRESENT";
//     if (t.includes("LATE")) return "LATE JOINED";
//     if (t.includes("ABS")) return "ABSENT";
//     return s;
//   };

//   const getStatusColor = (status) => {
//     if (!status) return "badge-info";
//     const t = status.toString().toUpperCase();
//     if (t.includes("PRES")) return "badge-success";
//     if (t.includes("ABS")) return "badge-danger";
//     if (t.includes("LATE")) return "badge-warning";
//     if (t.includes("LEAVE")) return "badge-info";
//     return "badge-info";
//   };

//   // ------------------- handlers -------------------
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (name === "cohort") {
//       const filtered = batches.filter((b) => b.cohort_number?.toString() === value.toString());
//       setFilteredBatches(filtered);
//       setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
//       setStudents([]);
//       setAttendance({});
//       setInitialAttendance({});
//       setFreeze(false);
//       setAttendanceExists(false);
//       setCsvPreview(null);
//       setCsvFile(null);
//       setUnmatchedNames([]);
//       setAbsentees([]);
//     }

//     if (name === "batch" && value) {
//       axios
//         .get(`http://localhost:5000/api/coordinator/classrooms/${value}`, axiosConfig())
//         .then(({ data }) => setClassrooms(data || []))
//         .catch((err) => {
//           console.error("Error fetching classrooms:", err);
//           setClassrooms([]);
//         });

//       setFormData((prev) => ({ ...prev, classroom: "" }));
//       setStudents([]);
//       setAttendance({});
//       setInitialAttendance({});
//       setFreeze(false);
//       setAttendanceExists(false);
//       setCsvPreview(null);
//       setCsvFile(null);
//       setUnmatchedNames([]);
//       setAbsentees([]);
//     }

//     if (name === "classroom") {
//       // don't alert here (strict mode requires date selection first)
//       setCsvPreview(null);
//       setCsvFile(null);
//       setUnmatchedNames([]);
//       setAbsentees([]);
//       setAttendance({});
//       setInitialAttendance({});
//       setAttendanceExists(false);
//       setLastCommitExists(false);
//       // keep startTime/endTime as-is until date selected
//     }

//     if (name === "date") {
//       // Date change triggers timetable check (see effect)
//       setCsvPreview(null);
//       setCsvFile(null);
//       setUnmatchedNames([]);
//       setAbsentees([]);
//       setAttendance({});
//       setInitialAttendance({});
//       setAttendanceExists(false);
//       setLastCommitExists(false);
//     }
//   };

//   const handleReset = () => {
//     setFormData(initialFormData);
//     setFilteredBatches([]);
//     setClassrooms([]);
//     setStudents([]);
//     setAttendance({});
//     setInitialAttendance({});
//     setFreeze(false);
//     setCsvPreview(null);
//     setCsvFile(null);
//     setUnmatchedNames([]);
//     setAbsentees([]);
//     setAttendanceExists(false);
//     setLastCommitExists(false);
//   };

//   // ------------------- initial fetches -------------------
//   useEffect(() => {
//     if (!token) return;
//     axios
//       .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
//       .then(({ data }) => setCohorts(data || []))
//       .catch((err) => console.error("Error fetching cohorts:", err));
//   }, [token]);

//   useEffect(() => {
//     if (!token || !formData.cohort) {
//       setBatches([]);
//       setFilteredBatches([]);
//       return;
//     }
//     axios
//       .get(`http://localhost:5000/api/coordinator/batches?cohort_number=${formData.cohort}`, axiosConfig())
//       .then(({ data }) => {
//         setBatches(data || []);
//         setFilteredBatches(data || []);
//         setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
//         setStudents([]);
//         setAttendance({});
//         setInitialAttendance({});
//         setFreeze(false);
//         setAttendanceExists(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching batches:", err);
//         setBatches([]);
//         setFilteredBatches([]);
//       });
//   }, [token, formData.cohort]);

//   // ------------------- timetable check (runs only when DATE changes) -------------------
//   useEffect(() => {
//     if (!token) return;
//     // only run when date is selected and batch+classroom are present
//     if (!formData.batch || !formData.classroom || !formData.date) return;

//     const fetchTimetableAndFillTimes = async () => {
//       try {
//         setLoading(true);
//         const { data } = await axios.get("http://localhost:5000/api/coordinator/timetable", {
//           ...axiosConfig(),
//           params: { batchId: formData.batch },
//         });

//         const weekday = new Date(formData.date).toLocaleDateString("en-GB", { weekday: "long" });
//         const list = Array.isArray(data) ? data : data?.data || [];

//         const foundSlot = list.find(
//           (slot) =>
//             (slot.day || slot.day_of_week || "").toString().toLowerCase() === weekday.toLowerCase() &&
//             parseInt(slot.classroom_id) === parseInt(formData.classroom)
//         );

//         if (!foundSlot) {
//           // Strict behavior: alert only after date is selected and slot not found
//           alert("Class is not scheduled for this batch + classroom on the selected date. Students will not be loaded.");
//           setFormData((prev) => ({ ...prev, startTime: "00:00", endTime: "00:00" }));
//           setStudents([]);
//           setAttendance({});
//           setInitialAttendance({});
//           setAttendanceExists(false);
//           return;
//         }

//         const s = foundSlot.start_time || foundSlot.startTime || foundSlot.start_time_formatted || "00:00";
//         const e = foundSlot.end_time || foundSlot.endTime || foundSlot.end_time_formatted || "00:00";

//         setFormData((prev) => ({ ...prev, startTime: s, endTime: e }));
//       } catch (err) {
//         console.error("Error fetching timetable:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTimetableAndFillTimes();
//   }, [token, formData.date]); // crucial: only run when date changes

//   // AttendanceManagement.jsx — Part 2/4

// // ------------------- fetch students AFTER timetable slot (startTime/endTime) is set -------------------
// useEffect(() => {
//   if (!token) return;
//   if (!formData.batch || !formData.classroom) return;

//   // load students only if timetable filled start/end (strict mode)
//   if (!formData.startTime || !formData.endTime || formData.startTime === "00:00" || formData.endTime === "00:00") {
//     setStudents([]);
//     return;
//   }

//   const fetchStudents = async () => {
//     try {
//       setLoading(true);
//       // router exposes GET /students with authenticate — we supply batchId and classroomId
//       const { data } = await axios.get("http://localhost:5000/api/coordinator/students", {
//         ...axiosConfig(),
//         params: { cohortNumber: formData.cohort || null, batchId: formData.batch, classroomId: formData.classroom },
//       });
//       setStudents(data || []);
//     } catch (err) {
//       console.error("Error fetching students:", err);
//       setStudents([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchStudents();
// }, [token, formData.batch, formData.classroom, formData.startTime, formData.endTime]);

// // ------------------- CSV validation & preview -------------------
// const validateCSVStructureClient = (fileText) => {
//   const parsed = Papa.parse(fileText, { preview: 3, skipEmptyLines: true });
//   if (!parsed || !parsed.data || parsed.data.length < 2) {
//     return { ok: false, error: "CSV must contain header row and at least one data row." };
//   }
//   const headerRow = parsed.data[0];
//   const headers = headerRow.map((h) => (h || "").toString().trim().toUpperCase());
//   const requiredHeaders = ["STUDENT NAME", "TIME JOINED", "TIME EXITED"];
//   const hasRequired = requiredHeaders.every((h) => headers.includes(h));
//   if (!hasRequired) {
//     return { ok: false, error: `CSV headers must include: ${requiredHeaders.join(", ")}` };
//   }
//   return { ok: true };
// };

// const handleCSVUpload = (e) => {
//   if (!formData.batch || !formData.classroom || freeze) {
//     alert("Select batch & classroom and ensure attendance is not frozen.");
//     return;
//   }
//   const file = e.target.files[0];
//   if (!file) return;
//   setCsvFile(file);

//   const reader = new FileReader();
//   reader.onload = async (ev) => {
//     const text = ev.target.result;
//     const clientValidation = validateCSVStructureClient(text);
//     if (!clientValidation.ok) {
//       alert("Invalid CSV format: " + clientValidation.error);
//       setCsvFile(null);
//       return;
//     }

//     const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
//     const rows = parsed.data || [];
//     if (rows.length < 3) {
//       alert("CSV must have at least 3 rows: header, class time row, and at least one student row.");
//       setCsvFile(null);
//       return;
//     }

//     // class duration: prefer timetable (formData), else CSV row 2
//     let classStartMin = normalizeTimeString(formData.startTime);
//     let classEndMin = normalizeTimeString(formData.endTime);
//     if ((!classStartMin || !classEndMin) && rows[1]) {
//       const classStartRaw = rows[1][1] ? rows[1][1].toString().trim() : null;
//       const classEndRaw = rows[1][2] ? rows[1][2].toString().trim() : null;
//       const csMin = normalizeTimeString(classStartRaw);
//       const ceMin = normalizeTimeString(classEndRaw);
//       if (csMin) classStartMin = csMin;
//       if (ceMin) classEndMin = ceMin;
//     }

//     const classDuration = minutesDiff(classStartMin, classEndMin);
//     if (!classDuration) {
//       console.warn("Class duration parsed as 0 - check timetable/CSV row 2 times.", formData.startTime, formData.endTime);
//     }

//     const previewRows = [];
//     const unmatched = [];
//     const matchedStudentIds = new Set();

//     const studentNameMap = {};
//     (students || []).forEach((s) => {
//       if (s.student_name) studentNameMap[s.student_name.trim().toLowerCase()] = s;
//     });

//     for (let i = 2; i < rows.length; i++) {
//       const row = rows[i];
//       const rawName = (row[0] || "").toString().trim();
//       const rawJoin = row[1] ? row[1].toString().trim() : "";
//       const rawExit = row[2] ? row[2].toString().trim() : "";
//       if (!rawName) continue;

//       const lowerName = rawName.toLowerCase();
//       let studentMatch = studentNameMap[lowerName];
//       if (!studentMatch) {
//         const fuzzy = (students || []).find((s) =>
//           s.student_name && (s.student_name.toLowerCase().includes(lowerName) || lowerName.includes(s.student_name.toLowerCase()))
//         );
//         if (fuzzy) studentMatch = fuzzy;
//       }

//       if (!studentMatch) {
//         if (!unmatched.includes(rawName)) unmatched.push(rawName);
//         continue; // skip rows for students not in selected batch/classroom
//       }

//       const joinMin = normalizeTimeString(rawJoin);
//       const exitMin = normalizeTimeString(rawExit);
//       const attendedMins = minutesDiff(joinMin, exitMin);
//       const percent = classDuration ? Math.round((attendedMins / classDuration) * 10000) / 100 : 0;
//       const status = computeStatusFromPercent(percent);

//       previewRows.push({
//         student_name: studentMatch.student_name,
//         student_id: studentMatch.student_id,
//         batch_id: studentMatch.batch_id,
//         join_time: rawJoin || null,
//         exit_time: rawExit || null,
//         attended_mins: attendedMins,
//         attendance_percent: isNaN(percent) ? 0 : percent,
//         status,
//         matched: true,
//       });
//       matchedStudentIds.add(studentMatch.student_id);
//     }

//     // compute absentees
//     let computedAbsentees = [];
//     try {
//       const batchStudents = students || [];
//       computedAbsentees = batchStudents
//         .filter((s) => !matchedStudentIds.has(s.student_id))
//         .map((s) => ({ student_id: s.student_id, student_name: s.student_name, batch_id: s.batch_id }));
//     } catch (err) {
//       console.error("Error computing absentees:", err);
//       computedAbsentees = [];
//     }

//     setCsvPreview(previewRows);
//     setUnmatchedNames(unmatched);
//     setAbsentees(computedAbsentees);

//     // optional server preview (non-fatal)
//     try {
//       const fd = new FormData();
//       fd.append("file", file);
//       fd.append("classroom_id", formData.classroom);
//       fd.append("batch_id", formData.batch);
//       fd.append("date", formData.date);
//       fd.append("teacherStartTime", formData.startTime);
//       fd.append("teacherEndTime", formData.endTime);
//       axios.post("http://localhost:5000/api/coordinator/attendance/csv/preview", fd, {
//         headers: { Authorization: `${token ? `Bearer ${token}` : ""}`, "Content-Type": "multipart/form-data" },
//       }).catch((e) => console.warn("Server preview failed (non-fatal):", e?.message || e));
//     } catch (err) {
//       // ignore
//     }
//   };

//   reader.readAsText(file);
// };
// // AttendanceManagement.jsx — Part 3/4

// const handleApplyCsvPreviewToAttendance = () => {
//   if (!csvPreview) {
//     alert("Please upload a CSV for preview first.");
//     return;
//   }
//   const updated = { ...attendance };
//   csvPreview.forEach((r) => {
//     if (r.matched && r.student_id) {
//       updated[r.student_id] = normalizeStatusForFrontend(r.status);
//     }
//   });
//   setAttendance(updated);
//   alert("CSV preview applied to current attendance (only for matched students). Review and commit if ok.");
// };

// const handleCommitCsvUpload = async () => {
//   if (!csvFile) {
//     alert("No CSV file selected.");
//     return;
//   }
//   if (!csvPreview || csvPreview.length === 0) {
//     alert("Please preview the CSV first.");
//     return;
//   }

//   const overlapResp = await checkOverlap();
//   if (overlapResp?.overlap) {
//     alert("Time overlap detected. Fix class time before uploading CSV.");
//     return;
//   }

//   try {
//     setLoading(true);
//     const previewDataToSend = csvPreview.map((r) => ({
//       student_id: r.student_id,
//       batch_id: r.batch_id || formData.batch,
//       classroom_id: formData.classroom,
//       attendance_date: formData.date,
//       start_time: r.join_time || formData.startTime,
//       end_time: r.exit_time || formData.endTime,
//       status: r.status,
//       attended_mins: r.attended_mins,
//       attendance_percent: r.attendance_percent,
//     }));

//     const absenteesToSend = (absentees || []).map((a) => ({
//       student_id: a.student_id,
//       batch_id: a.batch_id || formData.batch,
//       classroom_id: formData.classroom,
//       attendance_date: formData.date,
//       start_time: formData.startTime,
//       end_time: formData.endTime,
//       status: "ABSENT",
//     }));

//     const payload = {
//       previewData: previewDataToSend,
//       absentees: absenteesToSend,
//       unmatchedNames: unmatchedNames || [],
//       attendanceDate: formData.date,
//       batch_id: formData.batch,
//       classroom_id: formData.classroom,
//       start_time: formData.startTime,
//       end_time: formData.endTime,
//     };

//     const resp = await axios.post("http://localhost:5000/api/coordinator/attendance/csv/commit", payload, axiosConfig());

//     if (resp.data?.insertedCount || resp.data?.message) {
//       alert("CSV attendance uploaded successfully!");
//       await refetchAttendance();
//       setCsvFile(null);
//       setCsvPreview(null);
//       setUnmatchedNames([]);
//       setAbsentees([]);
//       setAttendanceExists(true);
//       setFreeze(true);
//       setLastCommitExists(true);
//     } else {
//       alert("CSV commit did not return expected response. Check server logs.");
//     }
//   } catch (err) {
//     console.error("Error uploading CSV:", err);
//     alert("Error uploading CSV. Check server logs.");
//   } finally {
//     setLoading(false);
//   }
// };

// const handleUndoLastCommit = async () => {
//   if (!formData.batch) return alert("Select a batch to undo.");
//   if (!window.confirm("Undo last commit for this batch & date? This will delete attendance records inserted by the last commit.")) return;

//   try {
//     setLoading(true);
//     const resp = await axios.post("http://localhost:5000/api/coordinator/attendance/csv/undo", {
//       batch_id: formData.batch,
//       date: formData.date,
//       classroom_id: formData.classroom,
//     }, axiosConfig());

//     if (resp.data?.deleted || resp.data?.message) {
//       alert("Undo successful.");
//       await refetchAttendance();
//       setLastCommitExists(false);
//       setAttendanceExists(false);
//       setFreeze(false);
//     } else {
//       alert("Undo may have failed — check server logs.");
//     }
//   } catch (err) {
//     console.error("Error undoing last commit:", err);
//     alert("Error undoing last commit. Check server logs.");
//   } finally {
//     setLoading(false);
//   }
// };

// // Manual handlers
// const handleStatusChange = (studentId, status) => {
//   if (freeze) return;
//   setAttendance((prev) => ({ ...prev, [studentId]: status }));
// };

// const handleBulkAttendance = (status) => {
//   if (freeze) return;
//   const map = {};
//   students.forEach((s) => (map[s.student_id] = status));
//   setAttendance(map);
// };

// // overlap helper
// const checkOverlap = async () => {
//   if (!formData.classroom || !formData.date || !formData.startTime || !formData.endTime) return { ok: true };
//   try {
//     const resp = await axios.get("http://localhost:5000/api/coordinator/attendance/check-overlap", {
//       ...axiosConfig(), params: { classroomId: formData.classroom, date: formData.date, startTime: formData.startTime, endTime: formData.endTime },
//     });
//     return resp.data;
//   } catch (err) {
//     console.error("Error checking overlap:", err);
//     return { ok: false, error: err };
//   }
// };

// // compute changed rows
// const computeChangedRecords = () => {
//   const changed = [];
//   (students || []).forEach((s) => {
//     const before = initialAttendance[s.student_id] ?? null;
//     const after = attendance[s.student_id] ?? null;
//     if (before === after) return;
//     if (!before && !after) return;
//     if (after === null) return;
//     changed.push({
//       student_id: s.student_id,
//       classroom_id: parseInt(formData.classroom),
//       date: formData.date,
//       start_time: formData.startTime,
//       end_time: formData.endTime,
//       status: after,
//       remarks: "",
//     });
//   });
//   return changed;
// };

// const handleSubmitAttendance = async () => {
//   if (freeze) {
//     alert("Attendance is frozen for this date (older than allowed).");
//     return;
//   }
//   if (!formData.classroom) {
//     alert("Please select a classroom.");
//     return;
//   }
//   const overlapResp = await checkOverlap();
//   if (overlapResp?.overlap) {
//     alert("Time overlap detected with existing class session. Please adjust time or classroom.");
//     return;
//   }

//   const changed = computeChangedRecords();
//   if (changed.length === 0) {
//     alert("No changes detected to submit.");
//     return;
//   }

//   try {
//     setLoading(true);
//     const payload = { attendanceRecords: changed };
//     await axios.post("http://localhost:5000/api/coordinator/attendance/bulk", payload, axiosConfig());
//     alert("Attendance saved successfully!");
//     setInitialAttendance((prev) => {
//       const updated = { ...prev };
//       changed.forEach((r) => {
//         updated[r.student_id] = r.status;
//       });
//       return updated;
//     });
//     setAttendanceExists(true);
//     setFreeze(true);
//   } catch (err) {
//     console.error("Error saving attendance", err);
//     alert("Error saving attendance");
//   } finally {
//     setLoading(false);
//   }
// };

// // refetch attendance
// const refetchAttendance = async () => {
//   if (!token || !formData.batch || !formData.date) return;
//   setLoading(true);
//   try {
//     const params = {
//       cohortNumber: formData.cohort || null,
//       batchId: formData.batch || null,
//       classroomId: formData.classroom || null,
//       date: formData.date || null,
//     };
//     if (formData.startTime && formData.startTime !== "00:00") params.startTime = formData.startTime;
//     if (formData.endTime && formData.endTime !== "00:00") params.endTime = formData.endTime;

//     const { data } = await axios.get("http://localhost:5000/api/coordinator/attendance", { ...axiosConfig(), params });
//     const dbMap = {};
//     (data || []).forEach((r) => { dbMap[r.student_id] = r.status; });

//     const map = {};
//     (students || []).forEach((s) => { map[s.student_id] = dbMap[s.student_id] || null; });

//     setAttendance(map);
//     setInitialAttendance(map);
//   } catch (err) {
//     console.error("Error refetching attendance:", err);
//   } finally {
//     setLoading(false);
//   }
// };

// // download template
// const downloadReference = () => {
//   if (!formData.classroom) {
//     alert("Select a classroom to download reference CSV");
//     return;
//   }
//   const url = `http://localhost:5000/api/coordinator/attendance/csv/reference`;
//   window.open(url, "_blank");
// };

// // derived lists
// const filteredStudents = useMemo(() => (students || []).filter((s) =>
//   s.student_name?.toLowerCase().includes(formData.search.toLowerCase()) ||
//   (s.enr_id && s.enr_id.toString().includes(formData.search))
// ), [students, formData.search]);
// // AttendanceManagement.jsx — Part 4/4 (render + export)
// return (
//   <div>
//     <div className="page-header">
//       <h1 className="page-title">Attendance Management</h1>
//       <p className="page-subtitle">Mark and manage student attendance</p>
//     </div>

//     {/* Tabs */}
//     <div className="tabs mt-4 mb-6 flex justify-start" style={{ gap: "12px" }}>
//       <button className={`btn btn-primary ${activeTab === "manual" ? "active" : ""}`} onClick={() => setActiveTab("manual")}>Manual Attendance</button>
//       <button className={`btn btn-primary ${activeTab === "bulk" ? "active" : ""}`} onClick={() => setActiveTab("bulk")}>Bulk Upload Attendance</button>
//     </div>

//     {/* Filters card */}
//     <div className="card mb-6">
//       <div className="card-content form-grid">
//         <div className="form-group">
//           <label>Cohort</label>
//           <select name="cohort" value={formData.cohort} onChange={handleChange} className="form-select">
//             <option value="" disabled>Select Cohort</option>
//             {cohorts.map((c) => (<option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>))}
//           </select>
//         </div>

//         <div className="form-group">
//           <label>Batch</label>
//           <select name="batch" value={formData.batch} onChange={handleChange} className="form-select" disabled={!formData.cohort}>
//             <option value="">Select Batch</option>
//             {filteredBatches.map((b) => (<option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>))}
//           </select>
//         </div>

//         <div className="form-group">
//           <label>Classroom</label>
//           <select name="classroom" value={formData.classroom} onChange={handleChange} className="form-select" disabled={!formData.batch}>
//             <option value="">Select Classroom</option>
//             {(classrooms || []).map((c) => (<option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>))}
//           </select>
//         </div>

//         <div className="form-group">
//           <label>Date</label>
//           <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" min={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} max={new Date().toISOString().split("T")[0]} />
//         </div>

//         <div className="form-group">
//           <label>Start Time</label>
//           <input type="time" name="startTime" value={formData.startTime} className="form-input" disabled />
//         </div>

//         <div className="form-group">
//           <label>End Time</label>
//           <input type="time" name="endTime" value={formData.endTime} className="form-input" disabled />
//         </div>

//         {activeTab === "manual" && (
//           <div className="form-group">
//             <label>Search Student</label>
//             <input type="text" name="search" placeholder="Search by name or ID..." value={formData.search} onChange={handleChange} className="form-input" />
//           </div>
//         )}

//         {activeTab === "bulk" && (
//           <div className="form-group">
//             <label>Upload CSV</label>
//             <input type="file" accept=".csv" onChange={handleCSVUpload} 
//             //disabled={freeze || !formData.classroom} 
//             disabled={freeze ||
//                       !formData.classroom ||
//                        formData.startTime === "00:00" ||
//                        formData.endTime === "00:00"
//                      }

//             className="form-input" />
//           </div>
//         )}
//       </div>

//       {/* Actions */}
//       {activeTab === "bulk" ? (
//         <div className="form-group" style={{ marginTop: "1rem" }}>
//           <label>Actions</label>
//           <div style={{ display: "flex", gap: "0.5rem" }}>
//             <button onClick={downloadReference} className="btn btn-secondary">Download Template</button>
//             <button onClick={() => { if (csvPreview) handleCommitCsvUpload(); else alert("Please upload a CSV and preview before committing."); }} className="btn btn-primary" disabled={!csvFile || freeze}>Commit CSV Upload</button>
//             <button onClick={handleApplyCsvPreviewToAttendance} className="btn btn-info" disabled={!csvPreview || freeze}>Apply CSV Preview to Attendance</button>
//             <button onClick={handleUndoLastCommit} className="btn btn-warning" disabled={!lastCommitExists}>Undo Last Commit</button>
//           </div>
//         </div>
//       ) : (
//         <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
//           <button onClick={() => handleBulkAttendance("PRESENT")} className="btn btn-success" disabled={!formData.classroom || freeze}>✓ Mark All Present</button>
//           <button onClick={() => handleBulkAttendance("ABSENT")} className="btn btn-danger" disabled={!formData.classroom || freeze}>✗ Mark All Absent</button>
//           <button onClick={handleReset} className="btn btn-secondary">Reset</button>
//           <button onClick={handleSubmitAttendance} className="btn btn-primary" disabled={freeze || !formData.classroom}>{attendanceExists ? "Update Attendance" : "Submit Attendance"}</button>
//         </div>
//       )}
//     </div>

//     {/* CSV Preview */}
//     {activeTab === "bulk" && csvPreview && (
//       <div className="card mb-6">
//         <div className="card-header"><h3>CSV Preview ({csvPreview.length} rows)</h3></div>
//         <div className="card-content">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>Student Name</th><th>Student ID</th><th>Time Joined</th><th>Time Exited</th><th>Minutes</th><th>Attendance %</th><th>Computed Status</th><th>Matched?</th>
//               </tr>
//             </thead>
//             <tbody>
//               {csvPreview.map((r, idx) => (
//                 <tr key={idx}>
//                   <td>{r.student_name}</td>
//                   <td>{r.student_id || "-"}</td>
//                   <td>{r.join_time || "-"}</td>
//                   <td>{r.exit_time || "-"}</td>
//                   <td>{r.attended_mins ?? "-"}</td>
//                   <td>{r.attendance_percent ?? "-"}</td>
//                   <td><span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span></td>
//                   <td>{r.matched ? "YES" : "NO"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <div style={{ marginTop: 8 }}>
//             <strong>Preview ready.</strong>
//             <p>Only students belonging to the selected batch & classroom are displayed in the table. CSV rows for other students are ignored from the table but listed below as "Unmatched".</p>

//             {/* Creative unmatched panel */}
//             {unmatchedNames.length > 0 && (
//               <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#fff7f0", border: "1px solid #ffd8b5", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <div style={{ width: 38, height: 38, borderRadius: 8, background: "#fff2e6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#cc6b00" }}>!</div>
//                   <div>
//                     <div style={{ fontSize: 16, fontWeight: 700, color: "#8a4b00" }}>Unmatched Names ({unmatchedNames.length})</div>
//                     <div style={{ marginTop: 6, color: "#6b4b2a" }}>The following names were present in the CSV but do not belong to the selected batch/classroom. They will not be imported — please verify CSV or check batch/classroom selection.</div>
//                   </div>
//                 </div>

//                 <ul style={{ marginTop: 10, paddingLeft: 20 }}>
//                   {unmatchedNames.map((name, idx) => (<li key={idx} style={{ marginBottom: 6, fontSize: 14 }}>• <strong>{name}</strong></li>))}
//                 </ul>
//               </div>
//             )}

//             {absentees.length > 0 && (
//               <div style={{ marginTop: 12 }}>
//                 <strong>Absentees ({absentees.length}):</strong>
//                 <div style={{ whiteSpace: "pre-wrap" }}>{absentees.map((a) => a.student_name).join(", ")}</div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     )}

//     {/* Student Table (manual) */}
//     {activeTab === "manual" && formData.batch && (
//       <div className="card">
//         <div className="card-header"><h3>Student List - {filteredBatches.find((b) => b.batch_id?.toString() === formData.batch)?.batch_name || "N/A"}</h3></div>
//         {loading ? (
//           <div className="loading"><div className="spinner"></div></div>
//         ) : (
//           <div className="table-container">
//             <table className="table">
//               <thead>
//                 <tr><th>Student</th><th>En Number</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {filteredStudents.map((s) => (
//                   <tr key={s.student_id}>
//                     <td><div className="font-medium">{s.student_name}</div><div className="text-sm text-gray-500">{s.father_name}</div></td>
//                     <td>{s.enr_id}</td>
//                     <td><div>{s.contact_no1}</div><div className="text-gray-500">{s.student_email}</div></td>
//                     <td>{attendance[s.student_id] ? <span className={`badge ${getStatusColor(attendance[s.student_id])}`}>{attendance[s.student_id]}</span> : <span className="badge badge-info">Not Marked</span>}</td>
//                     <td style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
//                       <button onClick={() => handleStatusChange(s.student_id, "PRESENT")} disabled={freeze} className="attendance-btn present">Present</button>
//                       <button onClick={() => handleStatusChange(s.student_id, "ABSENT")} disabled={freeze} className="attendance-btn absent">Absent</button>
//                       <button onClick={() => handleStatusChange(s.student_id, "LATE JOINED")} disabled={freeze} className="attendance-btn late">Late</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     )}
//   </div>
// );

// // End of component
// };

// export default AttendanceManagement;


// AttendanceManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./global.css";
import { useAuth } from "../../contexts/AuthContext";

/**
 * AttendanceManagement (backend-driven CSV preview + session-based commit)
 *
 * Notes:
 * - Backend expects `batch_id` in commit payloads to limit absentee marking to that batch.
 * - Backend preview returns previewData rows that include student_id (if matched).
 */

const API_BASE = "http://localhost:5000/api/coordinator";

export default function AttendanceManagement() {
  const auth = useAuth();
  const token = auth?.user?.token || null;

  // ---------- Form state ----------
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    cohort: "",
    batch: "",
    classroom: "",
    date: today,
    startTime: "00:00",
    endTime: "00:00",
    timetable_id: null,
    search: "",
  });

  // ---------- UI state ----------
  const [activeTab, setActiveTab] = useState("manual"); // manual | bulk
  const [loading, setLoading] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [lastCommitExists, setLastCommitExists] = useState(false);

  // ---------- lookups ----------
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  // ---------- attendance data ----------
  const [attendanceMap, setAttendanceMap] = useState({}); // student_id -> status
  const [initialAttendanceMap, setInitialAttendanceMap] = useState({});

  // ---------- session & preview ----------
  const [sessionId, setSessionId] = useState(null); // session-based fetch
  const [previewData, setPreviewData] = useState(null); // backend preview rows
  const [previewUnmatched, setPreviewUnmatched] = useState([]); // array of objects {student_name,...}
  const [previewAbsentees, setPreviewAbsentees] = useState([]); // array of {student_id, student_name}
  const [previewStartTime, setPreviewStartTime] = useState(null);
  const [previewEndTime, setPreviewEndTime] = useState(null);

  // ---------- helpers ----------
  const axiosConfig = () => ({ headers: { Authorization: token ? `Bearer ${token}` : "" } });

  const getStatusColor = (status) => {
    if (!status) return "badge-info";
    const t = status.toString().toUpperCase();
    if (t.includes("PRES")) return "badge-success";
    if (t.includes("ABS")) return "badge-danger";
    if (t.includes("LATE")) return "badge-warning";
    if (t.includes("LEAVE")) return "badge-info";
    return "badge-info";
  };

  // ---------- form handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    // clear dependent state on key changes
    if (name === "cohort") {
      setBatches([]);
      setClassrooms([]);
      setStudents([]);
      setAttendanceMap({});
      setInitialAttendanceMap({});
      setPreviewData(null);
      setPreviewUnmatched([]);
      setPreviewAbsentees([]);
      setSessionId(null);
      setLastCommitExists(false);
    }
    if (name === "batch") {
      setClassrooms([]);
      setStudents([]);
      setAttendanceMap({});
      setInitialAttendanceMap({});
      setPreviewData(null);
      setPreviewUnmatched([]);
      setPreviewAbsentees([]);
      setSessionId(null);
      setLastCommitExists(false);
    }
    if (name === "classroom" || name === "date") {
      setStudents([]);
      setAttendanceMap({});
      setInitialAttendanceMap({});
      setPreviewData(null);
      setPreviewUnmatched([]);
      setPreviewAbsentees([]);
      setSessionId(null);
      setLastCommitExists(false);
    }
  };

  const handleReset = () => {
    setFormData({ cohort: "", batch: "", classroom: "", date: today, startTime: "00:00", endTime: "00:00", timetable_id: null, search: "" });
    setStudents([]);
    setAttendanceMap({});
    setInitialAttendanceMap({});
    setPreviewData(null);
    setPreviewUnmatched([]);
    setPreviewAbsentees([]);
    setSessionId(null);
    setLastCommitExists(false);
    setFreeze(false);
  };

  // ---------- load lookups ----------
  useEffect(() => {
    if (!token) return;
    const fetchCohorts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/cohorts`, axiosConfig());
        setCohorts(data || []);
      } catch (err) {
        console.error("fetch cohorts error:", err);
      }
    };
    fetchCohorts();
  }, [token]);

  useEffect(() => {
    if (!token || !formData.cohort) { setBatches([]); return; }
    const fetchBatches = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/batches?cohort_number=${formData.cohort}`, axiosConfig());
        setBatches(data || []);
      } catch (err) {
        console.error("fetch batches error:", err);
        setBatches([]);
      }
    };
    fetchBatches();
  }, [token, formData.cohort]);

  useEffect(() => {
    if (!token || !formData.batch) { setClassrooms([]); return; }
    const fetchClassrooms = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/classrooms/${formData.batch}`, axiosConfig());
        setClassrooms(data || []);
      } catch (err) {
        console.error("fetch classrooms error:", err);
        setClassrooms([]);
      }
    };
    fetchClassrooms();
  }, [token, formData.batch]);

  // ---------- timetable + session fetch ----------
  useEffect(() => {
    // Run only when essential filters are present
    if (!token) return;
    if (!formData.batch || !formData.classroom || !formData.date) return;

    const loadTimetableAndSession = async () => {
      setLoading(true);
      try {
        // 1) fetch timetable slots for batch
        const { data: ttData } = await axios.get(`${API_BASE}/timetable`, {
          ...axiosConfig(),
          params: { batchId: formData.batch },
        });

        const weekday = new Date(formData.date).toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
        const slots = Array.isArray(ttData) ? ttData : ttData?.data || [];

        const found = slots.find((s) => {
          const slotDay = (s.day || s.day_of_week || "").toString().toUpperCase();
          return slotDay === weekday && String(s.classroom_id) === String(formData.classroom);
        });

        if (!found) {
          // strict: no slot → do not load students
          alert("No timetable slot found for this classroom on the selected date. Students will not be loaded.");
          setFormData((p) => ({ ...p, startTime: "00:00", endTime: "00:00", timetable_id: null }));
          setSessionId(null);
          setStudents([]);
          setAttendanceMap({});
          setInitialAttendanceMap({});
          setPreviewData(null);
          return;
        }

        // normalize slot times (prefer fields if present)
        const sTime = found.start_time || found.startTime || found.start_time_formatted || "00:00";
        const eTime = found.end_time || found.endTime || found.end_time_formatted || "00:00";
        const tId = found.timetable_id || found.timetableId || null;

        // set form times using slot values
        setFormData((p) => ({ ...p, startTime: sTime, endTime: eTime, timetable_id: tId }));

        // 2) fetch existing session_id (backend route expected)
        try {
          // use sTime/eTime directly (avoid race with setFormData)
          const { data: sess } = await axios.get(`${API_BASE}/attendance/session`, {
            ...axiosConfig(),
            params: {
              classroom_id: formData.classroom,
              session_date: formData.date,
              start_time: sTime,
              end_time: eTime,
            },
          });

          // backend should return { session_id: number | null, start_time, end_time }
          setSessionId(sess?.session_id || null);
        } catch (err) {
          // If session route missing, we simply set sessionId = null (session will be created on commit)
          console.warn("attendance/session lookup failed (backend may not provide route):", err?.message || err);
          setSessionId(null);
        }
      } catch (err) {
        console.error("loadTimetableAndSession error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTimetableAndSession();
  }, [token, formData.batch, formData.classroom, formData.date]);

  // ---------- fetch students (only when timetable filled) ----------
  useEffect(() => {
    if (!token) return;
    if (!formData.batch || !formData.classroom) return;
    if (!formData.startTime || !formData.endTime || formData.startTime === "00:00" || formData.endTime === "00:00") {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/students`, {
          ...axiosConfig(),
          params: { cohortNumber: formData.cohort || null, batchId: formData.batch, classroomId: formData.classroom },
        });
        setStudents(data || []);
      } catch (err) {
        console.error("fetch students error:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [token, formData.batch, formData.classroom, formData.startTime, formData.endTime]);

  // ---------- refetch attendance by session_id ----------
  const refetchAttendance = async () => {
    if (!token || !sessionId) {
      // clear map if no session
      const emptyMap = {};
      (students || []).forEach((s) => (emptyMap[s.student_id] = null));
      setAttendanceMap(emptyMap);
      setInitialAttendanceMap(emptyMap);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/attendance`, {
        ...axiosConfig(),
        params: { session_id: sessionId },
      });

      // data is array of attendance rows for the session
      const map = {};
      (students || []).forEach((s) => (map[s.student_id] = null)); // default
      (data || []).forEach((r) => {
        if (r && r.student_id) map[r.student_id] = r.status || null;
      });

      setAttendanceMap(map);
      setInitialAttendanceMap(map);
    } catch (err) {
      console.error("refetchAttendance error:", err);
    } finally {
      setLoading(false);
    }
  };

  // whenever sessionId or students change, re-fetch session attendance
  useEffect(() => {
    if (students.length === 0) return;
    refetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, students]);

  // ---------- manual attendance handlers ----------
  const handleStatusChange = (studentId, status) => {
    if (freeze) return;
    setAttendanceMap((p) => ({ ...p, [studentId]: status }));
  };

  const setAllStatus = (status) => {
    if (freeze) return;
    const map = {};
    (students || []).forEach((s) => (map[s.student_id] = status));
    setAttendanceMap(map);
  };

  // ---------- check overlap ----------
  const checkOverlap = async () => {
    if (!formData.classroom || !formData.date || !formData.startTime || !formData.endTime) return { overlap: false };
    try {
      const { data } = await axios.get(`${API_BASE}/attendance/check-overlap`, {
        ...axiosConfig(),
        params: { classroomId: formData.classroom, date: formData.date, startTime: formData.startTime, endTime: formData.endTime },
      });
      return data;
    } catch (err) {
      console.error("checkOverlap error:", err);
      return { overlap: false, error: err };
    }
  };

  // ---------- submit manual attendance (use commit endpoint so backend creates/uses session properly) ----------
  const computeChangedRecords = () => {
    const changed = [];
    (students || []).forEach((s) => {
      const before = initialAttendanceMap[s.student_id] ?? null;
      const after = attendanceMap[s.student_id] ?? null;
      if (before === after) return;
      // We will send minimal preview-like rows; backend will set times/absentees/session
      changed.push({
        student_id: s.student_id,
        batch_id: formData.batch, // IMPORTANT: include batch
        time_joined: null,
        time_exited: null,
        attendance_percent: null,
        status: after || "ABSENT",
      });
    });
    return changed;
  };

  const handleSubmitAttendance = async () => {
    if (freeze) {
      alert("Attendance is frozen for this date.");
      return;
    }
    if (!formData.classroom || !formData.date) {
      alert("Select classroom and date.");
      return;
    }

    const changed = computeChangedRecords();
    if (!changed.length) {
      alert("No changes detected.");
      return;
    }

    const overlapResp = await checkOverlap();
    if (overlapResp?.overlap) {
      alert("Selected session overlaps with an existing session. Adjust time or classroom.");
      return;
    }

    try {
      setLoading(true);
      // commit via backend which creates session if required
      const payload = {
        previewData: changed,
        session_date: formData.date,
        attendanceDate: formData.date,
        classroom_id: formData.classroom,
        batch_id: formData.batch, // IMPORTANT: include batch id so backend isolates to this batch
        start_time: formData.startTime,
        end_time: formData.endTime,
        timetable_id: formData.timetable_id || null,
      };

      const { data } = await axios.post(`${API_BASE}/attendance/csv/commit`, payload, axiosConfig());

      if (data && data.session_id) {
        setSessionId(data.session_id);
        setLastCommitExists(true);
        // update initial map to reflect changes
        setInitialAttendanceMap((p) => {
          const updated = { ...p };
          changed.forEach((c) => {
            updated[c.student_id] = c.status;
          });
          return updated;
        });
        alert("Attendance submitted successfully.");
        await refetchAttendance();
      } else {
        alert("Attendance submitted; server response unexpected. Check logs.");
      }
    } catch (err) {
      console.error("handleSubmitAttendance error:", err);
      alert("Failed to submit attendance. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- CSV preview upload (backend-only) ----------
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!formData.classroom || !formData.date) {
      alert("Select classroom and date before uploading CSV.");
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("classroom_id", formData.classroom);
    fd.append("batch_id", formData.batch);
    fd.append("session_date", formData.date);
    if (formData.timetable_id) fd.append("timetable_id", formData.timetable_id);

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/attendance/csv/preview`, fd, {
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "multipart/form-data" },
      });

      // normalize backend response
      setPreviewData(Array.isArray(data.previewData) ? data.previewData : []);
      setPreviewUnmatched(Array.isArray(data.unmatchedStudents) ? data.unmatchedStudents : []);
      setPreviewAbsentees(Array.isArray(data.absentees) ? data.absentees : []);
      if (data.start_time) setPreviewStartTime(data.start_time);
      if (data.end_time) setPreviewEndTime(data.end_time);

      // if backend provides start/end, set them in form
      if (data.start_time && data.end_time) {
        setFormData((p) => ({ ...p, startTime: data.start_time, endTime: data.end_time }));
      }

      // switch to bulk preview
      setActiveTab("bulk");
    } catch (err) {
      console.error("CSV preview upload failed:", err);
      alert("CSV preview failed. Check file format and server logs.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // ---------- commit CSV preview ----------
  const handleCommitCsvPreview = async () => {
    if (!previewData || previewData.length === 0) {
      alert("No preview data. Upload CSV and preview first.");
      return;
    }

    const overlapResp = await checkOverlap();
    if (overlapResp?.overlap) {
      alert("Session overlaps an existing session. Fix time before commit.");
      return;
    }

    try {
      setLoading(true);
      // Include batch_id and ensure each preview row includes batch_id (backend will validate).
      const payload = {
        previewData: previewData.map((r) => ({
          student_id: r.student_id,
          batch_id: formData.batch, // IMPORTANT: include batch
          time_joined: r.time_joined || null,
          time_exited: r.time_exited || null,
          attendance_percent: r.attendance_percent ?? null,
          status: r.status || "ABSENT",
        })),
        session_date: formData.date,
        attendanceDate: formData.date,
        classroom_id: formData.classroom,
        batch_id: formData.batch, // IMPORTANT: include batch
        start_time: previewStartTime || formData.startTime,
        end_time: previewEndTime || formData.endTime,
        timetable_id: formData.timetable_id || null,
      };

      const { data } = await axios.post(`${API_BASE}/attendance/csv/commit`, payload, axiosConfig());

      if (data && data.session_id) {
        setSessionId(data.session_id);
        setLastCommitExists(true);
        alert("CSV committed successfully (session created/updated).");
        // refresh attendance & clear preview
        await refetchAttendance();
        setPreviewData(null);
        setPreviewUnmatched([]);
        setPreviewAbsentees([]);
      } else {
        alert("CSV commit finished but server response unexpected. Check logs.");
      }
    } catch (err) {
      console.error("commit CSV preview error:", err);
      alert("CSV commit failed. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- undo last commit ----------
  const handleUndo = async () => {
    if (!sessionId) return alert("No session available to undo.");
    if (!window.confirm("Undo last commit for this session? This will delete attendance rows for the session.")) return;

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/attendance/undo`, { session_id: sessionId }, axiosConfig());
      if (data && (data.deletedCount || data.deletedRows || data.message)) {
        alert("Undo successful.");
        setSessionId(null);
        setLastCommitExists(false);
        setPreviewData(null);
        setPreviewUnmatched([]);
        setPreviewAbsentees([]);
        await refetchAttendance();
      } else {
        alert("Undo may have failed. Check server logs.");
      }
    } catch (err) {
      console.error("undo error:", err);
      alert("Undo failed. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- derived lists ----------
  const filteredStudents = useMemo(() => {
    const q = (formData.search || "").toLowerCase().trim();
    if (!q) return students || [];
    return (students || []).filter((s) => {
      return (
        (s.student_name || "").toLowerCase().includes(q) ||
        (s.enr_id && s.enr_id.toString().includes(q)) ||
        (s.student_id && s.student_id.toString().includes(q))
      );
    });
  }, [students, formData.search]);

  // ---------- download reference ----------
 const downloadReference = async () => {
  if (!formData.classroom) {
    alert("Select a classroom to download template.");
    return;
  }

  try {
    const response = await axios.get(
      `${API_BASE}/attendance/csv/reference`,
      {
        ...axiosConfig(),
        responseType: "blob",  // important
      }
    );

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_attendance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download template failed:", err);
    alert("Template download failed. Check server logs.");
  }
};


  // ---------- render ----------
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance Management</h1>
        <p className="page-subtitle">Mark and manage student attendance</p>
      </div>

      <div className="tabs mt-4 mb-6" style={{ gap: 12 }}>
        <button className={`btn btn-primary ${activeTab === "manual" ? "active" : ""}`} onClick={() => setActiveTab("manual")}>Manual Attendance</button>
        <button className={`btn btn-primary ${activeTab === "bulk" ? "active" : ""}`} onClick={() => setActiveTab("bulk")}>Bulk Upload Attendance</button>
      </div>

      <div className="card mb-6">
        <div className="card-content form-grid">
          <div className="form-group">
            <label>Cohort</label>
            <select name="cohort" value={formData.cohort} onChange={handleChange} className="form-select">
              <option value="">Select Cohort</option>
              {cohorts.map((c) => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Batch</label>
            <select name="batch" value={formData.batch} onChange={handleChange} className="form-select" disabled={!formData.cohort}>
              <option value="">Select Batch</option>
              {batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Classroom</label>
            <select name="classroom" value={formData.classroom} onChange={handleChange} className="form-select" disabled={!formData.batch}>
              <option value="">Select Classroom</option>
              {classrooms.map((c) => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" min={new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0]} max={today} />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="startTime" value={formData.startTime} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="endTime" value={formData.endTime} readOnly className="form-input" />
          </div>

          {activeTab === "manual" && (
            <div className="form-group">
              <label>Search Student</label>
              <input type="text" name="search" placeholder="Search by name or ID..." value={formData.search} onChange={handleChange} className="form-input" />
            </div>
          )}

          {activeTab === "bulk" && (
            <div className="form-group">
              <label>Upload CSV (backend preview)</label>
              <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={freeze || !formData.classroom || formData.startTime === "00:00" || formData.endTime === "00:00"} className="form-input" />
            </div>
          )}
        </div>

        {/* actions */}
        {activeTab === "bulk" ? (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={downloadReference}>Download Template</button>
            <button className="btn btn-primary" onClick={handleCommitCsvPreview} disabled={!previewData || previewData.length === 0 || freeze} style={{ marginLeft: 8 }}>Commit CSV Upload</button>
            <button className="btn btn-warning" onClick={handleUndo} disabled={!sessionId || !lastCommitExists} style={{ marginLeft: 8 }}>Undo Last Commit</button>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-success" onClick={() => setAllStatus("PRESENT")} disabled={!formData.classroom || freeze}>Mark All Present</button>
            <button className="btn btn-danger" onClick={() => setAllStatus("ABSENT")} disabled={!formData.classroom || freeze}>Mark All Absent</button>
            <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <button className="btn btn-primary" onClick={handleSubmitAttendance} disabled={!formData.classroom || freeze}>{Object.values(initialAttendanceMap).some(Boolean) ? "Update Attendance" : "Submit Attendance"}</button>
          </div>
        )}
      </div>

      {/* CSV Preview view */}
      {activeTab === "bulk" && previewData && (
        <div className="card mb-6">
          <div className="card-header"><h3>CSV Preview ({previewData.length})</h3></div>
          <div className="card-content">
            <div style={{ marginBottom: 8 }}>
              <strong>Session times:</strong> {previewStartTime || formData.startTime} — {previewEndTime || formData.endTime}
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Time Joined</th>
                  <th>Time Exited</th>
                  <th>Percent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(previewData || []).map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.student_name || "-"}</td>
                    <td>{r.student_id || "-"}</td>
                    <td>{r.time_joined || "-"}</td>
                    <td>{r.time_exited || "-"}</td>
                    <td>{r.attendance_percent ?? "-"}</td>
                    <td><span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {previewUnmatched && previewUnmatched.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: "#fff7f0", borderRadius: 6 }}>
                <strong>Unmatched names ({previewUnmatched.length}):</strong>
                <div style={{ marginTop: 8 }}>{previewUnmatched.map(u => u.student_name || String(u)).join(", ")}</div>
              </div>
            )}

            {previewAbsentees && previewAbsentees.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Absentees ({previewAbsentees.length}):</strong>
                <div>{previewAbsentees.map(a => a.student_name).join(", ")}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual table */}
      {activeTab === "manual" && formData.batch && (
        <div className="card">
          <div className="card-header"><h3>Student List</h3></div>
          <div className="card-content">
            {loading ? <div className="loading"><div className="spinner"></div></div> : (
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Enrol No</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.student_id}>
                      <td>
                        <div className="font-medium">{s.student_name}</div>
                        <div className="text-sm text-gray-500">{s.father_name}</div>
                      </td>
                      <td>{s.enr_id}</td>
                      <td>
                        <div>{s.contact_no1}</div>
                        <div className="text-gray-500">{s.student_email}</div>
                      </td>
                      <td>
                        {attendanceMap[s.student_id] ? (
                          <span className={`badge ${getStatusColor(attendanceMap[s.student_id])}`}>{attendanceMap[s.student_id]}</span>
                        ) : (
                          <span className="badge badge-info">Not Marked</span>
                        )}
                      </td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="attendance-btn present" onClick={() => handleStatusChange(s.student_id, "PRESENT")} disabled={freeze}>Present</button>
                        <button className="attendance-btn absent" onClick={() => handleStatusChange(s.student_id, "ABSENT")} disabled={freeze}>Absent</button>
                        <button className="attendance-btn late" onClick={() => handleStatusChange(s.student_id, "LATE JOINED")} disabled={freeze}>Late</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
