import React, { useState, useEffect, useCallback, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from 'axios';
import styles from "./TimeTableDashboard.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { 
    Plus, Trash2, Edit, Download, AlertCircle, Settings, BookOpen, 
    Clock, Users, Tv, AlertTriangle, ExternalLink, Info, Layout, CheckCircle, X
} from 'lucide-react';
import Logo from "../../assets/RCF-PP.jpg";

// --- API Definitions ---
const API_URL = process.env.REACT_APP_BACKEND_API_URL;

const fetchActiveCohorts = () => axios.get(`${API_URL}/api/timetable/cohorts/active`);
const fetchBatchesByCohort = (cohortId) => axios.get(`${API_URL}/api/timetable/cohorts/${cohortId}/batches`);
const fetchConfigData = () => Promise.all([
    axios.get(`${API_URL}/api/timetable/data/subjects`),
    axios.get(`${API_URL}/api/timetable/data/teachers`),
]);
const fetchClassroomsByBatch = (batchId) => axios.get(`${API_URL}/api/coordinator/classrooms/${batchId}`);
const checkConflictApi = (params) => axios.get(`${API_URL}/api/coordinator/timetable/check-conflict?${params.toString()}`);

const addSubject = (data) => axios.post(`${API_URL}/api/timetable/data/subjects`, data);
const deleteSubject = (id) => axios.delete(`${API_URL}/api/timetable/data/subjects/${id}`);

const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const t12 = (timeStr) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
};

// --- Custom Hooks ---
const useFetchCohorts = (setCohorts, setLoading, setError) => {
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                setLoading(true);
                const response = await fetchActiveCohorts();
                setCohorts(response.data || []);
            } catch (err) {
                setError("Failed to fetch cohorts.");
                setCohorts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCohorts();
    }, [setCohorts, setLoading, setError]);
};

const useFetchBatches = (cohortId, setBatches, setLoading, setError) => {
    useEffect(() => {
        if (!cohortId) {
            setBatches([]);
            return;
        }
        const fetchBatches = async () => {
            try {
                setLoading(true);
                const response = await fetchBatchesByCohort(cohortId);
                setBatches(response.data || []);
            } catch (err) {
                setError(`Failed to fetch batches.`);
                setBatches([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [cohortId, setBatches, setLoading, setError]);
};

// --- EditTimetableModal Component ---
const EditTimetableModal = ({ isOpen, onClose, slotData, onSave, day, dropdownData, batchId, classrooms }) => {
    const { subjects, teachers } = dropdownData;

    const [formData, setFormData] = useState({
        id: null, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', 
        subjectId: '', teacherId: '', classroomId: '', classLink: ''
    });

    useEffect(() => {
        if (slotData) {
            setFormData({
                id: slotData.timetable_id || slotData.id,
                dayOfWeek: slotData.day_of_week || day || 'MONDAY',
                startTime: slotData.start_time || '09:00',
                endTime: slotData.end_time || '10:00',
                subjectId: slotData.subject_id || '',
                teacherId: slotData.teacher_id || '', 
                classroomId: slotData.classroom_id || '',
                classLink: slotData.class_link || ''
            });
        } else {
            setFormData({ 
                id: null, dayOfWeek: day || 'MONDAY', startTime: '09:00', endTime: '10:00', 
                subjectId: '', teacherId: '', classroomId: '', classLink: '' 
            });
        }
    }, [slotData, day]);

    const handleChange = (field, value) => {
        if (field === 'classroomId') {
            const selected = classrooms.find(c => String(c.classroom_id) === String(value));
            setFormData(prev => ({ ...prev, classroomId: value, classLink: selected?.class_link || "" }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData.id, {
            batch_id: batchId,
            day_of_week: formData.dayOfWeek,
            start_time: formData.startTime,
            end_time: formData.endTime,
            subject_id: formData.subjectId,
            teacher_id: formData.teacherId,
            classroom_id: formData.classroomId,
            class_link: formData.classLink
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className={styles.modalTitle}>{formData.id ? 'Edit' : 'Create New'} Class Slot</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label className={styles.label}>Classroom</label>
                        {formData.id ? (
                            <div className={styles.textInput} style={{ background: '#f3f4f6' }}>
                                {classrooms.find(c => String(c.classroom_id) === String(formData.classroomId))?.classroom_name || 'Assigned Room'}
                            </div>
                        ) : (
                            <select value={formData.classroomId} onChange={(e) => handleChange('classroomId', e.target.value)} className={styles.selectInput} required>
                                <option value="">Select Classroom</option>
                                {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label className={styles.label}>Class Link</label>
                        <input type="url" value={formData.classLink} onChange={(e) => handleChange('classLink', e.target.value)} className={styles.textInput} readOnly={!formData.id} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Day of Week</label>
                        <select value={formData.dayOfWeek} onChange={(e) => handleChange('dayOfWeek', e.target.value)} className={styles.selectInput} required>
                            {DAY_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subject</label>
                        <select value={formData.subjectId} onChange={(e) => handleChange('subjectId', e.target.value)} className={styles.selectInput} required>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} - {s.subject_name}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Time</label>
                        <input type="time" value={formData.startTime} onChange={(e) => handleChange('startTime', e.target.value)} className={styles.textInput} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>End Time</label>
                        <input type="time" value={formData.endTime} onChange={(e) => handleChange('endTime', e.target.value)} className={styles.textInput} required />
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label className={styles.label}>Teacher</label>
                        <select value={formData.teacherId} onChange={(e) => handleChange('teacherId', e.target.value)} className={styles.selectInput} required>
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.user_name}</option>)}
                        </select>
                    </div>

                    <div className={styles.modalActions} style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className={styles.buttonSecondary}>Discard</button>
                        <button type="submit" className={styles.buttonPrimary}><CheckCircle size={18} className="mr-2 inline" /> Save Slot</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- TimetableGridView Component ---
const TimetableGridView = ({ timetable, onEditSlot, onDeleteSlot, isBatchSelected, conflictsMap }) => (
    <div className={styles.timetableContainer}>
        <table className={styles.timetableGrid}>
            <thead>
                <tr>
                    <th style={{ width: "120px" }}>Day</th>
                    <th>Time Slot</th>
                    <th>Subject Name</th>
                    <th>Assigned Teacher</th>
                    <th>Classroom</th>
                    <th>Online Link</th>
                    <th style={{ width: "100px" }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {DAY_ORDER.map(day => {
                    const daySlots = timetable[day] || [];
                    if (daySlots.length === 0 && isBatchSelected) return null;
                    
                    return daySlots.map((slot, index) => (
                        <tr key={slot.timetable_id || slot.id} className={styles.slotRow} style={{ backgroundColor: conflictsMap[slot.timetable_id || slot.id] ? "#fff1f2" : "inherit" }}>
                            {index === 0 && <td rowSpan={daySlots.length} className={styles.dayCell} style={{ fontWeight: '700', color: '#1e40af' }}>{day}</td>}
                            <td style={{ fontWeight: '600', color: '#4b5563' }}>{t12(slot.start_time)} - {t12(slot.end_time)}</td>
                            <td>{slot.subject_name || slot.subject}</td>
                            <td>{slot.teacher_name || slot.teacher}</td>
                            <td><span style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #dbeafe' }}>{slot.classroom_name}</span></td>
                            <td>
                                {slot.class_link ? (
                                    <a href={slot.class_link} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ExternalLink size={14} /> Join
                                    </a>
                                ) : <span style={{ color: '#9ca3af' }}>-</span>}
                            </td>
                            <td>
                                <div className={styles.slotActions} style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => onEditSlot(day, slot)} style={{ color: '#d97706', border: 'none', background: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                                    <button onClick={() => onDeleteSlot(slot.timetable_id || slot.id)} style={{ color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ));
                })}
                {Object.values(timetable).every(slots => slots.length === 0) && isBatchSelected && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No data found for this batch.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- DownloadButtons Component ---
const DownloadButtons = ({ timetable, batchName, cohortName }) => {
    const flatRows = DAY_ORDER.filter(d => timetable[d]).flatMap(day => {
        const sessions = timetable[day];
        return sessions.map((r, index) => ({
            ...r,
            rowSpan: index === 0 ? sessions.length : 0 
        }));
    });

    const handleExcelDownload = () => {
        const rows = flatRows.map(r => ({
            Day: r.day_of_week, Time: `${t12(r.start_time)} - ${t12(r.end_time)}`,
            "Subject Code": r.subject_code || "-", Teacher: r.teacher_name || "-",
            Classroom: r.classroom_name || "-", Link: r.class_link || "-"
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timetable");
        XLSX.writeFile(wb, `Timetable-${batchName.replace(/ /g, '_')}.xlsx`);
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;

        try {
            const logoWidth = 50;
            const logoHeight = 50;
            doc.addImage(Logo, 'JPEG', pageWidth - margin - logoWidth, 20, logoWidth, logoHeight);
        } catch (e) {}

        const title = `COHORT ${cohortName || ""} - ${batchName || "N/A"} - TIME TABLE`;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title, pageWidth / 2, 45, { align: "center" });

        autoTable(doc, {
            startY: 80,
            head: [["Day", "Time", "Subject Code", "Teacher", "Classroom", "Link"]],
            body: flatRows.map(r => [
                r.rowSpan > 0 ? { content: r.day_of_week, rowSpan: r.rowSpan } : null,
                `${t12(r.start_time)} - ${t12(r.end_time)}`,
                r.subject_code || "-", r.teacher_name || "-",
                r.classroom_name || "-", r.class_link ? "JOIN CLASS" : "-"
            ].filter(cell => cell !== null)),
            
            theme: "grid",
            headStyles: { fillColor: [16, 185, 129], halign: 'center' },
            styles: { fontSize: 8, valign: 'middle' },
            columnStyles: { 0: { halign: 'center', fontStyle: 'bold' }, 5: { halign: 'center' } },

            willDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 5) {
                    const link = flatRows[data.row.index]?.class_link;
                    if (link && link !== "-") doc.setTextColor(0, 0, 255);
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 5) {
                    const link = flatRows[data.row.index]?.class_link;
                    if (link && link !== "-") {
                        const text = data.cell.text[0];
                        const textWidth = doc.getTextWidth(text);
                        const startX = data.cell.x + (data.cell.width - textWidth) / 2;
                        const startY = data.cell.y + data.cell.height - 5;
                        doc.setDrawColor(0, 0, 255);
                        doc.line(startX, startY, startX + textWidth, startY);
                        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link });
                    }
                }
            }
        });
        doc.save(`Timetable-${batchName.replace(/ /g, '_')}.pdf`);
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Download Timetable</h2>
            <div className={styles.buttonGroup}>
                <button onClick={handleExcelDownload} className={`${styles.button} ${styles.buttonExcel}`}><Download size={16} /> Excel (.xlsx)</button>
                <button onClick={handlePdfDownload} className={`${styles.button} ${styles.buttonPdf}`}><Download size={16} /> PDF (.pdf)</button>
            </div>
        </div>
    );
};

// --- Main TimetableDashboard Component ---
const TimetableDashboard = () => {
    const [selectedCohort, setSelectedCohort] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Core Data State
    const [cohorts, setCohorts] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [timetable, setTimetable] = useState({});
    const [dropdownData, setDropdownData] = useState({ subjects: [], teachers: [] });
    
    // Conflict UI State
    const [conflictsMap, setConflictsMap] = useState({});
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflictDetails, setConflictDetails] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentPath = ['Admin', 'Academics', 'TimeTable'];

    useFetchCohorts(setCohorts, setLoading, setError);
    useFetchBatches(selectedCohort?.cohort_number, setBatches, setLoading, setError);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [subjectsRes, teachersRes] = await fetchConfigData();
            setDropdownData({ subjects: subjectsRes.data, teachers: teachersRes.data });
        } catch (err) {
            setError("Failed to load configuration data.");
        }
    }, []);
    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    const handleCohortChange = useCallback((cohort) => {
        setSelectedCohort(cohort);
        setSelectedBatch(null);
        setTimetable({});
        setClassrooms([]);
    }, []);

    const handleBatchChange = useCallback(async (batch) => {
        if (!batch || !batch.batch_id) return;
        setSelectedBatch(batch);
        setLoading(true);
        setError(null);
        setConflictsMap({});
        try {
            const [timetableRes, classroomsRes] = await Promise.all([
                axios.get(`${API_URL}/api/timetable/batch/${batch.batch_id}`),
                fetchClassroomsByBatch(batch.batch_id)
            ]);
            
            const rawTimetable = timetableRes.data || [];
            // Group by day exactly like Snippet 1
            const grouped = rawTimetable.reduce((acc, curr) => {
                const day = curr.day_of_week || curr.day;
                if (!acc[day]) acc[day] = [];
                acc[day].push(curr);
                return acc;
            }, {});
            
            setTimetable(grouped);
            setClassrooms(classroomsRes.data || []);
        } catch (err) {
            setError("Failed to fetch timetable or classrooms for the selected batch.");
            setTimetable({});
            setClassrooms([]);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const refreshTimetable = useCallback(async () => {
        if (!selectedBatch) return;
        await handleBatchChange(selectedBatch);
    }, [selectedBatch, handleBatchChange]);

    const handleAddSlot = (day) => {
        setEditingSlot({ day: day || 'MONDAY', slot: null });
        setIsEditModalOpen(true);
    };

    const handleEditSlot = (day, slot) => {
        setEditingSlot({ day, slot });
        setIsEditModalOpen(true);
    };

    const handleDeleteSlot = async (slotId) => {
        if (window.confirm("Are you sure you want to delete this class slot?")) {
            try {
                await axios.delete(`${API_URL}/api/timetable/${slotId}`);
                await refreshTimetable();
            } catch (err) {
                setError("Failed to delete slot. Please try again.");
            }
        }
    };

    const validateSlot = async (slotData, excludeId) => {
        const params = new URLSearchParams({ 
            classroomId: slotData.classroom_id, 
            day: slotData.day_of_week, 
            startTime: slotData.start_time, 
            endTime: slotData.end_time 
        });
        if (excludeId) params.append("excludeId", excludeId);

        try {
            const res = await checkConflictApi(params);
            if (res.data?.overlap) {
                const conflicts = res.data.conflicts || [];
                setConflictsMap(conflicts.reduce((a, c) => ({ ...a, [c.timetable_id]: true }), {}));
                setConflictDetails(conflicts);
                setShowConflictModal(true);
                return { ok: false };
            }
            return { ok: true };
        } catch (err) { 
            return { ok: false }; 
        }
    };

    const handleSaveSlot = async (slotId, slotData) => {
        const val = await validateSlot(slotData, slotId);
        if (!val.ok) return;

        const isUpdating = !!slotId;
        const url = isUpdating ? `${API_URL}/api/timetable/${slotId}` : `${API_URL}/api/timetable`;
        const method = isUpdating ? 'put' : 'post';
        
        try {
            await axios({ url, method, data: slotData });
            await refreshTimetable();
            setIsEditModalOpen(false);
            setEditingSlot(null);
            setConflictsMap({});
        } catch (err) {
            alert(`Error saving slot: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className={styles.dashboardPage}>
            <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Academics']} />    
            <header className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={Logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
                    <div>
                        <h1 className={styles.pageTitle}>Timetable Management</h1>
                        <p className={styles.subtitle} style={{ color: '#6b7280' }}>Manage dynamic scheduling and room allocation</p>
                    </div>
                </div>
            </header>

            {error && <div className={`${styles.card} ${styles.errorCard}`}><AlertCircle size={20} /> {error}</div>}
            
            <div className={styles.mainLayout}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Controls</h2>
                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>1. Select Cohort</label>
                            <select
                                value={selectedCohort ? selectedCohort.cohort_number : ''}
                                onChange={(e) => handleCohortChange(cohorts.find(c => c.cohort_number.toString() === e.target.value))}
                                className={styles.selectInput}
                            >
                                <option value="" disabled>Choose a cohort...</option>
                                {cohorts.map(c => <option key={c.cohort_number} value={c.cohort_number}>{c.cohort_name}</option>)}
                            </select>
                        </div>
                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>2. Select Batch</label>
                            <select
                                value={selectedBatch ? selectedBatch.batch_id : ''}
                                onChange={(e) => handleBatchChange(batches.find(b => b.batch_id.toString() === e.target.value))}
                                className={styles.selectInput}
                                disabled={!selectedCohort || batches.length === 0}
                            >
                                <option value="" disabled>Choose a batch...</option>
                                {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    {!selectedBatch ? (
                        <div className={`${styles.card} ${styles.placeholderCard}`} style={{ padding: '80px', textAlign: 'center' }}>
                            <Clock size={48} style={{ color: '#d1d5db', marginBottom: '15px' }} />
                            <h3 className={styles.placeholderTitle}>Select a Cohort and Batch</h3>
                            <p className={styles.placeholderText}>Choose a cohort and batch from the controls to view or edit the timetable.</p>
                        </div>
                    ) : loading ? (
                        <div className={`${styles.card} ${styles.placeholderCard}`}>
                            <div className={styles.loader}></div>
                            <p className={styles.loadingText}>Loading Timetable...</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                                <div className={styles.cardHeader} style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                    <h2 className={styles.cardTitle}>Weekly Timetable for {selectedBatch.batch_name}</h2>
                                    <div className={styles.cardActions}>
                                        <button onClick={() => handleAddSlot()} className={`${styles.button} ${styles.buttonPrimary}`}><Plus size={16} /> Add Slot</button>
                                    </div>
                                </div>
                                <TimetableGridView
                                    timetable={timetable}
                                    onEditSlot={handleEditSlot}
                                    onDeleteSlot={handleDeleteSlot}
                                    isBatchSelected={!!selectedBatch}
                                    conflictsMap={conflictsMap}
                                />
                            </div>
                            <DownloadButtons timetable={timetable} batchName={selectedBatch.batch_name} cohortName={selectedCohort?.cohort_number} />
                        </>
                    )}
                </div>
            </div>

            {isEditModalOpen && (
                <EditTimetableModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    slotData={editingSlot?.slot} 
                    day={editingSlot?.day} 
                    onSave={handleSaveSlot} 
                    dropdownData={dropdownData} 
                    batchId={selectedBatch?.batch_id}
                    classrooms={classrooms}
                />
            )}

            {/* CONFLICT MODAL */}
            {showConflictModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px', borderTop: '5px solid #ef4444' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '10px', display: 'inline-block' }} />
                            <h3 className={styles.modalTitle} style={{ color: '#b91c1c' }}>Schedule Conflict Detected</h3>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>The proposed time slot overlaps with existing classes:</p>
                        </div>

                        <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                            {conflictDetails.map((c, i) => (
                                <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i !== conflictDetails.length - 1 ? '1px solid #fecaca' : 'none' }}>
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#991b1b' }}>{i + 1}. {c.subject_name}</div>
                                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={12}/> Teacher: {c.teacher_name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Layout size={12}/> Room: {c.classroom_name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12}/> {t12(c.start_time)} - {t12(c.end_time)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={`${styles.button} ${styles.buttonPrimary}`} style={{ backgroundColor: '#ef4444', width: '100%', justifyContent: 'center' }} onClick={() => setShowConflictModal(false)}>
                                I Understand, Let me fix it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetableDashboard;