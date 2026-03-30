import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Brain } from 'lucide-react';
import { clsx } from 'clsx';

const MessageBubble = ({ message, isUser, isThinkingStep }) => {
  if (isThinkingStep) {
    return (
      <div className="animate-fade-in animate-pulse-glow" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        marginBottom: '0.75rem',
        padding: '0.5rem 1rem',
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '12px',
        width: 'fit-content',
        border: '1px solid rgba(99, 102, 241, 0.1)'
      }}>
        <Brain size={16} color="var(--primary-color)" />
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)',
          fontWeight: 500,
          fontStyle: 'italic'
        }}>
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("animate-fade-in", isUser ? "user-msg" : "ai-msg")} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: '0.6rem',
      marginBottom: '2rem',
      maxWidth: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        color: isUser ? 'var(--text-muted)' : 'var(--primary-color)',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        paddingLeft: isUser ? '0' : '0.25rem',
        paddingRight: isUser ? '0.25rem' : '0'
      }}>
        {isUser ? (
          <><span>KHÁCH HÀNG</span><User size={14} /></>
        ) : (
          <><Bot size={14} /><span>AI ANALYST</span></>
        )}
      </div>
      
      <div className="glass-card" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: isUser ? '24px 4px 24px 24px' : '4px 24px 24px 24px',
        background: isUser ? 'rgba(99, 102, 241, 0.12)' : 'rgba(31, 41, 55, 0.6)',
        borderColor: isUser ? 'rgba(99, 102, 241, 0.3)' : 'var(--surface-border)',
        boxShadow: isUser ? '0 4px 20px rgba(99, 102, 241, 0.1)' : '0 10px 30px rgba(0,0,0,0.2)',
        maxWidth: '88%',
        width: 'fit-content',
        overflowX: 'auto',
        borderWidth: '1px'
      }}>
        <div className="prose" style={{ 
          fontSize: '1.05rem', 
          lineHeight: '1.7',
          color: isUser ? '#fff' : 'var(--text-primary)'
        }}>
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
