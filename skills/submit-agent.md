# SubmitAgent

## Purpose
The `SubmitAgent` maps the reviewed form data to the submission payload and sends it to the PMS Redemption submission API. It handles success/failure states and triggers email notification on failure.

## Location
`src/agents/SubmitAgent.js`

## How It Works

### Payload Mapping
Uses `mapToSubmitPayload` from `src/skills/formMapper.js`:

| Form Field | Submit Field | Transform |
|---|---|---|
| `formData.request_type` | `request_type` | Direct |
| `formData.pan_card_no` | `pan_no` | Direct |
| `formData.redemption_type.full_redemption` | `redemption_type` | `true` → `"Full"`, `false` → `"Partial"` |
| `formData.redemption_payout_option.fund_transfer` | `redemption_sub_type` | `true` → `"Fund Transfer"`, `false` → `"Stock Transfer"` |
| `formData.account_code` | `account_code` | Direct |
| `formData.redemption_amount.amount_in_figures` | `redemption_amount` | `parseFloat()` or `0` |
| `uploadedFile.name` | `FileName` | Direct |

### API Call
```
POST https://monextdev.motilaloswal.com/PMSAPIService/rest/RedemptionAPI/Red_Request
Content-Type: application/json

{
  "request_type": "...",
  "pan_no": "...",
  "redemption_type": "Full | Partial",
  "redemption_sub_type": "Fund Transfer | Stock Transfer",
  "account_code": "...",
  "redemption_amount": 0.0,
  "FileName": "..."
}
```

### Success Response
```json
{ "success": true, "message": "..." }
```
Workflow transitions to `'success'`.

### Failure Response
```json
{ "success": false, "message": "Error description" }
```
Workflow transitions to `'failed'`. Error message is surfaced in chat.

## Error Handling
- **CORS errors**: Human-readable message shown; workflow set to `failed`.
- **Network timeout**: Standard 30s timeout via `callApi`.
- **success field**: Handles both `true` (boolean) and `"true"` (string) as success.

## On Failure — Email Trigger
The `OrchestratorAgent` checks the return value:
- If `{ success: false, error: "..." }` is returned, it auto-opens the `EmailModal` with a pre-filled failure notification email body built by `buildEmailBody()`.

## State Updates
- `workflowState`: `'reviewing'` → `'submitting'` → `'success'` or `'failed'`
- `isProcessing`: `true` while submitting, `false` after response
- Chat messages added for submit start, success, and failure
- Toast notifications shown for both outcomes
