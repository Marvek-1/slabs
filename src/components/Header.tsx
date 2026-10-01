import React from 'react';
import {
  Activity,
  ShieldAlert,
  Server,
  Sparkles,
  BookOpen,
  Wifi,
  Radio,
  Sliders,
} from 'lucide-react';
import { MachineState } from '../types';

interface HeaderProps {
  currentPair: string;
  onPairChange: (pair: string) => void;
  machineState: MachineState;
  isLiveFeed: boolean;
  onToggleLiveFeed: () => void;
  serverProximity: string;
  cancelOnDisconnect: boolean;
  onToggleCod: () => void;
  onOpenAdvisor: () => void;
  onOpenBlueprint: () => void;
  onOpenKellyModal: () => void;
  portfolioEquity: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPair,
  onPairChange,
  machineState,
  isLiveFeed,
  onToggleLiveFeed,
  cancelOnDisconnect,
  onToggleCod,
  onOpenAdvisor,
  onOpenBlueprint,
  onOpenKellyModal,
  portfolioEquity,
}) => {
  const getStateBadge = () => {
    switch (machineState) {
      case 'IDLE':
        return {
          bg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
          label: 'STATE: IDLE (MONITORING)',
          dot: 'bg-zinc-400',
        };
      case 'ARMED':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          label: 'STATE: NET ARMED (LIMIT BUY RESTING)',
          dot: 'bg-amber-400',
        };
      case 'FILLED':
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          label: 'STATE: FILLED (90s SNAPBACK CLOCK)',
          dot: 'bg-purple-400 animate-ping',
        };
      case 'EXIT_TP':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          label: 'STATE: EXIT TAKE-PROFIT (+3.2%)',
          dot: 'bg-emerald-400',
        };
      case 'TIME_STOP_CUT':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          label: 'STATE: 90s TIME-STOP CUT',
          dot: 'bg-rose-400',
        };
      case 'CIRCUIT_BREAKER_HALT':
        return {
          bg: 'bg-red-950/80 text-red-300 border-red-600',
          label: 'CIRCUIT BREAKER: CONTAGION HALT',
          dot: 'bg-red-500',
        };
      default:
        return {
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          label: machineState,
          dot: 'bg-zinc-400',
        };
    }
  };

  const badge = getStateBadge();

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Pair Selection */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-sm sm:text-base text-zinc-100">
                LIQUIDATION VACUUM ENGINE
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-cyan-800/40">
                v2.4 Quant Core
              </span>
            </div>
            <div className="text-xs text-zinc-400 hidden sm:flex items-center gap-2">
              <span>The Architect &amp; The Strategist</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">L2 Air Pocket &amp; Stress Console</span>
            </div>
          </div>

          {/* Pair Selector */}
          <div className="flex items-center ml-2 sm:ml-4 bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].map((pair) => (
              <button
                key={pair}
                onClick={() => onPairChange(pair)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currentPair === pair
                    ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pair.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Live / Sim Toggle & Server Status */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          {/* Live vs Sandbox toggle */}
          <button
            onClick={onToggleLiveFeed}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all ${
              isLiveFeed
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300 shadow-sm'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle between Live Binance WebSocket stream and High-Fidelity Physics Simulator"
          >
            {isLiveFeed ? <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <Wifi className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{isLiveFeed ? 'LIVE BINANCE WS' : 'PHYSICS SANDBOX'}</span>
          </button>

          {/* Cancel on Disconnect COD Toggle */}
          <button
            onClick={onToggleCod}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
              cancelOnDisconnect
                ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 line-through'
            }`}
            title="Cancel-on-Disconnect (COD) ensures resting orders drop if exchange heartbeat drops"
          >
            <Server className="w-3.5 h-3.5" />
            <span>COD: {cancelOnDisconnect ? 'ARMED' : 'OFF'}</span>
          </button>

          {/* State Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono font-medium ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Right: Quant Tools & Modals */}
        <div className="flex items-center gap-2">
          {/* Portfolio Equity */}
          <div className="hidden lg:flex flex-col text-right font-mono mr-1">
            <span className="text-[10px] text-zinc-500 uppercase">Capital Pool</span>
            <span className="text-xs font-bold text-zinc-200">${portfolioEquity.toLocaleString()}</span>
          </div>

          {/* Kelly Calculator Button */}
          <button
            onClick={onOpenKellyModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 text-xs font-mono transition-colors"
            title="Fractional Kelly & Ruin Management Workbench"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Kelly Sizing</span>
          </button>

          {/* Blueprint Modal Button */}
          <button
            onClick={onOpenBlueprint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 text-xs font-mono transition-colors"
            title="View The Architect & Strategist System Blueprint"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Blueprint</span>
          </button>

          {/* Gemini AI Advisor Button */}
          <button
            onClick={onOpenAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 hover:border-purple-400 text-xs font-mono font-semibold transition-all shadow-sm shadow-purple-950"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Gemini Quant AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
