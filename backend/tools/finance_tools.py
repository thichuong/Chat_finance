from langchain_core.tools import tool
import yfinance as ticker
import ccxt
from vnstock import *
import pandas as pd
from typing import Optional

@tool
def get_stock_price(symbol: str) -> str:
    """Gets the current stock price and basic info for a given ticker symbol (US Stocks)."""
    try:
        stock = ticker.Ticker(symbol)
        info = stock.info
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        if not current_price:
            return f"Could not find price for {symbol}."
        
        return f"Current price of {symbol}: {current_price} {info.get('currency', 'USD')}. Summary: {info.get('longName', 'N/A')}"
    except Exception as e:
        return f"Error fetching stock price for {symbol}: {str(e)}"

# Mapping for common crypto names to their ticker symbols
CRYPTO_MAPPING = {
    "bitcoin": "BTC",
    "btc": "BTC",
    "ethereum": "ETH",
    "eth": "ETH",
    "binance coin": "BNB",
    "bnb": "BNB",
    "solana": "SOL",
    "sol": "SOL",
    "cardano": "ADA",
    "ada": "ADA",
    "ripple": "XRP",
    "xrp": "XRP",
    "dogecoin": "DOGE",
    "doge": "DOGE",
    "polkadot": "DOT",
    "dot": "DOT",
    "shiba inu": "SHIB",
    "shib": "SHIB",
    "avalanche": "AVAX",
    "avax": "AVAX",
    "chainlink": "LINK",
    "link": "LINK",
    "polygon": "MATIC",
    "matic": "MATIC",
    "toncoin": "TON",
    "ton": "TON",
    "tron": "TRX",
    "trx": "TRX",
    "near": "NEAR",
    "monero": "XMR",
    "litecoin": "LTC",
    "ltc": "LTC",
    "pepe": "PEPE",
    "sui": "SUI",
    "aptos": "APT",
}

@tool
def get_crypto_price(symbol: str) -> str:
    """Gets the current price for a crypto pair (e.g., BTC/USDT) from Binance.
    Accepts coin names (bitcoin) or symbols (BTC). Default pair is /USDT.
    """
    try:
        # Normalize input
        clean_symbol = symbol.lower().strip()
        
        # Use mapping if available
        resolved_symbol = CRYPTO_MAPPING.get(clean_symbol, clean_symbol.upper())
        
        # Ensure it has a pair format (default to /USDT)
        if "/" not in resolved_symbol:
            resolved_symbol = f"{resolved_symbol}/USDT"
        else:
            resolved_symbol = resolved_symbol.upper()

        exchange = ccxt.binance()
        ticker_data = exchange.fetch_ticker(resolved_symbol)
        last_price = ticker_data['last']
        return f"Current price of {resolved_symbol} on Binance: {last_price} USDT"
    except Exception as e:
        return f"Error fetching crypto price for {symbol} (resolved as {resolved_symbol if 'resolved_symbol' in locals() else '?' }): {str(e)}"

@tool
def get_vn_stock_price(symbol: str) -> str:
    """Gets the current stock price and info for a Vietnamese stock symbol."""
    try:
        # Using vnstock v3.x API
        v = Vnstock()
        # Fetching historical data to get the latest close price
        # Default source is VCI if not specified in v.stock(symbol='VNF', source='VCI')
        df = v.stock(symbol=symbol).quote.history(
            start='2024-01-01', 
            end=pd.Timestamp.now().strftime('%Y-%m-%d')
        )
        
        if df is None or df.empty:
            return f"No data found for Vietnamese stock {symbol}."
        
        last_row = df.iloc[-1]
        # In vnstock v3, 'time' column is usually a string YYYY-MM-DD or datetime
        return f"Vietnamese Stock {symbol}: Price: {last_row['close']} VND, Date: {last_row['time']}"
    except Exception as e:
        return f"Error fetching VN stock price for {symbol}: {str(e)}"

