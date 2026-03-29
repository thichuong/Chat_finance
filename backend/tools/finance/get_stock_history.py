from langchain_core.tools import tool
import json
import re
import pandas as pd
from vnstock import *

@tool
def get_stock_history(params: str) -> str:
    """Gets historical price data for a Vietnamese stock to analyze trends over time.
    Input: Stock symbol, optionally followed by number of days (e.g. "FPT", "FPT 30", "VNM 60").
    Default: 30 days if not specified.
    """
    try:
        params = str(params).strip()
        
        # Strategy 1: JSON input like {"symbol": "FPT", "days": 30}
        if params.startswith("{"):
            try:
                data = json.loads(params)
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
