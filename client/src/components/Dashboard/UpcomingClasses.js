// // import React from 'react';
// // import { Clock, MapPin } from 'lucide-react';

// // export default function Upcomingstyles() {
// //   const styles = [
// //     { subject: 'Mathematics', time: '09:00 AM', room: 'Room 101', batch: 'Batch A' },
// //     { subject: 'Physics', time: '11:00 AM', room: 'Room 102', batch: 'Batch B' },
// //     { subject: 'Chemistry', time: '02:00 PM', room: 'Room 103', batch: 'Batch A' },
// //     { subject: 'Biology', time: '04:00 PM', room: 'Room 104', batch: 'Batch C' },
// //   ];

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
// //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's styles</h3>
// //       <div className="space-y-4">
// //         {styles.map((class_, index) => (
// //           <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //             <div>
// //               <p className="font-medium text-gray-900">{class_.subject}</p>
// //               <p className="text-sm text-gray-600">{class_.batch}</p>
// //             </div>
// //             <div className="text-right">
// //               <div className="flex items-center text-sm text-gray-600 mb-1">
// //                 <Clock className="h-4 w-4 mr-1" />
// //                 {class_.time}
// //               </div>
// //               <div className="flex items-center text-sm text-gray-600">
// //                 <MapPin className="h-4 w-4 mr-1" />
// //                 {class_.room}
// //               </div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }




// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import { Clock, MapPin, ExternalLink } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";

// export default function UpcomingClasses() {
//   const { user } = useAuth();
//   const token = user?.token;

//   const [batches, setBatches] = useState([]);
//   const [timetable, setTimetable] = useState([]);

//   const API = process.env.REACT_APP_BACKEND_API_URL;

//   const axiosConfig = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   /* ============================================================
//      FETCH BATCHES (ONLY coordinator's assigned batches)
//   ============================================================ */
//   useEffect(() => {
//     if (!token) return;

//     axios
//       .get(`${API}/api/coordinator/batches`, axiosConfig())
//       .then(({ data }) => {
//         console.log("Fetched Batches:", data);
//         setBatches(data || []);
//       })
//       .catch((err) => console.error("Failed to fetch batches:", err));
//   }, [token]);

//   /* ============================================================
//      FETCH TIMETABLE FOR EACH BATCH
//   ============================================================ */
//   useEffect(() => {
//     if (!token || batches.length === 0) return;

//     async function loadTimetables() {
//       const all = [];

//       for (const b of batches) {
//         try {
//           const res = await axios.get(`${API}/api/coordinator/timetable`, {
//             ...axiosConfig(),
//             params: { batchId: b.batch_id },
//           });

//           console.log(`Timetable for batch ${b.batch_id}:`, res.data);

//           const items = res.data.map((slot) => ({
//             ...slot,
//             batch_name: b.batch_name,
//           }));

//           all.push(...items);
//         } catch (err) {
//           console.error(`Failed timetable for batch ${b.batch_id}`, err);
//         }
//       }

//       setTimetable(all);
//     }

//     loadTimetables();
//   }, [token, batches]);

//   /* ============================================================
//      GET TODAY'S WEEKDAY (SAFE / STABLE)
//   ============================================================ */
//   const weekday = [
//     "SUNDAY",
//     "MONDAY",
//     "TUESDAY",
//     "WEDNESDAY",
//     "THURSDAY",
//     "FRIDAY",
//     "SATURDAY",
//   ][new Date().getDay()];

//   /* ============================================================
//      FILTER TODAY'S CLASSES
//   ============================================================ */
//   const todaysClasses = useMemo(() => {
//     const filtered = timetable.filter(
//       (t) => (t.day_of_week || "").toUpperCase() === weekday
//     );

//     // Sort by start_time ascending
//     return filtered.sort((a, b) =>
//       a.start_time.localeCompare(b.start_time)
//     );
//   }, [timetable, weekday]);

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">
//         Today's Classes
//       </h3>

//       {todaysClasses.length === 0 ? (
//         <p className="text-sm text-gray-500">No classes today.</p>
//       ) : (
//         <div className="space-y-4">
//           {todaysClasses.map((class_, index) => (
//             <div
//               key={index}
//               className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//             >
//               <div>
//                 <p className="font-medium text-gray-900">
//                   {class_.subject_name}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {class_.batch_name}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {class_.teacher_name}
//                 </p>
//               </div>

//               <div className="text-right">
//                 <div className="flex items-center text-sm text-gray-600 mb-1">
//                   <Clock className="h-4 w-4 mr-1" />
//                   {class_.start_time.slice(0, 5)} - {class_.end_time.slice(0, 5)}
//                 </div>

//                 <div className="flex items-center text-sm text-gray-600 mb-1">
//                   <MapPin className="h-4 w-4 mr-1" />
//                   {class_.classroom_name}
//                 </div>

//                 {class_.class_link && (
//                   <a
//                     href={class_.class_link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-600 text-xs flex items-center justify-end gap-1 hover:underline"
//                   >
//                     Join Class <ExternalLink size={12} />
//                   </a>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Clock, MapPin, ExternalLink, Info } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * UpcomingClasses.jsx
 * - Fetches all batches for coordinator
 * - Fetches timetable for each batch
 * - Shows:
 *    - Today's classes (sorted)
 *    - Next class with live countdown
 *    - Weekly overview (counts + simple heatmap bars)
 *    - Modal details for each class
 * - Subject color coding and improved UI wrapping
 */

export default function UpcomingClasses() {
  const { user } = useAuth();
  const token = user?.token;
  const API = process.env.REACT_APP_BACKEND_API_URL;

  const [batches, setBatches] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState(null); // for modal

  const axiosConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // Subject -> color mapping (extend as needed)
  const subjectColors = {
    MATHEMATICS: "#60A5FA",
    "APPLIED MATHEMATICS-09": "#60A5FA",
    PHYSICS: "#A78BFA",
    "APPLIED PHYSICS-09": "#A78BFA",
    CHEMISTRY: "#FB923C",
    "CHEMISTRY-09": "#FB923C",
    ENGLISH: "#34D399",
    "ENGLISH AND COMMUNICATION SKILLS-09": "#34D399",
    DEFAULT: "#94A3B8",
  };

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/coordinator/batches`, axiosConfig())
      .then(({ data }) => setBatches(data || []))
      .catch((err) => {
        console.error("Failed to fetch batches:", err);
        setBatches([]);
      });
  }, [token]);

  // fetch timetable for each batch
  useEffect(() => {
    if (!token || batches.length === 0) return;

    let cancelled = false;
    async function loadAll() {
      const all = [];
      for (const b of batches) {
        try {
          const res = await axios.get(`${API}/api/coordinator/timetable`, {
            ...axiosConfig(),
            params: { batchId: b.batch_id },
          });
          const items = (res.data || []).map((slot) => ({
            ...slot,
            batch_name: b.batch_name,
            cohort_number: b.cohort_number,
            cohort_name: b.cohort_name,
          }));
          all.push(...items);
        } catch (err) {
          console.error(`Timetable fetch failed for batch ${b.batch_id}`, err);
        }
      }
      if (!cancelled) setTimetable(all);
    }
    loadAll();
    return () => (cancelled = true);
  }, [token, batches]);

  // stable weekday string matching DB (SUNDAY .. SATURDAY)
  const weekday = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][new Date().getDay()];

  // update "now" every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // normalize time helpers
  const parseTimeToDate = (timeStr, referenceDate = new Date()) => {
    // timeStr expected 'HH:MM:SS' or 'HH:MM'
    const [h, m] = timeStr.split(":").map((s) => parseInt(s, 10));
    const d = new Date(referenceDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  // Today's classes (filtered & sorted)
  const todaysClasses = useMemo(() => {
    const filtered = timetable.filter(
      (t) => (t.day_of_week || "").toUpperCase() === weekday
    );
    // sort by start_time
    return filtered.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetable, weekday]);

  // Next upcoming class (today) - find class with start_time >= now
  const nextClass = useMemo(() => {
    if (!todaysClasses.length) return null;
    const nowTime = now;
    // consider today's date for each start_time
    const upcoming = todaysClasses
      .map((c) => ({ ...c, startAt: parseTimeToDate(c.start_time, nowTime) }))
      .filter((c) => c.startAt.getTime() >= nowTime.getTime() - 1000 * 60) // include tiny past margin
      .sort((a, b) => a.startAt - b.startAt);
    return upcoming[0] || null;
  }, [todaysClasses, now]);

  // weekly overview: counts per weekday
  const weeklyOverview = useMemo(() => {
    const days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const counts = days.map((d) => ({
      day: d,
      count: timetable.filter((t) => (t.day_of_week || "").toUpperCase() === d).length,
      items: timetable.filter((t) => (t.day_of_week || "").toUpperCase() === d),
    }));
    const max = Math.max(...counts.map((c) => c.count), 1);
    return { counts, max };
  }, [timetable]);

  // format countdown
  const formatCountdown = (targetDate) => {
    if (!targetDate) return "";
    const diff = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
    const hh = Math.floor(diff / 3600);
    const mm = Math.floor((diff % 3600) / 60);
    const ss = diff % 60;
    if (diff <= 0) return "Starting now";
    if (hh > 0) return `${hh}h ${mm}m`;
    if (mm > 0) return `${mm}m ${ss}s`;
    return `${ss}s`;
  };

  // subject color
  const getSubjectColor = (subjectName) => {
    if (!subjectName) return subjectColors.DEFAULT;
    const key = Object.keys(subjectColors).find((k) =>
      subjectName.toUpperCase().includes(k.toUpperCase())
    );
    return subjectColors[key] || subjectColors.DEFAULT;
  };

  return (
    <div className="upcoming-classes-root">
      <div className="top-row">
        <div className="next-class-card">
          <h4 className="small-title">Next Class</h4>
          {nextClass ? (
            <div className="next-card-content">
              <div className="subject" style={{ color: getSubjectColor(nextClass.subject_name) }}>
                {nextClass.subject_name}
              </div>
              <div className="meta">
                <span className="teacher">{nextClass.teacher_name}</span>
                <span className="batch">{nextClass.batch_name}</span>
              </div>
              <div className="time-row">
                <Clock className="icon" />
                <strong>
                  {nextClass.start_time.slice(0,5)} - {nextClass.end_time.slice(0,5)}
                </strong>
                <small className="countdown">{formatCountdown(parseTimeToDate(nextClass.start_time))}</small>
              </div>

              <div className="actions">
                {nextClass.class_link && (
                  <a className="join-btn" href={nextClass.class_link} target="_blank" rel="noreferrer">
                    Join <ExternalLink size={14} />
                  </a>
                )}
                <button className="info-btn" onClick={() => setSelected(nextClass)}>
                  Details <Info size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="no-next">No upcoming classes today.</div>
          )}
        </div>

        <div className="weekly-overview-card">
          <h4 className="small-title">Weekly Overview</h4>
          <div className="week-grid">
            {weeklyOverview.counts.map((d) => (
              <div key={d.day} className={`week-day ${d.day === weekday ? "today" : ""}`}>
                <div className="day-label">{d.day.slice(0,3)}</div>
                <div className="heat-bar" title={`${d.count} classes`}>
                  <div
                    className="heat-fill"
                    style={{ width: `${(d.count / Math.max(1, weeklyOverview.max)) * 100}%` }}
                  />
                </div>
                <div className="day-count">{d.count}</div>
              </div>
            ))}
          </div>
          <div className="small-note">Counts show scheduled classes across your batches.</div>
        </div>
      </div>

      {/* Today's classes list */}
      <div className="today-list-card">
        <h4 className="small-title">Today's Classes</h4>

        {todaysClasses.length === 0 ? (
          <p className="muted">No classes today.</p>
        ) : (
          <div className="list">
            {todaysClasses.map((c, idx) => (
              <div key={`${c.timetable_id}-${idx}`} className="class-row">
                <div className="left">
                  <div className="subj" style={{ borderLeft: `4px solid ${getSubjectColor(c.subject_name)}` }}>
                    <div className="subject-name">{c.subject_name}</div>
                    <div className="batch-name">{c.batch_name} • {c.classroom_name}</div>
                    <div className="teacher-name">{c.teacher_name}</div>
                  </div>
                </div>

                <div className="right">
                  <div className="time">
                    <Clock className="icon" />
                    <span>{c.start_time.slice(0,5)} - {c.end_time.slice(0,5)}</span>
                  </div>

                  <div className="row-actions">
                    {c.class_link && (
                      <a className="link" href={c.class_link} target="_blank" rel="noreferrer">
                        Join <ExternalLink size={12} />
                      </a>
                    )}
                    <button className="info" onClick={() => setSelected(c)}>Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="uc-modal" role="dialog" aria-modal="true">
          <div className="uc-modal-backdrop" onClick={() => setSelected(null)} />
          <div className="uc-modal-panel">
            <button className="uc-modal-close" onClick={() => setSelected(null)}>✕</button>
            <h3 className="modal-title">{selected.subject_name}</h3>

            <div className="modal-grid">
              <div><strong>Batch</strong><div>{selected.batch_name}</div></div>
              <div><strong>Classroom</strong><div>{selected.classroom_name}</div></div>
              <div><strong>Teacher</strong><div>{selected.teacher_name}</div></div>
              <div><strong>Day</strong><div>{selected.day_of_week}</div></div>
              <div><strong>Time</strong><div>{selected.start_time.slice(0,5)} - {selected.end_time.slice(0,5)}</div></div>
              <div><strong>Meeting Link</strong>
                <div>
                  {selected.class_link ? (
                    <a href={selected.class_link} target="_blank" rel="noreferrer">{selected.class_link}</a>
                  ) : <span>—</span>}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setSelected(null)}>Close</button>
              {selected.class_link && (
                <a className="btn primary" href={selected.class_link} target="_blank" rel="noreferrer">
                  Join Class
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
