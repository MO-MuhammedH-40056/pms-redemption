import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function FormSection({
  title,
  sectionNumber,
  status = 'pending',
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="form-section">
      <div
        className="form-section-header"
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <div className="form-section-header-left">
          <div className="form-section-number">{sectionNumber}</div>
          <span className="form-section-title">{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={status} />
          <ChevronRight
            size={15}
            style={{
              color: 'var(--gray-400)',
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {open && (
        <div className="form-section-body">
          {children}
        </div>
      )}
    </div>
  );
}
