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
      await callApi(API_CONFIG.sendEmail, {
        MailBody: emailDraft.body,
        To: emailDraft.to,
        Subject: emailDraft.subject,
      });

      closeEmailModal();
      addMessage(
        'system',
        `✅ Email sent successfully to ${emailDraft.to}`
      );
      showToast('✅', 'Email sent successfully');
    } catch (err) {
      addMessage('error', `❌ Failed to send email: ${err.message}`);
      showToast('❌', 'Email send failed');
    }
  }
}
