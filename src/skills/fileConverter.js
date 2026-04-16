// Base64-encoded string (data URL prefix stripped) — standard for JSON APIs
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

// Full data URL including prefix — some APIs expect this format
export const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

// Raw binary string — for APIs that accept direct binary content as a string field
export const fileToBinaryString = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
};

export const getFileExtension = (filename) =>
  filename.split('.').pop().toLowerCase();

export const isImageFile = (filename) =>
  ['png', 'jpg', 'jpeg', 'webp'].includes(getFileExtension(filename));

export const isPdfFile = (filename) =>
  getFileExtension(filename) === 'pdf';

export const isXlsxFile = (filename) =>
  ['xlsx', 'xls'].includes(getFileExtension(filename));
