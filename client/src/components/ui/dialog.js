// components/ui/dialog.jsx
import React from 'react';

export function Dialog({ children }) {
  return <div className="dialog">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="dialog-header">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2>{children}</h2>;
}

export function DialogDescription({ children }) {
  return <p>{children}</p>;
}

export function DialogContent({ children }) {
  return <div className="dialog-content">{children}</div>;
}

export function DialogFooter({ children }) {
  return <div className="dialog-footer">{children}</div>;
}
