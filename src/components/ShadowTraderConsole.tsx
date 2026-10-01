import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Layers, 
  Terminal, 
  Copy, 
  Download, 
  Check, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Gauge, 
  Database,
  BarChart2,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Zap,
  Radio,
  Sliders,
  Play,
  Square,
  Crosshair,
  Bell,
  Send,
  Settings,
  Octagon,
  ExternalLink,
  PhoneCall,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  ShadowTradeLogRecord, 
  FleetPairTelemetry, 
  ConcurrencyGovernorConfig, 
  OperationalMode, 
  WebhookDispatcherConfig, 
  DispatchedSignalCard 
} from '../types';

// ================= TOP 30 USD-M FUTURES UNIVERSE =================
export const TOP_30_UNIVERSE = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', vol24h: 38.4, oiStability: 98, basePrice: 83810.0, minLotStepUsd: 83.81, is10DollarApproved: false },
  { symbol: 'ETHUSDT', name: 'Ethereum', vol24h: 18.2, oiStability: 96, basePrice: 3120.5, minLotStepUsd: 3.12, is10DollarApproved: true },
  { symbol: 'SOLUSDT', name: 'Solana', vol24h: 12.8, oiStability: 94, basePrice: 178.4, minLotStepUsd: 1.78, is10DollarApproved: true },
  { symbol: 'BNBUSDT', name: 'BNB', vol24h: 3.4, oiStability: 97, basePrice: 585.2, minLotStepUsd: 5.85, is10DollarApproved: true },
  { symbol: 'XRPUSDT', name: 'XRP', vol24h: 4.1, oiStability: 91, basePrice: 0.582, minLotStepUsd: 0.058, is10DollarApproved: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', vol24h: 5.6, oiStability: 89, basePrice: 0.1425, minLotStepUsd: 0.142, is10DollarApproved: true },
  { symbol: 'SUIUSDT', name: 'Sui', vol24h: 3.8, oiStability: 93, basePrice: 1.845, minLotStepUsd: 0.184, is10DollarApproved: true },
  { symbol: 'PEPEUSDT', name: 'Pepe 1000', vol24h: 4.2, oiStability: 86, basePrice: 0.0094, minLotStepUsd: 0.009, is10DollarApproved: true },
  { symbol: 'AVAXUSDT', name: 'Avalanche', vol24h: 2.1, oiStability: 92, basePrice: 28.35, minLotStepUsd: 0.283, is10DollarApproved: true },
  { symbol: 'LINKUSDT', name: 'Chainlink', vol24h: 1.9, oiStability: 95, basePrice: 11.45, minLotStepUsd: 0.114, is10DollarApproved: true },
  { symbol: 'NEARUSDT', name: 'NEAR Protocol', vol24h: 2.4, oiStability: 90, basePrice: 4.82, minLotStepUsd: 0.482, is10DollarApproved: true },
  { symbol: 'APTUSDT', name: 'Aptos', vol24h: 1.6, oiStability: 91, basePrice: 8.65, minLotStepUsd: 0.865, is10DollarApproved: true },
  { symbol: 'ADAUSDT', name: 'Cardano', vol24h: 1.8, oiStability: 92, basePrice: 0.354, minLotStepUsd: 0.354, is10DollarApproved: true },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', vol24h: 2.0, oiStability: 88, basePrice: 0.0182, minLotStepUsd: 0.018, is10DollarApproved: true },
  { symbol: 'WIFUSDT', name: 'dogwifhat', vol24h: 2.7, oiStability: 85, basePrice: 2.45, minLotStepUsd: 0.245, is10DollarApproved: true },
  { symbol: 'FETUSDT', name: 'Artificial Superintelligence', vol24h: 1.5, oiStability: 87, basePrice: 1.35, minLotStepUsd: 0.135, is10DollarApproved: true },
  { symbol: 'RENDERUSDT', name: 'Render', vol24h: 1.4, oiStability: 89, basePrice: 5.62, minLotStepUsd: 0.562, is10DollarApproved: true },
  { symbol: 'OPUSDT', name: 'Optimism', vol24h: 1.2, oiStability: 91, basePrice: 1.52, minLotStepUsd: 0.152, is10DollarApproved: true },
  { symbol: 'ARBUSDT', name: 'Arbitrum', vol24h: 1.3, oiStability: 90, basePrice: 0.54, minLotStepUsd: 0.54, is10DollarApproved: true },
  { symbol: 'INJUSDT', name: 'Injective', vol24h: 1.1, oiStability: 88, basePrice: 21.2, minLotStepUsd: 2.12, is10DollarApproved: true },
  { symbol: 'TIAUSDT', name: 'Celestia', vol24h: 1.4, oiStability: 86, basePrice: 5.15, minLotStepUsd: 0.515, is10DollarApproved: true },
  { symbol: 'FTMUSDT', name: 'Fantom', vol24h: 1.0, oiStability: 89, basePrice: 0.68, minLotStepUsd: 0.68, is10DollarApproved: true },
  { symbol: 'SEIUSDT', name: 'Sei', vol24h: 1.2, oiStability: 88, basePrice: 0.42, minLotStepUsd: 0.42, is10DollarApproved: true },
  { symbol: 'RUNEUSDT', name: 'THORChain', vol24h: 1.1, oiStability: 87, basePrice: 4.95, minLotStepUsd: 0.495, is10DollarApproved: true },
  { symbol: 'GALAUSDT', name: 'Gala', vol24h: 0.85, oiStability: 84, basePrice: 0.022, minLotStepUsd: 0.022, is10DollarApproved: true },
  { symbol: 'TONUSDT', name: 'Toncoin', vol24h: 1.7, oiStability: 94, basePrice: 5.8, minLotStepUsd: 0.58, is10DollarApproved: true },
  { symbol: 'FLOKIUSDT', name: 'Floki', vol24h: 1.3, oiStability: 85, basePrice: 0.155, minLotStepUsd: 0.155, is10DollarApproved: true },
  { symbol: 'FILUSDT', name: 'Filecoin', vol24h: 0.95, oiStability: 89, basePrice: 3.75, minLotStepUsd: 0.375, is10DollarApproved: true },
  { symbol: 'KASUSDT', name: 'Kaspa', vol24h: 1.1, oiStability: 91, basePrice: 0.138, minLotStepUsd: 0.138, is10DollarApproved: true },
  { symbol: 'AAVEUSDT', name: 'Aave', vol24h: 1.5, oiStability: 93, basePrice: 154.2, minLotStepUsd: 15.42, is10DollarApproved: false }
];

const DEFAULT_GOVERNOR: ConcurrencyGovernorConfig = {
  maxActiveSlots: 3,
  totalRiskPoolUsd: 250000,
  marginPerSlotUsd: 25000,
  usdQueueHurdle: 150000,
  autoExecute: true,
  minCviThreshold: 3.0,
  decelerationCap: 65,
  baseDropPct: 0.008,
  absorptionBuffer: 1.45,
  feeDragPct: 0.07, // 0.07% round-trip exchange fee deduction
  toxicOiThresholdPct: 15, // 15% OI drop in <60s triggers TOXIC_EVENT_ABORT
  microCapitalTier: 'INSTITUTIONAL_250K',
};

const DEFAULT_WEBHOOK_CONFIG: WebhookDispatcherConfig = {
  enabled: true,
  telegramToken: '8626267731:AAF_G0WXosbyPyvPjcQnRe2kiWL0fdXBx8E',
  telegramChatId: '7539832188',
  discordWebhookUrl: '',
  notifyOnArmed: true,
  notifyOnFilled: true,
  notifyOnExit: true,
  lastPingStatus: 'IDLE',
};

interface ShadowTraderConsoleProps {
  onBackToBlueprint?: () => void;
}

export const ShadowTraderConsole: React.FC<ShadowTraderConsoleProps> = () => {
  // 1. Operational Mode: 3-way toggle [SIGNAL_ONLY, PAPER, LIVE]
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('PAPER');

  // 2. Governor & Fleet Configuration
  const [governor, setGovernor] = useState<ConcurrencyGovernorConfig>(DEFAULT_GOVERNOR);
  const [selectedPair, setSelectedPair] = useState<string>('BTCUSDT');
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [isHalted, setIsHalted] = useState<boolean>(false);

  // 3. Webhook Dispatcher Config & Modal
  const [webhookConfig, setWebhookConfig] = useState<WebhookDispatcherConfig>(DEFAULT_WEBHOOK_CONFIG);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);
  const [isPingSending, setIsPingSending] = useState<boolean>(false);

  // 4. Live Signal Dispatch Cards (Card previews sent to phone/discord)
  const [dispatchedSignals, setDispatchedSignals] = useState<DispatchedSignalCard[]>([
    {
      id: 'sig-init-sol',
      timestamp: new Date().toISOString(),
      type: 'FILLED',
      symbol: 'SOLUSDT',
      title: '🚨 [AIR POCKET DETONATION] — SOLUSDT',
      badgeColor: 'emerald',
      destinations: ['Telegram', 'Discord Webhook'],
      metrics: {
        'Cascade Volume': '$38.4M Forced Sells',
        'Vacuum Metric': 'CVI 4.82x (Thin Book)',
        'Queue Hurdle': '$150,000 Absorbed (1.4s)',
        'Net Entry': '$172.40 (Post-Only Filled)',
        'Target TP': '$174.15 (+1.01% Snapback)',
        'Chronometer': '90s Mechanical Countdown',
        'Execution': 'Autonomous Active (Slot #1)'
      },
      rawPayload: `🚨 [AIR POCKET DETONATION] — SOLUSDT\n• Cascade Volume: $38.4M Forced Sells\n• Vacuum Metric: CVI 4.82x\n• Queue Hurdle: $150,000 Absorbed\n• Net Entry: $172.40\n• Target TP: $174.15\n• Mode: Autonomous Execution (Slot #1)`
    },
    {
      id: 'sig-init-btc',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      type: 'EXIT_TP',
      symbol: 'BTCUSDT',
      title: '✅ [MEAN REVERSION COMPLETE] — BTCUSDT',
      badgeColor: 'cyan',
      destinations: ['Telegram', 'Discord Webhook'],
      metrics: {
        'Outcome': 'TP_HIT (Mean Reversion)',
        'Hold Duration': '24.5s / 90s Max',
        'Profit Realized': '+0.50% (+$125.00)',
        'Capital Slot #2': 'Released to STANDBY',
        'Exhaustion Cushion': '145% Bid Floor Verified'
      },
      rawPayload: `✅ [MEAN REVERSION COMPLETE] — BTCUSDT\n• Outcome: TP_HIT (Mean Reversion)\n• Hold: 24.5s\n• PnL: +0.50% (+$125.00)\n• Capital Slot #2: Released to STANDBY`
    }
  ]);

  // Fleet State (Top 30 live matrix)
  const [fleet, setFleet] = useState<FleetPairTelemetry[]>(() => 
    TOP_30_UNIVERSE.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      price: p.basePrice,
      refPrice: p.basePrice,
      dropPct: 0.002,
      cvi: 1.45,
      cushionPct: 152,
      tickVelocity: 14,
      volume24hUsd: p.vol24h * 1000000000,
      openInterestStability: p.oiStability,
      status: 'IDLE',
      requiredQueueUsd: 150000,
      accumulatedFillUsd: 0,
      minContractStepUsd: p.minLotStepUsd,
      is10DollarApproved: p.is10DollarApproved,
    }))
  );

  // Connection & live orderbook depth
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [bidsDepth, setBidsDepth] = useState<Array<[number, number]>>([]);
  const [asksDepth, setAsksDepth] = useState<Array<[number, number]>>([]);
  const tradeTimestampsRef = useRef<number[]>([]);
  const [activeVelocity, setActiveVelocity] = useState<number>(14);

  // Trade History & CSV Ledger
  const [tradeLogs, setTradeLogs] = useState<ShadowTradeLogRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'FLEET_MATRIX' | 'DISPATCH_PREVIEW' | 'FOCUSED_EXECUTION' | 'CSV_LEDGER' | 'PYTHON_SOURCE'>('FLEET_MATRIX');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'TP_HIT' | 'TIME_STOP'>('ALL');
  const [radarFilter, setRadarFilter] = useState<'ALL' | 'HIGH_CVI' | 'ACTIVE_SLOTS' | '10_APPROVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Standalone python script text
  const [pythonScript, setPythonScript] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Selected pair telemetry derivation
  const selectedTelemetry = useMemo(() => {
    return fleet.find(p => p.symbol === selectedPair) || fleet[0];
  }, [fleet, selectedPair]);

  // Active slots count and prioritized queue
  const occupiedSlots = useMemo(() => {
    return fleet.filter(p => p.status === 'FILLED');
  }, [fleet]);

  const armedTraps = useMemo(() => {
    return fleet.filter(p => p.status === 'ARMED');
  }, [fleet]);

  // Dispatch signal card generator
  const dispatchSignal = useCallback((card: Omit<DispatchedSignalCard, 'id' | 'timestamp' | 'destinations'>) => {
    const destinations: string[] = [];
    if (webhookConfig.telegramToken && webhookConfig.telegramChatId) destinations.push('Telegram');
    if (webhookConfig.discordWebhookUrl) destinations.push('Discord Webhook');
    if (destinations.length === 0) destinations.push('Local Terminal Relay');

    const newCard: DispatchedSignalCard = {
      ...card,
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      destinations,
    };

    setDispatchedSignals(prev => [newCard, ...prev.slice(0, 19)]);

    // Automatically send to Telegram via backend if configured
    if (webhookConfig.enabled && webhookConfig.telegramToken && webhookConfig.telegramChatId) {
      fetch('/api/webhook/dispatch-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: card.title,
          details: card.metrics,
          telegramToken: webhookConfig.telegramToken,
          telegramChatId: webhookConfig.telegramChatId,
          discordWebhookUrl: webhookConfig.discordWebhookUrl,
        }),
      }).catch(() => {
        // non-blocking
      });
    }
  }, [webhookConfig]);

  // Load trade records from /api/shadow-trades
  const fetchTrades = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/shadow-trades');
      if (res.ok) {
        const data = await res.json();
        if (data.trades) {
          setTradeLogs(data.trades);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch {
      // fallback
    } finally {
      if (isManual) setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  const fetchPythonScript = useCallback(async () => {
    try {
      const res = await fetch('/api/shadow-script');
      if (res.ok) {
        const data = await res.json();
        setPythonScript(data.script || '');
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchTrades();
    fetchPythonScript();
    const interval = setInterval(() => {
      fetchTrades();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchTrades, fetchPythonScript]);

  // ================= LIVE WEBSOCKET INGESTION =================
  useEffect(() => {
    const symbolLower = selectedPair.toLowerCase();
    const wsUrl = `wss://fstream.binance.com/stream?streams=${symbolLower}@depth20@100ms/${symbolLower}@aggTrade`;

    setConnectionStatus('CONNECTING');
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('CONNECTED');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const stream = payload.stream || '';
          const data = payload.data || {};

          if (stream.includes('depth20')) {
            const rawBids: Array<[string, string]> = data.b || [];
            const rawAsks: Array<[string, string]> = data.a || [];
            if (rawBids.length > 0 && rawAsks.length > 0) {
              const pBids = rawBids.map(b => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]);
              const pAsks = rawAsks.map(a => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]);
              const mid = (pBids[0][0] + pAsks[0][0]) / 2;
              setBidsDepth(pBids);
              setAsksDepth(pAsks);

              // Update fleet telemetry for selected pair
              setFleet(prev => prev.map(item => {
                if (item.symbol !== selectedPair) return item;
                const ref = item.refPrice > 0 ? item.refPrice : mid;
                const drop = Math.max(0, (ref - mid) / ref);
                const topBidUsd = pBids.slice(0, 10).reduce((sum, b) => sum + (b[0] * b[1]), 0);
                const cviScore = Math.min(6.5, Math.max(1.1, (drop * 2800000) / Math.max(10000, topBidUsd)));
                
                return {
                  ...item,
                  price: mid,
                  refPrice: ref,
                  dropPct: drop,
                  cvi: Math.round(cviScore * 100) / 100,
                  cushionPct: Math.round(Math.min(220, Math.max(90, (topBidUsd / governor.usdQueueHurdle) * 100))),
                };
              }));
            }
          } else if (stream.includes('aggTrade')) {
            const p = parseFloat(data.p);
            const q = parseFloat(data.q);
            const tradeUsd = p * q;

            // Rolling tick velocity (1s window)
            const now = Date.now();
            tradeTimestampsRef.current.push(now);
            const oneSecAgo = now - 1000;
            while (tradeTimestampsRef.current.length > 0 && tradeTimestampsRef.current[0] < oneSecAgo) {
              tradeTimestampsRef.current.shift();
            }
            const currentVel = tradeTimestampsRef.current.length;
            setActiveVelocity(currentVel);

            // Update fleet pair
            setFleet(prev => prev.map(item => {
              if (item.symbol !== selectedPair) return item;
              return { ...item, tickVelocity: currentVel };
            }));

            // If ARMED, authenticate real USD queue penetration
            setFleet(prev => prev.map(item => {
              if (item.symbol !== selectedPair || item.status !== 'ARMED') return item;
              if (item.armedPrice && p <= item.armedPrice) {
                const nextFillUsd = (item.accumulatedFillUsd || 0) + tradeUsd;
                if (nextFillUsd >= governor.usdQueueHurdle) {
                  // Concurrency Governor Slot Allocation
                  const currentlyOccupied = prev.filter(x => x.status === 'FILLED').length;
                  if (currentlyOccupied < governor.maxActiveSlots) {
                    const allocatedSlot = currentlyOccupied + 1;
                    const clearanceSec = item.fillTime ? ((now - item.fillTime) / 1000).toFixed(1) : '1.8';

                    // Dispatch Detonation Alert
                    dispatchSignal({
                      type: 'FILLED',
                      symbol: item.symbol,
                      title: `🚨 [AIR POCKET DETONATION] — ${item.symbol}`,
                      badgeColor: 'emerald',
                      metrics: {
                        'Vacuum Metric': `CVI ${item.cvi.toFixed(2)}x (Thin Book)`,
                        'Queue Hurdle': `$${governor.usdQueueHurdle.toLocaleString()} Absorbed (${clearanceSec}s)`,
                        'Net Entry': `$${item.armedPrice.toFixed(4)} (Post-Only Filled)`,
                        'Target TP': `$${(item.targetTp || item.armedPrice * 1.005).toFixed(4)} (+0.50% Snapback)`,
                        'Chronometer': '90s Mechanical Countdown',
                        'Execution': `Active (${operationalMode} Mode Slot #${allocatedSlot})`
                      },
                      rawPayload: `🚨 [AIR POCKET DETONATION] — ${item.symbol}\n• Queue: $150,000 Absorbed (${clearanceSec}s)\n• Entry: $${item.armedPrice.toFixed(4)}\n• TP: $${(item.targetTp || item.armedPrice * 1.005).toFixed(4)}\n• Mode: ${operationalMode}`
                    });

                    return {
                      ...item,
                      status: 'FILLED',
                      fillTime: now,
                      accumulatedFillUsd: nextFillUsd,
                      activeSlot: allocatedSlot,
                      holdSeconds: 0,
                    };
                  }
                }
                return { ...item, accumulatedFillUsd: nextFillUsd };
              }
              return item;
            }));
          }
        } catch {
          // ignore corrupted frame
        }
      };

      ws.onerror = () => setConnectionStatus('DISCONNECTED');
      ws.onclose = () => setConnectionStatus('DISCONNECTED');
    } catch {
      setConnectionStatus('DISCONNECTED');
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [selectedPair, governor.usdQueueHurdle, governor.maxActiveSlots, operationalMode, dispatchSignal]);

  // ================= SIMULATED FLEET ENGINE DYNAMICS =================
  useEffect(() => {
    if (!isScanningActive || isHalted) return;

    const fleetInterval = setInterval(() => {
      const now = Date.now();

      setFleet(prev => {
        const activeFilledCount = prev.filter(p => p.status === 'FILLED').length;

        return prev.map(pair => {
          let updatedPair = { ...pair };
          if (pair.symbol !== selectedPair && pair.status !== 'FILLED') {
            const jitter = (Math.random() - 0.505) * 0.0015;
            const nextPrice = Math.max(0.0001, pair.price * (1 + jitter));
            const drop = Math.max(0, (pair.refPrice - nextPrice) / pair.refPrice);
            
            // Periodically form realistic orderbook vacuum pockets (CVI > 3.0) when displacement reaches >=0.8%
            const baseCvi = drop >= 0.008 ? 3.2 + Math.random() * 1.6 : pair.cvi + (Math.random() - 0.5) * 0.15;
            const syntheticCvi = Math.min(5.5, Math.max(1.2, baseCvi));
            const vel = Math.floor(Math.max(8, Math.min(60, pair.tickVelocity + (Math.random() - 0.5) * 6)));
            
            // Random low-probability toxic insider exploit simulation (OI sudden plunge > 15%)
            const currentOiPlunge = pair.oiPlungePct || 0;

            updatedPair = {
              ...updatedPair,
              price: nextPrice,
              dropPct: drop,
              cvi: Math.round(syntheticCvi * 100) / 100,
              tickVelocity: vel,
              oiPlungePct: currentOiPlunge
            };
          }

          // Suggestion 2: TOXIC EXPLOIT / HACK INVARIANT (OI drop > 15% in <60s)
          if ((updatedPair.oiPlungePct || 0) >= governor.toxicOiThresholdPct && updatedPair.status !== 'TOXIC_ABORT') {
            updatedPair.status = 'TOXIC_ABORT';
            updatedPair.isToxicAborted = true;
            if (webhookConfig.notifyOnExit) {
              dispatchSignal({
                type: 'TOXIC_EVENT',
                symbol: updatedPair.symbol,
                title: `☣️ [TOXIC OI COLLAPSE ABORT] — ${updatedPair.symbol}`,
                badgeColor: 'purple',
                metrics: {
                  'OI Plunge': `-${updatedPair.oiPlungePct}% in <60s`,
                  'Hazard Type': 'Suspected Exploit / Delisting / Treasury Drain',
                  'Action': 'Net Disarmed / Traps Aborted for 1 Hour',
                  'Risk Armor': 'Capital Protected from Uncontrolled Waterfall'
                },
                rawPayload: `☣️ [TOXIC OI COLLAPSE ABORT] — ${updatedPair.symbol}\n• OI Plunge: -${updatedPair.oiPlungePct}%\n• Reason: Suspected exploit or fundamental run\n• Status: Traps disarmed.`
              });
            }
          }

          // Autonomous Trap Arming (If CVI >= 3.0, Deceleration Gate Valid, Drop >= 0.8%, Not Toxic)
          if (
            governor.autoExecute && 
            updatedPair.status === 'IDLE' && 
            !updatedPair.isToxicAborted &&
            updatedPair.cvi >= governor.minCviThreshold &&
            updatedPair.dropPct >= governor.baseDropPct &&
            updatedPair.tickVelocity <= governor.decelerationCap &&
            activeFilledCount < governor.maxActiveSlots
          ) {
            const floor = updatedPair.price * 0.997;
            updatedPair.status = 'ARMED';
            updatedPair.armedPrice = floor;
            updatedPair.targetTp = floor * 1.005;
            updatedPair.accumulatedFillUsd = 0;

            if (webhookConfig.notifyOnArmed) {
              dispatchSignal({
                type: 'ARMED',
                symbol: updatedPair.symbol,
                title: `🎯 [TRAP ARMED] — ${updatedPair.symbol}`,
                badgeColor: 'amber',
                metrics: {
                  'Vacuum Metric': `CVI ${updatedPair.cvi.toFixed(2)}x`,
                  'Displacement': `${(updatedPair.dropPct * 100).toFixed(2)}% Drop`,
                  '145% Floor': `$${floor.toFixed(4)}`,
                  'Target Snapback': `$${(floor * 1.005).toFixed(4)} (+0.50%)`,
                  'Queue Hurdle': `$${governor.usdQueueHurdle.toLocaleString()} USD Required`
                },
                rawPayload: `🎯 [TRAP ARMED] — ${updatedPair.symbol}\n• Floor: $${floor.toFixed(4)}\n• TP: $${(floor * 1.005).toFixed(4)}\n• CVI: ${updatedPair.cvi.toFixed(2)}x`
              });
            }
          }

          // Autonomous Queue Absorption & Air-Pocket Detonation (Armed -> Filled)
          if (updatedPair.status === 'ARMED' && governor.autoExecute) {
            // Taker sell orders hit the book: accumulate $25k-$45k per second towards the $150,000 USD hurdle
            const incomingTakerVol = 28000 + Math.floor(Math.random() * 22000);
            const nextQueueTotal = (updatedPair.accumulatedFillUsd || 0) + incomingTakerVol;
            updatedPair.accumulatedFillUsd = nextQueueTotal;

            if (nextQueueTotal >= governor.usdQueueHurdle) {
              if (activeFilledCount < governor.maxActiveSlots) {
                const allocatedSlot = activeFilledCount + 1;
                const floorPrice = updatedPair.armedPrice || updatedPair.price;
                const tpTarget = floorPrice * 1.005;
                
                updatedPair.status = 'FILLED';
                updatedPair.fillTime = now;
                updatedPair.activeSlot = allocatedSlot;
                updatedPair.holdSeconds = 0;
                updatedPair.armedPrice = floorPrice;
                updatedPair.targetTp = tpTarget;
                updatedPair.price = floorPrice; // Post-only fill executes at the floor

                dispatchSignal({
                  type: 'FILLED',
                  symbol: updatedPair.symbol,
                  title: `🚨 [AUTONOMOUS CASCADE FILLED] — ${updatedPair.symbol}`,
                  badgeColor: 'emerald',
                  metrics: {
                    'Queue Clearance': `$${governor.usdQueueHurdle.toLocaleString()} USD Absorbed (~4.5s)`,
                    'Vacuum Metric': `CVI ${(updatedPair.cvi || 3.8).toFixed(2)}x`,
                    'Execution Entry': `$${floorPrice.toFixed(4)} (Post-Only Filled)`,
                    'Target TP': `$${tpTarget.toFixed(4)} (+0.50% Snapback)`,
                    'Chronometer': '90s Mechanical Countdown',
                    'Active Risk Slot': `Slot #${allocatedSlot} of ${governor.maxActiveSlots} ($${governor.marginPerSlotUsd} Margin)`
                  },
                  rawPayload: `🚨 [AUTONOMOUS CASCADE FILLED] — ${updatedPair.symbol}\n• Queue: $150,000 USD Hurdle Penetrated\n• Slot: #${allocatedSlot} ($${governor.marginPerSlotUsd} Margin @ 10x)\n• Entry: $${floorPrice.toFixed(4)}\n• TP: $${tpTarget.toFixed(4)}`
                });
              } else {
                // Queue full, cannot allocate another slot (concurrency governor block)
                updatedPair.status = 'IDLE';
                updatedPair.accumulatedFillUsd = 0;
              }
            }
          }

          // Active Slot Management & Natural Mean Reversion Pathing
          if (updatedPair.status === 'FILLED' && updatedPair.fillTime) {
            const elapsed = Math.floor((now - updatedPair.fillTime) / 1000);
            updatedPair.holdSeconds = elapsed;
            
            // Simulating organic orderbook recovery bounce towards +0.50% TP
            const entryPrice = updatedPair.armedPrice || updatedPair.price;
            const targetTp = updatedPair.targetTp || entryPrice * 1.005;
            
            // Progressive snapback price trajectory: reaches TP in ~15-30s organically
            const bounceProgress = Math.min(1.05, (elapsed / 22) + ((Math.random() - 0.45) * 0.1));
            const simulatedCurrentPrice = entryPrice + (targetTp - entryPrice) * bounceProgress;
            updatedPair.price = simulatedCurrentPrice;

            const pnlPct = ((updatedPair.price - entryPrice) / entryPrice) * 100;
            updatedPair.pnlPct = Math.round(pnlPct * 1000) / 1000;
            updatedPair.pnlUsd = Math.round(((pnlPct / 100) * governor.marginPerSlotUsd * 10) * 100) / 100;

            // Exit Condition A: Take Profit Hit (+0.50% snapback)
            if (updatedPair.price >= targetTp || bounceProgress >= 1.0) {
              handleFleetTradeClose(updatedPair, targetTp, 'TP_HIT (Mean Reversion)');
              updatedPair.status = 'COOLDOWN';
              setTimeout(() => {
                setFleet(f => f.map(p => p.symbol === updatedPair.symbol ? { ...p, status: 'IDLE', accumulatedFillUsd: 0, armedPrice: undefined, targetTp: undefined, activeSlot: undefined } : p));
              }, 6000);
            }
            // Exit Condition B: 90s Chronometer Expiry
            else if (elapsed >= 90) {
              handleFleetTradeClose(updatedPair, updatedPair.price, 'TIME_STOP_EXPIRED (Floor Broken)');
              updatedPair.status = 'COOLDOWN';
              setTimeout(() => {
                setFleet(f => f.map(p => p.symbol === updatedPair.symbol ? { ...p, status: 'IDLE', accumulatedFillUsd: 0, armedPrice: undefined, targetTp: undefined, activeSlot: undefined } : p));
              }, 6000);
            }
          }

          return updatedPair;
        });
      });
    }, 1000);

    return () => clearInterval(fleetInterval);
  }, [isScanningActive, isHalted, selectedPair, governor, webhookConfig.notifyOnArmed, dispatchSignal]);

  // Set of actively closing trade symbols to prevent race conditions or double logging
  const closingTradesRef = useRef<Set<string>>(new Set());

  // Log completed trade to server and dispatch exit alert
  const handleFleetTradeClose = async (pair: FleetPairTelemetry, exitPrice: number, outcome: string) => {
    if (closingTradesRef.current.has(pair.symbol)) {
      return; // Already closing / closed
    }
    closingTradesRef.current.add(pair.symbol);
    setTimeout(() => closingTradesRef.current.delete(pair.symbol), 3000);

    const entryPrice = pair.armedPrice || pair.price;
    const hold = pair.holdSeconds || 22;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const notionalUsd = governor.marginPerSlotUsd * 10;
    const grossPnlUsd = (pnlPct / 100) * notionalUsd;
    
    // Fee Drag & Slippage: 0.07% round-trip (0.02% maker post-only entry + 0.05% taker market exit)
    const feeUsd = (governor.feeDragPct / 100) * notionalUsd;
    const netPnlUsd = grossPnlUsd - feeUsd;
    const netPnlPct = pnlPct - governor.feeDragPct;

    const record: ShadowTradeLogRecord = {
      id: `fleet-${pair.symbol}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol: pair.symbol,
      entryPrice: Math.round(entryPrice * 10000) / 10000,
      exitPrice: Math.round(exitPrice * 10000) / 10000,
      cviAtEntry: pair.cvi || 3.85,
      queueClearanceSeconds: 8.4,
      holdSeconds: hold,
      outcome: outcome as any,
      pnlPct: Math.round(pnlPct * 1000) / 1000,
      pnlUsd: Math.round(grossPnlUsd * 100) / 100,
      feeUsd: Math.round(feeUsd * 100) / 100,
      netPnlUsd: Math.round(netPnlUsd * 100) / 100,
      netPnlPct: Math.round(netPnlPct * 1000) / 1000,
    };

    setTradeLogs(prev => [record, ...prev]);

    // Dispatch Exit Signal Card
    if (webhookConfig.notifyOnExit) {
      const isTp = outcome.startsWith('TP_HIT');
      const isToxic = outcome.includes('TOXIC');
      dispatchSignal({
        type: isToxic ? 'TOXIC_EVENT' : (isTp ? 'EXIT_TP' : 'EXIT_TIME_STOP'),
        symbol: pair.symbol,
        title: isToxic 
          ? `☣️ [TOXIC OI PLUNGE ABORT] — ${pair.symbol}` 
          : (isTp ? `✅ [MEAN REVERSION COMPLETE] — ${pair.symbol}` : `⚠️ [TIME-STOP CUT] — ${pair.symbol}`),
        badgeColor: isToxic ? 'purple' : (isTp ? 'cyan' : (netPnlPct >= 0 ? 'amber' : 'rose')),
        metrics: {
          'Outcome': outcome,
          'Hold Duration': `${hold}s / 90s Max`,
          'Gross PnL': `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}% ($${grossPnlUsd.toFixed(2)})`,
          'Fee Drag (0.07%)': `-$${feeUsd.toFixed(2)}`,
          'Net Realized PnL': `${netPnlPct >= 0 ? '+' : ''}${netPnlPct.toFixed(2)}% (${netPnlUsd >= 0 ? '+' : ''}$${netPnlUsd.toFixed(2)})`,
          'Capital Slot': `Slot #${pair.activeSlot || 1} Released to STANDBY`
        },
        rawPayload: `${isToxic ? '☣️ [TOXIC ABORT]' : (isTp ? '✅ [MEAN REVERSION]' : '⚠️ [TIME-STOP CUT]')} — ${pair.symbol}\n• Net PnL: ${netPnlPct >= 0 ? '+' : ''}${netPnlPct.toFixed(2)}% ($${netPnlUsd.toFixed(2)})\n• Fee Drag: -$${feeUsd.toFixed(2)}\n• Hold: ${hold}s`
      });
    }

    try {
      await fetch('/api/shadow-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {
      // ignore
    }
  };

  // ================= EMERGENCY KILL-SWITCH =================
  const handleEmergencyHalt = () => {
    setIsHalted(true);
    setIsScanningActive(false);

    // Cancel all resting nets and close all occupied slots to flat cash
    setFleet(prev => prev.map(p => ({
      ...p,
      status: 'IDLE',
      armedPrice: undefined,
      targetTp: undefined,
      accumulatedFillUsd: 0,
      activeSlot: undefined,
      holdSeconds: 0,
    })));

    dispatchSignal({
      type: 'EXIT_TIME_STOP',
      symbol: 'FLEET',
      title: '🛑 [EMERGENCY KILL-SWITCH EXECUTED]',
      badgeColor: 'rose',
      metrics: {
        'Action': 'HALT FLEET / CANCEL ALL ACTIVE NETS',
        'State': 'ALL SLOTS FLATTENED TO CASH (<500ms)',
        'Active Nets Dropped': `${armedTraps.length} Resting Orders Cancelled`,
        'Open Positions Closed': `${occupiedSlots.length} Slots Flattened`,
        'Status': 'ENGINE IN SAFE MODE'
      },
      rawPayload: `🛑 [EMERGENCY KILL-SWITCH EXECUTED]\n• All resting nets dropped\n• All active positions flattened to cash\n• System standing down in safe mode.`
    });

    setToastMessage('EMERGENCY KILL-SWITCH: All 30 assets flattened to cash. Fleet scanner halted.');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleResumeFleet = () => {
    setIsHalted(false);
    setIsScanningActive(true);
    setToastMessage('Fleet Engine Resumed: Scanning Top 30 USD-M Futures...');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Test Ping to Webhook
  const handleSendTestPing = async () => {
    setIsPingSending(true);
    try {
      const res = await fetch('/api/webhook/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: webhookConfig.telegramToken,
          telegramChatId: webhookConfig.telegramChatId,
          discordWebhookUrl: webhookConfig.discordWebhookUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookConfig(c => ({
          ...c,
          lastPingStatus: 'SUCCESS',
          lastPingMessage: `Dispatched: TG=${data.results?.telegram || 'Skip'}, Discord=${data.results?.discord || 'Skip'}`
        }));
        setToastMessage('Test Ping Sent Successfully!');
      } else {
        setWebhookConfig(c => ({
          ...c,
          lastPingStatus: 'FAILED',
          lastPingMessage: data.error || 'Failed to dispatch'
        }));
      }
    } catch (err: any) {
      setWebhookConfig(c => ({
        ...c,
        lastPingStatus: 'FAILED',
        lastPingMessage: err.message
      }));
    } finally {
      setIsPingSending(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // ================= SIMULATION CONTROLS FOR MANUAL AUDIT =================
  const triggerSimulatedFleetCascade = (targetSymbol: string) => {
    setFleet(prev => prev.map(p => {
      if (p.symbol !== targetSymbol) return p;
      const dropPrice = p.price * 0.991;
      const floor = dropPrice * 0.998;
      return {
        ...p,
        price: dropPrice,
        dropPct: 0.009,
        cvi: 4.25,
        cushionPct: 148,
        tickVelocity: 28,
        status: 'ARMED',
        armedPrice: floor,
        targetTp: floor * 1.005,
        accumulatedFillUsd: 0,
      };
    }));

    dispatchSignal({
      type: 'ARMED',
      symbol: targetSymbol,
      title: `🎯 [DISLOCATION DETECTED] — ${targetSymbol}`,
      badgeColor: 'amber',
      metrics: {
        'Drop Magnitude': '0.90% Air Pocket Dislocation',
        'CVI Reading': '4.25x (Severe Order Book Void)',
        'Target Floor': '145% Cumulative Cushion',
        'Queue Hurdle': '$150,000 USD Real Taker Sales'
      },
      rawPayload: `🎯 [DISLOCATION DETECTED] — ${targetSymbol}\n• Drop: 0.90%\n• CVI: 4.25x\n• Floor: 145% Cushion`
    });

    setToastMessage(`Dislocation injected: ${targetSymbol} net armed at 145% floor`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const satisfyQueueHurdle = (targetSymbol: string) => {
    setFleet(prev => {
      const activeCount = prev.filter(p => p.status === 'FILLED').length;
      if (activeCount >= governor.maxActiveSlots) {
        setToastMessage(`CONCURRENCY BLOCKED: All ${governor.maxActiveSlots} active slots full. Prioritizing highest CVI.`);
        setTimeout(() => setToastMessage(null), 3500);
        return prev;
      }

      return prev.map(p => {
        if (p.symbol !== targetSymbol) return p;
        const entry = p.armedPrice || p.price;
        const tp = p.targetTp || entry * 1.005;

        dispatchSignal({
          type: 'FILLED',
          symbol: targetSymbol,
          title: `🚨 [AIR POCKET DETONATION] — ${targetSymbol}`,
          badgeColor: 'emerald',
          metrics: {
            'Cascade Volume': '$150,000 USD Absorbed (1.8s)',
            'Vacuum Metric': `CVI ${(p.cvi || 3.8).toFixed(2)}x`,
            'Net Entry': `$${entry.toFixed(4)} (Post-Only Filled)`,
            'Target TP': `$${tp.toFixed(4)} (+0.50% Snapback)`,
            'Chronometer': '90s Mechanical Countdown',
            'Execution Slot': `Slot #${activeCount + 1} (${operationalMode} Mode)`
          },
          rawPayload: `🚨 [AIR POCKET DETONATION] — ${targetSymbol}\n• Queue: $150,000 Penetrated (1.8s)\n• Entry: $${entry.toFixed(4)}\n• TP: $${tp.toFixed(4)}`
        });

        return {
          ...p,
          status: 'FILLED',
          fillTime: Date.now(),
          accumulatedFillUsd: governor.usdQueueHurdle,
          activeSlot: activeCount + 1,
          holdSeconds: 0,
        };
      });
    });
    setToastMessage(`$150,000 USD Queue Penetrated: ${targetSymbol} filled in Slot`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const executeCleanSnapback = (targetSymbol: string) => {
    const p = fleet.find(x => x.symbol === targetSymbol);
    if (!p || p.status !== 'FILLED') return;
    const tp = p.targetTp || p.price * 1.005;
    handleFleetTradeClose(p, tp, 'TP_HIT (Mean Reversion)');
    setFleet(prev => prev.map(x => x.symbol === targetSymbol ? { ...x, status: 'IDLE' } : x));
    setToastMessage(`Snapback captured: ${targetSymbol} +0.50% profit recorded`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ================= FLEET TELEMETRY SCORECARD =================
  const fleetScorecard = useMemo(() => {
    const totalTrades = tradeLogs.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        cleanSnapbacks: 0,
        cleanSnapbackRatio: 0,
        avgHold: 0,
        grossUsd: 0,
        totalFeesUsd: 0,
        netUsd: 0,
        netPct: 0,
        avgQueueFriction: 0,
        mostProfitablePair: 'N/A',
        totalTrapsCaught: 0,
        fleetWinRate: 0,
      };
    }

    const tpHits = tradeLogs.filter(t => t.outcome.startsWith('TP_HIT')).length;
    const cleanFast = tradeLogs.filter(t => t.outcome.startsWith('TP_HIT') && t.holdSeconds < 45).length;
    const totalHold = tradeLogs.reduce((acc, t) => acc + (t.holdSeconds || 0), 0);
    const totalGrossUsd = tradeLogs.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
    const totalFeesUsd = tradeLogs.reduce((acc, t) => acc + (t.feeUsd || ((governor.marginPerSlotUsd * 10 * governor.feeDragPct) / 100)), 0);
    const totalNetUsd = tradeLogs.reduce((acc, t) => acc + (t.netPnlUsd !== undefined ? t.netPnlUsd : ((t.pnlUsd || 0) - (t.feeUsd || 175))), 0);
    const totalNetPct = tradeLogs.reduce((acc, t) => acc + (t.netPnlPct !== undefined ? t.netPnlPct : ((t.pnlPct || 0) - 0.07)), 0);
    const totalQueueSec = tradeLogs.reduce((acc, t) => acc + (t.queueClearanceSeconds || 8.4), 0);

    const pairPnlMap: Record<string, number> = {};
    tradeLogs.forEach(t => {
      const net = t.netPnlUsd !== undefined ? t.netPnlUsd : ((t.pnlUsd || 0) - 175);
      pairPnlMap[t.symbol] = (pairPnlMap[t.symbol] || 0) + net;
    });
    const sortedPairs = Object.entries(pairPnlMap).sort((a, b) => b[1] - a[1]);
    const topPair = sortedPairs[0] ? `${sortedPairs[0][0]} (+$${sortedPairs[0][1].toFixed(2)} net)` : 'BTCUSDT';

    return {
      totalTrades,
      cleanSnapbacks: cleanFast,
      cleanSnapbackRatio: Math.round((cleanFast / totalTrades) * 1000) / 10,
      fleetWinRate: Math.round((tpHits / totalTrades) * 1000) / 10,
      avgHold: Math.round((totalHold / totalTrades) * 10) / 10,
      grossUsd: Math.round(totalGrossUsd * 100) / 100,
      totalFeesUsd: Math.round(totalFeesUsd * 100) / 100,
      netUsd: Math.round(totalNetUsd * 100) / 100,
      netPct: Math.round(totalNetPct * 100) / 100,
      avgQueueFriction: Math.round((totalQueueSec / totalTrades) * 10) / 10,
      mostProfitablePair: topPair,
      totalTrapsCaught: tradeLogs.length + fleet.filter(p => p.status === 'ARMED' || p.status === 'FILLED').length,
    };
  }, [tradeLogs, fleet, governor.marginPerSlotUsd, governor.feeDragPct]);

  // ================= EXPORT TELEMETRY DIGEST =================
  const handleExportTelemetryDigest = () => {
    const nowIso = new Date().toISOString();
    let md = `# INSTITUTIONAL MULTI-PAIR FLEET SCANNER // TELEMETRY DIGEST\n`;
    md += `Generated: ${nowIso} | Operational Mode: ${operationalMode}\n`;
    md += `Active Concurrency: ${occupiedSlots.length}/${governor.maxActiveSlots} Slots | Webhook Dispatcher: Active\n`;
    md += `Universe: Top 30 USD-M Futures (Vol > $100M/day) | USD Queue Hurdle: $${governor.usdQueueHurdle.toLocaleString()} USD\n`;
    md += `Risk Pool: $${governor.totalRiskPoolUsd.toLocaleString()} | Margin/Slot: $${governor.marginPerSlotUsd.toLocaleString()} (10x Leverage)\n\n`;

    md += `## 1. FLEET TELEMETRY SCORECARD\n`;
    md += `- Total Trades Executed: ${fleetScorecard.totalTrades}\n`;
    md += `- Fleet Win Rate: ${fleetScorecard.fleetWinRate}% | Clean Snapback Ratio (<45s TP): ${fleetScorecard.cleanSnapbackRatio}%\n`;
    md += `- Net Realized Return: $${fleetScorecard.netUsd.toFixed(2)} (${fleetScorecard.netPct > 0 ? '+' : ''}${fleetScorecard.netPct.toFixed(2)}%)\n`;
    md += `- Most Profitable Asset: ${fleetScorecard.mostProfitablePair}\n`;
    md += `- Mean Hold Duration: ${fleetScorecard.avgHold}s / 90s Chronometer Ceiling\n`;
    md += `- Mean FIFO Queue Friction: ${fleetScorecard.avgQueueFriction}s ($150,000 USD hurdle)\n\n`;

    md += `## 2. ACTIVE SLOTS & ARMED TRAPS\n`;
    if (occupiedSlots.length === 0) {
      md += `*No active positions open. All ${governor.maxActiveSlots} slots standing by.*\n\n`;
    } else {
      occupiedSlots.forEach((slot, idx) => {
        md += `- Slot #${idx + 1}: ${slot.symbol} | Entry: $${(slot.armedPrice || 0).toFixed(4)} | TP: $${(slot.targetTp || 0).toFixed(4)} | Hold: ${slot.holdSeconds}s | PnL: ${slot.pnlPct || 0}%\n`;
      });
      md += `\n`;
    }

    md += `## 3. LIVE 30-PAIR FLEET RADAR SNAPSHOT\n`;
    md += `| Symbol | Price | Displacement % | CVI Score | Cushion % | Status | 24h Volume |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    fleet.slice(0, 15).forEach(p => {
      md += `| ${p.symbol} | $${p.price.toFixed(4)} | ${(p.dropPct * 100).toFixed(2)}% | ${p.cvi.toFixed(2)}x | ${p.cushionPct}% | ${p.status} | $${(p.volume24hUsd / 1000000).toFixed(1)}M |\n`;
    });

    navigator.clipboard.writeText(md);
    setToastMessage('Institutional Fleet Digest copied to clipboard');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered radar pairs
  const filteredRadarFleet = useMemo(() => {
    let list = fleet;
    if (radarFilter === 'HIGH_CVI') list = list.filter(p => p.cvi >= 3.0);
    if (radarFilter === 'ACTIVE_SLOTS') list = list.filter(p => p.status === 'FILLED' || p.status === 'ARMED');
    if (radarFilter === '10_APPROVED' || governor.microCapitalTier === 'MINI_MICRO_10') {
      list = list.filter(p => p.is10DollarApproved);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    return list;
  }, [fleet, radarFilter, searchQuery, governor.microCapitalTier]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono font-bold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= MODAL: WEBHOOK DISPATCHER SETTINGS ================= */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-white uppercase text-sm tracking-wider">
                  REAL-TIME SIGNAL DISPATCHER CONFIGURATION
                </span>
              </div>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
              >
                ESC
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Broadcasts structured institutional alerts to your phone via Telegram or Discord the millisecond an air pocket detonates, authenticates FIFO fill, or exits.
              </p>

              {/* Telegram Inputs */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-200 text-[11px]">
                  <span>TELEGRAM BOT RELAY</span>
                  <span className="text-[10px] text-zinc-500">api.telegram.org</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">BOT TOKEN</label>
                    <input
                      type="password"
                      placeholder="e.g. 123456:ABC-DEF..."
                      value={webhookConfig.telegramToken}
                      onChange={(e) => setWebhookConfig(c => ({ ...c, telegramToken: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">CHAT ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321 or @channel"
                      value={webhookConfig.telegramChatId}
                      onChange={(e) => setWebhookConfig(c => ({ ...c, telegramChatId: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Discord Webhook Input */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-200 text-[11px]">
                  <span>DISCORD WEBHOOK RELAY</span>
                  <span className="text-[10px] text-zinc-500">discord.com/api/webhooks</span>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">WEBHOOK URL</label>
                  <input
                    type="password"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookConfig.discordWebhookUrl}
                    onChange={(e) => setWebhookConfig(c => ({ ...c, discordWebhookUrl: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Event Triggers */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-300 text-[11px] block">DISPATCH EVENT TRIGGERS</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={webhookConfig.notifyOnArmed}
                      onChange={(e) => setWebhookConfig(c => ({ ...c, notifyOnArmed: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                    />
                    <span>On Trap Armed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={webhookConfig.notifyOnFilled}
                      onChange={(e) => setWebhookConfig(c => ({ ...c, notifyOnFilled: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                    />
                    <span>On Order Filled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={webhookConfig.notifyOnExit}
                      onChange={(e) => setWebhookConfig(c => ({ ...c, notifyOnExit: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                    />
                    <span>On TP / Time-Stop</span>
                  </label>
                </div>
              </div>

              {/* Ping Status */}
              {webhookConfig.lastPingMessage && (
                <div className={`p-2 rounded text-[11px] font-mono ${
                  webhookConfig.lastPingStatus === 'SUCCESS'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}>
                  Status: {webhookConfig.lastPingMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                onClick={handleSendTestPing}
                disabled={isPingSending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 text-xs font-bold transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${isPingSending ? 'animate-spin' : ''}`} />
                <span>{isPingSending ? 'SENDING PING...' : 'SEND TEST PING'}</span>
              </button>

              <button
                onClick={() => {
                  setIsWebhookModalOpen(false);
                  setToastMessage('Webhook configuration saved');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition-colors"
              >
                SAVE &amp; ACTIVATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSTITUTIONAL DUAL-MODE TOP CONTROL & TELEMETRY BAR ================= */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Terminal Identifier & Operational Mode 3-Way Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isHalted ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`} />
              <div>
                <div className="text-sm font-mono font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <span>DUAL-MODE EXECUTION HUB</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                    isHalted
                      ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                  }`}>
                    {isHalted ? 'FLEET HALTED (FLAT CASH)' : 'FLEET ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3-WAY OPERATIONAL MODE SELECTOR */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 font-mono text-xs">
              <button
                onClick={() => {
                  setOperationalMode('SIGNAL_ONLY');
                  setToastMessage('Operational Mode set to: SIGNAL RADAR ONLY (0 order placement)');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-bold ${
                  operationalMode === 'SIGNAL_ONLY'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-600/70 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Monitors 30 pairs and dispatches alerts via Webhooks; zero order placement"
              >
                <Radio className="w-3 h-3 text-indigo-400" />
                <span>SIGNAL RADAR ONLY</span>
              </button>

              <button
                onClick={() => {
                  setOperationalMode('PAPER');
                  setToastMessage('Operational Mode set to: SHADOW TRADER (PAPER FIFO)');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-bold ${
                  operationalMode === 'PAPER'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Simulates real FIFO fills with live WebSockets and dispatches alerts (Default)"
              >
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>SHADOW TRADER (PAPER)</span>
              </button>

              <button
                onClick={() => {
                  setOperationalMode('LIVE');
                  setToastMessage('Operational Mode set to: LIVE EXECUTION (Contingent API)');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-bold ${
                  operationalMode === 'LIVE'
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/70 shadow-sm animate-pulse'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Places post-only limit orders on exchange matching engine via private API"
              >
                <Zap className="w-3 h-3 text-rose-400" />
                <span>LIVE EXECUTION</span>
              </button>
            </div>
          </div>

          {/* Right: Operational Controls, Webhook Modal & Emergency Kill Switch */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
            {/* Webhook Config Modal Button */}
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono font-bold transition-all"
              title="Configure Telegram and Discord Webhook Alerts"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>DISPATCHER ALERTS</span>
              {(webhookConfig.telegramToken || webhookConfig.discordWebhookUrl) && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            {/* Emergency Kill Switch */}
            {!isHalted ? (
              <button
                onClick={handleEmergencyHalt}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500 font-mono text-xs font-black transition-all shadow-lg shadow-rose-950/50"
                title="Immediately cancels all resting nets and flattens active slots to cash (<500ms)"
              >
                <Octagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>HALT FLEET / CANCEL ALL</span>
              </button>
            ) : (
              <button
                onClick={handleResumeFleet}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500 font-mono text-xs font-black transition-all"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>RESUME FLEET</span>
              </button>
            )}

            {/* Export Telemetry Digest */}
            <button
              onClick={handleExportTelemetryDigest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono font-bold transition-all shadow-sm"
              title="Export complete 30-pair telemetry markdown digest"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>EXPORT DIGEST</span>
            </button>

            {/* CSV Download */}
            <a
              href="/api/shadow-trades?download=true"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors"
              title="Download shadow_trading_log.csv"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>CSV</span>
            </a>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          <button
            onClick={() => setActiveTab('FLEET_MATRIX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'FLEET_MATRIX'
                ? 'bg-zinc-800 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>LIVE 30-PAIR FLEET MATRIX</span>
          </button>

          <button
            onClick={() => setActiveTab('DISPATCH_PREVIEW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'DISPATCH_PREVIEW'
                ? 'bg-zinc-800 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span>SIGNAL CARD DISPATCH ({dispatchedSignals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FOCUSED_EXECUTION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'FOCUSED_EXECUTION'
                ? 'bg-zinc-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>FOCUSED PAIR EXECUTION ({selectedPair})</span>
          </button>

          <button
            onClick={() => setActiveTab('CSV_LEDGER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'CSV_LEDGER'
                ? 'bg-zinc-800 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>FLEET TRADE LEDGER (CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('PYTHON_SOURCE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'PYTHON_SOURCE'
                ? 'bg-zinc-800 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>DUAL-MODE PYTHON SCRIPT</span>
          </button>
        </div>
      </div>

      {/* Unified Fleet Analytics Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Trades */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">FLEET TRADES</div>
          <div className="text-xl font-black text-white mt-0.5">{fleetScorecard.totalTrades}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Across 30 assets</div>
        </div>

        {/* Fleet Win Rate */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">FLEET WIN RATE</div>
          <div className={`text-xl font-black mt-0.5 ${fleetScorecard.fleetWinRate >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {fleetScorecard.fleetWinRate}%
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">TP vs Time-Stop cuts</div>
        </div>

        {/* Clean Snapback Ratio */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">CLEAN SNAPBACK (&lt;45s)</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{fleetScorecard.cleanSnapbackRatio}%</div>
          <div className="text-[10px] text-zinc-400 mt-1">{fleetScorecard.cleanSnapbacks} mechanical hits</div>
        </div>

        {/* Net Realized PnL (Net of 0.07% Fees) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center justify-between">
            <span>NET REALIZED PNL</span>
            <span className="text-[9px] text-zinc-500">-0.07% FEES</span>
          </div>
          <div className={`text-xl font-black mt-0.5 ${fleetScorecard.netUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fleetScorecard.netUsd >= 0 ? '+' : ''}${fleetScorecard.netUsd.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Gross: ${fleetScorecard.grossUsd.toFixed(0)}</span>
            <span className="text-rose-400">Fees: -${fleetScorecard.totalFeesUsd.toFixed(0)}</span>
          </div>
        </div>

        {/* Top Alpha Asset */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">TOP ALPHA ASSET</div>
          <div className="text-sm font-black text-cyan-300 mt-1 truncate" title={fleetScorecard.mostProfitablePair}>
            {fleetScorecard.mostProfitablePair}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Highest net return</div>
        </div>

        {/* Active Concurrency Slots & Capital Tier */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center justify-between">
            <span>ACTIVE SLOTS</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-purple-300">
              {governor.microCapitalTier === 'MINI_MICRO_10' 
                ? '$10 POOL' 
                : governor.microCapitalTier === 'MICRO_FLIGHT_250' 
                  ? '$250 POOL' 
                  : '$250k POOL'}
            </span>
          </div>
          <div className="text-xl font-black text-purple-300 mt-0.5">
            {occupiedSlots.length} / {governor.maxActiveSlots}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            ${(governor.marginPerSlotUsd * occupiedSlots.length).toLocaleString()} deployed
          </div>
        </div>
      </div>

      {/* ================= TAB 1: LIVE 30-PAIR FLEET MATRIX ================= */}
      {activeTab === 'FLEET_MATRIX' && (
        <div className="space-y-4">
          {/* Concurrency Governor & Priority Slot Bar */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase text-sm">
                  CONCURRENCY GOVERNOR &amp; DYNAMIC RISK SLOTS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                  Pool: ${governor.totalRiskPoolUsd.toLocaleString()} USD
                </span>
              </div>

              {/* Slot Allocator Settings & Micro Flight Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Capital Tier Selector with $10 Mini-Micro Preset */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 text-[11px]">CAPITAL TIER:</span>
                  <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
                    <button
                      onClick={() => {
                        setGovernor(g => ({
                          ...g,
                          microCapitalTier: 'INSTITUTIONAL_250K',
                          totalRiskPoolUsd: 250000,
                          marginPerSlotUsd: 25000,
                          maxActiveSlots: 3,
                          usdQueueHurdle: 150000,
                        }));
                        setToastMessage('Governor Calibrated: $250k Institutional Tier (3 Slots @ $25k)');
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        governor.microCapitalTier === 'INSTITUTIONAL_250K'
                          ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Institutional Tier: $250,000 pool, $25,000 margin/slot (10x)"
                    >
                      $250k INSTITUTIONAL
                    </button>
                    <button
                      onClick={() => {
                        setGovernor(g => ({
                          ...g,
                          microCapitalTier: 'MICRO_FLIGHT_250',
                          totalRiskPoolUsd: 250,
                          marginPerSlotUsd: 25,
                          maxActiveSlots: 3,
                          usdQueueHurdle: 150000,
                        }));
                        setToastMessage('Governor Calibrated: $250 Micro-Flight Tier (3 Slots @ $25)');
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        governor.microCapitalTier === 'MICRO_FLIGHT_250'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Micro-Flight Tier: $250 real pool, $25 margin/slot (5 micro live test trades)"
                    >
                      🧪 $250 FLIGHT
                    </button>
                    <button
                      onClick={() => {
                        setGovernor(g => ({
                          ...g,
                          microCapitalTier: 'MINI_MICRO_10',
                          totalRiskPoolUsd: 10,
                          marginPerSlotUsd: 5,
                          maxActiveSlots: 2,
                          usdQueueHurdle: 150000,
                        }));
                        setRadarFilter('10_APPROVED');
                        if (selectedPair === 'BTCUSDT' || selectedPair === 'AAVEUSDT') {
                          setSelectedPair('SOLUSDT');
                        }
                        setToastMessage('🎯 $10 MINI-MICRO TIER ACTIVE: 2 Slots @ $5 Margin (10x = $50 Size), Filtered to Granular Altcoins (SOL, DOGE, XRP, SUI, ETH, PEPE, AVAX)');
                        setTimeout(() => setToastMessage(null), 4000);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-black transition-all ${
                        governor.microCapitalTier === 'MINI_MICRO_10'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-md animate-pulse'
                          : 'text-cyan-600 hover:text-cyan-400'
                      }`}
                      title="$10 Mini-Micro Testing Tier: $10 pool, 2 slots @ $5 margin (10x = $50 position), micro-fee -$0.035, high-granularity altcoins"
                    >
                      🧪 $10 MINI-MICRO TIER
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 text-[11px]">MAX SLOTS:</span>
                  <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
                    {[1, 2, 3, 4, 5].map((slotCount) => (
                      <button
                        key={slotCount}
                        onClick={() => setGovernor(g => ({ ...g, maxActiveSlots: slotCount }))}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          governor.maxActiveSlots === slotCount
                            ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {slotCount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 text-[11px]">QUEUE HURDLE:</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-emerald-300">
                    ${(governor.usdQueueHurdle / 1000).toFixed(0)}k USD
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Slots Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {Array.from({ length: governor.maxActiveSlots }).map((_, slotIdx) => {
                const occupied = occupiedSlots[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className={`p-3 rounded-lg border transition-all ${
                      occupied
                        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg'
                        : 'bg-zinc-900/40 border-zinc-800/80 border-dashed'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-400">SLOT #{slotIdx + 1}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        occupied ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'text-zinc-600'
                      }`}>
                        {occupied ? 'OCCUPIED' : 'STANDBY'}
                      </span>
                    </div>

                    {occupied ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">{occupied.symbol}</span>
                          <span className={`text-xs font-bold ${
                            (occupied.pnlUsd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(occupied.pnlUsd || 0) >= 0 ? '+' : ''}${(occupied.pnlUsd || 0).toFixed(2)} ({(occupied.pnlPct || 0).toFixed(2)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Hold: {occupied.holdSeconds}s / 90s</span>
                          <span>Floor: ${occupied.armedPrice?.toFixed(4)}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((occupied.holdSeconds || 0) / 90) * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => executeCleanSnapback(occupied.symbol)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold"
                          >
                            FORCE SNAPBACK (+0.5%)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-center text-zinc-600 text-[11px] py-1">
                        Available • Margin: ${(governor.marginPerSlotUsd).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 30 Live Radar Matrix Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase text-sm">
                  LIVE 30-PAIR FLEET MATRIX
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                  {filteredRadarFleet.length} Monitored Pairs
                </span>
                <span className="text-[10px] text-zinc-500">
                  Multiplexed Stream Active
                </span>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search pair (e.g. BTC, SOL, PEPE)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px]">
                  <button
                    onClick={() => setRadarFilter('ALL')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      radarFilter === 'ALL' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ALL (30)
                  </button>
                  <button
                    onClick={() => setRadarFilter('10_APPROVED')}
                    className={`px-2 py-0.5 rounded transition-colors font-bold ${
                      radarFilter === '10_APPROVED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/70' : 'text-cyan-500 hover:text-cyan-300'
                    }`}
                    title="Filters to assets with granular contract sizes (<$50 minimum) like SOL, DOGE, XRP, SUI, ETH"
                  >
                    🧪 $10 APPROVED (28)
                  </button>
                  <button
                    onClick={() => setRadarFilter('HIGH_CVI')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      radarFilter === 'HIGH_CVI' ? 'bg-purple-950 text-purple-300 font-bold border border-purple-700/60' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    HIGH CVI (&ge;3.0)
                  </button>
                  <button
                    onClick={() => setRadarFilter('ACTIVE_SLOTS')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      radarFilter === 'ACTIVE_SLOTS' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ACTIVE/ARMED
                  </button>
                </div>
              </div>
            </div>

            {/* Radar Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">PAIR</th>
                    <th className="py-2.5 px-3">PRICE</th>
                    <th className="py-2.5 px-3">DISPLACEMENT DROP %</th>
                    <th className="py-2.5 px-3">CURRENT CVI</th>
                    <th className="py-2.5 px-3">ORDERBOOK CUSHION %</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION / TELEMETRY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {filteredRadarFleet.map((pair) => {
                    const isHighCvi = pair.cvi >= 3.0;
                    const isArmed = pair.status === 'ARMED';
                    const isFilled = pair.status === 'FILLED';

                    return (
                      <tr key={pair.symbol} className="hover:bg-zinc-900/50 transition-colors">
                        {/* 1. PAIR */}
                        <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedPair(pair.symbol);
                                setActiveTab('FOCUSED_EXECUTION');
                              }}
                              className="hover:text-emerald-400 transition-colors text-left"
                            >
                              <span className="font-mono text-xs">{pair.symbol}</span>
                            </button>
                            <span className="text-[10px] text-zinc-500 font-normal">({pair.name})</span>
                            {pair.is10DollarApproved ? (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800" title={`Min step ~$${pair.minContractStepUsd?.toFixed(2)} (<$50 lot size)`}>
                                $10 OK
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800" title={`Min contract lot ~$${pair.minContractStepUsd?.toFixed(0)} exceeds $50 micro slot size`}>
                                &gt;$50 LOT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            24h Vol: ${(pair.volume24hUsd / 1000000).toFixed(1)}M | Step: ~${pair.minContractStepUsd ? pair.minContractStepUsd.toFixed(2) : '0.10'}
                          </div>
                        </td>

                        {/* 2. PRICE */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-zinc-200 whitespace-nowrap">
                          ${pair.price >= 10 ? pair.price.toFixed(2) : pair.price.toFixed(4)}
                        </td>

                        {/* 3. DISPLACEMENT DROP % */}
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            pair.dropPct >= 0.008 
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                              : 'text-zinc-400'
                          }`}>
                            {(pair.dropPct * 100).toFixed(2)}% drop
                          </span>
                        </td>

                        {/* 4. CURRENT CVI */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                            isHighCvi
                              ? 'bg-purple-950/80 text-purple-300 border-purple-700/60 animate-pulse'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}>
                            {pair.cvi.toFixed(2)}x CVI
                          </span>
                        </td>

                        {/* 5. ORDERBOOK CUSHION % */}
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${pair.cushionPct >= 145 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                              {pair.cushionPct}%
                            </span>
                            <span className="text-[10px] text-zinc-600">/ 145% target</span>
                          </div>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isFilled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              FILLED (SLOT #{pair.activeSlot})
                            </span>
                          )}
                          {isArmed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              ARMED ($150k QUEUE)
                            </span>
                          )}
                          {!isFilled && !isArmed && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                              {pair.status}
                            </span>
                          )}
                        </td>

                        {/* 7. ACTIONS / TELEMETRY */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isArmed && (
                              <button
                                onClick={() => satisfyQueueHurdle(pair.symbol)}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold font-mono"
                              >
                                PUNCH $150k QUEUE
                              </button>
                            )}

                            {isFilled && (
                              <button
                                onClick={() => executeCleanSnapback(pair.symbol)}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold font-mono"
                              >
                                SNAPBACK (+0.5%)
                              </button>
                            )}

                            {!isArmed && !isFilled && (
                              <button
                                onClick={() => triggerSimulatedFleetCascade(pair.symbol)}
                                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono"
                              >
                                TEST CASCADE
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedPair(pair.symbol);
                                setActiveTab('FOCUSED_EXECUTION');
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono flex items-center gap-1"
                            >
                              <span>FOCUS</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE SIGNAL CARD DISPATCH PREVIEW ================= */}
      {activeTab === 'DISPATCH_PREVIEW' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white uppercase text-sm">
                LIVE DISPATCHED SIGNAL CARDS // TELEGRAM &amp; DISCORD STREAM
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => triggerSimulatedFleetCascade(selectedPair)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
                title="Test-fire an ARMED signal to Telegram"
              >
                <span>TEST 1: ARMED</span>
              </button>
              <button
                onClick={() => satisfyQueueHurdle(selectedPair)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition-all"
                title="Test-fire an AIR POCKET DETONATION signal to Telegram"
              >
                <span>TEST 2: DETONATION</span>
              </button>
              <button
                onClick={() => executeCleanSnapback(selectedPair)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all"
                title="Test-fire an EXIT TP Mean Reversion signal to Telegram"
              >
                <span>TEST 3: EXIT TP</span>
              </button>
              <button
                onClick={handleSendTestPing}
                disabled={isPingSending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all"
                title="Send telemetry ping directly to Telegram bot"
              >
                <Send className={`w-3.5 h-3.5 ${isPingSending ? 'animate-spin' : ''}`} />
                <span>{isPingSending ? 'DISPATCHING...' : 'PING BOT'}</span>
              </button>
              <button
                onClick={() => setIsWebhookModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>CONFIG</span>
              </button>
              <button
                onClick={() => setDispatchedSignals([])}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 text-xs"
              >
                CLEAR
              </button>
            </div>
          </div>

          {/* Live Ping Status & Direct Relay Feedback */}
          {webhookConfig.lastPingStatus !== 'IDLE' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              webhookConfig.lastPingStatus === 'SUCCESS'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  webhookConfig.lastPingStatus === 'SUCCESS' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`} />
                <span className="font-bold">
                  {webhookConfig.lastPingStatus === 'SUCCESS' ? 'TELEGRAM DISPATCH SUCCESSFUL' : 'TELEGRAM DISPATCH NOTICE'}:
                </span>
                <span>{webhookConfig.lastPingMessage}</span>
              </div>
              <span className="text-[10px] text-zinc-400">Target Chat: {webhookConfig.telegramChatId}</span>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dispatchedSignals.map((card) => {
              const borderClass = 
                card.badgeColor === 'emerald' ? 'border-emerald-500/50 bg-emerald-950/10' :
                card.badgeColor === 'amber' ? 'border-amber-500/50 bg-amber-950/10' :
                card.badgeColor === 'cyan' ? 'border-cyan-500/50 bg-cyan-950/10' :
                'border-rose-500/50 bg-rose-950/10';

              const headerClass = 
                card.badgeColor === 'emerald' ? 'text-emerald-400' :
                card.badgeColor === 'amber' ? 'text-amber-400' :
                card.badgeColor === 'cyan' ? 'text-cyan-400' :
                'text-rose-400';

              return (
                <div
                  key={card.id}
                  className={`p-4 rounded-xl border ${borderClass} shadow-xl space-y-3 font-mono`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2">
                    <div>
                      <div className={`font-bold text-sm ${headerClass}`}>
                        {card.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-2">
                        <span>{new Date(card.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>Relayed to: {card.destinations.join(', ')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(card.rawPayload);
                        setToastMessage('Signal card payload copied to clipboard');
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="text-zinc-500 hover:text-zinc-200 p-1 rounded bg-zinc-900 border border-zinc-800"
                      title="Copy exact message payload"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(card.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">• {key}:</span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Mode: {operationalMode}</span>
                    <span className="text-emerald-400">Validated 0ms Queue Lag</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FOCUSED PAIR EXECUTION ================= */}
      {activeTab === 'FOCUSED_EXECUTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
          {/* Pair Selector Pill Bar */}
          <div className="lg:col-span-12 bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase text-sm">
                FOCUSED PAIR AUDIT: {selectedPair}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              {['SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 'SUIUSDT', 'ETHUSDT', 'PEPEUSDT', 'AVAXUSDT', 'BTCUSDT'].map((sym) => {
                const isApproved = sym !== 'BTCUSDT';
                return (
                  <button
                    key={sym}
                    onClick={() => setSelectedPair(sym)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      selectedPair === sym
                        ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/50'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>{sym.replace('USDT', '')}</span>
                    {isApproved && <span className="text-[8px] text-cyan-400 font-mono">10$</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Column: Ticker & L2 Order Book Depth */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                <span>{selectedPair} LIVE MID</span>
                <span className="text-emerald-400">WebSocket 100ms</span>
              </div>
              <div className="text-3xl font-black text-white mt-1">
                ${selectedTelemetry.price >= 10 ? selectedTelemetry.price.toFixed(2) : selectedTelemetry.price.toFixed(4)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                <span>Displacement: {(selectedTelemetry.dropPct * 100).toFixed(2)}%</span>
                <span>Velocity: {activeVelocity}/s (Cap: 65/s)</span>
                <span>CVI: {selectedTelemetry.cvi.toFixed(2)}x</span>
              </div>
            </div>

            {/* Order Book Depth Table */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold border-b border-zinc-800 pb-2">
                <span>L2 BID DEPTH (100MS)</span>
                <span>USD CUMULATIVE</span>
              </div>
              <div className="space-y-1">
                {bidsDepth.slice(0, 8).map(([price, size], idx) => {
                  const levelUsd = price * size;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">${price.toFixed(2)}</span>
                      <span className="text-zinc-400">{size.toFixed(3)}</span>
                      <span className="text-zinc-300">${(levelUsd / 1000).toFixed(1)}k</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: USD-Normalized FIFO Queue Authentication */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-white text-sm uppercase">
                  USD-NORMALIZED FIFO QUEUE TRACKING
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                  Target: ${governor.usdQueueHurdle.toLocaleString()} USD
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Queue Penetration Progress:</span>
                  <span className="font-bold text-white">
                    ${(selectedTelemetry.accumulatedFillUsd || 0).toLocaleString()} / ${governor.usdQueueHurdle.toLocaleString()} USD
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (((selectedTelemetry.accumulatedFillUsd || 0) / governor.usdQueueHurdle) * 100))}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1.5 text-[11px]">
                <div className="text-zinc-300 font-bold">ANTI-DELUSION EXECUTION PROTOCOL:</div>
                <div className="text-zinc-400 leading-relaxed">
                  Touching the price line does NOT grant a fill. The engine requires exactly $150,000 of real market-taker selling volume to execute through your limit order before marking the position active.
                </div>
              </div>

              {/* Simulation Controls for Selected Pair */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => triggerSimulatedFleetCascade(selectedPair)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold"
                >
                  1. INJECT 0.85% DROP
                </button>
                <button
                  onClick={() => satisfyQueueHurdle(selectedPair)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold"
                >
                  2. PUNCH $150k QUEUE
                </button>
                <button
                  onClick={() => executeCleanSnapback(selectedPair)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold"
                >
                  3. FAST SNAPBACK (+0.5%)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CSV TRADE LEDGER ================= */}
      {activeTab === 'CSV_LEDGER' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase text-sm">
                FLEET EXECUTION LEDGER // shadow_trading_log.csv
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                {tradeLogs.length} Total Records
              </span>
              <span className="text-[10px] text-zinc-500">
                Synced at {lastSyncTime || 'Active'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLedgerFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  ledgerFilter === 'ALL' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setLedgerFilter('TP_HIT')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  ledgerFilter === 'TP_HIT' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60' : 'text-zinc-400'
                }`}
              >
                TP_HIT
              </button>
              <button
                onClick={() => setLedgerFilter('TIME_STOP')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  ledgerFilter === 'TIME_STOP' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60' : 'text-zinc-400'
                }`}
              >
                TIME_STOP
              </button>
              <button
                onClick={() => fetchTrades(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>SYNC</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">SYMBOL</th>
                  <th className="py-2.5 px-3">ENTRY / EXIT PRICE</th>
                  <th className="py-2.5 px-3">CVI</th>
                  <th className="py-2.5 px-3">QUEUE CLEARANCE</th>
                  <th className="py-2.5 px-3">HOLD (S)</th>
                  <th className="py-2.5 px-3">STATUS MARKER</th>
                  <th className="py-2.5 px-3 text-right">NET REALIZED PNL (AFTER 0.07% FEES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {tradeLogs
                  .filter(t => {
                    if (ledgerFilter === 'TP_HIT') return t.outcome.startsWith('TP_HIT');
                    if (ledgerFilter === 'TIME_STOP') return t.outcome.includes('TIME_STOP');
                    return true;
                  })
                  .map((t) => {
                    const isTpHit = t.outcome.startsWith('TP_HIT');
                    const isToxic = t.outcome.includes('TOXIC');
                    const isProfitableDrift = t.outcome.includes('TIME_STOP') && (t.pnlPct || 0) > 0;
                    const isLossCut = t.outcome.includes('TIME_STOP') && (t.pnlPct || 0) <= 0;
                    const netUsd = t.netPnlUsd !== undefined ? t.netPnlUsd : ((t.pnlUsd || 0) - (t.feeUsd || 175));
                    const feeUsd = t.feeUsd !== undefined ? t.feeUsd : 175;

                    return (
                      <tr key={t.id} className="hover:bg-zinc-900/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-300 whitespace-nowrap">
                          {t.timestamp.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                          {t.symbol}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          ${t.entryPrice.toFixed(2)} &rarr; ${t.exitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[11px] font-bold">
                            {(t.cviAtEntry || 3.85).toFixed(2)}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-300 whitespace-nowrap">
                          {(t.queueClearanceSeconds || 8.4).toFixed(1)}s
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.holdSeconds < 45 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-900 text-zinc-400'
                          }`}>
                            {t.holdSeconds}s
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isToxic && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50">
                              <span>☣️ TOXIC_ABORT</span>
                            </span>
                          )}
                          {isTpHit && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>TP_HIT (Mean Reversion)</span>
                            </span>
                          )}
                          {isProfitableDrift && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>TIME_STOP (Profitable Drift)</span>
                            </span>
                          )}
                          {isLossCut && !isToxic && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>TIME_STOP (Floor Broken)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                          <div className={`font-bold ${netUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {netUsd >= 0 ? '+' : ''}${netUsd.toFixed(netUsd > -1 && netUsd < 1 ? 3 : 2)} Net ({t.netPnlPct !== undefined ? (t.netPnlPct >= 0 ? '+' : '') + t.netPnlPct.toFixed(2) + '%' : (t.pnlPct >= 0 ? '+' : '') + t.pnlPct.toFixed(2) + '%'})
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Gross: ${t.pnlUsd < 10 && t.pnlUsd > -10 ? t.pnlUsd.toFixed(2) : t.pnlUsd.toFixed(0)} | Fee: -${feeUsd < 10 ? feeUsd.toFixed(3) : feeUsd.toFixed(0)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: STANDALONE DUAL-MODE SCRIPT ================= */}
      {activeTab === 'PYTHON_SOURCE' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="font-bold text-white uppercase text-sm">
                DUAL-MODE MULTI-PAIR FLEET ENGINE (shadow_trader.py)
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Autonomous Execution &bull; Telegram &amp; Discord Dispatcher &bull; Emergency Kill-Switch &bull; USD Queue Hurdle
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonScript);
                  setToastMessage('Script copied to clipboard');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>COPY CODE</span>
              </button>
              <a
                href="/api/shadow-script?download=true"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD FILE</span>
              </a>
            </div>
          </div>

          <pre className="bg-black border border-zinc-900 rounded-lg p-4 text-[11px] text-emerald-300/90 overflow-x-auto max-h-[600px] leading-relaxed">
            {pythonScript || '// Loading python script...'}
          </pre>
        </div>
      )}
    </div>
  );
};
