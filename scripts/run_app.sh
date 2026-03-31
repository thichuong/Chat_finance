#!/bin/bash
# Script to run both Backend and Frontend for Chat Finance

# Get the script's directory (parent of "scripts")
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

# Cleanup function to kill background backend on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Chat Finance..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT

# 2. Start Application
echo "🚀 Starting Chat Finance..."
source .venv/bin/activate
python api.py
