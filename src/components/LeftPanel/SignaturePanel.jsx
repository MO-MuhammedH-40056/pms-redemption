import React, { useState } from 'react';
import { ShieldCheck, ShieldX, Shield, RefreshCw, Loader2 } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { isImageFile } from '../../skills/fileConverter';

function SigImageBox({ label, src, loading, error }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="signature-image-slot">
      <div className="signature-image-slot-label">{label}</div>
      <div className={`signature-image-box${loading ? ' loading' : ''}${(error || imgError) ? ' error' : ''}`}>
        {loading ? (
          <Loader2 size={18} className="spin" style={{ color: 'var(--gray-400)' }} />
        ) : src && !imgError ? (
          <img
            src={src}
            alt={label}
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : error || imgError ? (
          <span style={{ fontSize: 11 }}>
            {error || 'Image unavailable'}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>No image</span>
        )}
      </div>
    </div>
  );
}

export default function SignaturePanel({ orchestrator }) {
  const {
    sigVerification,
    originalSignature,
    sigState,
    uploadedFile,
    uploadedFileURL,
  } = useWorkflowStore((s) => ({
    sigVerification: s.sigVerification,
    originalSignature: s.originalSignature,
    sigState: s.sigState,
    uploadedFile: s.uploadedFile,
    uploadedFileURL: s.uploadedFileURL,
  }));

  const loading = sigState === 'loading';
  const isMatch = sigVerification?.IsMatch;
  const accuracy = sigVerification?.Accuracy ?? null;

  // Document signature preview
  let docSrc = null;
  if (uploadedFile && isImageFile(uploadedFile.name)) {
    docSrc = uploadedFileURL;
  }

  // Original signature
  const origSrc = originalSignature?.FILE
    ? `data:image/jpeg;base64,${originalSignature.FILE}`
    : null;

  const accuracyColor =
    accuracy === null ? 'medium'
    : accuracy >= 70 ? 'high'
    : accuracy >= 40 ? 'medium'
    : 'low';

  return (
    <div className="signature-panel">
      <div className="signature-panel-header">
        <div className="signature-panel-title">
          {loading ? (
            <Loader2 size={13} className="spin" />
          ) : isMatch === true ? (
            <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
          ) : isMatch === false ? (
            <ShieldX size={13} style={{ color: 'var(--error)' }} />
          ) : (
            <Shield size={13} style={{ color: 'var(--gray-400)' }} />
          )}
          Signature Verification
        </div>

        {sigVerification && (
          <span
            className={`status-badge ${isMatch ? 'filled' : 'error'}`}
            style={{ fontSize: 10 }}
          >
            {isMatch ? 'Match' : 'Mismatch'}
          </span>
        )}
      </div>

      <div className="signature-images">
        <SigImageBox
          label="Document Signature"
          src={docSrc}
          loading={loading && !docSrc}
          error={!docSrc && !loading ? 'PDF — no preview' : null}
        />
        <SigImageBox
          label="Original Signature"
          src={origSrc}
          loading={loading}
          error={!loading && !origSrc && sigState === 'done' ? 'Not found' : null}
        />
      </div>

      {sigVerification && (
        <div className="signature-result">
          <div className="sig-accuracy">
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
              Accuracy:
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  accuracyColor === 'high'
                    ? 'var(--success)'
                    : accuracyColor === 'medium'
                    ? 'var(--warning)'
                    : 'var(--error)',
              }}
            >
              {accuracy}%
            </span>
            <div className="sig-accuracy-bar">
              <div
                className={`sig-accuracy-fill ${accuracyColor}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--gray-100)' }}>
        <button
          className="reverify-btn"
          onClick={() => orchestrator?.reVerifySignature()}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          {loading ? 'Verifying...' : 'Re-verify Signature'}
        </button>
      </div>
    </div>
  );
}
