import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import classes from "./ViewBatchStudents.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import useBatchData from "../../hooks/useBatchData";
import {
  Users,
  Hash,
  Mail,
  Phone,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

// --- UTILS ---
// Simple Debounce Hook for Search Performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- SUB-COMPONENTS ---

const LoadingSpinner = () => <Loader2 className={classes.animateSpin} size={20} />;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${classes.toast} ${classes[type]}`}>
      {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
};

const AddStudentsModal = ({ isOpen, onClose, batchId, onSuccess }) => {
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (isOpen) {
      setSelected([]);
      setSearch("");
      fetchUnassigned();
    }
  }, [isOpen]);

  const fetchUnassigned = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/batches/students/unassigned`);
      setUnassigned(res.data || []);
    } catch (err) {
      console.error("Failed to fetch unassigned students", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch) return unassigned;
    const lower = debouncedSearch.toLowerCase();
    return unassigned.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(lower) ||
        String(s.enr_id)?.toLowerCase().includes(lower)
    );
  }, [unassigned, debouncedSearch]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/batches/${batchId}/add-students`, {
        student_ids: selected,
      });
      onSuccess(`Successfully added ${selected.length} students.`);
      onClose();
    } catch (err) {
      console.error(err);
      onSuccess("Failed to add students.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalContentWide}>
        <div className={classes.modalHeader}>
          <h2>Add Students</h2>
          <button onClick={onClose} className={classes.closeBtn}><X size={20} /></button>
        </div>

        <div className={classes.modalSearch}>
          <Search size={16} />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={classes.modalListContainer}>
          {loading ? (
            <div className={classes.centerState}><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className={classes.centerState}>No students found.</div>
          ) : (
            <div className={classes.modalList}>
              {filtered.map((s) => (
                <div
                  key={s.student_id}
                  className={`${classes.modalListItem} ${selected.includes(s.student_id) ? classes.selectedItem : ""}`}
                  onClick={() => toggleSelect(s.student_id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(s.student_id)}
                    readOnly
                  />
                  <div className={classes.studentInfo}>
                    <span className={classes.studentName}>{s.student_name}</span>
                    <span className={classes.studentId}>{s.enr_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={classes.modalActions}>
          <span className={classes.selectionCount}>{selected.length} selected</span>
          <div className={classes.actionButtons}>
            <button className={classes.buttonSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
            <button
              className={classes.buttonPrimary}
              onClick={handleAdd}
              disabled={submitting || selected.length === 0}
            >
              {submitting ? <LoadingSpinner /> : "Add Selected"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RemoveConfirmModal = ({ isOpen, onClose, count, onConfirm, submitting }) => {
  if (!isOpen) return null;
  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalContent}>
        <div className={classes.modalHeader}>
          <h2>Remove Students</h2>
          <button onClick={onClose} className={classes.closeBtn}><X size={20} /></button>
        </div>
        <div className={classes.modalBody}>
          <p>Are you sure you want to remove <strong>{count}</strong> student(s) from this batch?</p>
          <p className={classes.warningText}>This action unassigns them but does not delete their accounts.</p>
        </div>
        <div className={classes.modalActions}>
          <button className={classes.buttonSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={classes.buttonDestructive} onClick={onConfirm} disabled={submitting}>
            {submitting ? <LoadingSpinner /> : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------
const ViewBatchStudents = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { students, batchInfo, loading, error, refresh } = useBatchData(batchId);

  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "student_name", direction: "ascending" });
  
  // UI State
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Show Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // --- Filtering & Sorting ---
  const processedStudents = useMemo(() => {
    if (!students) return [];
    
    let result = [...students];

    // Filter
    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.student_name?.toLowerCase().includes(lower) ||
          s.enr_id?.toLowerCase().includes(lower) ||
          s.student_email?.toLowerCase().includes(lower)
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key] || "").toString().toLowerCase();
        const valB = (b[sortConfig.key] || "").toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [students, debouncedSearchTerm, sortConfig]);

  // --- Handlers ---
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const toggleSelection = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === processedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(processedStudents.map((s) => s.student_id));
    }
  };

  const handleRemoveStudents = async () => {
    setIsRemoving(true);
    try {
      await axios.post(`${API_URL}/api/batches/students/remove`, {
        batch_id: batchId,
        student_ids: selectedStudents,
      });
      showToast(`Removed ${selectedStudents.length} students successfully.`);
      setSelectedStudents([]);
      setIsRemoveModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      showToast("Failed to remove students.", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  // --- Render ---

  if (loading) return (
    <div className={classes.stateContainer}>
      <LoadingSpinner /> <p>Loading batch data...</p>
    </div>
  );

  if (error) return (
    <div className={`${classes.stateContainer} ${classes.error}`}>
      <AlertCircle size={24} /> <p>{error}</p>
    </div>
  );

  const currentPath = ["Admin", "Academics", "Batches", batchInfo?.batch_name || "Details"];

  return (
    <div className={classes.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Academics"]} />

      <div className={classes.header}>
        <div className={classes.titleGroup}>
          <div className={classes.iconWrapper}><Users size={24} /></div>
          <div>
            <h1 className={classes.title}>Students in {batchInfo?.batch_name}</h1>
            <p className={classes.subtitle}>Manage student assignments for this batch</p>
          </div>
        </div>

        <div className={classes.headerActions}>
          <button onClick={() => setIsAddModalOpen(true)} className={classes.addButton}>
            <Plus size={16} /> Add Students
          </button>
          
          {selectedStudents.length > 0 && (
            <button onClick={() => setIsRemoveModalOpen(true)} className={classes.removeButton}>
              <Trash2 size={16} /> Remove ({selectedStudents.length})
            </button>
          )}

          <button onClick={() => navigate(-1)} className={classes.backButton}>Back</button>
        </div>
      </div>

      <div className={classes.contentCard}>
        <div className={classes.toolbar}>
          <div className={classes.searchContainer}>
            <Search className={classes.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={classes.stats}>
            Showing {processedStudents.length} of {students.length} students
          </div>
        </div>

        {processedStudents.length === 0 ? (
          <div className={classes.emptyState}>
            {searchTerm ? "No matches found for your search." : "No students assigned to this batch yet."}
          </div>
        ) : (
          <div className={classes.tableWrapper}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={processedStudents.length > 0 && selectedStudents.length === processedStudents.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort("enr_id")} className={classes.sortable}>
                    <div className={classes.thContent}>
                      Enrollment ID {sortConfig.key === "enr_id" && (sortConfig.direction === "ascending" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort("student_name")} className={classes.sortable}>
                    <div className={classes.thContent}>
                      Name {sortConfig.key === "student_name" && (sortConfig.direction === "ascending" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {processedStudents.map((student) => (
                  <tr key={student.student_id} className={selectedStudents.includes(student.student_id) ? classes.selectedRow : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.student_id)}
                        onChange={() => toggleSelection(student.student_id)}
                      />
                    </td>
                    <td className={classes.idCell}>
                      <Link to={`/admin/academics/batches/view-student-info/${student.nmms_reg_number}`}>
                        {student.enr_id}
                      </Link>
                    </td>
                    <td className={classes.nameCell}>{student.student_name}</td>
                    <td>{student.student_email || <span className={classes.muted}>N/A</span>}</td>
                    <td>{student.contact_no1 || <span className={classes.muted}>N/A</span>}</td>
                    <td><span className={classes.statusBadge}>Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddStudentsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        batchId={batchId}
        onSuccess={(msg, type) => {
          showToast(msg, type);
          refresh();
        }}
      />

      <RemoveConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        count={selectedStudents.length}
        onConfirm={handleRemoveStudents}
        submitting={isRemoving}
      />
    </div>
  );
};

export default ViewBatchStudents;