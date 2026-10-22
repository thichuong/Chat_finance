import React from 'react';
import { User, Sparkles, Brain } from 'lucide-react';
import { marked } from 'marked';

export interface ChatMessageItem {
  id: string;
  type: 'user' | 'ai' | 'thinking' | 'error';
  content: string;
}

interface MessageBubbleProps {
  message: ChatMessageItem;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.type === 'thinking') {
    return (
      <div className="thinking-step">
        <Brain style={{ width: 16, height: 16, color: 'var(--primary-color)' }} />
        <span>{message.content}</span>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="msg-wrapper ai">
        <div className="msg-label" style={{ color: 'var(--danger-color)' }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          <span>Lỗi hệ thống</span>
        </div>
        <div
          className="bubble prose"
          style={{ borderColor: 'var(--danger-color)', color: '#fca5a5' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.type === 'user';
  const htmlContent = isUser ? message.content : marked.parse(message.content);

  return (
    <div className={`msg-wrapper ${isUser ? 'user' : 'ai'}`}>
      <div className="msg-label">
        {isUser ? (
          <>
            <span>Khách hàng</span>
            <User style={{ width: 14 }} />
          </>
        ) : (
          <>
            <img
              src="/assets/chat-icon.svg"
              alt="AI"
              style={{ width: 16, height: 16 }}
              onError={(e) => {
                // fallback if svg fails
                e.currentTarget.style.display = 'none';
              }}
            />
            <Sparkles style={{ width: 14, height: 14, color: 'var(--primary-color)' }} />
            <span>AI Analyst (Gemma 4)</span>
          </>
        )}
      </div>
      <div
        className="bubble prose"
        dangerouslySetInnerHTML={isUser ? undefined : { __html: htmlContent as string }}
      >
        {isUser ? message.content : null}
      </div>
    </div>
  );
};

