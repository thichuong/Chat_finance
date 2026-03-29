import json
import re
from typing import Annotated, List, Dict, Any, TypedDict, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from backend.tools.finance_tools import get_stock_price, get_crypto_price, get_vn_stock_price, get_vn_indices
from backend.tools.web_tools import search_tavily, scrape_web
from dotenv import load_dotenv

load_dotenv()

# Define the state schema
class AgentState(TypedDict):
    messages: List[BaseMessage]
    analysis: Dict[str, Any]
    tool_results: List[Dict[str, Any]]
    final_response: str
    scraped_content: str
    web_summary: str

# Initialize LLM
llm = ChatGoogleGenerativeAI(model="gemma-3-27b-it")

# Mapping tools
tools_map = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_vn_stock_price": get_vn_stock_price,
    "get_vn_indices": get_vn_indices,
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
        "  \"action\": \"call_tools\" hoặc \"respond_directly\",\n"
        "  \"tools\": [\n"
        "    {\"name\": \"tên_hàm\", \"input\": \"đối_số\"},\n"
        "    ...\n"
        "  ],\n"
        "  \"reasoning\": \"lý do\"\n"
        "}\n\n"
        "Danh sách tool: get_stock_price (Mỹ), get_crypto_price (Crypto), get_vn_stock_price (VN stock), get_vn_indices (VN-Index, VN30), search_tavily (Tin tức), scrape_web (Đọc URL).\n\n"
        "Lưu ý: Bạn CÓ THỂ gọi nhiều tool cùng lúc nếu cần thiết để trả lời đầy đủ câu hỏi.\n\n"
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
    """Executes multiple tools based on the analysis JSON."""
    print("--- NODE: TOOL ---")
    analysis = state["analysis"]
    tools_to_call = analysis.get("tools", [])
    
    # Backward compatibility if it still outputs a single tool call
    if not tools_to_call and analysis.get("tool_name"):
        tools_to_call = [{"name": analysis["tool_name"], "input": analysis["tool_input"]}]
    
    results = []
    for tool_info in tools_to_call:
        name = tool_info.get("name")
        input_data = tool_info.get("input")
        
        print(f"Executing Tool: {name}")
        if name in tools_map:
            try:
                result = tools_map[name].invoke(input_data)
                results.append({"tool": name, "output": str(result)})
            except Exception as e:
                results.append({"tool": name, "error": str(e)})
        else:
            results.append({"tool": name, "error": f"Tool {name} not found"})
    
    return {"tool_results": results}

def scraping_node(state: AgentState):
    """Automatically scrapes links from Tavily search results."""
    print("--- NODE: SCRAPING ---")
    tool_results = state.get("tool_results", [])
    tavily_output = ""
    for res in tool_results:
        if res.get("tool") == "search_tavily":
            tavily_output = res.get("output", "")
            break
    
    if not tavily_output:
        return {"scraped_content": "No search results to scrape."}
    
    # Extract URLs using regex
    urls = re.findall(r'URL: (https?://\S+)', tavily_output)
    
    scraped_data = []
    # Scrape top 2 URLs to save time/resources
    for url in urls[:2]:
        print(f"Scraping: {url}")
        content = scrape_web.invoke(url)
        scraped_data.append(f"Source: {url}\nContent: {content}")
    
    return {"scraped_content": "\n\n---\n\n".join(scraped_data)}

def web_summarize_node(state: AgentState):
    """Summarizes the raw scraped content to save tokens."""
    print("--- NODE: WEB_SUMMARIZE ---")
    scraped_content = state.get("scraped_content", "")
    if not scraped_content or "No search results" in scraped_content:
        return {"web_summary": "Không có nội dung để tóm tắt."}
        
    prompt = (
        "Bạn là một chuyên gia phân tích thông tin. Hãy tóm tắt nội dung sau đây một cách chi tiết nhưng súc tích, "
        "tập trung vào các ý chính liên quan đến câu hỏi của người dùng. "
        "Dữ liệu này được cào từ web.\n\n"
        f"Nội dung cào được:\n{scraped_content}"
    )
    
    response = llm.invoke(prompt)
    # Return summary and CLEAR scraped_content to save tokens in next nodes
    return {"web_summary": response.content, "scraped_content": ""}

def summarize_node(state: AgentState):
    """Synthesizes the results into a final Vietnamese response."""
    print("--- NODE: SUMMARIZE ---")
    query = state["messages"][-1].content
    tool_outputs = state.get("tool_results", [])
    web_summary = state.get("web_summary", "")
    
    # If we have a web summary, we use it instead of the raw tool output for search
    context = ""
    if web_summary:
        context = f"Tóm tắt nghiên cứu web: {web_summary}\n"
    
    # Add other tool results that aren't search_tavily
    other_results = [res for res in tool_outputs if res.get("tool") != "search_tavily"]
    if other_results:
        context += f"Dữ liệu công cụ khác: {other_results}\n"
    elif not web_summary:
        context = f"Dữ liệu thu thập: {tool_outputs}"

    prompt = (
        "Bạn là một chuyên gia tài chính. Dựa trên dữ liệu sau, hãy trả lời yêu cầu của người dùng bằng tiếng Việt chuyên nghiệp.\n"
        f"Câu hỏi: {query}\n"
        f"Dữ liệu: {context}\n"
    )
    
    response = llm.invoke(prompt)
    return {"final_response": response.content}

# --- Router ---

def should_continue(state: AgentState):
    """Decides whether to go to tool node or summarize node."""
    if state["analysis"]["action"] in ["call_tool", "call_tools"]:
        return "tool"
    return "summarize"

def after_tool_router(state: AgentState):
    """Decides if we need to scrape or go to summarize."""
    analysis = state.get("analysis", {})
    tools_called = analysis.get("tools", [])
    
    # Also check if it was a single tool call (backward compatibility)
    if not tools_called and analysis.get("tool_name"):
        tools_called = [{"name": analysis["tool_name"]}]
    
    # Check if any tool was search_tavily
    if any(t.get("name") == "search_tavily" for t in tools_called):
        return "scraping"
    
    return "summarize"

# --- Build Graph ---

workflow = StateGraph(AgentState)

workflow.add_node("analyze", analyze_node)
workflow.add_node("tool", tool_node)
workflow.add_node("scraping", scraping_node)
workflow.add_node("web_summarize", web_summarize_node)
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

workflow.add_conditional_edges(
    "tool",
    after_tool_router,
    {
        "scraping": "scraping",
        "summarize": "summarize"
    }
)

workflow.add_edge("scraping", "web_summarize")
workflow.add_edge("web_summarize", "summarize")
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
                
                if analysis.get("action") in ["call_tool", "call_tools"]:
                    tools_to_call = analysis.get("tools", [])
                    if not tools_to_call and analysis.get("tool_name"):
                        tools_to_call = [{"name": analysis["tool_name"]}]
                        
                    for t in tools_to_call:
                        yield f"🛠️ **Gọi công cụ**: {t.get('name')}..."
            
            elif node_name == "tool":
                results = state_update.get("tool_results", [])
                if results:
                    yield f"✅ **Kết quả công cụ**: Đã thu thập dữ liệu thành công."
            
            elif node_name == "scraping":
                yield f"🌐 **Đang cào dữ liệu** từ các trang web liên quan..."
            
            elif node_name == "web_summarize":
                yield f"📝 **Đang tóm tắt** nội dung cào được..."
            
            elif node_name == "summarize":
                final_response = state_update.get("final_response")
                if final_response:
                    # Final response should be delivered without the "thinking" prefixes
                    yield final_response
