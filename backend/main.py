from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from backend.agent import get_graph_response

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
    session_id: str = "api-default"

@app.get("/")
async def root():
    return {"status": "ok", "message": "Finance Chatbot API is running."}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Get the last user message
        last_message = request.messages[-1].content if request.messages else ""
        
        # Run agent and collect the final response
        final_response = ""
        for update in get_graph_response(last_message, session_id=request.session_id):
            final_response = update  # Last update is the final response
        
        return {"role": "assistant", "content": final_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat processing: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
