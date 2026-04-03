import os
import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from backend.agent import get_graph_response
from backend.memory import clear_memory
from backend.tools.registry import TOOLS_MAP
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chat Finance API")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

@app.get("/api/market")
async def market_snapshot():
    """Returns a quick market snapshot for the frontend sidebar."""
    try:
        vn_indices_raw = TOOLS_MAP["get_vn_indices"].func()
        btc_price_raw = TOOLS_MAP["get_crypto_price"].func("BTC")
        gold_price_raw = TOOLS_MAP["get_gold_price"].func("")
        
        return {
            "status": "success",
            "data": {
                "vn_indices": vn_indices_raw,
                "btc": btc_price_raw,
                "gold": gold_price_raw,
                "timestamp": str(asyncio.get_event_loop().time())
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Streaming endpoint that yields JSON-formatted updates."""
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            thinking_prefixes = ["🔍", "🛠️", "✅", "❌", "💭", "🔄", "🌐", "📝", "📊", "⚠️"]
            
            for update in get_graph_response(request.message, session_id=request.session_id):
                is_thinking = any(update.startswith(prefix) for prefix in thinking_prefixes)
                
                payload = {
                    "type": "thinking" if is_thinking else "final",
                    "content": update
                }
                yield json.dumps(payload) + "\n"
                await asyncio.sleep(0.01)
                
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

@app.post("/api/clear")
async def clear_endpoint(request: ChatRequest):
    """Clears the conversation memory for a given session."""
    try:
        clear_memory(request.session_id)
        return {"status": "success", "message": f"Memory cleared for session: {request.session_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "agent": "Gemma 4 Finance AI (31B Dense)"}

# Serve frontend in development/production (now Vanilla JS)
# Handle PyInstaller _MEIPASS
import sys
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(__file__)

frontend_path = os.path.join(base_path, "frontend")
assets_path = os.path.join(base_path, "assets")

# Mount assets directory
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

if os.path.exists(frontend_path):
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow API calls to pass through
        if full_path.startswith("api/") or full_path.startswith("assets/"):
            raise HTTPException(status_code=404)
        
        # Check if requested path is a file in the frontend directory
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Default to index.html
        return FileResponse(os.path.join(frontend_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    # Use 127.0.0.1 for local launcher
    uvicorn.run(app, host="127.0.0.1", port=8000)

