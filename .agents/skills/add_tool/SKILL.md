---
name: add_tool
description: Instructions for adding a new financial or web tool to the system.
---

# Hướng dẫn thêm Tool mới vào hệ thống Chat Finance

Để thêm một công cụ (tool) mới và cho phép agent (Gemma 3) sử dụng nó, bạn cần thực hiện theo 3-4 bước sau:

## Bước 1: Tạo Logic cho Tool
Tạo file Python mới trong thư mục tương ứng:
- Các tool liên quan đến tài chính: [backend/tools/finance/](file:///home/exblackhole/Desktop/Chat_finance/backend/tools/finance/)
- Các tool liên quan đến web/search: [backend/tools/web/](file:///home/exblackhole/Desktop/Chat_finance/backend/tools/web/)

**Yêu cầu:** 
- Sử dụng decorator `@tool` từ `langchain_core.tools`.
- Hàm nên nhận input là một chuỗi (`str`) và trả về `str`.
- Đảm bảo có docstring rõ ràng (đây là thông tin agent dùng để hiểu tool).

**Ví dụ:**
```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    \"\"\"Lấy thông tin thời tiết cho một thành phố.\"\"\"
    # ... logic lấy dữ liệu ...
    return f"Thời tiết tại {city} là 30 độ C."
```

## Bước 2: Đăng ký Tool vào Registry
Mở file [backend/tools/registry.py](file:///home/exblackhole/Desktop/Chat_finance/backend/tools/registry.py) và thực hiện:
1. Import tool vừa tạo.
2. Thêm vào dictionary `TOOLS_MAP`.

```python
from backend.tools.finance.my_new_tool import my_new_tool

TOOLS_MAP = {
    # ... các tools cũ ...
    "my_new_tool": my_new_tool,
}
```

## Bước 3: Cập nhật Prompt cho Agent
Agent cần biết về sự tồn tại của tool qua System Prompt. Mở file [backend/prompts.py](file:///home/exblackhole/Desktop/Chat_finance/backend/prompts.py):
- Thêm mô tả tool vào biến `TOOL_DESCRIPTIONS`.
- Nêu rõ: **Mục đích**, **Input** (định dạng), và **Khi nào dùng**.

```python
TOOL_DESCRIPTIONS = \"\"\"
...
10. **my_new_tool**
   - Mục đích: [Mô tả ngắn gọn]
   - Input: [Mô tả input]
   - Khi nào dùng: [Trường hợp sử dụng]
\"\"\"
```

## Bước 4 (Tùy chọn): Hiển thị lên Dashboard
Nếu bạn muốn tool này hiển thị giá trị "live" trên Sidebar của Frontend:
1. Cập nhật endpoint `/api/market` trong [api.py](file:///home/exblackhole/Desktop/Chat_finance/api.py).
2. Thêm UI card tương ứng trong [frontend/src/components/Sidebar.jsx](file:///home/exblackhole/Desktop/Chat_finance/frontend/src/components/Sidebar.jsx).

---
**Lưu ý:** 
- Luôn kiểm tra lỗi (try-except) trong tool để không làm treo agent.
- Agent (Gemma 3) rất quan trọng Docstring và Mô tả trong Prompt để gọi đúng tool.
