from backend.tools.finance.get_stock_price import get_stock_price
from backend.tools.finance.get_crypto_price import get_crypto_price
from backend.tools.finance.get_vn_stock_price import get_vn_stock_price
from backend.tools.finance.get_vn_indices import get_vn_indices
from backend.tools.finance.get_stock_history import get_stock_history
from backend.tools.finance.compare_stocks import compare_stocks
from backend.tools.web.search_tavily import search_tavily
from backend.tools.web.scrape_web import scrape_web

TOOLS_MAP = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_vn_stock_price": get_vn_stock_price,
    "get_vn_indices": get_vn_indices,
    "get_stock_history": get_stock_history,
    "compare_stocks": compare_stocks,
    "search_tavily": search_tavily,
    "scrape_web": scrape_web,
}
