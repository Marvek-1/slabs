from __future__ import annotations

import asyncio
import csv
import json
import math
import os
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, Iterable, List, Optional, Sequence, Tuple

try:
    import aiohttp
except ImportError:
    aiohttp = None  # type: ignore

try:
    import websockets
except ImportError:
    websockets = None  # type: ignore


BINANCE_REST = "https://fapi.binance.com"
BINANCE_WS = "wss://fstream.binance.com/stream"


@dataclass(frozen=True)
class StrategyConfig:
    # Capital / execution policy. These are policy inputs, not market observations.
    total_risk_pool_usd: float
    margin_per_slot_usd: float
    leverage: float
    max_active_slots: int

    # Empirical strategy thresholds. Load these from calibration output / environment.
    min_drop_pct: float
    min_sell_pressure_ratio: float
    absorption_buffer: float
    snapback_tp_pct: float
    max_hold_seconds: float
    max_trade_velocity: float

    # Measurement windows / execution safeguards.
    pressure_window_seconds: float
    reference_window_seconds: float
    max_book_age_ms: int
    min_signal_spacing_seconds: float
    max_entry_impact_bps: float
    max_exit_impact_bps: float
    max_arm_seconds: float

    # Account-specific execution cost. Set from your Binance account commission data.
    taker_fee_rate: float

    # Scanner universe.
    fleet_size: int = 30
    min_24h_quote_volume_usd: float = 100_000_000.0
    csv_file: str = "shadow_trading_log_v3.csv"

    def validate(self) -> None:
        positive = {
            "total_risk_pool_usd": self.total_risk_pool_usd,
            "margin_per_slot_usd": self.margin_per_slot_usd,
            "leverage": self.leverage,
            "max_active_slots": self.max_active_slots,
            "pressure_window_seconds": self.pressure_window_seconds,
            "reference_window_seconds": self.reference_window_seconds,
            "max_book_age_ms": self.max_book_age_ms,
            "max_hold_seconds": self.max_hold_seconds,
            "max_arm_seconds": self.max_arm_seconds,
        }
        for name, value in positive.items():
            if value <= 0:
                raise ValueError(f"{name} must be > 0")

        if self.margin_per_slot_usd * self.max_active_slots > self.total_risk_pool_usd:
            raise ValueError("slot margin allocation exceeds total risk pool")
        if not (0 <= self.min_drop_pct < 1):
            raise ValueError("min_drop_pct must be in [0,1)")
        if self.min_sell_pressure_ratio < 0:
            raise ValueError("min_sell_pressure_ratio must be >= 0")
        if self.absorption_buffer <= 0:
            raise ValueError("absorption_buffer must be > 0")
        if not (0 < self.snapback_tp_pct < 1):
            raise ValueError("snapback_tp_pct must be in (0,1)")
        if self.max_trade_velocity <= 0:
            raise ValueError("max_trade_velocity must be > 0")
        if not (0 <= self.taker_fee_rate < 0.1):
            raise ValueError("taker_fee_rate must be a decimal fraction, e.g. 0.0005")
        if self.fleet_size <= 0:
            raise ValueError("fleet_size must be > 0")

    @property
    def position_notional_usd(self) -> float:
        return self.margin_per_slot_usd * self.leverage

    @classmethod
    def from_env(cls) -> "StrategyConfig":
        """
        Fail closed instead of silently inventing empirical/risk parameters.
        Required environment variables:
          TOTAL_RISK_POOL_USD, MARGIN_PER_SLOT_USD, LEVERAGE, MAX_ACTIVE_SLOTS,
          MIN_DROP_PCT, MIN_SELL_PRESSURE_RATIO, ABSORPTION_BUFFER,
          SNAPBACK_TP_PCT, MAX_HOLD_SECONDS, MAX_TRADE_VELOCITY,
          TAKER_FEE_RATE

        Optional operational settings have conservative defaults.
        """
        required = [
            "TOTAL_RISK_POOL_USD",
            "MARGIN_PER_SLOT_USD",
            "LEVERAGE",
            "MAX_ACTIVE_SLOTS",
            "MIN_DROP_PCT",
            "MIN_SELL_PRESSURE_RATIO",
            "ABSORPTION_BUFFER",
            "SNAPBACK_TP_PCT",
            "MAX_HOLD_SECONDS",
            "MAX_TRADE_VELOCITY",
            "TAKER_FEE_RATE",
        ]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(
                "Missing required configuration: " + ", ".join(missing)
            )

        cfg = cls(
            total_risk_pool_usd=float(os.environ["TOTAL_RISK_POOL_USD"]),
            margin_per_slot_usd=float(os.environ["MARGIN_PER_SLOT_USD"]),
            leverage=float(os.environ["LEVERAGE"]),
            max_active_slots=int(os.environ["MAX_ACTIVE_SLOTS"]),
            min_drop_pct=float(os.environ["MIN_DROP_PCT"]),
            min_sell_pressure_ratio=float(os.environ["MIN_SELL_PRESSURE_RATIO"]),
            absorption_buffer=float(os.environ["ABSORPTION_BUFFER"]),
            snapback_tp_pct=float(os.environ["SNAPBACK_TP_PCT"]),
            max_hold_seconds=float(os.environ["MAX_HOLD_SECONDS"]),
            max_trade_velocity=float(os.environ["MAX_TRADE_VELOCITY"]),
            pressure_window_seconds=float(os.getenv("PRESSURE_WINDOW_SECONDS", "2.0")),
            reference_window_seconds=float(os.getenv("REFERENCE_WINDOW_SECONDS", "60.0")),
            max_book_age_ms=int(os.getenv("MAX_BOOK_AGE_MS", "750")),
            min_signal_spacing_seconds=float(os.getenv("MIN_SIGNAL_SPACING_SECONDS", "10.0")),
            max_entry_impact_bps=float(os.getenv("MAX_ENTRY_IMPACT_BPS", "20")),
            max_exit_impact_bps=float(os.getenv("MAX_EXIT_IMPACT_BPS", "30")),
            max_arm_seconds=float(os.getenv("MAX_ARM_SECONDS", "10")),
            taker_fee_rate=float(os.environ["TAKER_FEE_RATE"]),
            fleet_size=int(os.getenv("FLEET_SIZE", "30")),
            min_24h_quote_volume_usd=float(os.getenv("MIN_24H_QUOTE_VOLUME_USD", "100000000")),
            csv_file=os.getenv("CSV_FILE", "shadow_trading_log_v3.csv"),
        )
        cfg.validate()
        return cfg


@dataclass
class FillEstimate:
    vwap: float
    base_qty: float
    quote_notional: float
    worst_price: float
    impact_bps: float
    levels_used: int


@dataclass
class ArmedSignal:
    symbol: str
    floor_price: float
    armed_exchange_ms: int
    sell_impulse_usd: float
    pressure_ratio: float
    drop_pct: float
    absorption_ratio: float


@dataclass
class Position:
    symbol: str
    entry_vwap: float
    base_qty: float
    entry_notional_usd: float
    target_price: float
    opened_exchange_ms: int
    pressure_ratio: float
    drop_pct: float
    sell_impulse_usd: float
    absorption_ratio: float
    entry_impact_bps: float
    entry_fee_usd: float


@dataclass
class PairState:
    symbol: str
    bids: List[Tuple[float, float]] = field(default_factory=list)
    asks: List[Tuple[float, float]] = field(default_factory=list)
    book_event_ms: int = 0
    price: float = 0.0
    ref_price: float = 0.0
    drop_pct: float = 0.0
    mid_history: Deque[Tuple[int, float]] = field(default_factory=deque)

    trade_times_ms: Deque[Tuple[int, int]] = field(default_factory=deque)
    sell_flow: Deque[Tuple[int, float, float]] = field(default_factory=deque)  # ms, price, notional
    buy_flow: Deque[Tuple[int, float, float]] = field(default_factory=deque)

    velocity: float = 0.0
    sell_impulse_usd: float = 0.0
    buy_impulse_usd: float = 0.0
    pressure_ratio: float = 0.0
    absorption_ratio: float = 0.0
    last_signal_ms: int = 0


def is_aggressive_sell(agg_trade: dict) -> bool:
    """
    Binance aggTrade field `m` means 'is buyer the market maker'.
    If buyer is maker, seller is taker/aggressor => aggressive sell.
    """
    return bool(agg_trade.get("m", False))


def orderbook_notional(levels: Sequence[Tuple[float, float]]) -> float:
    return sum(price * qty for price, qty in levels if price > 0 and qty > 0)


def sweep_book_for_quote_notional(
    levels: Sequence[Tuple[float, float]],
    quote_notional_usd: float,
    side: str,
) -> Optional[FillEstimate]:
    """
    Estimate a taker fill against a visible L2 book.

    side="buy": levels must be asks ascending.
    side="sell": levels must be bids descending.

    Returns None if the visible book cannot fill the full requested notional.
    This intentionally refuses to invent liquidity beyond the observed book.
    """
    if quote_notional_usd <= 0:
        raise ValueError("quote_notional_usd must be > 0")
    if side not in {"buy", "sell"}:
        raise ValueError("side must be 'buy' or 'sell'")
    if not levels:
        return None

    remaining_quote = quote_notional_usd
    spent_quote = 0.0
    filled_base = 0.0
    worst_price = 0.0
    levels_used = 0

    best_price = levels[0][0]
    if best_price <= 0:
        return None

    for price, available_base in levels:
        if price <= 0 or available_base <= 0:
            continue
        level_quote = price * available_base
        take_quote = min(remaining_quote, level_quote)
        take_base = take_quote / price

        spent_quote += take_quote
        filled_base += take_base
        remaining_quote -= take_quote
        worst_price = price
        levels_used += 1

        if remaining_quote <= max(1e-9, quote_notional_usd * 1e-12):
            break

    if remaining_quote > max(1e-6, quote_notional_usd * 1e-9):
        return None
    if filled_base <= 0:
        return None

    vwap = spent_quote / filled_base
    if side == "buy":
        impact_bps = (vwap / best_price - 1.0) * 10_000.0
    else:
        impact_bps = (1.0 - vwap / best_price) * 10_000.0

    return FillEstimate(
        vwap=vwap,
        base_qty=filled_base,
        quote_notional=spent_quote,
        worst_price=worst_price,
        impact_bps=max(0.0, impact_bps),
        levels_used=levels_used,
    )


def sweep_book_for_base_qty(
    levels: Sequence[Tuple[float, float]],
    base_qty: float,
    side: str,
) -> Optional[FillEstimate]:
    """Estimate a taker fill for an exact base quantity."""
    if base_qty <= 0:
        raise ValueError("base_qty must be > 0")
    if side not in {"buy", "sell"}:
        raise ValueError("side must be 'buy' or 'sell'")
    if not levels:
        return None

    remaining_base = base_qty
    quote = 0.0
    filled_base = 0.0
    worst_price = 0.0
    levels_used = 0
    best_price = levels[0][0]

    for price, available_base in levels:
        if price <= 0 or available_base <= 0:
            continue
        take_base = min(remaining_base, available_base)
        quote += take_base * price
        filled_base += take_base
        remaining_base -= take_base
        worst_price = price
        levels_used += 1
        if remaining_base <= max(1e-12, base_qty * 1e-12):
            break

    if remaining_base > max(1e-10, base_qty * 1e-9):
        return None

    vwap = quote / filled_base
    if side == "buy":
        impact_bps = (vwap / best_price - 1.0) * 10_000.0
    else:
        impact_bps = (1.0 - vwap / best_price) * 10_000.0

    return FillEstimate(
        vwap=vwap,
        base_qty=filled_base,
        quote_notional=quote,
        worst_price=worst_price,
        impact_bps=max(0.0, impact_bps),
        levels_used=levels_used,
    )


def find_absorption_floor(
    bids: Sequence[Tuple[float, float]],
    shock_notional_usd: float,
    absorption_buffer: float,
) -> Optional[Tuple[float, float, float]]:
    """
    Find the deepest visible bid price where cumulative visible bid notional
    reaches shock_notional * absorption_buffer.

    Returns (floor_price, cumulative_bid_notional, absorption_ratio).
    """
    if shock_notional_usd <= 0 or absorption_buffer <= 0:
        return None
    target = shock_notional_usd * absorption_buffer
    cumulative = 0.0
    for price, qty in bids:
        if price <= 0 or qty <= 0:
            continue
        cumulative += price * qty
        if cumulative >= target:
            return price, cumulative, cumulative / shock_notional_usd
    return None


def realized_pnl_usd(
    entry_vwap: float,
    exit_vwap: float,
    base_qty: float,
    taker_fee_rate: float,
) -> Tuple[float, float, float]:
    """
    Returns (gross_pnl, fees, net_pnl), charging fees on both entry and exit.
    """
    if min(entry_vwap, exit_vwap, base_qty) <= 0:
        raise ValueError("prices and base_qty must be > 0")
    if taker_fee_rate < 0:
        raise ValueError("taker_fee_rate must be >= 0")

    entry_notional = entry_vwap * base_qty
    exit_notional = exit_vwap * base_qty
    gross = (exit_vwap - entry_vwap) * base_qty
    fees = (entry_notional + exit_notional) * taker_fee_rate
    return gross, fees, gross - fees


async def discover_fleet(
    session: aiohttp.ClientSession,
    fleet_size: int,
    min_quote_volume_usd: float,
) -> List[str]:
    """
    Discover currently TRADING USDT perpetuals and rank by Binance 24h quote volume.
    This removes stale hand-maintained symbol lists and delisted/rebranded contracts.
    """
    async with session.get(f"{BINANCE_REST}/fapi/v1/exchangeInfo") as r:
        r.raise_for_status()
        exchange = await r.json()
    async with session.get(f"{BINANCE_REST}/fapi/v1/ticker/24hr") as r:
        r.raise_for_status()
        tickers = await r.json()

    eligible = {
        s["symbol"]
        for s in exchange.get("symbols", [])
        if s.get("status") == "TRADING"
        and s.get("contractType") == "PERPETUAL"
        and s.get("quoteAsset") == "USDT"
    }

    ranked = []
    for t in tickers:
        symbol = t.get("symbol")
        if symbol not in eligible:
            continue
        try:
            quote_volume = float(t.get("quoteVolume", 0.0))
        except (TypeError, ValueError):
            continue
        if quote_volume >= min_quote_volume_usd:
            ranked.append((quote_volume, symbol.lower()))

    ranked.sort(reverse=True)
    return [symbol for _, symbol in ranked[:fleet_size]]


class AlertDispatcher:
    """
    Alerts are intentionally decoupled from the market-data loop.
    A slow Telegram/Discord endpoint cannot stall trade processing.
    """

    def __init__(self, mode: str = "PAPER"):
        self.mode = mode
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
        self.discord_webhook = os.getenv("DISCORD_WEBHOOK_URL", "")
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=500)
        self.session: Optional[aiohttp.ClientSession] = None
        self.worker_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2.0))
        self.worker_task = asyncio.create_task(self._worker())

    async def close(self) -> None:
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        if self.session:
            await self.session.close()

    def emit(self, title: str, details: dict, color: str = "green") -> None:
        try:
            self.queue.put_nowait((title, details, color))
        except asyncio.QueueFull:
            # Market-data processing has priority over alerts.
            pass

    async def _worker(self) -> None:
        assert self.session is not None
        while True:
            title, details, color = await self.queue.get()
            try:
                await self._send(title, details, color)
            finally:
                self.queue.task_done()

    async def _send(self, title: str, details: dict, color: str) -> None:
        assert self.session is not None

        tasks = []
        if self.telegram_token and self.telegram_chat_id:
            msg = f"<b>{title}</b>\n" + "\n".join(
                f"• <b>{k}:</b> {v}" for k, v in details.items()
            )
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            tasks.append(
                self.session.post(
                    url,
                    json={
                        "chat_id": self.telegram_chat_id,
                        "text": msg,
                        "parse_mode": "HTML",
                    },
                )
            )

        if self.discord_webhook.startswith("http"):
            color_int = 3066993 if color == "green" else 15105570 if color == "amber" else 15158332
            tasks.append(
                self.session.post(
                    self.discord_webhook,
                    json={
                        "embeds": [{
                            "title": title,
                            "color": color_int,
                            "fields": [
                                {"name": k, "value": str(v), "inline": True}
                                for k, v in details.items()
                            ],
                            "footer": {"text": f"Mode: {self.mode} | Vacuum Engine"},
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }]
                    },
                )
            )

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)


class RealityShadowTrader:
    """
    Paper/shadow execution only.

    Important:
      * No fabricated CVI is computed.
      * Signals use directly observable aggressive-sell flow and visible bid depth.
      * Taker fills are estimated by sweeping observed L2 levels.
      * Fees are charged on both entry and exit.
      * If visible depth is insufficient, the engine refuses the fill.
    """

    def __init__(self, config: StrategyConfig, pairs: Sequence[str]):
        config.validate()
        self.cfg = config
        self.pairs = [p.lower() for p in pairs]
        self.states: Dict[str, PairState] = {p: PairState(symbol=p) for p in self.pairs}
        self.positions: Dict[str, Position] = {}
        self.armed: Dict[str, ArmedSignal] = {}
        self.is_halted = False
        self.dispatcher = AlertDispatcher(mode="PAPER")
        self._init_csv()

    def _init_csv(self) -> None:
        if os.path.exists(self.cfg.csv_file):
            return
        with open(self.cfg.csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "TimestampUTC", "Symbol",
                "EntryVWAP", "ExitVWAP", "BaseQty", "EntryNotionalUSD",
                "DropPct", "SellImpulseUSD", "SellPressureRatio", "AbsorptionRatio",
                "EntryImpactBps", "ExitImpactBps",
                "HoldSeconds", "Outcome",
                "GrossPnLUSD", "FeesUSD", "NetPnLUSD", "NetReturnOnMarginPct",
            ])

    @staticmethod
    def _parse_levels(raw: Iterable[Sequence[str]], reverse: bool) -> List[Tuple[float, float]]:
        levels = []
        for item in raw:
            if len(item) < 2:
                continue
            try:
                p = float(item[0])
                q = float(item[1])
            except (TypeError, ValueError):
                continue
            if p > 0 and q > 0 and math.isfinite(p) and math.isfinite(q):
                levels.append((p, q))
        levels.sort(key=lambda x: x[0], reverse=reverse)
        return levels

    def process_depth(self, symbol: str, data: dict) -> None:
        if self.is_halted:
            return
        state = self.states.get(symbol)
        if state is None:
            return

        bids = self._parse_levels(data.get("b", []), reverse=True)
        asks = self._parse_levels(data.get("a", []), reverse=False)
        if not bids or not asks or bids[0][0] >= asks[0][0]:
            return

        state.bids = bids
        state.asks = asks
        state.book_event_ms = int(data.get("E") or data.get("T") or time.time() * 1000)
        state.price = (bids[0][0] + asks[0][0]) / 2.0

        state.mid_history.append((state.book_event_ms, state.price))
        ref_cutoff = state.book_event_ms - int(self.cfg.reference_window_seconds * 1000)
        while state.mid_history and state.mid_history[0][0] < ref_cutoff:
            state.mid_history.popleft()
        state.ref_price = max((px for _, px in state.mid_history), default=state.price)

        if state.ref_price > 0:
            state.drop_pct = max(0.0, (state.ref_price - state.price) / state.ref_price)

        visible_bid_depth = orderbook_notional(state.bids)
        if visible_bid_depth > 0:
            state.pressure_ratio = state.sell_impulse_usd / visible_bid_depth
            state.absorption_ratio = visible_bid_depth / max(state.sell_impulse_usd, 1e-12)
        else:
            state.pressure_ratio = 0.0
            state.absorption_ratio = 0.0

    def _prune_flow(self, state: PairState, now_ms: int) -> None:
        one_second_ago = now_ms - 1000
        while state.trade_times_ms and state.trade_times_ms[0][0] < one_second_ago:
            state.trade_times_ms.popleft()
        state.velocity = float(sum(count for _, count in state.trade_times_ms))

        cutoff = now_ms - int(self.cfg.pressure_window_seconds * 1000)
        while state.sell_flow and state.sell_flow[0][0] < cutoff:
            state.sell_flow.popleft()
        while state.buy_flow and state.buy_flow[0][0] < cutoff:
            state.buy_flow.popleft()

        state.sell_impulse_usd = sum(n for _, _, n in state.sell_flow)
        state.buy_impulse_usd = sum(n for _, _, n in state.buy_flow)

        visible_bid_depth = orderbook_notional(state.bids)
        state.pressure_ratio = (
            state.sell_impulse_usd / visible_bid_depth if visible_bid_depth > 0 else 0.0
        )
        state.absorption_ratio = (
            visible_bid_depth / state.sell_impulse_usd if state.sell_impulse_usd > 0 else 0.0
        )

    def _book_fresh(self, state: PairState, trade_time_ms: int) -> bool:
        if state.book_event_ms <= 0:
            return False
        return abs(trade_time_ms - state.book_event_ms) <= self.cfg.max_book_age_ms

    def _maybe_arm(self, state: PairState, now_ms: int) -> None:
        if state.symbol in self.positions or state.symbol in self.armed:
            return
        if len(self.positions) >= self.cfg.max_active_slots:
            return
        if now_ms - state.last_signal_ms < self.cfg.min_signal_spacing_seconds * 1000:
            return
        if not self._book_fresh(state, now_ms):
            return
        if state.drop_pct < self.cfg.min_drop_pct:
            return
        if state.velocity > self.cfg.max_trade_velocity:
            return
        if state.pressure_ratio < self.cfg.min_sell_pressure_ratio:
            return
        if state.sell_impulse_usd <= 0:
            return

        floor = find_absorption_floor(
            state.bids,
            state.sell_impulse_usd,
            self.cfg.absorption_buffer,
        )
        if floor is None:
            return

        floor_price, _, absorption_ratio = floor
        self.armed[state.symbol] = ArmedSignal(
            symbol=state.symbol,
            floor_price=floor_price,
            armed_exchange_ms=now_ms,
            sell_impulse_usd=state.sell_impulse_usd,
            pressure_ratio=state.pressure_ratio,
            drop_pct=state.drop_pct,
            absorption_ratio=absorption_ratio,
        )
        state.last_signal_ms = now_ms

        self.dispatcher.emit(
            f"SHADOW ARMED — {state.symbol.upper()}",
            {
                "Floor": f"{floor_price:.8g}",
                "Drop": f"{state.drop_pct*100:.3f}%",
                "Sell impulse": f"${state.sell_impulse_usd:,.0f}",
                "Sell/depth pressure": f"{state.pressure_ratio:.3f}x",
                "Absorption": f"{absorption_ratio:.3f}x",
            },
            color="amber",
        )

    def _maybe_fill_armed(
        self,
        state: PairState,
        data: dict,
        trade_price: float,
        now_ms: int,
    ) -> Optional[Tuple[FillEstimate, ArmedSignal]]:
        arm = self.armed.get(state.symbol)
        if arm is None:
            return None

        if (now_ms - arm.armed_exchange_ms) / 1000.0 > self.cfg.max_arm_seconds:
            self.armed.pop(state.symbol, None)
            return None

        # Only a seller-initiated trade may authenticate penetration of the floor.
        if not is_aggressive_sell(data) or trade_price > arm.floor_price:
            return None
        if not self._book_fresh(state, now_ms):
            return None
        if len(self.positions) >= self.cfg.max_active_slots:
            return None

        fill = sweep_book_for_quote_notional(
            state.asks,
            self.cfg.position_notional_usd,
            side="buy",
        )
        if fill is None or fill.impact_bps > self.cfg.max_entry_impact_bps:
            return None

        self.armed.pop(state.symbol, None)
        return fill, arm

    async def process_trade(self, symbol: str, data: dict) -> None:
        if self.is_halted:
            return
        state = self.states.get(symbol)
        if state is None:
            return

        try:
            price = float(data["p"])
            qty = float(data["q"])
        except (KeyError, TypeError, ValueError):
            return
        if price <= 0 or qty <= 0:
            return

        trade_time_ms = int(data.get("T") or data.get("E") or time.time() * 1000)
        notional = price * qty

        try:
            first_trade_id = int(data.get("f"))
            last_trade_id = int(data.get("l"))
            child_trade_count = max(1, last_trade_id - first_trade_id + 1)
        except (TypeError, ValueError):
            child_trade_count = 1
        state.trade_times_ms.append((trade_time_ms, child_trade_count))
        if is_aggressive_sell(data):
            state.sell_flow.append((trade_time_ms, price, notional))
        else:
            state.buy_flow.append((trade_time_ms, price, notional))
        self._prune_flow(state, trade_time_ms)

        if symbol in self.positions:
            await self._manage_position(state, trade_time_ms)
            return

        # First allow an already-armed floor to be authenticated by an aggressive sell.
        filled = self._maybe_fill_armed(state, data, price, trade_time_ms)
        if filled is None:
            # If there was no fill, this event may create a new armed setup.
            self._maybe_arm(state, trade_time_ms)
            return

        fill, arm = filled
        entry_fee = fill.quote_notional * self.cfg.taker_fee_rate
        pos = Position(
            symbol=symbol,
            entry_vwap=fill.vwap,
            base_qty=fill.base_qty,
            entry_notional_usd=fill.quote_notional,
            target_price=fill.vwap * (1.0 + self.cfg.snapback_tp_pct),
            opened_exchange_ms=trade_time_ms,
            pressure_ratio=arm.pressure_ratio,
            drop_pct=arm.drop_pct,
            sell_impulse_usd=arm.sell_impulse_usd,
            absorption_ratio=arm.absorption_ratio,
            entry_impact_bps=fill.impact_bps,
            entry_fee_usd=entry_fee,
        )
        self.positions[symbol] = pos
        state.last_signal_ms = trade_time_ms

        self.dispatcher.emit(
            f"SHADOW ENTRY — {symbol.upper()}",
            {
                "Entry VWAP": f"{pos.entry_vwap:.8g}",
                "Notional": f"${pos.entry_notional_usd:,.2f}",
                "Drop": f"{pos.drop_pct*100:.3f}%",
                "Sell impulse": f"${pos.sell_impulse_usd:,.0f}",
                "Sell/depth pressure": f"{pos.pressure_ratio:.3f}x",
                "Absorption ratio": f"{pos.absorption_ratio:.3f}x",
                "Entry impact": f"{pos.entry_impact_bps:.2f} bps",
                "TP": f"{pos.target_price:.8g}",
            },
        )

    async def _manage_position(self, state: PairState, now_ms: int) -> None:
        pos = self.positions.get(state.symbol)
        if pos is None or not self._book_fresh(state, now_ms):
            return

        elapsed = max(0.0, (now_ms - pos.opened_exchange_ms) / 1000.0)
        exit_fill = sweep_book_for_base_qty(state.bids, pos.base_qty, side="sell")
        if exit_fill is None:
            return

        tp_executable = (
            exit_fill.vwap >= pos.target_price
            and exit_fill.impact_bps <= self.cfg.max_exit_impact_bps
        )
        timed_out = elapsed >= self.cfg.max_hold_seconds

        if tp_executable:
            await self._close_position(state.symbol, exit_fill, now_ms, "TP_HIT_EXECUTABLE")
        elif timed_out:
            await self._close_position(state.symbol, exit_fill, now_ms, "TIME_STOP")

    async def _close_position(
        self,
        symbol: str,
        exit_fill: FillEstimate,
        now_ms: int,
        outcome: str,
    ) -> None:
        pos = self.positions.pop(symbol, None)
        if pos is None:
            return

        gross, fees, net = realized_pnl_usd(
            pos.entry_vwap,
            exit_fill.vwap,
            pos.base_qty,
            self.cfg.taker_fee_rate,
        )
        hold_seconds = max(0.0, (now_ms - pos.opened_exchange_ms) / 1000.0)
        net_return_margin_pct = (net / self.cfg.margin_per_slot_usd) * 100.0

        with open(self.cfg.csv_file, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).isoformat(),
                symbol.upper(),
                f"{pos.entry_vwap:.12g}",
                f"{exit_fill.vwap:.12g}",
                f"{pos.base_qty:.12g}",
                f"{pos.entry_notional_usd:.8f}",
                f"{pos.drop_pct:.8f}",
                f"{pos.sell_impulse_usd:.8f}",
                f"{pos.pressure_ratio:.8f}",
                f"{pos.absorption_ratio:.8f}",
                f"{pos.entry_impact_bps:.6f}",
                f"{exit_fill.impact_bps:.6f}",
                f"{hold_seconds:.3f}",
                outcome,
                f"{gross:.8f}",
                f"{fees:.8f}",
                f"{net:.8f}",
                f"{net_return_margin_pct:.8f}",
            ])

        color = "green" if net > 0 else "rose"
        self.dispatcher.emit(
            f"SHADOW EXIT — {symbol.upper()}",
            {
                "Outcome": outcome,
                "Entry VWAP": f"{pos.entry_vwap:.8g}",
                "Exit VWAP": f"{exit_fill.vwap:.8g}",
                "Hold": f"{hold_seconds:.2f}s",
                "Gross PnL": f"${gross:+,.2f}",
                "Fees": f"${fees:,.2f}",
                "Net PnL": f"${net:+,.2f}",
                "Return on margin": f"{net_return_margin_pct:+.3f}%",
                "Exit impact": f"{exit_fill.impact_bps:.2f} bps",
            },
            color=color,
        )

    async def run(self) -> None:
        streams = []
        for p in self.pairs:
            streams.extend([f"{p}@depth20@100ms", f"{p}@aggTrade"])
        url = f"{BINANCE_WS}?streams={'/'.join(streams)}"

        await self.dispatcher.start()
        try:
            backoff = 1.0
            while not self.is_halted:
                try:
                    async with websockets.connect(
                        url,
                        ping_interval=120,
                        ping_timeout=30,
                        close_timeout=3,
                        max_queue=4096,
                    ) as ws:
                        backoff = 1.0
                        async for raw in ws:
                            event = json.loads(raw)
                            stream = event.get("stream", "")
                            data = event.get("data", {})
                            symbol = stream.split("@", 1)[0]

                            if "@depth20" in stream:
                                self.process_depth(symbol, data)
                            elif "@aggTrade" in stream:
                                await self.process_trade(symbol, data)

                            if self.is_halted:
                                break
                except (OSError, websockets.ConnectionClosed):
                    if self.is_halted:
                        break
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2.0, 30.0)
        finally:
            await self.dispatcher.close()


async def main() -> None:
    cfg = StrategyConfig.from_env()

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5.0)) as session:
        pairs = await discover_fleet(
            session,
            fleet_size=cfg.fleet_size,
            min_quote_volume_usd=cfg.min_24h_quote_volume_usd,
        )

    if not pairs:
        raise RuntimeError("No eligible USD-M perpetual symbols discovered")

    print(f"Shadow trader starting with {len(pairs)} dynamically discovered contracts")
    print(f"Position notional: ${cfg.position_notional_usd:,.2f}")
    print(f"Taker fee rate: {cfg.taker_fee_rate:.6%}")

    trader = RealityShadowTrader(cfg, pairs)
    await trader.run()


if __name__ == "__main__":
    asyncio.run(main())
