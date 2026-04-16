import React from 'react';
import { Shield, ChevronRight, User } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const STATE_LABELS = {
  idle: 'Ready',
  extracting: 'Extracting...',
  verifying: 'Verifying...',
  reviewing: 'Review Pending',
  submitting: 'Submitting...',
  success: 'Submitted',
  failed: 'Failed',
};

export default function TopBar() {
  const workflowState = useWorkflowStore((s) => s.workflowState);
  const label = STATE_LABELS[workflowState] || 'Ready';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <Shield size={18} />
          </div>
          <span className="topbar-logo-text">PMS Redemption AI</span>
          <span className="topbar-beta">BETA</span>
        </div>

        <div className="topbar-divider" />

        <div className="topbar-breadcrumb">
          <span>Document Processing</span>
          <ChevronRight size={13} />
          <span>Redemption</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="status-pill">
          <div className="status-pill-dot" />
          <span>{label}</span>
        </div>

        <div className="topbar-user">
          <div className="topbar-user-avatar">
            <User size={13} />
          </div>
          <span>PMS Operations</span>
        </div>
      </div>
    </header>
  );
}
