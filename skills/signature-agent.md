# SignatureAgent

## Purpose
The `SignatureAgent` handles two parallel tasks:
1. **Verify** the signature on the uploaded document against the client's registered signature.
2. **Fetch** the original signature image for visual comparison in the UI.

Both calls are made simultaneously using `Promise.allSettled`, so failure of one does not block the other.

## Location
`src/agents/SignatureAgent.js`

## How It Works

### execute(formData)
Called after extraction is complete. Accepts the extracted `formData` as a parameter (not read from store, to avoid stale state).

#### Verification API
```
POST https://motilaloswal-dev.outsystems.app/PMSRedemptionSignatureVerify/rest/Redemption/Red_SignatureVerify

{
  "PMSCode": "account_code",
  "PAN": "pan_card_no",
  "document": "base64_of_uploaded_file"
}
```
Response:
```json
{ "Accuracy": 80, "IsMatch": true }
```

#### Original Signature API
```
POST https://monextdev.motilaloswal.com/PMSAPIService/rest/RedemptionAPI/GetOriginalSignature

{
  "PAN": "pan_card_no",
  "PMSCODE": "account_code"
}
```
Response:
```json
{ "FILENAME": "sig.jpg", "FILE": "base64binarystring" }
```

### Parallel Execution
```javascript
const [verifyResult, originalResult] = await Promise.allSettled([
  this.verifySignature(formData, uploadedFileBase64),
  this.fetchOriginalSignature(formData),
]);
```
Each result is checked independently. If one fails, the other still applies.

## Graceful Degradation
- If verification fails: an `error` message is added to chat; `sigVerification` remains `null`.
- If original signature fetch fails or returns empty `FILE`: a `system` message is shown in chat advising the user to re-verify after confirming PAN and account code. The `originalSignature` state remains `null` and the UI shows a graceful "Not found" error state.

## Re-verify Flow
`reVerify()` can be called any time the user wants to re-run verification (e.g., after editing PAN or account code):
1. Resets `sigVerification` and `originalSignature` to `null`
2. Sets `sigState` to `loading`
3. Re-calls `execute(formData)` with current store `formData`

## State Updates
- `sigState`: `'idle'` → `'loading'` → `'done'` (or stays `'loading'` on total failure)
- `sigVerification`: set if verify API succeeds
- `originalSignature`: set if original signature fetch returns a non-empty `FILE`
- Progress updated to 85% then 100%

## UI Integration
- `SignaturePanel.jsx` reads `sigState`, `sigVerification`, and `originalSignature` from store
- Renders a side-by-side comparison with accuracy bar
- Re-verify button is always available and calls `orchestrator.reVerifySignature()`
