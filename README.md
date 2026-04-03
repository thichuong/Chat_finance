# Chat Finance 📈

**Chat Finance** is a premium, agentic financial dashboard powered by **Gemma 4 (31B Dense)**, **LangGraph**, and **FastAPI**. It features a modern, real-time web interface built with **Vanilla JS** and features **Native Google Search Grounding** for top-tier market research.

![Chat Finance Icon](assets/icon.png)

---

## ✨ Key Features

- **🖥️ Desktop Native**: Packaged as a standalone executable with a custom icon.
- **⚙️ Setup**: Built-in **Tkinter GUI** for configuring `GOOGLE_API_KEY` on first launch. (Tavily is no longer required).
- **💎 Premium Dashboard**: Modern "Finance Terminal" UI with glassmorphism, dark mode, and real-time market tickers.
- **💭 Real-time Thinking**: Experience the agent's (Gemma 4) reasoning process as it streams live "thoughts".
- **🇻🇳 Vietnamese Market Data**: Real-time evaluation of VN-Index, VN30, and all major stocks.
- **🔎 Native Google Search**: Integrated with **Native Google Grounding** for lightning-fast web research and precise cited sources.
- **⚡ No External Dependencies**: Built with pure HTML/CSS/JS—no Node.js or npm required for the frontend.

---

## 🚀 Getting Started (Desktop App)

The easiest way to use Chat Finance is to run the packaged version.

### 1. Build the App
If you are a developer, you can build the standalone executable yourself:
```bash
# Run the automated build script
python package_app.py
```
This will bundle the FastAPI backend and the Vanilla JS frontend into a single binary in the `dist/` folder.

### 2. Installation
- **Linux**: Run `bash scripts/install_linux.sh` to create a desktop shortcut.
- **Windows**: Run `scripts/install_windows.bat` to create a shortcut on your Desktop.

---

## 💻 Developer Setup (Manual Run)

### 1. Set up the Environment
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Running

To run the application for development, use the following scripts:

- **Run Full App** (Backend + Frontend):
  ```bash
  bash scripts/run_app.sh
  ```

---

## 🏗️ Architecture

The system uses a **ReAct (Reason + Act)** logic loop powered by Gemma 4, wrapped in a streaming FastAPI backend.

👉 **[Architecture.md](Architecture.md)**

---

## 🛠️ Tech Stack

- **Large Language Model**: [Gemma 4 31B Dense](https://blog.google/technology/ai/google-gemma-4/)
- **Backend API**: FastAPI (Serving both API and static assets)
- **Frontend**: Vanilla JS (HTML5, CSS3, ES6+)
- **Packaging**: PyInstaller
- **GUI Config**: Tkinter
- **Agent Orchestration**: LangGraph
- **Search Logic**: Google Search Grounding (Native)

---

## 📜 License

This project is licensed under the MIT License.

