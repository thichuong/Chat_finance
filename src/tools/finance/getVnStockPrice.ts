export async function getVnStockPrice(symbol: string): Promise<string> {
  let sym = (symbol || '').trim();

  // Parse if input is JSON string like {"symbol": "HPG"} or has quotes
  if (sym.startsWith('{')) {
    try {
      const parsed = JSON.parse(sym);
      sym = (parsed.symbol || parsed.code || parsed.ticker || '').trim();
    } catch {
      // ignore
    }
  }
  sym = sym.replace(/["'`{}]/g, '').toUpperCase().trim();

  if (!sym) {
    return '[ERROR] Vui lòng cung cấp mã cổ phiếu VN (ví dụ: VNM, FPT, VIC, HPG).';
  }

  try {
    // 1. DNSE Entrade Daily OHLC API (Fast & Reliable)
    const now = Math.floor(Date.now() / 1000);
    const from = now - 10 * 86400; // 10 days window to guarantee at least 2 trading days
    const res = await fetch(
      `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${from}&to=${now}&symbol=${sym}&resolution=1D`
    );

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.c) && data.c.length > 0) {
        const len = data.c.length;
        const latestClose = data.c[len - 1] * 1000;
        const prevClose = len > 1 ? data.c[len - 2] * 1000 : latestClose;
        const change = latestClose - prevClose;
        const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
        const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;

        const vol = Array.isArray(data.v) && data.v.length >= len ? data.v[len - 1] : 'N/A';
        const high = (Array.isArray(data.h) && data.h.length >= len ? data.h[len - 1] : data.c[len - 1]) * 1000;
        const low = (Array.isArray(data.l) && data.l.length >= len ? data.l[len - 1] : data.c[len - 1]) * 1000;

        return `VN Stock ${sym}: ${latestClose.toLocaleString('vi-VN')} VND (${sign}), Cao: ${high.toLocaleString('vi-VN')} VND, Thấp: ${low.toLocaleString('vi-VN')} VND, Volume: ${typeof vol === 'number' ? vol.toLocaleString('vi-VN') : vol}`;
      }
    }
  } catch (e) {
    console.warn(`DNSE stock fetch failed for ${sym}:`, e);
  }

  // 2. VNDirect Finfo API Fallback
  try {
    const res = await fetch(`https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date&q=code:${sym}&size=2`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length > 0) {
        const latest = json.data[0];
        const prev = json.data[1];
        const price = (latest.close || latest.price) * 1000;
        let changePct = 0;
        if (prev && prev.close > 0) {
          changePct = ((latest.close - prev.close) / prev.close) * 100;
        }
        const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
        const vol = latest.nmVolume || latest.volume || 'N/A';
        return `VN Stock ${sym}: ${price.toLocaleString('vi-VN')} VND (${sign}), Volume: ${typeof vol === 'number' ? vol.toLocaleString('vi-VN') : vol}, Date: ${latest.date}`;
      }
    }
  } catch (e2: any) {
    console.warn('VNDirect stock price fetch failed:', e2);
  }

  return `[ERROR] Không thể lấy giá cho cổ phiếu ${sym}. Hãy kiểm tra mã hoặc sử dụng google_search để tìm giá mới nhất.`;
}

