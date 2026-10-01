import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  Zap,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { HammerType, HammerStressState } from '../types';

interface StressTestingHammersProps {
  hammerState: HammerStressState;
  onRunHammer1: () => void;
  onRunHammer2: () => void;
  onRunHammer3: () => void;
  onResetHammers: () => void;
}

export const StressTestingHammers: React.FC<StressTestingHammersProps> = ({
  hammerState,
  onRunHammer1,
  onRunHammer2,
  onRunHammer3,
  onResetHammers,
}) => {
  const [selectedTab, setSelectedTab] = useState<'HAMMER_1' | 'HAMMER_2' | 'HAMMER_3'>('HAMMER_1');

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Part 2: The Strategist — Stress-Testing &amp; The 3 Hammers
            </h3>
            <p className="text-[11px] text-zinc-400">
              Breaking the machine to build bulletproof crisis armor
            </p>
          </div>
        </div>

        {hammerState.activeHammer !== 'NONE' && (
          <button
            onClick={onResetHammers}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Stress Test</span>
          </button>
        )}
      </div>

      {/* Hammer Tab Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Tab 1 */}
        <button
          onClick={() => setSelectedTab('HAMMER_1')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedTab === 'HAMMER_1'
              ? 'bg-zinc-900 border-rose-500/70 shadow-sm'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-rose-400">HAMMER 1</span>
            <Server className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-xs font-semibold text-zinc-200">Exchange API Meltdown</div>
          <div className="text-[10px] text-zinc-500 mt-1">429 Rate Limits, 4,200ms Latency, Queue Freeze</div>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setSelectedTab('HAMMER_2')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedTab === 'HAMMER_2'
              ? 'bg-zinc-900 border-amber-500/70 shadow-sm'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-amber-400">HAMMER 2</span>
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-xs font-semibold text-zinc-200">Phantom Clusters &amp; Spoofing</div>
          <div className="text-[10px] text-zinc-500 mt-1">$50M Whale Wall pulled in 1 millisecond</div>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setSelectedTab('HAMMER_3')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedTab === 'HAMMER_3'
              ? 'bg-zinc-900 border-purple-500/70 shadow-sm'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-purple-400">HAMMER 3</span>
            <TrendingDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-xs font-semibold text-zinc-200">Systemic Ruin (-80% Waterfall)</div>
          <div className="text-[10px] text-zinc-500 mt-1">Luna/FTX Contagion &amp; Fractional Kelly Armor</div>
        </button>
      </div>

      {/* Content Area for Active Hammer */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
        {selectedTab === 'HAMMER_1' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-rose-400" />
                  HAMMER 1: THE MATCHING ENGINE FREEZE &amp; API MELTDOWN
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Simulating a $300M liquidation cascade overloading exchange matching engine queues.
                </p>
              </div>

              <button
                onClick={onRunHammer1}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow-md shadow-rose-950 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Inject API Meltdown Test</span>
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Vulnerable naive architecture */}
              <div className="p-3 rounded bg-red-950/20 border border-red-800/40">
                <div className="flex items-center justify-between text-rose-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    NAIVE BOT FAILURE
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-900/60 rounded text-red-200">
                    Client-Side TP/SL
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  Submits bare entry order. When limit fills, sends separate client-side Stop-Loss 8s later. API
                  responds with <code className="text-rose-300 bg-red-950 px-1 py-0.5 rounded">HTTP 429 Too Many Requests</code>. Latency spikes to 4,200ms. Price crashes through the floor while bot hangs.
                </p>
                <div className="pt-2 border-t border-red-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Execution Slippage:</span>
                  <span className="text-rose-400 font-bold">-18.4% (Catastrophic)</span>
                </div>
              </div>

              {/* The Strategist Fix */}
              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/40">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    THE STRATEGIST FIX
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-900/60 rounded text-emerald-200">
                    Contingent Server OCO + COD
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  1. <strong>Contingent Server-Side OCO:</strong> Limit entry natively carries attached TP and hard stop on the exchange matching engine. Zero client API calls required to exit.
                  <br />
                  2. <strong>Cancel-on-Disconnect (COD):</strong> If WebSocket drops, resting orders automatically evaporate on exchange servers.
                  <br />
                  3. <strong>Tokyo Co-Location:</strong> AWS <code className="text-cyan-300">ap-northeast-1</code> proximity guarantees 12ms pipeline.
                </p>
                <div className="pt-2 border-t border-emerald-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Engine Result:</span>
                  <span className="text-emerald-400 font-bold">0% Slippage (Protected by Exchange Core)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'HAMMER_2' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  HAMMER 2: PHANTOM CLUSTERS &amp; ORDER BOOK SPOOFING
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  A predatory whale posts a $50M bid wall 4% below market, then pulls it in 1ms as cascade arrives.
                </p>
              </div>

              <button
                onClick={onRunHammer2}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold shadow-md shadow-amber-950 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Inject $50M Spoof Wall Test</span>
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Naive bot */}
              <div className="p-3 rounded bg-red-950/20 border border-red-800/40">
                <div className="flex items-center justify-between text-rose-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    NAIVE BOT FAILURE
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-900/60 rounded text-red-200">
                    Resting Bids Only
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  Scans resting bids alone. Sees $50M bid wall and concludes: <em>"Thick structural support floor!"</em>
                  As soon as price cascades toward it, whale cancels the $50M order within 1 millisecond for zero cost.
                  Naive bot buys into thin air, catching the falling knife.
                </p>
                <div className="pt-2 border-t border-red-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Trap Outcome:</span>
                  <span className="text-rose-400 font-bold">-14.2% Falling Knife Trap</span>
                </div>
              </div>

              {/* The Strategist Fix */}
              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/40">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    THE STRATEGIST FIX
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-900/60 rounded text-emerald-200">
                    Executed Delta &amp; Debt Invariants
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  1. <strong>Ignore Passive Bids:</strong> Passive bids can be cancelled instantly for free.
                  <br />
                  2. <strong>Debt Invariant Verification:</strong> A genuine liquidation cluster is anchored by historical trades that created <em>Open Interest</em> ($\Delta OI &gt; 0$). If OI didn't spike when the zone was established, flag as <code className="text-amber-300">PHANTOM_WALL_SPOOF</code> and reject trade!
                </p>
                <div className="pt-2 border-t border-emerald-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Strategist Action:</span>
                  <span className="text-emerald-400 font-bold">Phantom Flagged &rarr; 0% Loss (Stand Down)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'HAMMER_3' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  HAMMER 3: RUIN MANAGEMENT &amp; SYSTEMIC COLLAPSE (LUNA / FTX -80%)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  When a localized mechanical wick turns into an uncontainable multi-day macro liquidation waterfall.
                </p>
              </div>

              <button
                onClick={onRunHammer3}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold shadow-md shadow-purple-950 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Inject Systemic Contagion (-80%)</span>
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Naive Trader */}
              <div className="p-3 rounded bg-red-950/20 border border-red-800/40">
                <div className="flex items-center justify-between text-rose-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    UNHEDGED / DEGEN ALL-IN
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-900/60 rounded text-red-200">
                    Full Capital At Risk
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  Assumes every cascade is an artificial mechanical wick that snaps back. Risks 20% to 100% of capital.
                  When a depeg or exchange insolvency occurs, price falls 20% (fills net), falls another 30%, and continues down -80%. The entire fund is completely wiped out.
                </p>
                <div className="pt-2 border-t border-red-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Total Account Drawdown:</span>
                  <span className="text-rose-400 font-bold">-80% to -100% (TOTAL RUIN)</span>
                </div>
              </div>

              {/* The Strategist Fix */}
              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/40">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    THE STRATEGIST SHIELD
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-900/60 rounded text-emerald-200">
                    Cross-Asset Correlation + Kelly Sizing
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  1. <strong>Cross-Asset Correlation Circuit Breaker:</strong> Localized wicks are asset-specific. Systemic collapses drop BTC, ETH, and global credit together (&rho; &gt; 0.85). If contagion detected, <strong>all nets instantly disarm!</strong>
                  <br />
                  2. <strong>Asymmetric Fractional Kelly (1.8% max equity):</strong> If a time-stop cuts at -5%, portfolio loss is only <strong>-0.09%</strong>. The desk survives 50 consecutive crises unharmed.
                </p>
                <div className="pt-2 border-t border-emerald-900/40 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Portfolio Drawdown:</span>
                  <span className="text-emerald-400 font-bold">-0.09% (99.91% Capital Safe)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Hammer Telemetry Stream */}
        {hammerState.activeHammer !== 'NONE' && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                STRESS-TEST TELEMETRY STREAM
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300">
                {hammerState.stage}
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5 space-y-1 text-[11px] font-mono max-h-24 overflow-y-auto">
              {hammerState.log.map((entry, idx) => (
                <div key={idx} className="text-zinc-300">
                  <span className="text-zinc-600">&gt; </span>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
