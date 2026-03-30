import React, { useState, useEffect, useRef } from 'react';
import MarketPanel from './components/MarketPanel';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import { Sparkles, MessageCircle, Plus } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Math.random().toString(36).substr(2, 9)}`);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { id: Date.now(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let aiResponseId = Date.now() + 1;
      let currentThinkingSteps = [];
      let finalContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'thinking') {
              currentThinkingSteps.push({
                id: `think_${Date.now()}_${Math.random()}`,
                text: data.content,
                isThinkingStep: true
              });
              
              setMessages(prev => {
                const otherMessages = prev.filter(m => !m.isThinkingStep);
                return [...otherMessages, ...currentThinkingSteps];
              });

            } else if (data.type === 'final') {
              finalContent = data.content;
              setMessages(prev => {
                const filtered = prev.filter(m => !m.isThinkingStep && m.id !== aiResponseId);
                return [...filtered, { id: aiResponseId, text: finalContent, isUser: false }];
              });
            } else if (data.type === 'error') {
              setMessages(prev => [...prev, { id: `err_${Date.now()}`, text: `❌ Lỗi: ${data.content}`, isUser: false }]);
            }
          } catch (e) {
            console.error('Error parsing stream line:', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, text: `❌ Lỗi kết nối: ${error.message}`, isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await fetch('http://localhost:8000/api/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "", session_id: sessionId }),
      });
      setMessages([]);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <div className="bg-mesh"></div>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        height: '100vh',
        width: '100vw'
      }}>
        {/* Left Column: Market Insights & TradingView */}
        <MarketPanel />

        {/* Right Column: Chat */}
        <main style={{ 
          flex: '1 1 500px', 
          maxWidth: '750px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          borderLeft: '1px solid var(--surface-border)',
          background: 'rgba(3, 7, 18, 0.4)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Header */}
          <header style={{ 
            padding: '1.25rem 1.5rem', 
            borderBottom: '1px solid var(--surface-border)',
            background: 'var(--surface-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: 'var(--primary-glow)', 
                padding: '0.4rem', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--primary-color)'
              }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                  Cố vấn Tài chính AI
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Gemma 3 Active</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleClear}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.8rem',
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                cursor: 'pointer',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.75rem',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-color)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.color = 'var(--primary-color)';
              }}
            >
              <Plus size={14} />
              Tạo Chat Mới
            </button>
          </header>

          {/* Messages */}
          <section style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem',
            paddingBottom: '8rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: 'var(--text-muted)' 
              }}>
                <MessageCircle size={50} style={{ opacity: 0.1, marginBottom: '1.25rem' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Cần tư vấn đầu tư?</h3>
                <p style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: '250px', marginBottom: '1.5rem' }}>
                  Hỏi tôi về xu hướng VN-Index, giá BTC hoặc phân tích mã cổ phiếu cụ thể.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {["Phân tích VN-INDEX?", "Giá BTC hôm nay?", "Mua vàng hay BTC?"].map(hint => (
                    <button 
                      key={hint}
                      onClick={() => handleSend(hint)}
                      className="glass-card" 
                      style={{ 
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem', 
                        fontWeight: 500,
                        cursor: 'pointer', 
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--surface-border)',
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {messages.map(msg => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg.text} 
                    isUser={msg.isUser} 
                    isThinkingStep={msg.isThinkingStep}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </section>

          {/* Input Area */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(to top, var(--bg-color) 40%, transparent)',
            zIndex: 10
          }}>
            <ChatInput onSend={handleSend} onClear={handleClear} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
