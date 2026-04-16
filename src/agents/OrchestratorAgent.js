import { ExtractionAgent } from './ExtractionAgent';
import { SignatureAgent } from './SignatureAgent';
import { SubmitAgent } from './SubmitAgent';
import { EmailAgent } from './EmailAgent';
import { callApi } from '../skills/apiClient';
import { API_CONFIG, DEFAULT_EMAIL } from '../config/api.config';
import { buildEmailBody } from '../skills/formMapper';

// ─── Email template detector ────────────────────────────────────────────────
// If the AI summarizer returns an email draft (Subject: line + body), we
// intercept it and open the email editor instead of showing it raw in chat.
function detectEmailTemplate(text) {
  const subjectMatch = text.match(/Subject:\s*(.+?)(?:\r?\n|$)/i);
  if (!subjectMatch) return null;

  const subject = subjectMatch[1].trim();
  // Body = everything after the Subject line, trimmed
  const afterSubject = text.slice(text.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
  if (!afterSubject || afterSubject.length < 30) return null;

  // Must look like an email body: starts with Dear/Hi/To or has multiple lines
  const looksLikeBody =
    /^(dear|hi |hello|to |greetings)/i.test(afterSubject) ||
    afterSubject.split('\n').length > 3;

  if (!looksLikeBody) return null;

  return { subject, body: afterSubject };
}

// ─────────────────────────────────────────────────────────────────────────────

export class OrchestratorAgent {
  constructor(store) {
    this.store = store;
    this.extraction = new ExtractionAgent(store);
    this.signature  = new SignatureAgent(store);
    this.submit     = new SubmitAgent(store);
    this.email      = new EmailAgent(store);
  }

  // ─── App init: clear AI memory ────────────────────────────────────────────

  async clearAiMemory() {
    try {
      await callApi(API_CONFIG.clearData, {});
      console.log('[OrchestratorAgent] AI memory cleared on init');
    } catch (e) {
      console.warn('[OrchestratorAgent] ClearData call failed (non-blocking):', e.message);
    }
  }

  // ─── Main document processing pipeline ───────────────────────────────────

  async processDocument() {
    const { uploadedFile, setWorkflowState, setIsProcessing, setProgress, addMessage, processToken } =
      this.store.getState();

    // Capture token at start — if a new file is uploaded mid-flow, token changes and we abort
    if (!uploadedFile) return;

    const capturedToken = processToken;
    const isCancelled = () => this.store.getState().processToken !== capturedToken;

    setIsProcessing(true);
    setWorkflowState('extracting');
    setProgress(10, 'Initializing agent...');

    addMessage('ai',
      `⚡ Starting AI processing for **${uploadedFile.name}**. I'll extract all form fields, then fetch and verify the signature.`
    );

    // ── Step 1: Extract ──────────────────────────────────────────────────────
    const extractedData = await this.extraction.execute(capturedToken);
    if (isCancelled()) return;

    if (!extractedData) {
      setIsProcessing(false);
      await this.sendToSummarizer(
        `Extraction failed for document ${uploadedFile.name}. Ask user to retry or check document quality.`,
        capturedToken
      );
      return;
    }

    // ── Step 2: Form is now populated — move to reviewing state first ─────────
    // This satisfies requirement #5: show form data BEFORE signature step
    setWorkflowState('reviewing');

    addMessage('system',
      `📋 Extracted: Account **${extractedData.account_code}** | PAN **${extractedData.pan_card_no}** | ${
        extractedData.redemption_type?.full_redemption ? 'Full Redemption' : 'Partial Redemption'
      }`
    );

    // ── Step 3: Fetch original signature, then compare ────────────────────────
    setWorkflowState('verifying');
    await this.signature.execute(extractedData, capturedToken);
    if (isCancelled()) return;

    // ── Step 4: Back to reviewing ─────────────────────────────────────────────
    setWorkflowState('reviewing');
    setIsProcessing(false);

    const { sigVerification, sigOriginalState } = this.store.getState();
    const summarizerInput = [
      `Document extraction and signature verification complete.`,
      `Account: ${extractedData.account_code}, PAN: ${extractedData.pan_card_no},`,
      `Client: ${extractedData.first_account_holder_name},`,
      `Redemption type: ${extractedData.redemption_type?.full_redemption ? 'Full' : 'Partial'}.`,
      sigVerification
        ? `Signature: ${sigVerification.IsMatch ? 'Matched' : 'Mismatched'} at ${sigVerification.Accuracy}%.`
        : sigOriginalState === 'error'
          ? 'Original signature could not be fetched — user needs to review PAN/Account Code.'
          : '',
      'Guide user to review extracted fields and submit.',
    ].join(' ');

    await this.sendToSummarizer(summarizerInput, capturedToken);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async submitDocument() {
    const { formData, openEmailModal, processToken } = this.store.getState();
    const capturedToken = processToken;
    const result = await this.submit.execute();

    if (this.store.getState().processToken !== capturedToken) return;

    if (result && result.success === false) {
      await this.sendToSummarizer(
        `Submission failed: ${result.error}. Offer the user to send a failure notification email.`,
        capturedToken
      );
      // Auto-open email modal
      openEmailModal({
        to: DEFAULT_EMAIL,
        subject: `PMS Redemption - Submission Failed - ${formData?.account_code || ''}`,
        body: buildEmailBody(result.error, formData),
      });
    } else if (result === true) {
      await this.sendToSummarizer(
        `Redemption request submitted successfully for account ${formData?.account_code}. Congratulate the user.`,
        capturedToken
      );
    }
  }

  // ─── Email ────────────────────────────────────────────────────────────────

  async sendEmail() {
    await this.email.execute();
  }

  // ─── Reload original signature + re-compare (from SignaturePanel button) ──

  async reloadOriginalAndVerify() {
    const { formData, addMessage, processToken } = this.store.getState();
    if (!formData) return;

    await this.signature.reloadOriginal();

    const { sigVerification, processToken: currentToken } = this.store.getState();
    if (processToken !== currentToken) return; // new file uploaded

    if (sigVerification) {
      await this.sendToSummarizer(
        `Re-verification complete. Result: ${sigVerification.IsMatch ? 'Match' : 'Mismatch'} at ${sigVerification.Accuracy}% accuracy.`,
        currentToken
      );
    }
  }

  // ─── Compare-only (skip fetching original, use whatever is on record) ──────

  async compareOnly() {
    await this.signature.reVerify();
  }

  // ─── Chat user message ────────────────────────────────────────────────────

  async handleUserMessage(userText) {
    const { formData, workflowState, sigVerification, uploadedFile, addMessage, setTyping, processToken } =
      this.store.getState();

    addMessage('user', userText);
    setTyping(true);

    const context = [
      `Workflow state: ${workflowState}.`,
      uploadedFile ? `Document: ${uploadedFile.name}.` : '',
      formData
        ? `Account: ${formData.account_code}, PAN: ${formData.pan_card_no}, Client: ${
            formData.first_account_holder_name
          }, Type: ${formData.redemption_type?.full_redemption ? 'Full Redemption' : 'Partial Redemption'}.`
        : '',
      sigVerification
        ? `Signature: ${sigVerification.IsMatch ? 'Matched' : 'Not Matched'} (${sigVerification.Accuracy}% accuracy).`
        : '',
      `User question: ${userText}`,
    ]
      .filter(Boolean)
      .join(' ');

    await this.sendToSummarizer(context, processToken);
    setTyping(false);
  }

  // ─── Summarizer + email-template interception ─────────────────────────────

  async sendToSummarizer(input, capturedToken) {
    const { sessionId, addMessage, setTyping, openEmailModal } = this.store.getState();
    setTyping(true);
    try {
      const result = await callApi(API_CONFIG.summarizer, { Input: input, SessionId: sessionId });

      // Check cancellation after await
      if (capturedToken !== undefined && this.store.getState().processToken !== capturedToken) return;

      const text =
        typeof result === 'string'
          ? result
          : result?.Output || result?.output || result?.message || JSON.stringify(result);

      if (!text) return;

      // ── Email template detection ──────────────────────────────────────────
      const emailTemplate = detectEmailTemplate(text);
      if (emailTemplate) {
        // Show a short acknowledgement in chat rather than the full email body
        addMessage('ai', `📧 I've drafted a failure notification email. Please review and send it using the email editor that just opened.`);
        // Open email editor pre-filled
        openEmailModal({
          to: DEFAULT_EMAIL,
          subject: emailTemplate.subject,
          body: emailTemplate.body,
        });
        return;
      }

      addMessage('ai', text);
    } catch {
      // Silent — summarizer failures never block the main workflow
    } finally {
      setTyping(false);
    }
  }
}
