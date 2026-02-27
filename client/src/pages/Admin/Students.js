import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";
import { 
  Users, Search, RotateCcw, FileDown, ChevronDown, 
  Info, MapPin, GraduationCap, Loader2, FileSpreadsheet, FileText, AlertCircle,
  ChevronLeft, ChevronRight 
} from "lucide-react";

import { useFetchStates, useFetchEducationDistricts, useFetchBlocks } from "../../hooks/useJurisData";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import classes from "./Students.module.css";

const API_BASE = process.env.REACT_APP_BACKEND_API_URL;

const Students = () => {
  const currentPath = ["Admin", "Academics", "Students"];

  const initialFormData = {
    enr_id: "",
    student_name: "",
    batch_id: "",
    cohort_id: "",
    gender: "",
    state_id: "",
    district_id: "",
    block_id: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [options, setOptions] = useState({ batches: [], cohorts: [] });
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  // --- Server-Side Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 50; 

  const exportRef = useRef(null);

  useFetchStates(setStates);
  useFetchEducationDistricts(formData.state_id, setDistricts);
  useFetchBlocks(formData.district_id, setBlocks);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/cohorts`);
        setOptions((prev) => ({
          ...prev,
          cohorts: (res.data.data || res.data).map((x) => ({
            value: x.cohort_number,
            label: x.cohort_name,
          })),
        }));
      } catch (err) {
        console.error("Cohort fetch error", err);
      }
    };
    fetchCohorts();
  }, []);

  const fetchBatchesByCohort = async (cohortNumber) => {
    try {
      const res = await axios.get(`${API_BASE}/api/batches/cohort/${cohortNumber}`);
      setOptions((prev) => ({
        ...prev,
        batches: (res.data.data || res.data).map((x) => ({
          value: x.batch_id,
          label: x.batch_name,
          cohort_number: x.cohort_number,
        })),
      }));
    } catch (err) {
      console.error("Batch fetch error", err);
    }
  };

  const filteredBatchOptions = useMemo(() => {
    if (!formData.cohort_id) return []; 
    return options.batches.filter(batch => Number(batch.cohort_number) === Number(formData.cohort_id));
  }, [formData.cohort_id, options.batches]);

  const geoOptions = useMemo(() => ({
    states: states.map((s) => ({ value: s.id, label: s.name })),
    districts: districts.map((d) => ({ value: d.id, label: d.name })),
    blocks: blocks.map((b) => ({ value: b.id, label: b.name })),
    gender: [
      { value: "M", label: "Male" },
      { value: "F", label: "Female" },
      { value: "O", label: "Other" },
    ],
  }), [states, districts, blocks]);

  // --- Centralized Data Fetcher ---
  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    const offset = (page - 1) * itemsPerPage;

    const apiPayload = {
      enr_id: formData.enr_id,
      name: formData.student_name,
      cohort_number: formData.cohort_id,
      batch_id: formData.batch_id,
      gender: formData.gender,
      state_id: formData.state_id,
      district_id: formData.district_id,
      block_id: formData.block_id,
      limit: itemsPerPage,
      offset: offset
    };

    const params = Object.fromEntries(Object.entries(apiPayload).filter(([_, v]) => v && v !== ""));

    try {
      const res = await axios.get(`${API_BASE}/api/search-students`, { params });
      
      const responseData = res.data.data || [];
      const total = res.data.pagination?.total || 0;

      if (responseData.length === 0) {
        if (page === 1) setToastMessage("No students found matching your criteria.");
        setResults([]);
        setTotalRecords(0);
      } else {
        setResults(responseData);
        setTotalRecords(total);
      }
    } catch (err) {
      console.error("Search failed", err);
      setToastMessage("An error occurred during search.");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Handle Search Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    
    // Simple Validation
    const newErrors = {};
    if (formData.enr_id && formData.enr_id.length < 3) newErrors.enr_id = "ID must be at least 3 characters";
    if (formData.student_name && formData.student_name.length < 3) newErrors.student_name = "Name must be at least 3 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCurrentPage(1); // Reset to page 1 for new search
    fetchStudents(1);
  };

  // Trigger fetch when page changes
  useEffect(() => {
    if (currentPage > 1 || (results.length > 0)) {
        fetchStudents(currentPage);
    }
  }, [currentPage]);

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selected, name) => {
    const value = selected?.value || "";
    setFormData((prev) => {
      const updates = { ...prev, [name]: value };
      if (name === "cohort_id") {
        updates.batch_id = "";
        if (value) fetchBatchesByCohort(value);
      }
      return updates;
    });
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults([]);
    setCurrentPage(1);
    setTotalRecords(0);
    setOptions(prev => ({ ...prev, batches: [] }));
    setErrors({});
  };

  // --- Export Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const tableColumns = ["ID", "Name", "Enroll ID", "Batch", "State", "District"];
    const tableRows = results.map(s => [s.student_id, s.student_name, s.enr_id, s.batch_name, s.state, s.district]);
    doc.setFontSize(18).text("Student Search Report (Current Page)", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`students_page_${currentPage}.pdf`);
    setIsExportOpen(false);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `students_page_${currentPage}.xlsx`);
    setIsExportOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setIsExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isQuickSearch = !!formData.enr_id;

  return (
    <div className={classes.pageContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Academics"]} />
      
      {toastMessage && (
        <div className={classes.toast} style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: '#1f2937', color: 'white', padding: '12px 20px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
           <AlertCircle size={20} color="#f87171" />
           {toastMessage}
        </div>
      )}

      <div className={classes.searchGrid}>
        <div className={classes.searchCard}>
          <header className={classes.cardHeader}>
            <Users size={24} color="#2563eb" />
            <h1>Student Search</h1>
          </header>

          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.inputWrapper}>
              <label className={classes.label}>Enrollment ID</label>
              <div className={classes.searchField}>
                <Search size={18} className={classes.innerIcon} />
                <input 
                  name="enr_id"
                  placeholder="Enter ID (e.g., ENR-2024-001)" 
                  value={formData.enr_id} 
                  onChange={handleChange}
                  style={errors.enr_id ? {borderColor: '#ef4444'} : {}}
                />
              </div>
            </div>

            <div className={classes.divider}><span>OR FILTER BY</span></div>

            <fieldset disabled={isQuickSearch} className={classes.filterGrid}>
              <div className={classes.fullWidthField}>
                <label className={classes.label}>Student Name</label>
                <div className={classes.searchField}>
                  <Users size={16} className={classes.innerIcon} />
                  <input 
                    name="student_name"
                    className={classes.input}
                    placeholder="Enter student name..."
                    value={formData.student_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={classes.dropdownGrid}>
                <CustomSelect 
                  label="Cohort" 
                  options={options.cohorts} 
                  value={options.cohorts.find(o => o.value === formData.cohort_id)} 
                  onChange={(s) => handleSelectChange(s, "cohort_id")} 
                />
                <CustomSelect 
                  label="Batch" 
                  options={filteredBatchOptions} 
                  value={filteredBatchOptions.find(o => o.value === formData.batch_id)} 
                  onChange={(s) => handleSelectChange(s, "batch_id")} 
                  isDisabled={!formData.cohort_id}
                />
                <CustomSelect 
                  label="State" 
                  options={geoOptions.states} 
                  value={geoOptions.states.find(o => o.value === formData.state_id)} 
                  onChange={(s) => handleSelectChange(s, "state_id")} 
                />
                <CustomSelect 
                  label="District" 
                  options={geoOptions.districts} 
                  value={geoOptions.districts.find(o => o.value === formData.district_id)} 
                  onChange={(s) => handleSelectChange(s, "district_id")} 
                  isDisabled={!formData.state_id} 
                />
              </div>
            </fieldset>

            <div className={classes.formActions}>
              <button type="button" onClick={handleReset} className={classes.btnGhost}><RotateCcw size={16}/> Reset</button>
              <button type="submit" className={classes.btnPrimary} disabled={loading}>
                {loading ? <Loader2 className={classes.spinner} size={18}/> : <Search size={18}/>}
                {loading ? "Searching..." : "Search Students"}
              </button>
            </div>
          </form>
        </div>

        {results.length === 0 && !loading && (
          <aside className={classes.infoPanel}>
            <Info className={classes.infoIcon} />
            <h3>Quick Search Guide</h3>
            <p>Enter an <strong>Enrollment ID</strong> for direct results, or use filters to narrow down by academic batch.</p>
          </aside>
        )}
      </div>

      {results.length > 0 && (
        <div className={classes.resultsContainer}>
          <div className={classes.resultsToolbar}>
            <h3>Results ({totalRecords})</h3>
            <div className={classes.exportWrapper} ref={exportRef}>
              <button onClick={() => setIsExportOpen(!isExportOpen)} className={classes.btnSecondary}>
                <FileDown size={16} /> Export <ChevronDown size={14} />
              </button>
              {isExportOpen && (
                <div className={classes.exportMenu}>
                  <button onClick={downloadPDF}><FileText size={14} /> Save Page as PDF</button>
                  <button onClick={downloadExcel}><FileSpreadsheet size={14} /> Save Page as Excel</button>
                </div>
              )}
            </div>
          </div>
          
          <div className={classes.tableWrapper}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Enroll ID</th>
                  <th>Cohort</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {results.map(s => (
                  <tr key={s.student_id}>
                    <td className={classes.boldText}>{s.student_name}</td>
                    <td>
                      <Link to={`/admin/academics/students/view-student-info/${s.nmms_reg_number}`} className={classes.idBadge}>
                        {s.enr_id}
                      </Link>
                    </td>
                    <td>{s.cohort_name}</td>
                    <td>{s.batch_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={classes.paginationContainer}>
               <span className={classes.pageInfo}>
                 Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} of <strong>{totalRecords}</strong>
               </span>
               <div className={classes.paginationControls}>
                 <button onClick={prevPage} disabled={currentPage === 1} className={classes.pageBtn}>
                   <ChevronLeft size={16} /> Previous
                 </button>
                 <button onClick={nextPage} disabled={currentPage === totalPages} className={classes.pageBtn}>
                   Next <ChevronRight size={16} />
                 </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CustomSelect = ({ label, icon, ...props }) => (
  <div className={classes.field}>
    <label className={classes.label}>{icon} {label}</label>
    <Select {...props} classNamePrefix="react-select" isClearable placeholder={`Any ${label}`} />
  </div>
);

export default Students;