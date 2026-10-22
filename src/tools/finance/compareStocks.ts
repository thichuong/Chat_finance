import { getVnStockPrice } from './getVnStockPrice';

export async function compareStocks(symbols: string): Promise<string> {
  try {
    const list = (symbols || '')
      .split(/[,|\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0)
      .slice(0, 5);

    if (list.length === 0) {
      return '[ERROR] Vui lòng nhập các mã cổ phiếu cách nhau bởi dấu phẩy (Ví dụ: FPT, VNM, HPG)';
    }

    const results = await Promise.all(
      list.map(async (sym) => {
        const res = await getVnStockPrice(sym);
        return res;
      })
    );

    return results.join('\n---\n');
  } catch (err: any) {
    return `[ERROR] Không thể so sánh các cổ phiếu: ${err.message}`;
  }
}

