import { callApi } from '../skills/apiClient';
import { API_CONFIG } from '../config/api.config';
import { compressImageBase64 } from '../skills/imageCompressor';
import { isImageFile } from '../skills/fileConverter';

export class SignatureAgent {
  constructor(store) {
    this.store = store;
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  /** Returns true if the processToken has changed (new file uploaded). */
  _isCancelled(capturedToken) {
    return this.store.getState().processToken !== capturedToken;
  }

  // ─── Step 1: fetch original signature ─────────────────────────────────────

  async fetchOriginal(formData, capturedToken) {
    const {
      addMessage, setSigOriginalState, setOriginalSignature, showToast,
    } = this.store.getState();

    setSigOriginalState('loading');
    addMessage('system', '🔍 Fetching original signature from records...');

    try {
      const result = await callApi(API_CONFIG.originalSignature, {
        PAN:     formData.pan_card_no  || '',
        PMSCODE: formData.account_code || '',
      });

      if (this._isCancelled(capturedToken)) return false;

      if (!result?.FILE) {
        const msg = 'Original signature not found — check PAN and Account Code, then click "Reload Signature".';
        setSigOriginalState('error', msg);
        addMessage('error', `⚠️ ${msg}`);
        return false;
      }

      setOriginalSignature(result);
      setSigOriginalState('done');
      addMessage('system', `✅ Original signature loaded (${result.FILENAME || 'signature'})`);
      return true;
    } catch (err) {
      if (this._isCancelled(capturedToken)) return false;
      const msg = err.message.startsWith('CORS_ERROR')
        ? 'Could not reach signature records server. Update PAN/Account Code and click "Reload Signature".'
        : `Failed to load original signature: ${err.message}`;
      setSigOriginalState('error', msg);
      addMessage('error', `⚠️ ${msg}`);
      showToast('⚠️', 'Original signature unavailable');
      return false;
    }
  }

  // ─── Step 2: compare document signature against original ──────────────────

  async compareSignature(formData, capturedToken) {
    const {
      uploadedFile, uploadedFileBase64,
      addMessage, setSigVerifyState, setSigVerification, setProgress, showToast,
    } = this.store.getState();

    setSigVerifyState('loading');
    setProgress(90, 'Comparing signatures...');
    addMessage('system', '🔏 Comparing document signature with original...');

    try {
      // Compress image files before sending (Bedrock token limit)
      let docBinary = uploadedFileBase64;
      if (uploadedFile && isImageFile(uploadedFile.name)) {
        addMessage('system', '🗜️ Compressing image for signature comparison...');
        docBinary = await compressImageBase64(uploadedFileBase64, { maxWidth: 1024, quality: 0.72 });
      }

      if (this._isCancelled(capturedToken)) return;

      const result = await callApi(API_CONFIG.signatureVerify, {
        PMSCode:  formData.account_code || '',
        PAN:      formData.pan_card_no  || '',
        document: docBinary,
      });

      if (this._isCancelled(capturedToken)) return;

      setSigVerification(result);
      setSigVerifyState('done');

      const { IsMatch, Accuracy } = result;
      addMessage('system',
        `🔐 Signature comparison: ${IsMatch ? '✅ Match' : '⚠️ Mismatch'} — ${Accuracy}% accuracy`
      );
      showToast(IsMatch ? '✅' : '⚠️', `Signature ${IsMatch ? 'matched' : 'did not match'} (${Accuracy}%)`);
    } catch (err) {
      if (this._isCancelled(capturedToken)) return;
      setSigVerifyState('error');
      addMessage('error', `⚠️ Signature comparison failed: ${err.message}`);
    }
  }

  // ─── Main execute: fetch original first, then compare ─────────────────────

  async execute(formData, capturedToken) {
    const { setSigState, setProgress } = this.store.getState();

    setSigState('loading');
    setProgress(82, 'Fetching original signature...');

    const originalObtained = await this.fetchOriginal(formData, capturedToken);
    if (this._isCancelled(capturedToken)) return;

    if (!originalObtained) {
      // Stop here — user must fix PAN/account code and reload manually
      setSigState('error');
      setProgress(100, 'Signature fetch failed');
      return;
    }

    // Original obtained → now compare
    await this.compareSignature(formData, capturedToken);
    if (this._isCancelled(capturedToken)) return;

    setSigState('done');
    setProgress(100, 'Complete');
  }

  // ─── Reload original + re-compare (called from SignaturePanel button) ─────

  async reloadOriginal() {
    const { formData, processToken, setSigVerification, setOriginalSignature,
            setSigState, addMessage } = this.store.getState();
    if (!formData) return;

    const capturedToken = processToken;

    // Reset signature state
    setSigState('loading');
    setSigVerification(null);
    setOriginalSignature(null);
    this.store.getState().setSigOriginalState('idle');
    this.store.getState().setSigVerifyState('idle');

    addMessage('system', '🔄 Reloading original signature with updated PAN / Account Code...');

    const originalObtained = await this.fetchOriginal(formData, capturedToken);
    if (this._isCancelled(capturedToken)) return;

    if (!originalObtained) {
      setSigState('error');
      return;
    }

    await this.compareSignature(formData, capturedToken);
    if (this._isCancelled(capturedToken)) return;

    setSigState('done');
  }

  // ─── Re-verify only (keeps existing original, just re-compares) ───────────

  async reVerify() {
    const { formData, processToken, setSigVerification,
            setSigState, addMessage } = this.store.getState();
    if (!formData) return;

    const capturedToken = processToken;

    setSigState('loading');
    setSigVerification(null);
    this.store.getState().setSigVerifyState('idle');

    addMessage('system', '🔄 Re-running signature comparison with updated details...');
    await this.compareSignature(formData, capturedToken);
    if (this._isCancelled(capturedToken)) return;

    setSigState('done');
  }
}
