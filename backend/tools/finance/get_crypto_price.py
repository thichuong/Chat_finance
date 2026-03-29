from langchain_core.tools import tool
import ccxt

# Mapping for common crypto names to their ticker symbols
CRYPTO_MAPPING = {
    "bitcoin": "BTC", "btc": "BTC",
    "ethereum": "ETH", "eth": "ETH",
    "binance coin": "BNB", "bnb": "BNB",
    "solana": "SOL", "sol": "SOL",
    "cardano": "ADA", "ada": "ADA",
    "ripple": "XRP", "xrp": "XRP",
    "dogecoin": "DOGE", "doge": "DOGE",
    "polkadot": "DOT", "dot": "DOT",
    "shiba inu": "SHIB", "shib": "SHIB",
    "avalanche": "AVAX", "avax": "AVAX",
    "chainlink": "LINK", "link": "LINK",
    "polygon": "MATIC", "matic": "MATIC",
    "toncoin": "TON", "ton": "TON",
    "tron": "TRX", "trx": "TRX",
    "near": "NEAR", "monero": "XMR",
    "litecoin": "LTC", "ltc": "LTC",
    "pepe": "PEPE", "sui": "SUI", "aptos": "APT",
}

@tool
def get_crypto_price(symbol: str) -> str:
    """Gets the current cryptocurrency price from Binance exchange.
    Accepts coin names (bitcoin, ethereum) or symbols (BTC, ETH). Default pair is /USDT.
    Input: Coin name or symbol (e.g. "bitcoin", "ETH", "solana").
    """
    resolved_symbol = ""
    try:
        clean_symbol = symbol.lower().strip()
        resolved_symbol = CRYPTO_MAPPING.get(clean_symbol, clean_symbol.upper())
        
        if "/" not in resolved_symbol:
            resolved_symbol = f"{resolved_symbol}/USDT"
        else:
            resolved_symbol = resolved_symbol.upper()

        exchange = ccxt.binance()
        ticker_data = exchange.fetch_ticker(resolved_symbol)
        last_price = ticker_data['last']
        change_pct = ticker_data.get('percentage')
        change_str = f" ({change_pct:+.2f}%)" if change_pct else ""
        high = ticker_data.get('high', 'N/A')
        low = ticker_data.get('low', 'N/A')
        
        return (
            f"Crypto {resolved_symbol}: ${last_price:,.2f}{change_str}"
            f", 24h High: ${high:,.2f}, 24h Low: ${low:,.2f}"
            f", Exchange: Binance"
        )
    except Exception as e:
        return f"[ERROR] Failed to fetch crypto {symbol} (resolved: {resolved_symbol}): {str(e)}"
