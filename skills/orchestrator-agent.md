# OrchestratorAgent

## Purpose
The `OrchestratorAgent` is the central coordinator for the PMS Redemption AI workflow. It sequences all sub-agents, manages state machine transitions, and integrates the AI summarizer for natural language chat responses.

## Location
`src/agents/OrchestratorAgent.js`

## Instantiation
Created once in `App.jsx` using `useRef`:
```javascript
const orchestratorRef = useRef(new OrchestratorAgent(useWorkflowStore));
```
The Zustand store is passed as the `store` parameter. Agents call `this.store.getState()` to access current state and actions.

## Sub-agents
| Agent | Purpose |
|---|---|
| `ExtractionAgent` | Extracts form fields from the uploaded document |
| `SignatureAgent` | Verifies signature and fetches original for comparison |
| `SubmitAgent` | Maps form to payload and submits to API |
| `EmailAgent` | Sends failure notification emails |

## Workflow State Machine

```
idle
  ↓ (user clicks "Run AI Agent")
extracting  →  failed (if extraction fails)
  ↓
verifying
  ↓
reviewing  →  submitting  →  success
                          ↘  failed  →  email modal opens
```

### processDocument()
1. Sets `workflowState` to `'extracting'`, `isProcessing` to `true`
2. Adds AI message: "Starting AI processing for {filename}..."
3. Calls `ExtractionAgent.execute()` — returns extracted data or `null`
4. If null → sends failure context to summarizer, exits
5. Adds system message with extracted key fields
6. Sets `workflowState` to `'verifying'`
7. Calls `SignatureAgent.execute(extractedData)`
8. Sets `workflowState` to `'reviewing'`, `isProcessing` to `false`
9. Sends completion summary to Summarizer API for chat guidance

### submitDocument()
1. Calls `SubmitAgent.execute()`
2. If success → sends congratulatory summary to Summarizer
3. If failure → sends failure context to Summarizer + auto-opens EmailModal

### reVerifySignature()
1. Adds AI message announcing re-verification
2. Calls `SignatureAgent.reVerify()`
3. Sends new result to Summarizer for chat guidance

### handleUserMessage(userText)
1. Sets `isTyping` to `true`
2. Builds context string from current workflow state, document, form data, and signature result
3. Appends `"User question: {userText}"` to context
4. Calls `sendToSummarizer(context)`
5. Sets `isTyping` to `false`

Note: `addMessage('user', userText)` is NOT called here — it was already called by `ChatInterface` before invoking this method.

### sendToSummarizer(input)
```
POST https://motilaloswal-dev.outsystems.app/PMSRedemptionSummmarizer/rest/Redemption/Red_DataSummarizer

{ "Input": "context string", "SessionId": "uuid" }
```
- Sets `isTyping` to `true` during the call
- Adds the response as an `ai` message in chat
- Handles text responses, JSON with `Output`/`output`/`message` fields, or falls back to `JSON.stringify`
- **Silently fails** — summarizer errors are swallowed to avoid disrupting the main workflow

## Context Building
The summarizer context includes:
- Current workflow state
- Document filename (if uploaded)
- Key form fields (account code, PAN, client name, redemption type)
- Signature verification result (match status and accuracy %)
- The user's question (for `handleUserMessage`)

This provides the AI with enough context to give relevant, specific answers without sending the full document binary.

## Error Philosophy
- Extraction failure → hard stop, user must retry
- Signature verification failure → soft warning, workflow continues to reviewing
- Summarizer failure → silent, never shown to user
- Submit failure → shown clearly, email modal auto-opened
- Email failure → shown in chat, modal stays open for retry
