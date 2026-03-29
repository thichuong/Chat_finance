# Chat Finance 📈

**Chat Finance** is an advanced agentic financial chatbot built with **Python**, **LangGraph**, and **Gemma 3**. It acts as an autonomous financial analyst, capable of fetching real-time data, performing multi-step reasoning, and synthesizing professional-grade financial reports.

---

## ✨ Key Features

- **🇻🇳 Vietnamese Market Data**: Real-time prices for HOSE, HNX, and UPCOM, plus major indices like VN-Index and VN30.
- **🌍 Global Equity Data**: Fetching current prices and market info for US stocks (NYSE, NASDAQ).
- **🪙 Crypto Analysis**: Real-time cryptocurrency prices and 24h trends via Binance (CCXT).
- **🔎 Autonomous Web Search**: Integrated with **Tavily** for the latest financial news and articles.
- **🌐 Smart Auto-Scraping**: Automatically reads and summarizes content from relevant web search results to provide deep context.
- **💭 Real-time Thinking**: Displays the agent's internal reasoning process (ReAct loop) as it works.
- **🧠 Conversation Memory**: Remembers past interactions within a session for seamless follow-up questions.

---

## 🏗️ Architecture

The system uses a **ReAct (Reason + Act)** loop powered by **LangGraph**. For a deep dive into how it works, check out:

👉 **[Architecture.md](Architecture.md)**

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone [repository-url]
cd Chat_finance
```

### 2. Set up the environment
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and provide your API keys:

```ini
# Core LLM
GOOGLE_API_KEY=your_gemini_api_key

# Tools
TAVILY_API_KEY=your_tavily_api_key
```

### 4. Run the Application
The backend can be started directly:
```bash
python app.py
```

---

## 🛠️ Tech Stack

- **Large Language Model**: [Gemma 3 27B IT](https://blog.google/technology/ai/google-gemma-3/)
- **Agent Orchestration**: [LangGraph](https://www.langchain.com/langgraph)
- **Financial APIs**: `yfinance`, `ccxt`, `vnstock`
- **Search & Scraping**: `Tavily`, `BeautifulSoup4`, `Markdownify`

---

## 📜 License

This project is licensed under the MIT License.
