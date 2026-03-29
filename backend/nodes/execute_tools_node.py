import json
import re
from typing import Dict
from backend.state import AgentState
from backend.tools.registry import TOOLS_MAP
from backend.tools.web.scrape_web import scrape_web
from backend.nodes.base import llm

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
        
        # Normalize input
        if isinstance(input_data, (dict, list)):
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
    
    # Auto-scrape logic
    for res in new_results:
        if res.get("tool") == "search_tavily" and "output" in res:
            urls = re.findall(r'URL: (https?://\S+)', res["output"])
            if urls:
                thinking_updates.append(f"🌐 **Tự động cào** {min(len(urls), 2)} trang web từ kết quả tìm kiếm...")
                for url in urls[:2]:
                    try:
                        scraped = scrape_web.invoke(url)
                        summary_prompt = f"Tóm tắt ngắn gọn nội dung sau (tối đa 300 từ), tập trung vào thông tin tài chính:\n\n{scraped}"
                        summary_response = llm.invoke(summary_prompt)
                        new_results.append({
                            "tool": "auto_scrape_summary",
                            "input": url,
                            "output": summary_response.content[:1500]
                        })
                    except Exception as e:
                        new_results.append({"tool": "auto_scrape", "input": url, "error": str(e)})
                thinking_updates.append("📝 **Đã tóm tắt** nội dung cào được.")
    
    return {
        "all_tool_results": existing_results + new_results,
        "thinking_updates": thinking_updates,
    }
