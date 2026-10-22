export async function getVnStockPrice(symbol: string): Promise<string> {
  const sym = (symbol || '').toUpperCase().trim();
  if (!sym) {
    return '[ERROR] Vui lòng cung cấp mã cổ phiếu VN (ví dụ: VNM, FPT, VIC, HPG).';
  }

  try {
    // 1. DNSE Entrade Realtime API
    const res = await fetch(`https://services.entrade.com.vn/chart-api/v2/ticks/${sym}?size=1`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const price = (item.price || item.p || 0) * 1000;
        const changePct = item.changePercent || item.cp || 0;
        const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
        const volume = item.volume || item.v || 'N/A';
        return `VN Stock ${sym}: ${price.toLocaleString('vi-VN')} VND (${sign}), Volume: ${volume.toLocaleString ? volume.toLocaleString() : volume}`;
      }
    }
  } catch (e) {
    console.warn('DNSE tick fetch failed, trying VNDirect...', e);
  }

  try {
    // 2. VNDirect Finfo API
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
        return `VN Stock ${sym}: ${price.toLocaleString('vi-VN')} VND (${sign}), Volume: ${typeof vol === 'number' ? vol.toLocaleString() : vol}, Date: ${latest.date}`;
      }
    }
  } catch (e2: any) {
    console.warn('VNDirect stock price fetch failed', e2);
  }

  return `[ERROR] Không thể lấy giá cho cổ phiếu ${sym}. Hãy kiểm tra mã hoặc sử dụng google_search để tìm giá mới nhất.`;
}

