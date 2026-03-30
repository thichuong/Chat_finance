import os
import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.agent import get_graph_response
from backend.memory import clear_memory
from backend.tools.registry import TOOLS_MAP
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chat Finance API")

# Enable CORS for React frontend (Vite default is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
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
        # Call tools logic directly through registry (ignoring LangChain wrapper)
        # Note: TOOLS_MAP[name].func is the actual python function for @tool
        vn_indices_raw = TOOLS_MAP["get_vn_indices"].func()
        btc_price_raw = TOOLS_MAP["get_crypto_price"].func("BTC")
        
        return {
            "status": "success",
            "data": {
                "vn_indices": vn_indices_raw,
                "btc": btc_price_raw,
                "timestamp": str(asyncio.get_event_loop().time()) # Placeholder for real time
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Streaming endpoint that yields JSON-formatted updates.
    Types: 
    - thinking: Intermediate reasoning steps
    - final: The final synthesized answer
    - error: Any exception occurred
    """
    
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # get_graph_response is a generator. We wrap it for async streaming.
            # In a real production app, you might use an async generator but here we iterate the synchronous one.
            # We use emojis to distinguish thinking vs final (as defined in app.py logic).
            
            thinking_prefixes = ["🔍", "🛠️", "✅", "❌", "💭", "🔄", "🌐", "📝", "📊", "⚠️"]
            
            for update in get_graph_response(request.message, session_id=request.session_id):
                is_thinking = any(update.startswith(prefix) for prefix in thinking_prefixes)
                
                payload = {
                    "type": "thinking" if is_thinking else "final",
                    "content": update
                }
                yield json.dumps(payload) + "\n"
                # Small sleep to prevent blocking if needed, though get_graph_response handles the network lag
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
    return {"status": "ok", "agent": "Gemma 3 Finance AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
