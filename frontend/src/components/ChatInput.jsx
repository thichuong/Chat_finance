import React, { useState } from 'react';
import { Send, Eraser } from 'lucide-react';

const ChatInput = ({ onSend, onClear, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      left: 'calc(var(--sidebar-width) + 2rem)',
      right: '2rem',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 20
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <button 
          type="button" 
          onClick={onClear}
          title="Xóa lịch sử"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Eraser size={20} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Đang xử lý..." : "Hỏi trợ lý về thị trường, cổ phiếu..."}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            padding: '4px 8px'
          }}
        />

        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          style={{
            background: 'var(--primary-color)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (input.trim() && !isLoading) ? 'pointer' : 'not-allowed',
            opacity: (input.trim() && !isLoading) ? 1 : 0.5,
            transition: 'var(--transition-smooth)'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
