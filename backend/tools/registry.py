from backend.tools.finance.get_stock_price import get_stock_price
from backend.tools.finance.get_crypto_price import get_crypto_price
from backend.tools.finance.get_vn_stock_price import get_vn_stock_price
from backend.tools.finance.get_vn_indices import get_vn_indices
from backend.tools.finance.get_stock_history import get_stock_history
from backend.tools.finance.compare_stocks import compare_stocks
from backend.tools.finance.get_gold_price import get_gold_price
from backend.tools.web.google_search import google_search

TOOLS_MAP = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_vn_stock_price": get_vn_stock_price,
    "get_vn_indices": get_vn_indices,
    "get_stock_history": get_stock_history,
    "compare_stocks": compare_stocks,
    "get_gold_price": get_gold_price,
    "google_search": google_search,
    "googleSearch": google_search,
    "google:search": google_search,
}
