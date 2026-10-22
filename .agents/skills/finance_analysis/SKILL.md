---
name: finance_analysis
description: Kỹ năng phân tích tài chính chuyên sâu, đánh giá thị trường và cổ phiếu trên nền tảng client-side Gemma 4.
---

# Kỹ năng Phân tích Tài chính (Finance Analysis Skill)

Kỹ năng này trao quyền cho Agent thực hiện các phân tích tài chính chuyên sâu, từ cổ phiếu đơn lẻ đến xu hướng chỉ số vĩ mô, được hỗ trợ bởi khả năng suy luận logic vượt trội của **Gemma 4 (`gemma-4-26b-a4b-it`)**.

---

## 🛠️ Các Thành Phần Phân Tích

1. **Phân tích Xu hướng Kỹ thuật (Technical & Price Action)**:
   - Sử dụng công cụ `get_stock_history` để lấy dữ liệu OHLCV 30 - 90 ngày.
   - Tính toán biên độ dao động (Đỉnh/Đáy), tỷ lệ thay đổi % và chuỗi giá đóng cửa của 5 phiên gần nhất.
   - Kết hợp biểu đồ TradingView trực quan trên màn hình.

2. **So sánh Cổ phiếu Cùng Ngành (Peer Comparison)**:
   - Sử dụng công cụ `compare_stocks` để đối chiếu hiệu suất của nhiều mã cổ phiếu cùng nhóm ngành (ví dụ: Ngân hàng `VCB, CTG, TCB, MBB` hay Thép `HPG, HSG, NKG`).

3. **Tổng hợp Vĩ mô & Tin tức Thị trường (Macro & Market Sentiment)**:
   - Kết hợp chỉ số `get_vn_indices` (VN-Index, VN30, HNX, UPCOM) với giá Crypto (`get_crypto_price`) và Vàng (`get_gold_price`).
   - Tận dụng tính năng **Native Google Search Grounding** của Gemma 4 để tìm kiếm sự kiện kinh tế mới nhất trong ngày mà không bị hạn chế bởi kiến thức tĩnh.

---

## 📋 Tiêu Chuẩn Trình Bày Báo Cáo Phân Tích

Mỗi phân tích trả về người dùng phải tuân thủ cấu trúc chuẩn:
- **Tóm tắt nhanh (Executive Summary)**: Đưa ra nhận định tổng quan về xu hướng (Tích cực / Trung lập / Thận trọng).
- **Dữ liệu thực tế (Verified Metrics)**: Trình bày số liệu thị trường kèm mốc thời gian rõ ràng.
- **Phân tích chi tiết**: Nêu rõ nguyên nhân biến động, lực cầu/cung hoặc thông tin tác động từ tin tức vĩ mô.
- **Khuyến nghị & Quản trị rủi ro**: Đưa ra góc nhìn đầu tư thận trọng, kèm tuyên bố miễn trừ trách nhiệm.
