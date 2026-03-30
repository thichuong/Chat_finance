import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Brain } from 'lucide-react';
import { clsx } from 'clsx';

const MessageBubble = ({ message, isUser, isThinkingStep }) => {
  if (isThinkingStep) {
    return (
      <div className="animate-fade-in" style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: '0.5rem',
        opacity: 0.8,
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '1.25rem',
          height: '1.25rem',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Brain size={12} color="var(--primary-color)" />
        </div>
        <div style={{ fontStyle: 'italic' }}>{message}</div>
      </div>
    );
  }

  return (
    <div className={clsx("animate-fade-in", isUser ? "user-msg" : "ai-msg")} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      maxWidth: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        {isUser ? (
          <><span>BẠN</span><User size={14} /></>
        ) : (
          <><Bot size={14} /><span>TRỢ LÝ TÀI CHÍNH</span></>
        )}
      </div>
      
      <div className="glass-card" style={{
        padding: '1rem 1.25rem',
        borderRadius: isUser ? 'var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg)' : 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
        background: isUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.4)',
        borderColor: isUser ? 'rgba(59, 130, 246, 0.3)' : 'var(--surface-border)',
        maxWidth: '85%',
        overflowX: 'auto'
      }}>
        <div className="prose">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
