from typing import Dict
from backend.state import AgentState
from backend.memory import get_memory
from backend.utils import _format_tool_results, _get_current_time_str
from backend.nodes.base import llm

def generate_response_node(state: AgentState) -> Dict:
    """Generate the final response when we already have sufficient data."""
    thinking_updates = list(state.get("thinking_updates", []))
    
    # If final_response already set by reason_node, use it
    if state.get("final_response"):
        return {"final_response": state["final_response"]}
    
    # Otherwise, synthesize from tool results
    thinking_updates.append("📊 **Tổng hợp** câu trả lời cuối cùng...")
    
    query = state["messages"][-1].content
    tool_results = state.get("all_tool_results", [])
    session_id = state.get("session_id", "default")
    memory = get_memory(session_id)
    context = memory.get_context_string()
    
    context_block = f"\nLịch sử hội thoại:\n{context}\n" if context else ""
    
    prompt = (
        f"Thời gian hiện tại: {_get_current_time_str()}\n\n"
        "Bạn là một chuyên gia tài chính. Dựa trên dữ liệu sau, hãy trả lời yêu cầu "
        "của người dùng bằng tiếng Việt chuyên nghiệp, có cấu trúc rõ ràng (dùng markdown).\n\n"
        f"Câu hỏi: {query}\n"
        f"{context_block}"
        f"Dữ liệu thu thập:\n{_format_tool_results(tool_results)}\n\n"
        "Hãy phân tích chuyên sâu, đưa ra nhận xét và khuyến nghị nếu phù hợp."
    )
    
    response = llm.invoke(prompt)
    
    return {
        "final_response": response.content,
        "thinking_updates": thinking_updates,
    }
