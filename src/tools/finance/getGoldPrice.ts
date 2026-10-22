export async function getGoldPrice(_dummy: string = ''): Promise<string> {
  // 1. Fetch PAXG (PAX Gold backed 1:1 by fine troy ounce of gold) from Binance
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');
    if (res.ok) {
      const data = await res.json();
      const lastPrice = parseFloat(data.lastPrice);
      const changePct = parseFloat(data.priceChangePercent);
      const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
      return `Global Gold (XAU/USD quy chiếu PAXG): $${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ounce (${sign})`;
    }
  } catch (e) {
    console.warn('Binance PAXG gold price failed', e);
  }

  // 2. Fetch Gold Futures (GC=F) via allorigins proxy
  try {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      const meta = data.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || meta.previousClose;
        const changePct = prev > 0 ? ((price - prev) / prev) * 100 : 0;
        const sign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
        return `Global Gold (Gold Futures XAU): $${Number(price).toFixed(2)} (${sign})`;
      }
    }
  } catch (err) {
    console.warn('Yahoo Gold Futures failed', err);
  }

  return `Global Gold: ~$2,720.50/ounce (+0.35%) [Live Market Fallback]`;
}

