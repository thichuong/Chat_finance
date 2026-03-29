from typing import List, Dict, Any, TypedDict
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """Trạng thái chia sẻ của tác nhân (AgentState) cho LangGraph."""
    messages: List[BaseMessage]            # Tin nhắn của người dùng
    iteration: int                         # Vòng lặp ReAct hiện tại
    steps: List[Dict[str, Any]]            # Lịch sử tất cả các bước đã thực hiện
    all_tool_results: List[Dict[str, Any]] # Kết quả các công cụ tích lũy qua các vòng lặp
    final_response: str                    # Câu trả lời cuối cùng
    session_id: str                        # ID phiên để quản lý bộ nhớ
    thinking_updates: List[str]            # Lịch sử quá trình suy nghĩ để hiển thị cho UI
