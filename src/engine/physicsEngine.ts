import { OrderBookLevel } from '../types';

export interface DepthResult {
  quoteNotional: number;
  levelsCount: number;
}

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0`);
  }
}

function normalizeBids(
  bids: readonly OrderBookLevel[]
): OrderBookLevel[] {
  return bids
    .map((level, i) => {
      assertFinitePositive(`bids[${i}].price`, level.price);
      assertFinitePositive(`bids[${i}].size`, level.size);

      return {
        price: level.price,
        size: level.size,
        totalUsd: level.totalUsd ?? level.price * level.size,
        cumulativeUsd: level.cumulativeUsd ?? 0,
        isSpoofedWall: level.isSpoofedWall,
      };
    })
    .sort((a, b) => b.price - a.price);
}

/**
 * Computes visible resting bid notional between currentPrice
 * and a lower target price.
 *
 * For USDⓈ-M linear contracts:
 * quote notional ~= price * base quantity.
 */
export function computeBidDepthBetween(
  bids: readonly OrderBookLevel[],
  currentPrice: number,
  lowerPrice: number
): DepthResult {
  assertFinitePositive('currentPrice', currentPrice);
  assertFinitePositive('lowerPrice', lowerPrice);

  if (lowerPrice > currentPrice) {
    throw new RangeError(
      'lowerPrice must be <= currentPrice for downside bid depth'
    );
  }

  let quoteNotional = 0;
  let levelsCount = 0;

  for (const level of normalizeBids(bids)) {
    if (level.price > currentPrice) {
      continue;
    }

    if (level.price < lowerPrice) {
      break;
    }

    quoteNotional += level.price * level.size;
    levelsCount++;
  }

  return {
    quoteNotional,
    levelsCount,
  };
}

/**
 * Backwards-compatible wrapper around computeBidDepthBetween
 */
export function computeAirPocketUsd(
  bids: readonly OrderBookLevel[],
  currentPrice: number,
  clusterPrice: number
): { airPocketDepthUsd: number; levelsCount: number } {
  if (!bids || bids.length === 0 || currentPrice <= 0 || clusterPrice <= 0) {
    return { airPocketDepthUsd: 0, levelsCount: 0 };
  }
  const lowerPrice = Math.min(currentPrice, clusterPrice);
  try {
    const res = computeBidDepthBetween(bids, currentPrice, lowerPrice);
    return {
      airPocketDepthUsd: res.quoteNotional,
      levelsCount: res.levelsCount,
    };
  } catch {
    return { airPocketDepthUsd: 0, levelsCount: 0 };
  }
}

/**
 * Cascade Vulnerability Index.
 *
 * IMPORTANT:
 * clusterQuoteNotional must come from a genuine external
 * liquidation-cluster data source/model.
 *
 * It must NOT be inferred from funding rate or total OI alone.
 */
export function calculateCvi(
  clusterQuoteNotional: number,
  restingBidQuoteNotional: number
): number {
  if (
    !Number.isFinite(clusterQuoteNotional) ||
    clusterQuoteNotional < 0
  ) {
    throw new RangeError(
      'clusterQuoteNotional must be finite and >= 0'
    );
  }

  if (
    !Number.isFinite(restingBidQuoteNotional) ||
    restingBidQuoteNotional < 0
  ) {
    throw new RangeError(
      'restingBidQuoteNotional must be finite and >= 0'
    );
  }

  if (restingBidQuoteNotional === 0) {
    return clusterQuoteNotional === 0
      ? 0
      : Number.POSITIVE_INFINITY;
  }

  return clusterQuoteNotional / restingBidQuoteNotional;
}

/**
 * Finds the first bid price below/equal to clusterPrice
 * where cumulative visible bid notional reaches an explicit target.
 *
 * No hidden 1.2x multiplier.
 * The caller chooses the required absorption target.
 */
export function calculateExhaustionEntry(
  bids: readonly OrderBookLevel[],
  clusterPrice: number,
  targetAbsorptionQuoteNotional: number,
  _legacyCviThreshold?: number,
  legacyAbsorptionBuffer?: number
): {
  exhaustionPrice: number | null;
  absorbedQuoteNotional: number;
  absorbedDepthUsd?: number;
  reason?: string;
} {
  if (!bids || bids.length === 0 || clusterPrice <= 0) {
    return {
      exhaustionPrice: null,
      absorbedQuoteNotional: 0,
      absorbedDepthUsd: 0,
      reason: 'No bids available',
    };
  }

  // Handle legacy caller signature where 3rd param is clusterUsd and 5th param is buffer multiplier
  let actualTarget = targetAbsorptionQuoteNotional;
  if (legacyAbsorptionBuffer && legacyAbsorptionBuffer > 0) {
    actualTarget = targetAbsorptionQuoteNotional * legacyAbsorptionBuffer;
  }

  if (actualTarget <= 0) {
    actualTarget = 1;
  }

  try {
    assertFinitePositive('clusterPrice', clusterPrice);
    assertFinitePositive('targetAbsorptionQuoteNotional', actualTarget);

    let absorbedQuoteNotional = 0;

    for (const level of normalizeBids(bids)) {
      if (level.price > clusterPrice) {
        continue;
      }

      absorbedQuoteNotional += level.price * level.size;

      if (absorbedQuoteNotional >= actualTarget) {
        return {
          exhaustionPrice: level.price,
          absorbedQuoteNotional,
          absorbedDepthUsd: absorbedQuoteNotional,
        };
      }
    }

    return {
      exhaustionPrice: null,
      absorbedQuoteNotional,
      absorbedDepthUsd: absorbedQuoteNotional,
      reason:
        'Visible bid depth is insufficient for the requested absorption target',
    };
  } catch {
    return {
      exhaustionPrice: null,
      absorbedQuoteNotional: 0,
      absorbedDepthUsd: 0,
      reason: 'Invalid arguments',
    };
  }
}

/**
 * Fractional Kelly.
 *
 * Explicit parameters supplied by caller.
 */
export function calculateFractionalKelly(
  winProbability: number,
  payoffRatio: number,
  fraction: number,
  maxAllocationFraction?: number
): {
  fullKellyFraction: number;
  allocationFraction: number;
} {
  if (
    !Number.isFinite(winProbability) ||
    winProbability < 0 ||
    winProbability > 1
  ) {
    throw new RangeError(
      'winProbability must be in [0, 1]'
    );
  }

  assertFinitePositive('payoffRatio', payoffRatio);

  if (
    !Number.isFinite(fraction) ||
    fraction < 0 ||
    fraction > 1
  ) {
    throw new RangeError(
      'fraction must be in [0, 1]'
    );
  }

  if (
    maxAllocationFraction !== undefined &&
    (
      !Number.isFinite(maxAllocationFraction) ||
      maxAllocationFraction < 0 ||
      maxAllocationFraction > 1
    )
  ) {
    throw new RangeError(
      'maxAllocationFraction must be in [0, 1]'
    );
  }

  const q = 1 - winProbability;

  const fullKellyFraction = Math.max(
    0,
    (
      winProbability * payoffRatio - q
    ) / payoffRatio
  );

  const fractionalKelly =
    fullKellyFraction * fraction;

  return {
    fullKellyFraction,

    allocationFraction:
      maxAllocationFraction === undefined
        ? fractionalKelly
        : Math.min(
            fractionalKelly,
            maxAllocationFraction
          ),
  };
}

/**
 * Legacy wrapper for calculateKellyAllocation
 */
export function calculateKellyAllocation(
  winRate: number = 0.72,
  payoffRatio: number = 3.0,
  fractionalMultiplier: number = 0.25
): { fullKellyPercent: number; recommendedFractionalPercent: number } {
  const result = calculateFractionalKelly(winRate, payoffRatio, fractionalMultiplier, 0.02);
  return {
    fullKellyPercent: parseFloat((result.fullKellyFraction * 100).toFixed(2)),
    recommendedFractionalPercent: parseFloat((result.allocationFraction * 100).toFixed(2)),
  };
}

export type OiPeriod =
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d';

export interface RealBinanceMarketMetrics {
  symbol: string;

  markPrice: number;
  indexPrice: number;

  lastFundingRate: number;
  nextFundingTime: number;

  /**
   * Current Binance-reported open interest quantity.
   */
  openInterestBase: number;

  /**
   * Mark-to-market quote notional.
   */
  openInterestQuoteNotional: number;

  /**
   * Genuine percentage change between the most recent
   * two Binance OI-history observations.
   */
  oiDeltaPercent: number | null;

  oiPeriod: OiPeriod;

  observedAt: number;

  // Backwards compatibility fields for consumers
  openInterestUsd?: number;
  fundingRate?: number;
  clusterPrice?: number;
  clusterUsd?: number;
}

type PremiumIndexResponse = {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  time: number;
};

type OpenInterestResponse = {
  openInterest: string;
  symbol: string;
  time: number;
};

type OpenInterestHistoryRow = {
  symbol: string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
  timestamp: number;
};

async function getJson<T>(
  url: string
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Binance HTTP ${response.status} for ${url}`
    );
  }

  return response.json() as Promise<T>;
}

function parseApiNumber(
  name: string,
  raw: string
): number {
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(
      `Invalid ${name} from Binance: ${raw}`
    );
  }

  return value;
}

/**
 * Fetches only metrics Binance actually publishes.
 *
 * It deliberately DOES NOT return fabricated liquidation clusters.
 */
export async function fetchRealBinanceMarketMetrics(
  symbol: string,
  oiPeriod: OiPeriod = '5m'
): Promise<RealBinanceMarketMetrics> {
  const sym = symbol
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!sym) {
    throw new Error('symbol is required');
  }

  const encodedSymbol =
    encodeURIComponent(sym);

  const encodedPeriod =
    encodeURIComponent(oiPeriod);

  const [
    premium,
    openInterest,
    oiHistory,
  ] = await Promise.all([
    getJson<PremiumIndexResponse>(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodedSymbol}`
    ),

    getJson<OpenInterestResponse>(
      `https://fapi.binance.com/fapi/v1/openInterest?symbol=${encodedSymbol}`
    ),

    getJson<OpenInterestHistoryRow[]>(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodedSymbol}&period=${encodedPeriod}&limit=2`
    ).catch(() => []),
  ]);

  const markPrice = parseApiNumber(
    'markPrice',
    premium.markPrice
  );

  const indexPrice = parseApiNumber(
    'indexPrice',
    premium.indexPrice
  );

  const lastFundingRate = parseApiNumber(
    'lastFundingRate',
    premium.lastFundingRate
  );

  const openInterestBase = parseApiNumber(
    'openInterest',
    openInterest.openInterest
  );

  let oiDeltaPercent: number | null = null;

  if (Array.isArray(oiHistory) && oiHistory.length >= 2) {
    const previous = parseApiNumber(
      'previous sumOpenInterest',
      oiHistory[
        oiHistory.length - 2
      ].sumOpenInterest
    );

    const current = parseApiNumber(
      'current sumOpenInterest',
      oiHistory[
        oiHistory.length - 1
      ].sumOpenInterest
    );

    oiDeltaPercent =
      previous === 0
        ? null
        : (
            (current - previous) /
            previous
          ) * 100;
  }

  const openInterestQuoteNotional = openInterestBase * markPrice;

  return {
    symbol: sym,

    markPrice,
    indexPrice,

    lastFundingRate,

    nextFundingTime:
      premium.nextFundingTime,

    openInterestBase,

    openInterestQuoteNotional,

    oiDeltaPercent,

    oiPeriod,

    observedAt: Math.max(
      premium.time ?? 0,
      openInterest.time ?? 0
    ),

    // Backwards compatibility mappings
    openInterestUsd: openInterestQuoteNotional,
    fundingRate: lastFundingRate,
  };
}
