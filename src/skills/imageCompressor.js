/**
 * Compress a base64 image before sending to APIs with token/size limits.
 * Falls back to the original if compression fails.
 *
 * @param {string} base64String - raw base64 (no data-URL prefix)
 * @param {object} options
 * @param {number} options.maxWidth  - max pixel width (default 1024)
 * @param {number} options.quality   - JPEG quality 0–1 (default 0.7)
 * @returns {Promise<string>} compressed base64 string
 */
export function compressImageBase64(base64String, { maxWidth = 1024, quality = 0.72 } = {}) {
  return new Promise((resolve) => {
    try {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressed = dataUrl.split(',')[1];

        const origKB  = Math.round(base64String.length * 0.75 / 1024);
        const compKB  = Math.round(compressed.length  * 0.75 / 1024);
        console.log(`[imageCompressor] ${origKB} KB → ${compKB} KB (quality=${quality}, maxWidth=${maxWidth})`);

        resolve(compressed);
      };

      img.onerror = () => {
        console.warn('[imageCompressor] Could not load image — using original');
        resolve(base64String);
      };

      // Try common image types; canvas will normalize to JPEG output
      img.src = `data:image/jpeg;base64,${base64String}`;
    } catch (e) {
      console.warn('[imageCompressor] Error during compression:', e);
      resolve(base64String);
    }
  });
}
