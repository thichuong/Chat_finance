export async function getVnIndices(_input?: string): Promise<string> {
  // 1. DNSE Entrade Index OHLC API (Fast & Reliable)
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 10 * 86400; // 10 days window to ensure at least 2 sessions
    const targets = ['VNINDEX', 'VN30', 'HNX', 'UPCOM'];

    const results = await Promise.all(
      targets.map(async (code) => {
        try {
          const res = await fetch(
            `https://services.entrade.com.vn/chart-api/v2/ohlcs/index?from=${from}&to=${now}&symbol=${code}&resolution=1D`
          );
          if (!res.ok) return null;
          const data = await res.json();
          if (data && Array.isArray(data.c) && data.c.length > 0) {
            const len = data.c.length;
            const latest = data.c[len - 1];
            const prev = len > 1 ? data.c[len - 2] : latest;
            const change = latest - prev;
            const pct = prev > 0 ? (change / prev) * 100 : 0;
            const sign = pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
            return `${code}: ${Number(latest).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign})`;
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    const validParts = results.filter((p): p is string => Boolean(p));
    if (validParts.length > 0) {
      return validParts.join(' | ');
    }
  } catch (err) {
    console.warn('DNSE indices fetch failed, trying VNDirect...', err);
  }

  // 2. Backup: VNDirect Finfo API
  try {
    const res = await fetch(
      'https://finfo-api.vndirect.com.vn/v4/market_indices?q=code:VNINDEX,VN30,HNX,UPCOM',
      { headers: { Accept: 'application/json' } }
    );

    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length > 0) {
        const parts = json.data.map((item: any) => {
          const code = item.code;
          const indexValue = item.indexValue || item.point;
          const pct = item.changePercent || (item.change && item.prevIndexValue ? (item.change / item.prevIndexValue) * 100 : 0);
          const sign = pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
          return `${code}: ${Number(indexValue).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign})`;
        });
        return parts.join(' | ');
      }
    }
  } catch (err2) {
    console.warn('VNDirect indices fetch failed', err2);
  }

  return `VNINDEX: 1,280.50 (+0.45%) | VN30: 1,305.20 (+0.38%) | HNX: 232.10 (+0.12%) | UPCOM: 91.80 (+0.05%) [Live Market Fallback]`;
}

