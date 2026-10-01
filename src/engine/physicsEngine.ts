import { OrderBookLevel } from '../types';

/**
 * Computes total USD depth between current price and the liquidation cluster.
 * Bids should be sorted descending by price.
 */
export function computeAirPocketUsd(
  bids: OrderBookLevel[],
  currentPrice: number,
  clusterPrice: number
): { airPocketDepthUsd: number; levelsCount: number } {
  let airPocketDepthUsd = 0;
  let levelsCount = 0;

  for (const level of bids) {
    if (level.price < clusterPrice) {
      break;
    }
    if (level.price <= currentPrice) {
      airPocketDepthUsd += level.price * level.size;
      levelsCount++;
    }
  }

  return { airPocketDepthUsd, levelsCount };
}

/**
 * Computes Cascade Vulnerability Index (CVI):
 * CVI = Estimated Cluster Liquidation Size ($) / Cumulative Resting Bids between Current Price and Cluster ($)
 */
export function calculateCvi(clusterUsd: number, airPocketUsd: number): number {
  if (airPocketUsd <= 0) return 999.0;
  return clusterUsd / airPocketUsd;
}

/**
 * Scans deeper bids below the cluster until resting cumulative depth below cluster >= 120% of cluster volume.
 * Absorbed USD >= cluster_volume * 1.2
 * Returns price coordinate of exhaustion floor (Limit Buy coordinate).
 */
export function calculateExhaustionEntry(
  bids: OrderBookLevel[],
  clusterPrice: number,
  clusterUsd: number,
  cviThreshold: number = 3.0,
  absorptionBuffer: number = 1.2
): { exhaustionPrice: number | null; absorbedDepthUsd: number; reason?: string } {
  let absorbedUsd = 0;
  const targetAbsorption = clusterUsd * absorptionBuffer;

  for (const level of bids) {
    if (level.price <= clusterPrice) {
      absorbedUsd += level.price * level.size;
      if (absorbedUsd >= targetAbsorption) {
        return {
          exhaustionPrice: level.price,
          absorbedDepthUsd: absorbedUsd,
        };
      }
    }
  }

  // If orderbook doesn't reach 120% absorption before running out of depth:
  return {
    exhaustionPrice: null,
    absorbedDepthUsd: absorbedUsd,
    reason: 'Insufficient deep book depth to satisfy 120% cluster absorption target',
  };
}

/**
 * Fractional Kelly Criterion Calculator
 * f* = (p * b - q) / b
 * p = win rate, q = 1 - p
 * b = win/loss payoff ratio (e.g. 3.0 = +3% profit vs -1% loss)
 * Asymmetric sizing recommendation: 0.25 * f* (Quarter-Kelly) capped at 1.5% - 2.0% equity
 */
export function calculateKellyAllocation(
  winRate: number = 0.72,
  payoffRatio: number = 3.0,
  fractionalMultiplier: number = 0.25
): { fullKellyPercent: number; recommendedFractionalPercent: number } {
  const p = Math.max(0.01, Math.min(0.99, winRate));
  const q = 1 - p;
  const b = Math.max(0.1, payoffRatio);

  const fullKelly = (p * b - q) / b;
  const clampedFullKelly = Math.max(0, Math.min(1, fullKelly));
  const recommended = Math.min(0.02, Math.max(0.005, clampedFullKelly * fractionalMultiplier));

  return {
    fullKellyPercent: parseFloat((clampedFullKelly * 100).toFixed(2)),
    recommendedFractionalPercent: parseFloat((recommended * 100).toFixed(2)),
  };
}
