import React from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { MachineState, ActivePosition } from '../types';

interface ExecutionEnginePanelProps {
  machineState: MachineState;
  onArmNet: () => void;
  onTriggerCascade: () => void;
  onSimulateBounce: () => void;
  onSimulateSnapbackFail: () => void;
  onResetEngine: () => void;
  activePosition: ActivePosition | null;
  snapbackSeconds: number;
  exhaustionPrice: number | null;
  cvi: number;
  logs: string[];
}

export const ExecutionEnginePanel: React.FC<ExecutionEnginePanelProps> = ({
  machineState,
  onArmNet,
  onTriggerCascade,
  onSimulateBounce,
  onSimulateSnapbackFail,
  onResetEngine,
  activePosition,
  snapbackSeconds,
  exhaustionPrice,
  cvi,
  logs,
}) => {
  const maxHoldSeconds = 90;
  const remainingSeconds = Math.max(0, maxHoldSeconds - snapbackSeconds);
  const progressPct = ((maxHoldSeconds - remainingSeconds) / maxHoldSeconds) * 100;

  // Circular progress calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono flex flex-col gap-4 shadow-lg">
      {/* Header with Pipeline Diagram */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-zinc-100 uppercase">
            State Machine &amp; 90s Deterministic Time-Stop
          </h3>
        </div>

        {/* Pipeline breadcrumbs */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className={machineState === 'IDLE' ? 'text-cyan-400 font-bold' : ''}>IDLE</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className={machineState === 'ARMED' ? 'text-amber-400 font-bold' : ''}>ARMED</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className={machineState === 'FILLED' ? 'text-purple-400 font-bold' : ''}>FILLED (90s)</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span
            className={
              machineState === 'EXIT_TP'
                ? 'text-emerald-400 font-bold'
                : machineState === 'TIME_STOP_CUT'
                ? 'text-rose-400 font-bold'
                : ''
            }
          >
            EXIT (TP / CUT)
          </span>
        </div>
      </div>

      {/* Main Execution Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 90s Snapback Chronometer (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col items-center justify-between text-center">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Deterministic Snapback Timer
          </div>

          {/* SVG Circular Progress Meter */}
          <div className="relative w-28 h-28 flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                className="text-zinc-800 stroke-current"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                className={`stroke-current transition-all duration-300 ${
                  machineState === 'FILLED'
                    ? remainingSeconds < 25
                      ? 'text-rose-500'
                      : 'text-purple-500'
                    : machineState === 'EXIT_TP'
                    ? 'text-emerald-500'
                    : machineState === 'TIME_STOP_CUT'
                    ? 'text-rose-500'
                    : 'text-zinc-700'
                }`}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner countdown readout */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-zinc-100">
                {machineState === 'FILLED' ? `${remainingSeconds}s` : machineState === 'EXIT_TP' ? 'WIN' : machineState === 'TIME_STOP_CUT' ? 'CUT' : '90s'}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase">
                {machineState === 'FILLED' ? 'Holding' : 'Window'}
              </span>
            </div>
          </div>

          {/* Position PnL Readout */}
          <div className="w-full mt-2 pt-2 border-t border-zinc-800/80">
            {activePosition ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Position PnL:</span>
                <span
                  className={`font-bold ${
                    activePosition.unrealizedPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activePosition.unrealizedPnlPercent >= 0 ? '+' : ''}
                  {activePosition.unrealizedPnlPercent.toFixed(2)}% ($
                  {activePosition.unrealizedPnlUsd >= 0 ? '+' : ''}
                  {activePosition.unrealizedPnlUsd.toFixed(0)})
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500">No active vacuum position</div>
            )}
          </div>
        </div>

        {/* Center: Action Trigger Controls (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Execution Triggers
          </div>

          <div className="space-y-2">
            {/* Button 1: Arm The Net */}
            <button
              onClick={onArmNet}
              disabled={machineState !== 'IDLE'}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                machineState === 'IDLE'
                  ? cvi >= 3.0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30 animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  : 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. Arm Net (Post-Only Limit Buy)</span>
            </button>

            {/* Button 2: Detonate Liquidation Cascade */}
            <button
              onClick={onTriggerCascade}
              disabled={machineState !== 'ARMED'}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                machineState === 'ARMED'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/40'
                  : 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>2. Detonate Cascade (Fill Net)</span>
            </button>

            {/* Button 3: Simulate Snapback Reversion */}
            <button
              onClick={onSimulateBounce}
              disabled={machineState !== 'FILLED'}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                machineState === 'FILLED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3A. Mean Reversion Bounce (Exit TP)</span>
            </button>

            {/* Button 4: Simulate Snapback Failure (Structural Collapse) */}
            <button
              onClick={onSimulateSnapbackFail}
              disabled={machineState !== 'FILLED'}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                machineState === 'FILLED'
                  ? 'bg-rose-900/80 hover:bg-rose-800 border border-rose-600 text-rose-200'
                  : 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>3B. Snapback Failed (90s Time-Stop Cut)</span>
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={onResetEngine}
            className="mt-2.5 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Simulation State</span>
          </button>
        </div>

        {/* Right: Live Execution Engine Log (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 pb-1.5 border-b border-zinc-800">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              ENGINE EXECUTION LOG
            </span>
            <span className="text-[10px] text-zinc-500">Microsecond stream</span>
          </div>

          {/* Log window */}
          <div className="flex-1 my-2 overflow-y-auto max-h-[160px] space-y-1 text-[11px] text-zinc-400 pr-1 scrollbar-thin">
            {logs.slice(-6).map((log, idx) => (
              <div key={idx} className="leading-tight font-mono">
                <span className="text-zinc-600 select-none">&gt; </span>
                <span
                  className={
                    log.includes('FILLED')
                      ? 'text-purple-300 font-bold'
                      : log.includes('TAKE-PROFIT')
                      ? 'text-emerald-300 font-bold'
                      : log.includes('TIME-STOP') || log.includes('EMERGENCY')
                      ? 'text-rose-300 font-bold'
                      : log.includes('ARMED')
                      ? 'text-amber-300'
                      : 'text-zinc-300'
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>

          {/* Contingent OCO Server-side status note */}
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Contingent Server OCO Active</span>
            </span>
            <span className="text-zinc-400 font-semibold">Post-Only Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
