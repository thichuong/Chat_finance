from langchain_core.tools import tool
import json
import re
import yfinance as ticker
import ccxt
from vnstock import *
import pandas as pd
from typing import Optional

@tool
def get_stock_price(symbol: str) -> str:
    """Gets the current stock price and basic info for a given US stock ticker symbol.
    Use this for NYSE/NASDAQ stocks like AAPL, TSLA, GOOGL, MSFT, AMZN, META.
    Input: Stock ticker symbol (e.g. "AAPL").
    """
    try:
        stock = ticker.Ticker(symbol.upper().strip())
        info = stock.info
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        if not current_price:
            return f"[ERROR] Could not find price for {symbol}. Check if the ticker is correct."
        
        change = info.get("regularMarketChangePercent")
        change_str = f" ({change:+.2f}%)" if change else ""
        market_cap = info.get("marketCap")
        cap_str = f", Market Cap: ${market_cap:,.0f}" if market_cap else ""
        
        return (
            f"US Stock {symbol.upper()}: ${current_price}{change_str}"
            f", Name: {info.get('longName', 'N/A')}"
            f"{cap_str}"
            f", Currency: {info.get('currency', 'USD')}"
        )
    except Exception as e:
        return f"[ERROR] Failed to fetch US stock {symbol}: {str(e)}"

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

@tool
def get_vn_stock_price(symbol: str) -> str:
    """Gets the current price of a Vietnamese stock (HOSE/HNX/UPCOM).
    Input: Vietnamese stock symbol (e.g. "VNM", "FPT", "VIC", "HPG", "VHM", "MWG").
    """
    try:
        v = Vnstock()
        df = v.stock(symbol=symbol.upper().strip()).quote.history(
            start='2024-01-01', 
            end=pd.Timestamp.now().strftime('%Y-%m-%d')
        )
        
        if df is None or df.empty:
            return f"[ERROR] No data found for Vietnamese stock {symbol}."
        
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2] if len(df) > 1 else None
        
        price = last_row['close'] * 1000
        change_str = ""
        if prev_row is not None:
            prev_close = prev_row['close'] * 1000
            if prev_close > 0:
                change_pct = ((price - prev_close) / prev_close) * 100
                change_str = f" ({change_pct:+.2f}%)"
        
        volume = last_row.get('volume', 'N/A')
        vol_str = f", Volume: {int(volume):,}" if volume != 'N/A' else ""
        
        return (
            f"VN Stock {symbol.upper()}: {price} VND{change_str}"
            f"{vol_str}"
            f", Date: {last_row['time']}"
        )
    except Exception as e:
        return f"[ERROR] Failed to fetch VN stock {symbol}: {str(e)}"

@tool
def get_vn_indices() -> str:
    """Gets current levels of major Vietnamese market indices: VN-Index, VN30, HNX, UPCOM.
    Input: No input needed (pass empty string "").
    """
    try:
        v = Vnstock()
        indices = ['VNINDEX', 'VN30', 'HNX', 'UPCOM']
        results = []
        
        for index in indices:
            try:
                df = v.stock(symbol=index, source='VCI').quote.history(
                    start=(pd.Timestamp.now() - pd.Timedelta(days=7)).strftime('%Y-%m-%d'), 
                    end=pd.Timestamp.now().strftime('%Y-%m-%d')
                )
                
                if df is not None and not df.empty:
                    last_row = df.iloc[-1]
                    price = last_row['close']
                    
                    # Calculate change if we have previous data
                    change_str = ""
                    if len(df) > 1:
                        prev = df.iloc[-2]['close']
                        if prev > 0:
                            change_pct = ((price - prev) / prev) * 100
                            change_str = f" ({change_pct:+.2f}%)"
                    
                    results.append(f"{index}: {price:,.2f}{change_str} [{last_row['time']}]")
                else:
                    results.append(f"{index}: No data")
            except Exception:
                results.append(f"{index}: Error")
                
        return " | ".join(results)
    except Exception as e:
        return f"[ERROR] Failed to fetch VN indices: {str(e)}"


@tool
def get_stock_history(params: str) -> str:
    """Gets historical price data for a Vietnamese stock to analyze trends over time.
    Input: Stock symbol, optionally followed by number of days (e.g. "FPT", "FPT 30", "VNM 60").
    Default: 30 days if not specified.
    """
    import json as _json
    
    try:
        params = str(params).strip()
        
        # Strategy 1: JSON input like {"symbol": "FPT", "days": 30}
        if params.startswith("{"):
            try:
                data = _json.loads(params)
                symbol = str(data.get("symbol", "")).upper().strip()
                days = int(data.get("days", 30))
            except (json.JSONDecodeError, ValueError):
                symbol = params.upper().strip()
                days = 30
        else:
            # Strategy 2: "FPT 30" or "FPT,30" or just "FPT"
            parts = re.split(r'[\s,]+', params)
            symbol = parts[0].upper().strip()
            days = 30
            if len(parts) > 1:
                try:
                    days = int(parts[1])
                except ValueError:
                    pass
        
        if not symbol:
            return "[ERROR] No symbol provided. Example input: 'FPT' or 'FPT 30'"
        
        v = Vnstock()
        end_date = pd.Timestamp.now()
        start_date = end_date - pd.Timedelta(days=days)
        
        df = v.stock(symbol=symbol).quote.history(
            start=start_date.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d')
        )
        
        if df is None or df.empty:
            return f"[ERROR] No historical data for {symbol}."
        
        # Summary statistics (multiply by 1000 to get actual VND)
        latest = df.iloc[-1]['close'] * 1000
        oldest = df.iloc[0]['close'] * 1000
        highest = df['close'].max() * 1000
        lowest = df['close'].min() * 1000
        avg_vol = df['volume'].mean() if 'volume' in df.columns else 0
        total_change = ((latest - oldest) / oldest) * 100 if oldest > 0 else 0
        
        # Last 5 data points for trend
        recent = df.tail(5)
        trend_data = " → ".join([f"{row['close'] * 1000}" for _, row in recent.iterrows()])
        
        return (
            f"History {symbol} ({days}d): "
            f"Current: {latest} VND, "
            f"Change: {total_change:+.2f}%, "
            f"High: {highest}, Low: {lowest}, "
            f"Avg Volume: {avg_vol:,.0f}, "
            f"Recent trend: {trend_data}"
        )
    except Exception as e:
        return f"[ERROR] Failed to fetch history for {params}: {str(e)}"


@tool
def compare_stocks(symbols: str) -> str:
    """Compares current prices and performance of multiple Vietnamese stocks side by side.
    Input: Comma-separated stock symbols (e.g. "FPT,VNM,HPG").
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not symbol_list:
            return "[ERROR] No symbols provided. Use comma-separated format: FPT,VNM,HPG"
        
        v = Vnstock()
        results = []
        
        for symbol in symbol_list[:5]:  # Limit to 5 stocks
            try:
                df = v.stock(symbol=symbol).quote.history(
                    start=(pd.Timestamp.now() - pd.Timedelta(days=30)).strftime('%Y-%m-%d'),
                    end=pd.Timestamp.now().strftime('%Y-%m-%d')
                )
                
                if df is not None and not df.empty:
                    latest = df.iloc[-1]['close'] * 1000
                    oldest = df.iloc[0]['close'] * 1000
                    change = ((latest - oldest) / oldest) * 100 if oldest > 0 else 0
                    volume = df.iloc[-1].get('volume', 0)
                    
                    results.append(
                        f"{symbol}: {latest} VND ({change:+.2f}% 30d), Vol: {int(volume):,}"
                    )
                else:
                    results.append(f"{symbol}: No data")
            except Exception as ex:
                results.append(f"{symbol}: Error - {str(ex)}")
        
        return " | ".join(results)
    except Exception as e:
        return f"[ERROR] Failed to compare stocks: {str(e)}"
