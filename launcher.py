import os
import sys
import time
import webbrowser
import threading
import tkinter as tk
from tkinter import messagebox, ttk
from dotenv import load_dotenv, set_key
import uvicorn
from api import app as fastapi_app

# Configuration
ENV_FILE = ".env"
APP_URL = "http://127.0.0.1:8000"
WINDOW_TITLE = "Chat Finance Setup"

def load_env_vars():
    load_dotenv(ENV_FILE)
    return {
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY", ""),
        "TAVILY_API_KEY": os.getenv("TAVILY_API_KEY", "")
    }

def save_env_vars(google_key, tavily_key):
    # Ensure file exists
    if not os.path.exists(ENV_FILE):
        # Create from example if it exists
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ENV_FILE)
        else:
            with open(ENV_FILE, "w") as f:
                f.write("GOOGLE_API_KEY=\nTAVILY_API_KEY=\n")
    
    set_key(ENV_FILE, "GOOGLE_API_KEY", google_key)
    set_key(ENV_FILE, "TAVILY_API_KEY", tavily_key)

class SetupGUI:
    def __init__(self, root, on_submit):
        self.root = root
        self.on_submit = on_submit
        self.root.title(WINDOW_TITLE)
        self.root.geometry("450x350")
        self.root.resizable(False, False)
        
        # Style
        self.style = ttk.Style()
        self.style.configure("TLabel", font=("Arial", 10))
        self.style.configure("TButton", font=("Arial", 10, "bold"))
        
        # Icon
        try:
            icon_path = os.path.join(os.path.dirname(__file__), "assets", "icon.png")
            if os.path.exists(icon_path):
                img = tk.PhotoImage(file=icon_path)
                self.root.iconphoto(True, img)
        except Exception:
            pass

        # Content
        main_frame = ttk.Frame(root, padding="30")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Chat Finance Configuration", font=("Arial", 16, "bold")).pack(pady=(0, 20))
        
        ttk.Label(main_frame, text="Google API Key (for LLM):").pack(anchor=tk.W)
        self.google_entry = ttk.Entry(main_frame, width=50)
        self.google_entry.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(main_frame, text="Tavily API Key (for Web Search):").pack(anchor=tk.W)
        self.tavily_entry = ttk.Entry(main_frame, width=50)
        self.tavily_entry.pack(fill=tk.X, pady=(0, 25))
        
        # Load existing
        current = load_env_vars()
        self.google_entry.insert(0, current["GOOGLE_API_KEY"])
        self.tavily_entry.insert(0, current["TAVILY_API_KEY"])

        self.submit_btn = ttk.Button(main_frame, text="Save & Launch", command=self.handle_submit)
        self.submit_btn.pack(pady=10)
        
        ttk.Label(main_frame, text="© 2026 Chat Finance AI", font=("Arial", 8), foreground="gray").pack(side=tk.BOTTOM)

    def handle_submit(self):
        google_key = self.google_entry.get().strip()
        tavily_key = self.tavily_entry.get().strip()
        
        if not google_key or not tavily_key:
            messagebox.showwarning("Missing Keys", "Please provide both API keys to continue.")
            return
            
        save_env_vars(google_key, tavily_key)
        self.on_submit()
        self.root.destroy()

def run_backend_server():
    """Run the FastAPI server using uvicorn."""
    config = uvicorn.Config(fastapi_app, host="127.0.0.1", port=8000, log_level="info")
    server = uvicorn.Server(config)
    server.run()

def open_app_in_browser():
    """Wait for server to be ready and then open the browser."""
    # Simple retry to check if port 8000 is open
    import socket
    ready = False
    for i in range(10):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', 8000)) == 0:
                ready = True
                break
        time.sleep(1)
    
    if ready:
        webbrowser.open(APP_URL)
    else:
        print("Backend server failed to start.")

def main():
    keys = load_env_vars()
    
    # If keys are missing (or contain placeholder), show GUI
    google_missing = not keys["GOOGLE_API_KEY"] or "your_" in keys["GOOGLE_API_KEY"]
    tavily_missing = not keys["TAVILY_API_KEY"] or "your_" in keys["TAVILY_API_KEY"]
    
    if google_missing or tavily_missing:
        root = tk.Tk()
        # Set theme-like colors
        root.configure(bg="#f0f0f0")
        SetupGUI(root, on_submit=start_app)
        # Center the window
        root.eval('tk::PlaceWindow . center')
        root.mainloop()
    else:
        start_app()

def start_app():
    """Start the orchestration."""
    # Run backend in a background thread
    server_thread = threading.Thread(target=run_backend_server, daemon=True)
    server_thread.start()
    
    # Open browser once ready
    browser_thread = threading.Thread(target=open_app_in_browser, daemon=True)
    browser_thread.start()
    
    # Block the main process to keep threads alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down Chat Finance...")

if __name__ == "__main__":
    main()

