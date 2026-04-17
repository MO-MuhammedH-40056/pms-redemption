import { callApi } from '../skills/apiClient';
import { API_CONFIG } from '../config/api.config';

export class EmailAgent {
  constructor(store) {
    this.store = store;
  }

  async execute() {
    const { emailDraft, addMessage, closeEmailModal, showToast } =
      this.store.getState();

    addMessage('system', `📧 Sending email to ${emailDraft.to}...`);

    try {
      const result = await callApi(API_CONFIG.sendEmail, {
        MailBody: emailDraft.body,
        To: emailDraft.to,
        Subject: emailDraft.subject,
      });

      const isSuccess =
        result === 'Success' ||
        result?.message === 'Success' ||
        (typeof result === 'string' && result.toLowerCase().includes('success'));

      if (isSuccess) {
        closeEmailModal();
        addMessage('system', `✅ Email sent successfully to ${emailDraft.to}`);
        showToast('✅', 'Email sent successfully');
      } else {
        addMessage('error', `❌ Email send failed: server returned "${result}"`);
        showToast('❌', 'Email send failed');
      }
    } catch (err) {
      addMessage('error', `❌ Failed to send email: ${err.message}`);
      showToast('❌', 'Email send failed');
    }
  }
}
