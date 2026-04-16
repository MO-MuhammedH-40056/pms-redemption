import React, { useState, useCallback } from 'react';
import { X, FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { isImageFile, isPdfFile, isXlsxFile } from '../../skills/fileConverter';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

export default function FilePreviewModal() {
  const [zoom, setZoom] = useState(1.0);

  const { uploadedFile, uploadedFileURL, showFilePreview, setShowFilePreview } =
    useWorkflowStore((s) => ({
      uploadedFile:      s.uploadedFile,
      uploadedFileURL:   s.uploadedFileURL,
      showFilePreview:   s.showFilePreview,
      setShowFilePreview: s.setShowFilePreview,
    }));

  const close = useCallback(() => {
    setShowFilePreview(false);
    setZoom(1.0);
  }, [setShowFilePreview]);

  const zoomIn  = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const resetZoom = () => setZoom(1.0);

  // Mouse-wheel zoom on the image container
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)));
    });
  }, []);

  if (!showFilePreview || !uploadedFile) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const isImage = isImageFile(uploadedFile.name);
  const isPdf   = isPdfFile(uploadedFile.name);
  const isXlsx  = isXlsxFile(uploadedFile.name);

  const renderContent = () => {
    if (isImage) {
      return (
        <div
          className="preview-scroll-area"
          onWheel={onWheel}
          style={{ overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', height: '100%', cursor: zoom > 1 ? 'grab' : 'default' }}
        >
          <img
            src={uploadedFileURL}
            alt={uploadedFile.name}
            style={{
              transformOrigin: 'top center',
              transform: `scale(${zoom})`,
              transition: 'transform 0.15s ease',
              maxWidth: zoom <= 1 ? '100%' : 'none',
              display: 'block',
            }}
            draggable={false}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <div style={{
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            transformOrigin: 'top left',
            transform: `scale(${zoom})`,
            transition: 'transform 0.15s ease',
            overflow: 'hidden',
          }}>
            <iframe
              src={uploadedFileURL}
              title={uploadedFile.name}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        </div>
      );
    }

    if (isXlsx) {
      return (
        <div className="preview-unsupported">
          <FileText size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>{uploadedFile.name}</h3>
          <p>Excel files cannot be previewed in-browser.<br />The file is uploaded and ready for AI processing.</p>
        </div>
      );
    }

    return (
      <div className="preview-unsupported">
        <FileText size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>{uploadedFile.name}</h3>
        <p>Preview not available for this file type.</p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal preview-modal">

        {/* Header */}
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {uploadedFile.name}
            </span>
          </h2>

          {/* Zoom controls — only for image + PDF */}
          {(isImage || isPdf) && (
            <div className="zoom-controls">
              <button
                className="zoom-btn"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                className="zoom-level"
                onClick={resetZoom}
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="zoom-btn"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                className="zoom-btn"
                onClick={resetZoom}
                title="Fit to window"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          )}

          <button className="modal-close" onClick={close} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body preview-body">
          {renderContent()}
        </div>

        {/* Footer hint */}
        {(isImage || isPdf) && (
          <div className="modal-footer" style={{ fontSize: 11, color: 'var(--gray-400)', justifyContent: 'center' }}>
            {isImage && 'Scroll wheel to zoom · Drag to pan when zoomed in'}
            {isPdf   && 'Use zoom controls above to resize the PDF view'}
          </div>
        )}
      </div>
    </div>
  );
}
