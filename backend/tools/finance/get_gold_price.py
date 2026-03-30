from langchain_core.tools import tool
import yfinance as yf
import pandas as pd

@tool
def get_gold_price(dummy: str = "") -> str:
    """Gets the current global gold price (XAU/USD).
    Input: No input needed (pass empty string "").
    """
    # Get Global Gold Price (Gold Futures: GC=F)
    try:
        gold_ticker = yf.Ticker("GC=F")
        data = gold_ticker.history(period="2d")
        if not data.empty:
            price = data.iloc[-1]['Close']
            prev_price = data.iloc[-2]['Close'] if len(data) > 1 else price
            change = ((price - prev_price) / prev_price) * 100
            return f"Global Gold: ${price:,.2f} ({change:+.2f}%)"
        else:
            return "Global Gold: No data available at the moment"
    except Exception as e:
        return f"Error fetching global gold price: {str(e)}"

if __name__ == "__main__":
    # Test
    print(get_gold_price.func(""))
