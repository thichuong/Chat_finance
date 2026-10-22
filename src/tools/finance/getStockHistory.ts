export async function getStockHistory(params: string): Promise<string> {
  let symbol = '';
  let days = 30;

  try {
    const raw = (params || '').trim();
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      symbol = (parsed.symbol || '').toUpperCase().trim();
      days = parseInt(parsed.days || '30', 10);
    } else {
      const parts = raw.split(/[\s,]+/);
      symbol = parts[0]?.toUpperCase().trim();
      if (parts[1]) {
        const d = parseInt(parts[1], 10);
        if (!isNaN(d)) days = d;
      }
    }

    if (!symbol) {
      return '[ERROR] Chưa có mã cổ phiếu. Ví dụ: "FPT" hoặc "FPT 30"';
    }

    // DNSE Entrade History endpoint
    const toTimestamp = Math.floor(Date.now() / 1000);
    const fromTimestamp = toTimestamp - days * 86400;
    const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromTimestamp}&to=${toTimestamp}&symbol=${symbol}&resolution=1D`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.c || data.c.length === 0) {
      return `[ERROR] Không tìm thấy dữ liệu lịch sử cho mã ${symbol}.`;
    }

    const closes = data.c.map((val: number) => val * 1000);
    const volumes = data.v || [];

    const latest = closes[closes.length - 1];
    const oldest = closes[0];
    const highest = Math.max(...closes);
    const lowest = Math.min(...closes);

    const totalChange = oldest > 0 ? ((latest - oldest) / oldest) * 100 : 0;
    const avgVolume = volumes.length > 0 ? volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length : 0;

    const recent5 = closes.slice(-5).map((p: number) => p.toLocaleString('vi-VN'));
    const trendStr = recent5.join(' → ');

    const sign = totalChange >= 0 ? `+${totalChange.toFixed(2)}%` : `${totalChange.toFixed(2)}%`;

    return `Lịch sử ${symbol} (${days} ngày): Giá hiện tại: ${latest.toLocaleString('vi-VN')} VND, Biến động: ${sign}, Cao nhất: ${highest.toLocaleString('vi-VN')}, Thấp nhất: ${lowest.toLocaleString('vi-VN')}, Khối lượng TB: ${Math.round(avgVolume).toLocaleString()}, Xu hướng 5 phiên gần nhất: ${trendStr}`;
  } catch (err: any) {
    return `[ERROR] Không thể lấy lịch sử cho ${params}: ${err.message}`;
  }
}

