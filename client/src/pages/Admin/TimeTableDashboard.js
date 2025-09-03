import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from 'axios';
import styles from "./TimeTableDashboard.module.css";
import { Plus, Trash2, Edit, Download } from 'lucide-react';

// --- Custom Hooks for Data Fetching ---
const useFetchCohorts = (setCohorts, setLoading, setError) => {
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/cohorts/active`);
                setCohorts(response.data);
            } catch (err) {
                setError("Failed to fetch cohorts.");
                console.error("Failed to fetch cohorts:", err);
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
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/cohort/${cohortId}`);
                setBatches(response.data);
            } catch (err) {
                setError(`Failed to fetch batches for the selected cohort.`);
                console.error(`Failed to fetch batches for cohort ${cohortId}:`, err);
                setBatches([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [cohortId, setBatches, setLoading, setError]);
};

const useFetchDropdownData = (setData, setError) => {
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [subjectsRes, teachersRes, platformsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/data/subjects`),
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/data/teachers`),
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/data/platforms`),
                ]);
                setData({
                    subjects: subjectsRes.data,
                    teachers: teachersRes.data,
                    platforms: platformsRes.data
                });
            } catch (err) {
                setError("Failed to load configuration data (subjects, teachers, platforms).");
                console.error("Failed to fetch dropdown data:", err);
            }
        };
        fetchAll();
    }, [setData, setError]);
};


// --- Helper Functions ---
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const generateEmptyTimetable = () => {
    const timetable = {};
    daysOfWeek.forEach(day => { timetable[day] = []; });
    return timetable;
};

// --- Child Components ---
const DataManagementModal = ({ isOpen, onClose, title, items, placeholder }) => {
    const [newItem, setNewItem] = useState('');
    if (!isOpen) return null;

    const handleAddItem = () => {
        if (newItem.trim() && !items.find(item => item.name === newItem.trim())) {
            console.log("Adding new item (requires backend logic):", newItem);
            setNewItem('');
        }
    };
    const handleRemoveItem = (itemToRemove) => {
        console.log("Removing item (requires backend logic):", itemToRemove);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>{title}</h2>
                <div className={styles.modalFormGroup}>
                    <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={placeholder} className={styles.textInput} />
                    <button onClick={handleAddItem} className={styles.buttonPrimary}>Add</button>
                </div>
                <div className={styles.modalListContainer}>
                    <ul className={styles.modalList}>
                        {items.map((item) => (
                            <li key={item.id} className={styles.modalListItem}>
                                <span>{item.name}</span>
                                <button onClick={() => handleRemoveItem(item)} className={`${styles.buttonIcon} ${styles.delete}`}><Trash2 size={16} /></button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.buttonSecondary}>Close</button>
                </div>
            </div>
        </div>
    );
};

const CohortSelector = ({ cohorts, selectedCohort, onCohortChange }) => (
    <div className={styles.card}>
        <h2 className={styles.cardTitle}>Select Cohort</h2>
        <div className={styles.selectorGrid}>
            {cohorts.map(cohort => (
                <div key={cohort.cohort_number} className={`${styles.selectorItem} ${selectedCohort?.cohort_number === cohort.cohort_number ? styles.selected : ''}`} onClick={() => onCohortChange(cohort)}>
                    <h3 className={styles.itemName}>{cohort.cohort_name}</h3>
                    <p className={styles.itemDetail}>Start Date: {new Date(cohort.start_date).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    </div>
);

const BatchSelector = ({ batches, selectedBatch, onBatchChange, cohortSelected }) => {
    if (!cohortSelected) {
        return (
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Select Batch</h2>
                <p className={styles.placeholderText}>Please select a cohort first.</p>
            </div>
        );
    }
    if (batches.length === 0) {
        return (
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Select Batch</h2>
                <p className={styles.placeholderText}>No batches found for this cohort.</p>
            </div>
        );
    }
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Select Batch</h2>
            <div className={styles.selectorGrid}>
                {batches.map(batch => (
                    <div key={batch.batch_id} className={`${styles.selectorItem} ${selectedBatch?.batch_id === batch.batch_id ? styles.selected : ''}`} onClick={() => onBatchChange(batch)}>
                        <h3 className={styles.itemName}>{batch.batch_name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditTimetableModal = ({ isOpen, onClose, slotData, onSave, day, dropdownData, batchId }) => {
    const { subjects, teachers, platforms } = dropdownData;
    const formatTo24Hour = (time12) => {
        if (!time12) return '';
        const [time, period] = time12.split(' ');
        if (!period) return '';
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        if (period.toLowerCase() === 'pm' && hours !== 12) hours += 12;
        if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (slotData) {
            const [startStr, endStr] = slotData.time ? slotData.time.split(' - ') : ['', ''];
            const teacher = teachers.find(t => t.user_name === slotData.teacher);
            const subject = subjects.find(s => s.subject_name === slotData.subject);
            const platform = platforms.find(p => p.platform_name === slotData.platform);
            setFormData({
                id: slotData.id,
                startTime: formatTo24Hour(startStr),
                endTime: formatTo24Hour(endStr),
                subjectId: subject ? subject.subject_id : '',
                teacherId: teacher ? teacher.user_id : '',
                platformId: platform ? platform.platform_id : '',
            });
        } else {
            setFormData({ id: null, startTime: '', endTime: '', subjectId: '', teacherId: '', platformId: '' });
        }
    }, [slotData, subjects, teachers, platforms]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalSlotData = {
            batchId,
            dayOfWeek: day,
            startTime: formData.startTime,
            endTime: formData.endTime,
            subjectId: formData.subjectId,
            teacherId: formData.teacherId,
            platformId: formData.platformId,
        };
        onSave(slotData?.id, finalSlotData);
        onClose();
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>{slotData.id ? 'Edit' : 'Add'} Class Slot</h2>
                <p className={styles.modalSubtitle}>{day}</p>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.timePickerContainer}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Start Time</label>
                            <input type="time" value={formData.startTime || ''} onChange={(e) => handleChange('startTime', e.target.value)} className={styles.textInput} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>End Time</label>
                            <input type="time" value={formData.endTime || ''} onChange={(e) => handleChange('endTime', e.target.value)} className={styles.textInput} required />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subject</label>
                        <select value={formData.subjectId || ''} onChange={(e) => handleChange('subjectId', e.target.value)} className={styles.selectInput} required>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Teacher</label>
                        <select value={formData.teacherId || ''} onChange={(e) => handleChange('teacherId', e.target.value)} className={styles.selectInput} required>
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Platform</label>
                        <select value={formData.platformId || ''} onChange={(e) => handleChange('platformId', e.target.value)} className={styles.selectInput} required>
                            <option value="">Select Platform</option>
                            {platforms.map(p => <option key={p.platform_id} value={p.platform_id}>{p.platform_name}</option>)}
                        </select>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.buttonSecondary}>Cancel</button>
                        <button type="submit" className={styles.buttonPrimary}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TimetableGridView = ({ timetable, onEditSlot, onDeleteSlot, isBatchSelected }) => (
    <div className={styles.timetableContainer}>
        <table className={styles.timetableGrid}>
            <thead>
                <tr>
                    <th>Day</th><th>Timings</th><th>Subject</th><th>Teacher</th><th>Platform</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {daysOfWeek.map(day => {
                    const daySlots = timetable[day] || [];
                    if (daySlots.length === 0 && isBatchSelected) {
                        return (
                            <tr key={day}>
                                <td className={styles.dayCell}>{day}</td>
                                <td colSpan="5" className={styles.placeholderText}>No classes scheduled.</td>
                            </tr>
                        );
                    }
                    return daySlots.map((slot, index) => (
                        <tr key={slot.id} className={styles.slotRow}>
                            {index === 0 && <td rowSpan={daySlots.length} className={styles.dayCell}>{day}</td>}
                            <td>{slot.time}</td>
                            <td>{slot.subject}</td>
                            <td>{slot.teacher}</td>
                            <td>{slot.platform}</td>
                            <td>
                                <div className={styles.slotActions}>
                                    <button onClick={() => onEditSlot(day, slot)} className={styles.buttonIcon}><Edit size={16} /></button>
                                    <button onClick={() => onDeleteSlot(slot.id)} className={`${styles.buttonIcon} ${styles.delete}`}><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ));
                })}
            </tbody>
        </table>
    </div>
);

const TeacherTimetableView = ({ timetable, teachers }) => {
    const classesByTeacher = teachers.reduce((acc, teacher) => {
        acc[teacher.user_name] = [];
        return acc;
    }, {});

    Object.values(timetable).flat().forEach(slot => {
        if (slot.teacher && classesByTeacher[slot.teacher]) {
            classesByTeacher[slot.teacher].push({ ...slot, day: slot.day_of_week });
        }
    });

    return (
        <div className={styles.timetableContainer}>
            <table className={styles.timetableGrid}>
                <thead>
                    <tr>
                        <th>Teacher</th><th>Day</th><th>Timings</th><th>Subject</th><th>Platform</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(classesByTeacher).map(([teacher, slots]) => {
                        if (slots.length === 0) {
                            return (
                                <tr key={teacher}>
                                    <td className={styles.teacherCell}>{teacher}</td>
                                    <td colSpan="4" className={styles.placeholderText}>No classes scheduled.</td>
                                </tr>
                            );
                        }
                        return slots.map((slot, index) => (
                            <tr key={slot.id} className={styles.slotRow}>
                                {index === 0 && <td rowSpan={slots.length} className={styles.teacherCell}>{teacher}</td>}
                                <td>{slot.day}</td>
                                <td>{slot.time}</td>
                                <td>{slot.subject}</td>
                                <td>{slot.platform}</td>
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
        </div>
    );
};

const DownloadButtons = ({ timetable, batchName }) => {
    const handleExcelDownload = () => {
        const rows = Object.values(timetable).flat().map(slot => [
            slot.day_of_week, slot.time, slot.subject, slot.teacher, slot.platform
        ]);
        const ws = XLSX.utils.aoa_to_sheet([["Day", "Time", "Subject", "Teacher", "Platform"], ...rows]);
        ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timetable");
        XLSX.writeFile(wb, `Timetable-${batchName.replace(/ /g, '_')}.xlsx`);
    };
    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Timetable for ${batchName}`, 14, 22);
        const body = [];
        daysOfWeek.forEach(day => {
            const daySlots = timetable[day] || [];
            if (daySlots.length > 0) {
                daySlots.forEach((slot, index) => {
                    const row = [];
                    if (index === 0) row.push({ content: day, rowSpan: daySlots.length, styles: { valign: 'middle', halign: 'center' } });
                    row.push(slot.time, slot.subject, slot.teacher, slot.platform);
                    body.push(row);
                });
            }
        });
        autoTable(doc, {
            head: [["Day", "Timings", "Subject", "Teacher", "Platform"]],
            body,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
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

const TeacherLoadReport = ({ timetable, teachers, batchName }) => {
    const [teacherLoad, setTeacherLoad] = useState({});
    useEffect(() => {
        const load = {};
        teachers.forEach(teacher => {
            load[teacher.user_name] = { count: 0, classes: [] };
        });
        if (timetable && batchName) {
            Object.values(timetable).flat().forEach(slot => {
                if (slot.teacher && load[slot.teacher]) {
                    load[slot.teacher].count++;
                    load[slot.teacher].classes.push({ subject: slot.subject, platform: slot.platform, batch: batchName });
                }
            });
        }
        setTeacherLoad(load);
    }, [timetable, teachers, batchName]);
    
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Teacher Load Report</h2>
            </div>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Class Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(teacherLoad).map(([teacher, data]) => (
                            <tr key={teacher}>
                                <td>{teacher}</td>
                                <td>{data.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main App Component ---
const TimetableDashboard = () => {
    const [selectedCohort, setSelectedCohort] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('day');
    const [modalType, setModalType] = useState(null);
    const [error, setError] = useState(null);

    const [cohorts, setCohorts] = useState([]);
    const [batches, setBatches] = useState([]);
    const [timetable, setTimetable] = useState(generateEmptyTimetable());
    const [dropdownData, setDropdownData] = useState({ subjects: [], teachers: [], platforms: [] });

    // Use custom hooks for data fetching
    useFetchCohorts(setCohorts, setLoading, setError);
    useFetchBatches(selectedCohort?.cohort_number, setBatches, setLoading, setError);
    useFetchDropdownData(setDropdownData, setError);

    const handleCohortChange = useCallback((cohort) => {
        setSelectedCohort(cohort);
        setSelectedBatch(null);
        setTimetable(generateEmptyTimetable());
    }, []);

    const handleBatchChange = useCallback(async (batch) => {
        if (!batch || !batch.batch_id) return;
        setSelectedBatch(batch);
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/${batch.batch_id}`);
            const timetableData = response.data;
            const fullTimetable = generateEmptyTimetable();
            Object.assign(fullTimetable, timetableData);
            setTimetable(fullTimetable);
        } catch (err) {
            setError("Failed to fetch timetable for the selected batch.");
            setTimetable(generateEmptyTimetable());
        } finally {
            setLoading(false);
        }
    }, []);
    
    const refreshTimetable = useCallback(async () => {
        if (!selectedBatch) return;
        await handleBatchChange(selectedBatch);
    }, [selectedBatch, handleBatchChange]);

    const handleAddSlot = (day) => {
        const targetDay = day || prompt("Which day to add the class to?", "Monday");
        if (targetDay && daysOfWeek.includes(targetDay)) {
            setEditingSlot({ day: targetDay, slot: {} });
            setIsEditModalOpen(true);
        }
    };

    const handleEditSlot = (day, slot) => {
        setEditingSlot({ day, slot });
        setIsEditModalOpen(true);
    };

    const handleDeleteSlot = async (slotId) => {
        if (window.confirm("Are you sure you want to delete this class slot?")) {
            const originalTimetable = { ...timetable };
            const newTimetable = { ...timetable };
            for (const day in newTimetable) {
                newTimetable[day] = newTimetable[day].filter(s => s.id !== slotId);
            }
            setTimetable(newTimetable);

            try {
                await axios.delete(`${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/${slotId}`);
            } catch (err) {
                setError("Failed to delete slot. Reverting changes.");
                setTimetable(originalTimetable);
            }
        }
    };

    const handleCloseModal = useCallback(() => {
        setIsEditModalOpen(false);
        setEditingSlot(null);
    }, []);

    const handleSaveSlot = useCallback(async (slotId, slotData) => {
        const isUpdating = !!slotId;
        const url = isUpdating 
            ? `${process.env.REACT_APP_BACKEND_API_URL}/api/timetable/${slotId}` 
            : `${process.env.REACT_APP_BACKEND_API_URL}/api/timetable`;
        const method = isUpdating ? 'put' : 'post';
        
        try {
            await axios({ url, method, data: slotData });
            await refreshTimetable();
            handleCloseModal();
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
    }, [refreshTimetable, handleCloseModal]);

    const openDataModal = (type) => setModalType(type);
    const closeDataModal = () => setModalType(null);
    
    const getModalProps = () => {
        const { subjects, teachers, platforms } = dropdownData;
        switch (modalType) {
            case 'subjects': return { title: 'Manage Subjects', items: subjects.map(s => ({ id: s.subject_id, name: s.subject_name })), placeholder: 'e.g., History' };
            case 'teachers': return { title: 'Manage Teachers', items: teachers.map(t => ({ id: t.user_id, name: t.user_name })), placeholder: 'e.g., Mr. John Doe' };
            case 'platforms': return { title: 'Manage Platforms', items: platforms.map(p => ({ id: p.platform_id, name: p.platform_name })), placeholder: 'e.g., Skype' };
            default: return null;
        }
    };

    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.container}>
                    <h1 className={styles.mainTitle}>Timetable Management System</h1>
                    <p className={styles.subtitle}>A flexible and modern scheduling tool.</p>
                </div>
            </header>
            <main className={`${styles.container} ${styles.mainContent}`}>
                {error && <div className={`${styles.card} ${styles.error}`}>{error}</div>}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Configuration</h2>
                    <div className={styles.configGrid}>
                        <button onClick={() => openDataModal('subjects')} className={styles.button}>Manage Subjects</button>
                        <button onClick={() => openDataModal('teachers')} className={styles.button}>Manage Teachers</button>
                        <button onClick={() => openDataModal('platforms')} className={styles.button}>Manage Platforms</button>
                    </div>
                </div>
                
                {loading && !cohorts.length ? (
                     <div className={styles.card}><div className={styles.loader}></div><p className={styles.loadingText}>Loading initial data...</p></div>
                ) : (
                    <>
                        <CohortSelector cohorts={cohorts} selectedCohort={selectedCohort} onCohortChange={handleCohortChange} />
                        <BatchSelector batches={batches} selectedBatch={selectedBatch} onBatchChange={handleBatchChange} cohortSelected={!!selectedCohort} />
                    </>
                )}

                {loading && selectedBatch && (
                    <div className={styles.card}><div className={styles.loader}></div><p className={styles.loadingText}>Loading timetable...</p></div>
                )}

                {!loading && selectedBatch && (
                    <div className={styles.layoutGrid}>
                        <div className={styles.mainColumn}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}>Weekly Timetable for {selectedBatch ? selectedBatch.batch_name : '...'}</h2>
                                    <div className={styles.viewToggle}>
                                        <button onClick={() => setViewMode('day')} className={viewMode === 'day' ? styles.active : ''}>Day View</button>
                                        <button onClick={() => setViewMode('teacher')} className={viewMode === 'teacher' ? styles.active : ''}>Teacher View</button>
                                    </div>
                                    {selectedBatch && viewMode === 'day' && <button onClick={() => handleAddSlot()} className={styles.buttonSmall}><Plus size={16} /> Add Class</button>}
                                </div>
                                {viewMode === 'day' ? (
                                    <TimetableGridView
                                        timetable={timetable}
                                        onEditSlot={handleEditSlot}
                                        onDeleteSlot={handleDeleteSlot}
                                        isBatchSelected={!!selectedBatch}
                                    />
                                ) : (
                                    <TeacherTimetableView
                                        timetable={timetable}
                                        teachers={dropdownData.teachers}
                                    />
                                )}
                            </div>
                        </div>
                        <div className={styles.sidebarColumn}>
                            {selectedBatch && (
                                <>
                                    <TeacherLoadReport
                                        timetable={timetable}
                                        teachers={dropdownData.teachers}
                                        batchName={selectedBatch.batch_name}
                                    />
                                    <DownloadButtons
                                        timetable={timetable}
                                        batchName={selectedBatch.batch_name}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {isEditModalOpen && (
                    <EditTimetableModal
                        isOpen={isEditModalOpen}
                        onClose={handleCloseModal}
                        slotData={editingSlot?.slot}
                        day={editingSlot?.day}
                        onSave={handleSaveSlot}
                        dropdownData={dropdownData}
                        batchId={selectedBatch?.batch_id}
                    />
                )}
                
                {modalType && (
                    <DataManagementModal isOpen={!!modalType} onClose={closeDataModal} {...getModalProps()} />
                )}
            </main>
        </div>
    );
};

export default TimetableDashboard;
