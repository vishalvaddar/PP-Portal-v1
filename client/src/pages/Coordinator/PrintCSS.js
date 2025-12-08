// client/src/pages/coordinator/PrintCSS.js
import React from "react";

/**
 * PrintCSS
 * Small component that injects print-only CSS used by BatchReports
 */
export default function PrintCSS() {
  return (
    <style>
      {`
      @media print {
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-page { box-sizing: border-box; width: auto; padding: 18mm; margin: 6mm; border: 2px solid #0f766e; border-radius: 6px; }
        .print-header { display:block; position:fixed; top:6mm; left:18mm; right:18mm; height:26mm; text-align:center; font-weight:700; font-size:16px; color:#0f766e; }
        .print-header .logo { position:absolute; right:18mm; top:2mm; width:60px; height:auto; }
        .print-body { margin-top:36mm; margin-bottom:20mm; }
        .print-footer { display:block; position:fixed; bottom:6mm; left:18mm; right:18mm; height:12mm; text-align:center; font-size:12px; color:#374151; }
        @page { margin: 0; }
        .print-footer:after { content: "Page " counter(page); }
        table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #444; padding: 6px; font-size: 12px; }
        th { background: #e6fffa; }
      }
      .screen-header { display:flex; align-items:center; gap:12px; }
      `}
    </style>
  );
}
