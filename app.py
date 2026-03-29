import os
import uuid
import gradio as gr
from backend.agent import get_graph_response
from backend.memory import get_memory, clear_memory
from dotenv import load_dotenv

load_dotenv()

# Check for API Keys
API_KEY = os.environ.get("GOOGLE_API_KEY")

def predict(message, history, request: gr.Request):
    """Generates a response using the ReAct LangGraph agent with streaming thinking steps."""
    if not API_KEY:
        yield "Lỗi: Chưa cấu hình GOOGLE_API_KEY trong file .env"
        return

    # Use a session-based ID (from Gradio request cookies or fallback)
    session_id = "default"
    if request:
        session_id = request.session_hash or "default"

    try:
        thinking_steps = []
        final_response = ""
        
        for update in get_graph_response(message, session_id=session_id):
            # Check if it's a thinking step (has emoji prefix) or final response
            if any(update.startswith(prefix) for prefix in ["🔍", "🛠️", "✅", "❌", "💭", "🔄", "🌐", "📝", "📊", "⚠️"]):
                thinking_steps.append(update)
                thinking_md = "\n".join(thinking_steps)
                yield f"### 🤔 Đang xử lý... (ReAct Loop)\n{thinking_md}"
            else:
                # This is the final response
                final_response = update
                if thinking_steps:
                    thinking_md = "\n".join(thinking_steps)
                    yield f"<details><summary>🧠 <b>Quá trình suy nghĩ</b> ({len(thinking_steps)} bước)</summary>\n\n{thinking_md}\n\n</details>\n\n{final_response}"
                else:
                    yield final_response
                    
    except Exception as e:
        yield f"❌ **Lỗi Agent:** {str(e)}"


# Premium Theme
theme = gr.themes.Soft(
    primary_hue="blue",
    secondary_hue="slate",
    neutral_hue="zinc",
    font=[gr.themes.GoogleFont("Inter"), "ui-sans-serif", "system-ui", "sans-serif"],
).set(
    body_background_fill="*neutral_950",
    block_background_fill="*neutral_900",
    block_border_color="*neutral_800",
    button_primary_background_fill="*primary_600",
    button_primary_background_fill_hover="*primary_500",
)

with gr.Blocks(title="Gemma Finance AI", theme=theme) as demo:
    with gr.Row():
        with gr.Column(scale=4):
            gr.Markdown("""
            # 💎 Gemma Finance AI — ReAct Agent
            ### Trợ lý tài chính thông minh với khả năng tự suy nghĩ, tìm kiếm & phân tích đa bước.
            """)
        with gr.Column(scale=1):
            clear_btn = gr.Button("🗑️ Xóa bộ nhớ", variant="secondary", size="sm")

    with gr.Tab("💬 Trò chuyện"):
        chat_interface = gr.ChatInterface(
            fn=predict,
            examples=[
                "Giá Bitcoin và VN-Index hiện tại là bao nhiêu?",
                "Tin tức mới nhất về cổ phiếu Tesla (TSLA)?",
                "So sánh cổ phiếu FPT, VNM và HPG trong 30 ngày qua.",
                "Phân tích xu hướng cổ phiếu FPT gần đây.",
                "Thị trường chứng khoán Việt Nam hôm nay thế nào?",
                "P/E ratio là gì? Cách sử dụng khi đầu tư?",
            ]
        )

    with gr.Tab("📊 Thị trường"):
        with gr.Row():
            gr.Markdown("### 📡 Dữ liệu được Agent tìm kiếm và phân tích trực tiếp khi bạn đặt câu hỏi.")
        with gr.Row():
            gr.Dataframe(
                value=[
                    ["VN-INDEX", "Hỏi agent để cập nhật", "—"],
                    ["S&P 500", "Hỏi agent để cập nhật", "—"],
                    ["BTC/USDT", "Hỏi agent để cập nhật", "—"],
                ],
                headers=["Chỉ số", "Giá / Điểm", "Thay đổi"],
                label="Bảng theo dõi nhanh"
            )

    with gr.Accordion("⚙️ Kiến trúc & Công cụ"):
        gr.Markdown("""
        ### 🧠 ReAct Agent Architecture
        Agent sử dụng vòng lặp **Reason-Act** (tối đa 5 vòng) để:
        1. **Phân tích** yêu cầu → quyết định cần tools nào
        2. **Gọi tools** (có thể nhiều tools cùng lúc)
        3. **Đánh giá** kết quả → cần thêm dữ liệu không?
        4. **Tổng hợp** câu trả lời chuyên nghiệp
        
        ### 🛠️ Công cụ có sẵn
        | Tool | Mô tả |
        |------|--------|
        | `get_stock_price` | Giá cổ phiếu Mỹ (Yahoo Finance) |
        | `get_crypto_price` | Giá tiền điện tử (Binance) |
        | `get_vn_stock_price` | Giá cổ phiếu Việt Nam (VNStock) |
        | `get_vn_indices` | Chỉ số VN-Index, VN30, HNX, UPCOM |
        | `get_stock_history` | Dữ liệu lịch sử giá (phân tích xu hướng) |
        | `compare_stocks` | So sánh nhiều cổ phiếu VN |
        | `search_tavily` | Tìm kiếm tin tức web (Tavily) |
        | `scrape_web` | Đọc chi tiết trang web |
        
        ### 🔑 Model
        **Gemma 3 27B IT** — Google's open model, chạy qua Google AI API.
        """)

    def clear_session_memory(request: gr.Request):
        session_id = request.session_hash if request else "default"
        clear_memory(session_id)
        return None

    clear_btn.click(fn=clear_session_memory, outputs=[])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
