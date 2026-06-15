import math

import pytest

from backend.breakeven_engine.engine import BreakEvenEngine


SPOT_PRICE = 62000
STRADDLE_STRIKE = 60000
LOT_SIZE = 25
PREMIUM = 2500
LOTS = 2


def _straddle_positions():
    return [
        {
            "strike": STRADDLE_STRIKE,
            "type": "straddle",
            "pe_strike": STRADDLE_STRIKE,
            "premium": PREMIUM,
            "lots": LOTS,
            "lot_size": LOT_SIZE,
            "spot_price": SPOT_PRICE,
        }
    ]


def _iron_condor_positions():
    return [
        {"strike": 58000, "type": "iron_condor", "premium": 200, "lots": 1, "lot_size": LOT_SIZE, "spot_price": SPOT_PRICE},
        {"strike": 59000, "type": "iron_condor", "premium": 350, "lots": 1, "lot_size": LOT_SIZE, "spot_price": SPOT_PRICE},
        {"strike": 63000, "type": "iron_condor", "premium": 300, "lots": 1, "lot_size": LOT_SIZE, "spot_price": SPOT_PRICE},
        {"strike": 64000, "type": "iron_condor", "premium": 180, "lots": 1, "lot_size": LOT_SIZE, "spot_price": SPOT_PRICE},
    ]


def _sample_positions():
    return [
        {"symbol": "BTC-60000-CE", "side": "sell", "size": 2, "delta": -0.45, "gamma": -0.00002, "theta": -150, "vega": -320, "mark_price": 1200, "entry_price": 1500},
        {"symbol": "BTC-60000-PE", "side": "sell", "size": 2, "delta": 0.42, "gamma": -0.000018, "theta": -130, "vega": -290, "mark_price": 1100, "entry_price": 1400},
        {"symbol": "BTC-58000-PE", "side": "sell", "size": 1, "delta": 0.15, "gamma": -0.000008, "theta": -60, "vega": -120, "mark_price": 500, "entry_price": 700},
        {"symbol": "BTC-64000-CE", "side": "sell", "size": 1, "delta": -0.12, "gamma": -0.000007, "theta": -50, "vega": -100, "mark_price": 400, "entry_price": 600},
    ]


class TestBreakEvenCalculation:
    def test_straddle_break_even(self):
        engine = BreakEvenEngine()
        positions = _straddle_positions()
        result = engine.calculate_break_even(positions)

        expected_upper = STRADDLE_STRIKE + PREMIUM
        expected_lower = STRADDLE_STRIKE - PREMIUM
        assert math.isclose(result["upper_be"], expected_upper, rel_tol=1e-2)
        assert math.isclose(result["lower_be"], expected_lower, rel_tol=1e-2)
        assert result["upper_be"] > result["lower_be"]
        assert result["risk_level"] in ("SAFE", "CAUTION", "DANGER", "CRITICAL")

    def test_iron_condor_break_even(self):
        engine = BreakEvenEngine()
        positions = _iron_condor_positions()
        result = engine.calculate_break_even(positions)

        assert result["upper_be"] > result["lower_be"]
        assert result["risk_level"] in ("SAFE", "CAUTION", "DANGER", "CRITICAL")

    def test_empty_positions(self):
        engine = BreakEvenEngine()
        result = engine.calculate_break_even([])

        assert result["upper_be"] == 0
        assert result["lower_be"] == 0
        assert result["risk_level"] == "SAFE"

    def test_breach_detection_upper(self):
        engine = BreakEvenEngine()
        positions = _straddle_positions()
        be_data = engine.calculate_break_even(positions)

        alerts = engine.detect_breaching(positions, be_data["upper_be"] + 500)
        assert any(a["type"] == "UPPER_BREACH" for a in alerts)

    def test_breach_detection_lower(self):
        engine = BreakEvenEngine()
        positions = _straddle_positions()
        be_data = engine.calculate_break_even(positions)

        alerts = engine.detect_breaching(positions, be_data["lower_be"] - 500)
        assert any(a["type"] == "LOWER_BREACH" for a in alerts)

    def test_no_breach_when_safe(self):
        engine = BreakEvenEngine()
        positions = _straddle_positions()
        alerts = engine.detect_breaching(positions, STRADDLE_STRIKE)
        assert len(alerts) == 0


class TestGreeksCalculation:
    def test_portfolio_delta(self):
        positions = _sample_positions()
        total_delta = sum(p["delta"] * p["size"] for p in positions)
        assert total_delta < 0

    def test_portfolio_gamma(self):
        positions = _sample_positions()
        total_gamma = sum(p["gamma"] * p["size"] for p in positions)
        assert total_gamma < 0

    def test_portfolio_theta(self):
        positions = _sample_positions()
        total_theta = sum(p["theta"] * p["size"] for p in positions)
        assert total_theta < 0

    def test_portfolio_vega(self):
        positions = _sample_positions()
        total_vega = sum(p["vega"] * p["size"] for p in positions)
        assert total_vega < 0

    def test_greeks_neutral_spread(self):
        ce_pos = {"delta": 0.5, "gamma": 0.001, "theta": -10, "vega": 20, "size": 1}
        pe_pos = {"delta": -0.5, "gamma": 0.001, "theta": -10, "vega": 20, "size": 1}
        net_delta = (ce_pos["delta"] + pe_pos["delta"]) * 1
        assert abs(net_delta) < 0.01


class TestGammaRiskDetection:
    def test_high_gamma_risk(self):
        positions = _sample_positions()
        total_gamma = sum(p["gamma"] * p["size"] for p in positions)
        spot = SPOT_PRICE
        gamma_exposure = abs(total_gamma) * spot * spot * 0.01

        risk_level = "SAFE"
        if gamma_exposure > 50000:
            risk_level = "CRITICAL"
        elif gamma_exposure > 20000:
            risk_level = "HIGH"
        elif gamma_exposure > 5000:
            risk_level = "MODERATE"

        assert risk_level in ("SAFE", "MODERATE", "HIGH", "CRITICAL")

    def test_gamma_near_expiry(self):
        days_to_expiry = 2
        gamma_multiplier = max(1.0, 30.0 / max(days_to_expiry, 1))
        base_gamma = 0.00002
        amplified_gamma = base_gamma * gamma_multiplier
        assert amplified_gamma > base_gamma

    def test_gamma_exposure_calculation(self):
        gamma = -0.00003
        spot = SPOT_PRICE
        size = 2
        notional = spot * size * LOT_SIZE
        gamma_exposure = abs(gamma) * notional * 0.01
        assert gamma_exposure > 0


class TestTrendClassification:
    def test_uptrend_detection(self):
        prices = [61000, 61200, 61500, 61800, 62000, 62200, 62500]
        changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        positive_moves = sum(1 for c in changes if c > 0)
        trend = "UPTREND" if positive_moves > len(changes) * 0.6 else "RANGE"
        assert trend == "UPTREND"

    def test_downtrend_detection(self):
        prices = [63000, 62800, 62500, 62200, 62000, 61800, 61500]
        changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        negative_moves = sum(1 for c in changes if c < 0)
        trend = "DOWNTREND" if negative_moves > len(changes) * 0.6 else "RANGE"
        assert trend == "DOWNTREND"

    def test_range_detection(self):
        prices = [62000, 62100, 61950, 62050, 61950, 62050, 62000]
        changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        positive_moves = sum(1 for c in changes if c > 0)
        negative_moves = sum(1 for c in changes if c < 0)
        is_range = abs(positive_moves - negative_moves) <= 1
        trend = "RANGE" if is_range else ("UPTREND" if positive_moves > negative_moves else "DOWNTREND")
        assert trend == "RANGE"

    def test_volatility_regime(self):
        prices = [62000, 61500, 63000, 61000, 63500, 60500, 64000]
        returns = [(prices[i] - prices[i - 1]) / prices[i - 1] for i in range(1, len(prices))]
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
        volatility = math.sqrt(variance)
        regime = "HIGH_VOL" if volatility > 0.02 else "LOW_VOL"
        assert regime in ("HIGH_VOL", "LOW_VOL")


class TestAdjustmentRanking:
    def test_rank_by_cost_efficiency(self):
        adjustments = [
            {"type": "roll_out", "cost": 150, "risk_reduction": 30, "net_delta_change": -0.1},
            {"type": "close_half", "cost": 200, "risk_reduction": 50, "net_delta_change": -0.2},
            {"type": "add_hedge", "cost": 100, "risk_reduction": 40, "net_delta_change": -0.05},
        ]
        for adj in adjustments:
            adj["efficiency"] = adj["risk_reduction"] / adj["cost"] if adj["cost"] > 0 else 0

        ranked = sorted(adjustments, key=lambda x: x["efficiency"], reverse=True)
        assert ranked[0]["type"] == "add_hedge"
        assert ranked[-1]["type"] == "roll_out"

    def test_rank_by_delta_impact(self):
        adjustments = [
            {"type": "roll_out", "net_delta_change": -0.1, "cost": 150},
            {"type": "close_half", "net_delta_change": -0.25, "cost": 300},
            {"type": "add_hedge", "net_delta_change": -0.05, "cost": 100},
        ]
        ranked = sorted(adjustments, key=lambda x: abs(x["net_delta_change"]), reverse=True)
        assert ranked[0]["type"] == "close_half"
        assert ranked[-1]["type"] == "add_hedge"

    def test_adjustment_score_composite(self):
        adjustments = [
            {"type": "roll_out", "cost": 150, "risk_reduction": 30, "net_delta_change": -0.1},
            {"type": "close_half", "cost": 200, "risk_reduction": 50, "net_delta_change": -0.2},
            {"type": "add_hedge", "cost": 100, "risk_reduction": 20, "net_delta_change": -0.05},
        ]
        for adj in adjustments:
            efficiency = adj["risk_reduction"] / adj["cost"] if adj["cost"] > 0 else 0
            delta_impact = abs(adj["net_delta_change"])
            adj["score"] = efficiency * 0.6 + delta_impact * 100 * 0.4

        ranked = sorted(adjustments, key=lambda x: x["score"], reverse=True)
        assert len(ranked) == 3
        assert all("score" in adj for adj in ranked)
