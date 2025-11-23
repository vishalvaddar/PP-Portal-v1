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

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  /* -------------------------
     Fetch Cohorts  
  -------------------------*/
  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/coordinator/cohorts", axiosConfig())
      .then(({ data }) => setCohorts(data || []))
      .catch(console.error);
  }, [token]);

  /* -------------------------
     Fetch Batches  
  -------------------------*/
  useEffect(() => {
    if (!token || !form.cohort) {
      setFilteredBatches([]);
      setBatches([]);
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

  /* -------------------------
     Fetch Classrooms + Timetable  
  -------------------------*/
  useEffect(() => {
    if (!token || !form.batch) {
      setClassrooms([]);
      setTimetable([]);
      setConflictsMap({});
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/coordinator/classrooms/${form.batch}`,
        axiosConfig()
      )
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

  /* -------------------------
     Form Handlers  
  -------------------------*/
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "cohort") setForm((prev) => ({ ...prev, batch: "" }));
  };

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm((prev) => ({ ...prev, [name]: value }));
  };


    /* -------------------------
     SLOT VALIDATION (with conflict check)  
  -------------------------*/
  const validateSlot = async () => {
    const { classroom_id, day_of_week, start_time, end_time } = slotForm;
    if (!classroom_id) return { ok: false, error: "Select classroom" };
    if (!day_of_week || !start_time || !end_time)
      return { ok: false, error: "Fill all fields" };
    if (start_time >= end_time)
      return { ok: false, error: "Start time must be before end time" };

    const params = new URLSearchParams({
      batchId: form.batch,
      classroomId: classroom_id,
      day: day_of_week,
      startTime: start_time,
      endTime: end_time,
    });

    if (editing) params.append("excludeId", editing.timetable_id);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/coordinator/timetable/check-conflict?${params.toString()}`,
        axiosConfig()
      );

      if (res.data?.overlap) {
        const conflicts = res.data.conflicts || [];
        setConflictsMap(
          conflicts.reduce((a, c) => {
            a[c.timetable_id] = true;
            return a;
          }, {})
        );

        alert(
          conflicts
            .map(
              (c, i) =>
                `${i + 1}) ${c.classroom_name} | ${c.day} | ${c.start_time}-${c.end_time}`
            )
            .join("\n")
        );

        return { ok: false };
      }

      setConflictsMap({});
      return { ok: true };
    } catch (err) {
      console.error("validateSlot error", err);
      return { ok: false, error: "Server error" };
    }
  };

  /* -------------------------
     CREATE / UPDATE SLOT  
  -------------------------*/
  const handleCreateOrUpdate = async () => {
    const val = await validateSlot();
    if (!val.ok) {
      if (val.error) alert(val.error);
      return;
    }

    const classroom = classrooms.find(
      (c) => String(c.classroom_id) === String(slotForm.classroom_id)
    );

    const payload = {
      batch_id: form.batch,
      classroom_id: slotForm.classroom_id,
      subject_id: classroom?.subject_id,
      teacher_id: classroom?.teacher_id,
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
      console.error("create/update error", err);
      alert(err.response?.data?.error || "Error");
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      classroom_id: "",
      day_of_week: "MONDAY",
      start_time: "6:15",
      end_time: "7:25",
      meeting_link: "",
    });
    setEditing(null);
    setConflictsMap({});
  };

  /* -------------------------
     DELETE SLOT  
  -------------------------*/
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

  /* -------------------------
     SORTED DAYS (SUNDAY → SATURDAY)  
  -------------------------*/
  const DAY_ORDER = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const filteredTimetable = timetable.filter(
    (r) =>
      r.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.classroom_name?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTimetable = filteredTimetable.reduce((acc, curr) => {
    if (!acc[curr.day_of_week]) acc[curr.day_of_week] = [];
    acc[curr.day_of_week].push(curr);
    return acc;
  }, {});

  const orderedDays = DAY_ORDER.filter((d) => groupedTimetable[d]);

    /* -------------------------
     UPDATED PDF EXPORT  
  -------------------------*/
  const downloadPDF = async () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // -----------------------------------------
  // Load Logo
  // -----------------------------------------
  let logoDataUrl = null;
  try {
    const logoFetch = await fetch(require("../../assets/RCF-PP.jpg"));
    const blob = await logoFetch.blob();
    logoDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("⚠️ Logo load failed");
  }

  const pageWidth = doc.internal.pageSize.getWidth();

  // -----------------------------------------
  // HEADER
  // -----------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  const batchName =
    filteredBatches.find((b) => String(b.batch_id) === String(form.batch))
      ?.batch_name || "N/A";

  const titleLines = [
    "PRATIBHA POSHAK",
    `COHORT - ${batchName} - TIME TABLE`,
  ];

  let baseY = 40;

  titleLines.forEach((line, i) => {
    const x = (pageWidth - doc.getTextWidth(line)) / 2;
    doc.text(line, x, baseY + i * 18);
  });

  // -----------------------------------------
  // Logo (Top-right)
  // -----------------------------------------
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "JPEG", pageWidth - 100, 20, 60, 60);
  }

  // -----------------------------------------
  // Table Data
  // -----------------------------------------
 // SORTED TABLE DATA (SUNDAY → SATURDAY)
  const tableData = DAY_ORDER
  .filter((day) => groupedTimetable[day])   // keep only days that exist
  .flatMap((day) =>
    groupedTimetable[day].map((r) => ({
      day: day,
      time: `${r.start_time} - ${r.end_time}`,
      subject: r.subject_name || "-",
      teacher: (r.teacher_name || "-").replace(/\n/g, " "),
      classroom: r.classroom_name || "-",
      link: r.class_link ? "" : "-",
      url: r.class_link || null,
    }))
  );


  const dayRowSpan = {};
  tableData.forEach((row) => {
    dayRowSpan[row.day] = (dayRowSpan[row.day] || 0) + 1;
  });

  // -----------------------------------------
  // TABLE
  // -----------------------------------------
 autoTable(doc, {
  startY: 100,

  columns: [
    { header: "Day", dataKey: "day" },
    { header: "Time", dataKey: "time" },
    { header: "Subject", dataKey: "subject" },
    { header: "Teacher", dataKey: "teacher" },
    { header: "Classroom", dataKey: "classroom" },
    { header: "link", dataKey: "link" },
  ],

  body: tableData,

  theme: "grid",
  tableWidth: "auto",
  margin: { left: 20, right: 20 },

  headStyles: {
    fillColor: [16, 185, 129],
    textColor: 255,
    fontSize: 10,
    halign: "center"
  },

  styles: {
    fontSize: 9,
    cellPadding: 3,
    halign: "center",
    valign: "middle"
  },

  columnStyles: {
    day: { cellWidth: 70 },
    time: { cellWidth: 80 },
    subject: { cellWidth: 110 },
    teacher: { cellWidth: 110 },
    classroom: { cellWidth: 120 },
    link: { cellWidth: 50 }
  },

  didParseCell: function (data) {
    if (data.section !== "body") return;

    // Handle DAY merge
    if (data.column.dataKey === "day") {
      const rowIdx = data.row.index;
      const day = tableData[rowIdx].day;

      // First row of the day → set rowSpan
      if (rowIdx === 0 || tableData[rowIdx - 1].day !== day) {
        data.cell.rowSpan = dayRowSpan[day];
      } 
      // Subsequent rows → blank the cell
      else {
        data.cell.text = "";
      }
    }
  },

  didDrawCell: function (data) {
    if (data.section !== "body") return;

    const row = tableData[data.row.index];

    // Clickable link
    if (data.column.dataKey === "link" && row.url) {
      doc.setTextColor(0, 0, 255);
      doc.textWithLink("Open", data.cell.x + 5, data.cell.y + data.cell.height - 5, {
        url: row.url,
      });
      doc.setTextColor(0, 0, 0);
    }
  }
});


  doc.save("timetable.pdf");
};


  /* -------------------------
     EXCEL EXPORT  
  -------------------------*/
  const downloadExcel = () => {
    const rows = timetable.map((r) => ({
      Day: r.day_of_week,
      Time: `${r.start_time} - ${r.end_time}`,
      Subject: r.subject_name || "-",
      Teacher: r.teacher_name || "-",
      Classroom: r.classroom_name || "-",
      "Meeting Link": r.class_link || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, "timetable.xlsx");
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

  /* -------------------------
     UI  
  -------------------------*/
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
                    {orderedDays.map((day) =>
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
