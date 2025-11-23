// client/src/pages/coordinator/DateInput.js
import React from "react";
import { Calendar } from "lucide-react";

/**
 * DateInput
 * Small date input used in filter card. Tailwind classes preserved.
 */
export default function DateInput({ name, label, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
        <Calendar className="w-3 h-3 mr-1 text-gray-500" /> {label}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:border-emerald-500 focus:ring-emerald-500 transition duration-150"
      />
    </div>
  );
}
