import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Papa from "papaparse";
import "./global.css";
import { useAuth } from "../../contexts/AuthContext";

const AttendanceManagement = () => {
  const today = new Date().toISOString().split("T")[0];

  const initialFormData = {
    cohort: "",
    batch: "",
    classroom: "",
    date: today,
    startTime: "00:00",
    endTime: "00:00",
    search: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("manual"); // manual | bulk
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [freeze, setFreeze] = useState(false);

  // ---------------------------- Handlers ----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "cohort") {
      const filtered = batches.filter(
        (b) => b.cohort_number?.toString() === value.toString()
      );
      setFilteredBatches(filtered);
      setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
      setStudents([]);
      setAttendance({});
      setFreeze(false);
    }

    if (name === "batch" && value) {
      axios
        .get(`http://localhost:5000/api/coordinator/classrooms/${value}`)
        .then(({ data }) => setClassrooms(data || []))
        .catch(console.error);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setFilteredBatches([]);
    setClassrooms([]);
    setStudents([]);
    setAttendance({});
    setFreeze(false);
  };

// inside component
const auth = useAuth();

// Fetch cohorts on mount
useEffect(() => {
  if (!auth?.user?.token) return;

  axios
    .get("http://localhost:5000/api/coordinator/cohorts", {
      headers: { Authorization: `Bearer ${auth.user.token}` },
    })
    .then(({ data }) => setCohorts(data || []))
    .catch(console.error);
}, [auth?.user?.token]);

// Fetch batches whenever cohort changes
useEffect(() => {
  if (!auth?.user?.token || !formData.cohort) {
    setBatches([]);
    setFilteredBatches([]);
    return;
  }

  axios
    .get(
      `http://localhost:5000/api/coordinator/batches?cohort_number=${formData.cohort}`,
      {
        headers: { Authorization: `Bearer ${auth.user.token}` },
      }
    )
    .then(({ data }) => {
      setBatches(data || []);
      setFilteredBatches(data || []); // Update filtered batches automatically
      setFormData((prev) => ({ ...prev, batch: "", classroom: "" }));
      setStudents([]);
      setAttendance({});
      setFreeze(false);
    })
    .catch(console.error);
}, [auth?.user?.token, formData.cohort]);







  // ---------------------------- Fetch students ----------------------------
  useEffect(() => {
    if (!formData.batch || !formData.cohort) return;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/coordinator/students`, {
        params: {
          cohortNumber: formData.cohort,
          batchId: formData.batch,
        },
      })
      .then(({ data }) => setStudents(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [formData.batch, formData.cohort]);

  // ---------------------------- Fetch attendance ----------------------------
  useEffect(() => {
    if (!formData.batch || !formData.date) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const params = {
          cohortNumber: formData.cohort || null,
          batchId: formData.batch || null,
          classroomId: formData.classroom || null,
          date: formData.date || null,
        };

        // ✅ Only send times if not "00:00"
        if (formData.startTime && formData.startTime !== "00:00") {
          params.startTime = formData.startTime;
        }
        if (formData.endTime && formData.endTime !== "00:00") {
          params.endTime = formData.endTime;
        }

        const { data } = await axios.get(
          "http://localhost:5000/api/coordinator/attendance",
          { params }
        );

        // Build attendance map, defaulting to "ABSENT"
        const map = {};
        students.forEach((s) => {
          const record = (data || []).find((r) => r.student_id === s.student_id);
          map[s.student_id] = record?.status || "ABSENT";
        });

        setAttendance(map);

        const diffDays =
          (new Date() - new Date(formData.date)) / (1000 * 60 * 60 * 24);
        setFreeze(diffDays > 7);
      } catch (err) {
        console.error("Error fetching attendance", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [
    formData.cohort,
    formData.batch,
    formData.classroom,
    formData.date,
    formData.startTime,
    formData.endTime,
    students,
  ]);

  // ---------------------------- Manual attendance ----------------------------
  const handleStatusChange = (studentId, status) => {
    if (freeze) return;
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkAttendance = (status) => {
    if (freeze) return;
    const map = {};
    students.forEach((s) => (map[s.student_id] = status));
    setAttendance(map);
  };

  const handleSubmitAttendance = async () => {
    if (!formData.classroom || freeze) return;

    const records = students.map((s) => ({
      student_id: s.student_id,
      classroom_id: formData.classroom,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      status: attendance[s.student_id] || "ABSENT",
      remarks: "",
    }));

    try {
      await axios.post(
        "http://localhost:5000/api/coordinator/attendance/bulk",
        { attendanceRecords: records }
      );
      alert("Attendance saved successfully!");
      setFreeze(true);
    } catch (err) {
      console.error("Error saving attendance", err);
      alert("Error saving attendance");
    }
  };

  // ---------------------------- CSV Upload Handler ----------------------------
  const handleCSVUpload = (e) => {
    if (!formData.classroom || freeze) return;

    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const csvData = results.data;
        const updatedAttendance = {};

        csvData.forEach((row) => {
          const student = students.find(
            (s) => s.student_name === row["STUDENT NAME"]
          );
          if (!student) return;

          let status = "ABSENT";
          const startMinutes =
            parseInt(formData.startTime.split(":")[0]) * 60 +
            parseInt(formData.startTime.split(":")[1]);
          const endMinutes =
            parseInt(formData.endTime.split(":")[0]) * 60 +
            parseInt(formData.endTime.split(":")[1]);
          const totalMinutes = endMinutes - startMinutes;

          const joinedStart = row["TIME JOINED"].split(":");
          const joinedEnd = row["TIME EXITED"].split(":");
          const joinedMinutes =
            (parseInt(joinedEnd[0]) * 60 + parseInt(joinedEnd[1])) -
            (parseInt(joinedStart[0]) * 60 + parseInt(joinedStart[1]));

          const percent = (joinedMinutes / totalMinutes) * 100;

          if (percent >= 70) status = "PRESENT";
          else if (percent >= 40) status = "LATE JOINED";

          updatedAttendance[student.student_id] = status;
        });

        setAttendance(updatedAttendance);
        alert("CSV processed and attendance calculated.");
      },
    });
  };

  // ✅ Bulk submit (for CSV processed data)
  const handleSubmitBulkCSV = async () => {
    if (!formData.classroom || freeze) return;

    const records = students.map((s) => ({
      student_id: s.student_id,
      classroom_id: formData.classroom,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      status: attendance[s.student_id] || "ABSENT",
      remarks: "Uploaded via CSV",
    }));

    try {
      await axios.post(
        "http://localhost:5000/api/coordinator/attendance/bulk",
        { attendanceRecords: records }
      );
      alert("Bulk CSV Attendance saved successfully!");
      setFreeze(true);
    } catch (err) {
      console.error("Error saving bulk CSV attendance", err);
      alert("Error saving bulk CSV attendance");
    }
  };

  // ---------------------------- Helpers ----------------------------
  const getStatusColor = (status) => {
    switch (status) {
      case "PRESENT":
        return "badge-success";
      case "ABSENT":
        return "badge-danger";
      case "LATE JOINED":
        return "badge-warning";
      case "LEAVE":
        return "badge-info";
      default:
        return "badge-info";
    }
  };

  const filteredStudents = useMemo(
    () =>
      (students || []).filter(
        (s) =>
          s.student_name?.toLowerCase().includes(formData.search.toLowerCase()) ||
          s.enr_id?.toString().includes(formData.search)
      ),
    [students, formData.search]
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance Management</h1>
        <p className="page-subtitle">Mark and manage student attendance</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`btn btn-primary ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          Manual Attendance
        </button>
        <button
          className={`btn btn-primary ${activeTab === "bulk" ? "active" : ""}`}
          onClick={() => setActiveTab("bulk")}
        >
          Bulk Upload Attendance
        </button>
      </div>

      {/* Common Filters */}
      <div className="card mb-6">
        <div className="card-content form-grid">
          {/* Cohort */}
          <div className="form-group">
            <label>Cohort</label>
            <select
              name="cohort"
              value={formData.cohort}
              onChange={handleChange}
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

          {/* Batch */}
          <div className="form-group">
            <label>Batch</label>
            <select
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              className="form-select"
              disabled={!formData.cohort}
            >
              <option value="">Select Batch</option>
              {filteredBatches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Classroom */}
          <div className="form-group">
            <label>Classroom</label>
            <select
              name="classroom"
              value={formData.classroom}
              onChange={handleChange}
              className="form-select"
              disabled={!formData.batch}
            >
              <option value="">Select Classroom</option>
              {(classrooms || []).map((c) => (
                <option key={c.classroom_id} value={c.classroom_id}>
                  {c.classroom_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Start Time */}
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* End Time */}
          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Search (manual only) */}
          {activeTab === "manual" && (
            <div className="form-group">
              <label>Search Student</label>
              <input
                type="text"
                name="search"
                placeholder="Search by name or ID..."
                value={formData.search}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}

          {/* CSV Upload (bulk only) */}
          {activeTab === "bulk" && (
            <div className="form-group">
              <label>Upload CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={freeze || !formData.classroom}
                className="form-input"
              />
            </div>
          )}
        </div>

        {/* Manual Actions */}
        {activeTab === "manual" && (
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={() => handleBulkAttendance("PRESENT")}
              className="btn btn-success"
              disabled={!formData.classroom || freeze}
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => handleBulkAttendance("ABSENT")}
              className="btn btn-danger"
              disabled={!formData.classroom || freeze}
            >
              ✗ Mark All Absent
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Reset
            </button>
            <button
              onClick={handleSubmitAttendance}
              className="btn btn-primary"
              disabled={freeze || !formData.classroom}
            >
              Submit Attendance
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        {activeTab === "bulk" && (
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={handleSubmitBulkCSV}
              className="btn btn-primary"
              disabled={freeze || !formData.classroom}
            >
              Submit Bulk Attendance
            </button>
          </div>
        )}
      </div>

      {/* Student Table (manual only) */}
      {activeTab === "manual" && formData.batch && (
        <div className="card">
          <div className="card-header">
            <h3>
              Student List -{" "}
              {filteredBatches.find((b) => b.batch_id?.toString() === formData.batch)
                ?.batch_name || "N/A"}
            </h3>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrollment ID</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
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
                        {attendance[s.student_id] ? (
                          <span
                            className={`badge ${getStatusColor(attendance[s.student_id])}`}
                          >
                            {attendance[s.student_id]}
                          </span>
                        ) : (
                          <span className="badge badge-info">Not Marked</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusChange(s.student_id, "PRESENT")}
                          disabled={freeze}
                          className="attendance-btn present"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.student_id, "ABSENT")}
                          disabled={freeze}
                          className="attendance-btn absent"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.student_id, "LATE JOINED")}
                          disabled={freeze}
                          className="attendance-btn late"
                        >
                          Late
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
