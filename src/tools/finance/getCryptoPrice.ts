const CRYPTO_MAPPING: Record<string, string> = {
  bitcoin: 'BTC',
  btc: 'BTC',
  ethereum: 'ETH',
  eth: 'ETH',
  'binance coin': 'BNB',
  bnb: 'BNB',
  solana: 'SOL',
  sol: 'SOL',
  cardano: 'ADA',
  ada: 'ADA',
  ripple: 'XRP',
  xrp: 'XRP',
  dogecoin: 'DOGE',
  doge: 'DOGE',
  polkadot: 'DOT',
  dot: 'DOT',
  'shiba inu': 'SHIB',
  shib: 'SHIB',
  avalanche: 'AVAX',
  avax: 'AVAX',
  chainlink: 'LINK',
  link: 'LINK',
  polygon: 'MATIC',
  matic: 'MATIC',
  toncoin: 'TON',
  ton: 'TON',
  tron: 'TRX',
  trx: 'TRX',
  near: 'NEAR',
  monero: 'XMR',
  litecoin: 'LTC',
  ltc: 'LTC',
  pepe: 'PEPE',
  sui: 'SUI',
  aptos: 'APT',
};

export async function getCryptoPrice(symbol: string): Promise<string> {
  let resolvedSymbol = '';
  try {
    const clean = (symbol || 'BTC').toLowerCase().trim();
    resolvedSymbol = CRYPTO_MAPPING[clean] || clean.toUpperCase();

    let pair = resolvedSymbol;
    if (!pair.includes('/')) {
      pair = `${pair}USDT`;
    } else {
      pair = pair.replace('/', '');
    }

    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
    if (!res.ok) {
      throw new Error(`Binance HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const lastPrice = parseFloat(data.lastPrice);
    const changePct = parseFloat(data.priceChangePercent);
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    const formatPrice = (val: number) => {
      if (isNaN(val)) return 'N/A';
      if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      if (val >= 1) return val.toFixed(4);
      if (val >= 0.01) return val.toFixed(6);
      return val.toFixed(8);
    };

    const changeSign = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;

    return `Crypto ${resolvedSymbol}/USDT: $${formatPrice(lastPrice)} (${changeSign}), 24h High: $${formatPrice(high)}, 24h Low: $${formatPrice(low)}, Exchange: Binance`;
  } catch (e: any) {
    return `[ERROR] Failed to fetch crypto ${symbol} (${resolvedSymbol}): ${e.message}`;
  }
}

