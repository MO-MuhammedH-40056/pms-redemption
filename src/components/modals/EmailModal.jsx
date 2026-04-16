import React from 'react';
import { X, Mail, Send, Loader2 } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

export default function EmailModal({ orchestrator }) {
  const {
    showEmailModal,
    emailDraft,
    closeEmailModal,
    updateEmailDraft,
    isTyping,
  } = useWorkflowStore((s) => ({
    showEmailModal: s.showEmailModal,
    emailDraft: s.emailDraft,
    closeEmailModal: s.closeEmailModal,
    updateEmailDraft: s.updateEmailDraft,
    isTyping: s.isTyping,
  }));

  if (!showEmailModal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeEmailModal();
  };

  const handleSend = () => {
    orchestrator?.sendEmail();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal email-modal">
        <div className="modal-header">
          <h2>
            <Mail size={18} style={{ color: 'var(--blue)' }} />
            Send Failure Notification
          </h2>
          <button className="modal-close" onClick={closeEmailModal}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* To */}
          <div className="email-field">
            <label>To</label>
            <input
              type="email"
              value={emailDraft.to}
              onChange={(e) => updateEmailDraft('to', e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          {/* Subject */}
          <div className="email-field">
            <label>Subject</label>
            <input
              type="text"
              value={emailDraft.subject}
              onChange={(e) => updateEmailDraft('subject', e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {/* Body */}
          <div className="email-field">
            <label>Message Body</label>
            <textarea
              value={emailDraft.body}
              onChange={(e) => updateEmailDraft('body', e.target.value)}
              rows={10}
              style={{ minHeight: 200 }}
            />
          </div>

          {/* Preview */}
          <div>
            <div className="email-preview-label">
              <Mail size={12} />
              Preview
            </div>
            <div className="email-preview-box">{emailDraft.body}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeEmailModal}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!emailDraft.to || !emailDraft.subject || isTyping}
          >
            {isTyping ? (
              <>
                <Loader2 size={14} className="spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
