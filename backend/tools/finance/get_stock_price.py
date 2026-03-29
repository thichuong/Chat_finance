from langchain_core.tools import tool
import yfinance as ticker

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
