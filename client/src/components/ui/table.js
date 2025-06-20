// components/ui/table.jsx
import React from 'react';

export function Table({ children }) {
  return <table className="table">{children}</table>;
}

export function TableHeader({ children }) {
  return <thead>{children}</thead>;
}

export function TableRow({ children }) {
  return <tr>{children}</tr>;
}

export function TableHead({ children }) {
  return <th>{children}</th>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableCell({ children }) {
  return <td>{children}</td>;
}
