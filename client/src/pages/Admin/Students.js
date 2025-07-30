import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import Select from "react-select";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  FileDown,
  AlertTriangle,
  Info,
  ChevronDown,
} from "lucide-react";

import classes from "./Students.module.css";

const downloadCSV = (data, filename) => {
  if (!data.length) return;
  const ws = XLSX.utils.json_to_sheet(
    data.map(
      ({ student_id, student_name, enr_id, gender, batch, cohort_name, nmms_year }) => ({
        "Student ID": student_id, Name: student_name, "Enroll ID": enr_id, Gender: gender,
        Batch: batch, Cohort: cohort_name, "NMMS Year": nmms_year,
      })
    )
  );
  const csv = XLSX.utils.sheet_to_csv(ws);
  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
};
const downloadExcel = (data, filename) => {
  if (!data.length) return;
  const ws = XLSX.utils.json_to_sheet(
     data.map(
      ({ student_id, student_name, enr_id, gender, batch, cohort_name, nmms_year }) => ({
        "Student ID": student_id, Name: student_name, "Enroll ID": enr_id, Gender: gender,
        Batch: batch, Cohort: cohort_name, "NMMS Year": nmms_year,
      })
    )
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
const downloadPDF = (data, filename) => {
  if (!data.length) return;
  const doc = new jsPDF();
  const tableColumns = ["ID", "Name", "Enroll ID", "Gender", "Batch", "Cohort", "NMMS Year"];
  const tableRows = data.map((s) => [ s.student_id, s.student_name, s.enr_id, s.gender, s.batch, s.cohort_name, s.nmms_year ]);
  doc.setFontSize(18).text("Student Search Report", 14, 22);
  doc.setFontSize(11).setTextColor(100).text(`Generated on: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`, 14, 29);
  autoTable(doc, {
    startY: 35, head: [tableColumns], body: tableRows, theme: "striped",
    headStyles: { fillColor: [0, 86, 179] },
  });
  doc.save(`${filename}.pdf`);
};

const genderOptions = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];


const Students = () => {
  const initialFilters = useMemo(() => ({
    name: "", enr_id: "", batch: "", cohort: "", gender: "",
  }), []);

  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState("quick");
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef(null);


  const fetchStudents = useCallback(async (currentFilters = {}) => {
    setLoading(true);
    console.log("Sending filters:", currentFilters);
    setError(null);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/search-students`,
        { params: currentFilters, timeout: 15000 }
      );
      setResults(data.data || []);
    } catch (err) {
      const message =
        err.code === "ECONNABORTED" ? "Search timed out. Please try again."
        : err.response?.status >= 500 ? "A server error occurred. Please try again later."
        : "Failed to fetch students. Please check your connection.";
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilters(initialFilters);
  }, [searchMode, initialFilters]);

  const handleChange = useCallback((e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSelectChange = useCallback((selectedOption, name) => {
    setFilters((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : "" }));
  }, []);

  const handleDownload = useCallback((format) => {
    if (!results.length) return;
    const filename = `student-report-${new Date().toISOString().split("T")[0]}`;
    const exportFuncs = { pdf: downloadPDF, excel: downloadExcel, csv: downloadCSV };
    const selectedFunc = exportFuncs[format];
    if (selectedFunc) selectedFunc(results, filename);
    setIsDownloadMenuOpen(false);
  }, [results]);

  const searchStudents = useCallback(() => {
    const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    fetchStudents(activeFilters);
  }, [filters, fetchStudents]);

  const clearAll = useCallback(() => {
    setFilters(initialFilters);
    fetchStudents(); // Re-fetch all students
  }, [initialFilters, fetchStudents]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter") searchStudents();
  }, [searchStudents]);

  const resultsDisplay = useMemo(() => {
    if (loading)
      return (
        <div className={`${classes.messageContainer} ${classes.loading}`}>
          <div className={classes.spinner}></div>
          <p>Loading student data...</p>
        </div>
      );
    if (error)
      return (
        <div className={`${classes.messageContainer} ${classes.error}`}>
          <AlertTriangle size={48} />
          <h3>An Error Occurred</h3>
          <p>{error}</p>
        </div>
      );
    if (results.length === 0)
      return (
        <div className={`${classes.messageContainer} ${classes.noResults}`}>
          <Search size={48} />
          <h3>No Students Found</h3>
          <p>Your search or filter criteria did not match any student records.</p>
        </div>
      );

    return (
      <div className={classes.tableContainer}>
        <div className={classes.resultsHeader}>
          <span className={classes.resultCount}>
            Displaying <strong>{results.length}</strong> student{results.length !== 1 && "s"}
          </span>
          <div className={classes.downloadContainer} ref={downloadMenuRef}>
            <button
              onClick={() => setIsDownloadMenuOpen((p) => !p)}
              className={`${classes.btn} ${classes.btnIcon}`}
            >
              <FileDown size={16} /> Download Report
              <ChevronDown size={16} className={`${classes.chevron} ${isDownloadMenuOpen && classes.chevronOpen}`} />
            </button>
            {isDownloadMenuOpen && (
              <div className={classes.downloadDropdown}>
                <button onClick={() => handleDownload("pdf")} className={classes.downloadOption}>As PDF</button>
                <button onClick={() => handleDownload("excel")} className={classes.downloadOption}>As Excel (.xlsx)</button>
                <button onClick={() => handleDownload("csv")} className={classes.downloadOption}>As CSV</button>
              </div>
            )}
          </div>
        </div>
        <div className={classes.tableWrapper}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Enroll ID</th><th>Gender</th>
                <th>Batch</th><th>Cohort</th><th>NMMS Year</th>
              </tr>
            </thead>
            <tbody>
              {results.map((student) => (
                <tr key={student.student_id}>
                  <td data-label="ID">{student.student_id}</td>
                  <td data-label="Name">{student.student_name}</td>
                  <td data-label="Enroll ID">{student.enr_id}</td>
                  <td data-label="Gender">{student.gender}</td>
                  <td data-label="Batch">{student.batch_name}</td>
                  <td data-label="Cohort">{student.cohort_name}</td>
                  <td data-label="NMMS Year">{student.nmms_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [loading, error, results, isDownloadMenuOpen, handleDownload]);

  return (
    <div className={classes.pageContainer}>
      <div className={classes.searchCard}>
        <div className={classes.header}>
          <div className={classes.headerIcon}><Users size={28} /></div>
          <div>
            <h1 className={classes.title}>Student Search</h1>
            <p className={classes.subtitle}>Search for students or browse the complete list below.</p>
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
              <input name="name" placeholder="Student Name" className={classes.input} value={filters.name} onChange={handleChange} onKeyPress={handleKeyPress} disabled={loading} />
              <input name="enr_id" placeholder="Enroll ID" className={classes.input} value={filters.enr_id} onChange={handleChange} onKeyPress={handleKeyPress} disabled={loading} />
            </div>
          ) : (
            <div className={classes.filtersGrid}>
              <div className={classes.formGroup}>
                <label className={classes.label}>Batch Name</label>
                <input name="batch" placeholder="e.g., 1" className={classes.input} value={filters.batch} onChange={handleChange} disabled={loading} />
              </div>
              <div className={classes.formGroup}>
                <label className={classes.label}>Cohort</label>
                <input name="cohort" placeholder="e.g., Cohort-1" className={classes.input} value={filters.cohort} onChange={handleChange} disabled={loading} />
              </div>
              <div className={classes.formGroup}>
                <label className={classes.label}>Gender</label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find(opt => opt.value === filters.gender)}
                  onChange={(s) => handleSelectChange(s, "gender")}
                  placeholder="Any gender"
                  isClearable
                  isDisabled={loading}
                  classNamePrefix="react-select"
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
            <Search size={18} /> {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className={classes.resultsArea}>{resultsDisplay}</div>
      </div>
    </div>
  );
};

export default Students;