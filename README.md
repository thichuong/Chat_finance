# Chat Finance 📈

A sophisticated agentic financial chatbot built with Python and AI. This system leverages advanced tools and AI models to provide real-time financial data, market analysis, and portfolio management assistance.

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd Chat_finance
   ```

2. **Set up the environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your API keys (Gemini, Financial Data Providers, etc.).

4. **Run the application:**
   ```bash
   python app.py
   ```

## 🧠 Architecture

The project consists of:
- `backend/`: Core logic for agentic workflows and tool integration.
- `app.py`: Main entry point for the user interface.
- `.agents/`: Configuration and specialized skills for the AI agent.

## 🛠️ Features

- **Real-time Stock Data**: Fetch current prices and historical information.
- **Financial Tooling**: Integration with various financial APIs.
- **Agentic Workflows**: Multi-step decision making for complex financial queries.

## 📜 License

This project is licensed under the MIT License.
