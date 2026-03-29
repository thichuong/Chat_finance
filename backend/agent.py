import json
import re
from typing import Annotated, List, Dict, Any, TypedDict, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from backend.tools.finance_tools import get_stock_price, get_crypto_price, get_vn_stock_price
from backend.tools.web_tools import search_tavily, scrape_web
from dotenv import load_dotenv

load_dotenv()

# Define the state schema
class AgentState(TypedDict):
    messages: List[BaseMessage]
    analysis: Dict[str, Any]
    tool_results: List[Dict[str, Any]]
    final_response: str

# Initialize LLM
llm = ChatGoogleGenerativeAI(model="gemma-3-27b-it")

# Mapping tools
tools_map = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_vn_stock_price": get_vn_stock_price,
    "search_tavily": search_tavily,
    "scrape_web": scrape_web
}

# --- Nodes ---

def analyze_node(state: AgentState):
    """Analyzes the user input and decides the next action in JSON format."""
    print("--- NODE: ANALYZE ---")
    query = state["messages"][-1].content
    
    # Prompt for manual JSON output as Gemma 3 doesn't support with_structured_output
    prompt = (
        "Bạn là điều phối viên tài chính. Hãy phân tích yêu cầu sau và xuất ra DUY NHẤT một mã JSON theo định dạng:\n"
        "{\n"
        "  \"action\": \"call_tool\" hoặc \"respond_directly\",\n"
        "  \"tool_name\": \"tên_hàm\",\n"
        "  \"tool_input\": \"đối_số\",\n"
        "  \"reasoning\": \"lý do\"\n"
        "}\n\n"
        "Danh sách tool: get_stock_price (Mỹ), get_crypto_price (Crypto), get_vn_stock_price (VN), search_tavily (Tin tức), scrape_web (Đọc URL).\n\n"
        f"Yêu cầu: {query}"
    )
    
    response = llm.invoke(prompt)
    content = response.content
    
    # Simple regex to extract JSON from code blocks if present
    json_match = re.search(r"\{.*\}", content, re.DOTALL)
    if json_match:
        try:
            analysis_data = json.loads(json_match.group(0))
            return {"analysis": analysis_data}
        except:
            pass
            
    # Fallback if parsing fails
    return {"analysis": {"action": "respond_directly", "reasoning": "Could not parse JSON"}}


def tool_node(state: AgentState):
    """Executes the tool based on the analysis JSON."""
    print("--- NODE: TOOL ---")
    analysis = state["analysis"]
    tool_name = analysis["tool_name"]
    tool_input = analysis["tool_input"]
    
    if tool_name in tools_map:
        result = tools_map[tool_name].invoke(tool_input)
        return {"tool_results": [{"tool": tool_name, "output": str(result)}]}
    
    return {"tool_results": [{"error": f"Tool {tool_name} not found"}]}

def summarize_node(state: AgentState):
    """Synthesizes the results into a final Vietnamese response."""
    print("--- NODE: SUMMARIZE ---")
    query = state["messages"][-1].content
    tool_outputs = state.get("tool_results", [])
    
    prompt = (
        "Bạn là một chuyên gia tài chính. Dựa trên dữ liệu sau, hãy trả lời yêu cầu của người dùng bằng tiếng Việt chuyên nghiệp.\n"
        f"Câu hỏi: {query}\n"
        f"Dữ liệu thu thập: {tool_outputs}\n"
    )
    
    response = llm.invoke(prompt)
    return {"final_response": response.content}

# --- Router ---

def should_continue(state: AgentState):
    """Decides whether to go to tool node or summarize node."""
    if state["analysis"]["action"] == "call_tool":
        return "tool"
    return "summarize"

# --- Build Graph ---

workflow = StateGraph(AgentState)

workflow.add_node("analyze", analyze_node)
workflow.add_node("tool", tool_node)
workflow.add_node("summarize", summarize_node)

workflow.set_entry_point("analyze")

workflow.add_conditional_edges(
    "analyze",
    should_continue,
    {
        "tool": "tool",
        "summarize": "summarize"
    }
)

workflow.add_edge("tool", "summarize")
workflow.add_edge("summarize", END)

# Compile
app = workflow.compile()

def get_graph_response(query: str):
    """Helper function to run the graph and yield intermediate updates."""
    inputs = {"messages": [HumanMessage(content=query)]}
    
    # Use app.stream to get updates from each node
    for output in app.stream(inputs):
        # output is a dictionary mapping node name to its state update
        for node_name, state_update in output.items():
            if node_name == "analyze":
                analysis = state_update.get("analysis", {})
                reasoning = analysis.get("reasoning", "Đang phân tích yêu cầu...")
                yield f"🔍 **Phân tích**: {reasoning}"
                
                if analysis.get("action") == "call_tool":
                    tool_name = analysis.get("tool_name")
                    yield f"🛠️ **Gọi công cụ**: {tool_name}..."
            
            elif node_name == "tool":
                results = state_update.get("tool_results", [])
                if results:
                    yield f"✅ **Kết quả công cụ**: Đã thu thập dữ liệu thành công."
            
            elif node_name == "summarize":
                final_response = state_update.get("final_response")
                if final_response:
                    # Final response should be delivered without the "thinking" prefixes
                    yield final_response
