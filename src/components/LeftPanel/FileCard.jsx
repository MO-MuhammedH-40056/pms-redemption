import React from 'react';
import { X, Eye, FileText } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { formatFileSize, isImageFile, isPdfFile, isXlsxFile } from '../../skills/fileConverter';

function FileThumbnail({ file, url }) {
  if (isImageFile(file.name)) {
    return (
      <div className="file-card-thumb">
        <img src={url} alt={file.name} />
      </div>
    );
  }

  if (isPdfFile(file.name)) {
    return (
      <div className="file-card-thumb-icon pdf">
        <FileText size={18} />
        <span>PDF</span>
      </div>
    );
  }

  if (isXlsxFile(file.name)) {
    return (
      <div className="file-card-thumb-icon xlsx">
        <FileText size={18} />
        <span>XLSX</span>
      </div>
    );
  }

  return (
    <div className="file-card-thumb-icon default">
      <FileText size={18} />
      <span>{file.name.split('.').pop().toUpperCase()}</span>
    </div>
  );
}

export default function FileCard() {
  const { uploadedFile, uploadedFileURL, clearFile, setShowFilePreview } =
    useWorkflowStore((s) => ({
      uploadedFile: s.uploadedFile,
      uploadedFileURL: s.uploadedFileURL,
      clearFile: s.clearFile,
      setShowFilePreview: s.setShowFilePreview,
    }));

  if (!uploadedFile) return null;

  return (
    <div className="file-card">
      <div className="file-card-header">
        <FileThumbnail file={uploadedFile} url={uploadedFileURL} />
        <div className="file-card-info">
          <div className="file-card-name" title={uploadedFile.name}>
            {uploadedFile.name}
          </div>
          <div className="file-card-size">
            {formatFileSize(uploadedFile.size)}
          </div>
        </div>
        <button
          className="file-card-remove"
          onClick={clearFile}
          title="Remove file"
        >
          <X size={14} />
        </button>
      </div>

      <div className="file-card-actions">
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={() => setShowFilePreview(true)}
        >
          <Eye size={13} />
          Preview
        </button>
      </div>
    </div>
  );
}
