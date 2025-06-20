// components/ui/select.jsx
import React from 'react';

export function Select({ children }) {
  return <div className="select">{children}</div>;
}

export function SelectTrigger({ children }) {
  return <div className="select-trigger">{children}</div>;
}

export function SelectValue({ children }) {
  return <div className="select-value">{children}</div>;
}

export function SelectContent({ children }) {
  return <div className="select-content">{children}</div>;
}

export function SelectItem({ value, children }) {
  return <div className="select-item" data-value={value}>{children}</div>;
}
