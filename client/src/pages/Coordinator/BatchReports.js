import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./global.css";
import { useAuth } from "../../contexts/AuthContext";

const today = new Date().toISOString().split("T")[0];

const sampleTeachers = [
  "Mrs. Bharti Mam",
  "Dr. Vineet Sir",
  "Dr. Kirti Mam",
  "Dr. Rakhi Mam",
  "Dr. Sunil Sir",
  "Dr. Sarasija Suresh",
];

const sampleStudents = [
  { enr_id: "1001", student_name: "Alice" },
  { enr_id: "1002", student_name: "Bob" },
  { enr_id: "1003", student_name: "Charlie" },
  { enr_id: "1004", student_name: "David" },
];

const BatchReports = () => {
  const auth = useAuth();

  const initialFormData = {
    cohort: "",
    batch: "",
    subjects: [],
    reportType: "monthly",
    fromDate: today,
    toDate: today,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // ---------------- Fetch cohorts ----------------
  useEffect(() => {
    if (!auth?.user?.token) return;
    axios
      .get("http://localhost:5000/api/coordinator/cohorts", {
        headers: { Authorization: `Bearer ${auth.user.token}` },
      })
      .then(({ data }) => setCohorts(data || []))
      .catch(console.error);
  }, [auth?.user?.token]);

  // ---------------- Fetch batches ----------------
  useEffect(() => {
    if (!auth?.user?.token || !formData.cohort) {
      setBatches([]);
      setFilteredBatches([]);
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/coordinator/batches?cohort_number=${formData.cohort}`,
        { headers: { Authorization: `Bearer ${auth.user.token}` } }
      )
      .then(({ data }) => {
        setBatches(data || []);
        setFilteredBatches(data || []);
        setFormData((prev) => ({ ...prev, batch: "", subjects: [] }));
        setSubjects([]);
        setReportData([]);
      })
      .catch(console.error);
  }, [auth?.user?.token, formData.cohort]);

  // ---------------- Fetch subjects ----------------
  useEffect(() => {
    if (!auth?.user?.token || !formData.batch) return;
    axios
      .get(`http://localhost:5000/api/coordinator/subjects?batchId=${formData.batch}`, {
        headers: { Authorization: `Bearer ${auth.user.token}` },
      })
      .then(({ data }) => setSubjects(data || []))
      .catch(console.error);
  }, [auth?.user?.token, formData.batch]);

  // ---------------- Handlers ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "cohort") {
      const filtered = batches.filter(
        (b) => b.cohort_number?.toString() === value.toString()
      );
      setFilteredBatches(filtered);
      setFormData((prev) => ({ ...prev, batch: "", subjects: [] }));
      setSubjects([]);
      setReportData([]);
    }
  };

  const handleSubjectChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, value] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s !== value),
      }));
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setFilteredBatches([]);
    setSubjects([]);
    setReportData([]);
  };

  // ---------------- Fetch Report ----------------
  const fetchReport = async () => {
    if (!formData.batch || formData.subjects.length === 0) {
      alert("Please select batch and at least one subject");
      return;
    }

    setLoadingReport(true);
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/coordinator/attendance/report",
        {
          params: {
            cohortNumber: formData.cohort,
            batchId: formData.batch,
            subjects: formData.subjects.join(","),
            reportType: formData.reportType,
            fromDate: formData.fromDate,
            toDate: formData.toDate,
          },
          headers: { Authorization: `Bearer ${auth.user.token}` },
        }
      );
      setReportData(data.length > 0 ? data : generateMockReport());
    } catch (err) {
      console.error(err);
      setReportData(generateMockReport());
    } finally {
      setLoadingReport(false);
    }
  };

  // ---------------- Helpers ----------------
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

  // ---------------- Mock Report ----------------
  const generateMockReport = () => {
    const totalClasses = { MATH: 3, PHY: 2, ENG: 2, ST: 1, BGY: 2, CHEM: 2 };
    const classesTaken = { MATH: 3, PHY: 2, ENG: 0, ST: 0, BGY: 2, CHEM: 2 };

    return {
      totalClasses,
      classesTaken,
      students: sampleStudents.map((s) => ({
        ...s,
        attendance: formData.subjects.reduce((acc, sid, idx) => {
          const subj = subjects.find((s) => s.subject_id.toString() === sid);
          acc[subj?.subject_name || `Sub${sid}`] = Math.floor(
            Math.random() * (totalClasses[subj?.subject_name] + 1)
          );
          return acc;
        }, {}),
      })),
    };
  };

  // ---------------- Export PDF ----------------
  const exportPDF = () => {
    if (!reportData.students) return;

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text(
      `COHORT - ${formData.cohort}, BATCH - ${formData.batch} ATTENDANCE REPORT - ${formData.reportType.toUpperCase()}`,
      10,
      10
    );
    doc.setFontSize(12);
    doc.text(`MONTH: July`, 10, 18);
    doc.text(`DATE: ${today}`, 150, 18);

    let y = 28;
    let x = 10;

    // Actual vs Taken classes
    doc.text("The actual class needs to be conducted", x, y);
    let colX = 90;
    formData.subjects.forEach((sid) => {
      const subj = subjects.find((s) => s.subject_id.toString() === sid);
      doc.text(`${subj?.subject_name} (${reportData.totalClasses[subj?.subject_name] || 0})`, colX, y);
      colX += 25;
    });
    doc.text(
      `Total = ${Object.values(reportData.totalClasses).reduce((a, b) => a + b, 0)}`,
      colX,
      y
    );

    y += 8;
    doc.text("Class has been taken", x, y);
    colX = 90;
    formData.subjects.forEach((sid) => {
      const subj = subjects.find((s) => s.subject_id.toString() === sid);
      doc.text(`${subj?.subject_name} (${reportData.classesTaken[subj?.subject_name] || 0})`, colX, y);
      colX += 25;
    });
    doc.text(
      `Total = ${Object.values(reportData.classesTaken).reduce((a, b) => a + b, 0)}`,
      colX,
      y
    );

    // Table header
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Enrollment ID", "Student Name", "Batch", ...sampleTeachers]],
      body: reportData.students.map((s) => [
        s.enr_id,
        s.student_name,
        formData.batch,
        ...sampleTeachers.map(
          (t, idx) => s.attendance[Object.keys(s.attendance)[idx]] ?? "-"
        ),
      ]),
    });

    doc.save(`Batch_Report_${formData.batch}.pdf`);
  };

  // ---------------- Export Excel ----------------
  const exportExcel = () => {
    if (!reportData.students) return;

    const wsData = [
      [
        `COHORT - ${formData.cohort}`,
        `BATCH - ${formData.batch}`,
        `ATTENDANCE REPORT - ${formData.reportType.toUpperCase()}`,
      ],
      [`MONTH: July`, `DATE: ${today}`],
      [],
      ["The actual class needs to be conducted", ...formData.subjects.map((sid) => {
        const subj = subjects.find((s) => s.subject_id.toString() === sid);
        return `${subj?.subject_name} (${reportData.totalClasses[subj?.subject_name] || 0})`;
      }), `Total = ${Object.values(reportData.totalClasses).reduce((a, b) => a + b, 0)}`],
      ["Class has been taken", ...formData.subjects.map((sid) => {
        const subj = subjects.find((s) => s.subject_id.toString() === sid);
        return `${subj?.subject_name} (${reportData.classesTaken[subj?.subject_name] || 0})`;
      }), `Total = ${Object.values(reportData.classesTaken).reduce((a, b) => a + b, 0)}`],
      [],
      ["Enrollment ID", "Student Name", "Batch", ...sampleTeachers],
      ...reportData.students.map((s) => [
        s.enr_id,
        s.student_name,
        formData.batch,
        ...sampleTeachers.map(
          (t, idx) => s.attendance[Object.keys(s.attendance)[idx]] ?? "-"
        ),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Batch_Report_${formData.batch}.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance Reports</h1>
        <p className="page-subtitle">Generate subject-wise attendance reports</p>
      </div>

      {/* Form */}
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

          {/* Subjects as checkboxes */}
          <div className="form-group">
            <label>Subjects</label>
            <div className="checkbox-group">
              {subjects.map((s) => (
                <label key={s.subject_id} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={s.subject_id}
                    checked={formData.subjects.includes(s.subject_id.toString())}
                    onChange={handleSubjectChange}
                    disabled={!formData.batch}
                  />
                  {s.subject_name}
                </label>
              ))}
            </div>
          </div>

          {/* Report Type */}
          <div className="form-group">
            <label>Report Type</label>
            <select
              name="reportType"
              value={formData.reportType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Date Range */}
          {formData.reportType === "custom" && (
            <>
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <button onClick={fetchReport} className="btn btn-primary">
            Generate Report
          </button>
          <button onClick={handleReset} className="btn btn-secondary ml-2">
            Reset
          </button>
          <button onClick={exportPDF} className="btn btn-success ml-2">
            Export PDF
          </button>
          <button onClick={exportExcel} className="btn btn-info ml-2">
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchReports;
