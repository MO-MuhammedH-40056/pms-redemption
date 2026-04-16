export const API_CONFIG = {
  extraction: 'https://motilaloswal-dev.outsystems.app/PMSRedemptionDataExtraction/rest/Redemption/Red_DataExtraction',
  signatureVerify: 'https://motilaloswal-dev.outsystems.app/PMSRedemptionSignatureVerify/rest/Redemption/Red_SignatureVerify',
  originalSignature: 'https://monextdev.motilaloswal.com/PMSAPIService/rest/RedemptionAPI/GetOriginalSignature',
  submitRequest: 'https://monextdev.motilaloswal.com/PMSAPIService/rest/RedemptionAPI/Red_Request',
  sendEmail: 'https://monextdev.motilaloswal.com/PMSAPIService/rest/SendEmail/REST_API_SendEmail',
  summarizer: 'https://motilaloswal-dev.outsystems.app/PMSRedemptionSummmarizer/rest/Redemption/Red_DataSummarizer',
};

export const DEFAULT_EMAIL = 'muhammed.ibrahim@motilaloswal.com';
export const EMAIL_SUBJECT_PREFIX = 'PMS Redemption';
