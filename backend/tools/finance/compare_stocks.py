from langchain_core.tools import tool
import pandas as pd
from vnstock import *

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
