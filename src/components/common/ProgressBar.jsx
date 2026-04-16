import React from 'react';

export default function ProgressBar({ percent = 0, step = '' }) {
  return (
    <div className="progress-container">
      <div className="progress-label">
        <span className="progress-step">{step}</span>
        <span className="progress-pct">{percent}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
