import React, { useState } from 'react';
import { OrderBook, LiquidationCluster } from '../types';
import { Target, Flame, AlertCircle, ArrowDown, Shield, Eye } from 'lucide-react';

interface OrderBookDepthVisualizerProps {
  orderbook: OrderBook;
  cluster: LiquidationCluster;
  exhaustionPrice: number | null;
  cvi: number;
}

export const OrderBookDepthVisualizer: React.FC<OrderBookDepthVisualizerProps> = ({
  orderbook,
  cluster,
  exhaustionPrice,
  cvi,
}) => {
  const [hoveredLevel, setHoveredLevel] = useState<{
    price: number;
    size: number;
    cumulativeUsd: number;
    side: 'bid' | 'ask';
  } | null>(null);

  const { bids, asks, currentPrice } = orderbook;

  // Find max cumulative depth to scale the bars
  const maxBidCum = bids.length > 0 ? bids[bids.length - 1].cumulativeUsd : 1000000;
  const maxAskCum = asks.length > 0 ? asks[asks.length - 1].cumulativeUsd : 1000000;
  const maxDepth = Math.max(maxBidCum, maxAskCum, 1);

  // Take top 16 asks and top 20 bids
  const displayAsks = asks.slice(0, 14).reverse();
  const displayBids = bids.slice(0, 22);

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono flex flex-col h-full shadow-lg">
      {/* Title & Legend Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-zinc-100 uppercase">
            Local L2 Order Book &amp; Depth Vacuum Profile
          </h3>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">100ms Delta Sync</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-950 border border-cyan-500/50" />
            <span className="text-cyan-300">Air Pocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-400" />
            <span className="text-amber-300">Liquidation Cluster</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500/30 border border-purple-400" />
            <span className="text-purple-300">The Net (Exhaustion)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: L2 Ladder + SVG Cumulative Depth Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Ladder table (7 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between text-xs overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 text-[10px] uppercase text-zinc-500 pb-1.5 border-b border-zinc-800 font-semibold px-2">
            <span>Price (USDT)</span>
            <span className="text-right">Size (Coin)</span>
            <span className="text-right">Level Depth ($)</span>
            <span className="text-right">Cumulative ($)</span>
          </div>

          {/* Asks (Sells) */}
          <div className="space-y-0.5 my-1">
            {displayAsks.map((ask) => {
              const widthPct = Math.min(100, (ask.cumulativeUsd / maxDepth) * 100);
              return (
                <div
                  key={`ask-${ask.price}`}
                  onMouseEnter={() =>
                    setHoveredLevel({
                      price: ask.price,
                      size: ask.size,
                      cumulativeUsd: ask.cumulativeUsd,
                      side: 'ask',
                    })
                  }
                  onMouseLeave={() => setHoveredLevel(null)}
                  className="grid grid-cols-4 px-2 py-0.5 rounded text-[11px] relative hover:bg-zinc-900 cursor-crosshair transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded-sm pointer-events-none"
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="text-rose-400 relative z-10 font-semibold">${ask.price.toFixed(2)}</span>
                  <span className="text-right text-zinc-300 relative z-10">{ask.size.toFixed(3)}</span>
                  <span className="text-right text-zinc-400 relative z-10">
                    ${(ask.totalUsd / 1000).toFixed(1)}k
                  </span>
                  <span className="text-right text-zinc-500 relative z-10">
                    ${(ask.cumulativeUsd / 1000000).toFixed(2)}M
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mid Price Separator */}
          <div className="bg-zinc-900 border-y border-zinc-700/80 px-3 py-1.5 my-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase">Mid Market:</span>
              <span className="text-sm font-bold text-zinc-100">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
              <ArrowDown className="w-3 h-3 animate-bounce" />
              <span>Cascade Vector &darr;</span>
            </div>
          </div>

          {/* Bids (Buys) Ladder with Air Pocket & Cluster Zones */}
          <div className="space-y-0.5 overflow-y-auto max-h-[360px] pr-1">
            {displayBids.map((bid) => {
              const widthPct = Math.min(100, (bid.cumulativeUsd / maxDepth) * 100);
              const isInsideAirPocket = bid.price > cluster.price && bid.price <= currentPrice;
              const isClusterLevel = Math.abs(bid.price - cluster.price) <= currentPrice * 0.0006;
              const isExhaustionLevel = exhaustionPrice
                ? Math.abs(bid.price - exhaustionPrice) <= currentPrice * 0.0006
                : false;
              const isSpoofed = bid.isSpoofedWall;

              return (
                <div
                  key={`bid-${bid.price}`}
                  onMouseEnter={() =>
                    setHoveredLevel({
                      price: bid.price,
                      size: bid.size,
                      cumulativeUsd: bid.cumulativeUsd,
                      side: 'bid',
                    })
                  }
                  onMouseLeave={() => setHoveredLevel(null)}
                  className={`grid grid-cols-4 px-2 py-0.5 rounded text-[11px] relative cursor-crosshair transition-all ${
                    isClusterLevel
                      ? 'bg-amber-950/40 border border-amber-500/70 font-bold text-amber-200 shadow-sm'
                      : isExhaustionLevel
                      ? 'bg-purple-950/50 border border-purple-500/80 font-bold text-purple-200'
                      : isSpoofed
                      ? 'bg-red-950/40 border border-red-500/80 font-bold text-red-200 animate-pulse'
                      : isInsideAirPocket
                      ? 'bg-cyan-950/20 text-cyan-200/90'
                      : 'hover:bg-zinc-900 text-emerald-400'
                  }`}
                >
                  {/* Depth Fill Bar */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 rounded-sm pointer-events-none transition-all ${
                      isClusterLevel
                        ? 'bg-amber-500/25'
                        : isExhaustionLevel
                        ? 'bg-purple-500/30'
                        : isSpoofed
                        ? 'bg-red-500/30'
                        : isInsideAirPocket
                        ? 'bg-cyan-500/10'
                        : 'bg-emerald-500/10'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />

                  {/* Level label & price */}
                  <div className="relative z-10 flex items-center gap-1.5">
                    {isClusterLevel ? (
                      <Flame className="w-3 h-3 text-amber-400 inline" />
                    ) : isExhaustionLevel ? (
                      <Target className="w-3 h-3 text-purple-400 inline" />
                    ) : isSpoofed ? (
                      <AlertCircle className="w-3 h-3 text-red-400 inline" />
                    ) : null}
                    <span>${bid.price.toFixed(2)}</span>
                  </div>

                  <span className="text-right text-zinc-300 relative z-10">{bid.size.toFixed(3)}</span>
                  <span className="text-right text-zinc-400 relative z-10">
                    ${(bid.totalUsd / 1000).toFixed(1)}k
                  </span>
                  <span className="text-right text-zinc-500 relative z-10">
                    ${(bid.cumulativeUsd / 1000000).toFixed(2)}M
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Physics Anatomy & Visual Curve (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 pb-2 border-b border-zinc-800">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>THE AIR POCKET ANATOMY</span>
            </div>

            {/* Explanatory Blueprint Map */}
            <div className="mt-3 space-y-2.5 text-xs">
              {/* Step 1: Mid */}
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Current Mid Price</div>
                  <div className="font-bold text-zinc-100">${currentPrice.toFixed(2)}</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Baseline</span>
              </div>

              {/* Step 2: Air Pocket Gap */}
              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 relative">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>AIR POCKET VACUUM</span>
                  <span className="text-[10px] text-cyan-400">CVI: {cvi.toFixed(1)}x</span>
                </div>
                <p className="text-[10px] text-cyan-200/70 mt-1 leading-relaxed">
                  Resting bids between current price and cluster are paper-thin. A forced cascade will punch
                  straight through with near-zero absorption.
                </p>
              </div>

              {/* Step 3: Liquidation Cluster */}
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-700/50">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    CLUSTER DETONATION
                  </span>
                  <span>${cluster.price.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-amber-200/70 mt-1">
                  Est. ${(cluster.volumeUsd / 1000000).toFixed(1)}M forced market sell orders hitting the book.
                </div>
              </div>

              {/* Step 4: The Net */}
              <div className="p-2.5 rounded bg-purple-950/40 border border-purple-700/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-purple-400" />
                    THE NET (EXHAUSTION)
                  </span>
                  <span>${exhaustionPrice ? exhaustionPrice.toFixed(2) : '--'}</span>
                </div>
                <div className="text-[10px] text-purple-200/70 mt-1">
                  Deep bids cumulative absorption reaches &ge;120% of cluster volume ($
                  {((cluster.volumeUsd * 1.2) / 1000000).toFixed(1)}M). Post-only limit entry point.
                </div>
              </div>
            </div>
          </div>

          {/* Hover Inspector Footer */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400">
            {hoveredLevel ? (
              <div className="flex items-center justify-between">
                <span>
                  Inspect: <strong className="text-zinc-200">${hoveredLevel.price.toFixed(2)}</strong>
                </span>
                <span>
                  Cum: <strong className="text-zinc-200">${(hoveredLevel.cumulativeUsd / 1000000).toFixed(2)}M</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Eye className="w-3 h-3" />
                <span>Hover over order book levels to inspect exact liquidity depth</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
