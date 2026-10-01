import React from 'react';
import {
  Gauge,
  Flame,
  Wind,
  Target,
  Zap,
  TrendingDown,
  Layers,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { QuantitativeMetrics, LiquidationCluster } from '../types';

interface MetricsBarProps {
  metrics: QuantitativeMetrics;
  cluster: LiquidationCluster;
  currentPrice: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  cluster,
  currentPrice,
}) => {
  const { cvi, airPocketDepthUsd, clusterUsd, exhaustionPrice, tickVelocity, crossAssetCorrelation, networkLatencyMs } =
    metrics;

  // CVI styling and recommendation
  const getCviDetails = () => {
    if (cvi >= 3.0) {
      return {
        label: 'VACUUM CONFIRMED',
        action: 'ARM THE NET',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
        barColor: 'bg-rose-500',
        widthPct: Math.min(100, (cvi / 5) * 100),
        desc: 'Book is paper-thin. Cascade will punch through resting bids like a vacuum.',
      };
    }
    if (cvi >= 1.0) {
      return {
        label: 'MODERATE FRICTION',
        action: 'MONITORING',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
        barColor: 'bg-amber-500',
        widthPct: Math.min(100, (cvi / 5) * 100),
        desc: 'Bids may partially slow cascade. Slippage and bounce friction are elevated.',
      };
    }
    return {
      label: 'THICK ORDER BOOK',
      action: 'NO TRADE',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
      barColor: 'bg-emerald-500',
      widthPct: Math.max(10, Math.min(100, (cvi / 5) * 100)),
      desc: 'Resting bids exceed cluster size. Liquidation will be absorbed naturally.',
    };
  };

  const cviInfo = getCviDetails();
  const airPocketPct = currentPrice > 0 ? Math.abs((currentPrice - cluster.price) / currentPrice) * 100 : 0;
  const exhaustionDistancePct =
    currentPrice > 0 && exhaustionPrice ? Math.abs((currentPrice - exhaustionPrice) / currentPrice) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-zinc-950 border-b border-zinc-800/80 font-mono">
      {/* Metric 1: CVI Gauge (Flagship Core Metric) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            CASCADE VULNERABILITY (CVI)
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${cviInfo.badgeBg}`}>
            {cviInfo.action}
          </span>
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className={`text-2xl font-bold tracking-tight ${cviInfo.textColor}`}>
            {cvi > 50 ? '>50.0x' : `${cvi.toFixed(2)}x`}
          </span>
          <span className="text-xs text-zinc-500">ratio (Cluster/AirPocket)</span>
        </div>

        {/* Progress bar with threshold markers */}
        <div className="mt-2">
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full ${cviInfo.barColor} transition-all duration-300`}
              style={{ width: `${cviInfo.widthPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>&lt;1.0 (Absorb)</span>
            <span className="text-amber-500 font-semibold">1.0-3.0</span>
            <span className="text-rose-400 font-bold">&ge;3.0 (Vacuum)</span>
          </div>
        </div>
      </div>

      {/* Metric 2: The Air Pocket Depth */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            AIR POCKET DEPTH
          </span>
          <span className="text-[10px] text-zinc-400">-{airPocketPct.toFixed(2)}% span</span>
        </div>

        <div className="my-1">
          <span className="text-2xl font-bold text-zinc-100">
            ${(airPocketDepthUsd / 1000000).toFixed(2)}M
          </span>
          <span className="text-xs text-zinc-500 ml-1.5">resting USD bids</span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span>Current: ${currentPrice.toLocaleString()}</span>
          <span className="text-zinc-500">&rarr;</span>
          <span>Cluster: ${cluster.price.toLocaleString()}</span>
        </div>
      </div>

      {/* Metric 3: Liquidation Cluster Target */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            LIQUIDATION CLUSTER
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${
              cluster.verifiedByOi
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-700/50 text-rose-300'
            }`}
          >
            {cluster.verifiedByOi ? 'OI VERIFIED' : 'PHANTOM/SPOOF'}
          </span>
        </div>

        <div className="my-1">
          <span className="text-2xl font-bold text-amber-300">
            ${(clusterUsd / 1000000).toFixed(1)}M
          </span>
          <span className="text-xs text-zinc-500 ml-1.5">Forced Fills</span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span className="text-amber-400/90 font-semibold">${cluster.price.toLocaleString()}</span>
          <span className="text-[10px] text-zinc-500">
            {cluster.isSpoofed ? '⚠️ Spoofed Wall' : 'Debt Invariant Valid'}
          </span>
        </div>
      </div>

      {/* Metric 4: The Net (Exhaustion Floor) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            EXHAUSTION FLOOR ("THE NET")
          </span>
          <span className="text-[10px] text-purple-300 px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800">
            120% Book Scan
          </span>
        </div>

        <div className="my-1">
          <span className="text-2xl font-bold text-purple-300">
            {exhaustionPrice ? `$${exhaustionPrice.toLocaleString()}` : 'CALCULATING...'}
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span className="text-zinc-500">Delta from Mid:</span>
          <span className="text-purple-400 font-semibold">
            {exhaustionPrice ? `-${exhaustionDistancePct.toFixed(2)}%` : '--'}
          </span>
        </div>
      </div>

      {/* Metric 5: Tick Stream Velocity & Contagion */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            TICK VELOCITY
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
              tickVelocity > 800
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
          >
            {tickVelocity > 800 ? 'BURST / CASCADE' : 'NORMAL'}
          </span>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-zinc-100">{tickVelocity}</span>
          <span className="text-xs text-zinc-500">fills/sec</span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span className="text-zinc-500">Cross-Asset &rho;:</span>
          <span
            className={`font-semibold ${
              crossAssetCorrelation > 0.8
                ? 'text-rose-400 font-bold'
                : crossAssetCorrelation > 0.6
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {crossAssetCorrelation.toFixed(2)} {crossAssetCorrelation > 0.8 ? '(CONTAGION)' : '(ISOLATED)'}
          </span>
        </div>
      </div>
    </div>
  );
};
