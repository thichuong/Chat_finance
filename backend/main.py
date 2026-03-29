from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from backend.agent import get_agent_response

app = FastAPI(title="Finance Chatbot API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@app.get("/")
async def root():
    return {"status": "ok", "message": "Finance Chatbot API is running."}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Convert Pydantic models to dicts
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # Get AI response
        response_text = get_agent_response(messages_dict)
        
        return {"role": "assistant", "content": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat processing: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
