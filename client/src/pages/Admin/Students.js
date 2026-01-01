import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import autoTable from "jspdf-autotable";
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  FileDown,
  AlertTriangle,
  ChevronDown,
  MapPin,
} from "lucide-react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import {
  useFetchStates,
  useFetchEducationDistricts,
  useFetchBlocks,
} from "../../hooks/useJurisData"; // Imported custom hooks
import classes from "./Students.module.css";

// --- Download Utility Functions (Kept same as before) ---
const downloadCSV = (data, filename) => {
  if (!data.length) return;
  const ws = XLSX.utils.json_to_sheet(
    data.map((s) => ({
      "Student ID": s.student_id,
      Name: s.student_name,
      "Enroll ID": s.enr_id,
      Gender: s.gender,
      Batch: s.batch_name,
      Cohort: s.cohort_name,
      "NMMS Year": s.nmms_year,
      State: s.state,
      District: s.district,
      Block: s.block,
    }))
  );
  const csv = XLSX.utils.sheet_to_csv(ws);
  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
};

// ... (downloadExcel and downloadPDF functions remain unchanged) ...
const downloadPDF = (data, filename) => {
    if (!data.length) return;
    const doc = new jsPDF("l");
    const tableColumns = ["ID", "Name", "Enroll ID", "Gender", "Batch", "State", "District"];
    const tableRows = data.map((s) => [
      s.student_id,
      s.student_name,
      s.enr_id,
      s.gender,
      s.batch_name,
      s.state,
      s.district
    ]);
    doc.setFontSize(18).text("Student Search Report", 14, 22);
    autoTable(doc, { startY: 35, head: [tableColumns], body: tableRows });
    doc.save(`${filename}.pdf`);
};

const genderOptions = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

const Students = () => {
  const currentPath = ["Admin", "Academics", "Students"];

  // --- State for Filters ---
  const initialFilters = useMemo(
    () => ({
      name: "",
      enr_id: "",
      batch: "",
      cohort: "",
      gender: "",
      // Location IDs for hooks
      state_id: "",
      district_id: "",
      block_id: "",
    }),
    []
  );

  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState("quick");
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  
  // --- Dropdown Data States ---
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [cohortOptions, setCohortOptions] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);

  const downloadMenuRef = useRef(null);

  // --- 1. Implement Location Hooks ---
  useFetchStates(setStates);
  useFetchEducationDistricts(filters.state_id, setDistricts);
  useFetchBlocks(filters.district_id, setBlocks);

  // --- Memoized Options for React Select ---
  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.id, label: s.name })),
    [states]
  );
  const districtOptions = useMemo(
    () => districts.map((d) => ({ value: d.id, label: d.name })),
    [districts]
  );
  const blockOptions = useMemo(
    () => blocks.map((b) => ({ value: b.id, label: b.name })),
    [blocks]
  );

  // --- Fetch Batches/Cohorts ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      setDropdownsLoading(true);
      try {
        const [batchesRes, cohortsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches`),
          axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/cohorts`)
        ]);
        setBatchOptions((batchesRes.data.data || batchesRes.data).map((b) => ({
          value: b.batch_id, // Assuming ID is better for filter
          label: b.batch_name,
        })));
        setCohortOptions((cohortsRes.data.data || cohortsRes.data).map((c) => ({
          value: c.cohort_id,
          label: c.cohort_name,
        })));
      } catch (err) {
        console.error("Failed to fetch dropdown options", err);
      } finally {
        setDropdownsLoading(false);
      }
    };
    if (searchMode === "advanced") fetchDropdownData();
  }, [searchMode]);

  // --- Search Logic ---
  const fetchStudents = useCallback(async (currentFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/search-students`,
        { params: currentFilters, timeout: 15000 }
      );
      setResults(data.data || []);
    } catch (err) {
      setError("Failed to fetch students.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // --- Handlers ---
  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (selectedOption, name) => {
    setFilters((prev) => {
      const updated = { ...prev, [name]: selectedOption ? selectedOption.value : "" };
      
      // Cascading Reset Logic
      if (name === "state_id") {
        updated.district_id = "";
        updated.block_id = "";
        setDistricts([]);
        setBlocks([]);
      } else if (name === "district_id") {
        updated.block_id = "";
        setBlocks([]);
      }
      return updated;
    });
  };

  const searchStudents = useCallback(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v && v !== "")
    );
    fetchStudents(activeFilters);
  }, [filters, fetchStudents]);

  const clearAll = useCallback(() => {
    setFilters(initialFilters);
    // Manually clear lists that hooks rely on
    setDistricts([]);
    setBlocks([]);
    fetchStudents();
  }, [initialFilters, fetchStudents]);

  return (
    <div className={classes.pageContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Academics"]} />
      
      <div className={classes.searchCard}>
        <div className={classes.header}>
          <div className={classes.headerIcon}><Users size={28} /></div>
          <div>
            <h1 className={classes.title}>Students</h1>
            <p className={classes.subtitle}>Search student records.</p>
          </div>
        </div>

        <div className={classes.searchModeToggle}>
          <button onClick={() => setSearchMode("quick")} className={`${classes.toggleButton} ${searchMode === "quick" ? classes.active : ""}`}>
            <Search size={16} /> Quick Search
          </button>
          <button onClick={() => setSearchMode("advanced")} className={`${classes.toggleButton} ${searchMode === "advanced" ? classes.active : ""}`}>
            <Filter size={16} /> Advanced Search
          </button>
        </div>

        <div className={classes.filtersContainer}>
          {searchMode === "quick" ? (
            <div className={classes.filtersGrid}>
              <input name="name" placeholder="Student Name" className={classes.input} value={filters.name} onChange={handleChange} />
              <input name="enr_id" placeholder="Enroll ID" className={classes.input} value={filters.enr_id} onChange={handleChange} />
            </div>
          ) : (
            <div className={classes.filtersGrid}>
              {/* Batch & Cohort */}
              <div className={classes.formGroup}>
                <label className={classes.label}>Batch</label>
                <Select
                  options={batchOptions}
                  value={batchOptions.find((o) => String(o.value) === String(filters.batch))}
                  onChange={(s) => handleSelectChange(s, "batch")}
                  placeholder="Select Batch"
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
              <div className={classes.formGroup}>
                <label className={classes.label}>Cohort</label>
                <Select
                  options={cohortOptions}
                  value={cohortOptions.find((o) => String(o.value) === String(filters.cohort))}
                  onChange={(s) => handleSelectChange(s, "cohort")}
                  placeholder="Select Cohort"
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>

              {/* Standard Fields */}
              <div className={classes.formGroup}>
                <label className={classes.label}>Gender</label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find((o) => o.value === filters.gender)}
                  onChange={(s) => handleSelectChange(s, "gender")}
                  placeholder="Any"
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
              <div className={classes.formGroup}>
                  <label className={classes.label}>Name</label>
                  <input name="name" className={classes.input} value={filters.name} onChange={handleChange} placeholder="Student Name" />
              </div>

              {/* --- New Location Dropdowns --- */}
              <div className={classes.formGroup}>
                <label className={classes.label}><MapPin size={12}/> State</label>
                <Select
                  options={stateOptions}
                  value={stateOptions.find((o) => o.value === filters.state_id)}
                  onChange={(s) => handleSelectChange(s, "state_id")}
                  placeholder="Select State"
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>

              <div className={classes.formGroup}>
                <label className={classes.label}><MapPin size={12}/> District</label>
                <Select
                  options={districtOptions}
                  value={districtOptions.find((o) => o.value === filters.district_id)}
                  onChange={(s) => handleSelectChange(s, "district_id")}
                  placeholder="Select District"
                  isDisabled={!filters.state_id}
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>

              <div className={classes.formGroup}>
                <label className={classes.label}><MapPin size={12}/> Block</label>
                <Select
                  options={blockOptions}
                  value={blockOptions.find((o) => o.value === filters.block_id)}
                  onChange={(s) => handleSelectChange(s, "block_id")}
                  placeholder="Select Block"
                  isDisabled={!filters.district_id}
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
            </div>
          )}
        </div>

        <div className={classes.actions}>
          <button onClick={clearAll} className={`${classes.btn} ${classes.btnSecondary}`} disabled={loading}>
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={searchStudents} className={`${classes.btn} ${classes.btnPrimary}`} disabled={loading}>
            <Search size={18} /> Search
          </button>
        </div>

        {/* Results Table (Same as before) */}
        {results.length > 0 && (
          <div className={classes.tableContainer}>
             <div className={classes.resultsHeader}>
                <span className={classes.resultCount}>Found <strong>{results.length}</strong> students</span>
                 <div className={classes.downloadContainer} ref={downloadMenuRef}>
                    <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className={`${classes.btn} ${classes.btnIcon}`}>
                       <FileDown size={16} /> Download <ChevronDown size={16} />
                    </button>
                    {isDownloadMenuOpen && (
                       <div className={classes.downloadDropdown}>
                          <button onClick={() => { downloadPDF(results, "report"); setIsDownloadMenuOpen(false); }}>PDF</button>
                          {/* <button onClick={() => { downloadExcel(results, "report"); setIsDownloadMenuOpen(false); }}>Excel</button> */}
                       </div>
                    )}
                 </div>
             </div>
             <div className={classes.tableWrapper}>
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Enroll ID</th>
                      <th>Batch</th>
                      <th>State</th>
                      <th>District</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_id}</td>
                        <td>{student.student_name}</td>
                        <td><Link to={`#`} className={classes.studentLink}>{student.enr_id}</Link></td>
                        <td>{student.batch_name}</td>
                        <td>{student.state}</td>
                        <td>{student.district}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;