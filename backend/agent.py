"""
ReAct Agent for Finance Chatbot — powered by Gemma 4.

Architecture:
  User Query → [reason] ⟷ [execute_tools] (loop max 5x) → [generate_response] → END

This module acts as the public API entry point. Internal logic has been componentized
into state.py, utils.py, nodes.py, and graph.py.
"""

from langchain_core.messages import HumanMessage
from backend.memory import get_memory
from backend.graph import app
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# Public API
# ============================================================

def get_graph_response(query: str, session_id: str = "default"):
    """Run the ReAct agent graph and yield intermediate thinking updates.
    
    This is a generator that yields:
    - Thinking step strings (prefixed with emoji) during processing
    - The final response string as the last yielded value
    
    Args:
        query: The user's question/request
        session_id: Session identifier for conversation memory
    
    Yields:
        str: Either a thinking update or the final response
    """
    # Record in memory
    memory = get_memory(session_id)
    memory.add_user_message(query)
    
    inputs = {
        "messages": [HumanMessage(content=query)],
        "iteration": 0,
        "steps": [],
        "all_tool_results": [],
        "final_response": "",
        "session_id": session_id,
        "thinking_updates": [],
        "grounding_results": [],
    }
    
    last_thinking_idx = 0  # Track which updates we've already yielded
    final_yielded = False  # Track if the final response has been yielded

    for output in app.stream(inputs):
        for node_name, state_update in output.items():
            # Yield new thinking updates
            updates = state_update.get("thinking_updates", [])
            for update in updates[last_thinking_idx:]:
                yield update
            last_thinking_idx = len(updates)
            
            # Yield final response (only once)
            final = state_update.get("final_response", "")
            if final and not final_yielded:
                # Save to memory only once
                memory.add_ai_message(final)
                yield final
                final_yielded = True
