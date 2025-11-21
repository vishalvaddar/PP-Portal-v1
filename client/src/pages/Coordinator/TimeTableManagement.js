// // // // client/src/pages/Coordinator/TimeTableManagement.jsx
// // // import React, { useEffect, useState } from "react";
// // // import axios from "axios";
// // // import "./global.css";
// // // import { useAuth } from "../../contexts/AuthContext";

// // // const initial = { cohort: "", batch: "" };

// // // export default function TimeTableManagement() {
// // //   const [form, setForm] = useState(initial);
// // //   const [cohorts, setCohorts] = useState([]);
// // //   const [batches, setBatches] = useState([]);
// // //   const [filteredBatches, setFilteredBatches] = useState([]);
// // //   const [classrooms, setClassrooms] = useState([]);
// // //   const [timetable, setTimetable] = useState([]);
// // //   const [editing, setEditing] = useState(null);
// // //   const [conflictsMap, setConflictsMap] = useState({});
// // //   const [slotForm, setSlotForm] = useState({
// // //     classroom_id: "",
// // //     day_of_week: "MONDAY",
// // //     start_time: "09:00",
// // //     end_time: "10:00",
// // //   });
// // //   const [loading, setLoading] = useState(false);

// // //   const auth = useAuth();
// // //   const token = auth?.user?.token;
// // //   const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

// // //   useEffect(() => {
// // //     if (!token) return;
// // //     axios
// // //       .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
// // //       .then(({ data }) => setCohorts(data || []))
// // //       .catch(console.error);
// // //   }, [token]);

// // //   useEffect(() => {
// // //     if (!token || !form.cohort) {
// // //       setBatches([]);
// // //       setFilteredBatches([]);
// // //       return;
// // //     }
// // //     axios
// // //       .get(
// // //         `http://localhost:5000/api/coordinator/batches?cohort_number=${form.cohort}`,
// // //         axiosConfig()
// // //       )
// // //       .then(({ data }) => {
// // //         setBatches(data || []);
// // //         setFilteredBatches(data || []);
// // //       })
// // //       .catch(console.error);
// // //   }, [token, form.cohort]);

// // //   useEffect(() => {
// // //     if (!token || !form.batch) {
// // //       setClassrooms([]);
// // //       setTimetable([]);
// // //       setConflictsMap({});
// // //       return;
// // //     }

// // //     axios
// // //       .get(
// // //         `http://localhost:5000/api/coordinator/classrooms/${form.batch}`,
// // //         axiosConfig()
// // //       )
// // //       .then(({ data }) => setClassrooms(data || []))
// // //       .catch(() => setClassrooms([]));

// // //     fetchTimetable(form.batch);
// // //   }, [token, form.batch]);

// // //   const fetchTimetable = async (batchId) => {
// // //     if (!batchId) return;
// // //     setLoading(true);
// // //     try {
// // //       const { data } = await axios.get(
// // //         `http://localhost:5000/api/coordinator/timetable?batchId=${batchId}`,
// // //         axiosConfig()
// // //       );
// // //       setTimetable(data || []);
// // //       setConflictsMap({});
// // //     } catch {
// // //       setTimetable([]);
// // //       setConflictsMap({});
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleFormChange = (e) => {
// // //     const { name, value } = e.target;
// // //     setForm((prev) => ({ ...prev, [name]: value }));
// // //     if (name === "cohort") setForm((prev) => ({ ...prev, batch: "" }));
// // //   };

// // //   const handleSlotChange = (e) => {
// // //     const { name, value } = e.target;
// // //     setSlotForm((prev) => ({ ...prev, [name]: value }));
// // //   };

// // //   const validateSlot = async () => {
// // //     const { classroom_id, day_of_week, start_time, end_time } = slotForm;

// // //     if (!classroom_id) return { ok: false, error: "Select classroom" };
// // //     if (!day_of_week || !start_time || !end_time)
// // //       return { ok: false, error: "Fill all fields" };
// // //     if (start_time >= end_time)
// // //       return { ok: false, error: "Start time must be before end time" };

// // //     try {
// // //       const params = new URLSearchParams({
// // //         batchId: form.batch,
// // //         classroomId: classroom_id,
// // //         day: day_of_week,
// // //         start_time,
// // //         end_time,
// // //       });

// // //       if (editing) params.append("excludeId", editing.timetable_id);

// // //       const { data } = await axios.get(
// // //         `http://localhost:5000/api/coordinator/timetable/check-conflict?${params.toString()}`,
// // //         axiosConfig()
// // //       );

// // //       if (data.overlap) {
// // //         const map = {};
// // //         data.conflicts.forEach((c) => {
// // //           map[c.timetable_id] = true;
// // //         });
// // //         setConflictsMap(map);
// // //         return { ok: false, error: "Conflict detected", conflicts: data.conflicts };
// // //       }

// // //       setConflictsMap({});
// // //       return { ok: true };
// // //     } catch {
// // //       return { ok: false, error: "Server error" };
// // //     }
// // //   };

// // //   const handleCreateOrUpdate = async () => {
// // //     const val = await validateSlot();
// // //     if (!val.ok) {
// // //       alert(val.error);
// // //       console.warn(val.conflicts);
// // //       return;
// // //     }

// // //     const payload = {
// // //       classroom_id: slotForm.classroom_id,
// // //       day_of_week: slotForm.day_of_week,
// // //       start_time: slotForm.start_time,
// // //       end_time: slotForm.end_time,
// // //     };

// // //     try {
// // //       if (editing) {
// // //         await axios.put(
// // //           `http://localhost:5000/api/coordinator/timetable/${editing.timetable_id}`,
// // //           payload,
// // //           axiosConfig()
// // //         );
// // //         alert("Updated");
// // //       } else {
// // //         await axios.post(
// // //           `http://localhost:5000/api/coordinator/timetable`,
// // //           payload,
// // //           axiosConfig()
// // //         );
// // //         alert("Created");
// // //       }

// // //       fetchTimetable(form.batch);
// // //       resetSlotForm();
// // //     } catch (err) {
// // //       alert(err.response?.data?.error || "Error");
// // //     }
// // //   };

// // //   const resetSlotForm = () => {
// // //     setSlotForm({ classroom_id: "", day_of_week: "MONDAY", start_time: "09:00", end_time: "10:00" });
// // //     setEditing(null);
// // //     setConflictsMap({});
// // //   };

// // //   const handleEdit = (row) => {
// // //     setEditing(row);
// // //     setSlotForm({
// // //       classroom_id: row.classroom_id,
// // //       day_of_week: row.day_of_week,
// // //       start_time: row.start_time,
// // //       end_time: row.end_time,
// // //     });
// // //   };

// // //   const handleDelete = async (id) => {
// // //     if (!window.confirm("Delete slot?")) return;
// // //     await axios.delete(
// // //       `http://localhost:5000/api/coordinator/timetable/${id}`,
// // //       axiosConfig()
// // //     );
// // //     fetchTimetable(form.batch);
// // //   };

// // //   return (
// // //     <div>
// // //       <div className="page-header">
// // //         <h1 className="page-title">Time Table Management</h1>
// // //         <p className="page-subtitle">Create and manage timetable slots</p>
// // //       </div>

// // //       <div className="card mb-6">
// // //         <div className="card-content form-grid">
// // //           <div className="form-group">
// // //             <label>Cohort</label>
// // //             <select name="cohort" value={form.cohort} onChange={handleFormChange} className="form-select">
// // //               <option value="">Select Cohort</option>
// // //               {cohorts.map((c) => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
// // //             </select>
// // //           </div>

// // //           <div className="form-group">
// // //             <label>Batch</label>
// // //             <select name="batch" value={form.batch} onChange={handleFormChange} className="form-select">
// // //               <option value="">Select Batch</option>
// // //               {filteredBatches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
// // //             </select>
// // //           </div>

// // //           <div className="form-group">
// // //             <label>Classroom</label>
// // //             <select name="classroom_id" value={slotForm.classroom_id} onChange={handleSlotChange} className="form-select">
// // //               <option value="">Select Classroom</option>
// // //               {classrooms.map((c) => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
// // //             </select>
// // //           </div>

// // //           <div className="form-group">
// // //             <label>Day</label>
// // //             <select name="day_of_week" value={slotForm.day_of_week} onChange={handleSlotChange} className="form-select">
// // //               <option>MONDAY</option>
// // //               <option>TUESDAY</option>
// // //               <option>WEDNESDAY</option>
// // //               <option>THURSDAY</option>
// // //               <option>FRIDAY</option>
// // //               <option>SATURDAY</option>
// // //               <option>SUNDAY</option>
// // //             </select>
// // //           </div>

// // //           <div className="form-group">
// // //             <label>Start Time</label>
// // //             <input type="time" name="start_time" value={slotForm.start_time} onChange={handleSlotChange} className="form-input" />
// // //           </div>
// // //           <div className="form-group">
// // //             <label>End Time</label>
// // //             <input type="time" name="end_time" value={slotForm.end_time} onChange={handleSlotChange} className="form-input" />
// // //           </div>

// // //           <div className="form-group" style={{ alignSelf: "flex-end" }}>
// // //             <button onClick={handleCreateOrUpdate} className="btn btn-primary">{editing ? "Update Slot" : "Create Slot"}</button>
// // //             {editing && <button onClick={resetSlotForm} className="btn btn-secondary" style={{ marginLeft: 8 }}>Cancel</button>}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <div className="card">
// // //         <div className="card-header">
// // //           <h3>
// // //             Timetable – {form.batch ? filteredBatches.find(b => String(b.batch_id) === String(form.batch))?.batch_name || "N/A" : "Select batch"}
// // //           </h3>
// // //         </div>

// // //         <div className="card-content">
// // //           {loading ? <div>Loading...</div> : (
// // //             <table className="table">
// // //               <thead>
// // //                 <tr>
// // //                   <th>Day</th>
// // //                   <th>Time</th>
// // //                   <th>Subject</th>
// // //                   <th>Teacher</th>
// // //                   <th>Classroom</th>
// // //                   <th>Class Link</th>
// // //                   <th>Actions</th>
// // //                 </tr>
// // //               </thead>

// // //               <tbody>
// // //                 {timetable.map((r) => (
// // //                   <tr key={r.timetable_id} style={{ backgroundColor: conflictsMap[r.timetable_id] ? "#ffcccc" : "transparent" }}
// // //                       title={conflictsMap[r.timetable_id] ? "Conflict detected" : ""}>
// // //                     <td>{r.day_of_week}</td>
// // //                     <td>{r.start_time} - {r.end_time}</td>
// // //                     <td>{r.subject_name || "-"}</td>
// // //                     <td>{r.teacher_name || "-"}</td>
// // //                     <td>{r.classroom_name || "-"}</td>
// // //                     <td>{r.class_link ? <a href={r.class_link} target="_blank" rel="noreferrer">Open</a> : "-"}</td>
// // //                     <td>
// // //                       <button className="btn btn-info" onClick={() => handleEdit(r)}>Edit</button>
// // //                       <button className="btn btn-danger" onClick={() => handleDelete(r.timetable_id)} style={{ marginLeft: 8 }}>Delete</button>
// // //                     </td>
// // //                   </tr>
// // //                 ))}

// // //                 {timetable.length === 0 && (
// // //                   <tr>
// // //                     <td colSpan={7}>No slots</td>
// // //                   </tr>
// // //                 )}
// // //               </tbody>
// // //             </table>
// // //           )}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }



// // // client/src/pages/Coordinator/TimeTableManagement.jsx
// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import "./global.css";
// // import { useAuth } from "../../contexts/AuthContext";

// // const initial = { cohort: "", batch: "" };

// // export default function TimeTableManagement() {
// //   const [form, setForm] = useState(initial);
// //   const [cohorts, setCohorts] = useState([]);
// //   const [batches, setBatches] = useState([]);
// //   const [filteredBatches, setFilteredBatches] = useState([]);
// //   const [classrooms, setClassrooms] = useState([]);
// //   const [timetable, setTimetable] = useState([]);
// //   const [editing, setEditing] = useState(null);
// //   const [conflictsMap, setConflictsMap] = useState({});
// //   const [slotForm, setSlotForm] = useState({
// //     classroom_id: "",
// //     day_of_week: "MONDAY",
// //     start_time: "09:00",
// //     end_time: "10:00",
// //     meeting_link: "",
// //   });
// //   const [loading, setLoading] = useState(false);

// //   const auth = useAuth();
// //   const token = auth?.user?.token;
// //   const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

// //   // Fetch cohorts
// //   useEffect(() => {
// //     if (!token) return;
// //     axios
// //       .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
// //       .then(({ data }) => setCohorts(data || []))
// //       .catch(console.error);
// //   }, [token]);

// //   // Fetch batches when cohort changes
// //   useEffect(() => {
// //     if (!token || !form.cohort) {
// //       setBatches([]);
// //       setFilteredBatches([]);
// //       return;
// //     }
// //     axios
// //       .get(
// //         `http://localhost:5000/api/coordinator/batches?cohort_number=${form.cohort}`,
// //         axiosConfig()
// //       )
// //       .then(({ data }) => {
// //         setBatches(data || []);
// //         setFilteredBatches(data || []);
// //       })
// //       .catch(console.error);
// //   }, [token, form.cohort]);

// //   // Fetch classrooms and timetable when batch selected
// //   useEffect(() => {
// //     if (!token || !form.batch) {
// //       setClassrooms([]);
// //       setTimetable([]);
// //       setConflictsMap({});
// //       return;
// //     }

// //     axios
// //       .get(
// //         `http://localhost:5000/api/coordinator/classrooms/${form.batch}`,
// //         axiosConfig()
// //       )
// //       .then(({ data }) => setClassrooms(data || []))
// //       .catch(() => setClassrooms([]));

// //     fetchTimetable(form.batch);
// //   }, [token, form.batch]);

// //   const fetchTimetable = async (batchId) => {
// //     if (!batchId) return;
// //     setLoading(true);
// //     try {
// //       const { data } = await axios.get(
// //         `http://localhost:5000/api/coordinator/timetable?batchId=${batchId}`,
// //         axiosConfig()
// //       );
// //       setTimetable(data || []);
// //       setConflictsMap({});
// //     } catch {
// //       setTimetable([]);
// //       setConflictsMap({});
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleFormChange = (e) => {
// //     const { name, value } = e.target;
// //     setForm((prev) => ({ ...prev, [name]: value }));
// //     if (name === "cohort") setForm((prev) => ({ ...prev, batch: "" }));
// //   };

// //   const handleSlotChange = (e) => {
// //     const { name, value } = e.target;
// //     setSlotForm((prev) => ({ ...prev, [name]: value }));
// //   };

// //   const validateSlot = async () => {
// //     const { classroom_id, day_of_week, start_time, end_time } = slotForm;

// //     if (!classroom_id) return { ok: false, error: "Select classroom" };
// //     if (!day_of_week || !start_time || !end_time)
// //       return { ok: false, error: "Fill all fields" };
// //     if (start_time >= end_time)
// //       return { ok: false, error: "Start time must be before end time" };

// //     try {
// //       const params = new URLSearchParams({
// //         batchId: form.batch,
// //         classroomId: classroom_id,
// //         day: day_of_week,
// //         startTime: start_time,
// //         endTime: end_time,
// //       });

// //       if (editing) params.append("excludeId", editing.timetable_id);

// //       const { data } = await axios.get(
// //         `http://localhost:5000/api/coordinator/timetable/check-conflict?${params.toString()}`,
// //         axiosConfig()
// //       );

// //       if (data.overlap) {
// //         const map = {};
// //         data.conflicts.forEach((c) => {
// //           map[c.timetable_id] = true;
// //         });
// //         setConflictsMap(map);
// //         return { ok: false, error: "Conflict detected", conflicts: data.conflicts };
// //       }

// //       setConflictsMap({});
// //       return { ok: true };
// //     } catch {
// //       return { ok: false, error: "Server error" };
// //     }
// //   };

// //   const handleCreateOrUpdate = async () => {
// //     const val = await validateSlot();
// //     if (!val.ok) {
// //       alert(val.error);
// //       console.warn(val.conflicts);
// //       return;
// //     }

// //     // Fetch teacher & subject from selected classroom
// //     const selectedClassroom = classrooms.find(
// //       (c) => String(c.classroom_id) === String(slotForm.classroom_id)
// //     );

// //     const payload = {
// //       batch_id: form.batch,
// //       classroom_id: slotForm.classroom_id,
// //       subject_id: selectedClassroom?.subject_id,
// //       teacher_id: selectedClassroom?.teacher_id,
// //       day: slotForm.day_of_week,
// //       start_time: slotForm.start_time,
// //       end_time: slotForm.end_time,
// //       meeting_link: slotForm.meeting_link || null,
// //     };

// //     try {
// //       if (editing) {
// //         await axios.put(
// //           `http://localhost:5000/api/coordinator/timetable/${editing.timetable_id}`,
// //           payload,
// //           axiosConfig()
// //         );
// //         alert("Updated");
// //       } else {
// //         await axios.post(
// //           `http://localhost:5000/api/coordinator/timetable`,
// //           payload,
// //           axiosConfig()
// //         );
// //         alert("Created");
// //       }

// //       fetchTimetable(form.batch);
// //       resetSlotForm();
// //     } catch (err) {
// //       alert(err.response?.data?.error || "Error");
// //     }
// //   };

// //   const resetSlotForm = () => {
// //     setSlotForm({
// //       classroom_id: "",
// //       day_of_week: "MONDAY",
// //       start_time: "09:00",
// //       end_time: "10:00",
// //       meeting_link: "",
// //     });
// //     setEditing(null);
// //     setConflictsMap({});
// //   };

// //   const handleEdit = (row) => {
// //     setEditing(row);
// //     setSlotForm({
// //       classroom_id: row.classroom_id,
// //       day_of_week: row.day_of_week,
// //       start_time: row.start_time,
// //       end_time: row.end_time,
// //       meeting_link: row.meeting_link || "",
// //     });
// //   };

// //   const handleDelete = async (id) => {
// //     if (!window.confirm("Delete slot?")) return;
// //     await axios.delete(
// //       `http://localhost:5000/api/coordinator/timetable/${id}`,
// //       axiosConfig()
// //     );
// //     fetchTimetable(form.batch);
// //   };

// //   return (
// //     <div>
// //       <div className="page-header">
// //         <h1 className="page-title">Time Table Management</h1>
// //         <p className="page-subtitle">Select cohort & batch to view timetable</p>
// //       </div>

// //       <div className="card mb-6">
// //         <div className="card-content form-grid">
// //           <div className="form-group">
// //             <label>Cohort</label>
// //             <select
// //               name="cohort"
// //               value={form.cohort}
// //               onChange={handleFormChange}
// //               className="form-select"
// //             >
// //               <option value="">Select Cohort</option>
// //               {cohorts.map((c) => (
// //                 <option key={c.cohort_number} value={c.cohort_number}>
// //                   {c.cohort_name}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           {form.cohort && (
// //             <div className="form-group">
// //               <label>Batch</label>
// //               <select
// //                 name="batch"
// //                 value={form.batch}
// //                 onChange={handleFormChange}
// //                 className="form-select"
// //               >
// //                 <option value="">Select Batch</option>
// //                 {filteredBatches.map((b) => (
// //                   <option key={b.batch_id} value={b.batch_id}>
// //                     {b.batch_name}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {form.batch && (
// //         <>
// //           <div className="card mb-6">
// //             <div className="card-content form-grid">
// //               <div className="form-group">
// //                 <label>Classroom</label>
// //                 <select
// //                   name="classroom_id"
// //                   value={slotForm.classroom_id}
// //                   onChange={handleSlotChange}
// //                   className="form-select"
// //                 >
// //                   <option value="">Select Classroom</option>
// //                   {classrooms.map((c) => (
// //                     <option key={c.classroom_id} value={c.classroom_id}>
// //                       {c.classroom_name}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>

// //               <div className="form-group">
// //                 <label>Day</label>
// //                 <select
// //                   name="day_of_week"
// //                   value={slotForm.day_of_week}
// //                   onChange={handleSlotChange}
// //                   className="form-select"
// //                 >
// //                   <option>MONDAY</option>
// //                   <option>TUESDAY</option>
// //                   <option>WEDNESDAY</option>
// //                   <option>THURSDAY</option>
// //                   <option>FRIDAY</option>
// //                   <option>SATURDAY</option>
// //                   <option>SUNDAY</option>
// //                 </select>
// //               </div>

// //               <div className="form-group">
// //                 <label>Start Time</label>
// //                 <input
// //                   type="time"
// //                   name="start_time"
// //                   value={slotForm.start_time}
// //                   onChange={handleSlotChange}
// //                   className="form-input"
// //                 />
// //               </div>
// //               <div className="form-group">
// //                 <label>End Time</label>
// //                 <input
// //                   type="time"
// //                   name="end_time"
// //                   value={slotForm.end_time}
// //                   onChange={handleSlotChange}
// //                   className="form-input"
// //                 />
// //               </div>

// //               <div className="form-group">
// //                 <label>Meeting Link (Optional)</label>
// //                 <input
// //                   type="text"
// //                   name="meeting_link"
// //                   value={slotForm.meeting_link}
// //                   onChange={handleSlotChange}
// //                   className="form-input"
// //                 />
// //               </div>

// //               <div className="form-group" style={{ alignSelf: "flex-end" }}>
// //                 <button
// //                   onClick={handleCreateOrUpdate}
// //                   className="btn btn-primary"
// //                 >
// //                   {editing ? "Update Slot" : "Create Slot"}
// //                 </button>
// //                 {editing && (
// //                   <button
// //                     onClick={resetSlotForm}
// //                     className="btn btn-secondary"
// //                     style={{ marginLeft: 8 }}
// //                   >
// //                     Cancel
// //                   </button>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="card">
// //             <div className="card-header">
// //               <h3>
// //                 Timetable –{" "}
// //                 {filteredBatches.find(
// //                   (b) => String(b.batch_id) === String(form.batch)
// //                 )?.batch_name || "N/A"}
// //               </h3>
// //             </div>

// //             <div className="card-content">
// //               {loading ? (
// //                 <div>Loading...</div>
// //               ) : (
// //                 <table className="table">
// //                   <thead>
// //                     <tr>
// //                       <th>Day</th>
// //                       <th>Time</th>
// //                       <th>Subject</th>
// //                       <th>Teacher</th>
// //                       <th>Classroom</th>
// //                       <th>Class Link</th>
// //                       <th>Actions</th>
// //                     </tr>
// //                   </thead>

// //                   <tbody>
// //                     {timetable.map((r) => (
// //                       <tr
// //                         key={r.timetable_id}
// //                         style={{
// //                           backgroundColor: conflictsMap[r.timetable_id]
// //                             ? "#ffcccc"
// //                             : "transparent",
// //                         }}
// //                         title={
// //                           conflictsMap[r.timetable_id]
// //                             ? "Conflict detected"
// //                             : ""
// //                         }
// //                       >
// //                         <td>{r.day_of_week}</td>
// //                         <td>
// //                           {r.start_time} - {r.end_time}
// //                         </td>
// //                         <td>{r.subject_name || "-"}</td>
// //                         <td>{r.teacher_name || "-"}</td>
// //                         <td>{r.classroom_name || "-"}</td>
// //                         <td>
// //                           {r.class_link ? (
// //                             <a
// //                               href={r.class_link}
// //                               target="_blank"
// //                               rel="noreferrer"
// //                             >
// //                               Open
// //                             </a>
// //                           ) : (
// //                             "-"
// //                           )}
// //                         </td>
// //                         <td>
// //                           <button
// //                             className="btn btn-info"
// //                             onClick={() => handleEdit(r)}
// //                           >
// //                             Edit
// //                           </button>
// //                           <button
// //                             className="btn btn-danger"
// //                             onClick={() => handleDelete(r.timetable_id)}
// //                             style={{ marginLeft: 8 }}
// //                           >
// //                             Delete
// //                           </button>
// //                         </td>
// //                       </tr>
// //                     ))}

// //                     {timetable.length === 0 && (
// //                       <tr>
// //                         <td colSpan={7}>No slots</td>
// //                       </tr>
// //                     )}
// //                   </tbody>
// //                 </table>
// //               )}
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }


// // client/src/pages/Coordinator/TimeTableManagement.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./global.css";
// import { useAuth } from "../../contexts/AuthContext";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";

// const initial = { cohort: "", batch: "" };

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
//     classroom_id: "",
//     day_of_week: "MONDAY",
//     start_time: "09:00",
//     end_time: "10:00",
//     meeting_link: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [showSlotForm, setShowSlotForm] = useState(false);

//   const auth = useAuth();
//   const token = auth?.user?.token;
//   const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

//   // Fetch cohorts
//   useEffect(() => {
//     if (!token) return;
//     axios
//       .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
//       .then(({ data }) => setCohorts(data || []))
//       .catch(console.error);
//   }, [token]);

//   // Fetch batches
//   useEffect(() => {
//     if (!token || !form.cohort) {
//       setBatches([]);
//       setFilteredBatches([]);
//       return;
//     }
//     axios
//       .get(
//         `http://localhost:5000/api/coordinator/batches?cohort_number=${form.cohort}`,
//         axiosConfig()
//       )
//       .then(({ data }) => {
//         setBatches(data || []);
//         setFilteredBatches(data || []);
//       })
//       .catch(console.error);
//   }, [token, form.cohort]);

//   // Fetch classrooms & timetable
//   useEffect(() => {
//     if (!token || !form.batch) {
//       setClassrooms([]);
//       setTimetable([]);
//       setConflictsMap({});
//       return;
//     }

//     axios
//       .get(`http://localhost:5000/api/coordinator/classrooms/${form.batch}`, axiosConfig())
//       .then(({ data }) => setClassrooms(data || []))
//       .catch(() => setClassrooms([]));

//     fetchTimetable(form.batch);
//   }, [token, form.batch]);

//   const fetchTimetable = async (batchId) => {
//     if (!batchId) return;
//     setLoading(true);
//     try {
//       const { data } = await axios.get(
//         `http://localhost:5000/api/coordinator/timetable?batchId=${batchId}`,
//         axiosConfig()
//       );
//       setTimetable(data || []);
//       setConflictsMap({});
//     } catch {
//       setTimetable([]);
//       setConflictsMap({});
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//     if (name === "cohort") setForm((prev) => ({ ...prev, batch: "" }));
//   };

//   const handleSlotChange = (e) => {
//     const { name, value } = e.target;
//     setSlotForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const validateSlot = async () => {
//     const { classroom_id, day_of_week, start_time, end_time } = slotForm;
//     if (!classroom_id) return { ok: false, error: "Select classroom" };
//     if (!day_of_week || !start_time || !end_time) return { ok: false, error: "Fill all fields" };
//     if (start_time >= end_time) return { ok: false, error: "Start time must be before end time" };

//     try {
//       const params = new URLSearchParams({
//         batchId: form.batch,
//         classroomId: classroom_id,
//         day: day_of_week,
//         startTime: start_time,
//         endTime: end_time,
//       });

//       if (editing) params.append("excludeId", editing.timetable_id);

//       const { data } = await axios.get(
//         `http://localhost:5000/api/coordinator/timetable/check-conflict?${params.toString()}`,
//         axiosConfig()
//       );

//       if (data.overlap) {
//         const map = {};
//         data.conflicts.forEach((c) => (map[c.timetable_id] = true));
//         setConflictsMap(map);
//         return { ok: false, error: "Conflict detected", conflicts: data.conflicts };
//       }

//       setConflictsMap({});
//       return { ok: true };
//     } catch {
//       return { ok: false, error: "Server error" };
//     }
//   };

//   const handleCreateOrUpdate = async () => {
//     const val = await validateSlot();
//     if (!val.ok) {
//       alert(val.error);
//       console.warn(val.conflicts);
//       return;
//     }

//     const selectedClassroom = classrooms.find(
//       (c) => String(c.classroom_id) === String(slotForm.classroom_id)
//     );

//     const payload = {
//       batch_id: form.batch,
//       classroom_id: slotForm.classroom_id,
//       subject_id: selectedClassroom?.subject_id,
//       teacher_id: selectedClassroom?.teacher_id,
//       day: slotForm.day_of_week,
//       start_time: slotForm.start_time,
//       end_time: slotForm.end_time,
//       meeting_link: slotForm.meeting_link || null,
//     };

//     try {
//       if (editing) {
//         await axios.put(
//           `http://localhost:5000/api/coordinator/timetable/${editing.timetable_id}`,
//           payload,
//           axiosConfig()
//         );
//         alert("Updated");
//       } else {
//         await axios.post(
//           `http://localhost:5000/api/coordinator/timetable`,
//           payload,
//           axiosConfig()
//         );
//         alert("Created");
//       }

//       fetchTimetable(form.batch);
//       resetSlotForm();
//       setShowSlotForm(false);
//     } catch (err) {
//       alert(err.response?.data?.error || "Error");
//     }
//   };

//   const resetSlotForm = () => {
//     setSlotForm({
//       classroom_id: "",
//       day_of_week: "MONDAY",
//       start_time: "09:00",
//       end_time: "10:00",
//       meeting_link: "",
//     });
//     setEditing(null);
//     setConflictsMap({});
//   };

//   const handleEdit = (row) => {
//     setEditing(row);
//     setSlotForm({
//       classroom_id: row.classroom_id,
//       day_of_week: row.day_of_week,
//       start_time: row.start_time,
//       end_time: row.end_time,
//       meeting_link: row.meeting_link || "",
//     });
//     setShowSlotForm(true);
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete slot?")) return;
//     await axios.delete(
//       `http://localhost:5000/api/coordinator/timetable/${id}`,
//       axiosConfig()
//     );
//     fetchTimetable(form.batch);
//   };

// const downloadPDF = () => {
//   const doc = new jsPDF();

//   doc.setFontSize(18);
//   doc.text("PRATIBHA POSHAK", 105, 20, { align: "center" });

//   doc.setFontSize(14);
//   doc.text(
//     `COHORT-${filteredBatches.find(
//       (b) => String(b.batch_id) === String(form.batch)
//     )?.batch_name || "N/A"}-TIME TABLE`,
//     105,
//     28,
//     { align: "center" }
//   );

//   const tableData = timetable.map((r) => ({
//     day: r.day_of_week,
//     time: `${r.start_time} - ${r.end_time}`,
//     subject: r.subject_name || "-",
//     teacher: (r.teacher_name || "-").replace(/\n/g, " "),
//     classroom: r.classroom_name || "-",
//     link: r.class_link ? "" : "-",
//     url: r.class_link || null,
//   }));

//   const dayRowSpan = {};
//   tableData.forEach((row) => {
//     dayRowSpan[row.day] = (dayRowSpan[row.day] || 0) + 1;
//   });

//   autoTable(doc, {
//     startY: 36,

//     head: [["Day", "Time", "Subject", "Teacher", "Classroom", "Meeting Link"]],
//     body: tableData,

//     columns: [
//       { header: "Day", dataKey: "day" },
//       { header: "Time", dataKey: "time" },
//       { header: "Subject", dataKey: "subject" },
//       { header: "Teacher", dataKey: "teacher" },
//       { header: "Classroom", dataKey: "classroom" },
//       { header: "link", dataKey: "link" },
//     ],

//     styles: { halign: "center", valign: "middle", fontSize: 9 },
//     headStyles: {
//       fillColor: [63, 81, 181],
//       textColor: 255,
//       fontStyle: "bold",
//       halign: "center",
//     },
//     alternateRowStyles: { fillColor: [245, 245, 245] },

//     columnStyles: {
//       day: { cellWidth: 22 },
//       time: { cellWidth: 28 },
//       subject: { cellWidth: 40 },
//       teacher: { cellWidth: 40 },
//       classroom: { cellWidth: 28 },
//       link: { cellWidth: 22 },
//     },

//     // --------- FIXED MERGE LOGIC ---------
//     didParseCell: function (data) {
//       if (data.section === "body" && data.column.dataKey === "day") {
//         const rowIdx = data.row.index;
//         const day = tableData[rowIdx].day;

//         if (rowIdx === 0 || tableData[rowIdx - 1].day !== day) {
//           data.cell.rowSpan = dayRowSpan[day];
//         } else {
//           data.cell.text = ""; // hide duplicate day name only
//         }
//       }
//     },

//     // --------- SAFE CLICKABLE LINK ---------
//     didDrawCell: function (data) {
//       if (data.section !== "body") return;

//       const rowIdx = data.row.index;
//       const row = tableData[rowIdx];
//       if (!row || !row.url) return;

//       if (data.column.dataKey === "link") {
//         doc.setTextColor(0, 0, 255);
//         doc.textWithLink(
//           "Open",
//           data.cell.x + 2,
//           data.cell.y + data.cell.height - 2,
//           { url: row.url }
//         );
//         doc.setTextColor(0, 0, 0);
//       }
//     },
//   });

//   doc.save("timetable.pdf");
// };


//   // --- Excel Download ---
//   const downloadExcel = () => {
//     const rows = timetable.map((r) => ({
//       Day: r.day_of_week,
//       Time: `${r.start_time} - ${r.end_time}`,
//       Subject: r.subject_name || "-",
//       Teacher: (r.teacher_name || "-").replace(/\n/g, " "),
//       Classroom: r.classroom_name || "-",
//       "Meeting Link": r.class_link || "-",
//     }));

//     const ws = XLSX.utils.json_to_sheet(rows);
//     const range = XLSX.utils.decode_range(ws["!ref"]);
//     for (let R = range.s.r; R <= range.e.r; ++R) {
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const cellAddress = { r: R, c: C };
//         const cellRef = XLSX.utils.encode_cell(cellAddress);
//         if (!ws[cellRef]) continue;
//         ws[cellRef].s = { alignment: { horizontal: "center", vertical: "center" } };
//       }
//     }

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Timetable");
//     XLSX.writeFile(wb, "timetable.xlsx");
//   };

//   const filteredTimetable = timetable.filter((r) =>
//     r.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
//     r.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
//     r.classroom_name?.toLowerCase().includes(search.toLowerCase())
//   );

//   const groupedTimetable = filteredTimetable.reduce((acc, curr) => {
//     if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
//     acc[curr.day_of_week].push(curr);
//     return acc;
//   }, {});

//   return (
//     <div>
//       <div className="page-header">
//         <h1 className="page-title">Time Table</h1>
//         <p className="page-subtitle">Note : Select cohort & batch to view timetable</p>
//       </div>

//       <div className="card mb-6">
//         <div className="card-content form-grid">
//           <div className="form-group">
//             <label>Cohort</label>
//             <select
//               name="cohort"
//               value={form.cohort}
//               onChange={handleFormChange}
//               className="form-select"
//             >
//               <option value="">Select Cohort</option>
//               {cohorts.map((c) => (
//                 <option key={c.cohort_number} value={c.cohort_number}>
//                   {c.cohort_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {form.cohort && (
//             <div className="form-group">
//               <label>Batch</label>
//               <select
//                 name="batch"
//                 value={form.batch}
//                 onChange={handleFormChange}
//                 className="form-select"
//               >
//                 <option value="">Select Batch</option>
//                 {filteredBatches.map((b) => (
//                   <option key={b.batch_id} value={b.batch_id}>
//                     {b.batch_name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       </div>

//       {form.batch && (
//         <>
//           {/* Toolbar */}
//           <div className="toolbar" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//             {!showSlotForm && (
//               <button
//                 onClick={() => setShowSlotForm(true)}
//                 className="btn btn-primary"
//               >
//                 Create Slot
//               </button>
//             )}
//             <button onClick={downloadPDF} className="btn btn-secondary">
//               Download PDF
//             </button>
//             <button onClick={downloadExcel} className="btn btn-secondary">
//               Download Excel
//             </button>
//             <input
//               type="text"
//               placeholder="Search..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="form-input"
//               style={{ flex: 1 }}
//             />
//           </div>

//           {/* Slot form */}
//           {showSlotForm && (
//             <div className="card mb-6">
//               <div className="card-content form-grid">
//                 <div className="form-group">
//                   <label>Classroom</label>
//                   <select
//                     name="classroom_id"
//                     value={slotForm.classroom_id}
//                     onChange={handleSlotChange}
//                     className="form-select"
//                   >
//                     <option value="">Select Classroom</option>
//                     {classrooms.map((c) => (
//                       <option key={c.classroom_id} value={c.classroom_id}>
//                         {c.classroom_name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="form-group">
//                   <label>Day</label>
//                   <select
//                     name="day_of_week"
//                     value={slotForm.day_of_week}
//                     onChange={handleSlotChange}
//                     className="form-select"
//                   >
//                     <option>MONDAY</option>
//                     <option>TUESDAY</option>
//                     <option>WEDNESDAY</option>
//                     <option>THURSDAY</option>
//                     <option>FRIDAY</option>
//                     <option>SATURDAY</option>
//                     <option>SUNDAY</option>
//                   </select>
//                 </div>

//                 <div className="form-group">
//                   <label>Start Time</label>
//                   <input
//                     type="time"
//                     name="start_time"
//                     value={slotForm.start_time}
//                     onChange={handleSlotChange}
//                     className="form-input"
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>End Time</label>
//                   <input
//                     type="time"
//                     name="end_time"
//                     value={slotForm.end_time}
//                     onChange={handleSlotChange}
//                     className="form-input"
//                   />
//                 </div>

//                 <div className="form-group">
//                   <label>Meeting Link (Optional)</label>
//                   <input
//                     type="text"
//                     name="meeting_link"
//                     value={slotForm.meeting_link}
//                     onChange={handleSlotChange}
//                     className="form-input"
//                   />
//                 </div>

//                 <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                   <button
//                     onClick={handleCreateOrUpdate}
//                     className="btn btn-primary"
//                   >
//                     {editing ? "Update Slot" : "Create Slot"}
//                   </button>
//                   <button
//                     onClick={() => { resetSlotForm(); setShowSlotForm(false); }}
//                     className="btn btn-secondary"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Timetable table */}
//           <div className="card">
//             <div className="card-header">
//               <h3>
//                 COHORT-{filteredBatches.find(b => String(b.batch_id) === String(form.batch))?.batch_name || "N/A"}-TIME TABLE
//               </h3>
//             </div>

//             <div className="card-content">
//               {loading ? (
//                 <div>Loading...</div>
//               ) : (
//                 <table className="table">
//                   <thead>
//                     <tr>
//                       <th>Day</th>
//                       <th>Time</th>
//                       <th>Subject</th>
//                       <th>Teacher</th>
//                       <th>Classroom</th>
//                       <th>Class Link</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {Object.keys(groupedTimetable).map((day) =>
//                       groupedTimetable[day].map((r, idx) => (
//                         <tr
//                           key={r.timetable_id}
//                           style={{
//                             backgroundColor: conflictsMap[r.timetable_id] ? "#ffcccc" : "transparent",
//                           }}
//                           title={conflictsMap[r.timetable_id] ? "Conflict detected" : ""}
//                         >
//                           <td>{idx === 0 ? day : ""}</td>
//                           <td>{r.start_time} - {r.end_time}</td>
//                           <td>{r.subject_name || "-"}</td>
//                           <td>{r.teacher_name || "-"}</td>
//                           <td>{r.classroom_name || "-"}</td>
//                           <td>
//                             {r.class_link ? (
//                               <a href={r.class_link} target="_blank" rel="noreferrer">Open</a>
//                             ) : "-"}
//                           </td>
//                           <td style={{ display: "flex", gap: 8 }}>
//                             <button className="btn btn-info" onClick={() => handleEdit(r)}>Edit</button>
//                             <button className="btn btn-danger" onClick={() => handleDelete(r.timetable_id)}>Delete</button>
//                           </td>
//                         </tr>
//                       ))
//                     )}

//                     {timetable.length === 0 && (
//                       <tr>
//                         <td colSpan={7}>No slots</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }




// client/src/pages/Coordinator/TimeTableManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./global.css";
import { useAuth } from "../../contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const initial = { cohort: "", batch: "" };

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
    classroom_id: "",
    day_of_week: "MONDAY",
    start_time: "09:00",
    end_time: "10:00",
    meeting_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSlotForm, setShowSlotForm] = useState(false);

  const auth = useAuth();
  const token = auth?.user?.token;
  const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // Fetch cohorts
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
      .then(({ data }) => setCohorts(data || []))
      .catch(console.error);
  }, [token]);

  // Fetch batches
  useEffect(() => {
    if (!token || !form.cohort) {
      setBatches([]);
      setFilteredBatches([]);
      return;
    }
    axios
      .get(
        `http://localhost:5000/api/coordinator/batches?cohort_number=${form.cohort}`,
        axiosConfig()
      )
      .then(({ data }) => {
        setBatches(data || []);
        setFilteredBatches(data || []);
      })
      .catch(console.error);
  }, [token, form.cohort]);

  // Fetch classrooms & timetable
  useEffect(() => {
    if (!token || !form.batch) {
      setClassrooms([]);
      setTimetable([]);
      setConflictsMap({});
      return;
    }

    axios
      .get(`http://localhost:5000/api/coordinator/classrooms/${form.batch}`, axiosConfig())
      .then(({ data }) => setClassrooms(data || []))
      .catch(() => setClassrooms([]));

    fetchTimetable(form.batch);
  }, [token, form.batch]);

  const fetchTimetable = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/coordinator/timetable?batchId=${batchId}`,
        axiosConfig()
      );
      setTimetable(data || []);
      setConflictsMap({});
    } catch (err) {
      console.error("fetchTimetable error:", err);
      setTimetable([]);
      setConflictsMap({});
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "cohort") setForm((prev) => ({ ...prev, batch: "" }));
  };

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------
  // validateSlot (robust)
  // ----------------------------
  const validateSlot = async () => {
    const { classroom_id, day_of_week, start_time, end_time } = slotForm;
    if (!classroom_id) return { ok: false, error: "Select classroom" };
    if (!day_of_week || !start_time || !end_time) return { ok: false, error: "Fill all fields" };
    if (start_time >= end_time) return { ok: false, error: "Start time must be before end time" };

    const params = new URLSearchParams({
      batchId: form.batch,
      classroomId: classroom_id,
      day: day_of_week,
      startTime: start_time,
      endTime: end_time,
    });

    if (editing) params.append("excludeId", editing.timetable_id);

    try {
      // Try normal request
      const res = await axios.get(
        `http://localhost:5000/api/coordinator/timetable/check-conflict?${params.toString()}`,
        axiosConfig()
      );

      // If backend returns 2xx with overlap flag (rare), handle it:
      const data = res.data;
      if (data && data.overlap) {
        const conflictsArr = Array.isArray(data.conflicts) ? data.conflicts : (data.conflict ? [data.conflict] : []);
        if (conflictsArr.length > 0) {
          const map = {};
          conflictsArr.forEach((c) => { if (c.timetable_id) map[c.timetable_id] = true; });
          setConflictsMap(map);

          // Build requested message
          let message = "Conflict detected with:\n\n";
          conflictsArr.forEach((c, i) => {
            const dayVal = c.day_of_week || c.day || day_of_week || "N/A";
            message += `${i + 1}) ${c.classroom_name || "Unknown"} | ${dayVal} | ${c.start_time || "?"}-${c.end_time || "?"}\n`;
          });
          alert(message.trim());
          return { ok: false, conflicts: conflictsArr };
        } else {
          // overlap true but no conflict details
          alert("Conflict detected");
          return { ok: false };
        }
      }

      // no overlap
      setConflictsMap({});
      return { ok: true };
    } catch (err) {
      // axios throws for non-2xx — handle conflict payload returned with 400
      if (err.response && err.response.data) {
        const backend = err.response.data;

        if (backend.overlap) {
          // backend may send `conflict` (single) or `conflicts` (array)
          const conflictsArr = Array.isArray(backend.conflicts)
            ? backend.conflicts
            : backend.conflict
            ? [backend.conflict]
            : [];

          // If still empty, try to use raw rows if backend accidentally sent them
          // (some older controllers returned rows directly)
          if (conflictsArr.length === 0 && Array.isArray(backend)) {
            backend.forEach((c) => {
              if (c && c.timetable_id) conflictsArr.push(c);
            });
          }

          if (conflictsArr.length > 0) {
            const map = {};
            conflictsArr.forEach((c) => { if (c.timetable_id) map[c.timetable_id] = true; });
            setConflictsMap(map);

            // Build requested message (uses day_of_week OR day)
            let message = "Conflict detected with:\n\n";
            conflictsArr.forEach((c, i) => {
              const dayVal = c.day_of_week || c.day || day_of_week || "N/A";
              message += `${i + 1}) ${c.classroom_name || "Unknown"} | ${dayVal} | ${c.start_time || "?"}-${c.end_time || "?"}\n`;
            });

            alert(message.trim());
            return { ok: false, conflicts: conflictsArr };
          }

          // If overlap true but no usable details:
          alert(backend.message || "Conflict detected");
          return { ok: false };
        }
      }

      console.error("validateSlot error:", err);
      return { ok: false, error: "Server error" };
    }
  };

  const handleCreateOrUpdate = async () => {
    const val = await validateSlot();
    if (!val.ok) {
      // if backend included an error string, show it (validateSlot already alerts conflicts)
      if (val.error) alert(val.error);
      return;
    }

    const selectedClassroom = classrooms.find(
      (c) => String(c.classroom_id) === String(slotForm.classroom_id)
    );

    const payload = {
      batch_id: form.batch,
      classroom_id: slotForm.classroom_id,
      subject_id: selectedClassroom?.subject_id,
      teacher_id: selectedClassroom?.teacher_id,
      day: slotForm.day_of_week,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      meeting_link: slotForm.meeting_link || null,
    };

    try {
      if (editing) {
        await axios.put(
          `http://localhost:5000/api/coordinator/timetable/${editing.timetable_id}`,
          payload,
          axiosConfig()
        );
        alert("Updated");
      } else {
        await axios.post(
          `http://localhost:5000/api/coordinator/timetable`,
          payload,
          axiosConfig()
        );
        alert("Created");
      }

      fetchTimetable(form.batch);
      resetSlotForm();
      setShowSlotForm(false);
    } catch (err) {
      console.error("create/update error:", err);
      alert(err.response?.data?.error || "Error");
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      classroom_id: "",
      day_of_week: "MONDAY",
      start_time: "09:00",
      end_time: "10:00",
      meeting_link: "",
    });
    setEditing(null);
    setConflictsMap({});
  };

  const handleEdit = (row) => {
    setEditing(row);
    setSlotForm({
      classroom_id: row.classroom_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      meeting_link: row.meeting_link || "",
    });
    setShowSlotForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete slot?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/coordinator/timetable/${id}`,
        axiosConfig()
      );
      fetchTimetable(form.batch);
    } catch (err) {
      console.error("delete error:", err);
      alert("Failed to delete slot");
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("PRATIBHA POSHAK", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text(
      `COHORT-${filteredBatches.find(
        (b) => String(b.batch_id) === String(form.batch)
      )?.batch_name || "N/A"}-TIME TABLE`,
      105,
      28,
      { align: "center" }
    );

    const tableData = timetable.map((r) => ({
      day: r.day_of_week,
      time: `${r.start_time} - ${r.end_time}`,
      subject: r.subject_name || "-",
      teacher: (r.teacher_name || "-").replace(/\n/g, " "),
      classroom: r.classroom_name || "-",
      link: r.class_link ? "" : "-",
      url: r.class_link || null,
    }));

    const dayRowSpan = {};
    tableData.forEach((row) => {
      dayRowSpan[row.day] = (dayRowSpan[row.day] || 0) + 1;
    });

    autoTable(doc, {
      startY: 36,

      head: [["Day", "Time", "Subject", "Teacher", "Classroom", "Meeting Link"]],
      body: tableData,

      columns: [
        { header: "Day", dataKey: "day" },
        { header: "Time", dataKey: "time" },
        { header: "Subject", dataKey: "subject" },
        { header: "Teacher", dataKey: "teacher" },
        { header: "Classroom", dataKey: "classroom" },
        { header: "link", dataKey: "link" },
      ],

      styles: { halign: "center", valign: "middle", fontSize: 9 },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },

      columnStyles: {
        day: { cellWidth: 22 },
        time: { cellWidth: 28 },
        subject: { cellWidth: 40 },
        teacher: { cellWidth: 40 },
        classroom: { cellWidth: 28 },
        link: { cellWidth: 22 },
      },

      didParseCell: function (data) {
        if (data.section === "body" && data.column.dataKey === "day") {
          const rowIdx = data.row.index;
          const day = tableData[rowIdx].day;

          if (rowIdx === 0 || tableData[rowIdx - 1].day !== day) {
            data.cell.rowSpan = dayRowSpan[day];
          } else {
            data.cell.text = "";
          }
        }
      },

      didDrawCell: function (data) {
        if (data.section !== "body") return;

        const rowIdx = data.row.index;
        const row = tableData[rowIdx];
        if (!row || !row.url) return;

        if (data.column.dataKey === "link") {
          doc.setTextColor(0, 0, 255);
          doc.textWithLink(
            "Open",
            data.cell.x + 2,
            data.cell.y + data.cell.height - 2,
            { url: row.url }
          );
          doc.setTextColor(0, 0, 0);
        }
      },
    });

    doc.save("timetable.pdf");
  };

  // --- Excel Download ---
  const downloadExcel = () => {
    const rows = timetable.map((r) => ({
      Day: r.day_of_week,
      Time: `${r.start_time} - ${r.end_time}`,
      Subject: r.subject_name || "-",
      Teacher: (r.teacher_name || "-").replace(/\n/g, " "),
      Classroom: r.classroom_name || "-",
      "Meeting Link": r.class_link || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { r: R, c: C };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        ws[cellRef].s = { alignment: { horizontal: "center", vertical: "center" } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, "timetable.xlsx");
  };

  const filteredTimetable = timetable.filter((r) =>
    r.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.classroom_name?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTimetable = filteredTimetable.reduce((acc, curr) => {
    if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
    acc[curr.day_of_week].push(curr);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Time Table</h1>
        <p className="page-subtitle">Note : Select cohort & batch to view timetable</p>
      </div>

      <div className="card mb-6">
        <div className="card-content form-grid">
          <div className="form-group">
            <label>Cohort</label>
            <select
              name="cohort"
              value={form.cohort}
              onChange={handleFormChange}
              className="form-select"
            >
              <option value="">Select Cohort</option>
              {cohorts.map((c) => (
                <option key={c.cohort_number} value={c.cohort_number}>
                  {c.cohort_name}
                </option>
              ))}
            </select>
          </div>

          {form.cohort && (
            <div className="form-group">
              <label>Batch</label>
              <select
                name="batch"
                value={form.batch}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="">Select Batch</option>
                {filteredBatches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {form.batch && (
        <>
          {/* Toolbar */}
          <div className="toolbar" style={{ display: "flex", gap: 8, marginBottom: 16 }}> 
            {!showSlotForm && (
              <button
                onClick={() => setShowSlotForm(true)}
                className="btn btn-primary"
              >
                Create Slot
              </button>
            )}
            <button onClick={downloadPDF} className="btn btn-secondary">
              Download PDF
            </button>
            <button onClick={downloadExcel} className="btn btn-secondary">
              Download Excel
            </button>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>

          {/* Slot form */}
          {showSlotForm && (
            <div className="card mb-6">
              <div className="card-content form-grid">
                <div className="form-group">
                  <label>Classroom</label>
                  <select
                    name="classroom_id"
                    value={slotForm.classroom_id}
                    onChange={handleSlotChange}
                    className="form-select"
                  >
                    <option value="">Select Classroom</option>
                    {classrooms.map((c) => (
                      <option key={c.classroom_id} value={c.classroom_id}>
                        {c.classroom_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Day</label>
                  <select
                    name="day_of_week"
                    value={slotForm.day_of_week}
                    onChange={handleSlotChange}
                    className="form-select"
                  >
                    <option>MONDAY</option>
                    <option>TUESDAY</option>
                    <option>WEDNESDAY</option>
                    <option>THURSDAY</option>
                    <option>FRIDAY</option>
                    <option>SATURDAY</option>
                    <option>SUNDAY</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={slotForm.start_time}
                    onChange={handleSlotChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={slotForm.end_time}
                    onChange={handleSlotChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Meeting Link (Optional)</label>
                  <input
                    type="text"
                    name="meeting_link"
                    value={slotForm.meeting_link}
                    onChange={handleSlotChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={handleCreateOrUpdate}
                    className="btn btn-primary"
                  >
                    {editing ? "Update Slot" : "Create Slot"}
                  </button>
                  <button
                    onClick={() => { resetSlotForm(); setShowSlotForm(false); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timetable table */}
          <div className="card">
            <div className="card-header">
              <h3>
                COHORT-{filteredBatches.find(b => String(b.batch_id) === String(form.batch))?.batch_name || "N/A"}-TIME TABLE
              </h3>
            </div>

            <div className="card-content">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Classroom</th>
                      <th>Class Link</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.keys(groupedTimetable).map((day) =>
                      groupedTimetable[day].map((r, idx) => (
                        <tr
                          key={r.timetable_id}
                          style={{
                            backgroundColor: conflictsMap[r.timetable_id] ? "#ffcccc" : "transparent",
                          }}
                          title={conflictsMap[r.timetable_id] ? "Conflict detected" : ""}
                        >
                          <td>{idx === 0 ? day : ""}</td>
                          <td>{r.start_time} - {r.end_time}</td>
                          <td>{r.subject_name || "-"}</td>
                          <td>{r.teacher_name || "-"}</td>
                          <td>{r.classroom_name || "-"}</td>
                          <td>
                            {r.class_link ? (
                              <a href={r.class_link} target="_blank" rel="noreferrer">Open</a>
                            ) : "-"}
                          </td>
                          <td style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-info" onClick={() => handleEdit(r)}>Edit</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(r.timetable_id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}

                    {timetable.length === 0 && (
                      <tr>
                        <td colSpan={7}>No slots</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
