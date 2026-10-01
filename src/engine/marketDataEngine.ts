/**
 * Production market-data/state bootstrap.
 *
 * Design rules:
 * - No synthetic order book in production paths.
 * - No fabricated liquidation cluster.
 * - No spot fallback for USD-M futures data.
 * - No hardcoded tick sizes or stale price fallbacks.
 * - No "verified" flags unless the caller supplies verified data.
 * - No hidden risk-policy constants.
 */

export type PairKey =
  | 'BTC/USDT'
  | 'ETH/USDT'
  | 'SOL/USDT'
  | 'BNB/USDT'
  | 'XRP/USDT'
  | 'DOGE/USDT'
  | 'SUI/USDT'
  | '1000PEPE/USDT'
  | 'AVAX/USDT'
  | 'LINK/USDT';

export interface PairDefinition {
  pair: PairKey;
  symbol: string;
  name: string;
}

export const PAIRS: Record<PairKey, PairDefinition> = {
  'BTC/USDT': { pair: 'BTC/USDT', symbol: 'BTCUSDT', name: 'Bitcoin / Tether USD' },
  'ETH/USDT': { pair: 'ETH/USDT', symbol: 'ETHUSDT', name: 'Ethereum / Tether USD' },
  'SOL/USDT': { pair: 'SOL/USDT', symbol: 'SOLUSDT', name: 'Solana / Tether USD' },
  'BNB/USDT': { pair: 'BNB/USDT', symbol: 'BNBUSDT', name: 'BNB / Tether USD' },
  'XRP/USDT': { pair: 'XRP/USDT', symbol: 'XRPUSDT', name: 'XRP / Tether USD' },
  'DOGE/USDT': { pair: 'DOGE/USDT', symbol: 'DOGEUSDT', name: 'Dogecoin / Tether USD' },
  'SUI/USDT': { pair: 'SUI/USDT', symbol: 'SUIUSDT', name: 'Sui / Tether USD' },
  '1000PEPE/USDT': { pair: '1000PEPE/USDT', symbol: '1000PEPEUSDT', name: '1000PEPE / Tether USD' },
  'AVAX/USDT': { pair: 'AVAX/USDT', symbol: 'AVAXUSDT', name: 'Avalanche / Tether USD' },
  'LINK/USDT': { pair: 'LINK/USDT', symbol: 'LINKUSDT', name: 'Chainlink / Tether USD' },
};

export interface SymbolRules {
  symbol: string;
  status: string;
  contractType?: string;
  pricePrecision?: number;
  quantityPrecision?: number;
  tickSize: number;
  minPrice: number;
  maxPrice: number;
  stepSize: number;
  minQty: number;
  maxQty: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  quoteNotional: number;
  cumulativeQuoteNotional: number;
  totalUsd: number;
  cumulativeUsd: number;
  isSpoofedWall?: boolean;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number;
  bestAsk: number;
  midPrice: number;
  currentPrice: number;
  spread: number;
  spreadBps: number;
  lastUpdateId: number;
  exchangeEventTime?: number;
  exchangeTransactionTime?: number;
  receivedAt: number;
  timestamp: number;
}

export interface LiquidationClusterInput {
  id: string;
  price: number;
  quoteNotional: number;
  direction: 'LONG_CASCADE' | 'SHORT_CASCADE';
  source: string;
  sourceTimestamp: number;
  verified: boolean;
}

export interface MarketState {
  pair: PairKey;
  symbol: string;
  symbolRules: SymbolRules;
  orderBook: OrderBook;
  cluster: LiquidationClusterInput | null;
  mode: 'LIVE';
  initializedAt: number;
}

type BinanceDepth = {
  lastUpdateId: number;
  E?: number;
  T?: number;
  bids: [string, string][];
  asks: [string, string][];
};

type BinanceExchangeInfo = {
  symbols: Array<{
    symbol: string;
    status: string;
    contractType?: string;
    pricePrecision?: number;
    quantityPrecision?: number;
    filters: Array<Record<string, string>>;
  }>;
};

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0`);
  }
}

function parseNumber(name: string, raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${name}: ${String(raw)}`);
  }
  return n;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Binance request failed: ${response.status} ${response.statusText}` +
      (body ? ` - ${body.slice(0, 300)}` : '')
    );
  }
  return response.json() as Promise<T>;
}

export function normalizeFuturesSymbol(symbolOrPair: string): string {
  const compact = symbolOrPair.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!compact) throw new Error('symbol is required');

  // Explicitly normalize the app's PEPE alias to Binance USD-M's 1000PEPE contract.
  if (compact === 'PEPEUSDT') return '1000PEPEUSDT';

  return compact;
}

function findFilter(
  filters: Array<Record<string, string>>,
  filterType: string
): Record<string, string> {
  const filter = filters.find((f) => f.filterType === filterType);
  if (!filter) throw new Error(`Missing ${filterType} filter from Binance exchangeInfo`);
  return filter;
}

export async function fetchUsdMContractRules(
  symbolOrPair: string,
  signal?: AbortSignal
): Promise<SymbolRules> {
  const symbol = normalizeFuturesSymbol(symbolOrPair);
  const data = await getJson<BinanceExchangeInfo>(
    'https://fapi.binance.com/fapi/v1/exchangeInfo',
    signal
  );

  const item = data.symbols.find((s) => s.symbol === symbol);
  if (!item) {
    throw new Error(`USD-M futures symbol not found on Binance: ${symbol}`);
  }

  const priceFilter = findFilter(item.filters, 'PRICE_FILTER');
  const lotSize = findFilter(item.filters, 'LOT_SIZE');

  return {
    symbol,
    status: item.status,
    contractType: item.contractType,
    pricePrecision: item.pricePrecision,
    quantityPrecision: item.quantityPrecision,
    tickSize: parseNumber('tickSize', priceFilter.tickSize),
    minPrice: parseNumber('minPrice', priceFilter.minPrice),
    maxPrice: parseNumber('maxPrice', priceFilter.maxPrice),
    stepSize: parseNumber('stepSize', lotSize.stepSize),
    minQty: parseNumber('minQty', lotSize.minQty),
    maxQty: parseNumber('maxQty', lotSize.maxQty),
  };
}

function mapLevels(
  rows: [string, string][],
  side: 'bid' | 'ask'
): OrderBookLevel[] {
  let cumulative = 0;

  const levels = rows.map(([priceRaw, qtyRaw], i) => {
    const price = parseNumber(`${side}[${i}].price`, priceRaw);
    const size = parseNumber(`${side}[${i}].quantity`, qtyRaw);
    assertFinitePositive(`${side}[${i}].price`, price);
    assertFinitePositive(`${side}[${i}].quantity`, size);

    const quoteNotional = price * size;
    cumulative += quoteNotional;

    return {
      price,
      size,
      quoteNotional,
      cumulativeQuoteNotional: cumulative,
      totalUsd: quoteNotional,
      cumulativeUsd: cumulative,
    };
  });

  // Validate the exchange ordering instead of silently depending on it.
  for (let i = 1; i < levels.length; i++) {
    if (side === 'bid' && levels[i].price > levels[i - 1].price) {
      throw new Error('Binance bid depth is not sorted descending');
    }
    if (side === 'ask' && levels[i].price < levels[i - 1].price) {
      throw new Error('Binance ask depth is not sorted ascending');
    }
  }

  return levels;
}

export function parseDepthSnapshot(symbolOrPair: string, data: BinanceDepth): OrderBook {
  const symbol = normalizeFuturesSymbol(symbolOrPair);

  if (!Number.isSafeInteger(data.lastUpdateId) || data.lastUpdateId < 0) {
    throw new Error('Invalid Binance lastUpdateId');
  }
  if (!Array.isArray(data.bids) || !Array.isArray(data.asks)) {
    throw new Error('Malformed Binance depth response');
  }
  if (data.bids.length === 0 || data.asks.length === 0) {
    throw new Error('Binance depth snapshot has an empty side');
  }

  const bids = mapLevels(data.bids, 'bid');
  const asks = mapLevels(data.asks, 'ask');

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;

  if (bestBid >= bestAsk) {
    throw new Error(`Crossed/locked snapshot: bestBid=${bestBid}, bestAsk=${bestAsk}`);
  }

  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;

  return {
    symbol,
    bids,
    asks,
    bestBid,
    bestAsk,
    midPrice,
    spread,
    spreadBps: (spread / midPrice) * 10_000,
    lastUpdateId: data.lastUpdateId,
    exchangeEventTime: data.E,
    exchangeTransactionTime: data.T,
    receivedAt: Date.now(),
    currentPrice: midPrice,
    timestamp: Date.now(),
  };
}

export async function fetchRealBinanceDepthSnapshot(
  symbolOrPair: string,
  limit: 5 | 10 | 20 | 50 | 100 | 500 | 1000 = 100,
  signal?: AbortSignal
): Promise<OrderBook> {
  const symbol = normalizeFuturesSymbol(symbolOrPair);
  const url =
    `https://fapi.binance.com/fapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;

  const data = await getJson<BinanceDepth>(url, signal);
  return parseDepthSnapshot(symbol, data);
}

export async function fetchRealBinancePrices(
  symbols?: readonly string[],
  signal?: AbortSignal
): Promise<Record<string, number>> {
  const rows = await getJson<Array<{ symbol: string; price: string }>>(
    'https://fapi.binance.com/fapi/v1/ticker/price',
    signal
  );

  const all = new Map<string, number>();
  for (const row of rows) {
    const price = parseNumber(`${row.symbol}.price`, row.price);
    if (price > 0) all.set(row.symbol, price);
  }

  if (!symbols || symbols.length === 0) {
    const res: Record<string, number> = {};
    for (const [sym, price] of all.entries()) {
      res[sym] = price;
    }
    return res;
  }

  const requested = [...new Set(symbols.map(normalizeFuturesSymbol))];
  const result: Record<string, number> = {};
  for (const symbol of requested) {
    const price = all.get(symbol);
    if (price === undefined) {
      throw new Error(`Binance USD-M ticker missing symbol: ${symbol}`);
    }
    result[symbol] = price;
  }

  return result;
}

export function validateLiquidationCluster(
  cluster: LiquidationClusterInput
): LiquidationClusterInput {
  assertFinitePositive('cluster.price', cluster.price);
  assertFinitePositive('cluster.quoteNotional', cluster.quoteNotional);

  if (!cluster.id.trim()) throw new Error('cluster.id is required');
  if (!cluster.source.trim()) throw new Error('cluster.source is required');
  if (!Number.isSafeInteger(cluster.sourceTimestamp) || cluster.sourceTimestamp <= 0) {
    throw new Error('cluster.sourceTimestamp must be a positive millisecond timestamp');
  }

  return { ...cluster };
}

/**
 * Creates a genuinely live initial state.
 */
export async function createLiveInitialState(
  pair: PairKey,
  options: {
    cluster?: LiquidationClusterInput | null;
    depthLimit?: 5 | 10 | 20 | 50 | 100 | 500 | 1000;
    signal?: AbortSignal;
  } = {}
): Promise<MarketState> {
  const definition = PAIRS[pair];
  if (!definition) throw new Error(`Unsupported pair: ${pair}`);

  const [symbolRules, orderBook] = await Promise.all([
    fetchUsdMContractRules(definition.symbol, options.signal),
    fetchRealBinanceDepthSnapshot(
      definition.symbol,
      options.depthLimit ?? 100,
      options.signal
    ),
  ]);

  if (symbolRules.status !== 'TRADING') {
    throw new Error(`${definition.symbol} is not in TRADING status`);
  }

  const cluster =
    options.cluster == null ? null : validateLiquidationCluster(options.cluster);

  return {
    pair,
    symbol: definition.symbol,
    symbolRules,
    orderBook,
    cluster,
    mode: 'LIVE',
    initializedAt: Date.now(),
  };
}
