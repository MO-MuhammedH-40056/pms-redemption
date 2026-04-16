import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { fileToBase64 } from '../../skills/fileConverter';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function UploadZone() {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { setFile, addMessage, showToast } = useWorkflowStore((s) => ({
    setFile: s.setFile,
    addMessage: s.addMessage,
    showToast: s.showToast,
  }));

  const handleFile = async (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('❌', 'Unsupported file type. Use PDF, XLSX, PNG, JPG or WEBP.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      showToast('❌', 'File too large. Maximum size is 5 MB.');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      console.log('[UploadZone] File ready:', {
        name: file.name,
        type: file.type,
        sizeBytes: file.size,
        base64LengthChars: base64.length,
        base64Preview: base64.slice(0, 80) + '...',
      });
      setFile(file, base64, url);
      addMessage('system', `📎 Document uploaded: ${file.name}`);
      showToast('📎', `${file.name} uploaded`);
    } catch (err) {
      console.error('[UploadZone] File read error:', err);
      showToast('❌', 'Failed to read the file. Please try again.');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      <div className="upload-zone-icon">
        <Upload size={22} />
      </div>

      <h3>{dragOver ? 'Drop to upload' : 'Upload Document'}</h3>
      <p>Drag & drop or click to browse</p>

      <div className="upload-zone-formats">
        {['PDF', 'XLSX', 'PNG', 'JPG', 'WEBP'].map((fmt) => (
          <span key={fmt} className="format-tag">{fmt}</span>
        ))}
      </div>

      <p style={{ marginTop: 8, fontSize: 11, color: 'var(--gray-400)' }}>
        Max file size: 5 MB
      </p>
    </div>
  );
}
