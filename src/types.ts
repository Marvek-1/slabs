export interface OrderBookLevel {
  price: number;
  size: number;
  totalUsd: number;
  cumulativeUsd: number;
  isCluster?: boolean;
  isExhaustionFloor?: boolean;
  isSpoofedWall?: boolean;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  currentPrice: number;
  lastUpdateId: number;
  timestamp: number;
}

export interface LiquidationCluster {
  id: string;
  price: number;
  volumeUsd: number;
  direction: 'LONG_CASCADE' | 'SHORT_SQUEEZE';
  verifiedByOi: boolean;
  oiSpikeDelta: number;
  isSpoofed: boolean;
  status: 'PENDING' | 'DETONATING' | 'ABSORBED' | 'VACUUM_COLLAPSE';
}

export type MachineState =
  | 'IDLE'
  | 'ARMED'
  | 'FILLED'
  | 'EXIT_TP'
  | 'TIME_STOP_CUT'
  | 'CIRCUIT_BREAKER_HALT'
  | 'INVALIDATED';

export interface ActivePosition {
  pair: string;
  entryPrice: number;
  sizeUsd: number;
  allocationPercent: number;
  targetTp: number;
  fillTimestamp: number;
  elapsedSeconds: number;
  currentPrice: number;
  unrealizedPnlPercent: number;
  unrealizedPnlUsd: number;
  exitReason?: string;
  exitPrice?: number;
}

export interface QuantitativeMetrics {
  airPocketDepthUsd: number;
  clusterUsd: number;
  cvi: number; // Cascade Vulnerability Index
  exhaustionPrice: number | null;
  restingBidsCount: number;
  tickVelocity: number; // trades/sec
  openInterest: number;
  oiDeltaPercent: number;
  fundingRate: number; // e.g. 0.01%
  crossAssetCorrelation: number; // e.g. 0.28 (isolated) vs 0.92 (systemic contagion)
  networkLatencyMs: number;
  cancelOnDisconnectActive: boolean;
  serverProximity: 'AWS_TOKYO_COLO_12MS' | 'RESIDENTIAL_HIGH_JITTER_180MS' | 'MELTDOWN_FROZEN_4200MS';
}

export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  state: MachineState;
  entryPrice: number;
  exitPrice: number;
  holdDurationSeconds: number;
  pnlPercent: number;
  pnlUsd: number;
  outcome: 'TAKE_PROFIT' | 'TIME_STOP_CUT' | 'CIRCUIT_HALT' | 'CANCELLED';
  cviAtEntry: number;
  hammerInvolved?: 'HAMMER_1' | 'HAMMER_2' | 'HAMMER_3';
}

export type HammerType = 'NONE' | 'HAMMER_1_MELTDOWN' | 'HAMMER_2_SPOOF' | 'HAMMER_3_SYSTEMIC';

export interface HammerStressState {
  activeHammer: HammerType;
  title: string;
  injectedAt: number | null;
  stage: 'IDLE' | 'INJECTING' | 'TRIGGERED' | 'RESOLVED';
  log: string[];
  metrics: {
    latency: number;
    api429Count: number;
    spoofBidPulled: boolean;
    systemicCorrelation: number;
    vulnerableLossPercent: number;
    strategistResultPercent: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  latencyMs?: number;
}

export interface ShadowTradeLogRecord {
  id: string;
  timestamp: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  cviAtEntry: number;
  queueClearanceSeconds: number;
  holdSeconds: number;
  outcome: 'TP_HIT (Mean Reversion)' | 'TIME_STOP_EXPIRED (Floor Broken)' | 'MANUAL_CUT' | 'TOXIC_EVENT_ABORT' | string;
  pnlPct: number;
  pnlUsd: number;
  feeUsd?: number;
  netPnlUsd?: number;
  netPnlPct?: number;
}

export interface FIFOQueueState {
  entryPrice: number;
  targetTp: number;
  accumulatedFillVol: number;
  requiredQueueVol: number;
  progressPct: number;
  recentTradesThrough: Array<{ price: number; qty: number; time: number; side?: 'BUY' | 'SELL' }>;
  isPenetrating: boolean;
}

export interface FleetPairTelemetry {
  symbol: string;
  name: string;
  price: number;
  refPrice: number;
  dropPct: number;
  cvi: number;
  cushionPct: number;
  tickVelocity: number;
  volume24hUsd: number;
  openInterestStability: number;
  oiPlungePct?: number;
  isToxicAborted?: boolean;
  status: 'IDLE' | 'SCANNING' | 'ARMED' | 'FILLED' | 'COOLDOWN' | 'TOXIC_ABORT';
  activeSlot?: number;
  armedPrice?: number;
  targetTp?: number;
  fillTime?: number;
  accumulatedFillUsd?: number;
  requiredQueueUsd: number;
  holdSeconds?: number;
  pnlPct?: number;
  pnlUsd?: number;
  feeUsd?: number;
  netPnlUsd?: number;
  minContractStepUsd?: number;
  is10DollarApproved?: boolean;
}

export interface ConcurrencyGovernorConfig {
  maxActiveSlots: number;
  totalRiskPoolUsd: number;
  marginPerSlotUsd: number;
  usdQueueHurdle: number;
  autoExecute: boolean;
  minCviThreshold: number;
  decelerationCap: number;
  baseDropPct: number;
  absorptionBuffer: number;
  feeDragPct: number; // e.g. 0.07% round trip (0.02% maker + 0.05% taker)
  toxicOiThresholdPct: number; // e.g. 15% plunge triggers TOXIC_EVENT_ABORT
  microCapitalTier: 'INSTITUTIONAL_250K' | 'MICRO_FLIGHT_250' | 'MINI_MICRO_10';
}

export type OperationalMode = 'SIGNAL_ONLY' | 'PAPER' | 'LIVE';

export interface WebhookDispatcherConfig {
  enabled: boolean;
  telegramToken: string;
  telegramChatId: string;
  discordWebhookUrl: string;
  notifyOnArmed: boolean;
  notifyOnFilled: boolean;
  notifyOnExit: boolean;
  lastPingStatus?: 'IDLE' | 'SENDING' | 'SUCCESS' | 'FAILED';
  lastPingMessage?: string;
}

export interface DispatchedSignalCard {
  id: string;
  timestamp: string;
  type: 'ARMED' | 'FILLED' | 'EXIT_TP' | 'EXIT_TIME_STOP' | 'TOXIC_EVENT';
  symbol: string;
  title: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  metrics: { [key: string]: string };
  rawPayload: string;
  destinations: string[];
}


