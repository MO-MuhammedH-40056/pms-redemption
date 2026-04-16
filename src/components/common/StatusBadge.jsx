import React from 'react';
import { CheckCircle, AlertTriangle, Loader2, Clock, XCircle } from 'lucide-react';

const ICONS = {
  pending: <Clock size={11} />,
  filled: <CheckCircle size={11} />,
  warning: <AlertTriangle size={11} />,
  error: <XCircle size={11} />,
  processing: <Loader2 size={11} className="spin-icon" />,
};

export default function StatusBadge({ status = 'pending', label }) {
  const text = label || {
    pending: 'Pending',
    filled: 'Filled',
    warning: 'Warning',
    error: 'Error',
    processing: 'Processing',
  }[status] || status;

  return (
    <span className={`status-badge ${status}`}>
      {ICONS[status]}
      {text}
    </span>
  );
}
