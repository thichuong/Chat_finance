// Configuration
const API_BASE = 'http://localhost:8000/api';
let sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
let isLoading = false;

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const marketCardsContainer = document.getElementById('market-cards');

// Initialize Lucide Icons
function initIcons() {
    lucide.createIcons();
}

/**
 * Market Panel Logic
 */
async function fetchMarketData() {
    try {
        const response = await fetch(`${API_BASE}/market`);
        const result = await response.json();
        
        if (result.status === 'success') {
            renderMarketCards(result.data);
        }
    } catch (err) {
        console.error('Failed to fetch market data:', err);
    }
}

function renderMarketCards(data) {
    const cards = [
        {
            label: 'VN-INDEX',
            icon: 'trending-up',
            color: 'var(--accent-blue)',
            value: data.vn_indices?.split('|')[0]?.split(':', 2)[1]?.split('(')[0]?.trim() || '---',
            change: data.vn_indices?.split('|')[0]?.includes('(') ? data.vn_indices.split('|')[0].split('(')[1].split(')')[0] : '0.00%'
        },
        {
            label: 'Bitcoin',
            icon: 'bitcoin',
            color: '#f7931a',
            value: data.btc?.split(':')[1]?.split('(')[0]?.trim() || '---',
            change: data.btc?.includes('(') ? data.btc.split('(')[1].split(')')[0] : '0.00%'
        },
        {
            label: 'Gold (Global)',
            icon: 'coins',
            color: '#ffd700',
            value: data.gold?.split(':')[1]?.split('(')[0]?.trim() || '---',
            change: data.gold?.includes('(') ? data.gold.split('(')[1].split(')')[0] : '0.00%'
        }
    ];

    marketCardsContainer.innerHTML = cards.map(card => {
        const isPositive = card.change.includes('+') || card.change.includes('(+');
        const changeColor = isPositive ? 'var(--success-color)' : 'var(--danger-color)';
        
        return `
            <div class="glass-card">
                <div class="market-card-header">
                    <div class="market-card-label">
                        <i data-lucide="${card.icon}" style="color: ${card.color}; width: 16px; height: 16px;"></i>
                        <span>${card.label}</span>
                    </div>
                </div>
                <span class="market-card-value">${card.value}</span>
                <span class="market-card-change" style="color: ${changeColor}">${card.change}</span>
            </div>
        `;
    }).join('');
    
    initIcons();
}

/**
 * TradingView Logic
 */
function initTradingView(symbol = 'BITSTAMP:BTCUSD') {
    if (typeof TradingView !== 'undefined') {
        new window.TradingView.widget({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_chart",
            "width": "100%",
            "height": "100%",
            "backgroundColor": "rgba(3, 7, 18, 0.5)",
            "gridColor": "rgba(255, 255, 255, 0.05)",
        });
    }
}

/**
 * Chat Logic
 */
function appendMessage(text, isUser = false, isThinking = false) {
    // Remove welcome screen if it exists
    const welcome = chatMessages.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    const wrapper = document.createElement('div');
    wrapper.className = isThinking ? 'thinking-step' : `msg-wrapper ${isUser ? 'user' : 'ai'}`;
    
    if (isThinking) {
        wrapper.innerHTML = `
            <i data-lucide="brain" style="width: 16px; height: 16px; color: var(--primary-color)"></i>
            <span>${text}</span>
        `;
    } else {
        const content = isUser ? text : marked.parse(text);
        wrapper.innerHTML = `
            <div class="msg-label">
                ${isUser ? '<span>Khách hàng</span><i data-lucide="user" style="width: 14px;"></i>' : '<i data-lucide="bot" style="width: 14px;"></i><span>AI Analyst</span>'}
            </div>
            <div class="bubble prose">${content}</div>
        `;
    }

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    initIcons();
    return wrapper;
}

async function handleSendMessage(e) {
    if (e) e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || isLoading) return;

    // UI state
    chatInput.value = '';
    chatInput.style.height = 'auto';
    setLoadingState(true);
    
    // Add user message
    appendMessage(text, true);

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, session_id: sessionId }),
        });

        if (!response.ok) throw new Error('Network error');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let aiMessageWrapper = null;
        let aiFullText = "";
        let thinkingSteps = [];

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === 'thinking') {
                        appendMessage(data.content, false, true);
                    } else if (data.type === 'final') {
                        // Remove thinking steps before showing final
                        const existingThinking = chatMessages.querySelectorAll('.thinking-step');
                        existingThinking.forEach(el => el.remove());

                        aiFullText = data.content;
                        if (!aiMessageWrapper) {
                            aiMessageWrapper = appendMessage(aiFullText, false);
                        } else {
                            aiMessageWrapper.querySelector('.bubble').innerHTML = marked.parse(aiFullText);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing stream:', e);
                }
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        appendMessage(`❌ Lỗi: ${error.message}`, false);
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    isLoading = loading;
    chatInput.disabled = loading;
    sendBtn.disabled = loading || !chatInput.value.trim();
    chatInput.placeholder = loading ? "Đang phân tích dữ liệu..." : "Hỏi trợ lý về thị trường, BTC, ETH hoặc cổ phiếu...";
}

async function clearChat() {
    try {
        await fetch(`${API_BASE}/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "", session_id: sessionId }),
        });
        chatMessages.innerHTML = '';
        renderWelcomeScreen();
    } catch (err) {
        console.error('Clear failed:', err);
    }
}

function renderWelcomeScreen() {
    chatMessages.innerHTML = `
        <div class="welcome-screen">
            <i data-lucide="message-circle" class="welcome-icon"></i>
            <h3>Cần tư vấn đầu tư?</h3>
            <p>Hỏi tôi về xu hướng VN-Index, giá BTC hoặc phân tích mã cổ phiếu cụ thể.</p>
            <div class="hints">
                <button class="hint-btn">Phân tích VN-INDEX?</button>
                <button class="hint-btn">Giá BTC hôm nay?</button>
                <button class="hint-btn">Mua vàng hay BTC?</button>
            </div>
        </div>
    `;
    
    // Re-attach listeners to hints
    document.querySelectorAll('.hint-btn').forEach(btn => {
        btn.onclick = () => {
            chatInput.value = btn.innerText;
            handleSendMessage();
        };
    });
    
    initIcons();
}

/**
 * Event Listeners & Bootstrapping
 */

// Auto-resize textarea
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
    sendBtn.disabled = !chatInput.value.trim() || isLoading;
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

chatForm.addEventListener('submit', handleSendMessage);
clearBtn.addEventListener('click', clearChat);
newChatBtn.addEventListener('click', () => {
    sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
    clearChat();
});

// Initialization
window.onload = () => {
    initIcons();
    fetchMarketData();
    initTradingView();
    renderWelcomeScreen();
    
    // Refresh market data every minute
    setInterval(fetchMarketData, 60000);
};
