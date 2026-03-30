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
        
        # Dynamic precision based on price
        def format_price(val):
            if val is None or val == 'N/A': return 'N/A'
            if val >= 1000: return f"{val:,.4f}"
            if val >= 1: return f"{val:,.4f}"
            if val >= 0.01: return f"{val:,.6f}"
            return f"{val:,.8f}"

        # Special casing Bitcoin for 4 decimals if requested, but let's use the rule above.
        # Actually, for Bitcoin, even 2 decimals is fine, but the user asked for "more accurate".
        # Let's use 4 decimals for any major crypto if it's not super high.
        # But wait, 1 Bitcoin is ~60-100k, so 2 decimals is already quite high precision in terms of USD.
        # Maybe "more accurate" means providing 4-6 decimals.
        
        display_price = format_price(last_price)
        display_high = format_price(high)
        display_low = format_price(low)
        
        return (
            f"Crypto {resolved_symbol}: ${display_price}{change_str}"
            f", 24h High: ${display_high}, 24h Low: ${display_low}"
            f", Exchange: Binance"
        )
    except Exception as e:
        return f"[ERROR] Failed to fetch crypto {symbol} (resolved: {resolved_symbol}): {str(e)}"
