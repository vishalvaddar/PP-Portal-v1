// import React, { useState } from 'react';
// import { Clock, User, MapPin } from 'lucide-react';

// export default function TimetableView() {
//   const [selectedBatch, setSelectedBatch] = useState('Batch A');
//   const [selectedWeek, setSelectedWeek] = useState('2024-W03');

//   const timeSlots = [
//     '09:00 - 10:00',
//     '10:00 - 11:00',
//     '11:00 - 12:00',
//     '12:00 - 13:00',
//     '14:00 - 15:00',
//     '15:00 - 16:00',
//     '16:00 - 17:00'
//   ];

//   const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

//   const timetableData = {
//     'Monday': {
//       '09:00 - 10:00': { subject: 'Mathematics', teacher: 'Dr. Amit Singh', room: 'Room 101' },
//       '10:00 - 11:00': { subject: 'Physics', teacher: 'Prof. Priya Sharma', room: 'Room 102' },
//       '11:00 - 12:00': { subject: 'Chemistry', teacher: 'Dr. Rajesh Kumar', room: 'Room 103' },
//       '12:00 - 13:00': { subject: 'Break', teacher: '', room: '' },
//       '14:00 - 15:00': { subject: 'Biology', teacher: 'Dr. Meera Patel', room: 'Room 104' },
//       '15:00 - 16:00': { subject: 'English', teacher: 'Ms. Sarah Johnson', room: 'Room 105' },
//       '16:00 - 17:00': { subject: 'Computer Science', teacher: 'Mr. Tech Expert', room: 'Lab 1' }
//     },
//     'Tuesday': {
//       '09:00 - 10:00': { subject: 'Physics', teacher: 'Prof. Priya Sharma', room: 'Room 102' },
//       '10:00 - 11:00': { subject: 'Mathematics', teacher: 'Dr. Amit Singh', room: 'Room 101' },
//       '11:00 - 12:00': { subject: 'Biology', teacher: 'Dr. Meera Patel', room: 'Room 104' },
//       '12:00 - 13:00': { subject: 'Break', teacher: '', room: '' },
//       '14:00 - 15:00': { subject: 'Chemistry', teacher: 'Dr. Rajesh Kumar', room: 'Room 103' },
//       '15:00 - 16:00': { subject: 'English', teacher: 'Ms. Sarah Johnson', room: 'Room 105' },
//       '16:00 - 17:00': { subject: 'Study Period', teacher: '', room: 'Library' }
//     },
//     'Wednesday': {
//       '09:00 - 10:00': { subject: 'Chemistry', teacher: 'Dr. Rajesh Kumar', room: 'Room 103' },
//       '10:00 - 11:00': { subject: 'Biology', teacher: 'Dr. Meera Patel', room: 'Room 104' },
//       '11:00 - 12:00': { subject: 'Mathematics', teacher: 'Dr. Amit Singh', room: 'Room 101' },
//       '12:00 - 13:00': { subject: 'Break', teacher: '', room: '' },
//       '14:00 - 15:00': { subject: 'Physics', teacher: 'Prof. Priya Sharma', room: 'Room 102' },
//       '15:00 - 16:00': { subject: 'Computer Science', teacher: 'Mr. Tech Expert', room: 'Lab 1' },
//       '16:00 - 17:00': { subject: 'English', teacher: 'Ms. Sarah Johnson', room: 'Room 105' }
//     },
//     'Thursday': {
//       '09:00 - 10:00': { subject: 'Biology', teacher: 'Dr. Meera Patel', room: 'Room 104' },
//       '10:00 - 11:00': { subject: 'Chemistry', teacher: 'Dr. Rajesh Kumar', room: 'Room 103' },
//       '11:00 - 12:00': { subject: 'Physics', teacher: 'Prof. Priya Sharma', room: 'Room 102' },
//       '12:00 - 13:00': { subject: 'Break', teacher: '', room: '' },
//       '14:00 - 15:00': { subject: 'Mathematics', teacher: 'Dr. Amit Singh', room: 'Room 101' },
//       '15:00 - 16:00': { subject: 'English', teacher: 'Ms. Sarah Johnson', room: 'Room 105' },
//       '16:00 - 17:00': { subject: 'Lab Session', teacher: 'Lab Assistant', room: 'Lab 2' }
//     },
//     'Friday': {
//       '09:00 - 10:00': { subject: 'English', teacher: 'Ms. Sarah Johnson', room: 'Room 105' },
//       '10:00 - 11:00': { subject: 'Mathematics', teacher: 'Dr. Amit Singh', room: 'Room 101' },
//       '11:00 - 12:00': { subject: 'Computer Science', teacher: 'Mr. Tech Expert', room: 'Lab 1' },
//       '12:00 - 13:00': { subject: 'Break', teacher: '', room: '' },
//       '14:00 - 15:00': { subject: 'Physics', teacher: 'Prof. Priya Sharma', room: 'Room 102' },
//       '15:00 - 16:00': { subject: 'Chemistry', teacher: 'Dr. Rajesh Kumar', room: 'Room 103' },
//       '16:00 - 17:00': { subject: 'Review Session', teacher: 'All Teachers', room: 'Hall A' }
//     }
//   };

//   const getSubjectColor = (subject) => {
//     const colors = {
//       'Mathematics': 'subject-mathematics',
//       'Physics': 'subject-physics',
//       'Chemistry': 'subject-chemistry',
//       'Biology': 'subject-biology',
//       'English': 'subject-english',
//       'Computer Science': 'subject-cs',
//       'Break': 'subject-break',
//       'Study Period': 'subject-study',
//       'Lab Session': 'subject-lab',
//       'Review Session': 'subject-review'
//     };
//     return colors[subject] || 'subject-default';
//   };

//   return (
//     <div className="app-container">
//       {/* The main style block for the component. All styles are now self-contained. */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

//         :root {
//           --primary-blue: #3b82f6;
//           --secondary-blue: #60a5fa;
//           --text-primary: #1f2937;
//           --text-secondary: #6b7280;
//           --bg-main: #f3f4f6;
//           --border-color: #e5e7eb;
//           --bg-card: #ffffff;
//         }

//         body {
//           font-family: 'Inter', sans-serif;
//           background-color: var(--bg-main);
//           margin: 0;
//           color: var(--text-primary);
//         }
//         .app-container {
//           display: flex;
//           flex-direction: column;
//           min-height: 100vh;
//           overflow-x: hidden;
//         }
//         
//         /* This container holds the content that should stay at the top */
//         .sticky-top-content {
//           position: sticky;
//           top: 0;
//           z-index: 20;
//           background-color: var(--bg-main);
//           padding: 1.5rem;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//           max-width: 1200px;
//           margin: 0 auto;
//         }

//         .main-content-scroll {
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 0 1.5rem 2rem;
//           display: flex;
//           flex-direction: column;
//           gap: 2rem;
//           flex-grow: 1;
//         }
//         
//         .timetable-header h1 {
//           font-size: 2rem;
//           font-weight: 700;
//           margin: 0;
//         }

//         .timetable-header p {
//           font-size: 1rem;
//           color: var(--text-secondary);
//           margin: 0;
//         }

//         .timetable-filters {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 1rem;
//           background-color: var(--bg-card);
//           padding: 1rem;
//           border-radius: 0.5rem;
//           border: 1px solid var(--border-color);
//           box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//         }

//         .timetable-filters div {
//           display: flex;
//           flex-direction: column;
//           flex: 1;
//           min-width: 150px;
//         }

//         .timetable-filters label {
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: var(--text-primary);
//           margin-bottom: 0.25rem;
//         }

//         .timetable-filters select,
//         .timetable-filters input {
//           padding: 0.5rem;
//           border: 1px solid var(--border-color);
//           border-radius: 0.375rem;
//           background-color: white;
//           font-size: 0.875rem;
//         }

//         .class-count {
//           align-items: flex-start;
//         }

//         .class-count .count-value {
//           font-weight: 700;
//           font-size: 1.25rem;
//           color: var(--primary-blue);
//         }

//         .class-count .count-note {
//           font-size: 0.75rem;
//           color: var(--text-secondary);
//         }

//         .teacher-summary {
//           background-color: var(--bg-card);
//           padding: 1.5rem;
//           border-radius: 0.5rem;
//           border: 1px solid var(--border-color);
//           box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//         }

//         .teacher-summary h3 {
//           font-size: 1.25rem;
//           margin: 0 0 1rem;
//           font-weight: 600;
//         }

//         .teacher-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 1rem;
//         }

//         .teacher-card {
//           background-color: #f9fafb;
//           padding: 1rem;
//           border-radius: 0.375rem;
//           border: 1px solid var(--border-color);
//           flex: 1;
//           min-width: 180px;
//         }

//         .teacher-header {
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           margin-bottom: 0.5rem;
//           font-weight: 600;
//         }

//         .teacher-card p {
//           margin: 0;
//           font-size: 0.875rem;
//         }

//         .teacher-card .classes-note {
//           color: var(--text-secondary);
//           font-size: 0.75rem;
//           margin-top: 0.25rem;
//         }

//         .timetable-grid {
//           overflow-x: auto;
//           background-color: var(--bg-card);
//           border-radius: 0.5rem;
//           border: 1px solid var(--border-color);
//           box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//           padding: 1.5rem;
//         }

//         .timetable-grid h3 {
//           font-size: 1.25rem;
//           margin: 0 0 1.5rem;
//           font-weight: 600;
//         }

//         .timetable-grid table {
//           width: 100%;
//           border-collapse: separate;
//           border-spacing: 0;
//         }

//         .timetable-grid thead th {
//           /* This keeps the table header sticky while scrolling through the timetable */
//           position: sticky;
//           top: 0; /* Changed to 0 so it sticks to the top of its parent container */
//           background-color: var(--bg-card);
//           z-index: 10;
//           text-align: left;
//           padding: 0.75rem 1rem;
//           font-size: 0.875rem;
//           font-weight: 600;
//           color: var(--text-secondary);
//           text-transform: uppercase;
//           border-bottom: 2px solid var(--border-color);
//         }
        
//         .timetable-grid thead th:first-child {
//           width: 150px; /* Fixed width for the time column */
//         }
//         
//         .timetable-grid tbody td {
//           padding: 1rem;
//           border-bottom: 1px solid var(--border-color);
//           vertical-align: top;
//           height: 120px;
//         }

//         .timetable-grid tbody tr:last-child td {
//           border-bottom: none;
//         }

//         .time-slot {
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           font-weight: 600;
//           font-size: 0.875rem;
//           color: var(--text-secondary);
//           padding: 0;
//           position: sticky; /* Keeps the time column visible when scrolling horizontally */
//           left: 0;
//           background-color: var(--bg-card);
//           z-index: 10;
//         }
//         
//         .class-cell {
//           display: flex;
//           flex-direction: column;
//           padding: 0.75rem;
//           border-radius: 0.375rem;
//           font-size: 0.875rem;
//           color: var(--text-primary);
//           font-weight: 500;
//           box-shadow: 0 1px 2px rgba(0,0,0,0.1);
//         }

//         .class-cell .subject-name {
//           font-weight: 600;
//           margin-bottom: 0.5rem;
//         }

//         .class-cell .teacher-name,
//         .class-cell .room-name {
//           display: flex;
//           align-items: center;
//           gap: 0.25rem;
//           font-size: 0.75rem;
//           color: var(--text-secondary);
//           margin-top: 0.25rem;
//         }

//         .icon-sm {
//           width: 16px;
//           height: 16px;
//         }

//         .icon-xs {
//           width: 12px;
//           height: 12px;
//         }

//         .free-cell {
//           text-align: center;
//           color: var(--text-secondary);
//           font-style: italic;
//           padding: 0.75rem;
//         }

//         /* Subject-specific colors */
//         .subject-mathematics { background-color: #e0f2fe; border-left: 4px solid #3b82f6; }
//         .subject-physics { background-color: #dbeafe; border-left: 4px solid #6366f1; }
//         .subject-chemistry { background-color: #f0fdf4; border-left: 4px solid #22c55e; }
//         .subject-biology { background-color: #fef2f2; border-left: 4px solid #ef4444; }
//         .subject-english { background-color: #fefce8; border-left: 4px solid #f59e0b; }
//         .subject-cs { background-color: #f3e8ff; border-left: 4px solid #a855f7; }
//         .subject-break { background-color: #e5e7eb; border-left: 4px solid #9ca3af; }
//         .subject-study { background-color: #e0e7ff; border-left: 4px solid #6366f1; }
//         .subject-lab { background-color: #d1fae5; border-left: 4px solid #059669; }
//         .subject-review { background-color: #d1e5ff; border-left: 4px solid #3b82f6; }
//         .subject-default { background-color: #e5e7eb; border-left: 4px solid #9ca3af; }
//       `}</style>

//       {/* This container will stay fixed at the top */}
//       <div className="sticky-top-content">
//         <div className="timetable-header">
//           <h1>Timetable View</h1>
//           <p>View class schedules and teacher assignments</p>
//         </div>
//         <div className="timetable-filters">
//           <div>
//             <label>Select Batch</label>
//             <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
//               <option value="Batch A">Batch A</option>
//               <option value="Batch B">Batch B</option>
//               <option value="Batch C">Batch C</option>
//             </select>
//           </div>
//           <div>
//             <label>Select Week</label>
//             <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} />
//           </div>
//           <div className="class-count">
//             <label>Class Count</label>
//             <div className="count-value">35 classes</div>
//             <div className="count-note">This week</div>
//           </div>
//         </div>
//       </div>

//       {/* This container will hold the scrollable content */}
//       <div className="main-content-scroll">
//         <div className="teacher-summary">
//           <h3>Assigned Teachers</h3>
//           <div className="teacher-list">
//             {[
//               { name: 'Dr. Amit Singh', subject: 'Mathematics', classes: 8 },
//               { name: 'Prof. Priya Sharma', subject: 'Physics', classes: 7 },
//               { name: 'Dr. Rajesh Kumar', subject: 'Chemistry', classes: 6 },
//               { name: 'Dr. Meera Patel', subject: 'Biology', classes: 5 },
//               { name: 'Ms. Sarah Johnson', subject: 'English', classes: 6 },
//             ].map((teacher, index) => (
//               <div key={index} className="teacher-card">
//                 <div className="teacher-header">
//                   <User className="icon-sm" />
//                   <p>{teacher.name}</p>
//                 </div>
//                 <p>{teacher.subject}</p>
//                 <p className="classes-note">{teacher.classes} classes/week</p>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="timetable-grid">
//           <h3>Weekly Timetable - {selectedBatch}</h3>
//           <table>
//             <thead>
//               <tr>
//                 {/* This header cell also needs to be sticky when scrolling horizontally */}
//                 <th style={{ zIndex: 11 }}>Time</th>
//                 {days.map((day) => (
//                   <th key={day}>{day}</th>
//                 ))}
//               </tr>
//           </thead>
//           <tbody>
//             {timeSlots.map((timeSlot) => (
//               <tr key={timeSlot}>
//                 <td>
//                   <div className="time-slot">
//                     <Clock className="icon-sm" />
//                     {timeSlot}
//                   </div>
//                 </td>
//                 {days.map((day) => {
//                   const classInfo = timetableData[day]?.[timeSlot];
//                   return (
//                     <td key={`${day}-${timeSlot}`}>
//                       {classInfo ? (
//                         <div className={`class-cell ${getSubjectColor(classInfo.subject)}`}>
//                           <div className="subject-name">{classInfo.subject}</div>
//                           {classInfo.teacher && (
//                             <div className="teacher-name">
//                               <User className="icon-xs" />
//                               {classInfo.teacher}
//                             </div>
//                           )}
//                           {classInfo.room && (
//                             <div className="room-name">
//                               <MapPin className="icon-xs" />
//                               {classInfo.room}
//                             </div>
//                           )}
//                         </div>
//                       ) : (
//                         <div className="free-cell">Free</div>
//                       )}
//                   </td>
//                  );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         </div>
//       </div>
//     </div>
//   );
// }
