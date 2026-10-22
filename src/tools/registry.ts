import { getStockPrice } from './finance/getStockPrice';
import { getCryptoPrice } from './finance/getCryptoPrice';
import { getVnStockPrice } from './finance/getVnStockPrice';
import { getVnIndices } from './finance/getVnIndices';
import { getStockHistory } from './finance/getStockHistory';
import { compareStocks } from './finance/compareStocks';
import { getGoldPrice } from './finance/getGoldPrice';
import { googleSearch } from './web/googleSearch';

export type ToolFunction = (input: string) => Promise<string>;

export const TOOLS_MAP: Record<string, ToolFunction> = {
  get_stock_price: getStockPrice,
  get_crypto_price: getCryptoPrice,
  get_vn_stock_price: getVnStockPrice,
  get_vn_indices: getVnIndices,
  get_stock_history: getStockHistory,
  compare_stocks: compareStocks,
  get_gold_price: getGoldPrice,
  google_search: googleSearch,
  googleSearch: googleSearch,
  'google:search': googleSearch,
};

