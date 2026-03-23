import { useState } from "react";
import classes from "./TimeTableView.module.css";

function TimeTableView({ timeTableData, setTimeTableData }) {
  const [openBatch, setOpenBatch] = useState(null);
  const [activeTab, setActiveTab] = useState("batch");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = ["Slot-1", "Slot-2", "Slot-3"];

  const toggleBatch = (batch) => {
    setOpenBatch(openBatch === batch ? null : batch);
  };

  return (
    <div className={classes.mainBox}>
      <h2 className={classes.title}>Generated Timetable </h2>

      {/* ---------- TAB ROW ---------- */}

      <div className={classes.tabRow}>
        <div className={classes.tabs}>
          <button className={`${classes.tab} ${activeTab === "batch" ? classes.active : ""}`} onClick={() => setActiveTab("batch")}>
            Batchwise Timetable
          </button>
          <button className={`${classes.tab} ${activeTab === "teacher" ? classes.active : ""}`} onClick={() => setActiveTab("teacher")}>
            Teacherwise Timetable
          </button>
        </div>
        <button className={classes.backButton} onClick={() => setTimeTableData(null)}>Back</button>
      </div>


      {/* ---------- BATCHWISE TIMETABLE ---------- */}
      {activeTab === "batch" && (
        <div className={classes.batchContainer}>
          {Object.keys(timeTableData).map((batch) => {
            const batchData = timeTableData[batch];
            const isOpen = openBatch === batch;
            return (
              <div key={batch} className={classes.batchCard}>
                {/* Batch Header */}
                <div className={classes.batchHeader} onClick={() => toggleBatch(batch)}>
                  <span>{batch}</span>
                  <span className={classes.arrow}>{isOpen ? "▲" : "▼"}</span>
                </div>


                {/* Table */}
                {isOpen && (
                  <table className={classes.table}>
                    <thead>
                      <tr>
                        <th>Slot</th>
                        {days.map((d) => (<th key={d}>{d}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => (
                        <tr key={slot}>
                          <td className={classes.tableCell}>{slot}</td>
                          {days.map((day) => {const slotData = batchData[day]?.[slot];
                            return (
                              <td key={day + slot} className={classes.tableCell}>
                                {slotData && slotData.subject && slotData.subject !== "Free" ? (
                                    <>
                                      <div>{slotData.subject}</div>
                                      <div>{slotData.name}</div>
                                    </>
                                  )
                                  : "-"
                                }

                              </td>
                            );

                          })}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                )}

              </div>

            );

          })}

        </div>

      )}


      {/* ---------- TEACHERWISE TAB (placeholder) ---------- */}

      {activeTab === "teacher" && (

        <div className={classes.placeholder}>
          Teacherwise timetable will be displayed here.
        </div>

      )}

    </div>
  );
}

export default TimeTableView;