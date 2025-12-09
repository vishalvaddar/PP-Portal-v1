import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <--- FIXED IMPORT
import { Plus, Users, FileText, Trash2, Edit, X, Search, Loader2, UserPlus, UserMinus } from "lucide-react"; 
import styles from './CustomList.module.css';

// ==========================================
// 1. HELPERS & HOOKS
// ==========================================

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const LoadingSpinner = () => <Loader2 className={styles.animateSpin} size={20} />;

// ==========================================
// 2. SUB-COMPONENT: STUDENT SELECTOR MODAL
// ==========================================

const StudentSelectorModal = ({ isOpen, onClose, cohortId, onConfirm, preSelectedIds = [] }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    if (isOpen && cohortId) {
      setSearch("");
      setSelected(preSelectedIds.map(id => String(id))); 
      fetchStudentsByCohort();
    }
  }, [isOpen, cohortId]);

  const fetchStudentsByCohort = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/custom-list/students-by-cohort/${cohortId}`);
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch cohort students", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch) return students;
    const lower = debouncedSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(lower) ||
        String(s.student_id)?.toLowerCase().includes(lower)
    );
  }, [students, debouncedSearch]);

  const toggleSelect = (id) => {
    const idStr = String(id);
    setSelected((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filtered.length) {
        setSelected([]);
    } else {
        setSelected(filtered.map(s => String(s.student_id)));
    }
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentWide}>
        <div className={styles.modalHeader}>
          <h2>Select Students</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>
        <div className={styles.modalSearch}>
          <Search size={16} />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.modalListContainer}>
          {loading ? (
            <div className={styles.centerState}><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className={styles.centerState}>No students found in this cohort.</div>
          ) : (
            <div className={styles.modalList}>
              <div 
                className={styles.modalListItem} 
                onClick={handleSelectAll}
                style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}
              >
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.length === filtered.length}
                  readOnly
                />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select All ({filtered.length})</span>
              </div>
              {filtered.map((s) => {
                 const isSelected = selected.includes(String(s.student_id));
                 return (
                    <div
                      key={s.student_id}
                      className={`${styles.modalListItem} ${isSelected ? styles.selectedItem : ""}`}
                      onClick={() => toggleSelect(s.student_id)}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{s.student_name}</span>
                        <span className={styles.studentId}>{s.student_id}</span>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={styles.modalActions}>
          <span className={styles.selectionCount}>{selected.length} selected</span>
          <div className={styles.actionButtons}>
            <button className={styles.buttonSecondary} onClick={onClose}>Cancel</button>
            <button className={styles.buttonPrimary} onClick={handleConfirm} disabled={loading}>
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT: LIST MANAGER
// ==========================================

const ListManager = () => {
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;
  const ENDPOINT = `${API_URL}/api/custom-list`;

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [previewStudents, setPreviewStudents] = useState([]);
  const [editingListId, setEditingListId] = useState(null);
  const [editName, setEditName] = useState("");

  const [formListName, setFormListName] = useState("");
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addCohortId, setAddCohortId] = useState(""); 

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ENDPOINT}/lists`);
      setLists(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load lists.");
    } finally {
      setLoading(false);
    }
  }, [ENDPOINT]);

  const loadCohorts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/batches/cohorts`);
      setCohorts(res.data);
    } catch(err) { console.error(err); }
  }, [API_URL]);

  useEffect(() => {
    if (view === 'list') fetchLists();
    loadCohorts(); 
  }, [view, fetchLists, loadCohorts]);

  const handleCohortChange = (e) => {
    setSelectedCohort(e.target.value);
    setSelectedStudents([]);
  };

  const handleCreateList = async () => {
    if (!formListName || !selectedCohort || selectedStudents.length === 0) return alert("Fill all fields.");
    setLoading(true);
    try {
      await axios.post(`${ENDPOINT}/create-list-with-students`, {
        list_name: formListName,
        student_ids: selectedStudents
      });
      alert("List Created!");
      setFormListName(""); setSelectedCohort(""); setSelectedStudents([]);
      setView('list');
    } catch (err) { alert("Failed to create list."); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete list?")) return;
    try {
      await axios.delete(`${ENDPOINT}/list/${id}`);
      fetchLists();
      if(activeListId === id) setActiveListId(null);
    } catch(err) { console.error(err); }
  };

  const handleUpdateName = async () => {
    try {
      await axios.put(`${ENDPOINT}/list/${editingListId}`, { list_name: editName });
      setEditingListId(null);
      fetchLists();
    } catch(err) { console.error(err); }
  };

  const handlePreview = async (listId) => {
    if(activeListId === listId) { setActiveListId(null); return; }
    setActiveListId(listId);
    refreshPreview(listId);
  };

  const refreshPreview = async (listId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${ENDPOINT}/students-by-list/${listId}`);
      setPreviewStudents(res.data);
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleRemoveStudent = async (studentId) => {
    if(!window.confirm("Remove this student from the list?")) return;
    try {
        await axios.delete(`${ENDPOINT}/list/${activeListId}/student/${studentId}`);
        refreshPreview(activeListId);
        fetchLists();
    } catch (err) { alert("Failed to remove student"); }
  };

  const openAddModal = () => {
      if(!addCohortId) return alert("Please select a cohort to add students from.");
      setIsModalOpen(true);
  };

  const handleAddStudentsToExisting = async (ids) => {
      try {
          await axios.post(`${ENDPOINT}/add-students`, {
              list_id: activeListId,
              student_ids: ids
          });
          alert("Students added successfully!");
          refreshPreview(activeListId);
          fetchLists();
          setAddCohortId(""); 
      } catch (err) { alert("Failed to add students"); }
  };

  // --- EXPORT ---

  const fetchForExport = async (listId) => {
    const res = await axios.get(`${ENDPOINT}/students-by-list/${listId}`);
    return res.data;
  };

  const exportExcel = async (list) => {
    try {
      const data = await fetchForExport(list.id);
      const sheetData = data.map(s => ({
        "Student ID": s.student_id,
        "Student Name": s.student_name,
        "List Name": list.list_name
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, `${list.list_name}.xlsx`);
    } catch(err) {
      console.error(err);
      alert("Export failed");
    }
  };

  const exportPDF = async (list) => {
     try {
        const data = await fetchForExport(list.id);
        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text(list.list_name, 14, 20);
        
        // Date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

        // Table Data
        const tableColumn = ["Student ID", "Student Name"];
        const tableRows = data.map(s => [s.student_id, s.student_name]);

        // FIX: CALL autoTable FUNCTIONALLY
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 32,
          theme: 'grid',
        });

        doc.save(`${list.list_name}.pdf`);
      } catch(err) {
        console.error(err);
        alert("Export failed");
      }
  };

  // --- RENDER ---
  const renderForm = () => (
    <div className={styles.creationCard}>
      <h2 className={styles.cardTitle}>Create New List</h2>
      <div className={styles.formGroup}>
        <label>List Name</label>
        <input className={styles.input} value={formListName} onChange={e => setFormListName(e.target.value)} placeholder="e.g. Remedial Math Group" />
      </div>
      <div className={styles.formGroup}>
        <label>Select Cohort Source</label>
        <select className={styles.select} value={selectedCohort} onChange={handleCohortChange}>
          <option value="">-- Select Cohort --</option>
          {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Students</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <button className={styles.buttonSecondary} onClick={() => setIsModalOpen(true)} disabled={!selectedCohort}>
                <Plus size={18} style={{marginRight:5}}/> {selectedStudents.length > 0 ? "Edit Selection" : "Select Students"}
            </button>
            {selectedStudents.length > 0 && <span className={styles.selectionCount}>{selectedStudents.length} selected</span>}
        </div>
      </div>
      <div className={styles.modalActions} style={{marginTop: '20px', borderTop: 'none', padding: 0}}>
        <button className={styles.buttonSecondary} onClick={() => setView('list')}>Cancel</button>
        <button className={styles.buttonPrimary} onClick={handleCreateList} disabled={loading || selectedStudents.length === 0}>
          {loading ? "Saving..." : "Save List"}
        </button>
      </div>
      
      {/* Modal for Creating New List */}
      <StudentSelectorModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        cohortId={selectedCohort} preSelectedIds={selectedStudents}
        onConfirm={(ids) => setSelectedStudents(ids)}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Custom List Manager</h1>
        {view === 'list' && (
          <button className={styles.buttonPrimary} onClick={() => setView('form')}>
            <Plus size={18} style={{marginRight:'5px'}}/> Create New List
          </button>
        )}
      </header>
      {error && <div className={styles.errorBanner}>{error}</div>}
      
      <div className={styles.mainGrid}>
        <div style={{gridColumn: '1 / -1'}}>
          {view === 'form' ? renderForm() : (
            <>
              {lists.length === 0 && !loading && <p className={styles.emptyState}>No lists found.</p>}
              <div className={styles.listsGrid}>
                {lists.map(list => (
                  <div key={list.id} className={`${styles.listCardItem} ${activeListId === list.id ? styles.activeCard : ''}`}>
                    <div className={styles.cardHeader} onClick={() => handlePreview(list.id)}>
                      {editingListId === list.id ? (
                        <input className={styles.inputSmall} value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                      ) : <h3 className={styles.listNameTitle}>{list.list_name}</h3>}
                      <span className={styles.badge}>{list.student_count} Students</span>
                    </div>
                    <div className={styles.cardActions}>
                      {editingListId === list.id ? (
                        <>
                           <button className={styles.saveBtn} onClick={handleUpdateName}>Save</button>
                           <button className={styles.cancelBtn} onClick={() => setEditingListId(null)}>X</button>
                        </>
                      ) : (
                        <>
                          <div className={styles.actionGroupLeft}>
                            <button className={styles.iconBtn} onClick={() => { setEditingListId(list.id); setEditName(list.list_name); }}><Edit size={16} /></button>
                            <button className={styles.iconBtn} onClick={() => handleDelete(list.id)}><Trash2 size={16} /></button>
                          </div>
                          <div className={styles.actionGroupRight}>
                            <button className={styles.exportBtn} onClick={() => exportExcel(list)}><FileText size={14} /> XLS</button>
                            <button className={styles.exportBtn} onClick={() => exportPDF(list)}><FileText size={14} /> PDF</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PREVIEW & EDIT SECTION */}
              {activeListId && (
                <div className={styles.previewSection}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}>
                      <h3 style={{margin:0}}>Manage Students in List</h3>
                      
                      <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                          <select 
                            className={styles.select} 
                            style={{width:'200px', padding:'6px'}}
                            value={addCohortId} 
                            onChange={(e) => setAddCohortId(e.target.value)}
                          >
                             <option value="">Select Source Cohort</option>
                             {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
                          </select>
                          <button 
                            className={styles.buttonPrimary} 
                            style={{padding:'6px 12px', fontSize:'0.85rem'}}
                            onClick={openAddModal}
                          >
                             <UserPlus size={16} style={{marginRight:5}}/> Add Students
                          </button>
                      </div>
                   </div>

                   {loading ? <p>Loading...</p> : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.previewTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Batch Name</th>
                                <th>Tab Numder</th>
                                <th>Parent Number</th>
                                <th style={{width:'50px'}}>Action</th></tr></thead>
                        <tbody>
                            {previewStudents.map(s => (
                            <tr key={s.student_id}>
                                <td>{s.student_id}</td>
                                <td>{s.student_name}</td>
                                <td>{s.gender}</td>
                                <td>{s.batch_name}</td>
                                <td>{s.contact_no1}</td>
                                <td>{s.contact_no2}</td>
                                <td>
                                    <button 
                                        className={styles.iconBtn} 
                                        style={{color:'#e74c3c', borderColor:'#e74c3c'}}
                                        onClick={() => handleRemoveStudent(s.student_id)}
                                        title="Remove student"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                   )}
                   
                   {activeListId && (
                       <StudentSelectorModal 
                         isOpen={isModalOpen} 
                         onClose={() => setIsModalOpen(false)}
                         cohortId={addCohortId} 
                         preSelectedIds={[]} 
                         onConfirm={handleAddStudentsToExisting}
                       />
                   )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListManager;