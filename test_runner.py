import asyncio
import math
import os
import tempfile

from shadow_trader_reality_v3 import (
    StrategyConfig,
    PairState,
    Position,
    RealityShadowTrader,
    find_absorption_floor,
    is_aggressive_sell,
    realized_pnl_usd,
    sweep_book_for_base_qty,
    sweep_book_for_quote_notional,
)


def cfg(csv_path: str) -> StrategyConfig:
    return StrategyConfig(
        total_risk_pool_usd=10.0,
        margin_per_slot_usd=2.0,
        leverage=2.0,
        max_active_slots=5,
        min_drop_pct=0.008,
        min_sell_pressure_ratio=0.10,
        absorption_buffer=1.20,
        snapback_tp_pct=0.005,
        max_hold_seconds=90.0,
        max_trade_velocity=1000.0,
        pressure_window_seconds=2.0,
        reference_window_seconds=60.0,
        max_book_age_ms=1000,
        min_signal_spacing_seconds=0.0,
        max_entry_impact_bps=100.0,
        max_exit_impact_bps=100.0,
        max_arm_seconds=10.0,
        taker_fee_rate=0.0004,
        fleet_size=1,
        min_24h_quote_volume_usd=0.0,
        csv_file=csv_path,
    )


def test_aggressor_side():
    assert is_aggressive_sell({"m": True}) is True
    assert is_aggressive_sell({"m": False}) is False


def test_quote_sweep_vwap():
    asks = [(100.0, 1.0), (101.0, 2.0)]
    fill = sweep_book_for_quote_notional(asks, 201.0, "buy")
    assert fill is not None
    assert math.isclose(fill.base_qty, 2.0, rel_tol=0, abs_tol=1e-12)
    assert math.isclose(fill.vwap, 100.5, rel_tol=0, abs_tol=1e-12)
    assert fill.levels_used == 2
    assert math.isclose(fill.impact_bps, 50.0, abs_tol=1e-10)


def test_refuses_invented_liquidity():
    asks = [(100.0, 1.0)]
    assert sweep_book_for_quote_notional(asks, 101.0, "buy") is None
    bids = [(100.0, 1.0)]
    assert sweep_book_for_base_qty(bids, 1.1, "sell") is None


def test_exit_sweep_vwap():
    bids = [(100.0, 1.0), (99.0, 2.0)]
    fill = sweep_book_for_base_qty(bids, 2.0, "sell")
    assert fill is not None
    expected = (100.0 + 99.0) / 2.0
    assert math.isclose(fill.vwap, expected, abs_tol=1e-12)
    assert math.isclose(fill.impact_bps, 50.0, abs_tol=1e-10)


def test_absorption_floor():
    bids = [(100.0, 1.0), (99.0, 1.0), (98.0, 2.0)]
    # shock=150, target at 120% = 180; first two levels cumulate to 199
    floor = find_absorption_floor(bids, 150.0, 1.2)
    assert floor is not None
    price, cumulative, ratio = floor
    assert price == 99.0
    assert math.isclose(cumulative, 199.0)
    assert math.isclose(ratio, 199.0 / 150.0)


def test_round_trip_fees_are_charged():
    # 1 base bought at 100 and sold at +0.5%; 4 bps taker each side.
    gross, fees, net = realized_pnl_usd(100.0, 100.5, 1.0, 0.0004)
    assert math.isclose(gross, 0.5)
    assert math.isclose(fees, (100.0 + 100.5) * 0.0004)
    assert math.isclose(net, 0.5 - fees)

    # Institutional version of the same shape: 250k entry notional.
    qty = 250000.0 / 100.0
    gross, fees, net = realized_pnl_usd(100.0, 100.5, qty, 0.0007)
    assert math.isclose(gross, 1250.0)
    assert fees > 350.0  # both entry and exit, not just one side
    assert net < 900.0


def test_capital_consistency_guard():
    bad = StrategyConfig(
        total_risk_pool_usd=10.0,
        margin_per_slot_usd=5.0,
        leverage=1.0,
        max_active_slots=3,  # 15 > 10
        min_drop_pct=0.008,
        min_sell_pressure_ratio=0.1,
        absorption_buffer=1.2,
        snapback_tp_pct=0.005,
        max_hold_seconds=90,
        max_trade_velocity=100,
        pressure_window_seconds=2,
        reference_window_seconds=60,
        max_book_age_ms=1000,
        min_signal_spacing_seconds=0,
        max_entry_impact_bps=100,
        max_exit_impact_bps=100,
        max_arm_seconds=10,
        taker_fee_rate=0.0004,
    )
    try:
        bad.validate()
        raise AssertionError("expected capital consistency validation failure")
    except ValueError:
        pass


# ================= NEW REGRESSION & PROPERTY TESTS =================

async def test_no_fill_if_mark_touches_but_executable_bid_does_not():
    """Regression Test 1: No favorable fill if target is touched only by mark/trade price, but executable bid does not reach it."""
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, "trades.csv")
        trader = RealityShadowTrader(cfg(path), ["testusdt"])
        st = trader.states["testusdt"]

        # Position entered at entry_vwap = 100.0, target_price = 100.50 (+0.50%)
        pos = Position(
            symbol="testusdt",
            entry_vwap=100.0,
            base_qty=1.0,
            entry_notional_usd=100.0,
            target_price=100.50,
            opened_exchange_ms=1000,
            pressure_ratio=0.5,
            drop_pct=0.01,
            sell_impulse_usd=100.0,
            absorption_ratio=1.5,
            entry_impact_bps=2.0,
            entry_fee_usd=0.04,
        )
        trader.positions["testusdt"] = pos

        # Orderbook bids remain at 100.10 (well below 100.50 TP target)
        st.bids = [(100.10, 10.0)]
        st.asks = [(100.20, 10.0)]
        st.book_event_ms = 1005

        # Process a trade printing $100.50 (e.g. buyer aggressing far side or mark price spike)
        await trader.process_trade("testusdt", {
            "p": "100.50", "q": "1.0", "m": False, "T": 1005
        })

        # Assert position remains OPEN because executable bids (100.10) did NOT reach 100.50!
        assert "testusdt" in trader.positions, "Position should NOT exit when executable bids remain below target_price"


def test_no_entry_if_insufficient_depth():
    """Regression Test 2: No entry if the ask book cannot fill requested base quantity / notional."""
    # Requested quote notional = $1,000
    asks = [(100.0, 2.0)]  # Only $200 available
    fill = sweep_book_for_quote_notional(asks, 1000.0, "buy")
    assert fill is None, "Should refuse fill when visible book depth is insufficient"


def test_larger_position_produces_worse_or_equal_vwap():
    """Regression Test 3: A larger position size must produce worse or equal VWAP (and higher/equal impact) than a smaller position on the same book."""
    asks = [(100.0, 1.0), (101.0, 2.0), (102.0, 5.0)]
    
    small_fill = sweep_book_for_quote_notional(asks, 100.0, "buy")
    large_fill = sweep_book_for_quote_notional(asks, 300.0, "buy")

    assert small_fill is not None and large_fill is not None
    assert large_fill.vwap >= small_fill.vwap, "Larger size must produce worse (higher for buy) or equal VWAP"
    assert large_fill.impact_bps >= small_fill.impact_bps, "Larger size must produce higher or equal market impact"


def test_higher_fees_or_slippage_never_improves_pnl():
    """Regression Test 4: Increasing fees or slippage must never improve reported net PnL."""
    entry_vwap = 100.0
    exit_vwap_clean = 100.5
    exit_vwap_slipped = 100.4  # worse exit price due to slippage
    qty = 10.0

    _, _, net_low_fee = realized_pnl_usd(entry_vwap, exit_vwap_clean, qty, taker_fee_rate=0.0002)
    _, _, net_high_fee = realized_pnl_usd(entry_vwap, exit_vwap_clean, qty, taker_fee_rate=0.0010)

    assert net_high_fee <= net_low_fee, "Higher fees must never improve net PnL"

    _, _, net_slipped = realized_pnl_usd(entry_vwap, exit_vwap_slipped, qty, taker_fee_rate=0.0002)
    assert net_slipped <= net_low_fee, "Worse exit price/slippage must never improve net PnL"


def test_property_realized_net_pnl_le_frictionless_pnl():
    """Property Test: realized_net_pnl <= frictionless_pnl for every trade."""
    # Test across a matrix of entry/exit prices and fee rates
    test_cases = [
        (100.0, 100.5, 5.0, 0.0004),
        (50.0, 48.0, 10.0, 0.0007),
        (1.85, 1.87, 1000.0, 0.0005),
    ]

    for entry_vwap, exit_vwap, qty, fee_rate in test_cases:
        # Frictionless PnL assuming exact entry/exit mid prices with 0 fees
        frictionless_pnl = (exit_vwap - entry_vwap) * qty
        
        gross, fees, net_pnl = realized_pnl_usd(entry_vwap, exit_vwap, qty, fee_rate)
        
        assert net_pnl <= frictionless_pnl, f"Realized net PnL ({net_pnl}) must be <= frictionless PnL ({frictionless_pnl})"


async def test_arming_requires_real_sell_penetration():
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, "trades.csv")
        trader = RealityShadowTrader(cfg(path), ["testusdt"])
        st = trader.states["testusdt"]

        # Live-looking book with 4 USD entry notional fillable.
        st.bids = [(99.0, 1.0), (98.0, 1.0), (97.0, 1.0)]
        st.asks = [(100.0, 1.0), (101.0, 1.0)]
        st.book_event_ms = 1000
        st.price = 99.5
        st.ref_price = 101.0
        st.drop_pct = (101.0 - 99.5) / 101.0
        st.velocity = 1
        st.sell_impulse_usd = 100.0
        st.pressure_ratio = 100.0 / sum(p*q for p,q in st.bids)

        trader._maybe_arm(st, 1000)
        assert "testusdt" in trader.armed
        floor = trader.armed["testusdt"].floor_price

        # Buyer-aggressive trade at/below floor MUST NOT authenticate the entry.
        await trader.process_trade("testusdt", {
            "p": str(floor), "q": "1", "m": False, "T": 1001
        })
        assert "testusdt" not in trader.positions

        # Seller-aggressive trade does authenticate it, assuming fresh book.
        await trader.process_trade("testusdt", {
            "p": str(floor), "q": "1", "m": True, "T": 1002
        })
        assert "testusdt" in trader.positions


def main():
    test_aggressor_side()
    test_quote_sweep_vwap()
    test_refuses_invented_liquidity()
    test_exit_sweep_vwap()
    test_absorption_floor()
    test_round_trip_fees_are_charged()
    test_capital_consistency_guard()
    
    # Run new regression & property tests
    asyncio.run(test_no_fill_if_mark_touches_but_executable_bid_does_not())
    test_no_entry_if_insufficient_depth()
    test_larger_position_produces_worse_or_equal_vwap()
    test_higher_fees_or_slippage_never_improves_pnl()
    test_property_realized_net_pnl_le_frictionless_pnl()
    
    asyncio.run(test_arming_requires_real_sell_penetration())
    print("ALL TESTS PASSED (INCLUDING REGRESSION & PROPERTY TESTS)")


if __name__ == "__main__":
    main()
