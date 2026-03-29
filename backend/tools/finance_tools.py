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

@tool
def get_crypto_price(symbol: str) -> str:
    """Gets the current price for a crypto pair (e.g., BTC/USDT) from Binance."""
    try:
        exchange = ccxt.binance()
        ticker_data = exchange.fetch_ticker(symbol)
        last_price = ticker_data['last']
        return f"Current price of {symbol} on Binance: {last_price} USDT"
    except Exception as e:
        return f"Error fetching crypto price for {symbol}: {str(e)}"

@tool
def get_vn_stock_price(symbol: str) -> str:
    """Gets the current stock price and info for a Vietnamese stock symbol."""
    try:
        # Get history for the last day to get price
        df = stock_historical_data(symbol=symbol, 
                                 start_date='2024-01-01', 
                                 end_date=pd.Timestamp.now().strftime('%Y-%m-%d'), 
                                 resolution='1D', 
                                 type='stock', 
                                 beautify=True)
        if df.empty:
            return f"No historical data for {symbol}."
        
        last_row = df.iloc[-1]
        return f"Vietnamese Stock {symbol}: Price: {last_row['close']} VND, Date: {last_row['time']}"
    except Exception as e:
        return f"Error fetching VN stock price for {symbol}: {str(e)}"

