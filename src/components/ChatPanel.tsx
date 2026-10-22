import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Plus, Settings, MessageSquare } from 'lucide-react';
import { MessageBubble, ChatMessageItem } from './MessageBubble';
import { runAgentGraph } from '../agent/graph';
import { clearMemory } from '../agent/memory';
import { getApiKey } from '../agent/llmClient';

interface ChatPanelProps {
  onOpenSettings: () => void;
  width?: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onOpenSettings,
  width,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(() => `session_${Math.random().toString(36).substring(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : input).trim();
    if (!textToSend || isLoading) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      onOpenSettings();
      return;
    }

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessageItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const generator = runAgentGraph(textToSend, sessionId);
      let finalReceived = false;

      for await (const update of generator) {
        if (update.type === 'thinking') {
          const thinkingMsg: ChatMessageItem = {
            id: `think_${Date.now()}_${Math.random()}`,
            type: 'thinking',
            content: update.content,
          };
          setMessages((prev) => [...prev, thinkingMsg]);
        } else if (update.type === 'final') {
          finalReceived = true;
          // Clear previous thinking steps for this query to keep response neat
          setMessages((prev) => {
            const nonThinking = prev.filter((m) => m.type !== 'thinking');
            return [
              ...nonThinking,
              {
                id: `ai_${Date.now()}`,
                type: 'ai',
                content: update.content,
              },
            ];
          });
        } else if (update.type === 'error') {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_${Date.now()}`,
              type: 'error',
              content: `❌ Lỗi: ${update.content}`,
            },
          ]);
        }
      }

      if (!finalReceived) {
        setIsLoading(false);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          type: 'error',
          content: `❌ Lỗi thực thi Agent: ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearMemory(sessionId);
    setMessages([]);
  };

  const handleNewChat = () => {
    const newId = `session_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newId);
    setMessages([]);
  };

  const hints = [
    'Phân tích xu hướng VN-INDEX?',
    'Giá BTC và triển vọng hôm nay?',
    'So sánh cổ phiếu FPT, VNM, HPG',
    'Nên tích sản vàng hay Bitcoin?',
  ];

  return (
    <main className="chat-panel" style={{ width: width ? `${width}px` : undefined }}>
      <header className="chat-header">
        <div className="brand">
          <div className="brand-icon">
            <img src="/assets/logo.svg" alt="Chat Finance Logo" />
          </div>
          <div>
            <h2>Cố vấn Tài chính AI</h2>
            <div className="status">
              <div className="dot" />
              <span>Gemma 4 (26B A4B IT) Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={onOpenSettings}
            className="icon-btn danger"
            title="Cài đặt API Key"
            style={{ width: 36, height: 36 }}
          >
            <Settings style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={handleNewChat} className="btn-primary" title="Tạo phiên chat mới">
            <Plus style={{ width: 14, height: 14 }} />
            <span>Chat Mới</span>
          </button>
        </div>
      </header>

      <section className="messages-container" id="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <img src="/assets/chat-icon.svg" className="welcome-icon" alt="Chat Icon" />
            <h3>Cần tư vấn đầu tư chuyên sâu?</h3>
            <p>
              Tôi là Agent tài chính chạy bằng model <strong>gemma-4-26b-a4b-it</strong>, có khả năng
              tự động tra cứu chỉ số VN-Index, chứng khoán VN/Mỹ, Crypto và tin tức Google thời gian thực.
            </p>
            <div className="hints">
              {hints.map((hint, idx) => (
                <button key={idx} className="hint-btn" onClick={() => handleSend(hint)}>
                  <MessageSquare style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </section>

      <div className="input-area">
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <button
            type="button"
            onClick={handleClear}
            title="Xóa lịch sử trò chuyện"
            className="icon-btn danger"
            disabled={isLoading || messages.length === 0}
          >
            <Eraser style={{ width: 16, height: 16 }} />
          </button>
          <textarea
            ref={textareaRef}
            id="chat-input"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Đang phân tích và gọi công cụ...' : 'Hỏi trợ lý về thị trường, BTC, ETH, cổ phiếu VN...'}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="icon-btn primary"
            disabled={isLoading || !input.trim()}
            title="Gửi tin nhắn"
          >
            <Send style={{ width: 16, height: 16 }} />
          </button>
        </form>
      </div>
    </main>
  );
};

