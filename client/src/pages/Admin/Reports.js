import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Users, FileText, Trash2, Edit, X, Search, 
  Loader2, Download, CheckCircle, PlusCircle 
} from "lucide-react"; 
import styles from './Reports.module.css';

// Import custom jurisdiction hooks
import { 
    useFetchStates, 
    useFetchEducationDistricts, 
    useFetchBlocks 
} from '../../hooks/useJurisData';

const ListManager = () => {
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;
  const ENDPOINT = `${API_URL}/api/custom-list`;

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]); 
  const [availableFields, setAvailableFields] = useState([]);

  // Form State
  const [formListName, setFormListName] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(""); 
  const [selectedStudents, setSelectedStudents] = useState([]); 
  const [selectedFields, setSelectedFields] = useState([]); 
  const [activeListId, setActiveListId] = useState(null);
  
  // Jurisdiction States
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  
  const [selectedState, setSelectedState] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Data Load
  useEffect(() => { fetchLists(); loadSetup(); }, [view]);
  
  // Jurisdiction Hooks usage
  useFetchStates(setStates);
  useFetchBlocks(selectedDistrict, setBlocks);

  // Cascading Logic: State -> Division
  useEffect(() => {
    if (!selectedState) { setDivisions([]); return; }
    axios.get(`${API_URL}/api/divisions-by-state/${selectedState}`)
         .then(res => setDivisions(Array.isArray(res.data) ? res.data : res.data.data || []))
         .catch(() => setDivisions([]));
  }, [selectedState, API_URL]);

  // Cascading Logic: Division -> District
  useEffect(() => {
    if (!selectedDivision) { setDistricts([]); return; }
    axios.get(`${API_URL}/api/districts-by-division/${selectedDivision}`)
         .then(res => setDistricts(Array.isArray(res.data) ? res.data : res.data.data || []))
         .catch(() => setDistricts([]));
  }, [selectedDivision, API_URL]);

  const fetchLists = async () => { 
    try {
      const res = await axios.get(`${ENDPOINT}/lists`); 
      setLists(res.data || []); 
    } catch (e) { console.error(e); }
  };
  
  const loadSetup = async () => {
    try {
      const [c, b, f] = await Promise.all([
        axios.get(`${API_URL}/api/batches/cohorts`),
        axios.get(`${ENDPOINT}/batches`),
        axios.get(`${ENDPOINT}/available-fields`)
      ]);
      setCohorts(c.data || []);
      setBatches(b.data || []);
      setAvailableFields(f.data || []);
    } catch (e) { console.error(e); }
  };

  const handleEdit = async (list) => {
    setLoading(true);
    try {
        const res = await axios.get(`${ENDPOINT}/students-by-list/${list.list_id}`);
        const renamedFields = res.data.fields.map(f => {
            if (f.col_name === 'batch_id') f.display_name = 'Batch Name';
            if (f.col_name === 'current_institute_dise_code') f.display_name = 'Current School Name';
            if (f.col_name === 'previous_institute_dise_code') f.display_name = 'Previous School Name';
            return f;
        });
        setActiveListId(list.list_id);
        setFormListName(list.list_name);
        setSelectedStudents(res.data.students.map(s => String(s.student_id)));
        setSelectedFields(renamedFields);
        const fRes = await axios.get(`${ENDPOINT}/available-fields`);
        setAvailableFields(fRes.data.filter(f => !renamedFields.find(sf => sf.col_name === f.col_name)));
        setView('form');
    } catch (e) { alert("Error loading list"); } 
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formListName || selectedFields.length === 0 || selectedStudents.length === 0) {
        return alert("Please provide List Name, Attributes, and Select Students.");
    }
    setLoading(true);
    try {
      await axios.post(`${ENDPOINT}/save-list-full`, {
        list_id: activeListId,
        list_name: formListName,
        student_ids: selectedStudents,
        selectedFields
      });
      setView('list');
      resetForm();
      fetchLists();
    } catch (e) { alert("Save failed"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormListName(""); setSelectedStudents([]); setSelectedFields([]); 
    setActiveListId(null); setSelectedCohort(""); setSelectedBatch("");
    setSelectedState(""); setSelectedDivision(""); setSelectedDistrict(""); setSelectedBlock("");
    loadSetup(); 
  };

  const handleExport = (list, type) => {
    const downloadUrl = `${ENDPOINT}/download-${type}/${list.list_id}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${list.list_name}.${type}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Custom List </h1>
        {view === 'list' && (
          <button className={styles.buttonPrimary} onClick={() => {resetForm(); setView('form')}}>
            <Plus size={18} /> New List
          </button>
        )}
      </header>

      {view === 'form' ? (
        <div className={styles.creationCard}>
          <div className={styles.formGroup}>
            <label>List Name</label>
            <input className={styles.input} value={formListName} onChange={e=>setFormListName(e.target.value)} placeholder="Enter list name..." />
          </div>
          
          <div className={styles.dualBoxContainer}>
            <div className={styles.boxColumn}>
                <div className={styles.boxHeader}>Available Attributes</div>
                <div className={styles.boxContent}>
                    {availableFields.map(f => (
                        <div key={f.col_name} className={styles.fieldItem} onClick={()=>{
                            setSelectedFields([...selectedFields, f]);
                            setAvailableFields(availableFields.filter(x => x.col_name !== f.col_name));
                        }}>{f.display_name} <PlusCircle size={14} color="#007bff"/></div>
                    ))}
                </div>
            </div>
            <div className={styles.boxColumn}>
                <div className={styles.boxHeader}>Selected Attributes</div>
                <div className={styles.boxContent}>
                    {selectedFields.map(f => (
                        <div key={f.col_name} className={`${styles.fieldItem} ${styles.fieldItemSelected}`} onClick={()=>{
                            setAvailableFields([...availableFields, f]);
                            setSelectedFields(selectedFields.filter(x => x.col_name !== f.col_name));
                        }}>{f.display_name} <X size={14} color="#dc3545"/></div>
                    ))}
                </div>
            </div>
          </div>

          <div className={styles.formRowMulti}>
            <div className={styles.formGroup}>
              <label>Cohort</label>
              <select className={styles.select} value={selectedCohort} onChange={e=>setSelectedCohort(e.target.value)}>
                  <option value="">-- Select --</option>
                  {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Batch</label>
              <select className={styles.select} value={selectedBatch} onChange={e=>setSelectedBatch(e.target.value)}>
                  <option value="">-- All --</option>
                  {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>State</label>
              <select className={styles.select} value={selectedState} onChange={e => {setSelectedState(e.target.value); setSelectedDivision(""); setSelectedDistrict(""); setSelectedBlock("");}}>
                  <option value="">-- All --</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Division</label>
              <select className={styles.select} value={selectedDivision} onChange={e => {setSelectedDivision(e.target.value); setSelectedDistrict(""); setSelectedBlock("");}} disabled={!selectedState}>
                  <option value="">-- All --</option>
                  {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>District</label>
              <select className={styles.select} value={selectedDistrict} onChange={e => {setSelectedDistrict(e.target.value); setSelectedBlock("");}} disabled={!selectedDivision}>
                  <option value="">-- All --</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Block</label>
              <select className={styles.select} value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)} disabled={!selectedDistrict}>
                  <option value="">-- All --</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <button className={styles.buttonSecondary} onClick={()=>setIsModalOpen(true)} disabled={!selectedCohort} style={{width:'100%', marginTop:'15px'}}>
            <Users size={18}/> {selectedStudents.length} Students Selected
          </button>

          <div style={{marginTop: '25px', display:'flex', gap:'10px'}}>
            <button className={styles.buttonSecondary} onClick={() => {setView('list'); resetForm();}}>Cancel</button>
            <button className={styles.buttonPrimary} onClick={handleSave}>
               {loading ? <Loader2 className={styles.animateSpin}/> : "Save List"}
            </button>
          </div>

          {isModalOpen && (
            <StudentPickerModal 
                cohortId={selectedCohort} batchId={selectedBatch} 
                stateId={selectedState} divisionId={selectedDivision} districtId={selectedDistrict} blockId={selectedBlock}
                selectedIds={selectedStudents} onSync={setSelectedStudents} onClose={() => setIsModalOpen(false)} 
            />
          )}
        </div>
      ) : (
        <div className={styles.listsGrid}>
          {lists.length === 0 && <p>No lists created yet.</p>}
          {lists.map(l => (
            <div key={l.list_id} className={styles.listCardItem}>
               <div className={styles.cardHeader}>
                  <h3>{l.list_name}</h3>
                  <span className={styles.badge}>{l.student_count} Students</span>
               </div>
               <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => handleEdit(l)}><Edit size={16}/></button>
                  <button className={styles.iconBtn} onClick={async () => {
                      if(window.confirm("Delete this list?")) {
                          await axios.delete(`${ENDPOINT}/list/${l.list_id}`);
                          fetchLists();
                      }
                  }}><Trash2 size={16}/></button>
                  <button className={styles.exportBtn} onClick={() => handleExport(l, 'xlsx')}><Download size={14}/> XLS</button>
                  <button className={styles.exportBtn} onClick={() => handleExport(l, 'pdf')}><FileText size={14}/> PDF</button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StudentPickerModal = ({ cohortId, batchId, stateId, divisionId, districtId, blockId, selectedIds, onSync, onClose }) => {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const API_URL = process.env.REACT_APP_BACKEND_API_URL;

    useEffect(() => {
        const params = new URLSearchParams({ 
            batchId: batchId||'', stateId: stateId||'', 
            divisionId: divisionId||'', districtId: districtId||'', 
            blockId: blockId||'' 
        });
        axios.get(`${API_URL}/api/custom-list/students-by-cohort/${cohortId}?${params}`).then(res => setStudents(res.data));
    }, [cohortId, batchId, stateId, divisionId, districtId, blockId, API_URL]);

    const filtered = students.filter(s => s.student_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContentWide}>
                <div className={styles.modalHeader}>
                    <h2>Select Students ({selectedIds.length})</h2>
                    <X onClick={onClose} style={{cursor:'pointer'}}/>
                </div>
                <div className={styles.modalSearch}>
                    <Search size={18}/><input placeholder="Search name..." onChange={e => setSearch(e.target.value)} />
                </div>
                <div className={styles.modalListContainer}>
                    {filtered.map(s => {
                        const isAdded = selectedIds.includes(String(s.student_id));
                        return (
                            <div key={s.student_id} className={styles.modalListItem} 
                                 onClick={() => onSync(isAdded ? selectedIds.filter(x=>x!==String(s.student_id)) : [...selectedIds, String(s.student_id)])}
                                 style={{ backgroundColor: isAdded ? '#f0fff4' : '#fff5f5', borderLeft: isAdded ? '5px solid #28a745' : '5px solid #dc3545' }}>
                                <div><strong>{s.student_name}</strong><br/><small>{s.student_id} | {s.batch_name}</small></div>
                                {isAdded ? <CheckCircle color="#28a745"/> : <PlusCircle color="#dc3545"/>}
                            </div>
                        );
                    })}
                </div>
                <button className={styles.buttonPrimary} onClick={onClose} style={{marginTop:'15px'}}>Confirm</button>
            </div>
        </div>
    );
};

export default ListManager;