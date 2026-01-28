import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Users,
  FileText,
  Trash2,
  Edit,
  X,
  Search,
  Loader2,
  Download,
  CheckCircle,
  PlusCircle,
  ChevronLeft,
} from "lucide-react";
import styles from "./CustomList.module.css";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs";

// ==========================================
// 1. SUB-COMPONENT: STUDENT SELECTOR MODAL
// ==========================================
const StudentSelectorModal = ({
  isOpen,
  onClose,
  cohortId,
  batchId,
  stateId,
  divisionId,
  districtId,
  blockId,
  onConfirm,
  preSelectedIds = [],
}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    if (isOpen && cohortId) {
      setSelected(preSelectedIds.map((id) => String(id)));
      fetchStudents();
    }
  }, [
    isOpen,
    cohortId,
    batchId,
    stateId,
    divisionId,
    districtId,
    blockId,
    preSelectedIds,
  ]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { batchId, stateId, divisionId, districtId, blockId };
      const res = await axios.get(
        `${API_URL}/api/custom-list/students-by-cohort/${cohortId}`,
        { params },
      );
      setStudents(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Modal fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return students.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(s.student_id).includes(search),
    );
  }, [students, search]);

  const toggleSelect = (id) => {
    const idStr = String(id);
    setSelected((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr],
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filtered.map((s) => String(s.student_id));
    setSelected(allFilteredIds);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentWide}>
        <div className={styles.modalHeader}>
          <h2>Select Students ({selected.length})</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className={styles.exportBtn} onClick={handleSelectAll}>
              Select All Filtered
            </button>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CREATIVE SEARCH BAR SECTION */}
        <div className={styles.modalSearchContainer}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by student name or unique ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalListContainer}>
          {loading ? (
            <div className={styles.centerState}>
              <Loader2 className={styles.animateSpin} />
            </div>
          ) : (
            <div className={styles.modalList}>
              {filtered.map((s) => {
                const isSel = selected.includes(String(s.student_id));
                return (
                  <div
                    key={s.student_id}
                    className={`${styles.modalListItem} ${isSel ? styles.selectedItem : styles.notSelectedItem}`}
                    onClick={() => toggleSelect(s.student_id)}
                  >
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>
                        {s.student_name}
                      </span>
                      <span className={styles.studentDetails}>
                        ID: {s.student_id} | Batch: {s.batch_name}
                      </span>
                    </div>

                    <div className={styles.statusIcon}>
                      {isSel ? (
                        <CheckCircle color="#28a745" size={22} fill="#f0fff4" />
                      ) : (
                        <PlusCircle color="#dc3545" size={22} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={() => onConfirm(selected)}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN COMPONENT: LIST MANAGER
// ==========================================
const ListManager = () => {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;
  const ENDPOINT = `${API_URL}/api/custom-list`;
  const currentPath = ["Admin", "Academics", "Reports", "Custom List"];

  const [view, setView] = useState("list");
  const [lists, setLists] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);

  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [batches, setBatches] = useState([]);

  const [activeListId, setActiveListId] = useState(null);
  const [formListName, setFormListName] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const res = await axios.get(`${ENDPOINT}/lists`);
      setLists(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [ENDPOINT]);

  useEffect(() => {
    fetchLists();
    axios
      .get(`${API_URL}/api/batches/cohorts`)
      .then((res) =>
        setCohorts(Array.isArray(res.data) ? res.data : res.data.data || []),
      );
    axios
      .get(`${API_URL}/api/states`)
      .then((res) =>
        setStates(Array.isArray(res.data) ? res.data : res.data.data || []),
      );
    axios
      .get(`${ENDPOINT}/available-fields`)
      .then((res) =>
        setAvailableFields(
          Array.isArray(res.data) ? res.data : res.data.data || [],
        ),
      );
  }, [view, API_URL, ENDPOINT, fetchLists]);

  useEffect(() => {
    if (selectedCohort)
      axios
        .get(`${ENDPOINT}/batches?cohortId=${selectedCohort}`)
        .then((res) => setBatches(res.data));
  }, [selectedCohort, ENDPOINT]);

  useEffect(() => {
    if (!selectedState) {
      setDivisions([]);
      return;
    }
    axios
      .get(`${API_URL}/api/divisions-by-state/${selectedState}`)
      .then((res) =>
        setDivisions(Array.isArray(res.data) ? res.data : res.data.data || []),
      );
  }, [selectedState, API_URL]);

  useEffect(() => {
    if (!selectedDivision) {
      setDistricts([]);
      return;
    }
    axios
      .get(`${API_URL}/api/districts-by-division/${selectedDivision}`)
      .then((res) =>
        setDistricts(Array.isArray(res.data) ? res.data : res.data.data || []),
      );
  }, [selectedDivision, API_URL]);

  useEffect(() => {
    if (!selectedDistrict) {
      setBlocks([]);
      return;
    }
    axios
      .get(`${API_URL}/api/blocks-by-district/${selectedDistrict}`)
      .then((res) =>
        setBlocks(Array.isArray(res.data) ? res.data : res.data.data || []),
      );
  }, [selectedDistrict, API_URL]);

  const handleEdit = async (list) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${ENDPOINT}/students-by-list/${list.list_id}`,
      );
      setActiveListId(list.list_id);
      setFormListName(list.list_name);
      setSelectedStudents(res.data.students.map((s) => String(s.student_id)));
      setSelectedFields(res.data.fields || []);
      const fieldNames = (res.data.fields || []).map((f) => f.col_name);
      const allFieldsRes = await axios.get(`${ENDPOINT}/available-fields`);
      const allFields = Array.isArray(allFieldsRes.data)
        ? allFieldsRes.data
        : allFieldsRes.data.data || [];
      setAvailableFields(
        allFields.filter((f) => !fieldNames.includes(f.col_name)),
      );
      setView("form");
    } catch (err) {
      alert("Failed to load list details");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (list, type) => {
    const downloadUrl = `${ENDPOINT}/download-${type}/${list.list_id}`;
    window.open(downloadUrl, "_blank");
  };

  const handleSave = async () => {
    if (!formListName || selectedStudents.length === 0)
      return alert("Enter name and select students");
    try {
      const payload = {
        list_id: activeListId,
        list_name: formListName,
        student_ids: selectedStudents,
        selectedFields,
      };
      await axios.post(`${ENDPOINT}/save-list-full`, payload);
      setView("list");
      resetForm();
      fetchLists();
    } catch (err) {
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setActiveListId(null);
    setFormListName("");
    setSelectedStudents([]);
    setSelectedFields([]);
    setSelectedCohort("");
    setSelectedBatch("");
    setSelectedState("");
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedBlock("");
  };

const moveField = (field, toSelected) => {
  if (toSelected) {
    setSelectedFields([...selectedFields, field]);
    setAvailableFields(availableFields.filter(f => f.col_name !== field.col_name));
  } else {
    setAvailableFields([...availableFields, field]);
    setSelectedFields(selectedFields.filter(f => f.col_name !== field.col_name));
  }
};

  return (
    <div className={styles.container}>
      <Breadcrumbs
        path={currentPath}
        nonLinkSegments={["Admin", "Academics"]}
      />
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            className={styles.iconBtn}
            onClick={() => (view === "form" ? setView("list") : navigate(-1))}
          >
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>Custom List </h1>
        </div>
        {view === "list" && (
          <button
            className={styles.buttonPrimary}
            onClick={() => {
              resetForm();
              setView("form");
            }}
          >
            <Plus size={18} style={{ marginRight: 5 }} /> New List
          </button>
        )}
      </header>

      {view === "form" ? (
        <div className={styles.creationCard}>
          <div className={styles.formGroup}>
            <label>List Name</label>
            <input
              className={styles.input}
              value={formListName}
              onChange={(e) => setFormListName(e.target.value)}
              placeholder="List Name"
            />
          </div>
          {/* DUAL BOX ATTRIBUTE SELECTION */}
          <div className={styles.dualBoxContainer}>
            {/* Left Box: Available */}
            <div className={styles.attributeBox}>
              <div className={styles.boxHeader}>Available Attributes</div>
              <div className={styles.boxList}>
                {availableFields.length === 0 && (
                  <p className={styles.emptyText}>No more attributes</p>
                )}
                {availableFields.map((f) => (
                  <div
                    key={f.col_name}
                    className={styles.attributeItem}
                    onClick={() => moveField(f, true)}
                  >
                    <span>{f.display_name}</span>
                    <PlusCircle size={16} className={styles.addIcon} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Box: Selected */}
            <div className={styles.attributeBox}>
              <div className={styles.boxHeader}>Selected Attributes</div>
              <div className={styles.boxList}>
                {selectedFields.length === 0 && (
                  <p className={styles.emptyText}>Select columns for report</p>
                )}
                {selectedFields.map((f) => (
                  <div
                    key={f.col_name}
                    className={`${styles.attributeItem} ${styles.attributeItemSelected}`}
                    onClick={() => moveField(f, false)}
                  >
                    <span>{f.display_name}</span>
                    <X size={16} className={styles.removeIcon} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.filtersGrid}>
            <select
              className={styles.select}
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
            >
              <option value="">-- Cohort --</option>
              {cohorts.map((c) => (
                <option key={c.cohort_number} value={c.cohort_number}>
                  {c.cohort_name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={!selectedCohort}
            >
              <option value="">-- Batch --</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDivision("");
              }}
            >
              <option value="">-- State --</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {/* ADDED MISSING DROPDOWNS BELOW */}
            <select
              className={styles.select}
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict("");
              }}
              disabled={!selectedState}
            >
              <option value="">-- Division --</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedBlock("");
              }}
              disabled={!selectedDivision}
            >
              <option value="">-- District --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              disabled={!selectedDistrict}
            >
              <option value="">-- Block --</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className={styles.buttonSecondary}
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedCohort}
            style={{ width: "100%", marginTop: "20px" }}
          >
            <Users size={18} style={{ marginRight: 8 }} /> Manage Students (
            {selectedStudents.length} Selected)
          </button>

          <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
            <button
              className={styles.buttonSecondary}
              onClick={() => setView("list")}
            >
              Cancel
            </button>
            <button className={styles.buttonPrimary} onClick={handleSave}>
              Save Full List
            </button>
          </div>

          <StudentSelectorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            cohortId={selectedCohort}
            batchId={selectedBatch}
            stateId={selectedState}
            divisionId={selectedDivision}
            districtId={selectedDistrict}
            blockId={selectedBlock}
            preSelectedIds={selectedStudents}
            onConfirm={(ids) => {
              setSelectedStudents(ids);
              setIsModalOpen(false);
            }}
          />
        </div>
      ) : (
        <div className={styles.listsGrid}>
          {lists.map((l) => (
            <div key={l.list_id} className={styles.listCardItem}>
              <div className={styles.cardHeader}>
                <div className={styles.studentInfo}>
                  <h3 className={styles.listNameTitle}>{l.list_name}</h3>
                  <span className={styles.badge}>
                    {l.student_count} Students
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <div className={styles.actionGroupLeft}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleEdit(l)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={async () => {
                      if (window.confirm("Delete?")) {
                        await axios.delete(`${ENDPOINT}/list/${l.list_id}`);
                        fetchLists();
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className={styles.actionGroupRight}>
                  <button
                    className={styles.exportBtn}
                    onClick={() => handleExport(l, "xlsx")}
                  >
                    <Download size={14} /> XLS
                  </button>
                  <button
                    className={styles.exportBtn}
                    onClick={() => handleExport(l, "pdf")}
                  >
                    <FileText size={14} /> PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListManager;
