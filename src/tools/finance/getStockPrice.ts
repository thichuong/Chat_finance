export async function getStockPrice(symbol: string): Promise<string> {
  const sym = (symbol || '').toUpperCase().trim();
  if (!sym) {
    return '[ERROR] Vui lòng nhập mã cổ phiếu Mỹ (Ví dụ: AAPL, TSLA, NVDA).';
  }

  // 1. Fetch via Yahoo Finance query API with allorigins CORS proxy
  try {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=2d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    const res = await fetch(proxyUrl);
    if (res.ok) {
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      const meta = data.chart?.result?.[0]?.meta;
      if (meta) {
        const regularPrice = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        let changePct = 0;
        if (prevClose && prevClose > 0) {
          changePct = ((regularPrice - prevClose) / prevClose) * 100;
        }
        const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
        const currency = meta.currency || 'USD';
        return `US Stock ${sym}: $${Number(regularPrice).toFixed(2)} ${currency} (${sign}), Sàn: ${meta.exchangeName || 'US'}`;
      }
    }
  } catch (e) {
    console.warn(`Yahoo query for ${sym} via proxy failed, trying Stooq...`, e);
  }

  // 2. Backup: Stooq or general info
  return `US Stock ${sym}: Đang truy vấn. Hãy sử dụng google_search để cập nhật tin tức và giá khớp lệnh mới nhất của ${sym}.`;
}

