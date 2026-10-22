---
name: add_tool
description: Hướng dẫn thêm một công cụ tài chính hoặc web mới vào hệ thống React Client-Side Agent.
---

# Hướng dẫn thêm Tool mới vào hệ thống Chat Finance (React Client-Side)

Hệ thống hoạt động 100% trên trình duyệt (không sử dụng backend Python). Để thêm một công cụ (tool) mới cho Agent (`gemma-4-26b-a4b-it`) sử dụng, thực hiện theo 4 bước sau:

---

## Bước 1: Viết Logic cho Tool (TypeScript)

Tạo file mới trong thư mục tương ứng:
- Các tool tài chính: `src/tools/finance/` (ví dụ: `myFinanceTool.ts`)
- Các tool tra cứu web: `src/tools/web/` (ví dụ: `myWebTool.ts`)

**Yêu cầu kỹ thuật:**
- Hàm nhận tham số là một chuỗi (`input: string`) và trả về `Promise<string>`.
- Vì chạy trực tiếp trên trình duyệt, các API bên ngoài cần hỗ trợ **CORS** (như Binance REST API) hoặc sử dụng proxy / fallback hợp lý.
- Luôn bọc logic trong khối `try...catch` để bắt lỗi và trả về thông báo lỗi dạng chuỗi, tránh làm crash vòng lặp Agent.

**Ví dụ:**
```typescript
// src/tools/finance/getForexRate.ts
export async function getForexRate(pair: string): Promise<string> {
  try {
    const symbol = (pair || 'USDVND').toUpperCase().trim();
    // Gọi API tỷ giá công khai có hỗ trợ CORS
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data.rates['VND'];
    return `Tỷ giá USD/VND hiện tại: ${Number(rate).toLocaleString()} VND`;
  } catch (err: any) {
    return `[ERROR] Không thể lấy tỷ giá: ${err.message}`;
  }
}
```

---

## Bước 2: Đăng ký Tool vào Registry

Mở file [`src/tools/registry.ts`](file:///home/exblackhole/Desktop/Chat_finance/src/tools/registry.ts):
1. Import hàm vừa tạo.
2. Thêm vào đối tượng `TOOLS_MAP`.

```typescript
import { getForexRate } from './finance/getForexRate';

export const TOOLS_MAP: Record<string, ToolFunction> = {
  // ... các tools hiện có
  get_forex_rate: getForexRate,
};
```

---

## Bước 3: Cập nhật System Prompt cho Agent

Mở file [`src/agent/prompts.ts`](file:///home/exblackhole/Desktop/Chat_finance/src/agent/prompts.ts) và bổ sung mô tả tool vào `TOOL_DESCRIPTIONS`:

```typescript
export const TOOL_DESCRIPTIONS = `
...
9. **get_forex_rate**
   - Mục đích: Lấy tỷ giá ngoại tệ theo thời gian thực (USD/VND, EUR/VND...).
   - Input: Cặp tiền tệ (VD: "USDVND").
   - Khi nào dùng: Khi người dùng hỏi về tỷ giá hối đoái.
`;
```

*(Tùy chọn)* Bổ sung ví dụ vào `FEW_SHOT_EXAMPLES` trong cùng file để hướng dẫn Gemma 4 nhận diện ngữ cảnh gọi tool chuẩn xác hơn.

---

## Bước 4 (Tùy chọn): Hiển thị Dữ liệu Live trên Giao diện

Nếu muốn dữ liệu từ tool hiển thị thành một thẻ Card cập nhật tự động ở cột bên trái:
- Mở [`src/components/MarketPanel.tsx`](file:///home/exblackhole/Desktop/Chat_finance/src/components/MarketPanel.tsx).
- Gọi hàm tool trong `fetchAllMarketData()` và thêm thẻ hiển thị vào danh sách `cards`.

---

## Bước 5: Kiểm tra

1. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
2. Thử hỏi Agent trong ô Chat về dữ liệu của tool mới (ví dụ: *"Tỷ giá USD hôm nay thế nào?"*).
3. Kiểm tra tiến trình suy nghĩ: Agent sẽ tự động xuất hiện bước: `🛠️ Gọi tool: get_forex_rate → USDVND` và phân tích kết quả trả về.
4. Kiểm tra build:
   ```bash
   npm run build
   ```
