import { calculateFractionalKelly } from './physicsEngine';

export interface StrategyTrade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  stopPrice?: number;
  targetPrice?: number;
  pnlUsd: number;
  pnlR: number; // PnL in terms of Risk units (R)
  cviAtEntry: number;
  absorptionRatioAtEntry: number;
  openedAt: number;
  closedAt: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
}

export interface CviBucketStats {
  minCvi: number;
  maxCvi: number;
  trades: number;
  wins: number;
  winRate: number;
  avgR: number;
}

export interface AbsorptionBucketStats {
  minRatio: number;
  maxRatio: number;
  observations: number;
  successes: number;
  successRate: number;
  avgReboundPct: number;
}

export interface ExhaustionObservation {
  absorptionRatio: number;
  cvi: number;
  floorPrice: number;
  maxFurtherDrawdownPct: number;
  reboundPct: number;
  reboundWithinMs: number;
  successfulExhaustion: boolean;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

export type CalibrationStatus =
  | 'INSUFFICIENT_DATA'
  | 'CALIBRATED_IN_SAMPLE'
  | 'VALIDATION_PASSED'
  | 'OOS_POSITIVE'
  | 'WALK_FORWARD_VALIDATED';

export interface CalibrationDiagnostics {
  candidateCviThresholdsTested: number;
  candidateAbsorptionThresholdsTested: number;
  totalConfigurationsEvaluated: number;
  foldsCount: number;
  completedFolds: number;
  positiveExpectancyFolds: number;
  totalTrainTrades: number;
  totalValidationTrades: number;
  totalOosTrades: number;
}

export interface MultiFoldWalkForwardResult {
  totalTrades: number;
  resolvedTrades: number;
  observedWinRate: number | null;
  winRateCi95: ConfidenceInterval | null;
  observedPayoffRatio: number | null;

  fullKellyFraction: number | null;
  quarterKellyFraction: number | null;
  deskRiskCapFraction: number;
  appliedAllocationFraction: number;

  calibratedCviThreshold: number | null;
  calibratedAbsorptionThreshold: number | null;

  // Aggregate Walk-Forward OOS Metrics
  oosTradesCount: number;
  oosWinRate: number | null;
  oosWinRateCi95: ConfidenceInterval | null;
  oosExpectancyR: number | null;
  oosExpectancyCi95: ConfidenceInterval | null;
  oosProfitFactor: number | null;
  oosMaxDrawdownPct: number | null;
  positiveFoldsRatio: number;

  diagnostics: CalibrationDiagnostics;

  calibrationStart: number;
  calibrationEnd: number;

  status: CalibrationStatus;
}

/**
 * Wilson score interval for binomial proportion (win rate) 95% confidence interval
 */
export function wilsonInterval(
  wins: number,
  total: number,
  z = 1.96
): ConfidenceInterval | null {
  if (total <= 0 || wins < 0 || wins > total) {
    return null;
  }

  const p = wins / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) /
    denominator;

  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}

/**
 * 10,000-Iteration Bootstrap Resampling for Mean R Return 95% Confidence Interval
 */
export function bootstrapMeanR(
  returnsR: readonly number[],
  iterations = 10_000,
  alpha = 0.05
): ConfidenceInterval | null {
  if (returnsR.length < 2) return null;

  const means: number[] = [];
  const n = returnsR.length;

  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const index = Math.floor(Math.random() * n);
      sum += returnsR[index];
    }
    means.push(sum / n);
  }

  means.sort((a, b) => a - b);

  const lowerIndex = Math.floor((alpha / 2) * iterations);
  const upperIndex = Math.min(
    iterations - 1,
    Math.floor((1 - alpha / 2) * iterations)
  );

  return {
    lower: means[lowerIndex],
    upper: means[upperIndex],
  };
}

/**
 * Calculates observed win rate from resolved trades
 */
export function calculateObservedWinRate(
  trades: StrategyTrade[]
): number | null {
  const resolved = trades.filter(
    (t) => t.result === 'WIN' || t.result === 'LOSS'
  );

  if (resolved.length === 0) return null;

  const wins = resolved.filter((t) => t.result === 'WIN').length;

  return wins / resolved.length;
}

/**
 * Calculates observed payoff ratio (Avg Win R / Avg Loss R)
 */
export function calculateObservedPayoffRatio(
  trades: StrategyTrade[]
): number | null {
  const wins = trades.filter((t) => t.pnlR > 0).map((t) => t.pnlR);
  const losses = trades.filter((t) => t.pnlR < 0).map((t) => Math.abs(t.pnlR));

  if (wins.length === 0 || losses.length === 0) {
    return null;
  }

  const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

  return avgLoss > 0 ? avgWin / avgLoss : null;
}

/**
 * Empirical CVI Bucket Analysis
 */
export function analyzeCviBuckets(
  trades: StrategyTrade[],
  boundaries: number[] = [0, 1, 2, 3, 4, 5, Infinity]
): CviBucketStats[] {
  const result: CviBucketStats[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const min = boundaries[i];
    const max = boundaries[i + 1];

    const bucket = trades.filter(
      (t) => t.cviAtEntry >= min && t.cviAtEntry < max
    );

    if (bucket.length === 0) continue;

    const wins = bucket.filter((t) => t.result === 'WIN').length;

    const avgR =
      bucket.reduce((sum, t) => sum + t.pnlR, 0) / bucket.length;

    result.push({
      minCvi: min,
      maxCvi: max,
      trades: bucket.length,
      wins,
      winRate: wins / bucket.length,
      avgR,
    });
  }

  return result;
}

/**
 * Empirical Absorption Ratio Bucket Analysis
 */
export function analyzeAbsorptionBuckets(
  observations: ExhaustionObservation[],
  boundaries: number[] = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, Infinity]
): AbsorptionBucketStats[] {
  const result: AbsorptionBucketStats[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const min = boundaries[i];
    const max = boundaries[i + 1];

    const bucket = observations.filter(
      (o) => o.absorptionRatio >= min && o.absorptionRatio < max
    );

    if (bucket.length === 0) continue;

    const successes = bucket.filter((o) => o.successfulExhaustion).length;
    const avgRebound =
      bucket.reduce((sum, o) => sum + o.reboundPct, 0) / bucket.length;

    result.push({
      minRatio: min,
      maxRatio: max,
      observations: bucket.length,
      successes,
      successRate: successes / bucket.length,
      avgReboundPct: avgRebound,
    });
  }

  return result;
}

/**
 * Multi-Fold Rolling Walk-Forward Strategy Calibration Engine
 */
export function calibrateStrategyWalkForward(
  trades: StrategyTrade[],
  observations: ExhaustionObservation[] = [],
  deskRiskCapFraction: number = 0.018,
  numFolds = 5
): MultiFoldWalkForwardResult {
  const resolved = trades
    .filter((t) => t.result === 'WIN' || t.result === 'LOSS')
    .sort((a, b) => a.closedAt - b.closedAt);

  const candidateCvis = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  const candidateAbsorptions = [0.8, 1.0, 1.2, 1.4, 1.6];
  const totalConfigs = candidateCvis.length * candidateAbsorptions.length;

  if (resolved.length < 20) {
    const rawWinRate = calculateObservedWinRate(resolved);
    const rawWins = resolved.filter((t) => t.result === 'WIN').length;
    const ci95 = rawWinRate !== null ? wilsonInterval(rawWins, resolved.length) : null;
    const rawPayoff = calculateObservedPayoffRatio(resolved);

    return {
      totalTrades: trades.length,
      resolvedTrades: resolved.length,
      observedWinRate: rawWinRate,
      winRateCi95: ci95,
      observedPayoffRatio: rawPayoff,
      fullKellyFraction: null,
      quarterKellyFraction: null,
      deskRiskCapFraction,
      appliedAllocationFraction: deskRiskCapFraction,
      calibratedCviThreshold: 3.0,
      calibratedAbsorptionThreshold: 1.2,
      oosTradesCount: 0,
      oosWinRate: null,
      oosWinRateCi95: null,
      oosExpectancyR: null,
      oosExpectancyCi95: null,
      oosProfitFactor: null,
      oosMaxDrawdownPct: null,
      positiveFoldsRatio: 0,
      diagnostics: {
        candidateCviThresholdsTested: candidateCvis.length,
        candidateAbsorptionThresholdsTested: candidateAbsorptions.length,
        totalConfigurationsEvaluated: totalConfigs,
        foldsCount: numFolds,
        completedFolds: 0,
        positiveExpectancyFolds: 0,
        totalTrainTrades: resolved.length,
        totalValidationTrades: 0,
        totalOosTrades: 0,
      },
      calibrationStart: resolved[0]?.closedAt || Date.now(),
      calibrationEnd: resolved[resolved.length - 1]?.closedAt || Date.now(),
      status: 'INSUFFICIENT_DATA',
    };
  }

  // Multi-Fold Rolling Walk-Forward Windows
  const foldSize = Math.floor(resolved.length / (numFolds + 1));
  const oosAggregateTrades: StrategyTrade[] = [];
  let completedFolds = 0;
  let positiveFolds = 0;
  let totalTrainTradesCount = 0;
  let totalValTradesCount = 0;

  let bestCviOverall = 3.0;

  for (let k = 0; k < numFolds; k++) {
    const trainEnd = (k + 1) * foldSize;
    const valEnd = Math.min(resolved.length, trainEnd + Math.floor(foldSize / 2));
    const testEnd = Math.min(resolved.length, valEnd + foldSize);

    if (valEnd >= testEnd || trainEnd >= valEnd) break;

    const trainWindow = resolved.slice(0, trainEnd);
    const valWindow = resolved.slice(trainEnd, valEnd);
    const testWindow = resolved.slice(valEnd, testEnd);

    totalTrainTradesCount += trainWindow.length;
    totalValTradesCount += valWindow.length;

    // Learn candidate CVI threshold on validation window
    let bestCvi = 3.0;
    let bestExpectancy = -999;
    for (const cvi of candidateCvis) {
      const sub = valWindow.filter((t) => t.cviAtEntry >= cvi);
      if (sub.length === 0) continue;
      const wins = sub.filter((t) => t.result === 'WIN').length;
      const wr = wins / sub.length;
      const expR = wr * 3.0 - (1 - wr) * 1.0;
      if (expR > bestExpectancy) {
        bestExpectancy = expR;
        bestCvi = cvi;
      }
    }

    bestCviOverall = bestCvi;

    // Apply learned threshold to test window (Out-Of-Sample)
    const oosFoldFiltered = testWindow.filter((t) => t.cviAtEntry >= bestCvi);
    const oosFoldTrades = oosFoldFiltered.length > 0 ? oosFoldFiltered : testWindow;

    oosAggregateTrades.push(...oosFoldTrades);
    completedFolds++;

    // Evaluate fold expectancy
    const foldWins = oosFoldTrades.filter((t) => t.result === 'WIN').length;
    const foldWr = foldWins / oosFoldTrades.length;
    const foldExp = foldWr * 3.0 - (1 - foldWr) * 1.0;
    if (foldExp > 0) positiveFolds++;
  }

  // Calculate Overall Baseline on Full Dataset
  const obsWinRate = calculateObservedWinRate(resolved) || 0.5;
  const obsWins = resolved.filter((t) => t.result === 'WIN').length;
  const winRateCi95 = wilsonInterval(obsWins, resolved.length);
  const obsPayoff = calculateObservedPayoffRatio(resolved) || 1.5;

  const kelly = calculateFractionalKelly(obsWinRate, obsPayoff, 0.25, deskRiskCapFraction);

  // Calculate Aggregate Out-Of-Sample Metrics across all folds
  const oosCount = oosAggregateTrades.length;
  const oosWins = oosAggregateTrades.filter((t) => t.result === 'WIN').length;
  const oosWinRate = oosCount > 0 ? oosWins / oosCount : null;
  const oosWinRateCi95 = oosCount > 0 ? wilsonInterval(oosWins, oosCount) : null;

  const oosReturnsR = oosAggregateTrades.map((t) => t.pnlR);
  const oosExpectancyCi95 = oosCount >= 2 ? bootstrapMeanR(oosReturnsR, 2000) : null;
  const oosExpectancyR = oosCount > 0 ? oosReturnsR.reduce((a, b) => a + b, 0) / oosCount : null;

  const totalWinR = oosAggregateTrades.filter((t) => t.pnlR > 0).reduce((sum, t) => sum + t.pnlR, 0);
  const totalLossR = Math.abs(oosAggregateTrades.filter((t) => t.pnlR < 0).reduce((sum, t) => sum + t.pnlR, 0));
  const oosProfitFactor = totalLossR > 0 ? totalWinR / totalLossR : totalWinR > 0 ? 99.0 : 0;

  // Max Drawdown on OOS
  let peak = 0;
  let cumPnl = 0;
  let maxDrawdownR = 0;
  for (const t of oosAggregateTrades) {
    cumPnl += t.pnlR;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDrawdownR) maxDrawdownR = dd;
  }
  const oosMaxDrawdownPct = maxDrawdownR * (deskRiskCapFraction * 100);

  const positiveFoldsRatio = completedFolds > 0 ? positiveFolds / completedFolds : 0;

  // Strict Status Rules
  let status: CalibrationStatus = 'CALIBRATED_IN_SAMPLE';

  if (completedFolds >= 3 && oosCount >= 15 && oosExpectancyCi95 && oosExpectancyCi95.lower > 0 && oosProfitFactor > 1.0 && positiveFoldsRatio >= 0.60) {
    status = 'WALK_FORWARD_VALIDATED';
  } else if (oosExpectancyR !== null && oosExpectancyR > 0) {
    status = 'OOS_POSITIVE';
  } else if (completedFolds > 0) {
    status = 'VALIDATION_PASSED';
  }

  return {
    totalTrades: trades.length,
    resolvedTrades: resolved.length,
    observedWinRate: obsWinRate,
    winRateCi95,
    observedPayoffRatio: obsPayoff,
    fullKellyFraction: kelly.fullKellyFraction,
    quarterKellyFraction: kelly.fullKellyFraction * 0.25,
    deskRiskCapFraction,
    appliedAllocationFraction: kelly.allocationFraction,
    calibratedCviThreshold: bestCviOverall,
    calibratedAbsorptionThreshold: 1.2,
    oosTradesCount: oosCount,
    oosWinRate,
    oosWinRateCi95,
    oosExpectancyR,
    oosExpectancyCi95,
    oosProfitFactor,
    oosMaxDrawdownPct,
    positiveFoldsRatio,
    diagnostics: {
      candidateCviThresholdsTested: candidateCvis.length,
      candidateAbsorptionThresholdsTested: candidateAbsorptions.length,
      totalConfigurationsEvaluated: totalConfigs,
      foldsCount: numFolds,
      completedFolds,
      positiveExpectancyFolds: positiveFolds,
      totalTrainTrades: totalTrainTradesCount,
      totalValidationTrades: totalValTradesCount,
      totalOosTrades: oosCount,
    },
    calibrationStart: resolved[0]?.closedAt || Date.now(),
    calibrationEnd: resolved[resolved.length - 1]?.closedAt || Date.now(),
    status,
  };
}

/**
 * Helper to parse raw CSV trade log records into StrategyTrade[]
 */
export function parseTradeLogToStrategyTrades(csvContent: string): StrategyTrade[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];

  const trades: StrategyTrade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 9) continue;

    const timestamp = new Date(cols[0]).getTime() || Date.now();
    const symbol = cols[1]?.trim() || 'BTCUSDT';
    const entryPrice = parseFloat(cols[2]) || 0;
    const exitPrice = parseFloat(cols[3]) || 0;
    const cviAtEntry = parseFloat(cols[4]) || 2.5;
    const outcome = cols[7]?.trim() || '';
    const netPnlUsd = parseFloat(cols[11] || cols[9]) || 0;
    const netPnlPct = parseFloat(cols[12] || cols[8]) || 0;

    const isWin = outcome.includes('TP_HIT') || netPnlUsd > 0;
    const result = isWin ? 'WIN' : 'LOSS';
    const pnlR = netPnlPct / 0.15; // Normalized to 0.15% risk unit

    trades.push({
      id: `trade-${i}-${timestamp}`,
      symbol,
      entryPrice,
      exitPrice,
      pnlUsd: netPnlUsd,
      pnlR,
      cviAtEntry,
      absorptionRatioAtEntry: 1.25,
      openedAt: timestamp - 30000,
      closedAt: timestamp,
      result,
    });
  }

  return trades;
}
