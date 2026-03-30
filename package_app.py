import os
import subprocess
import sys
import shutil

def run_command(command, cwd=None):
    print(f"Running: {' '.join(command)}")
    result = subprocess.run(command, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(1)

def main():
    # 1. Frontend Build
    print("--- Building Frontend ---")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    run_command(["npm", "install"], cwd=frontend_dir)
    run_command(["npm", "run", "build"], cwd=frontend_dir)

    # 2. PyInstaller Packaging
    print("--- Packaging with PyInstaller ---")
    
    # Path to venv python/pip/pyinstaller
    venv_bin = os.path.join(os.getcwd(), ".venv", "bin")
    pyinstaller_exe = os.path.join(venv_bin, "pyinstaller")
    
    # Install dependencies in venv first
    run_command([os.path.join(venv_bin, "python"), "-m", "pip", "install", "pyinstaller", "-r", "requirements.txt"])

    # PyInstaller flags
    # --onefile: Create a single executable
    # --windowed: No console window on launch
    # --add-data: Include static files and backend folders
    # --icon: Set the executable icon
    
    # Note: On Linux, --add-data uses ':' as separator, on Windows it uses ';'
    data_sep = ":" if os.name != "nt" else ";"
    
    cmd = [
        pyinstaller_exe,
        "--onefile",
        "--windowed",
        "--name", "ChatFinance",
        f"--add-data=backend{data_sep}backend",
        f"--add-data=frontend/dist{data_sep}frontend/dist",
        f"--add-data=assets{data_sep}assets",
        f"--add-data=.env.example{data_sep}.",
        "--icon=assets/icon.png", # PyInstaller can often use PNG for Linux, but .ico is better for Win
        "launcher.py"
    ]

    run_command(cmd)

    print("\n--- Build Complete! ---")
    print("Your app is ready in the 'dist' folder.")

if __name__ == "__main__":
    main()
