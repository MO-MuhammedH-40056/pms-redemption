import { callApi } from '../skills/apiClient';
import { API_CONFIG } from '../config/api.config';

export class SignatureAgent {
  constructor(store) {
    this.store = store;
  }

  async execute(formData) {
    const {
      uploadedFileBase64,
      addMessage,
      setSigState,
      setSigVerification,
      setOriginalSignature,
      setProgress,
      showToast,
    } = this.store.getState();

    setSigState('loading');
    setProgress(85, 'Verifying signature...');
    addMessage('system', '🔏 Running signature verification...');

    // Run both in parallel
    const [verifyResult, originalResult] = await Promise.allSettled([
      this.verifySignature(formData, uploadedFileBase64),
      this.fetchOriginalSignature(formData),
    ]);

    if (verifyResult.status === 'fulfilled') {
      setSigVerification(verifyResult.value);
      const { IsMatch, Accuracy } = verifyResult.value;
      addMessage(
        'system',
        `🔐 Signature verification: ${IsMatch ? '✅ Match' : '⚠️ Mismatch'} — ${Accuracy}% accuracy`
      );
    } else {
      addMessage(
        'error',
        `⚠️ Signature verification failed: ${verifyResult.reason?.message}`
      );
    }

    if (originalResult.status === 'fulfilled' && originalResult.value) {
      setOriginalSignature(originalResult.value);
    } else {
      addMessage(
        'system',
        '⚠️ Could not load original signature image. You can retry using the "Re-verify" button after confirming PAN and Account Code.'
      );
    }

    setSigState('done');
    setProgress(100, 'Complete');
    showToast('✅', 'Signature verification complete');
  }

  async verifySignature(formData, fileBase64) {
    return await callApi(API_CONFIG.signatureVerify, {
      PMSCode: formData.account_code || '',
      PAN: formData.pan_card_no || '',
      document: fileBase64,
    });
  }

  async fetchOriginalSignature(formData) {
    const result = await callApi(API_CONFIG.originalSignature, {
      PAN: formData.pan_card_no || '',
      PMSCODE: formData.account_code || '',
    });
    if (!result?.FILE) return null;
    return result;
  }

  async reVerify() {
    const {
      formData,
      setSigState,
      addMessage,
      setSigVerification,
      setOriginalSignature,
    } = this.store.getState();

    if (!formData) return;

    setSigState('loading');
    setSigVerification(null);
    setOriginalSignature(null);
    addMessage(
      'system',
      '🔄 Re-running signature verification with updated details...'
    );

    await this.execute(formData);
  }
}
