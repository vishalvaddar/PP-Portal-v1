// client/src/pages/coordinator/CloseTicketModal.js
import React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * CloseTicketModal
 * Props:
 * - isOpen (bool)
 * - student (object)
 * - reason (string)
 * - setReason (fn)
 * - onClose (fn)
 * - onConfirm (fn)
 */
export default function CloseTicketModal({ isOpen, student, reason, setReason, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Close Ticket
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Closing ticket for <strong>{student?.student_name || student?.name || "-"}</strong>
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter closing reason..."
          className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); }}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
