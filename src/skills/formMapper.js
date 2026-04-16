export function mapToSubmitPayload(formData, fileName) {
  return {
    request_type: formData.request_type || '',
    pan_no: formData.pan_card_no || '',
    redemption_type: formData.redemption_type?.full_redemption ? 'Full' : 'Partial',
    redemption_sub_type: formData.redemption_payout_option?.fund_transfer
      ? 'Fund Transfer'
      : 'Stock Transfer',
    account_code: formData.account_code || '',
    redemption_amount:
      parseFloat(formData.redemption_amount?.amount_in_figures) || 0,
    FileName: fileName || '',
  };
}

export function buildEmailBody(error, formData) {
  return `Dear Team,

This is to inform you that the PMS Redemption request could not be processed due to the following error:

Error: ${error}

Client Details:
- Account Code: ${formData?.account_code || 'N/A'}
- PAN: ${formData?.pan_card_no || 'N/A'}
- Client Name: ${formData?.first_account_holder_name || 'N/A'}
- Request Type: ${formData?.request_type || 'N/A'}
- Redemption Type: ${
    formData?.redemption_type?.full_redemption
      ? 'Full Redemption'
      : 'Partial Redemption'
  }

Please review and take appropriate action.

Regards,
PMS Operations Team`;
}
