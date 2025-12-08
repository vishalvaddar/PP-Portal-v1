import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import classes from "./ViewBatchStudents.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import useBatchData from "../../hooks/useBatchData";
import { Users, Hash, Mail, Phone, Search, ArrowUpDown, Plus, X, ArrowUp, ArrowDown,} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

// Loading State
const LoadingState = () => (
  <div className={classes.stateContainer}>
    <div className={classes.spinner}></div>
    <p>Loading student data...</p>
  </div>
);

// Error State
const ErrorState = ({ message }) => (
  <div className={`${classes.stateContainer} ${classes.errorMessage}`}>
    <p>{message}</p>
  </div>
);

// Add Students Modal (UNASSIGNED STUDENTS)
const AddStudentsModal = ({ isOpen, onClose, batchId, refresh }) => {
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // --- IMPROVEMENT: Reset state on open ---
    setSelected([]);
    setSearch("");

    const fetchUnassigned = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/batches/students/unassigned`);
        setUnassigned(res.data || []);
      } catch (err) {
        console.error("Failed to fetch unassigned students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnassigned();
  }, [isOpen]);

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return unassigned.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(lowerSearch) ||
        String(s.enr_id)?.toLowerCase().includes(lowerSearch)
    );
  }, [unassigned, search]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const assignStudents = async () => {
    if (selected.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/batches/${batchId}/add-students`, {
        student_ids: selected,
      });

      alert("Students added successfully!");

      onClose();
      refresh();
    } catch (err) {
      console.error("Failed to add students:", err);
      alert("Failed to add students.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalContentWide}>
        <div className={classes.modalHeader}>
          <h2>Add Students to Batch</h2>
          <button className={classes.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={classes.modalSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search unassigned students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={classes.stateContainer}>
            <div className={classes.spinner}></div>
            <p>Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={classes.noStudentsCard}>
            <p>No unassigned students found.</p>
          </div>
        ) : (
          <div className={classes.modalList}>
            {filtered.map((s) => (
              <div key={s.student_id} className={classes.modalListItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(s.student_id)}
                    onChange={() => toggleSelect(s.student_id)}
                  />
                  <span className={classes.modalStudentText}>
                    {s.enr_id} — {s.student_name}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}

        <div className={classes.modalActions}>
          <button className={classes.buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={classes.buttonPrimary} onClick={assignStudents}>
            Add {selected.length} Student(s)
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewBatchStudents = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { students, batchInfo, loading, error, refresh } =
    useBatchData(batchId);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "student_name",
    direction: "ascending",
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const processedStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student_name?.toLowerCase().includes(lower) ||
          s.enr_id?.toLowerCase().includes(lower) ||
          s.student_email?.toLowerCase().includes(lower)
      );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const A = a[sortConfig.key] || "";
        const B = b[sortConfig.key] || "";
        if (A < B) return sortConfig.direction === "ascending" ? -1 : 1;
        if (A > B) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [students, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // --- IMPROVEMENT: Use consistent icons ---
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={14} className={classes.sortIcon} />;
    }
    if (sortConfig.direction === "ascending") {
      return <ArrowUp size={14} className={classes.sortIconActive} />;
    }
    return <ArrowDown size={14} className={classes.sortIconActive} />;
  };

  const currentPath = [
    "Admin",
    "Academics",
    "Batches",
    batchInfo ? batchInfo.batch_name : "...",
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className={classes.container}>
      <Breadcrumbs
        path={currentPath}
        nonLinkSegments={["Admin", "Academics"]}
      />

      <div className={classes.header}>
        <div className={classes.titleGroup}>
          <Users className={classes.titleIcon} />
          <div>
            <h1 className={classes.title}>
              Students in {batchInfo?.batch_name || "Batch"}
            </h1>
            <span className={classes.studentCount}>
              {processedStudents.length} student(s) found
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className={classes.addButton}
        >
          <Plus size={18} /> Add Students
        </button>

        <button onClick={() => navigate(-1)} className={classes.backButton}>
          ← Back to Batches
        </button>
      </div>

      <div className={classes.controls}>
        <div className={classes.searchContainer}>
          <Search className={classes.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            className={classes.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {processedStudents.length === 0 ? (
        <div className={classes.noStudentsCard}>
          <p>
            {searchTerm
              ? "No students match your search."
              : "No students are currently assigned to this batch."}
          </p>
        </div>
      ) : (
        <div className={classes.tableContainer}>
          <table className={classes.studentTable}>
            <thead>
              <tr>
                <th>Sl. No.</th>
                <th onClick={() => requestSort("enr_id")}>
                  <Hash size={16} /> Enrollment ID {getSortIcon("enr_id")}
                </th>
                <th onClick={() => requestSort("student_name")}>
                  <Users size={16} /> Student Name{" "}
                  {getSortIcon("student_name")}
                </th>
                <th>
                  <Mail size={16} /> Student Email
                </th>
                <th>
                  <Phone size={16} /> Contact
                </th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {processedStudents.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>
                    <Link
                      to={`/admin/academics/batches/view-student-info/${student.nmms_reg_number}`}
                      className={classes.studentLink}
                    >
                      {student.enr_id}
                    </Link>
                  </td>
                  <td>{student.student_name}</td>
                  <td>{student.student_email || "N/A"}</td>
                  <td>{student.contact_no1 || "N/A"}</td>
                  <td>
                    <span className={`${classes.statusBadge} ${classes.active}`}>
                      Assigned
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddStudentsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        batchId={batchId}
        refresh={refresh}
      />
    </div>
  );
};

export default ViewBatchStudents;