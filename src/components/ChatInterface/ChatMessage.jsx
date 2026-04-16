import React from 'react';

function parseMarkdown(text) {
  // Replace **bold** with <strong>bold</strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function ChatMessage({ message }) {
  const { type, text, timestamp } = message;

  if (type === 'system') {
    return (
      <div className="chat-msg system">
        <div className="chat-msg-bubble">
          {parseMarkdown(text)}
        </div>
        <div className="chat-msg-time">{formatTime(timestamp)}</div>
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="chat-msg user">
        <div className="chat-msg-bubble">{parseMarkdown(text)}</div>
        <div className="chat-msg-time">{formatTime(timestamp)}</div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="chat-msg error">
        <div className="chat-msg-bubble">{parseMarkdown(text)}</div>
        <div className="chat-msg-time">{formatTime(timestamp)}</div>
      </div>
    );
  }

  // 'ai' type (default)
  return (
    <div className="chat-msg ai">
      <div className="chat-ai-avatar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L13.5 8.5H20L14.5 12.5L16.5 19L12 15.5L7.5 19L9.5 12.5L4 8.5H10.5L12 2Z"
            fill="white"
          />
        </svg>
      </div>
      <div className="chat-msg-bubble">
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {parseMarkdown(line)}
            {i < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      <div className="chat-msg-time">{formatTime(timestamp)}</div>
    </div>
  );
}
