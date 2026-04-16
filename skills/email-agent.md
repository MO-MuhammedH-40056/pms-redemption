# EmailAgent

## Purpose
The `EmailAgent` sends an email notification via the PMS Send Email API. It is typically invoked after a submission failure to notify the operations team.

## Location
`src/agents/EmailAgent.js`

## How It Works

### API Call
```
POST https://monextdev.motilaloswal.com/PMSAPIService/rest/SendEmail/REST_API_SendEmail
Content-Type: application/json

{
  "MailBody": "...",
  "To": "recipient@example.com",
  "Subject": "PMS Redemption - ..."
}
```
Any HTTP 200 response is treated as success.

### execute()
Reads the current `emailDraft` from the Zustand store, which may have been edited by the user in the `EmailModal`.

## Email Composition Flow

### buildEmailBody(error, formData) — `src/skills/formMapper.js`
Generates a structured email body containing:
- Error description
- Client details (Account Code, PAN, Name, Request Type, Redemption Type)
- Standard sign-off from "PMS Operations Team"

### Pre-filled Modal
When submission fails, the `OrchestratorAgent` calls `store.openEmailModal({ to, subject, body })` which:
1. Sets `emailDraft.to` to `DEFAULT_EMAIL` (`muhammed.ibrahim@motilaloswal.com`)
2. Sets `emailDraft.subject` to `"PMS Redemption - Submission Failed - {account_code}"`
3. Sets `emailDraft.body` to the output of `buildEmailBody(error, formData)`

### User Editing
The `EmailModal` allows the user to edit all three fields (`to`, `subject`, `body`) before sending. Changes update `store.emailDraft` in real-time via `updateEmailDraft`.

## After Send
- `closeEmailModal()` is called to dismiss the modal
- A `system` message is added to chat confirming the email was sent to the recipient
- A success toast is shown

## Error Handling
- If the API call fails, an `error` message is added to chat
- The modal stays open so the user can retry
- A failure toast is shown
