from typing import Dict
from backend.state import AgentState
from backend.utils import (
    _parse_json_response, _build_few_shot_prompt,
    _format_tool_results, _format_steps_history, _get_current_time_str
)
from backend.prompts import REACT_SYSTEM_PROMPT, EVALUATION_PROMPT_TEMPLATE
from backend.memory import get_memory
from backend.nodes.base import genai_client, llm_reason_model, reasoning_config, MAX_ITERATIONS
from google.genai import types

def reason_node(state: AgentState) -> Dict:
    """Core reasoning node — decides what to do next."""
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
            f"Thời gian hiện tại: {_get_current_time_str()}\n\n"
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
            f"Thời gian hiện tại: {_get_current_time_str()}\n\n"
            f"{REACT_SYSTEM_PROMPT}\n\n"
            f"{eval_prompt}"
        )
    
    # Call LLM using Native SDK
    response = genai_client.models.generate_content(
        model=llm_reason_model,
        contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
        config=reasoning_config
    )
    
    # Extract thinking/reasoning if available (Gemma 4 specific)
    native_thinking = ""
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
            # Native Google Search was used
            thinking_updates.append("🌐 **Sử dụng Google Search nguyên bản**...")
            
            # Save grounding results for synthesis in later nodes
            grounding_data = list(state.get("grounding_results", []))
            
            # Serialize the metadata to a dictionary for the state
            # This is a simplified extraction ofChunks or Search Entry Points
            grounding_meta = candidate.grounding_metadata
            chunk_data = []
            if hasattr(grounding_meta, 'grounding_chunks'):
                for chunk in grounding_meta.grounding_chunks:
                    if hasattr(chunk, 'web') and chunk.web:
                        chunk_data.append({"title": chunk.web.title, "url": chunk.web.uri})
            
            grounding_data.append({
                "iteration": iteration,
                "sources": chunk_data,
                "search_queries": getattr(grounding_meta, 'search_entry_point', {}).get('rendered_content', '')
            })
            state["grounding_results"] = grounding_data
            
        # Check for native thinking/thought process
        # Some versions put thinking in parts or a separate field
        for part in candidate.content.parts:
            if hasattr(part, 'thought') and part.thought:
                native_thinking = part.text
                thinking_updates.append(f"💭 **Suy nghĩ (Gemma 4):** {native_thinking}")
    
    content = response.text
    
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
