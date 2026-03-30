import json
import re
from datetime import datetime
from typing import Optional, Dict, List, Any
from backend.prompts import FEW_SHOT_EXAMPLES

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

def _get_current_time_str() -> str:
    """Returns the current time in a human-readable format for the AI."""
    now = datetime.now()
    # Format: HH:MM, Thứ [Ngày], DD/MM/YYYY
    # Vietnamese day of week mapping
    days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
    day_str = days[now.weekday()]
    return f"{now.strftime('%H:%M:%S')}, {day_str}, ngày {now.strftime('%d/%m/%Y')}"
