import os
import gradio as gr
from backend.agent import get_graph_response
from dotenv import load_dotenv

load_dotenv()

# Check for API Keys
API_KEY = os.environ.get("GOOGLE_API_KEY")

def predict(message, history):
    """Generates a response using the LangGraph agent."""
    if not API_KEY:
        return "Lỗi: Chưa cấu hình GOOGLE_API_KEY trong file .env"

    try:
        # LangGraph entry point
        response = get_graph_response(message)
        return response
    except Exception as e:
        return f"Error in LangGraph Agent: {str(e)}"

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

with gr.Blocks(title="Gemma Finance AI") as demo:
    with gr.Row():
        with gr.Column(scale=4):
            gr.Markdown("""
            # 💎 Gemma Finance AI (LangGraph Edition)
            ### Trợ lý tài chính sử dụng kiến trúc Agentic Workflow.
            """)
        with gr.Column(scale=1):
            gr.Markdown("![Logo](https://raw.githubusercontent.com/google/gemma-3/main/assets/gemma_logo.png)")

    with gr.Tab("💬 Trò chuyện"):
        chat_interface = gr.ChatInterface(
            fn=predict,
            examples=[
                "Giá Bitcoin và VN-Index hiện tại là bao nhiêu?",
                "Tin tức mới nhất về cổ phiếu Tesla (TSLA)?",
                "Phân tích cổ phiếu VinFast hiện nay.",
                "Thị trường chứng khoán Việt Nam hôm nay thế nào?"
            ]
        )

    with gr.Tab("📊 Thị trường"):
        with gr.Row():
            gr.Markdown("### Ghi chú: Dữ liệu thời gian thực được cập nhật khi bạn đặt câu hỏi trong chat.")
        with gr.Row():
            gr.Dataframe(
                value=[
                    ["VN-INDEX", "1,280.90", "+0.85%"],
                    ["S&P 500", "5,241.53", "+1.12%"],
                    ["BTC/USDT", "69,431.20", "-0.45%"]
                ],
                headers=["Chỉ số", "Giá / Điểm", "Thay đổi"],
                label="Bảng theo dõi nhanh"
            )

    with gr.Accordion("⚙️ Cấu hình & Công cụ"):
        gr.Markdown("""
        - **LangGraph**: Điều phối quy trình làm việc.
        - **Yahoo Finance**: Dữ liệu chứng khoán Hoa Kỳ.
        - **Binance**: Dữ liệu tiền điện tử.
        - **VNstock**: Dữ liệu chứng khoán Việt Nam.
        - **Tavily**: Web search thông minh.
        """)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, theme=theme)
