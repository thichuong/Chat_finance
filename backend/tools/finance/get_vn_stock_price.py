from langchain_core.tools import tool
from vnstock import *
import pandas as pd

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
