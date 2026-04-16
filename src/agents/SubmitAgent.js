import { callApi } from '../skills/apiClient';
import { API_CONFIG } from '../config/api.config';
import { mapToSubmitPayload } from '../skills/formMapper';

export class SubmitAgent {
  constructor(store) {
    this.store = store;
  }

  async execute() {
    const {
      formData,
      uploadedFile,
      addMessage,
      setWorkflowState,
      setIsProcessing,
      showToast,
    } = this.store.getState();

    addMessage('system', '📤 Submitting redemption request...');
    setIsProcessing(true);
    setWorkflowState('submitting');

    try {
      const payload = mapToSubmitPayload(formData, uploadedFile?.name);
      const result = await callApi(API_CONFIG.submitRequest, payload);

      setIsProcessing(false);

      if (result?.success === true || result?.success === 'true') {
        setWorkflowState('success');
        addMessage('system', '✅ Request submitted successfully!');
        showToast('✅', 'Redemption request submitted');
        return true;
      } else {
        const errorMsg =
          result?.message || 'Submission failed. Please try again.';
        setWorkflowState('failed');
        addMessage('error', `❌ Submission failed: ${errorMsg}`);
        showToast('❌', 'Submission failed');
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      setIsProcessing(false);
      const errorMsg = err.message.startsWith('CORS_ERROR')
        ? 'Unable to reach submission service. Check network.'
        : err.message;
      setWorkflowState('failed');
      addMessage('error', `❌ ${errorMsg}`);
      showToast('❌', 'Submission error');
      return { success: false, error: errorMsg };
    }
  }
}
