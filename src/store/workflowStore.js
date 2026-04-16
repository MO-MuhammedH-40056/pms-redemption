import { create } from 'zustand';
import { generateSessionId } from '../skills/sessionManager';

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined || current[keys[i]] === null) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

const useWorkflowStore = create((set, get) => ({
  // Session
  sessionId: generateSessionId(),

  // File
  uploadedFile: null,
  uploadedFileBase64: null,
  uploadedFileURL: null,

  // Workflow state machine
  // 'idle' | 'extracting' | 'verifying' | 'reviewing' | 'submitting' | 'success' | 'failed'
  workflowState: 'idle',
  isProcessing: false,
  progress: { percent: 0, step: '' },

  // Extracted & editable form data
  extractedData: null,
  formData: null,

  // Process token — increments on every new file so old async chains self-abort
  processToken: 0,

  // Signature
  sigVerification: null,      // { Accuracy, IsMatch }
  originalSignature: null,    // { FILENAME, FILE }
  sigOriginalState: 'idle',   // 'idle' | 'loading' | 'done' | 'error'
  sigOriginalError: null,     // error string when original fetch fails
  sigVerifyState: 'idle',     // 'idle' | 'loading' | 'done' | 'error'
  sigState: 'idle',           // overall: 'idle' | 'loading' | 'done' | 'error'

  // Chat
  messages: [],
  isTyping: false,

  // Email modal
  showEmailModal: false,
  emailDraft: {
    to: 'muhammed.ibrahim@motilaloswal.com',
    subject: '',
    body: '',
  },

  // File preview modal
  showFilePreview: false,

  // Toast queue
  toasts: [],

  // ACTIONS
  setFile: (file, base64, url) =>
    set((state) => ({
      uploadedFile: file,
      uploadedFileBase64: base64,
      uploadedFileURL: url,
      sessionId: generateSessionId(),
      processToken: state.processToken + 1,  // cancels any in-flight async chain
      extractedData: null,
      formData: null,
      sigVerification: null,
      originalSignature: null,
      sigState: 'idle',
      sigOriginalState: 'idle',
      sigOriginalError: null,
      sigVerifyState: 'idle',
      workflowState: 'idle',
      isProcessing: false,
      progress: { percent: 0, step: '' },
      messages: [],          // clear chat for fresh session
    })),

  clearFile: () =>
    set((state) => ({
      uploadedFile: null,
      uploadedFileBase64: null,
      uploadedFileURL: null,
      extractedData: null,
      formData: null,
      sigVerification: null,
      originalSignature: null,
      sigState: 'idle',
      sigOriginalState: 'idle',
      sigOriginalError: null,
      sigVerifyState: 'idle',
      workflowState: 'idle',
      isProcessing: false,
      progress: { percent: 0, step: '' },
      processToken: state.processToken + 1,
      sessionId: generateSessionId(),
      messages: [],
    })),

  setWorkflowState: (state) => set({ workflowState: state }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setProgress: (percent, step) => set({ progress: { percent, step } }),

  setExtractedData: (data) =>
    set({
      extractedData: data,
      formData: JSON.parse(JSON.stringify(data)),
    }),

  updateFormField: (path, value) =>
    set((state) => {
      if (!state.formData) return {};
      const newFormData = JSON.parse(JSON.stringify(state.formData));
      setNestedValue(newFormData, path, value);
      return { formData: newFormData };
    }),

  setSigVerification: (result) => set({ sigVerification: result }),
  setOriginalSignature: (sig) => set({ originalSignature: sig }),
  setSigState: (s) => set({ sigState: s }),
  setSigOriginalState: (s, err = null) => set({ sigOriginalState: s, sigOriginalError: err }),
  setSigVerifyState: (s) => set({ sigVerifyState: s }),

  addMessage: (type, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `${Date.now()}-${Math.random()}`,
          type, // 'ai' | 'user' | 'system' | 'error'
          text,
          timestamp: new Date(),
        },
      ],
    })),

  setTyping: (v) => set({ isTyping: v }),

  openEmailModal: (draft) => set({ showEmailModal: true, emailDraft: draft }),
  closeEmailModal: () => set({ showEmailModal: false }),
  updateEmailDraft: (field, value) =>
    set((state) => ({
      emailDraft: { ...state.emailDraft, [field]: value },
    })),

  setShowFilePreview: (v) => set({ showFilePreview: v }),

  showToast: (icon, message) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, icon, message }],
    }));
    setTimeout(
      () =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      4000
    );
  },
}));

export default useWorkflowStore;
