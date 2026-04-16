import React from 'react';
import { Send, Loader2, CheckCircle, FileCheck } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import UploadZone from './UploadZone';
import FileCard from './FileCard';
import ProgressBar from '../common/ProgressBar';
import SignaturePanel from './SignaturePanel';

const SHOW_SIG_STATES = ['verifying', 'reviewing', 'submitting', 'success', 'failed'];

export default function LeftPanel({ orchestrator }) {
  const {
    uploadedFile,
    workflowState,
    isProcessing,
    progress,
  } = useWorkflowStore((s) => ({
    uploadedFile: s.uploadedFile,
    workflowState: s.workflowState,
    isProcessing: s.isProcessing,
    progress: s.progress,
  }));

  const showRunButton =
    !!uploadedFile && !isProcessing && workflowState === 'idle';

  const showProgress = isProcessing;
  const showSig = SHOW_SIG_STATES.includes(workflowState);

  const handleRunAgent = () => {
    if (orchestrator) {
      orchestrator.processDocument();
    }
  };

  return (
    <aside className="left-panel">
      <div className="panel-section-title">Document Upload</div>

      {!uploadedFile ? (
        <UploadZone />
      ) : (
        <FileCard />
      )}

      {showProgress && (
        <ProgressBar percent={progress.percent} step={progress.step} />
      )}

      {showRunButton && (
        <button className="run-ai-btn" onClick={handleRunAgent}>
          <Send size={16} />
          Run AI Agent
        </button>
      )}

      {isProcessing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'var(--blue-pale)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--blue-border)',
            fontSize: 13,
            color: 'var(--blue)',
            fontWeight: 500,
          }}
        >
          <Loader2 size={15} className="spin" />
          {workflowState === 'extracting' && 'Extracting document data...'}
          {workflowState === 'verifying' && 'Verifying signature...'}
          {workflowState === 'submitting' && 'Submitting request...'}
          {!['extracting','verifying','submitting'].includes(workflowState) && 'Processing...'}
        </div>
      )}

      {workflowState === 'success' && (
        <div className="success-banner" style={{ padding: '12px 14px' }}>
          <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <h3>Submitted!</h3>
            <p>Redemption request processed</p>
          </div>
        </div>
      )}

      {showSig && (
        <>
          <div className="panel-section-title" style={{ marginTop: 4 }}>
            Signature Verification
          </div>
          <SignaturePanel orchestrator={orchestrator} />
        </>
      )}

      {workflowState === 'reviewing' && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--blue-pale)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--blue-border)',
            fontSize: 12,
            color: 'var(--blue)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileCheck size={14} />
          Review the form and submit when ready.
        </div>
      )}
    </aside>
  );
}
