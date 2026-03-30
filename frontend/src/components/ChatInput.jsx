import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser } from 'lucide-react';

const ChatInput = ({ onSend, onClear, isLoading }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 20,
      transition: 'var(--transition-smooth)'
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{
          width: '100%',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end',
          padding: '0.75rem 1rem',
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid',
          borderColor: isFocused ? 'var(--primary-color)' : 'var(--surface-border)',
          borderRadius: '16px',
          boxShadow: isFocused 
            ? '0 0 25px rgba(99, 102, 241, 0.25), var(--shadow-lg)' 
            : 'var(--shadow-lg)',
          transition: 'var(--transition-smooth)'
        }}
      >
        <button 
          type="button" 
          onClick={onClear}
          title="Xóa lịch sử"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Eraser size={20} />
        </button>

        <textarea
          ref={textareaRef}
          rows="1"
          value={input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Đang phân tích dữ liệu..." : "Hỏi trợ lý về thị trường, BTC, ETH hoặc cổ phiếu..."}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.05rem',
            fontWeight: 500,
            outline: 'none',
            padding: '10px 4px',
            resize: 'none',
            maxHeight: '200px',
            minHeight: '24px',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            overflowY: input.split('\n').length > 5 ? 'auto' : 'hidden'
          }}
        />

        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          style={{
            background: (input.trim() && !isLoading) ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'white',
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (input.trim() && !isLoading) ? 'pointer' : 'not-allowed',
            opacity: (input.trim() && !isLoading) ? 1 : 0.5,
            transition: 'var(--transition-smooth)',
            boxShadow: (input.trim() && !isLoading) ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
            marginBottom: '4px'
          }}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;

