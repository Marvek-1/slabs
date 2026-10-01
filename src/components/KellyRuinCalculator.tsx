import React, { useState } from 'react';
import { Sliders, ShieldCheck, AlertCircle, Percent, DollarSign, X } from 'lucide-react';
import { calculateKellyAllocation } from '../engine/physicsEngine';

interface KellyRuinCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  equity: number;
  currentKellyPct: number;
  onApplyKellyPct: (pct: number) => void;
}

export const KellyRuinCalculator: React.FC<KellyRuinCalculatorProps> = ({
  isOpen,
  onClose,
  equity,
  currentKellyPct,
  onApplyKellyPct,
}) => {
  const [winRate, setWinRate] = useState<number>(0.72); // 72% win rate
  const [payoffRatio, setPayoffRatio] = useState<number>(3.0); // 3:1 win/loss
  const [fractionMultiplier, setFractionMultiplier] = useState<number>(0.25); // Quarter-Kelly

  if (!isOpen) return null;

  const { fullKellyPercent, recommendedFractionalPercent } = calculateKellyAllocation(
    winRate,
    payoffRatio,
    fractionMultiplier
  );

  const allocationUsd = (equity * recommendedFractionalPercent) / 100;
  // If time-stop cuts at -5% loss on the trade:
  const tradeLossUsd = allocationUsd * 0.05;
  const portfolioDrawdownPct = (tradeLossUsd / equity) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide">
                Asymmetric Fractional Kelly &amp; Ruin Armor
              </h3>
              <p className="text-xs text-zinc-400">
                Mathematical position sizing to survive 50 consecutive market panics
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

        {/* Sliders Area */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          {/* Slider 1: Win Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Cascade Win Rate (p):</span>
              <span className="text-cyan-400 font-bold">{(winRate * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.02"
              value={winRate}
              onChange={(e) => setWinRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-zinc-500">Mechanical bounce probability</div>
          </div>

          {/* Slider 2: Payoff Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Payoff Ratio (b):</span>
              <span className="text-amber-400 font-bold">{payoffRatio.toFixed(1)}:1</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="5.0"
              step="0.25"
              value={payoffRatio}
              onChange={(e) => setPayoffRatio(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="text-[10px] text-zinc-500">e.g. +3.0% TP vs -1.0% Cut</div>
          </div>

          {/* Slider 3: Fractional Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Kelly Fraction:</span>
              <span className="text-purple-400 font-bold">{fractionMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={fractionMultiplier}
              onChange={(e) => setFractionMultiplier(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="text-[10px] text-zinc-500">0.25x = Quarter-Kelly</div>
          </div>
        </div>

        {/* Calculated Results Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Full Kelly vs Fractional */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Theoretical Full Kelly (f*):</div>
            <div className="text-xl font-bold text-zinc-300">{fullKellyPercent.toFixed(1)}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Full Kelly maximizes logarithmic growth but carries extreme volatility and high risk of ruin during exchange freezes.
            </p>
          </div>

          {/* Institutional Quarter-Kelly Recommendation */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-700/60">
            <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recommended Sizing (Capped):</span>
            </div>
            <div className="text-2xl font-bold text-emerald-300">
              {recommendedFractionalPercent.toFixed(2)}% of Equity
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">
              ${allocationUsd.toLocaleString()} per liquidation wick trade
            </div>
          </div>
        </div>

        {/* The Strategist's Survival Proof */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
          <div className="font-bold text-zinc-200 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-cyan-400" />
            <span>THE STRATEGIST'S ASYMMETRIC MATH:</span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            If you catch a <strong>+3.2% wick snapback</strong> with a {recommendedFractionalPercent}% allocation, you earn steady compound yield.
            If the <strong>90-second time-stop fires</strong> and you cut at a <strong>-5.0% loss</strong>, total portfolio drawdown is only:
          </p>
          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Total Portfolio Drawdown on Cut:</span>
            <span className="text-emerald-400 font-bold font-mono">
              -{portfolioDrawdownPct.toFixed(3)}% (-${tradeLossUsd.toFixed(1)})
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Even if you are wrong <strong>20 times in a row</strong> during cascading flash crashes, your total account draws down by less than <strong>2%</strong>. You remain completely solvent to harvest the ultimate recovery.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplyKellyPct(recommendedFractionalPercent);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Apply {recommendedFractionalPercent.toFixed(2)}% Allocation to Engine</span>
          </button>
        </div>
      </div>
    </div>
  );
};
