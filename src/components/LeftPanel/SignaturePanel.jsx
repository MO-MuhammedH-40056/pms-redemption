import React, { useState } from 'react';
import {
  ShieldCheck, ShieldX, Shield, RefreshCw, Loader2,
  AlertTriangle, RotateCcw, CheckCircle,
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { isImageFile } from '../../skills/fileConverter';

// Inline placeholder shown when the original signature cannot be fetched (e.g. CORS)
function DummySig() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="60" viewBox="0 0 140 60" style={{ display: 'block' }}>
      <rect width="140" height="60" fill="#f8fafc" rx="4" />
      <path
        d="M10 46 C18 26,28 16,40 32 C48 42,54 46,64 30 C72 16,80 12,92 28 C102 42,110 48,124 36 C130 29,136 28,138 30"
        stroke="#94a3b8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <text x="70" y="57" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#cbd5e1" letterSpacing="1.2">
        NOT AVAILABLE
      </text>
    </svg>
  );
}

// ─── Single signature image slot ─────────────────────────────────────────────
function SigImageBox({ label, src, loading, errorMsg, emptyMsg }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="sig-slot">
      <div className="sig-slot-label">{label}</div>
      <div className={`sig-slot-box ${loading ? 'loading' : ''} ${(errorMsg || imgError) ? 'error' : ''}`}>
        {loading ? (
          <Loader2 size={18} className="spin" style={{ color: 'var(--gray-400)' }} />
        ) : src && !imgError ? (
          <img
            src={src}
            alt={label}
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : errorMsg || imgError ? (
          <div style={{ textAlign: 'center', padding: '4px 8px' }}>
            <AlertTriangle size={14} style={{ color: 'var(--warning)', marginBottom: 4 }} />
            <p style={{ fontSize: 10, color: 'var(--warning)', lineHeight: 1.3 }}>
              {errorMsg || 'Image load error'}
            </p>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{emptyMsg || 'Pending'}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function SignaturePanel({ orchestrator }) {
  const {
    sigVerification,
    originalSignature,
    sigOriginalState,
    sigOriginalError,
    sigVerifyState,
    sigState,
    uploadedFile,
    uploadedFileURL,
  } = useWorkflowStore((s) => ({
    sigVerification:  s.sigVerification,
    originalSignature: s.originalSignature,
    sigOriginalState: s.sigOriginalState,
    sigOriginalError: s.sigOriginalError,
    sigVerifyState:   s.sigVerifyState,
    sigState:         s.sigState,
    uploadedFile:     s.uploadedFile,
    uploadedFileURL:  s.uploadedFileURL,
  }));

  const originalLoading = sigOriginalState === 'loading';
  const originalError   = sigOriginalState === 'error';
  const originalDone    = sigOriginalState === 'done';

  const verifyLoading = sigVerifyState === 'loading';
  const verifyDone    = sigVerifyState === 'done';

  const isMatch  = sigVerification?.IsMatch;
  const accuracy = sigVerification?.Accuracy ?? null;

  // Document sig preview (image files only)
  const docSrc = uploadedFile && isImageFile(uploadedFile.name) ? uploadedFileURL : null;

  // Original sig from API
  const origSrc = originalSignature?.FILE
    ? `data:image/jpeg;base64,${originalSignature.FILE}`
    : null;

  const accuracyColor =
    accuracy === null     ? 'var(--gray-400)'
    : accuracy >= 70      ? 'var(--success)'
    : accuracy >= 40      ? 'var(--warning)'
    :                       'var(--error)';

  const overallIcon = sigState === 'loading'
    ? <Loader2 size={13} className="spin" />
    : originalError
      ? <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
      : verifyDone && isMatch === true
        ? <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
        : verifyDone && isMatch === false
          ? <ShieldX size={13} style={{ color: 'var(--error)' }} />
          : <Shield size={13} style={{ color: 'var(--gray-400)' }} />;

  return (
    <div className="signature-panel">

      {/* Header */}
      <div className="signature-panel-header">
        <div className="signature-panel-title">
          {overallIcon}
          Signature Verification
        </div>
        {verifyDone && sigVerification && (
          <span className={`status-badge ${isMatch ? 'filled' : 'error'}`} style={{ fontSize: 10 }}>
            {isMatch ? 'Match' : 'Mismatch'}
          </span>
        )}
      </div>

      {/* Step 1: Original signature */}
      <div className="sig-step">
        <div className="sig-step-label">
          {originalDone
            ? <CheckCircle size={11} style={{ color: 'var(--success)' }} />
            : originalError
              ? <AlertTriangle size={11} style={{ color: 'var(--warning)' }} />
              : originalLoading
                ? <Loader2 size={11} className="spin" style={{ color: 'var(--blue)' }} />
                : <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--gray-300)' }} />
          }
          Step 1: Load Original Signature
        </div>

        {/* Reload button — shown when original failed OR already done (allow re-fetch after editing PAN/code) */}
        {(originalError || originalDone) && (
          <button
            className="reverify-btn"
            onClick={() => orchestrator?.reloadOriginalAndVerify()}
            disabled={sigState === 'loading'}
            title="Update PAN / Account Code in the form, then click to reload"
          >
            <RotateCcw size={11} className={sigState === 'loading' ? 'spin' : ''} />
            {originalError ? 'Reload Signature' : 'Re-load & Re-compare'}
          </button>
        )}

        {originalError && (
          <div className="sig-error-hint">
            <AlertTriangle size={11} />
            {sigOriginalError || 'Could not fetch original signature.'}
            <br />
            <strong>Edit PAN / Account Code in the form above, then click Reload.</strong>
          </div>
        )}
      </div>

      {/* Step 2: Compare — only shown when original was obtained */}
      {(originalDone || verifyDone || verifyLoading) && (
        <div className="sig-step">
          <div className="sig-step-label">
            {verifyDone
              ? <CheckCircle size={11} style={{ color: 'var(--success)' }} />
              : verifyLoading
                ? <Loader2 size={11} className="spin" style={{ color: 'var(--blue)' }} />
                : <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--gray-300)' }} />
            }
            Step 2: Compare Signatures
          </div>
        </div>
      )}

      {/* Signature images */}
      <div className="sig-images-grid">
        <SigImageBox
          label="Document Signature"
          src={docSrc}
          loading={false}
          errorMsg={!docSrc ? 'PDF — no inline preview' : null}
          emptyMsg="Upload an image file"
        />
        {/* Original on Record — show dummy inline SVG on CORS/error, avoid data URL issues */}
        <div className="sig-slot">
          <div className="sig-slot-label">Original on Record</div>
          <div className={`sig-slot-box ${originalLoading ? 'loading' : ''}`}>
            {originalLoading ? (
              <Loader2 size={18} className="spin" style={{ color: 'var(--gray-400)' }} />
            ) : originalError ? (
              <DummySig />
            ) : origSrc ? (
              <img
                src={origSrc}
                alt="Original on Record"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {sigOriginalState === 'idle' ? 'Pending extraction' : 'Pending'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Accuracy bar — only when compare is done */}
      {verifyDone && sigVerification && (
        <div className="sig-accuracy-wrap">
          <div className="sig-accuracy-row">
            <span>Accuracy</span>
            <span style={{ fontWeight: 700, color: accuracyColor }}>{accuracy}%</span>
          </div>
          <div className="sig-accuracy-track">
            <div
              className="sig-accuracy-fill"
              style={{ width: `${accuracy}%`, background: accuracyColor }}
            />
          </div>
          <div className="sig-accuracy-verdict" style={{ color: accuracyColor }}>
            {isMatch ? '✅ Signature verified' : '⚠️ Signature mismatch — review before submitting'}
          </div>
        </div>
      )}
    </div>
  );
}
