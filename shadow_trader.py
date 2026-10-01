import asyncio
import json
import time
import csv
import os
from collections import deque
from datetime import datetime
import websockets
import aiohttp

# =================TOP 30 FLEET UNIVERSE=================
# Top 30 USD-M Futures contracts by 24h Volume (> $100M daily liquidity)
TOP_30_PAIRS = [
    "btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt",
    "dogeusdt", "suiusdt", "pepeusdt", "avaxusdt", "linkusdt",
    "nearusdt", "aptusdt", "adausdt", "shibusdt", "wifusdt",
    "fetusdt", "renderusdt", "opusdt", "arbusdt", "injusdt",
    "tiausdt", "ftmusdt", "seiusdt", "runeusdt", "galausdt",
    "tonusdt", "flokiusdt", "filusdt", "kasusdt", "aaveusdt"
]

CSV_FILE = "shadow_trading_log.csv"

# =================INSTITUTIONAL QUANT PARAMETERS=================
# 1. USD-Normalized FIFO Queue Hurdle (Eliminates Coin Denomination Trap)
REQUIRED_QUEUE_USD = 150_000.0  # $150k real taker sales must penetrate price level

# 2. Concurrency Governor & Slot Allocator
MAX_ACTIVE_SLOTS = 3           # Strictly max 3 concurrent active positions
TOTAL_RISK_POOL_USD = 250_000.0 # $250k virtual portfolio
MARGIN_PER_SLOT_USD = 25_000.0  # $25,000 margin allocation per slot

# 3. Microstructural Gates & Exhaustion Cushion
MIN_CVI_THRESHOLD = 3.0        # Cascade Vulnerability Index >= 3.0x
ABSORPTION_BUFFER = 1.45       # Demands 145% resting bid absorption cushion
BASE_DROP_PCT = 0.008          # 0.8% dynamic displacement filter
MAX_TICK_VELOCITY = 65         # Stands down if fills/sec > 65 (falling knife gate)

# 4. Chronometer & Mean Reversion Rules
SNAPBACK_TP_PCT = 0.005        # +0.50% Take-Profit snapback target
MAX_HOLD_SECONDS = 90          # 90-second mechanical time stop

# =================DUAL-MODE DISPATCH CONFIG=================
# Operational Modes: "SIGNAL_ONLY", "PAPER", "LIVE"
OPERATIONAL_MODE = os.getenv("OPERATIONAL_MODE", "PAPER")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8626267731:AAF_G0WXosbyPyvPjcQnRe2kiWL0fdXBx8E")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "7539832188")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

class DualModeDispatcher:
    """
    Asynchronous Webhook Dispatcher: Broadcasts formatted institutional alerts
    to Telegram & Discord without blocking the high-frequency WebSocket loop.
    """
    def __init__(self, mode=OPERATIONAL_MODE):
        self.mode = mode

    async def send_alert(self, title: str, details: dict, color="green"):
        # 1. Telegram Dispatch
        if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
            msg = f"<b>{title}</b>\n" + "\n".join([f"• <b>{k}:</b> {v}" for k, v in details.items()])
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            payload = {"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "HTML"}
            try:
                async with aiohttp.ClientSession() as session:
                    await session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=4))
            except Exception as e:
                print(f"⚠️ [TELEGRAM DISPATCH ERROR] {e}")

        # 2. Discord Webhook Dispatch
        if DISCORD_WEBHOOK_URL and DISCORD_WEBHOOK_URL.startswith("http"):
            color_int = 3066993 if color == "green" else (15105570 if color == "amber" else 15158332)
            fields = [{"name": k, "value": str(v), "inline": True} for k, v in details.items()]
            embed = {
                "title": title,
                "color": color_int,
                "fields": fields,
                "footer": {"text": f"Mode: {self.mode} | Vacuum Engine Sentinel"},
                "timestamp": datetime.utcnow().isoformat()
            }
            try:
                async with aiohttp.ClientSession() as session:
                    await session.post(DISCORD_WEBHOOK_URL, json={"embeds": [embed]}, timeout=aiohttp.ClientTimeout(total=4))
            except Exception as e:
                print(f"⚠️ [DISCORD DISPATCH ERROR] {e}")

class MultiPairFleetShadowTrader:
    def __init__(self, pairs=TOP_30_PAIRS[:10]):
        self.pairs = [p.lower() for p in pairs]
        self.active_slots = {}  # {symbol: position_dict}
        self.armed_traps = {}   # {symbol: armed_dict}
        self.pair_states = {}   # {symbol: {price, ref, bids, asks, vel}}
        self.dispatcher = DualModeDispatcher(mode=OPERATIONAL_MODE)
        self.is_halted = False
        
        for p in self.pairs:
            self.pair_states[p] = {
                "price": 0.0,
                "ref_price": 0.0,
                "last_ref_update": time.time(),
                "bids": [],
                "asks": [],
                "timestamps": deque(),
                "velocity": 0.0,
                "cvi": 1.5,
                "drop_pct": 0.0,
            }
        
        self.init_csv()

    def init_csv(self):
        if not os.path.exists(CSV_FILE):
            with open(CSV_FILE, mode='w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    "Timestamp", "Symbol", "Entry_Price", "Exit_Price", 
                    "CVI_Entry", "Queue_Clearance_Sec", "Hold_Seconds", "Outcome", "PnL_Pct", "PnL_USD"
                ])

    def emergency_halt_all(self):
        """Immediately halts scanner and cancels all armed/active positions to flat cash."""
        self.is_halted = True
        self.armed_traps.clear()
        print("\n" + "!"*70)
        print("🚨 [EMERGENCY KILL-SWITCH] FLEET HALTED. ALL NETS DROPPED TO FLAT CASH.")
        print("!"*70 + "\n")
        self.active_slots.clear()

    async def log_trade(self, symbol: str, exit_price: float, outcome: str):
        pos = self.active_slots.pop(symbol, None)
        if not pos:
            return

        hold_time = round(time.time() - pos["fill_time"], 2)
        entry_price = pos["entry_price"]
        pnl_pct = ((exit_price - entry_price) / entry_price) * 100
        pnl_usd = (pnl_pct / 100) * MARGIN_PER_SLOT_USD * 10 # 10x effective leverage
        
        print("\n" + "="*65)
        print(f"📊 [FLEET POSITION CLOSED] Symbol: {symbol.upper()} | Outcome: {outcome}")
        print(f"   Entry: ${entry_price:,.4f} -> Exit: ${exit_price:,.4f}")
        print(f"   Hold: {hold_time}s / {MAX_HOLD_SECONDS}s | Queue Clearance: {pos['queue_clearance_sec']}s")
        print(f"   PnL: {pnl_pct:+.2f}% (${pnl_usd:+.2f}) | Open Slots: {len(self.active_slots)}/{MAX_ACTIVE_SLOTS}")
        print("="*65 + "\n")

        with open(CSV_FILE, mode='a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.utcnow().isoformat(), symbol.upper(),
                entry_price, exit_price,
                round(pos["cvi"], 2),
                pos["queue_clearance_sec"],
                hold_time,
                outcome,
                round(pnl_pct, 4),
                round(pnl_usd, 2)
            ])

        # Dispatch exit alert
        color = "green" if "TP_HIT" in outcome else ("amber" if pnl_pct > 0 else "rose")
        await self.dispatcher.send_alert(
            title=f"✅ [FLEET POSITION CLOSED] — {symbol.upper()}",
            details={
                "Outcome": outcome,
                "Hold Duration": f"{hold_time}s / {MAX_HOLD_SECONDS}s Max",
                "Entry Price": f"${entry_price:,.4f}",
                "Exit Price": f"${exit_price:,.4f}",
                "Profit Realized": f"{pnl_pct:+.2f}% (${pnl_usd:+.2f})",
                "Slots Remaining": f"{len(self.active_slots)}/{MAX_ACTIVE_SLOTS} Active"
            },
            color=color
        )

    def process_depth(self, symbol: str, data: dict):
        if self.is_halted:
            return

        state = self.pair_states.get(symbol)
        if not state:
            return

        state["bids"] = [(float(p), float(s)) for p, s in data.get('b', [])]
        state["asks"] = [(float(p), float(s)) for p, s in data.get('a', [])]
        if state["bids"] and state["asks"]:
            state["price"] = (state["bids"][0][0] + state["asks"][0][0]) / 2.0

        now = time.time()
        if now - state["last_ref_update"] > 60:
            state["ref_price"] = state["price"]
            state["last_ref_update"] = now

        if state["ref_price"] > 0:
            state["drop_pct"] = max(0.0, (state["ref_price"] - state["price"]) / state["ref_price"])
            top_bid_usd = sum(p * s for p, s in state["bids"][:10])
            state["cvi"] = round(min(5.5, max(1.1, (state["drop_pct"] * 2500000) / max(10000.0, top_bid_usd))), 2)

        # Check if we should arm net for this pair
        if symbol not in self.active_slots and symbol not in self.armed_traps:
            if len(self.active_slots) < MAX_ACTIVE_SLOTS:
                self.evaluate_trap_arming(symbol)

    def evaluate_trap_arming(self, symbol: str):
        state = self.pair_states[symbol]
        drop = state["drop_pct"]
        vel = state["velocity"]
        cvi = state["cvi"]

        dynamic_drop_threshold = BASE_DROP_PCT + (0.0001 * max(0, vel - 40))
        if drop < dynamic_drop_threshold or vel > MAX_TICK_VELOCITY or cvi < MIN_CVI_THRESHOLD:
            return

        target_absorb_usd = REQUIRED_QUEUE_USD * ABSORPTION_BUFFER
        cumulative_usd = 0.0
        floor_price = None
        for p, s in state["bids"]:
            cumulative_usd += (p * s)
            if cumulative_usd >= target_absorb_usd:
                floor_price = p
                break

        if floor_price:
            self.armed_traps[symbol] = {
                "entry_price": floor_price,
                "target_tp": floor_price * (1 + SNAPBACK_TP_PCT),
                "armed_time": time.time(),
                "accumulated_fill_usd": 0.0,
                "cvi": cvi
            }
            print(f"🎯 [TRAP ARMED] {symbol.upper()} | Floor: ${floor_price:,.4f} | TP: ${floor_price*(1+SNAPBACK_TP_PCT):,.4f} | CVI: {cvi}x")
            
            # Non-blocking dispatch
            asyncio.create_task(self.dispatcher.send_alert(
                title=f"🎯 [TRAP ARMED] — {symbol.upper()}",
                details={
                    "Displacement Drop": f"{drop*100:.2f}%",
                    "Vacuum Metric": f"CVI {cvi:.2f}x",
                    "Resting Floor": f"${floor_price:,.4f}",
                    "Target Snapback": f"${floor_price*(1+SNAPBACK_TP_PCT):,.4f} (+0.50%)",
                    "Queue Required": f"${REQUIRED_QUEUE_USD:,.0f} USD"
                },
                color="amber"
            ))

    async def process_trade(self, symbol: str, data: dict):
        if self.is_halted:
            return

        state = self.pair_states.get(symbol)
        if not state:
            return

        price = float(data['p'])
        qty = float(data['q'])
        trade_usd = price * qty
        now = time.time()

        state["timestamps"].append(now)
        while state["timestamps"] and state["timestamps"][0] < now - 1.0:
            state["timestamps"].popleft()
        state["velocity"] = len(state["timestamps"])

        # Check armed trap -> FIFO queue fill authentication
        if symbol in self.armed_traps:
            trap = self.armed_traps[symbol]
            if price <= trap["entry_price"]:
                trap["accumulated_fill_usd"] += trade_usd
                
                if trap["accumulated_fill_usd"] >= REQUIRED_QUEUE_USD:
                    if len(self.active_slots) < MAX_ACTIVE_SLOTS:
                        clearance_sec = round(now - trap["armed_time"], 2)
                        self.active_slots[symbol] = {
                            "entry_price": trap["entry_price"],
                            "target_tp": trap["target_tp"],
                            "fill_time": now,
                            "cvi": trap["cvi"],
                            "queue_clearance_sec": clearance_sec,
                        }
                        del self.armed_traps[symbol]
                        print(f"\n⚡ [SLOT ALLOCATED] {symbol.upper()} FILLED after ${trap['accumulated_fill_usd']:,.0f} queue selloff ({clearance_sec}s)")
                        print(f"   Active Slots: {len(self.active_slots)}/{MAX_ACTIVE_SLOTS} | Margin Allocated: ${MARGIN_PER_SLOT_USD:,.0f}")

                        # Dispatch Detonation Alert
                        await self.dispatcher.send_alert(
                            title=f"🚨 [AIR POCKET DETONATION] — {symbol.upper()}",
                            details={
                                "Vacuum Metric": f"CVI {trap['cvi']:.2f}x (Thin Book)",
                                "Queue Hurdle": f"${REQUIRED_QUEUE_USD:,.0f} Absorbed ({clearance_sec}s)",
                                "Net Entry": f"${trap['entry_price']:,.4f} (Post-Only Filled)",
                                "Target TP": f"${trap['target_tp']:,.4f} (+0.50% Snapback)",
                                "Chronometer": f"{MAX_HOLD_SECONDS}s Mechanical Countdown",
                                "Active Slots": f"{len(self.active_slots)}/{MAX_ACTIVE_SLOTS} ({OPERATIONAL_MODE} Mode)"
                            },
                            color="green"
                        )
                    else:
                        print(f"⚠️ [SLOT CONGESTION] {symbol.upper()} penetrated queue but all {MAX_ACTIVE_SLOTS} slots occupied. Queuing.")

        # Check active position management
        elif symbol in self.active_slots:
            pos = self.active_slots[symbol]
            elapsed = now - pos["fill_time"]

            if price >= pos["target_tp"]:
                await self.log_trade(symbol, pos["target_tp"], "TP_HIT (Mean Reversion)")
            elif elapsed >= MAX_HOLD_SECONDS:
                await self.log_trade(symbol, price, "TIME_STOP_EXPIRED (Floor Broken)")

    async def run(self):
        streams = []
        for p in self.pairs:
            streams.append(f"{p}@depth20@100ms")
            streams.append(f"{p}@aggTrade")
        
        ws_url = f"wss://fstream.binance.com/stream?streams={'/'.join(streams)}"
        print("="*70)
        print("🚀 TOP 30 DUAL-MODE MULTI-PAIR FLEET ENGINE")
        print(f"   Operational Mode: {OPERATIONAL_MODE}")
        print(f"   Monitoring {len(self.pairs)} Active Contracts: {', '.join([p.upper() for p in self.pairs[:8]])}...")
        print(f"   Universal USD Queue Hurdle: ${REQUIRED_QUEUE_USD:,.0f} USD")
        print(f"   Concurrency Limit: {MAX_ACTIVE_SLOTS} Concurrent Active Slots")
        print(f"   Margin Per Slot: ${MARGIN_PER_SLOT_USD:,.0f} (Total Pool: ${TOTAL_RISK_POOL_USD:,.0f})")
        print(f"   Webhooks: Telegram={'Configured' if TELEGRAM_BOT_TOKEN else 'Off'} | Discord={'Configured' if DISCORD_WEBHOOK_URL else 'Off'}")
        print("="*70)

        async with websockets.connect(ws_url) as ws:
            print("✅ Multiplexed WebSocket Connected. Fleet scanning active...\n")
            while not self.is_halted:
                msg = await ws.recv()
                event = json.loads(msg)
                stream = event.get('stream', '')
                data = event.get('data', {})
                symbol = stream.split('@')[0]

                if 'depth20' in stream:
                    self.process_depth(symbol, data)
                elif 'aggTrade' in stream:
                    await self.process_trade(symbol, data)

if __name__ == "__main__":
    trader = MultiPairFleetShadowTrader()
    try:
        asyncio.run(trader.run())
    except KeyboardInterrupt:
        print("\n🛑 Fleet Shadow Trader Stopped.")
