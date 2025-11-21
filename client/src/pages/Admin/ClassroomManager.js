import React, { useEffect, useState } from "react";
import axios from "axios";

const ClassroomManager = () => {
  const BASE = `${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator`;

  const [classrooms, setClassrooms] = useState([]);

  // Dropdown data
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cohorts, setCohorts] = useState([]);

  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  const [formData, setFormData] = useState({
    subject_id: "",
    teacher_id: "",
    platform_id: "",
    class_link: "",
    description: "",
    active_yn: "Y",
    created_by: 1,
    updated_by: 1,
  });

  const [autoName, setAutoName] = useState("");

  // Load master data
  const loadSubjects = async () => {
    const res = await axios.get(`${BASE}/subjects`);
    setSubjects(res.data);
  };

  const loadTeachers = async () => {
    const res = await axios.get(`${BASE}/teachers`);
    setTeachers(res.data);
  };

  const loadPlatforms = async () => {
    const res = await axios.get(`${BASE}/platforms`);
    setPlatforms(res.data);
  };

  const loadCohorts = async () => {
    const res = await axios.get(`${BASE}/cohorts`);
    setCohorts(res.data);
  };

  const loadBatches = async () => {
    const res = await axios.get(`${BASE}/batches`);
    setBatches(res.data);
  };

  const loadClassrooms = async () => {
    const res = await axios.get(`${BASE}/classrooms`);
    setClassrooms(res.data);
  };

  // Load all data on mount
  useEffect(() => {
    loadSubjects();
    loadTeachers();
    loadPlatforms();
    loadBatches();
    loadCohorts();          // ✔ FIX ADDED
    loadClassrooms();
  }, []);

  // Auto-generate classroom name
  useEffect(() => {
    if (!formData.subject_id || !formData.teacher_id) return;

    const subject = subjects.find((s) => s.subject_id == formData.subject_id);
    const teacher = teachers.find((t) => t.teacher_id == formData.teacher_id);

    if (!subject || !teacher) return;

    // Handle both short_code and shortname safely
    const subjectCode = subject.short_code || subject.shortname || "SUB";
    const teacherCode = teacher.short_code || teacher.shortname || "TCH";

    const baseName = `${subjectCode}-${teacherCode}`;

    const matching = classrooms.filter((c) =>
      c.classroom_name?.startsWith(baseName)
    );

    const nextNumber = String(matching.length + 1).padStart(2, "0");

    setAutoName(`${baseName}-${nextNumber}`);
  }, [formData.subject_id, formData.teacher_id, classrooms]);

  // Save classroom
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!autoName) return alert("Classroom name not generated!");

    const payload = {
      ...formData,
      classroom_name: autoName,
      batch_id: selectedBatch,
    };

    await axios.post(`${BASE}/classrooms`, payload);

    loadClassrooms();

    setFormData({
      subject_id: "",
      teacher_id: "",
      platform_id: "",
      class_link: "",
      description: "",
      active_yn: "Y",
      created_by: 1,
      updated_by: 1,
    });

    setAutoName("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Classroom Manager</h1>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>Create New Classroom</h2>

        <form onSubmit={handleSubmit}>
          {/* Subject */}
          <label>Subject</label>
          <select
            value={formData.subject_id}
            onChange={(e) =>
              setFormData({ ...formData, subject_id: e.target.value })
            }
            required
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          {/* Teacher */}
          <label>Teacher</label>
          <select
            value={formData.teacher_id}
            onChange={(e) =>
              setFormData({ ...formData, teacher_id: e.target.value })
            }
            required
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.teacher_name}
              </option>
            ))}
          </select>

          {/* Platform */}
          <label>Teaching Platform</label>
          <select
            value={formData.platform_id}
            onChange={(e) =>
              setFormData({ ...formData, platform_id: e.target.value })
            }
          >
            <option value="">Select Platform</option>
            {platforms.map((p) => (
              <option key={p.platform_id} value={p.platform_id}>
                {p.platform_name}
              </option>
            ))}
          </select>

          {/* Cohort */}
          <label>Select Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
          >
            <option value="">Select Cohort</option>
            {cohorts.map((c) => (
              <option key={c.cohort_number} value={c.cohort_number}>
                {c.cohort_name}
              </option>
            ))}
          </select>

          {/* Batch */}
          <label>Assign to Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            required
          >
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_name}
              </option>
            ))}
          </select>

          {/* Auto Name */}
          <div
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            Classroom Name: {autoName || "—"}
          </div>

          {/* Description */}
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          {/* Submit */}
          <button type="submit" style={{ marginTop: "10px" }}>
            Save Classroom
          </button>
        </form>
      </div>

      {/* All Classrooms */}
      <h2>All Classrooms</h2>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Classroom Name</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Platform</th>
            <th>Active</th>
          </tr>
        </thead>

        <tbody>
          {classrooms.map((c) => (
            <tr key={c.classroom_id}>
              <td>{c.classroom_id}</td>
              <td>{c.classroom_name}</td>
              <td>{c.subject_name}</td>
              <td>{c.teacher_name}</td>
              <td>{c.platform_name}</td>
              <td>{c.active_yn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassroomManager;
