import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import { Sparkles, MessageCircle } from 'lucide-react';

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
    // Add user message
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
              // Add to thinking steps list
              currentThinkingSteps.push({
                id: `think_${Date.now()}_${Math.random()}`,
                text: data.content,
                isThinkingStep: true
              });
              
              setMessages(prev => {
                // Filter out any previous thinking steps for this specific turn
                const otherMessages = prev.filter(m => !m.isThinkingStep);
                return [...otherMessages, ...currentThinkingSteps];
              });

            } else if (data.type === 'final') {
              finalContent = data.content;
              // Replace thinking steps with final response
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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="bg-mesh"></div>
      <Sidebar />
      
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)', 
        padding: '2rem',
        paddingBottom: '8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <header style={{ 
          width: '100%', 
          maxWidth: '900px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '4rem',
          marginTop: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ 
                background: 'var(--primary-glow)', 
                padding: '0.5rem', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--primary-color)'
              }}>
                <Sparkles size={24} color="white" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                Cố vấn Tài chính AI
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
              Phân tích xu hướng • Dữ liệu thời gian thực • Gemma 3 Powered
            </p>
          </div>
        </header>

        <section style={{ width: '100%', maxWidth: '900px', flex: 1 }}>
          {messages.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '50vh',
              color: 'var(--text-muted)' 
            }}>
              <MessageCircle size={80} style={{ opacity: 0.1, marginBottom: '2rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Bạn cần hỗ trợ gì hôm nay?</h3>
              <p style={{ fontSize: '1rem', maxWidth: '400px', textAlign: 'center', marginBottom: '2.5rem' }}>
                Hỏi tôi về bất kỳ mã cổ phiếu nào, xu hướng thị trường crypto hoặc phân tích kỹ thuật.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {["Giá Bitcoin hiện tại?", "Phân tích VN-INDEX?", "Cổ phiếu FPT thế nào?", "So sánh BTC và ETH"].map(hint => (
                  <button 
                    key={hint}
                    onClick={() => handleSend(hint)}
                    className="glass-card" 
                    style={{ 
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.9rem', 
                      fontWeight: 500,
                      cursor: 'pointer', 
                      color: '#ffffff', // Set text color to white
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

        <ChatInput onSend={handleSend} onClear={handleClear} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
