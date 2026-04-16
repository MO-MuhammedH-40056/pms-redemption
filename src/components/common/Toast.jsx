import React from 'react';
import useWorkflowStore from '../../store/workflowStore';

export default function Toast() {
  const toasts = useWorkflowStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-icon">{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
