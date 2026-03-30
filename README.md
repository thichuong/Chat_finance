# Chat Finance 📈

**Chat Finance** is a premium, agentic financial dashboard powered by **Gemma 3**, **LangGraph**, and **FastAPI**. It features a modern, real-time web interface built with **React** to provide professional-grade financial analysis, data visualization, and autonomous market research.

---

## ✨ Key Features

- **💎 Premium Dashboard**: Modern "Finance Terminal" UI with glassmorphism, dark mode, and real-time market tickers.
- **💭 Real-time Thinking**: Experience the agent's reasoning process as it streams live "thoughts" during its ReAct loop.
- **🇻🇳 Vietnamese Market Data**: Real-time evaluation of VN-Index, VN30, and all major stocks via `vnstock`.
- **🪙 Crypto & Global Assets**: Live prices for Bitcoin (Binance) and US equities (yfinance).
- **🔎 Autonomous Web Research**: Integrated with **Tavily** for deep web searching and automatic scraping of relevant articles.
- **🧠 Intelligent Memory**: Remembers session context for complex, multi-turn financial inquiries.

---

## 🚀 Getting Started

### 1. Set up the Environment
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configuration
Copy `.env.example` to `.env` and provide your API keys:
```ini
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 3. Run the Application
You need to start both the backend API and the frontend dev server.

**Terminal 1: Backend**
```bash
python api.py
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```
Accessible at: [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Architecture

The system uses a **ReAct (Reason + Act)** logic loop wrapped in a streaming FastAPI backend. For a deep dive:

👉 **[Architecture.md](Architecture.md)**

---

## 🛠️ Tech Stack

- **Large Language Model**: [Gemma 3 27B IT](https://blog.google/technology/ai/google-gemma-3/)
- **Backend API**: FastAPI (Python)
- **Frontend**: React + Vite (Vanilla CSS)
- **Agent Orchestration**: LangGraph
- **Data APIs**: `yfinance`, `ccxt`, `vnstock`, `Tavily`

---

## 📜 License

This project is licensed under the MIT License.
