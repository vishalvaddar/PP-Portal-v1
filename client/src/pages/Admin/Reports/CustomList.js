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

import {
  useFetchStates,
  useFetchEducationDistricts,
  useFetchBlocks,
} from "../../../hooks/useJurisData";

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
    if (isOpen) {
      setSelected(preSelectedIds.map((id) => String(id)));
    }
  }, [isOpen, preSelectedIds]);

 useEffect(() => {
  if (isOpen && (cohortId || stateId)) {
    fetchStudents();
  }
}, [isOpen, cohortId, batchId, stateId, divisionId, districtId, blockId]);

const fetchStudents = async () => {
  setLoading(true);
  try {
    // Check your variable names here! 
    // They must match stateId, districtId, blockId exactly.
    const params = { batchId, stateId, divisionId, districtId, blockId };
    const cid = cohortId && cohortId !== 'null' ? cohortId : 'all';
    
    const res = await axios.get(
      `${API_URL}/api/custom-list/students-by-cohort/${cid}`,
      { params }
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
      <div
        className={styles.modalContentWide}
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className={styles.modalHeader} style={{ flexShrink: 0 }}>
          <h2>Select Students ({selected.length})</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className={styles.exportBtn} onClick={handleSelectAll}>
              Select All 
            </button>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.modalSearchContainer} style={{ flexShrink: 0 }}>
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

        <div
          className={styles.modalListContainer}
          style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        >
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
                    key={`modal-student-${s.student_id}`}
                    className={`${styles.modalListItem} ${isSel ? styles.selectedItem : styles.notSelectedItem}`}
                    onClick={() => toggleSelect(s.student_id)}
                  >
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>{s.student_name}</span>
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

        <div
          className={styles.modalActions}
          style={{
            flexShrink: 0,
            borderTop: "1px solid #eee",
            background: "#fff",
          }}
          >
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

  // DATA FETCHING HOOKS
  useFetchStates(setStates);
  useFetchEducationDistricts(selectedState, setDistricts);
  useFetchBlocks(selectedDistrict, setBlocks);

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedBlock("");
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
    setSelectedDistrict("");
    setSelectedBlock("");
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedBlock("");
  };

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
      .get(`${ENDPOINT}/available-fields`)
      .then((res) =>
        setAvailableFields(
          Array.isArray(res.data) ? res.data : res.data.data || [],
        ),
      );
  }, [API_URL, ENDPOINT, fetchLists]);

  useEffect(() => {
    if (selectedCohort && selectedCohort !== "" && selectedCohort !== "null") {
      axios
        .get(`${ENDPOINT}/batches`, {
          params: { cohortId: selectedCohort },
        })
        .then((res) => {
          setBatches(Array.isArray(res.data) ? res.data : []);
          setSelectedBatch("");
        })
        .catch((err) => console.error("Error fetching batches:", err));
    } else {
      setBatches([]);
      setSelectedBatch("");
    }
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
      setAvailableFields(
        availableFields.filter((f) => f.col_name !== field.col_name),
      );
    } else {
      setAvailableFields([...availableFields, field]);
      setSelectedFields(
        selectedFields.filter((f) => f.col_name !== field.col_name),
      );
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
          <div className={styles.dualBoxContainer}>
            <div className={styles.attributeBox}>
              <div className={styles.boxHeader}>Available Attributes</div>
              <div className={styles.boxList}>
                {availableFields.map((f) => (
                  <div
                    key={`avail-${f.col_name}`}
                    className={styles.attributeItem}
                    onClick={() => moveField(f, true)}
                  >
                    <span>{f.display_name}</span>
                    <PlusCircle size={16} className={styles.addIcon} />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.attributeBox}>
              <div className={styles.boxHeader}>Selected Attributes</div>
              <div className={styles.boxList}>
                {selectedFields.map((f) => (
                  <div
                    key={`sel-${f.col_name}`}
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
                <option key={`cohort-${c.cohort_number}`} value={c.cohort_number}>
                  {c.cohort_name || c.cohort_number}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={!selectedCohort}
            >
              <option value="">
                {!selectedCohort ? "Select Cohort First" : "-- Batch --"}
              </option>
              {batches.map((b) => (
                <option key={`batch-${b.batch_id}`} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedState}
              onChange={handleStateChange}
            >
              <option value="">-- State --</option>
              {states.map((s) => (
                <option key={s.juris_code || s.id} value={s.juris_code || s.id}>
                  {s.juris_name || s.name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedDivision}
              onChange={handleDivisionChange}
              disabled={!selectedState}
            >
              <option value="">-- Division --</option>
              {divisions.map((d) => (
                <option key={d.juris_code || d.id} value={d.juris_code || d.id}>
                  {d.juris_name || d.name}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedDivision}
            >
              <option value="">-- District --</option>
              {districts.map((d) => (
                <option key={d.juris_code || d.id} value={d.juris_code || d.id}>
                  {d.juris_name || d.name}
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
                <option key={b.juris_code || b.id} value={b.juris_code || b.id}>
                  {b.juris_name || b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className={styles.buttonSecondary}
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedCohort && !selectedState}
            style={{ width: "100%", marginTop: "20px" }}
          >
            <Users size={18} style={{ marginRight: 8 }} /> Manage Students (
            {selectedStudents.length} Selected)
          </button>

          <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
            <button className={styles.buttonSecondary} onClick={() => setView("list")}>Cancel</button>
            <button className={styles.buttonPrimary} onClick={handleSave}>Save Full List</button>
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
            <div key={`list-card-${l.list_id}`} className={styles.listCardItem}>
              <div className={styles.cardHeader}>
                <div className={styles.studentInfo}>
                  <h3 className={styles.listNameTitle}>{l.list_name}</h3>
                  <span className={styles.badge}>{l.student_count} Students</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <div className={styles.actionGroupLeft}>
                  <button className={styles.iconBtn} onClick={() => handleEdit(l)} title="Edit"><Edit size={16} /></button>
                  <button className={styles.iconBtn} onClick={async () => { if (window.confirm("Delete?")) { await axios.delete(`${ENDPOINT}/list/${l.list_id}`); fetchLists(); } }} title="Delete"><Trash2 size={16} /></button>
                </div>
                <div className={styles.actionGroupRight}>
                  <button className={styles.exportBtn} onClick={() => handleExport(l, "xlsx")}><Download size={14} /> XLS</button>
                  <button className={styles.exportBtn} onClick={() => handleExport(l, "pdf")}><FileText size={14} /> PDF</button>
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