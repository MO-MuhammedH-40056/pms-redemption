# ExtractionAgent

## Purpose
The `ExtractionAgent` is responsible for sending the uploaded document to the PMS Redemption Data Extraction API and receiving structured form data in return. It is the first step in the AI processing pipeline.

## Location
`src/agents/ExtractionAgent.js`

## How It Works

### Input
The agent reads from the Zustand store:
- `sessionId` — a UUID generated per document upload session
- `uploadedFile` — the File object (used for the filename)
- `uploadedFileBase64` — base64-encoded binary of the file (without the data URI prefix)

### API Call
```
POST https://motilaloswal-dev.outsystems.app/PMSRedemptionDataExtraction/rest/Redemption/Red_DataExtraction
Content-Type: application/json

{
  "UserInput": "",
  "SessionId": "uuid-v4",
  "FileBinary": "base64string",
  "FileName": "filename.pdf"
}
```

### Output
A structured JSON object matching the PMS redemption form schema:
```json
{
  "request_type": "Client Redemption",
  "relationship_manager_code": null,
  "relationship_manager_name": null,
  "date": "09/03/2026",
  "account_code": "NTD3368",
  "first_account_holder_name": "Subhod M",
  "pan_card_no": "AAAPM6916D",
  "redemption_type": { "partial_redemption": false, "full_redemption": true },
  "redemption_amount": { "amount_in_figures": null, "amount_in_words": null },
  "redemption_payout_option": { "fund_transfer": true, "stock_transfer": false },
  "bank_details": { "bank_name": null, "branch_name": null, "account_number": null, "ifsc_code": null, "account_type": null }
}
```

## Progress Steps
- 10% — Agent initialized (set by Orchestrator)
- 20% — Document sent to API
- 60% — Fields parsed from response
- 80% — Form populated in store

## Error Handling
- **CORS errors**: Detected by checking for `Failed to fetch` / `CORS` in the error message. A human-readable message is shown in chat and the workflow transitions to `failed`.
- **Invalid response**: If the API returns a non-object or empty response, an error is thrown.
- **Timeout (30s)**: The `callApi` utility aborts the request after 30 seconds.
- On failure: adds an `error` message to chat, calls `setWorkflowState('failed')`, and returns `null` to the Orchestrator.

## Side Effects
- Calls `store.setExtractedData(result)` — deep-clones the result into both `extractedData` and `formData`
- Calls `store.showToast` with success/failure notification
- Calls `store.setProgress` at each stage
- Calls `store.addMessage` for system/error chat messages
