from langchain_core.tools import tool
from vnstock import *
import pandas as pd

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
