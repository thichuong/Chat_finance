# Chat Finance 📈

**Chat Finance** is a premium, agentic financial dashboard powered by **Gemma 3**, **LangGraph**, and **FastAPI**. It features a modern, real-time web interface built with **React** and is now available as a **standalone desktop application** for Windows and Linux.

![Chat Finance Icon](assets/icon.png)

---

## ✨ Key Features

- **🖥️ Desktop Native**: Packaged as a standalone executable with a custom icon.
- **⚙️ Easy Setup**: Built-in **Tkinter GUI** for configuring API keys (`GOOGLE_API_KEY`, `TAVILY_API_KEY`) on first launch.
- **💎 Premium Dashboard**: Modern "Finance Terminal" UI with glassmorphism, dark mode, and real-time market tickers.
- **💭 Real-time Thinking**: Experience the agent's reasoning process as it streams live "thoughts".
- **🇻🇳 Vietnamese Market Data**: Real-time evaluation of VN-Index, VN30, and all major stocks.
- **🔎 Autonomous Web Research**: Integrated with **Tavily** for deep web searching and automatic scraping.

---

## 🚀 Getting Started (Desktop App)

The easiest way to use Chat Finance is to run the packaged version.

### 1. Build the App
If you are a developer, you can build the standalone executable yourself:
```bash
# Run the automated build script
python package_app.py
```
This will compile the React frontend, bundle it with the FastAPI backend, and create a single binary in the `dist/` folder.

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

To run the application for development, use the following scripts in the `scripts/` directory:

- **Run Full App** (Backend + Frontend):
  ```bash
  bash scripts/run_app.sh
  ```
- **Run Backend Only** (FastAPI):
  ```bash
  bash scripts/run_backend.sh
  ```
- **Run Frontend Only** (React/Vite):
  ```bash
  bash scripts/run_frontend.sh
  ```

---

## 🏗️ Architecture

The system uses a **ReAct (Reason + Act)** logic loop wrapped in a streaming FastAPI backend, bundled into a desktop environment.

👉 **[Architecture.md](Architecture.md)**

---

## 🛠️ Tech Stack

- **Large Language Model**: [Gemma 3 27B IT](https://blog.google/technology/ai/google-gemma-3/)
- **Backend API**: FastAPI (Serving both API and React static files)
- **Frontend**: React + Vite (Vanilla CSS)
- **Packaging**: PyInstaller
- **GUI Config**: Tkinter
- **Agent Orchestration**: LangGraph

---

## 📜 License

This project is licensed under the MIT License.

