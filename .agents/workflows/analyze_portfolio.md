# Quy trình Phân tích Danh mục Đầu tư (Portfolio Analysis Workflow)

Quy trình chuẩn giúp Agent tiếp nhận và phân tích danh mục tài sản của người dùng thông qua vòng lặp ReAct Client-Side.

---

## 🗒️ Các Bước Thực Hiện

1. **Thu thập Danh mục Người dùng (Portfolio Intake)**:
   - Trích xuất danh sách các mã tài sản (Cổ phiếu VN, Cổ phiếu Mỹ, Crypto, Vàng) và tỷ trọng / giá vốn nếu người dùng cung cấp.

2. **Gọi Công cụ Lấy Dữ liệu Thời gian Thực (Live Data Retrieval)**:
   - Tự động gọi song song các tool liên quan:
     - `get_vn_stock_price` / `compare_stocks` cho cổ phiếu Việt Nam.
     - `get_stock_price` cho cổ phiếu Mỹ.
     - `get_crypto_price` cho các đồng coin (BTC, ETH, SOL...).
     - `get_gold_price` cho vàng.

3. **Tính toán Hiệu suất & Biến động**:
   - So sánh thị giá hiện tại với giá vốn (nếu có).
   - Đánh giá biến động 30 ngày qua công cụ `get_stock_history`.

4. **Đánh giá Đa dạng hóa & Rủi ro**:
   - Phân tích mức độ tập trung theo ngành (ví dụ: quá 30% vào 1 mã đơn lẻ hoặc 1 ngành cụ thể).
   - Đối chiếu với xu hướng chung của thị trường qua `get_vn_indices`.

5. **Tổng hợp & Báo cáo Bằng Gemma 4**:
   - Trình bày bảng phân tích danh mục rõ ràng (Bảng Markdown).
   - Đưa ra nhận xét khách quan và đề xuất tái cân bằng (Rebalancing) danh mục nếu mức độ rủi ro quá cao.
