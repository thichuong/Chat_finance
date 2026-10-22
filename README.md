# Chat Finance (Serverless React Edition) 🤖📈

Hệ thống tư vấn tài chính thông minh chạy **100% trên trình duyệt (Client-Side Serverless React)**, được hỗ trợ bởi model **Gemma 4 (`gemma-4-26b-a4b-it`)**, vòng lặp **ReAct Agent** tự động và bộ công cụ tài chính thời gian thực.

Không cần cài đặt backend Python hay FastAPI! Chỉ cần mở trên trình duyệt là có thể sử dụng ngay.

---

## ✨ Tính Năng Nổi Bật

- **100% Serverless / Client-Side**: Toàn bộ luồng suy luận, vòng lặp Agent và gọi API đều diễn ra trực tiếp ngay trên trình duyệt của người dùng.
- **Model Gemma 4 (`gemma-4-26b-a4b-it`)**: Tích hợp tính năng suy luận chuyên sâu với `thinkingConfig: { thinkingLevel: "HIGH" }` và **Native Google Search Grounding**.
- **Vòng lặp ReAct Agent độc lập**:
  - `reasonNode` ↔ `executeToolsNode` (tối đa 5 vòng lặp) ➔ `generateResponseNode`.
  - Hiển thị tiến trình suy nghĩ (Thinking Steps) theo thời gian thực: `🔍 Phân tích`, `💭 Suy nghĩ`, `🛠️ Gọi tool`, `🌐 Google Search`, `✅ Kết quả`.
- **Bộ công cụ tài chính thời gian thực (Client-Side)**:
  - `get_crypto_price`: Tỷ giá tiền điện tử trực tiếp từ Binance.
  - `get_vn_indices`: Chỉ số VN-Index, VN30, HNX, UPCOM.
  - `get_vn_stock_price`: Giá cổ phiếu Việt Nam (VNM, FPT, VIC, HPG...).
  - `get_stock_history`: Lịch sử giá N ngày, tính % biến động, mức cao nhất/thấp nhất và xu hướng 5 phiên.
  - `compare_stocks`: So sánh cùng lúc nhiều cổ phiếu.
  - `get_stock_price`: Giá cổ phiếu Mỹ (AAPL, TSLA, NVDA...).
  - `get_gold_price`: Giá vàng thế giới (XAU/USD).
  - `google_search`: Tìm kiếm thông tin mới nhất trên Google qua model Gemma 4.
- **Giao diện Modern Finance Terminal**:
  - Thiết kế Dark Mode Glassmorphism cao cấp.
  - Biểu đồ phân tích kỹ thuật TradingView tích hợp sẵn.
  - Hộp thoại cấu hình Google API Key trực tiếp trên UI (lưu trong `localStorage`).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu môi trường
- Node.js >= 18.x
- npm >= 9.x

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:3000`.

### 4. Đóng gói ứng dụng tĩnh (Production Build)
```bash
npm run build
```
Kết quả được tạo trong thư mục `dist/`. Bạn có thể triển khai thư mục này lên bất kỳ dịch vụ tĩnh nào (GitHub Pages, Vercel, Netlify, Cloudflare Pages, S3...) hoặc mở xem thử:
```bash
npm run preview
```

---

## 🔑 Cấu Hình Google API Key

Ứng dụng hỗ trợ 2 cách thiết lập API Key:
1. **Trực tiếp trên giao diện**: Bấm vào biểu tượng bánh răng ⚙️ (Cài đặt) ở góc phải thanh Chat và nhập `GOOGLE_API_KEY` của bạn. Key sẽ được lưu an toàn trong `localStorage` của trình duyệt.
2. **File biến môi trường**: Tạo file `.env` với nội dung:
   ```env
   VITE_GOOGLE_API_KEY=your_google_ai_studio_api_key_here
   ```
