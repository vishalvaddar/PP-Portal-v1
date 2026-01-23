import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";
import { 
  Users, Search, RotateCcw, FileDown, ChevronDown, 
  Info, MapPin, GraduationCap, Loader2, FileSpreadsheet, FileText, AlertCircle 
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
  
  // --- New Validation States ---
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const exportRef = useRef(null);

  // --- Jurisdictional Data Hooks ---
  useFetchStates(setStates);
  useFetchEducationDistricts(formData.state_id, setDistricts);
  useFetchBlocks(formData.district_id, setBlocks);

  // --- Fetch Initial Metadata (Cohorts Only) ---
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

  // --- Fetch Batches when Cohort is selected ---
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

  // --- Filter Batches based on Cohort Selection ---
  const filteredBatchOptions = useMemo(() => {
    if (!formData.cohort_id) return []; 
    return options.batches.filter(batch => Number(batch.cohort_number) === Number(formData.cohort_id));
  }, [formData.cohort_id, options.batches]);

  // --- Memoized Geo & Static Options ---
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

  // --- Export Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const tableColumns = ["ID", "Name", "Enroll ID", "Batch", "State", "District"];
    const tableRows = results.map(s => [s.student_id, s.student_name, s.enr_id, s.batch_name, s.state, s.district]);

    doc.setFontSize(18).text("Student Search Report", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`students_${Date.now()}.pdf`);
    setIsExportOpen(false);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `students_${Date.now()}.xlsx`);
    setIsExportOpen(false);
  };

  // --- Handlers ---
  
  // Generic Text Input Handler with Error Clearing
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear error for this field if user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    // Clear global toast if user interacts
    if (toastMessage) setToastMessage("");
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selected, name) => {
    const value = selected?.value || "";
    
    // Clear global toast if user interacts
    if (toastMessage) setToastMessage("");

    setFormData((prev) => {
      const updates = { ...prev, [name]: value };
      
      if (name === "cohort_id") {
        updates.batch_id = "";
        if (value) {
          fetchBatchesByCohort(value);
        } else {
          setOptions(prevOpt => ({ ...prevOpt, batches: [] }));
        }
      }
      
      if (name === "state_id") {
        updates.district_id = "";
        updates.block_id = "";
      }
      if (name === "district_id") {
        updates.block_id = "";
      }
      return updates;
    });
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults([]);
    setOptions(prev => ({ ...prev, batches: [] }));
    setErrors({});
    setToastMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setToastMessage("");
    
    // --- VALIDATION START ---
    
    // 1. Check if ANY field has a value
    const hasValues = Object.values(formData).some(val => val !== "" && val !== null && val !== undefined);
    
    if (!hasValues) {
      setToastMessage("Please select at least one criteria to search.");
      return; // STOP execution here
    }

    // 2. Length Checks (Optional but recommended)
    const newErrors = {};
    if (formData.enr_id && formData.enr_id.length < 3) {
      newErrors.enr_id = "ID must be at least 3 characters";
    }
    if (formData.student_name && formData.student_name.length < 3) {
      newErrors.student_name = "Name must be at least 3 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // STOP execution if input is invalid
    }
    
    // --- VALIDATION END ---

    setLoading(true);

    const apiPayload = {
      enr_id: formData.enr_id,
      name: formData.student_name,
      cohort_number: formData.cohort_id,
      batch_id: formData.batch_id,
      gender: formData.gender,
      state_id: formData.state_id, // Ensure backend handles this if you send it
      district_id: formData.district_id,
      block_id: formData.block_id
    };

    const params = Object.fromEntries(
      Object.entries(apiPayload).filter(([_, v]) => v && v !== "")
    );

    try {
      const res = await axios.get(`${API_BASE}/api/search-students`, { params });
      
      if (!res.data?.data?.length) {
        setToastMessage("No students found matching your criteria.");
        setResults([]);
      } else {
        setResults(res.data.data);
      }
    } catch (err) {
      console.error("Search failed", err);
      setToastMessage("An error occurred during search.");
    } finally {
      setLoading(false);
    }
  };

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-clear Toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const isQuickSearch = !!formData.enr_id;

  return (
    <div className={classes.pageContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Academics"]} />
      
      {/* Toast Notification */}
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
            <h1>Student</h1>
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
              {errors.enr_id && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.enr_id}</span>}
            </div>

            <div className={classes.divider}><span>OR FILTER BY</span></div>

            <fieldset disabled={isQuickSearch} className={classes.filterGrid}>
              <div className={classes.field}>
                <label className={classes.label}>Student Name</label>
                <input 
                  name="student_name"
                  className={classes.input}
                  placeholder="Name"
                  value={formData.student_name}
                  onChange={handleChange}
                  style={errors.student_name ? {borderColor: '#ef4444'} : {}}
                />
                {errors.student_name && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.student_name}</span>}
              </div>
              
              <CustomSelect 
                label="Cohort" 
                options={options.cohorts} 
                value={options.cohorts.find(o => o.value === formData.cohort_id)} 
                onChange={(s) => handleSelectChange(s, "cohort_id")} 
              />

              <CustomSelect 
                label="Batch" 
                icon={<GraduationCap size={14}/>} 
                options={filteredBatchOptions} 
                value={filteredBatchOptions.find(o => o.value === formData.batch_id)} 
                onChange={(s) => handleSelectChange(s, "batch_id")} 
                isDisabled={!formData.cohort_id}
                placeholder={!formData.cohort_id ? "Select Cohort First" : "Any Batch"}
              />

              <CustomSelect 
                label="State" 
                icon={<MapPin size={14}/>} 
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
            <p>Enter a specific <strong>Enrollment ID</strong> for a direct result, or use the filters to narrow down by academic batch or location.</p>
          </aside>
        )}
      </div>

      {results.length > 0 && (
        <div className={classes.resultsContainer}>
          <div className={classes.resultsToolbar}>
            <h3>Results ({results.length})</h3>
            <div className={classes.exportWrapper} ref={exportRef}>
              <button onClick={() => setIsExportOpen(!isExportOpen)} className={classes.btnSecondary}>
                <FileDown size={16} /> Export <ChevronDown size={14} />
              </button>
              {isExportOpen && (
                <div className={classes.exportMenu}>
                  <button onClick={downloadPDF}><FileText size={14} /> Save as PDF</button>
                  <button onClick={downloadExcel}><FileSpreadsheet size={14} /> Save as Excel</button>
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
                      <Link to={`/admin/admissions/view-student-info/${s.nmms_reg_number}`} className={classes.idBadge}>
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
        </div>
      )}
    </div>
  );
};

const CustomSelect = ({ label, icon, ...props }) => (
  <div className={classes.field}>
    <label className={classes.label}>{icon} {label}</label>
    <Select {...props} classNamePrefix="react-select" isClearable placeholder={props.placeholder || `Any ${label}`} />
  </div>
);

export default Students;