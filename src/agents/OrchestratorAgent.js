import { ExtractionAgent } from './ExtractionAgent';
import { SignatureAgent } from './SignatureAgent';
import { SubmitAgent } from './SubmitAgent';
import { EmailAgent } from './EmailAgent';
import { callApi } from '../skills/apiClient';
import { API_CONFIG, DEFAULT_EMAIL } from '../config/api.config';
import { buildEmailBody } from '../skills/formMapper';

export class OrchestratorAgent {
  constructor(store) {
    this.store = store;
    this.extraction = new ExtractionAgent(store);
    this.signature = new SignatureAgent(store);
    this.submit = new SubmitAgent(store);
    this.email = new EmailAgent(store);
  }

  async processDocument() {
    const {
      uploadedFile,
      setWorkflowState,
      setIsProcessing,
      setProgress,
      addMessage,
    } = this.store.getState();

    setIsProcessing(true);
    setWorkflowState('extracting');
    setProgress(10, 'Initializing agent...');

    addMessage(
      'ai',
      `⚡ Starting AI processing for **${uploadedFile.name}**. I'll extract all form fields, then verify the signature automatically.`
    );

    // Step 1: Extract
    const extractedData = await this.extraction.execute();
    if (!extractedData) {
      setIsProcessing(false);
      await this.sendToSummarizer(
        `Extraction failed for document ${uploadedFile.name}. Ask user to retry or check the document quality.`
      );
      return;
    }

    addMessage(
      'system',
      `📋 Extracted: Account ${extractedData.account_code} | PAN ${extractedData.pan_card_no} | ${
        extractedData.redemption_type?.full_redemption
          ? 'Full Redemption'
          : 'Partial Redemption'
      }`
    );

    // Step 2: Signature verification (auto-triggered)
    setWorkflowState('verifying');
    await this.signature.execute(extractedData);

    // Step 3: Ready for review
    setWorkflowState('reviewing');
    setIsProcessing(false);

    const summarizerInput = `Document extraction complete. Account: ${extractedData.account_code}, PAN: ${extractedData.pan_card_no}, Client: ${extractedData.first_account_holder_name}, Redemption type: ${
      extractedData.redemption_type?.full_redemption ? 'Full' : 'Partial'
    }. Signature verified. Please guide user to review and submit.`;
    await this.sendToSummarizer(summarizerInput);
  }

  async submitDocument() {
    const { formData, addMessage, openEmailModal } = this.store.getState();
    const result = await this.submit.execute();

    if (result && result.success === false) {
      await this.sendToSummarizer(
        `Submission failed: ${result.error}. Offer the user to send a failure notification email.`
      );
      addMessage(
        'ai',
        `⚠️ Submission failed: **${result.error}**\n\nWould you like me to draft a failure notification email? Click **"Send Email"** below to compose and send it.`
      );
      // Auto-open email modal with pre-filled data
      const body = buildEmailBody(result.error, formData);
      openEmailModal({
        to: DEFAULT_EMAIL,
        subject: `PMS Redemption - Submission Failed - ${formData?.account_code || ''}`,
        body,
      });
    } else if (result === true) {
      await this.sendToSummarizer(
        `Redemption request submitted successfully for account ${formData?.account_code}. Congratulate the user.`
      );
    }
  }

  async sendEmail() {
    await this.email.execute();
  }

  async reVerifySignature() {
    const { formData, addMessage } = this.store.getState();
    if (!formData) return;
    addMessage(
      'ai',
      '🔄 Re-running signature verification with updated PAN and Account Code...'
    );
    await this.signature.reVerify();
    const { sigVerification } = this.store.getState();
    if (sigVerification) {
      await this.sendToSummarizer(
        `Re-verification complete. Result: ${
          sigVerification.IsMatch ? 'Match' : 'Mismatch'
        } at ${sigVerification.Accuracy}% accuracy. Guide user accordingly.`
      );
    }
  }

  async handleUserMessage(userText) {
    const {
      formData,
      workflowState,
      sigVerification,
      uploadedFile,
      addMessage,
      setTyping,
    } = this.store.getState();

    addMessage('user', userText);
    setTyping(true);

    const context = [
      `Workflow state: ${workflowState}.`,
      uploadedFile ? `Document: ${uploadedFile.name}.` : '',
      formData
        ? `Account: ${formData.account_code}, PAN: ${formData.pan_card_no}, Client: ${
            formData.first_account_holder_name
          }, Type: ${
            formData.redemption_type?.full_redemption
              ? 'Full Redemption'
              : 'Partial Redemption'
          }.`
        : '',
      sigVerification
        ? `Signature: ${
            sigVerification.IsMatch ? 'Matched' : 'Not Matched'
          } (${sigVerification.Accuracy}% accuracy).`
        : '',
      `User question: ${userText}`,
    ]
      .filter(Boolean)
      .join(' ');

    await this.sendToSummarizer(context);
    setTyping(false);
  }

  async sendToSummarizer(input) {
    const { sessionId, addMessage, setTyping } = this.store.getState();
    setTyping(true);
    try {
      const result = await callApi(API_CONFIG.summarizer, {
        Input: input,
        SessionId: sessionId,
      });
      const text =
        typeof result === 'string'
          ? result
          : result?.Output ||
            result?.output ||
            result?.message ||
            JSON.stringify(result);
      if (text) addMessage('ai', text);
    } catch {
      // Silently fail summarizer — don't disrupt main workflow
    } finally {
      setTyping(false);
    }
  }
}
