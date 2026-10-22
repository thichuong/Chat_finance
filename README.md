# Chat Finance 🤖📈
### Hệ Thống Cố Vấn Tài Chính AI Serverless (React + Gemma 4 + Cloudflare Worker)

[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare)](https://chat-finance-worker.exblackhole.workers.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Model](https://img.shields.io/badge/Model-gemma--4--26b--a4b--it-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

> 🌐 **Bản Live Demo trên Cloudflare Worker:**  
> 👉 **[https://chat-finance-worker.exblackhole.workers.dev](https://chat-finance-worker.exblackhole.workers.dev)**

---

## 🌟 Giới Thiệu

**Chat Finance** là ứng dụng web tư vấn tài chính thông minh hoạt động theo kiến trúc **100% Serverless / Client-Side**. 

Toàn bộ logic suy luận, điều phối vòng lặp Agent (ReAct Loop), gọi các API dữ liệu thị trường và tích hợp mô hình **Gemma 4 (`gemma-4-26b-a4b-it`)** đều được thực thi trực tiếp ngay trên trình duyệt của người dùng mà không cần bất kỳ máy chủ backend Python hay Node.js nào.

---

## ⚡ Các Tính Năng Nổi Bật

- **100% Serverless & Client-Side**: Trình duyệt kết nối trực tiếp với Google Generative AI API và các API tài chính công khai qua CORS/REST.
- **Model Gemma 4 (`gemma-4-26b-a4b-it`)**:
  - Chế độ suy luận sâu: `thinkingConfig: { thinkingLevel: "HIGH" }`.
  - Tích hợp công cụ tìm kiếm nguyên bản **Native Google Search Grounding** với nguồn dẫn minh bạch.
- **Vòng lặp ReAct Agent Trực quan**:
  - Luồng quyết định linh hoạt: `reasonNode` ↔ `executeToolsNode` (tối đa 5 vòng lặp) ➔ `generateResponseNode`.
  - Hiển thị tiến trình suy nghĩ (**Thinking Steps**) trực tiếp theo thời gian thực:
    - 🔍 *Phân tích yêu cầu*
    - 🌐 *Sử dụng Google Search nguyên bản*
    - 💭 *Suy nghĩ (Gemma 4)*
    - 🛠️ *Gọi công cụ tài chính*
    - ✅ *Kết quả thu thập*
    - 📊 *Tổng hợp báo cáo chuyên sâu*
- **Hệ thống Công cụ Tài chính Thời gian Thực (Client-Side)**:
  - `get_crypto_price`: Tỷ giá tiền điện tử trực tiếp từ sàn Binance (BTC, ETH, SOL...).
  - `get_vn_indices`: Điểm số thị trường VN-Index, VN30, HNX, UPCOM.
  - `get_vn_stock_price`: Giá khớp lệnh cổ phiếu Việt Nam (VNM, FPT, VIC, HPG...).
  - `get_stock_history`: Lịch sử giá N ngày, tính % biến động, mức đỉnh/đáy và xu hướng 5 phiên.
  - `compare_stocks`: So sánh hiệu suất nhiều cổ phiếu cùng ngành.
  - `get_stock_price`: Giá cổ phiếu Mỹ (AAPL, TSLA, NVDA...).
  - `get_gold_price`: Giá vàng thế giới (XAU/USD).
  - `google_search`: Tra cứu tin tức vĩ mô mới nhất qua Gemma 4.
- **Giao diện Finance Terminal Cao Cấp**:
  - Giao diện Dark Mode Glassmorphism hiện đại.
  - Tích hợp biểu đồ phân tích kỹ thuật trực tiếp từ **TradingView**.
  - Hộp thoại quản lý **Google API Key** trực tiếp trên giao diện (lưu trong `localStorage`, bảo mật và tiện lợi).

---

## 📁 Cấu Trúc Dự Án

```text
Chat_finance/
├── index.html                   # HTML Entry point
├── package.json                 # Cấu hình dependencies (React 18, Vite 6, @google/genai, Wrangler)
├── vite.config.ts               # Cấu hình Vite & path aliases
├── tsconfig.json                # Cấu hình TypeScript
├── wrangler.jsonc               # Cấu hình Deploy Cloudflare Worker (Static Assets)
├── public/                      # Static assets (logo, favicon, icons)
├── src/
│   ├── main.tsx                 # Entry point React
│   ├── App.tsx                  # Layout chính (MarketPanel + ChatPanel + ApiKeyModal)
│   ├── index.css                # CSS thiết kế Glassmorphism
│   ├── config/
│   │   └── constants.ts         # Hằng số (Model name, MAX_ITERATIONS = 5)
│   ├── agent/                   # Core ReAct Agent chạy trên trình duyệt
│   │   ├── state.ts             # Interface AgentState, StepRecord, ToolResult
│   │   ├── prompts.ts           # Prompt templates, few-shot examples
│   │   ├── memory.ts            # Quản lý bộ nhớ hội thoại sliding window (localStorage)
│   │   ├── utils.ts             # Parse JSON đa tầng, format công cụ & thời gian
│   │   ├── llmClient.ts         # Khởi tạo SDK @google/genai với model gemma-4-26b-a4b-it
│   │   ├── graph.ts             # Bộ điều phối vòng lặp ReAct dưới dạng Async Generator
│   │   └── nodes/
│   │       ├── reasonNode.ts            # Node phân tích & quyết định gọi tool
│   │       ├── executeToolsNode.ts      # Node thực thi song song các tools
│   │       └── generateResponseNode.ts  # Node tổng hợp phản hồi cuối cùng
│   ├── tools/                   # Bộ công cụ tài chính client-side
│   │   ├── registry.ts          # TOOLS_MAP đăng ký danh sách tools
│   │   ├── finance/             # Các tools: Crypto, VN-Index, VN Stocks, US Stocks, Vàng
│   │   └── web/                 # Tool Google Search qua Gemma 4
│   └── components/              # Các UI Components
│       ├── MarketPanel.tsx      # Cột trái: Thẻ chỉ số live & Biểu đồ TradingView
│       ├── ChatPanel.tsx        # Cột phải: Khung chat, Thinking steps & gợi ý câu hỏi
│       ├── MessageBubble.tsx    # Bong bóng chat hỗ trợ Markdown, bảng biểu
│       ├── TradingViewChart.tsx # Biểu đồ kỹ thuật TradingView widget
│       └── ApiKeyModal.tsx      # Modal nhập & lưu Google API Key
└── .agents/                     # Rules, Skills và Workflows mở rộng cho Agent
    ├── rules/agent_rules.md
    ├── skills/add_tool/SKILL.md
    ├── skills/finance_analysis/SKILL.md
    └── workflows/analyze_portfolio.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local Dev)

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Trình duyệt sẽ tự động mở tại `http://localhost:3000`.

### 3. Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
Thư mục tĩnh `dist/` sẽ được tạo ra với đầy đủ assets đã được tối ưu hóa và nén.

---

## ☁️ Hướng Dẫn Deploy Lên Cloudflare Worker

Dự án đã được cấu hình sẵn file [`wrangler.jsonc`](file:///home/exblackhole/Desktop/Chat_finance/wrangler.jsonc) với chế độ **Static Assets Single-Page Application (SPA)**.

### Các bước thực hiện bằng lệnh CLI:

1. **Build mã nguồn:**
   ```bash
   npm run build
   ```

2. **Đăng nhập Cloudflare (nếu chưa đăng nhập):**
   ```bash
   npx wrangler login
   ```

3. **Deploy lên Cloudflare Worker:**
   ```bash
   npx wrangler deploy
   ```

Mỗi khi bạn cập nhật code trong tương lai, chỉ cần chạy lại 2 lệnh:
```bash
npm run build && npx wrangler deploy
```

---

## 🔑 Thiết Lập Google API Key

Ứng dụng sử dụng API của Google Gemini / Gemma:
1. Bạn có thể lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Khi mở ứng dụng lần đầu, bấm vào biểu tượng bánh răng ⚙️ trên thanh tiêu đề để nhập API Key. Key được lưu an toàn trong trình duyệt của bạn (`localStorage`).
3. Hoặc tạo file `.env` với nội dung:
   ```env
   VITE_GOOGLE_API_KEY=AIzaSy...
   ```

---

## 📜 Giấy Phép & Tuyên Bố Trách Nhiệm

- Dự án được phát triển nhằm mục đích nghiên cứu và hỗ trợ tra cứu thông tin tài chính cá nhân.
- Mọi dữ liệu và phân tích chỉ mang tính chất tham khảo, không cấu thành lời khuyên đầu tư tài chính chuyên nghiệp.
