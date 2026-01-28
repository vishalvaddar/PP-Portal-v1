

// client/src/pages/coordinator/StudentReportView.js
import React, { useMemo } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function StudentReportView({
  reportData,
  openCloseTicketModal,
  actionStatuses,
  setActionStatuses,
  fromDate,
  toDate,
  hideHeader // New Prop
}) {
  const students = reportData?.students || [];
  const cohortName = reportData?.cohort_name || "Cohort";
  const batchName = reportData?.batch_name || "Batch";
  const totalConductedBySubject = reportData?.totalConductedBySubject || {};

  const safeDisplayLocal = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const allSubjects = useMemo(() => {
    const subs = new Set();
    Object.keys(totalConductedBySubject || {}).forEach((s) => subs.add(s));
    if (subs.size === 0 && students.length > 0) {
      students.forEach((s) => {
        Object.keys(s.attended || {}).forEach((subj) => subs.add(subj));
      });
    }
    return Array.from(subs);
  }, [students, totalConductedBySubject]);

  const subjectTotals = useMemo(() => {
    const totals = {};
    allSubjects.forEach((subj) => {
      totals[subj] = totalConductedBySubject?.[subj] || 0;
    });
    return totals;
  }, [totalConductedBySubject, allSubjects]);

  const LOW_ATTENDANCE_THRESHOLD = 75.0;

  return (
    <div className="space-y-6">
      {/* Conditionally hide the redundant header */}
      {!hideHeader && (
        <div className="flex justify-between items-center bg-gray-50 border rounded-lg p-4 shadow-sm">
          <div className="text-gray-700 font-medium">
            From: <span className="font-semibold">{safeDisplayLocal(fromDate)}</span>
          </div>
          <div className="text-lg font-bold text-gray-900 text-center">
            {safeDisplayLocal(cohortName)} - {safeDisplayLocal(batchName)} - ATTENDANCE REPORT
          </div>
          <div className="text-gray-700 font-medium text-right">
            To: <span className="font-semibold">{safeDisplayLocal(toDate)}</span>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No student attendance data available.
        </p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Sl No</th>
                <th className="px-4 py-2 text-left">Student</th>
                {allSubjects.map((code) => (
                  <th key={code} className="px-4 py-2 text-center font-semibold text-gray-700">
                    <div className="whitespace-nowrap">{code}</div>
                    <div className="text-gray-500 text-xs font-normal mt-1">(Total: {subjectTotals[code] || 0})</div>
                  </th>
                ))}
                <th className="px-4 py-2 text-center">Attended</th>
                <th className="px-4 py-2 text-center">%</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s, idx) => {
                const attendedBySubject = s.attended || {};
                const percent = s.attendance_percent ?? 0;
                const low = percent < LOW_ATTENDANCE_THRESHOLD;
                const act = actionStatuses?.[s.id] || { status: "N/A" };

                return (
                  <tr key={s.id} className={low ? "bg-red-50" : ""}>
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{s.name || s.student_name || "-"}</td>
                    {allSubjects.map((code) => (
                      <td key={code} className="px-4 py-2 text-center">
                        {attendedBySubject?.[code] ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-center">{s.attended_classes ?? 0}</td>
                    <td className="px-4 py-2 text-center font-semibold">{s.attendance_percent ?? 0}%</td>
                    <td className="px-4 py-2 text-center">
                      {low ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-700 bg-red-100 text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-emerald-700 bg-emerald-100 text-xs font-semibold">
                          <ShieldCheck className="w-3 h-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}