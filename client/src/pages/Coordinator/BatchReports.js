import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Calendar, Users, Layers, BarChart3, Loader2, Download, 
  ChevronDown, FileText, Package, Play, ClipboardList, User
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../assets/RCF-PP.jpg";

import PrintCSS from "./PrintCSS";
import StudentReportView from "./StudentReportView";
import TeacherClassCountsView from "./TeacherClassCountsView";

// ===================================================
// INTERNAL VIEW COMPONENT (ASCENDING SORT + CONDITIONAL STYLING)
// ===================================================
const ClassSessionListView = ({ reportData, reportType }) => {
  const sessions = useMemo(() => {
    return (reportData?.classes || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [reportData]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  if (sessions.length === 0) return <p className="text-center py-10 text-gray-400">No sessions found.</p>;

  // Check if we should hide batch column
  const isBatchReport = reportType === "batch_class_details";

  return (
    <div className="report-data-output">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Sl No</th>
            <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Date</th>
            <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Teacher</th>
            <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Cohort</th>
            {!isBatchReport && <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Batch</th>}
            <th style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center' }}>Classroom</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const isMissingAttendance = isBatchReport && s.attendance_marked === false;
            return (
              <tr key={i} style={{ 
                textAlign: 'center', 
                background: isMissingAttendance ? '#fee2e2' : 'transparent' 
              }}>
                <td style={{ border: '1px solid #f1f5f9', padding: '10px' }}>{i + 1}</td>
                <td style={{ border: '1px solid #f1f5f9', padding: '10px' }}>{formatDate(s.date)}</td>
                <td style={{ border: '1px solid #f1f5f9', padding: '10px', fontWeight: '600' }}>{s.teacher_name}</td>
                <td style={{ border: '1px solid #f1f5f9', padding: '10px' }}>{s.cohort_name}</td>
                {!isBatchReport && <td style={{ border: '1px solid #f1f5f9', padding: '10px' }}>{s.batch_name}</td>}
                <td style={{ border: '1px solid #f1f5f9', padding: '10px', color: '#0369a1' }}>{s.classroom_name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isBatchReport && (
        <div style={{ marginTop: '15px', padding: '10px', borderLeft: '4px solid #ef4444', background: '#fef2f2', fontSize: '13px', color: '#b91c1c' }}>
          <strong>* Note:</strong> Rows highlighted in <strong>Red</strong> indicate class sessions where attendance has not yet been marked for this batch.
        </div>
      )}
    </div>
  );
};

const BACKEND_BASE = process.env.REACT_APP_BACKEND_API_URL;
const COORDINATOR_BASE = `${BACKEND_BASE}/api/coordinator`;
const API_BASE = `${BACKEND_BASE}/api/coordinator/reports`;

export default function BatchReports() {
  const auth = useAuth();
  const token = auth?.user?.token;
  const userId = auth?.user?.user_id ?? auth?.user?.id ?? null;

  const todayISO = new Date().toISOString().split("T")[0];
  const sevenDaysAgoISO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    reportType: "student_attendance",
    cohort: "", batch: "", teacherId: "", fromDate: sevenDaysAgoISO, toDate: todayISO,
  });

  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  useEffect(() => {
    const handleClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatDateLabel = (dateString) => {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    return `${d}/${m}/${y}`;
  };

  const getReportTitle = () => {
    if (formData.reportType === "student_attendance") {
      const cohortObj = cohorts.find(c => String(c.cohort_number) === String(formData.cohort));
      const batchObj = batches.find(b => String(b.batch_id) === String(formData.batch));
      return (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>PRATIBHA POSHAK ATTENDANCE REPORT</h2>
          <p style={{ fontSize: '13px', margin: '2px 0', fontWeight: '600' }}>({cohortObj?.cohort_name || "N/A"} - {batchObj?.batch_name || "N/A"})</p>
        </div>
      );
    }
    let title = "PRATIBHA POSHAK REPORT";
    if (formData.reportType === "teacher_class_counts") title = "PRATIBHA POSHAK TEACHER CLASS COUNTS";
    if (formData.reportType === "teacher_class_details") title = "PRATIBHA POSHAK CLASS REPORT";
    if (formData.reportType === "batch_class_details") title = "PRATIBHA POSHAK BATCHWISE CLASS REPORT";

    return (
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{title}</h2>
      </div>
    );
  };

  const imageUrlToDataURL = (url) => fetch(url).then((res) => res.blob()).then((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
  })); 

  useEffect(() => {
    if (!token) return;
    setMetaLoading(true);

    axios.get(`${COORDINATOR_BASE}/cohorts`, { headers: authHeaders, params: userId ? { userId } : {} })
      .then(res => setCohorts((res.data || []).map(r => ({ cohort_number: r.cohort_number, cohort_name: r.cohort_name }))))
      .catch(() => setApiError("Failed to load cohorts."));

    axios.get(`${API_BASE}/coordinator-teachers`, { headers: authHeaders, params: { user_id: userId, fromDate: "1970-01-01", toDate: "2100-01-01" } })
      .then(res => {
        const rawTeachers = res.data || [];
        const uniqueTeachers = Array.from(
          new Map(rawTeachers.map(t => [t.teacher_id, t])).values()
        );
        setTeacherOptions(uniqueTeachers);
      })
      .catch(() => setApiError("Failed to load teachers."))
      .finally(() => setMetaLoading(false));
  }, [token, userId, authHeaders]);
  
  useEffect(() => {
    if (!token || !formData.cohort) { setBatches([]); return; }
    axios.get(`${COORDINATOR_BASE}/batches?cohort_number=${encodeURIComponent(formData.cohort)}`, { headers: authHeaders })
      .then(res => setBatches((res.data || []).map(r => ({ batch_id: r.batch_id, batch_name: r.batch_name }))));
  }, [formData.cohort, token, authHeaders]);

  const generateReport = async () => {
    const { reportType, batch, teacherId } = formData;
    if ((reportType === "student_attendance" || reportType === "batch_class_details") && !batch) return alert("Select batch.");
    if (reportType === "teacher_class_details" && !teacherId) return alert("Select teacher.");

    setApiError(null); setReportData(null); setReportLoading(true);
    try {
      let endpoint = reportType === "student_attendance" ? "attendance" : 
                     reportType === "teacher_class_counts" ? "teacher-load" : 
                     reportType === "teacher_class_details" ? "teacher-class-details" : "batch-class-details";

      const res = await axios.get(`${API_BASE}/${endpoint}`, { 
        headers: authHeaders, 
        params: { batchId: batch, teacherId, fromDate: formData.fromDate, toDate: formData.toDate } 
      });
      setReportData(res.data || {});
    } catch (err) { setApiError("Failed to generate report."); } 
    finally { setReportLoading(false); }
  };

  const exportReport = async (format) => {
    if (!reportData) return alert("Generate report first.");
    const reportTitleText = document.querySelector(".report-title-main h2")?.innerText || "REPORT";
    setExportOpen(false);

    if (format === "excel") {
      const workbook = XLSX.utils.book_new();
      let rows = [[reportTitleText], [`From: ${formatDateLabel(formData.fromDate)}  To: ${formatDateLabel(formData.toDate)}`], []];
      
      if (formData.reportType === "batch_class_details") {
          const sorted = (reportData.classes || []).sort((a, b) => new Date(a.date) - new Date(b.date));
          rows.push(["Sl No", "Date", "Teacher", "Cohort", "Classroom", "Attendance Status"]);
          sorted.forEach((r, idx) => rows.push([
              idx+1, 
              formatDateLabel(r.date.split('T')[0]), 
              r.teacher_name, 
              r.cohort_name, 
              r.classroom_name,
              r.attendance_marked ? "Marked" : "PENDING"
          ]));
      } else if (formData.reportType === "teacher_class_details") {
          const sorted = (reportData.classes || []).sort((a, b) => new Date(a.date) - new Date(b.date));
          rows.push(["Sl No", "Date", "Teacher", "Cohort", "Batch", "Classroom"]);
          sorted.forEach((r, idx) => rows.push([idx+1, formatDateLabel(r.date.split('T')[0]), r.teacher_name, r.cohort_name, r.batch_name, r.classroom_name]));
      } else if (formData.reportType === "student_attendance") {
          const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});
          rows.push(["Sl No", "Student", ...allSubjects, "Attended", "%"]);
          (reportData.students || []).forEach((st, idx) => {
            rows.push([idx + 1, st.name || st.student_name, ...allSubjects.map(s => st.attended?.[s] ?? 0), st.attended_classes, `${st.attendance_percent}%`]);
          });
      } else {
          rows.push(["Sl No", "Teacher", "Cohort", "Classroom", "Subject", "Total"]);
          (reportData.teacherClassCounts || []).forEach((r, idx) => {
            rows.push([idx + 1, r.teacher, r.cohort, r.classroom, r.subject_code || r.subject, r.total_classes_taken]);
          });
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, ws, "Report");
      XLSX.writeFile(workbook, `${reportTitleText}.xlsx`);
    }

    if (format === "pdf") {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let logoDataUrl = null;
      try { logoDataUrl = await imageUrlToDataURL(Logo); } catch (e) {}

      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(reportTitleText, (pageWidth - doc.getTextWidth(reportTitleText)) / 2, 45);
      
      if (logoDataUrl) { doc.addImage(logoDataUrl, "JPEG", pageWidth - 80, 15, 45, 45); }

      doc.setFontSize(9);
      doc.text(`From: ${formatDateLabel(formData.fromDate)}`, 40, 75);
      doc.text(`To: ${formatDateLabel(formData.toDate)}`, pageWidth - 120, 75);
      
      let columns = [], body = [];
      const isBatchDetails = formData.reportType === "batch_class_details";

      if (isBatchDetails) {
          const sorted = (reportData.classes || []).sort((a, b) => new Date(a.date) - new Date(b.date));
          columns = ["Sl No", "Date", "Teacher", "Cohort", "Classroom"];
          body = sorted.map((r, i) => [i + 1, formatDateLabel(r.date.split('T')[0]), r.teacher_name, r.cohort_name, r.classroom_name]);
          
          autoTable(doc, { 
              startY: 90, head: [columns], body: body, theme: "grid", 
              headStyles: { fillColor: [16, 185, 129] }, 
              styles: { fontSize: 7, halign: 'center' },
              didDrawCell: (data) => {
                  if (data.section === 'body' && sorted[data.row.index]?.attendance_marked === false) {
                      doc.setFillColor(255, 226, 226); // Light Red
                      doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                      doc.setTextColor(0, 0, 0);
                      doc.text(data.cell.text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
                  }
              }
          });
      } else if (formData.reportType === "teacher_class_details") {
          const sorted = (reportData.classes || []).sort((a, b) => new Date(a.date) - new Date(b.date));
          columns = ["Sl No", "Date", "Teacher", "Cohort", "Batch", "Classroom"];
          body = sorted.map((r, i) => [i + 1, formatDateLabel(r.date.split('T')[0]), r.teacher_name, r.cohort_name, r.batch_name, r.classroom_name]);
          autoTable(doc, { startY: 90, head: [columns], body: body, theme: "grid", headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 7, halign: 'center' } });
      } else if (formData.reportType === "student_attendance") {
          const allSubjects = Object.keys(reportData?.totalConductedBySubject || {});
          columns = ["Sl No", "Student", ...allSubjects, "Attended", "%"];
          body = (reportData.students || []).map((st, i) => [i+1, st.name || "-", ...allSubjects.map(s => st.attended?.[s] ?? 0), st.attended_classes, `${st.attendance_percent}%`]);
          autoTable(doc, { startY: 90, head: [columns], body: body, theme: "grid", headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 7, halign: 'center' } });
      } else {
          columns = ["Sl No", "Teacher", "Cohort", "Classroom", "Subject", "Classes"];
          body = (reportData.teacherClassCounts || []).map((r, i) => [i+1, r.teacher, r.cohort, r.classroom, r.subject_code || r.subject, r.total_classes_taken]);
          autoTable(doc, { startY: 90, head: [columns], body: body, theme: "grid", headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 7, halign: 'center' } });
      }
      doc.save(`${reportTitleText}.pdf`);
    }
  };

  return (
    <div className="reports-page-container">
      <PrintCSS />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
             <div>
                <h1 className="title">Reports Management</h1>
                <p className="subtitle">Analytical tracking and insights</p>
             </div>
          </div>
          <div className="export-menu-wrapper" ref={exportRef}>
            <button className="btn primary" onClick={() => setExportOpen(!exportOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Export <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div className="export-dropdown shadow-lg">
                <button onClick={() => exportReport('pdf')}><FileText size={14} className="mr-2 inline" /> PDF Document</button>
                <button onClick={() => exportReport('excel')}><Package size={14} className="mr-2 inline" /> Excel Sheet</button>
              </div>
            )}
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-item">
            <BarChart3 className="input-icon" />
            <select value={formData.reportType} onChange={(e) => setFormData({ ...formData, reportType: e.target.value, cohort: "", batch: "", teacherId: "" })}>
                <option value="student_attendance">ATTENDANCE REPORT</option>
                <option value="teacher_class_counts">TEACHER REMUNERATION REPORT</option>
                <option value="teacher_class_details">TEACHER-WISE CLASS REPORT</option>
                <option value="batch_class_details">BATCH-WISE CLASS REPORT</option>
            </select>
          </div>

          {formData.reportType === "teacher_class_details" ? (
             <div className="filter-item"><User className="input-icon" /><select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}><option value="">Select Teacher</option>{teacherOptions.map((t, idx) => <option key={idx} value={t.teacher_id}>{t.teacher_name || t.name}</option>)}</select></div>
          ) : (
             <div className="filter-item"><Layers className="input-icon" /><select value={formData.cohort} onChange={(e) => setFormData({ ...formData, cohort: e.target.value, batch: "" })}><option value="">Select Cohort</option>{cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}</select></div>
          )}

          {(formData.reportType === "student_attendance" || formData.reportType === "batch_class_details") && (
            <div className="filter-item"><Users className="input-icon" /><select value={formData.batch} disabled={!formData.cohort} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}><option value="">Select Batch</option>{batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}</select></div>
          )}

          <div className="filter-item"><Calendar className="input-icon" /><input type="date" value={formData.fromDate} onChange={(e) => setFormData({...formData, fromDate: e.target.value})} /></div>
          <div className="filter-item"><Calendar className="input-icon" /><input type="date" value={formData.toDate} onChange={(e) => setFormData({...formData, toDate: e.target.value})} /></div>
          <button className="btn primary" onClick={generateReport} disabled={reportLoading} style={{ marginLeft: 'auto' }}>{reportLoading ? <Loader2 className="animate-spin" size={18}/> : <Play size={18}/>} Generate</button>
        </div>

        <div className="table-wrapper shadow-md rounded-lg bg-white">
          {!reportData ? (
              <div className="text-center py-32 text-gray-400">
                <ClipboardList size={64} className="mb-4 opacity-20 inline-block" />
                <p>Select parameters and click Generate.</p>
              </div>
          ) : (
            <div style={{ padding: '20px' }}>
              <div className="report-title-main" style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#f8fafc' }}>
                  {getReportTitle()}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                      <span>From: {formatDateLabel(formData.fromDate)}</span>
                      <span>To: {formatDateLabel(formData.toDate)}</span>
                  </div>
              </div>
              <div className="report-data-output">
                {formData.reportType === "student_attendance" && <StudentReportView reportData={reportData} fromDate={formData.fromDate} toDate={formData.toDate} hideHeader={true} />}
                {formData.reportType === "teacher_class_counts" && <TeacherClassCountsView reportData={reportData} fromDate={formData.fromDate} toDate={formData.toDate} hideHeader={true} />}
                {(formData.reportType === "batch_class_details" || formData.reportType === "teacher_class_details") && <ClassSessionListView reportData={reportData} reportType={formData.reportType} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .reports-page-container { background: #f8fafc; min-height: 100vh; padding-bottom: 50px; }
        .filter-bar { display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
        .filter-item { position: relative; flex: 1; min-width: 180px; }
        .filter-item select, .filter-item input { width: 100%; padding: 8px 8px 8px 32px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; height: 38px; box-sizing: border-box; background: white; }
        .input-icon { position: absolute; left: 10px; top: 10px; size: 16px; color: #94a3b8; pointer-events: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .export-dropdown { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-radius: 8px; padding: 4px 0; z-index: 1000; min-width: 180px; }
        .export-dropdown button { width: 100%; padding: 10px 16px; border: none; background: none; text-align: left; cursor: pointer; font-size: 13px; color: #334155; }
        .report-data-output table { width: 100%; border-collapse: collapse; }
        .report-data-output th { background: #f8fafc; padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; font-weight: 800; }
        .report-data-output td { padding: 12px; border: 1px solid #f1f5f9; font-size: 13px; text-align: center; }
      `}</style>
    </div>
  );
}