import {
  OrderBook,
  OrderBookLevel,
  LiquidationCluster,
  MachineState,
  ActivePosition,
  QuantitativeMetrics,
  TradeHistoryItem,
  HammerStressState,
} from '../types';
import { computeAirPocketUsd, calculateCvi, calculateExhaustionEntry } from './physicsEngine';
import {
  PAIRS,
  fetchRealBinancePrices as fetchRealPricesEngine,
  fetchRealBinanceDepthSnapshot as fetchRealDepthEngine,
  normalizeFuturesSymbol,
} from './marketDataEngine';

export interface MarketPairConfig {
  symbol: string;
  name: string;
  basePrice: number;
  tickSize: number;
  typicalClusterUsd: number;
  stepPct: number;
}

// Pair configs dynamically updated from live Binance ticker feeds
export const PAIR_CONFIGS: Record<string, MarketPairConfig> = {
  'BTC/USDT': { symbol: 'BTCUSDT', name: 'Bitcoin / Tether USD', basePrice: 0, tickSize: 0.5, typicalClusterUsd: 42000000, stepPct: 0.0015 },
  'ETH/USDT': { symbol: 'ETHUSDT', name: 'Ethereum / Tether USD', basePrice: 0, tickSize: 0.05, typicalClusterUsd: 18500000, stepPct: 0.002 },
  'SOL/USDT': { symbol: 'SOLUSDT', name: 'Solana / Tether USD', basePrice: 0, tickSize: 0.01, typicalClusterUsd: 8200000, stepPct: 0.0025 },
  'BNB/USDT': { symbol: 'BNBUSDT', name: 'BNB / Tether USD', basePrice: 0, tickSize: 0.1, typicalClusterUsd: 5400000, stepPct: 0.002 },
  'XRP/USDT': { symbol: 'XRPUSDT', name: 'XRP / Tether USD', basePrice: 0, tickSize: 0.0001, typicalClusterUsd: 6100000, stepPct: 0.003 },
  'DOGE/USDT': { symbol: 'DOGEUSDT', name: 'Dogecoin / Tether USD', basePrice: 0, tickSize: 0.0001, typicalClusterUsd: 7800000, stepPct: 0.0035 },
  'SUI/USDT': { symbol: 'SUIUSDT', name: 'Sui / Tether USD', basePrice: 0, tickSize: 0.001, typicalClusterUsd: 4900000, stepPct: 0.003 },
  'PEPE/USDT': { symbol: '1000PEPEUSDT', name: '1000PEPE / Tether USD', basePrice: 0, tickSize: 0.00001, typicalClusterUsd: 5200000, stepPct: 0.004 },
  'AVAX/USDT': { symbol: 'AVAXUSDT', name: 'Avalanche / Tether USD', basePrice: 0, tickSize: 0.01, typicalClusterUsd: 3800000, stepPct: 0.0025 },
  'LINK/USDT': { symbol: 'LINKUSDT', name: 'Chainlink / Tether USD', basePrice: 0, tickSize: 0.01, typicalClusterUsd: 3200000, stepPct: 0.0025 },
};

export async function fetchRealBinancePrices(symbols?: readonly string[]) {
  return fetchRealPricesEngine(symbols);
}

export { fetchRealBinanceDepthSnapshot, normalizeFuturesSymbol } from './marketDataEngine';

/**
 * Generates an initial synthetic L2 orderbook with configurable air pockets and clusters
 */
export function generateSyntheticOrderBook(
  basePrice: number,
  clusterPrice: number,
  clusterUsd: number,
  airPocketThinFactor: number = 0.25, // < 0.4 makes book paper-thin (CVI > 3.0)
  hasSpoofWall: boolean = false
): OrderBook {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  const spread = basePrice * 0.0004;
  let cumBidsUsd = 0;
  let cumAsksUsd = 0;

  // Generate 25 Bid levels descending
  for (let i = 1; i <= 28; i++) {
    const price = Number((basePrice - spread * i * 0.8).toFixed(2));
    const isInsideAirPocket = price > clusterPrice;
    const isBelowCluster = price <= clusterPrice;

    // Inside air pocket: size is severely dampened if thinFactor is low
    let sizeUsd = (basePrice * (0.8 + Math.random() * 0.8)) * 18;
    if (isInsideAirPocket) {
      sizeUsd = sizeUsd * airPocketThinFactor;
    } else if (isBelowCluster) {
      // Deeper floor has thicker absorption
      sizeUsd = sizeUsd * 2.8 * (1 + (i - 10) * 0.15);
    }

    // Check if this is the spoof wall level
    let isSpoofed = false;
    if (hasSpoofWall && i === 12) {
      sizeUsd += 50000000; // $50M predatory spoof wall!
      isSpoofed = true;
    }

    const size = Number((sizeUsd / price).toFixed(4));
    const totalUsd = Number((price * size).toFixed(2));
    cumBidsUsd += totalUsd;

    bids.push({
      price,
      size,
      totalUsd,
      cumulativeUsd: cumBidsUsd,
      isSpoofedWall: isSpoofed,
    });
  }

  // Generate 20 Ask levels ascending
  for (let i = 1; i <= 20; i++) {
    const price = Number((basePrice + spread * i * 0.8).toFixed(2));
    const sizeUsd = (basePrice * (0.8 + Math.random() * 0.8)) * 14;
    const size = Number((sizeUsd / price).toFixed(4));
    const totalUsd = Number((price * size).toFixed(2));
    cumAsksUsd += totalUsd;

    asks.push({
      price,
      size,
      totalUsd,
      cumulativeUsd: cumAsksUsd,
    });
  }

  return {
    bids,
    asks,
    currentPrice: basePrice,
    lastUpdateId: Date.now(),
    timestamp: Date.now(),
  };
}



export function createInitialSimulationState(pair: string = 'BTC/USDT') {
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['BTC/USDT'];
  const DEFAULT_PRICES: Record<string, number> = {
    'BTC/USDT': 83810,
    'ETH/USDT': 3120,
    'SOL/USDT': 178,
    'BNB/USDT': 585,
    'XRP/USDT': 0.58,
    'DOGE/USDT': 0.14,
    'SUI/USDT': 1.84,
    'PEPE/USDT': 0.0094,
    'AVAX/USDT': 28.3,
    'LINK/USDT': 11.4,
  };
  const activeBasePrice = config.basePrice > 0 ? config.basePrice : (DEFAULT_PRICES[pair] || 100);
  const clusterPrice = Number((activeBasePrice * 0.976).toFixed(2)); // 2.4% below current price
  const clusterUsd = config.typicalClusterUsd;

  const orderbook = generateSyntheticOrderBook(activeBasePrice, clusterPrice, clusterUsd, 0.22, false);

  const { airPocketDepthUsd, levelsCount } = computeAirPocketUsd(orderbook.bids, orderbook.currentPrice, clusterPrice);
  const cvi = calculateCvi(clusterUsd, airPocketDepthUsd);
  const { exhaustionPrice } = calculateExhaustionEntry(orderbook.bids, clusterPrice, clusterUsd, 3.0, 1.2);

  const initialCluster: LiquidationCluster = {
    id: 'cluster-alpha-01',
    price: clusterPrice,
    volumeUsd: clusterUsd,
    direction: 'LONG_CASCADE',
    verifiedByOi: true,
    oiSpikeDelta: 14.8, // 14.8% delta OI when minted
    isSpoofed: false,
    status: 'PENDING',
  };

  const initialMetrics: QuantitativeMetrics = {
    airPocketDepthUsd,
    clusterUsd,
    cvi,
    exhaustionPrice,
    restingBidsCount: levelsCount,
    tickVelocity: 34, // 34 trades/sec baseline
    openInterest: 1845000000, // $1.845B OI
    oiDeltaPercent: 2.4,
    fundingRate: 0.0085, // +0.0085% (longs paying shorts)
    crossAssetCorrelation: 0.32, // Normal localized market
    networkLatencyMs: 14,
    cancelOnDisconnectActive: true,
    serverProximity: 'AWS_TOKYO_COLO_12MS',
  };

  const initialHammer: HammerStressState = {
    activeHammer: 'NONE',
    title: 'Ready for Stress Injections',
    injectedAt: null,
    stage: 'IDLE',
    log: ['System initialized. Orderbook delta stream active.', 'COD heartbeat ping: 14ms (AWS Tokyo ap-northeast-1).'],
    metrics: {
      latency: 14,
      api429Count: 0,
      spoofBidPulled: false,
      systemicCorrelation: 0.32,
      vulnerableLossPercent: 0,
      strategistResultPercent: 0,
    },
  };

  return {
    pair,
    orderbook,
    cluster: initialCluster,
    metrics: initialMetrics,
    machineState: 'IDLE' as MachineState,
    activePosition: null as ActivePosition | null,
    tradeHistory: [] as TradeHistoryItem[],
    hammer: initialHammer,
    isLiveFeed: true, // Default to Live Real Binance WebSocket Feed
    snapbackHoldSeconds: 0,
    portfolioEquity: 250000, // $250k trading desk initial capital
    fractionalKellyPct: 1.8, // 1.8% allocation
  };
}
