"""
ReAct Agent for Finance Chatbot — powered by Gemma 3.

Architecture:
  User Query → [reason] ⟷ [execute_tools] (loop max 5x) → [generate_response] → END

Since Gemma 3 does not support native function calling (bind_tools),
we use carefully crafted prompts with few-shot examples to get reliable
JSON output for tool selection and arguments.
"""

import json
import re
import asyncio
from typing import List, Dict, Any, TypedDict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from backend.tools.finance_tools import (
    get_stock_price, get_crypto_price, get_vn_stock_price,
    get_vn_indices, get_stock_history, compare_stocks,
)
from backend.tools.web_tools import search_tavily, scrape_web
from backend.prompts import (
    REACT_SYSTEM_PROMPT, FEW_SHOT_EXAMPLES,
    EVALUATION_PROMPT_TEMPLATE, SUMMARIZE_PROMPT,
)
from backend.memory import get_memory
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# Constants
# ============================================================
MAX_ITERATIONS = 5

# ============================================================
# State
# ============================================================
class AgentState(TypedDict):
    messages: List[BaseMessage]            # User message(s)
    iteration: int                         # Current ReAct iteration
    steps: List[Dict[str, Any]]            # History of all steps taken
    all_tool_results: List[Dict[str, Any]] # Accumulated tool results across iterations
    final_response: str                    # The final answer text
    session_id: str                        # For conversation memory
    thinking_updates: List[str]            # Streaming thinking updates for UI

# ============================================================
# LLM
# ============================================================
llm = ChatGoogleGenerativeAI(model="gemma-3-27b-it", temperature=0.3)

# ============================================================
# Tool Registry
# ============================================================
TOOLS_MAP = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_vn_stock_price": get_vn_stock_price,
    "get_vn_indices": get_vn_indices,
    "get_stock_history": get_stock_history,
    "compare_stocks": compare_stocks,
    "search_tavily": search_tavily,
    "scrape_web": scrape_web,
}

# ============================================================
# Helpers
# ============================================================

def _parse_json_response(content: str) -> Optional[Dict]:
    """Robustly extract JSON from Gemma's response.
    
    Handles:
    - JSON inside ```json ... ``` code blocks
    - JSON inside ``` ... ``` code blocks
    - Raw JSON in the response
    - Multiple JSON objects (takes the first valid one)
    """
    # Strategy 1: Match JSON inside code blocks
    code_block_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Strategy 2: Find the outermost { ... } pair
    # Count braces to find complete JSON objects
    brace_depth = 0
    start_idx = None
    for i, ch in enumerate(content):
        if ch == '{':
            if brace_depth == 0:
                start_idx = i
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth == 0 and start_idx is not None:
                try:
                    return json.loads(content[start_idx:i + 1])
                except json.JSONDecodeError:
                    start_idx = None
                    continue
    
    # Strategy 3: Simple regex (last resort)
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    return None


def _build_few_shot_prompt() -> str:
    """Build few-shot examples as part of the prompt string."""
    examples = []
    for ex in FEW_SHOT_EXAMPLES:
        examples.append(f"User: {ex['user']}\nAssistant: {ex['assistant']}")
    return "\n\n---\n\n".join(examples)


def _format_tool_results(results: List[Dict[str, Any]]) -> str:
    """Format tool results into a readable string for the LLM."""
    if not results:
        return "Chưa có kết quả nào."
    
    lines = []
    for res in results:
        tool_name = res.get("tool", "unknown")
        if "error" in res:
            lines.append(f"❌ {tool_name}: {res['error']}")
        else:
            lines.append(f"✅ {tool_name}: {res['output']}")
    return "\n".join(lines)


def _format_steps_history(steps: List[Dict[str, Any]]) -> str:
    """Format the history of steps taken for the LLM's context."""
    if not steps:
        return "Chưa thực hiện bước nào."
    
    lines = []
    for i, step in enumerate(steps, 1):
        thought = step.get("thought", "")
        action = step.get("action", "")
        tools = step.get("tools_called", [])
        lines.append(f"Bước {i}: [{action}] {thought}")
        if tools:
            lines.append(f"  Tools gọi: {', '.join(tools)}")
    return "\n".join(lines)


# ============================================================
# Nodes
# ============================================================

def reason_node(state: AgentState) -> Dict:
    """Core reasoning node — decides what to do next.
    
    On first iteration: Analyzes the user query and decides which tools to call.
    On subsequent iterations: Evaluates existing results and decides if more data is needed.
    """
    iteration = state.get("iteration", 0)
    query = state["messages"][-1].content
    session_id = state.get("session_id", "default")
    memory = get_memory(session_id)
    
    thinking_updates = list(state.get("thinking_updates", []))

    if iteration == 0:
        # --- First iteration: Analyze the query ---
        thinking_updates.append(f"🔍 **Phân tích yêu cầu:** {query}")

        # Build conversation context
        context = memory.get_context_string()
        context_block = f"\n\nLịch sử hội thoại gần đây:\n{context}\n" if context else ""

        prompt = (
            f"{REACT_SYSTEM_PROMPT}\n\n"
            f"## Ví dụ:\n{_build_few_shot_prompt()}\n\n"
            f"---\n\n"
            f"{context_block}"
            f"User: {query}\n"
            f"Assistant:"
        )
    else:
        # --- Subsequent iterations: Evaluate results ---
        thinking_updates.append(f"🔄 **Đánh giá kết quả** (vòng {iteration + 1}/{MAX_ITERATIONS})...")
        
        eval_prompt = EVALUATION_PROMPT_TEMPLATE.format(
            query=query,
            tool_results=_format_tool_results(state.get("all_tool_results", [])),
            steps_history=_format_steps_history(state.get("steps", [])),
        )
        
        prompt = (
            f"{REACT_SYSTEM_PROMPT}\n\n"
            f"{eval_prompt}"
        )
    
    # Call LLM
    response = llm.invoke(prompt)
    content = response.content
    
    # Parse JSON
    parsed = _parse_json_response(content)
    
    if parsed is None:
        # Fallback: If we have tool results, try to generate a final answer
        if state.get("all_tool_results"):
            thinking_updates.append("⚠️ Không parse được JSON, tạo câu trả lời từ dữ liệu đã có...")
            return {
                "steps": state.get("steps", []) + [{"thought": "JSON parse failed, using existing data", "action": "final_answer"}],
                "iteration": iteration + 1,
                "thinking_updates": thinking_updates,
            }
        else:
            # No data at all, return content directly as answer
            thinking_updates.append("⚠️ Không parse được JSON, trả lời trực tiếp...")
            return {
                "final_response": content,
                "steps": [{"thought": "Direct response (no JSON)", "action": "final_answer"}],
                "iteration": iteration + 1,
                "thinking_updates": thinking_updates,
            }
    
    # Record the step
    thought = parsed.get("thought", "")
    action = parsed.get("action", "respond_directly")
    
    step_record = {
        "thought": thought,
        "action": action,
        "parsed": parsed,
    }
    
    if thought:
        thinking_updates.append(f"💭 **Suy nghĩ:** {thought}")
    
    # Handle final_answer or respond_directly
    if action in ["final_answer", "respond_directly"]:
        answer = parsed.get("answer", content)
        return {
            "final_response": answer,
            "steps": state.get("steps", []) + [step_record],
            "iteration": iteration + 1,
            "thinking_updates": thinking_updates,
        }
    
    # Handle call_tools
    tools = parsed.get("tools", [])
    if not tools:
        # Backward compat: single tool format
        tool_name = parsed.get("tool_name") or parsed.get("name")
        tool_input = parsed.get("tool_input") or parsed.get("input", "")
        if tool_name:
            tools = [{"name": tool_name, "input": tool_input}]
    
    tool_names = [t.get("name", "?") for t in tools]
    step_record["tools_called"] = tool_names
    
    for t in tools:
        thinking_updates.append(f"🛠️ **Gọi tool:** {t.get('name')} → `{t.get('input', '')}`")
    
    return {
        "steps": state.get("steps", []) + [step_record],
        "iteration": iteration + 1,
        "thinking_updates": thinking_updates,
    }


def execute_tools_node(state: AgentState) -> Dict:
    """Execute the tools requested by the reason node."""
    steps = state.get("steps", [])
    thinking_updates = list(state.get("thinking_updates", []))
    
    if not steps:
        return {"all_tool_results": state.get("all_tool_results", [])}
    
    last_step = steps[-1]
    parsed = last_step.get("parsed", {})
    tools_to_call = parsed.get("tools", [])
    
    # Backward compat
    if not tools_to_call:
        name = parsed.get("tool_name") or parsed.get("name")
        inp = parsed.get("tool_input") or parsed.get("input", "")
        if name:
            tools_to_call = [{"name": name, "input": inp}]
    
    existing_results = list(state.get("all_tool_results", []))
    new_results = []
    
    for tool_info in tools_to_call:
        name = tool_info.get("name", "")
        input_data = tool_info.get("input", "")
        
        # Normalize input: if LLM gave a dict, convert to JSON string
        if isinstance(input_data, dict):
            input_data = json.dumps(input_data, ensure_ascii=False)
        elif isinstance(input_data, list):
            input_data = json.dumps(input_data, ensure_ascii=False)
        elif input_data is None:
            input_data = ""
        else:
            input_data = str(input_data).strip()
        
        if name in TOOLS_MAP:
            try:
                result = TOOLS_MAP[name].invoke(input_data)
                new_results.append({"tool": name, "input": input_data, "output": str(result)})
            except Exception as e:
                new_results.append({"tool": name, "input": input_data, "error": str(e)})
        else:
            new_results.append({"tool": name, "input": input_data, "error": f"Tool '{name}' not found"})
    
    # Report results
    success_count = sum(1 for r in new_results if "output" in r)
    error_count = sum(1 for r in new_results if "error" in r)
    
    if success_count > 0:
        thinking_updates.append(f"✅ **Kết quả:** {success_count} tool thành công" + 
                                (f", {error_count} lỗi" if error_count > 0 else ""))
    elif error_count > 0:
        thinking_updates.append(f"❌ **Lỗi:** {error_count} tool thất bại")
    
    # Auto-scrape: if search_tavily returned results, extract URLs for potential scraping
    for res in new_results:
        if res.get("tool") == "search_tavily" and "output" in res:
            urls = re.findall(r'URL: (https?://\S+)', res["output"])
            if urls:
                thinking_updates.append(f"🌐 **Tự động cào** {min(len(urls), 2)} trang web từ kết quả tìm kiếm...")
                for url in urls[:2]:
                    try:
                        scraped = scrape_web.invoke(url)
                        # Summarize the scraped content to save tokens
                        summary_prompt = f"Tóm tắt ngắn gọn nội dung sau (tối đa 300 từ), tập trung vào thông tin tài chính:\n\n{scraped}"
                        summary_response = llm.invoke(summary_prompt)
                        new_results.append({
                            "tool": "auto_scrape_summary",
                            "input": url,
                            "output": summary_response.content[:1500]
                        })
                    except Exception as e:
                        new_results.append({
                            "tool": "auto_scrape",
                            "input": url,
                            "error": str(e)
                        })
                thinking_updates.append("📝 **Đã tóm tắt** nội dung cào được.")
    
    return {
        "all_tool_results": existing_results + new_results,
        "thinking_updates": thinking_updates,
    }


def generate_response_node(state: AgentState) -> Dict:
    """Generate the final response when we already have sufficient data.
    
    This node is reached when:
    - reason_node set final_response directly, OR
    - JSON parsing failed but we have tool results to work with
    """
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


# ============================================================
# Router
# ============================================================

def should_execute_tools(state: AgentState) -> str:
    """After reasoning, decide: execute tools or generate final response."""
    steps = state.get("steps", [])
    
    if not steps:
        return "generate"
    
    last_step = steps[-1]
    action = last_step.get("action", "")
    
    # If the last step decided to call tools → execute them
    if action in ["call_tools", "call_tool"]:
        return "execute"
    
    # Otherwise → generate final response
    return "generate"


def should_continue_loop(state: AgentState) -> str:
    """After executing tools, decide: reason again or generate response.
    
    Continues the ReAct loop if:
    - We haven't hit MAX_ITERATIONS
    - There are tool results to evaluate
    """
    iteration = state.get("iteration", 0)
    
    # Safety: hard limit on iterations
    if iteration >= MAX_ITERATIONS:
        return "generate"
    
    # If we have results, let the reason node evaluate them
    if state.get("all_tool_results"):
        return "reason"
    
    return "generate"


# ============================================================
# Build Graph
# ============================================================

workflow = StateGraph(AgentState)

# Nodes
workflow.add_node("reason", reason_node)
workflow.add_node("execute_tools", execute_tools_node)
workflow.add_node("generate", generate_response_node)

# Entry point
workflow.set_entry_point("reason")

# Edges
workflow.add_conditional_edges(
    "reason",
    should_execute_tools,
    {
        "execute": "execute_tools",
        "generate": "generate",
    }
)

workflow.add_conditional_edges(
    "execute_tools",
    should_continue_loop,
    {
        "reason": "reason",
        "generate": "generate",
    }
)

workflow.add_edge("generate", END)

# Compile
app = workflow.compile()


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
    }
    
    last_thinking_idx = 0  # Track which updates we've already yielded
    
    for output in app.stream(inputs):
        for node_name, state_update in output.items():
            # Yield new thinking updates
            updates = state_update.get("thinking_updates", [])
            for update in updates[last_thinking_idx:]:
                yield update
            last_thinking_idx = len(updates)
            
            # Yield final response
            if node_name == "generate" or state_update.get("final_response"):
                final = state_update.get("final_response", "")
                if final:
                    # Save to memory
                    memory.add_ai_message(final)
                    yield final
