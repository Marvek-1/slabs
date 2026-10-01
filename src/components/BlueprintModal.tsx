import React from 'react';
import { BookOpen, X, Code, ShieldCheck, Flame, Server, Layers, TrendingDown } from 'lucide-react';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-zinc-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide">
                System Engineering Blueprint: The Architect &amp; The Strategist
              </h2>
              <p className="text-xs text-zinc-400">
                Institutional Liquidation Vacuum Engine Specification &amp; Stress Armor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Part 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase">
              <Code className="w-4 h-4" />
              <span>Part 1: The Architect (System Blueprint &amp; Pipeline)</span>
            </div>
            <p className="text-zinc-400 text-xs">
              A production-grade vacuum engine runs across three distinct asynchronous layers:
            </p>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto text-zinc-300">
              <pre>{`[ Exchange WebSockets ]
   │  ├── L2 Orderbook Depth (100ms)
   │  ├── Aggregated Trades (Tick stream)
   │  └── Open Interest (OI) Stream
   ▼
[ Real-Time Analytics Engine ]
   │  ├── Reconstructs Local L2/L3 Book
   │  ├── Calculates Cascade Vulnerability Index (CVI)
   │  └── Projects Exhaustion Point (The Net)
   ▼
[ State Machine & Risk Guard ] ───► [ Order Placement: Post-Only Limit ]
   │                                      │
   │                                      ▼
   └─── Timer Loop: 90s Snapback Check ◄── [ Order Filled ]
           ├── Target Reached? ────────► Exit TP
           └── Timeout / Floor Broken? ─► Emergency Market Cut`}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-xs font-bold text-cyan-300 mb-1">Cascade Vulnerability Index (CVI)</div>
                <div className="bg-zinc-950 p-2 rounded text-zinc-200 font-mono text-[11px] mb-1">
                  CVI = Cluster Size ($) / Cumulative Resting Bids ($)
                </div>
                <p className="text-[11px] text-zinc-400">
                  • <strong>CVI &lt; 1.0</strong>: Resting bids absorb cascade. No trade.<br />
                  • <strong>CVI &gt; 3.0</strong>: Book is paper-thin. Free-fall into the net guaranteed. Arm post-only limit.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-xs font-bold text-purple-300 mb-1">90-Second Snapback Invalidation</div>
                <p className="text-[11px] text-zinc-400">
                  Mechanical liquidation cascades snap back rapidly when forced selling ends. If the market fails to mean-revert within <strong>90 seconds</strong>, it is not a temporary liquidity dislocation—it is structural collapse. Emergency market cut triggers immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Part 2 */}
          <section className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Part 2: The Strategist (Stress-Testing &amp; The 3 Hammers)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <Server className="w-3.5 h-3.5" />
                  <span>Hammer 1: The Exchange API Meltdown (Matching Engine Freeze)</span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-1">
                  During giant cascades, WebSocket feeds drop and REST latency spikes to 4,000ms+ with HTTP 429 errors.
                  <strong> Solution:</strong> Submit entries as server-side <em>Contingent OCO</em> orders directly on the exchange engine with attached TP and hard stop. Host nodes on AWS Tokyo <code className="text-cyan-300">ap-northeast-1</code> with Cancel-on-Disconnect (COD).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Hammer 2: Phantom Clusters and Order Book Spoofing</span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-1">
                  Predatory whales place $50M bid walls 4% below market and cancel them in 1ms.
                  <strong> Solution:</strong> Never calculate the net using resting bids alone. Verify liquidation coordinates using <em>Executed Volume Delta</em> and <em>Debt Invariants</em> ($\Delta OI &gt; 0$ at minting). Unverified walls are flagged and ignored.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Hammer 3: Ruin Management &amp; Systemic Collapse (Luna/FTX -80%)</span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-1">
                  When a localized wick becomes a systemic contagion collapse.
                  <strong> Solution:</strong> Cross-Asset Correlation checks (if BTC, ETH, and credit dump together, instantly disarm all nets) + Asymmetric Fractional Kelly Sizing (1.5% to 2.0% equity cap). Even 20 consecutive failed trades draw down portfolio by only ~1.8%.
                </p>
              </div>
            </div>
          </section>

          {/* The Synthesis */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-800/60 text-xs">
            <h4 className="font-bold text-zinc-100 mb-1 uppercase tracking-wide">The Synthesis</h4>
            <p className="text-zinc-300 leading-relaxed">
              When you merge the Architect and the Strategist:
              <br />
              • The Architect builds a machine that <strong>refuses to trade unless the math proves a vacuum exists.</strong>
              <br />
              • The Strategist builds the safety armor that <strong>assumes every trade could be an exchange collapse.</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
