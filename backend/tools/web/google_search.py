from langchain_core.tools import tool
from google.genai import types
from backend.nodes.base import genai_client, llm_reason_model

@tool
def google_search(query: str) -> str:
    """Tìm kiếm thông tin mới nhất trên Google thông qua API Gemma 4 tích hợp Native Google Search.
    Input: Câu truy vấn để tìm kiếm. (VD: "Tin tức chứng khoán thế giới hôm nay").
    Returns: Tóm tắt kết quả trả về từ Google.
    """
    try:
        search_response = genai_client.models.generate_content(
            model=llm_reason_model,
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=f"Hãy tìm kiếm Google và trả lời ngắn gọn: {query}")])],
            config=types.GenerateContentConfig(
                tools=[types.Tool(googleSearch=types.GoogleSearch())],
                system_instruction="Bạn là trợ lý tìm kiếm. Hãy dùng Google Search để tìm thông tin chính xác và tóm tắt ngắn gọn các ý chính."
            )
        )
        return search_response.text
    except Exception as e:
        return f"[ERROR] Google Search failed: {str(e)}"
