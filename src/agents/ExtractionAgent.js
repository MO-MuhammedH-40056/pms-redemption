import { callApi } from '../skills/apiClient';
import { API_CONFIG } from '../config/api.config';
import { fileToBase64 } from '../skills/fileConverter';

export class ExtractionAgent {
  constructor(store) {
    this.store = store;
  }

  async execute() {
    const {
      sessionId,
      uploadedFile,
      uploadedFileBase64,
      setProgress,
      addMessage,
      setWorkflowState,
      showToast,
    } = this.store.getState();

    try {
      setProgress(20, 'Parsing document structure...');
      addMessage('system', '📄 Sending document to extraction agent...');

      // Use base64 string as FileBinary (standard binary-over-JSON approach)
      let fileBinary = uploadedFileBase64;

      console.log('[ExtractionAgent] Session ID:', sessionId);
      console.log('[ExtractionAgent] File name:', uploadedFile.name);
      console.log('[ExtractionAgent] FileBinary length (chars):', fileBinary?.length);

      let result = await callApi(API_CONFIG.extraction, {
        UserInput: '',
        SessionId: sessionId,
        FileBinary: fileBinary,
        FileName: uploadedFile.name,
      });

      console.log('[ExtractionAgent] Raw result type:', typeof result);
      console.log('[ExtractionAgent] Raw result:', result);

      setProgress(60, 'Processing extracted fields...');

      // If result came back as a string, try to parse it as JSON
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
          console.log('[ExtractionAgent] Parsed string result:', result);
        } catch {
          console.error('[ExtractionAgent] Result is a non-JSON string:', result);
          throw new Error(`API returned unexpected text: "${result.slice(0, 200)}"`);
        }
      }

      if (!result || typeof result !== 'object') {
        throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
      }

      // Handle array responses — some OutSystems REST APIs wrap single objects in arrays
      const data = Array.isArray(result) ? result[0] : result;
      if (!data) throw new Error('Empty data in API response');

      console.log('[ExtractionAgent] Final extracted data:', data);

      this.store.getState().setExtractedData(data);
      setProgress(80, 'Form populated successfully');
      showToast('✅', 'Document data extracted successfully');
      return data;
    } catch (err) {
      console.error('[ExtractionAgent] Error:', err);
      const msg = err.message.startsWith('CORS_ERROR')
        ? 'Unable to reach the extraction service. Please check network connectivity.'
        : `Extraction failed: ${err.message}`;
      addMessage('error', `❌ ${msg}`);
      setWorkflowState('failed');
      showToast('❌', 'Extraction failed');
      return null;
    }
  }
}
