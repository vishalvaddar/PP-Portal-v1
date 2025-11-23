// client/src/pages/coordinator/TeacherClassCountsView.js
import React from "react";
import { Users } from "lucide-react";

/**
 * TeacherClassCountsView
 * Props:
 * - reportData
 * - fromDate
 * - toDate
 */
export default function TeacherClassCountsView({ reportData, fromDate, toDate }) {
  const counts = (reportData && (reportData.teacherClassCounts || reportData.assignments)) || [];

  const safeDisplay = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") {
      if (Array.isArray(val)) return val.join(", ");
      return JSON.stringify(val);
    }
    return String(val);
  };

  const yearText = fromDate
    ? new Date(fromDate).getFullYear() +
      (toDate ? " - " + new Date(toDate).getFullYear() : "")
    : "";

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <p className="text-sm text-gray-600">
          From: <span className="font-medium">{safeDisplay(fromDate)}</span>
        </p>
        <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Teacher Class Counts {yearText && `(${yearText})`}
        </h3>
        <p className="text-sm text-gray-600">
          To: <span className="font-medium">{safeDisplay(toDate)}</span>
        </p>
      </div>

      {counts.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No teacher class count data available.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Teacher Name</th>
                <th className="px-4 py-2 text-left">Cohort</th>
                <th className="px-4 py-2 text-left">Classroom</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Total Classes Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {counts.map((c, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{safeDisplay(c.teacher)}</td>
                  <td className="px-4 py-2">{safeDisplay(c.cohort)}</td>
                  <td className="px-4 py-2">{safeDisplay(c.classroom)}</td>
                  <td className="px-4 py-2">{safeDisplay(c.subject_code || c.subject || c.subject_name)}</td>
                  <td className="px-4 py-2">{safeDisplay(c.total_classes_taken)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
