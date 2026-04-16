import React from 'react';
import {
  FileText,
  User,
  CreditCard,
  Banknote,
  Send,
  Download,
  Loader2,
  Building2,
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import FormSection from './FormSection';
import FormField from './FormField';

function getSectionStatus(formData, fields) {
  if (!formData) return 'pending';
  const filled = fields.filter((f) => {
    const val = f.split('.').reduce((o, k) => o?.[k], formData);
    return val !== null && val !== undefined && val !== '';
  });
  if (filled.length === 0) return 'pending';
  if (filled.length === fields.length) return 'filled';
  return 'warning';
}

const SKELETON = (
  <>
    <div className="form-section-skeleton" />
    <div className="form-section-skeleton" />
  </>
);

const EMPTY_STATE = (
  <div style={{ gridColumn: 'span 2', padding: '20px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
    <FileText size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
    <p style={{ fontSize: 12 }}>Upload a document and run the AI Agent to populate fields</p>
  </div>
);

export default function RedemptionForm({ orchestrator }) {
  const { formData, workflowState, uploadedFile, updateFormField, showToast } =
    useWorkflowStore((s) => ({
      formData: s.formData,
      workflowState: s.workflowState,
      uploadedFile: s.uploadedFile,
      updateFormField: s.updateFormField,
      showToast: s.showToast,
    }));

  // Show skeleton only while actively extracting (file is uploaded & agent running)
  const isExtracting = workflowState === 'extracting';
  // Show empty placeholder when no file has been uploaded yet
  const noFile = !uploadedFile;
  // Show form sections when data exists (even during verifying/reviewing)
  const hasData = !!formData;

  const canSubmit = workflowState === 'reviewing';
  const isSubmitting = workflowState === 'submitting';
  const isSuccess = workflowState === 'success';

  const upd = (path) => (val) => updateFormField(path, val);

  // Section statuses — use data presence, not workflow state
  const sec1Status = !hasData ? 'pending' : getSectionStatus(formData, ['request_type', 'date']);
  const sec2Status = !hasData ? 'pending' : getSectionStatus(formData, ['account_code', 'first_account_holder_name', 'pan_card_no']);
  const sec3Status = !hasData ? 'pending' : 'filled';
  const sec4Status = !hasData ? 'pending' : getSectionStatus(formData, [
        'bank_details.bank_name',
        'bank_details.account_number',
        'bank_details.ifsc_code',
      ]);

  const isPartial = formData?.redemption_type?.partial_redemption === true;

  const handleSubmit = () => {
    if (orchestrator && canSubmit) {
      orchestrator.submitDocument();
    }
  };

  const handleSaveDraft = () => {
    showToast('💾', 'Draft saved locally');
  };

  return (
    <div className="center-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-left">
          <h2>PMS Redemption Request</h2>
          <p>Review and confirm extracted data before submission</p>
        </div>
        <div className="form-header-right">
          {workflowState === 'success' && (
            <span className="status-badge filled">✓ Submitted</span>
          )}
          {workflowState === 'failed' && (
            <span className="status-badge error">✗ Failed</span>
          )}
          {workflowState === 'reviewing' && (
            <span className="status-badge processing">Ready to Review</span>
          )}
        </div>
      </div>

      {/* Form body */}
      <div className="form-content">

        {isSuccess && (
          <div className="success-banner">
            <div style={{ color: 'var(--success)', flexShrink: 0 }}>✅</div>
            <div>
              <h3>Redemption Request Submitted Successfully</h3>
              <p>
                Account {formData?.account_code} — {formData?.first_account_holder_name}
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Document Information */}
        <FormSection
          title="Document Information"
          sectionNumber={1}
          status={isSubmitting ? 'processing' : sec1Status}
        >
          {noFile ? EMPTY_STATE : isExtracting ? (
            SKELETON
          ) : (
            <>
              <FormField
                label="Request Type"
                value={formData?.request_type}
                onChange={upd('request_type')}
                placeholder="e.g. Client Redemption"
              />
              <FormField
                label="Date"
                value={formData?.date}
                onChange={upd('date')}
                type="text"
                placeholder="DD/MM/YYYY"
              />
              <FormField
                label="RM Code"
                value={formData?.relationship_manager_code}
                onChange={upd('relationship_manager_code')}
                placeholder="Relationship Manager Code"
              />
              <FormField
                label="RM Name"
                value={formData?.relationship_manager_name}
                onChange={upd('relationship_manager_name')}
                placeholder="Relationship Manager Name"
              />
            </>
          )}
        </FormSection>

        {/* Section 2: Account & Client Details */}
        <FormSection
          title="Account & Client Details"
          sectionNumber={2}
          status={isSubmitting ? 'processing' : sec2Status}
        >
          {noFile ? EMPTY_STATE : isExtracting ? (
            SKELETON
          ) : (
            <>
              <FormField
                label="Account Code"
                value={formData?.account_code}
                onChange={upd('account_code')}
                required
                placeholder="e.g. NTD3368"
              />
              <FormField
                label="PAN Card No."
                value={formData?.pan_card_no}
                onChange={upd('pan_card_no')}
                required
                placeholder="e.g. AAAPM6916D"
              />
              <FormField
                label="Client Name"
                value={formData?.first_account_holder_name}
                onChange={upd('first_account_holder_name')}
                required
                placeholder="First Account Holder Name"
                fullWidth
              />
            </>
          )}
        </FormSection>

        {/* Section 3: Redemption Details */}
        <FormSection
          title="Redemption Details"
          sectionNumber={3}
          status={isSubmitting ? 'processing' : sec3Status}
        >
          {noFile ? EMPTY_STATE : isExtracting ? (
            SKELETON
          ) : (
            <>
              {/* Redemption Type */}
              <div className="field-group full-col">
                <label className="field-label">Redemption Type</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="full-redemption"
                      name="redemptionType"
                      checked={formData?.redemption_type?.full_redemption === true}
                      onChange={() => {
                        upd('redemption_type.full_redemption')(true);
                        upd('redemption_type.partial_redemption')(false);
                      }}
                    />
                    <label htmlFor="full-redemption">Full Redemption</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="partial-redemption"
                      name="redemptionType"
                      checked={formData?.redemption_type?.partial_redemption === true}
                      onChange={() => {
                        upd('redemption_type.partial_redemption')(true);
                        upd('redemption_type.full_redemption')(false);
                      }}
                    />
                    <label htmlFor="partial-redemption">Partial Redemption</label>
                  </div>
                </div>
              </div>

              {/* Partial amount fields — shown only if partial */}
              {isPartial && (
                <>
                  <FormField
                    label="Amount (Figures)"
                    value={formData?.redemption_amount?.amount_in_figures}
                    onChange={upd('redemption_amount.amount_in_figures')}
                    type="number"
                    required={isPartial}
                    placeholder="Enter amount"
                  />
                  <FormField
                    label="Amount (Words)"
                    value={formData?.redemption_amount?.amount_in_words}
                    onChange={upd('redemption_amount.amount_in_words')}
                    placeholder="e.g. Five Lakh Rupees"
                  />
                </>
              )}

              {/* Payout Option */}
              <div className="field-group full-col">
                <label className="field-label">Payout Option</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="fund-transfer"
                      name="payoutOption"
                      checked={formData?.redemption_payout_option?.fund_transfer === true}
                      onChange={() => {
                        upd('redemption_payout_option.fund_transfer')(true);
                        upd('redemption_payout_option.stock_transfer')(false);
                      }}
                    />
                    <label htmlFor="fund-transfer">Fund Transfer</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="stock-transfer"
                      name="payoutOption"
                      checked={formData?.redemption_payout_option?.stock_transfer === true}
                      onChange={() => {
                        upd('redemption_payout_option.stock_transfer')(true);
                        upd('redemption_payout_option.fund_transfer')(false);
                      }}
                    />
                    <label htmlFor="stock-transfer">Stock Transfer</label>
                  </div>
                </div>
              </div>
            </>
          )}
        </FormSection>

        {/* Section 4: Bank Details */}
        <FormSection
          title="Bank Details"
          sectionNumber={4}
          status={isSubmitting ? 'processing' : sec4Status}
        >
          {noFile ? EMPTY_STATE : isExtracting ? (
            SKELETON
          ) : (
            <>
              <FormField
                label="Bank Name"
                value={formData?.bank_details?.bank_name}
                onChange={upd('bank_details.bank_name')}
                placeholder="e.g. HDFC Bank"
              />
              <FormField
                label="Branch Name"
                value={formData?.bank_details?.branch_name}
                onChange={upd('bank_details.branch_name')}
                placeholder="e.g. Andheri West"
              />
              <FormField
                label="Account Number"
                value={formData?.bank_details?.account_number}
                onChange={upd('bank_details.account_number')}
                placeholder="Bank account number"
              />
              <FormField
                label="IFSC Code"
                value={formData?.bank_details?.ifsc_code}
                onChange={upd('bank_details.ifsc_code')}
                placeholder="e.g. HDFC0000001"
              />
              <FormField
                label="Account Type"
                value={formData?.bank_details?.account_type}
                onChange={upd('bank_details.account_type')}
                type="select"
                options={[
                  { value: 'Savings', label: 'Savings' },
                  { value: 'Current', label: 'Current' },
                  { value: 'NRE', label: 'NRE' },
                  { value: 'NRO', label: 'NRO' },
                ]}
              />
            </>
          )}
        </FormSection>

        {/* Spacer */}
        <div style={{ height: 8 }} />
      </div>

      {/* Footer */}
      <div className="form-footer">
        <div className="form-footer-info">
          {isIdle && 'Upload a document and run the AI agent to populate this form.'}
          {workflowState === 'extracting' && 'Extracting fields from document...'}
          {workflowState === 'verifying' && 'Running signature verification...'}
          {workflowState === 'reviewing' && 'Please review all fields before submitting.'}
          {workflowState === 'submitting' && 'Submitting request...'}
          {workflowState === 'success' && 'Request submitted successfully.'}
          {workflowState === 'failed' && 'Submission failed. Please review and retry.'}
        </div>
        <div className="form-footer-actions">
          <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={!formData}>
            <Download size={14} />
            Save Draft
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
