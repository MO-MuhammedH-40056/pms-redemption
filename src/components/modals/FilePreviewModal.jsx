import React from 'react';
import { X, FileText } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { isImageFile, isPdfFile, isXlsxFile } from '../../skills/fileConverter';

export default function FilePreviewModal() {
  const { uploadedFile, uploadedFileURL, showFilePreview, setShowFilePreview } =
    useWorkflowStore((s) => ({
      uploadedFile: s.uploadedFile,
      uploadedFileURL: s.uploadedFileURL,
      showFilePreview: s.showFilePreview,
      setShowFilePreview: s.setShowFilePreview,
    }));

  if (!showFilePreview || !uploadedFile) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setShowFilePreview(false);
  };

  const renderContent = () => {
    if (isImageFile(uploadedFile.name)) {
      return (
        <img
          src={uploadedFileURL}
          alt={uploadedFile.name}
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
        />
      );
    }

    if (isPdfFile(uploadedFile.name)) {
      return (
        <iframe
          src={uploadedFileURL}
          title={uploadedFile.name}
          style={{ width: '100%', height: '80vh', border: 'none' }}
        />
      );
    }

    if (isXlsxFile(uploadedFile.name)) {
      return (
        <div className="preview-xlsx-message">
          <FileText size={48} />
          <h3>{uploadedFile.name}</h3>
          <p>
            Excel files cannot be previewed directly in the browser.
            <br />
            The file has been uploaded and will be processed by the AI agent.
          </p>
        </div>
      );
    }

    return (
      <div className="preview-xlsx-message">
        <FileText size={48} />
        <h3>{uploadedFile.name}</h3>
        <p>Preview not available for this file type.</p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal preview-modal">
        <div className="modal-header">
          <h2>
            <FileText size={18} />
            {uploadedFile.name}
          </h2>
          <button
            className="modal-close"
            onClick={() => setShowFilePreview(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{renderContent()}</div>
      </div>
    </div>
  );
}
