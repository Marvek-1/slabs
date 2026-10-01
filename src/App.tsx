/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { OrderBookDepthVisualizer } from './components/OrderBookDepthVisualizer';
import { ExecutionEnginePanel } from './components/ExecutionEnginePanel';
import { StressTestingHammers } from './components/StressTestingHammers';
import { KellyRuinCalculator } from './components/KellyRuinCalculator';
import { GeminiQuantAdvisor } from './components/GeminiQuantAdvisor';
import { BlueprintModal } from './components/BlueprintModal';
import { ShadowTraderConsole } from './components/ShadowTraderConsole';
import {
  createInitialSimulationState,
  generateSyntheticOrderBook,
  PAIR_CONFIGS,
} from './engine/simulationCore';
import {
  computeAirPocketUsd,
  calculateCvi,
  calculateExhaustionEntry,
} from './engine/physicsEngine';
import { MachineState, ActivePosition, HammerType, TradeHistoryItem } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<'SHADOW_TRADER' | 'ARCHITECT_CONSOLE'>('SHADOW_TRADER');
  const [currentPair, setCurrentPair] = useState('BTC/USDT');
  const [simState, setSimState] = useState(() => createInitialSimulationState('BTC/USDT'));

  // Modals & Panels
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isKellyOpen, setIsKellyOpen] = useState(false);

  // Live execution logs
  const [logs, setLogs] = useState<string[]>([
    'Vacuum Engine v2.4 initialized in AWS ap-northeast-1 (Tokyo).',
    'Local L2 delta book depth synchronized with 100ms cadence.',
    'Resting bids scanned. Air pocket calculation active.',
  ]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setLogs((prev) => [...prev.slice(-40), `[${timestamp}] ${msg}`]);
  }, []);

  // Update pair
  const handlePairChange = (newPair: string) => {
    setCurrentPair(newPair);
    const fresh = createInitialSimulationState(newPair);
    setSimState(fresh);
    addLog(`Switched target symbol to ${newPair}. Recalibrating cluster invariants.`);
  };

  // State Machine: 90-second chronometer loop
  useEffect(() => {
    let interval: any = null;
    if (simState.machineState === 'FILLED') {
      interval = setInterval(() => {
        setSimState((prev) => {
          const nextHold = prev.snapbackHoldSeconds + 1;

          // Check if 90s time-stop triggered
          if (nextHold >= 90) {
            addLog(
              '⚠️ TIME-STOP TRIGGERED (90s EXPIRED): Market failed to mean-revert. Structural collapse confirmed. Emergency market close executed.'
            );
            return {
              ...prev,
              machineState: 'TIME_STOP_CUT',
              snapbackHoldSeconds: nextHold,
              activePosition: prev.activePosition
                ? {
                    ...prev.activePosition,
                    unrealizedPnlPercent: -4.8,
                    unrealizedPnlUsd: -((prev.activePosition.sizeUsd * 0.048)),
                    exitReason: '90s Time-Stop Cut',
                  }
                : null,
            };
          }

          // Otherwise update position tracking
          const pnlJitter = (Math.random() - 0.46) * 0.4;
          const currentPnl = prev.activePosition
            ? Math.min(2.8, Math.max(-4.2, prev.activePosition.unrealizedPnlPercent + pnlJitter))
            : 0;

          return {
            ...prev,
            snapbackHoldSeconds: nextHold,
            activePosition: prev.activePosition
              ? {
                  ...prev.activePosition,
                  elapsedSeconds: nextHold,
                  unrealizedPnlPercent: currentPnl,
                  unrealizedPnlUsd: (prev.activePosition.sizeUsd * currentPnl) / 100,
                }
              : null,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simState.machineState, addLog]);

  // Order Book background micro-jitter (to keep L2 book feeling real and alive)
  useEffect(() => {
    if (simState.isLiveFeed) return;

    const interval = setInterval(() => {
      setSimState((prev) => {
        if (prev.machineState === 'FILLED' || prev.machineState === 'CIRCUIT_BREAKER_HALT') {
          return prev;
        }

        const config = PAIR_CONFIGS[prev.pair] || PAIR_CONFIGS['BTC/USDT'];
        const priceDrift = (Math.random() - 0.5) * (config.basePrice * 0.0003);
        const newMid = Number((prev.orderbook.currentPrice + priceDrift).toFixed(2));

        // Recompute metrics
        const { airPocketDepthUsd, levelsCount } = computeAirPocketUsd(
          prev.orderbook.bids,
          newMid,
          prev.cluster.price
        );
        const cvi = calculateCvi(prev.cluster.volumeUsd, airPocketDepthUsd);
        const { exhaustionPrice } = calculateExhaustionEntry(
          prev.orderbook.bids,
          prev.cluster.price,
          prev.cluster.volumeUsd,
          3.0,
          1.2
        );

        return {
          ...prev,
          orderbook: {
            ...prev.orderbook,
            currentPrice: newMid,
          },
          metrics: {
            ...prev.metrics,
            airPocketDepthUsd,
            cvi,
            exhaustionPrice,
            restingBidsCount: levelsCount,
            tickVelocity: Math.floor(28 + Math.random() * 22),
          },
        };
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [simState.isLiveFeed]);

  // Action: Arm The Net (Post-Only Limit Buy)
  const handleArmNet = () => {
    if (simState.metrics.cvi < 1.0) {
      addLog(
        `REJECTED ARM: CVI is ${simState.metrics.cvi.toFixed(2)}x (< 1.0). Orderbook is too thick; resting bids will absorb cascade. No vacuum expected.`
      );
      return;
    }

    if (!simState.metrics.exhaustionPrice) {
      addLog('REJECTED ARM: Exhaustion floor calculation incomplete.');
      return;
    }

    addLog(
      `🎯 NET ARMED: Post-Only Limit Buy placed at $${simState.metrics.exhaustionPrice.toLocaleString()} (Exhaustion Floor). Attached server-side Contingent OCO TP (+3.2%) and COD.`
    );

    setSimState((prev) => ({
      ...prev,
      machineState: 'ARMED',
    }));
  };

  // Action: Detonate Liquidation Cascade (Fills Net)
  const handleTriggerCascade = () => {
    const exhaustion = simState.metrics.exhaustionPrice || simState.cluster.price * 0.965;
    const allocationUsd = (simState.portfolioEquity * simState.fractionalKellyPct) / 100;

    addLog(`💥 CASCADE DETONATED: Estimated $${(simState.cluster.volumeUsd / 1000000).toFixed(1)}M forced long liquidations triggered.`);
    addLog(`⚡ TICK VELOCITY SPIKE: 1,840 trades/sec. Price punched through Air Pocket vacuum.`);
    addLog(`✅ POST-ONLY LIMIT FILLED at $${exhaustion.toLocaleString()}. Size: $${allocationUsd.toLocaleString()} (${simState.fractionalKellyPct}% Kelly Allocation).`);
    addLog(`⏱️ 90-SECOND COUNTDOWN STARTED. Contingent OCO TP target resting at $${(exhaustion * 1.032).toFixed(2)}.`);

    const newPosition: ActivePosition = {
      pair: simState.pair,
      entryPrice: exhaustion,
      sizeUsd: allocationUsd,
      allocationPercent: simState.fractionalKellyPct,
      targetTp: Number((exhaustion * 1.032).toFixed(2)),
      fillTimestamp: Date.now(),
      elapsedSeconds: 0,
      currentPrice: exhaustion,
      unrealizedPnlPercent: 0,
      unrealizedPnlUsd: 0,
    };

    setSimState((prev) => ({
      ...prev,
      machineState: 'FILLED',
      snapbackHoldSeconds: 0,
      activePosition: newPosition,
      orderbook: {
        ...prev.orderbook,
        currentPrice: exhaustion,
      },
      metrics: {
        ...prev.metrics,
        tickVelocity: 1840,
      },
    }));
  };

  // Action: Mean Reversion Bounce (Take-Profit Hit)
  const handleSimulateBounce = () => {
    if (!simState.activePosition) return;

    const tpPrice = simState.activePosition.targetTp;
    const profitUsd = (simState.activePosition.sizeUsd * 0.032);

    addLog(`🚀 MEAN REVERSION BOUNCE COMPLETE: Price snapped back to $${tpPrice.toLocaleString()}.`);
    addLog(`🏆 TAKE-PROFIT EXECUTED: Position closed at +3.20% (+$${profitUsd.toFixed(1)}). Capital preserved and increased.`);

    const tradeItem: TradeHistoryItem = {
      id: `trade-${Date.now()}`,
      timestamp: Date.now(),
      state: 'EXIT_TP',
      entryPrice: simState.activePosition.entryPrice,
      exitPrice: tpPrice,
      holdDurationSeconds: simState.snapbackHoldSeconds,
      pnlPercent: 3.2,
      pnlUsd: profitUsd,
      outcome: 'TAKE_PROFIT',
      cviAtEntry: simState.metrics.cvi,
    };

    setSimState((prev) => ({
      ...prev,
      machineState: 'EXIT_TP',
      portfolioEquity: prev.portfolioEquity + profitUsd,
      tradeHistory: [tradeItem, ...prev.tradeHistory],
      activePosition: {
        ...prev.activePosition!,
        unrealizedPnlPercent: 3.2,
        unrealizedPnlUsd: profitUsd,
        exitReason: 'Take-Profit Reversion Hit',
      },
      orderbook: {
        ...prev.orderbook,
        currentPrice: tpPrice,
      },
      metrics: {
        ...prev.metrics,
        tickVelocity: 42,
      },
    }));
  };

  // Action: Snapback Failure (Emergency Market Cut)
  const handleSimulateSnapbackFail = () => {
    if (!simState.activePosition) return;

    const cutLossUsd = (simState.activePosition.sizeUsd * 0.048);
    const exitPrice = simState.activePosition.entryPrice * 0.952;

    addLog('🛑 MECHANICAL WICK FAILED TO SNAP BACK: Market remained suppressed after 90s.');
    addLog(`✂️ EMERGENCY MARKET CUT EXECUTED at $${exitPrice.toFixed(2)} (-4.8% loss on trade). Total portfolio drawdown only -${((cutLossUsd / simState.portfolioEquity) * 100).toFixed(3)}% via Kelly Sizing.`);

    const tradeItem: TradeHistoryItem = {
      id: `trade-${Date.now()}`,
      timestamp: Date.now(),
      state: 'TIME_STOP_CUT',
      entryPrice: simState.activePosition.entryPrice,
      exitPrice,
      holdDurationSeconds: simState.snapbackHoldSeconds,
      pnlPercent: -4.8,
      pnlUsd: -cutLossUsd,
      outcome: 'TIME_STOP_CUT',
      cviAtEntry: simState.metrics.cvi,
    };

    setSimState((prev) => ({
      ...prev,
      machineState: 'TIME_STOP_CUT',
      portfolioEquity: prev.portfolioEquity - cutLossUsd,
      tradeHistory: [tradeItem, ...prev.tradeHistory],
      activePosition: {
        ...prev.activePosition!,
        unrealizedPnlPercent: -4.8,
        unrealizedPnlUsd: -cutLossUsd,
        exitReason: '90s Deterministic Time-Stop',
      },
    }));
  };

  // Action: Reset Engine
  const handleResetEngine = () => {
    const fresh = createInitialSimulationState(currentPair);
    setSimState((prev) => ({
      ...fresh,
      portfolioEquity: prev.portfolioEquity,
      fractionalKellyPct: prev.fractionalKellyPct,
      tradeHistory: prev.tradeHistory,
    }));
    addLog('🔄 State machine reset. Local orderbook and air pocket physics recalibrated to IDLE.');
  };

  // Live WebSocket Toggle
  const handleToggleLiveFeed = () => {
    if (!simState.isLiveFeed) {
      addLog('Connecting to Binance Public WebSocket feed (depth20@100ms)...');
      setSimState((prev) => ({ ...prev, isLiveFeed: true }));
      // Attempt live connection
      try {
        const symbol = PAIR_CONFIGS[currentPair]?.symbol.toLowerCase() || 'btcusdt';
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@depth20@100ms`);

        ws.onopen = () => {
          addLog(`🟢 Binance WebSocket live connected for ${symbol.toUpperCase()}. Real-time L2 delta active.`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.bids && data.asks) {
              const bids = data.bids.map((b: string[]) => ({
                price: parseFloat(b[0]),
                size: parseFloat(b[1]),
                totalUsd: parseFloat(b[0]) * parseFloat(b[1]),
                cumulativeUsd: 0,
              }));
              const asks = data.asks.map((a: string[]) => ({
                price: parseFloat(a[0]),
                size: parseFloat(a[1]),
                totalUsd: parseFloat(a[0]) * parseFloat(a[1]),
                cumulativeUsd: 0,
              }));

              // Accumulate USD
              let cumBids = 0;
              bids.forEach((b: any) => {
                cumBids += b.totalUsd;
                b.cumulativeUsd = cumBids;
              });

              let cumAsks = 0;
              asks.forEach((a: any) => {
                cumAsks += a.totalUsd;
                a.cumulativeUsd = cumAsks;
              });

              const mid = bids.length > 0 && asks.length > 0 ? (bids[0].price + asks[0].price) / 2 : bids[0]?.price || 64000;

              setSimState((p) => {
                const { airPocketDepthUsd } = computeAirPocketUsd(bids, mid, p.cluster.price);
                const cvi = calculateCvi(p.cluster.volumeUsd, airPocketDepthUsd);
                const { exhaustionPrice } = calculateExhaustionEntry(bids, p.cluster.price, p.cluster.volumeUsd);

                return {
                  ...p,
                  orderbook: {
                    bids,
                    asks,
                    currentPrice: mid,
                    lastUpdateId: data.lastUpdateId || Date.now(),
                    timestamp: Date.now(),
                  },
                  metrics: {
                    ...p.metrics,
                    airPocketDepthUsd,
                    cvi,
                    exhaustionPrice,
                  },
                };
              });
            }
          } catch (e) {
            // silent parse error
          }
        };

        ws.onerror = () => {
          addLog('Binance WebSocket unreachable or rate-limited. Falling back smoothly to synthetic high-fidelity engine.');
          setSimState((prev) => ({ ...prev, isLiveFeed: false }));
        };
      } catch (err) {
        addLog('WebSocket initialization error. Using synthetic physics mode.');
        setSimState((prev) => ({ ...prev, isLiveFeed: false }));
      }
    } else {
      addLog('Switched from Live Feed to Physics Simulation Sandbox.');
      setSimState((prev) => ({ ...prev, isLiveFeed: false }));
    }
  };

  // Toggle Cancel On Disconnect (COD)
  const handleToggleCod = () => {
    setSimState((prev) => {
      const nextCod = !prev.metrics.cancelOnDisconnectActive;
      addLog(`Cancel-on-Disconnect (COD) is now ${nextCod ? 'ARMED' : 'DISABLED'}.`);
      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          cancelOnDisconnectActive: nextCod,
        },
      };
    });
  };

  // Run Hammer 1: API Meltdown Test
  const handleRunHammer1 = () => {
    addLog('🚨 INJECTING HAMMER 1: Matching engine queue freeze & API 429 storm.');
    setSimState((prev) => ({
      ...prev,
      hammer: {
        activeHammer: 'HAMMER_1_MELTDOWN',
        title: 'Exchange API Meltdown Test',
        injectedAt: Date.now(),
        stage: 'TRIGGERED',
        log: [
          'REST Latency spiked: 14ms -> 4,280ms.',
          'Incoming HTTP 429: Too Many Requests from exchange edge.',
          'Naive Client Stop: Rejected by API. Client hangs while price plunges -18.4%.',
          'Strategist Contingent OCO: Pre-existing server-side bracket executed natively on exchange core. Zero slippage.',
        ],
        metrics: {
          latency: 4280,
          api429Count: 142,
          spoofBidPulled: false,
          systemicCorrelation: 0.32,
          vulnerableLossPercent: -18.4,
          strategistResultPercent: 0.0,
        },
      },
    }));
  };

  // Run Hammer 2: Phantom Spoofing Test
  const handleRunHammer2 = () => {
    addLog('🚨 INJECTING HAMMER 2: Predatory $50M Whale Spoof Wall placed.');
    // Inject spoof wall into book first
    const spoofedBook = generateSyntheticOrderBook(
      simState.orderbook.currentPrice,
      simState.cluster.price,
      simState.cluster.volumeUsd,
      0.15,
      true
    );

    setSimState((prev) => ({
      ...prev,
      orderbook: spoofedBook,
      hammer: {
        activeHammer: 'HAMMER_2_SPOOF',
        title: 'Phantom Wall & Spoofing Defense',
        injectedAt: Date.now(),
        stage: 'TRIGGERED',
        log: [
          'Whale placed $50M resting bid wall 4% below market.',
          'Naive Scanner: flags CVI < 1.0, assumes structural floor.',
          'Cascade triggered: Whale pulled $50M order in 1.2 milliseconds!',
          'Strategist Audit: Debt Invariant Check flagged Delta OI = 0% at level minting.',
          'VERDICT: Level identified as PHANTOM_WALL_SPOOF. Stand down, net disarmed.',
        ],
        metrics: {
          latency: 14,
          api429Count: 0,
          spoofBidPulled: true,
          systemicCorrelation: 0.32,
          vulnerableLossPercent: -14.2,
          strategistResultPercent: 0.0,
        },
      },
    }));
  };

  // Run Hammer 3: Systemic Contagion (-80%)
  const handleRunHammer3 = () => {
    addLog('🚨 INJECTING HAMMER 3: Systemic Contagion & Ruin Shock (Luna/FTX Waterfall).');
    setSimState((prev) => ({
      ...prev,
      machineState: 'CIRCUIT_BREAKER_HALT',
      metrics: {
        ...prev.metrics,
        crossAssetCorrelation: 0.94, // Contagion threshold reached
      },
      hammer: {
        activeHammer: 'HAMMER_3_SYSTEMIC',
        title: 'Systemic Ruin & Contagion Circuit Breaker',
        injectedAt: Date.now(),
        stage: 'TRIGGERED',
        log: [
          'Cross-Asset Contagion detected: BTC, ETH, and global credit falling in unison.',
          'Correlation coefficient jumped to 0.94 (Macro Panic threshold > 0.85).',
          'CIRCUIT BREAKER ENGAGED: All nets disarmed immediately.',
          'Unhedged/All-In Degen: Caught in -80% waterfall -> 100% Account Liquidation.',
          'Strategist Fractional Kelly (1.8%): Max portfolio drawdown capped at -0.09%. Desk retains 99.91% capital.',
        ],
        metrics: {
          latency: 22,
          api429Count: 0,
          spoofBidPulled: false,
          systemicCorrelation: 0.94,
          vulnerableLossPercent: -80.0,
          strategistResultPercent: -0.09,
        },
      },
    }));
  };

  const handleResetHammers = () => {
    setSimState((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        crossAssetCorrelation: 0.32,
      },
      hammer: {
        activeHammer: 'NONE',
        title: 'Ready for Stress Injections',
        injectedAt: null,
        stage: 'IDLE',
        log: ['Stress test resolved. Engine returned to baseline monitoring.'],
        metrics: {
          latency: 14,
          api429Count: 0,
          spoofBidPulled: false,
          systemicCorrelation: 0.32,
          vulnerableLossPercent: 0,
          strategistResultPercent: 0,
        },
      },
    }));
    addLog('Stress tests cleared. Systems returning to baseline nominal operation.');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentPair={currentPair}
        onPairChange={handlePairChange}
        machineState={simState.machineState}
        isLiveFeed={simState.isLiveFeed}
        onToggleLiveFeed={handleToggleLiveFeed}
        serverProximity={simState.metrics.serverProximity}
        cancelOnDisconnect={simState.metrics.cancelOnDisconnectActive}
        onToggleCod={handleToggleCod}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenBlueprint={() => setIsBlueprintOpen(true)}
        onOpenKellyModal={() => setIsKellyOpen(true)}
        portfolioEquity={simState.portfolioEquity}
      />

      {/* Primary Mode Switcher */}
      <div className="bg-zinc-950/95 border-b border-zinc-800/80 px-4 py-2 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('SHADOW_TRADER')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeView === 'SHADOW_TRADER'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SHADOW TRADER (ANTI-DELUSION FIFO)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 ml-1">
                shadow_trader.py
              </span>
            </button>

            <button
              onClick={() => setActiveView('ARCHITECT_CONSOLE')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeView === 'ARCHITECT_CONSOLE'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <span>THE ARCHITECT &amp; STRATEGIST (3 HAMMERS ARENA)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span className="text-emerald-400">100% Real Live Binance Futures</span>
            <span>•</span>
            <span className="text-zinc-400">Zero Financial Risk</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {activeView === 'SHADOW_TRADER' ? (
          <ShadowTraderConsole onBackToBlueprint={() => setIsBlueprintOpen(true)} />
        ) : (
          <>
            {/* Flagship Physics Telemetry Bar */}
            <MetricsBar
              metrics={simState.metrics}
              cluster={simState.cluster}
              currentPrice={simState.orderbook.currentPrice}
            />

            {/* Row 1: L2 Depth Visualizer & Air Pocket Profile */}
            <section>
              <OrderBookDepthVisualizer
                orderbook={simState.orderbook}
                cluster={simState.cluster}
                exhaustionPrice={simState.metrics.exhaustionPrice}
                cvi={simState.metrics.cvi}
              />
            </section>

            {/* Row 2: Part 1 The State Machine & 90s Deterministic Time-Stop Chronometer */}
            <section>
              <ExecutionEnginePanel
                machineState={simState.machineState}
                onArmNet={handleArmNet}
                onTriggerCascade={handleTriggerCascade}
                onSimulateBounce={handleSimulateBounce}
                onSimulateSnapbackFail={handleSimulateSnapbackFail}
                onResetEngine={handleResetEngine}
                activePosition={simState.activePosition}
                snapbackSeconds={simState.snapbackHoldSeconds}
                exhaustionPrice={simState.metrics.exhaustionPrice}
                cvi={simState.metrics.cvi}
                logs={logs}
              />
            </section>

            {/* Row 3: Part 2 The Strategist — The 3 Hammers Stress-Testing Arena */}
            <section>
              <StressTestingHammers
                hammerState={simState.hammer}
                onRunHammer1={handleRunHammer1}
                onRunHammer2={handleRunHammer2}
                onRunHammer3={handleRunHammer3}
                onResetHammers={handleResetHammers}
              />
            </section>
          </>
        )}
      </main>

      {/* Modals & Slide-out Drawers */}
      <GeminiQuantAdvisor
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        metrics={simState.metrics}
        cluster={simState.cluster}
        currentPrice={simState.orderbook.currentPrice}
        currentPair={currentPair}
        machineState={simState.machineState}
      />

      <BlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />

      <KellyRuinCalculator
        isOpen={isKellyOpen}
        onClose={() => setIsKellyOpen(false)}
        equity={simState.portfolioEquity}
        currentKellyPct={simState.fractionalKellyPct}
        onApplyKellyPct={(pct) => {
          setSimState((p) => ({ ...p, fractionalKellyPct: pct }));
          addLog(`Updated risk armor allocation to ${pct}% (Fractional Kelly).`);
        }}
      />
    </div>
  );
}
