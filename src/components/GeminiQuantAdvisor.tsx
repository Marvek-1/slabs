import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  RotateCcw,
  Bot,
  User,
  X,
  Gauge,
  ShieldAlert,
  Clock,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { ChatMessage, QuantitativeMetrics, LiquidationCluster, MachineState } from '../types';

interface GeminiQuantAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: QuantitativeMetrics;
  cluster: LiquidationCluster;
  currentPrice: number;
  currentPair: string;
  machineState: MachineState;
}

export const GeminiQuantAdvisor: React.FC<GeminiQuantAdvisorProps> = ({
  isOpen,
  onClose,
  metrics,
  cluster,
  currentPrice,
  currentPair,
  machineState,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-01',
      role: 'model',
      content:
        'Greetings. I am your Lead Quantitative Risk Strategist. I have hooked into your live L2 orderbook delta stream, CVI physics, and the 90-second execution chronometer.\n\nUse the Instant Audit button for sub-second low-latency telemetry checks via gemini-3.1-flash-lite, or query me on any market microstructure, spoofing defense, or Kelly ruin dynamics.',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.1-flash-lite',
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash'>(
    'gemini-3.1-flash-lite'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [instantAuditLoading, setInstantAuditLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Single-Click Low-Latency Quant Audit
  const handleInstantAudit = async () => {
    setInstantAuditLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          orderbookData: {
            pair: currentPair,
            currentPrice,
            clusterPrice: cluster.price,
            clusterUsd: cluster.volumeUsd,
            airPocketDepthUsd: metrics.airPocketDepthUsd,
            cvi: metrics.cvi,
            exhaustionPrice: metrics.exhaustionPrice,
            deltaOi: metrics.oiDeltaPercent,
            tickVelocity: metrics.tickVelocity,
            crossAssetCorrelation: metrics.crossAssetCorrelation,
          },
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            id: `audit-${Date.now()}`,
            role: 'model',
            content: `⚡ **INSTANT QUANT AUDIT (${data.latencyMs}ms | ${data.modelUsed})**:\n\n${data.analysis}`,
            timestamp: Date.now(),
            modelUsed: data.modelUsed,
            latencyMs: data.latencyMs,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Audit failed:', err);
    } finally {
      setInstantAuditLoading(false);
    }
  };

  // Submit Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          context: {
            pair: currentPair,
            currentPrice,
            clusterPrice: cluster.price,
            clusterUsd: cluster.volumeUsd,
            airPocketDepthUsd: metrics.airPocketDepthUsd,
            cvi: metrics.cvi,
            exhaustionPrice: metrics.exhaustionPrice,
            state: machineState,
            holdSeconds: 0,
            contagionFilter: metrics.crossAssetCorrelation > 0.8,
          },
        }),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: data.reply || 'No analysis available.',
          timestamp: Date.now(),
          modelUsed: data.modelUsed || selectedModel,
          latencyMs: elapsed,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: 'Error communicating with Gemini service. Deterministic physics models remain operational locally.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Audit CVI ratio & Air Pocket physics for current book',
    'Explain why 90s time-stop cuts instead of trailing stop',
    'How does the engine protect against $50M phantom spoofing?',
    'Analyze systemic contagion vs localized wick',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col font-mono animate-slideIn">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100">Gemini Quant Advisor</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Low Latency AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Microstructure &amp; Failure Mode Intelligence</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Model & Low Latency Controls Bar */}
      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px]">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-purple-500"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fastest / Low Latency)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (General Reasoning)</option>
          </select>
        </div>

        {/* Instant Audit Trigger */}
        <button
          onClick={handleInstantAudit}
          disabled={instantAuditLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold shadow-sm transition-all"
        >
          <Zap className="w-3 h-3 text-amber-300" />
          <span>{instantAuditLoading ? 'Auditing...' : 'Instant Audit'}</span>
        </button>
      </div>

      {/* Live Telemetry Pill Snapshot */}
      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800/50 flex flex-wrap gap-2 text-[10px] text-zinc-400">
        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          Pair: <strong className="text-zinc-200">{currentPair}</strong>
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          CVI: <strong className={metrics.cvi >= 3.0 ? 'text-rose-400' : 'text-emerald-400'}>{metrics.cvi.toFixed(2)}x</strong>
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          State: <strong className="text-purple-300">{machineState}</strong>
        </span>
        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          Velocity: <strong className="text-zinc-200">{metrics.tickVelocity} tps</strong>
        </span>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-700/60 flex items-center justify-center shrink-0 text-purple-300">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200'
              }`}
            >
              {msg.content}

              {msg.latencyMs && (
                <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 text-[9px] text-zinc-500 flex items-center justify-between">
                  <span>{msg.modelUsed}</span>
                  <span className="text-emerald-400">{msg.latencyMs}ms response</span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-300 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Synthesizing quant risk telemetry...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Prompt Suggestions */}
      <div className="p-3 bg-zinc-900/40 border-t border-zinc-800/80 space-y-1.5">
        <div className="text-[10px] text-zinc-500 uppercase font-bold">Suggested Quant Queries</div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 text-zinc-300 hover:text-purple-300 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Quant Advisor (e.g. CVI confidence, spoof detection)..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-2 rounded-lg text-white transition-all ${
            input.trim() && !isLoading
              ? 'bg-purple-600 hover:bg-purple-500 shadow-md'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
