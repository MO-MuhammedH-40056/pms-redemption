import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import ChatMessage from './ChatMessage';

const HINTS = {
  idle: ['What is this tool for?', 'How does extraction work?', 'Supported formats?'],
  extracting: ['How long does extraction take?', 'What data is extracted?'],
  verifying: ['How is signature verified?', 'What is accuracy threshold?'],
  reviewing: ['Explain extracted data', 'Signature verification result', 'Ready to submit?'],
  submitting: ['What happens after submit?'],
  success: ['What happens next?', 'Can I process another?'],
  failed: ['Why did it fail?', 'Send failure email', 'Retry submission'],
};

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="chat-ai-avatar" style={{ width: 24, height: 24 }}>
        <Loader2 size={12} className="spin" style={{ color: 'white' }} />
      </div>
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

export default function ChatInterface({ orchestrator }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isTyping, workflowState } = useWorkflowStore((s) => ({
    messages: s.messages,
    isTyping: s.isTyping,
    workflowState: s.workflowState,
  }));

  const hints = HINTS[workflowState] || HINTS.idle;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    setInputValue('');
    orchestrator?.handleUserMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleHintClick = (hint) => {
    if (isTyping) return;
    orchestrator?.handleUserMessage(hint);
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <MessageSquare size={15} style={{ color: 'var(--blue)' }} />
          AI Assistant
          <div className="chat-ai-dot" />
        </div>
        <div className="chat-header-subtitle">
          Ask questions about the document or workflow
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <MessageSquare size={22} />
            </div>
            <h3>PMS Redemption AI</h3>
            <p>
              Upload a redemption document and click <strong>Run AI Agent</strong> to
              start. I'll guide you through the entire process.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {hints.length > 0 && (
          <div className="chat-hints">
            {hints.map((hint) => (
              <button
                key={hint}
                className="chat-hint-chip"
                onClick={() => handleHintClick(hint)}
                disabled={isTyping}
              >
                {hint}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything about the document..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isTyping}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            title="Send message"
          >
            {isTyping ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
