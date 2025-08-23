import React, { useState, useEffect, useCallback } from "react";
import styles from "./TimeTableDashboard.module.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Corrected import
import * as XLSX from 'xlsx';


// Mock data for demonstration
const mockCohorts = [
  { id: 1, name: 'Cohort-1', year: 2022, totalBatches: 8 },
  { id: 2, name: 'Cohort-2', year: 2023, totalBatches: 12 },
  { id: 3, name: 'Cohort-3', year: 2024, totalBatches: 10 }
];

const mockBatches = {
  1: [
    { id: 101, name: 'Batch A', cohortId: 1, students: 25 },
    { id: 102, name: 'Batch B', cohortId: 1, students: 30 },
    { id: 103, name: 'Batch C', cohortId: 1, students: 28 }
  ],
  2: [
    { id: 201, name: 'Batch Alpha', cohortId: 2, students: 32 },
    { id: 202, name: 'Batch Beta', cohortId: 2, students: 29 },
    { id: 203, name: 'Batch Gamma', cohortId: 2, students: 31 }
  ],
  3: [
    { id: 301, name: 'Batch X', cohortId: 3, students: 27 },
    { id: 302, name: 'Batch Y', cohortId: 3, students: 33 },
    { id: 303, name: 'Batch Z', cohortId: 3, students: 30 }
  ]
};

const mockTeachers = [
  { id: 1, name: 'Dr. Sarah Johnson', subject: 'Mathematics' },
  { id: 2, name: 'Prof. Michael Chen', subject: 'Physics' },
  { id: 3, name: 'Ms. Emily Davis', subject: 'Chemistry' },
  { id: 4, name: 'Dr. Robert Wilson', subject: 'Biology' },
  { id: 5, name: 'Mr. James Anderson', subject: 'Computer Science' },
  { id: 6, name: 'Ms. Lisa Brown', subject: 'English Literature' }
];

const mockSubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English Literature', 'History',
  'Geography', 'Art', 'Physical Education'
];

const timeSlots = [
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 2:00',
  '2:00 - 3:00',
  '3:00 - 4:00'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generates an empty timetable structure
const generateEmptyTimetable = () => {
  const timetable = {};
  daysOfWeek.forEach(day => {
    timetable[day] = {};
    timeSlots.forEach(timeSlot => {
      timetable[day][timeSlot] = {
        subject: '',
        teacher: '',
        platform: ''
      };
    });
  });
  return timetable;
};

const CohortSelector = ({ cohorts, selectedCohort, onCohortChange }) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Select Cohort</h2>
      <div className={styles.selectorGrid}>
        {cohorts.map(cohort => (
          <div
            key={cohort.id}
            className={`${styles.selectorItem} ${selectedCohort?.id === cohort.id ? styles.selectedCohort : ''}`}
            onClick={() => onCohortChange(cohort)}
          >
            <h3 className={styles.itemName}>{cohort.name}</h3>
            <p className={styles.itemDetail}>Year: {cohort.year}</p>
            <p className={styles.itemDetail}>Batches: {cohort.totalBatches}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const BatchSelector = ({ batches, selectedBatch, onBatchChange }) => {
  if (!batches || batches.length === 0) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Select Batch</h2>
        <p className={styles.placeholderText}>Please select a cohort first</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Select Batch</h2>
      <div className={styles.selectorGrid}>
        {batches.map(batch => (
          <div
            key={batch.id}
            className={`${styles.selectorItem} ${selectedBatch?.id === batch.id ? styles.selectedBatch : ''}`}
            onClick={() => onBatchChange(batch)}
          >
            <h3 className={styles.itemName}>{batch.name}</h3>
            <p className={styles.itemDetail}>Students: {batch.students}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditTimetableModal = ({ isOpen, onClose, timeSlotData, onSave, day, timeSlot }) => {
  const [formData, setFormData] = useState(timeSlotData);

  useEffect(() => {
    setFormData(timeSlotData || { subject: '', teacher: '', platform: '' });
  }, [timeSlotData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Edit Timetable Slot</h2>
        <p className={styles.modalSubtitle}>{day} - {timeSlot}</p>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div>
            <label className={styles.label}>Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Select Subject</option>
              {mockSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => handleChange('teacher', e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Select Teacher</option>
              {mockTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name} ({teacher.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>Platform</label>
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
              className={styles.textInput}
              placeholder="Platform"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton}>Save</button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TimetableGrid = ({ timetable, onCellClick, isBatchSelected }) => {
  return (
    <div className={`${styles.card} ${styles.timetableGrid}`}>
      <h2 className={styles.cardTitle}>Weekly Timetable</h2>
      {!isBatchSelected && <p className={styles.infoText}>Select a batch to enable editing.</p>}
      
      <div className={styles.gridContainer}>
        <div className={styles.gridHeader}>Time/Day</div>
        {daysOfWeek.map(day => (
          <div key={day} className={styles.gridHeader}>{day}</div>
        ))}

        {timeSlots.map(timeSlot => (
          <React.Fragment key={timeSlot}>
            <div className={styles.timeSlotHeader}>{timeSlot}</div>
            {daysOfWeek.map(day => {
              const slotData = timetable[day]?.[timeSlot] || {};
              return (
                <div
                  key={`${day}-${timeSlot}`}
                  className={`${styles.timetableCell} ${!isBatchSelected ? styles.disabledCell : ''}`}
                  onClick={isBatchSelected ? () => onCellClick(day, timeSlot, slotData) : undefined}
                >
                  {slotData.subject ? (
                    <div className={styles.cellContent}>
                      <div className={styles.cellSubject}>{slotData.subject}</div>
                      <div className={styles.cellTeacher}>{slotData.teacher}</div>
                      <div className={styles.cellPlatform}>{slotData.platform}</div>
                    </div>
                  ) : (
                    <div className={styles.emptyCell}>
                      <span>+</span>
                      <div className={styles.emptyCellText}>Add Class</div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const DownloadButtons = ({ timetable, batchName }) => {

    const handleExcelDownload = () => {
        const header = ["Time/Day", ...daysOfWeek];
        const rows = timeSlots.map(timeSlot => {
            const row = [timeSlot];
            daysOfWeek.forEach(day => {
                const slot = timetable[day]?.[timeSlot];
                if (slot && slot.subject) {
                    row.push(`${slot.subject}\n${slot.teacher}\n${slot.platform}`);
                } else {
                    row.push("");
                }
            });
            return row;
        });

        const worksheetData = [header, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        worksheet['!cols'] = [{ wch: 15 }, ...daysOfWeek.map(() => ({ wch: 25 }))];
        for (let R = 0; R < worksheetData.length; ++R) {
            for (let C = 0; C < worksheetData[R].length; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (worksheet[cell_ref]) {
                    worksheet[cell_ref].s = { alignment: { wrapText: true, vertical: 'center', horizontal: 'center' } };
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
        XLSX.writeFile(workbook, `Timetable-${batchName.replace(/ /g, '_')}.xlsx`);
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        doc.setFontSize(18);
        doc.text(`Timetable for ${batchName}`, 14, 22);

        const head = [["Time/Day", ...daysOfWeek]];
        const body = timeSlots.map(timeSlot => {
            const row = [timeSlot];
            daysOfWeek.forEach(day => {
                const slot = timetable[day]?.[timeSlot];
                if (slot && slot.subject) {
                    row.push(`${slot.subject}\n${slot.teacher}\n${slot.platform}`);
                } else {
                    row.push("");
                }
            });
            return row;
        });

        // Use the imported autoTable function
        autoTable(doc, {
            head: head,
            body: body,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'center' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
        });

        doc.save(`Timetable-${batchName.replace(/ /g, '_')}.pdf`);
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Download Timetable</h2>
            <div className={styles.downloadButtonGroup}>
                <button onClick={handleExcelDownload} className={styles.downloadButtonExcel}>
                    Download as Excel (.xlsx)
                </button>
                <button onClick={handlePdfDownload} className={styles.downloadButtonPdf}>
                    Download as PDF (.pdf)
                </button>
            </div>
        </div>
    );
};


const TimetableDashboard = () => {
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [timetable, setTimetable] = useState(generateEmptyTimetable());
  const [editingSlot, setEditingSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const batches = selectedCohort ? mockBatches[selectedCohort.id] || [] : [];

  const handleCohortChange = useCallback((cohort) => {
    setSelectedCohort(cohort);
    setSelectedBatch(null);
    setTimetable(generateEmptyTimetable());
  }, []);

  const handleBatchChange = useCallback((batch) => {
    setSelectedBatch(batch);
    setLoading(true);
    setTimeout(() => {
      const sampleTimetable = generateEmptyTimetable();
      sampleTimetable.Monday['9:00 - 10:00'] = { subject: 'Mathematics', teacher: 'Dr. Sarah Johnson', platform: 'Zoom' };
      sampleTimetable.Wednesday['11:00 - 12:00'] = { subject: 'Physics', teacher: 'Prof. Michael Chen', platform: 'Google Meet' };
      sampleTimetable.Friday['2:00 - 3:00'] = { subject: 'Computer Science', teacher: 'Mr. James Anderson', platform: 'Microsoft Teams' };
      setTimetable(sampleTimetable);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCellClick = useCallback((day, timeSlot, currentData) => {
    setEditingSlot({ day, timeSlot, data: currentData });
    setIsModalOpen(true);
  }, []);

  const handleSaveSlot = useCallback((newData) => {
    if (!editingSlot) return;
    setTimetable(prev => ({
      ...prev,
      [editingSlot.day]: {
        ...prev[editingSlot.day],
        [editingSlot.timeSlot]: newData
      }
    }));
    
    console.log('Saving timetable data:', {
      batchId: selectedBatch?.id,
      day: editingSlot.day,
      timeSlot: editingSlot.timeSlot,
      data: newData
    });
  }, [editingSlot, selectedBatch]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSlot(null);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainContent}>
        <div className={styles.headerCard}>
          <h1 className={styles.mainTitle}>Timetable Management System</h1>
          <p className={styles.subtitle}>Manage schedules for different cohorts and batches</p>
        </div>

        <CohortSelector
          cohorts={mockCohorts}
          selectedCohort={selectedCohort}
          onCohortChange={handleCohortChange}
        />

        <BatchSelector
          batches={batches}
          selectedBatch={selectedBatch}
          onBatchChange={handleBatchChange}
        />

        {loading && (
          <div className={styles.card}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading timetable data...</p>
          </div>
        )}

        {selectedBatch && !loading && (
            <>
                <TimetableGrid
                    timetable={timetable}
                    onCellClick={handleCellClick}
                    isBatchSelected={!!selectedBatch}
                />
                <DownloadButtons 
                    timetable={timetable}
                    batchName={selectedBatch.name}
                />
            </>
        )}

        {!selectedBatch && !loading && (
            <TimetableGrid
                timetable={timetable}
                onCellClick={handleCellClick}
                isBatchSelected={!!selectedBatch}
            />
        )}

        <EditTimetableModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          timeSlotData={editingSlot?.data}
          onSave={handleSaveSlot}
          day={editingSlot?.day}
          timeSlot={editingSlot?.timeSlot}
        />
      </div>
    </div>
  );
};

export default TimetableDashboard;
