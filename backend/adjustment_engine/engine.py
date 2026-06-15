import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid


class AdjustmentEngine:
    def __init__(self):
        self.adjustments = []

    def evaluate_adjustments(
        self,
        positions: List[Dict[str, Any]],
        spot_price: float,
        greeks: Dict[str, float],
        trend: Dict[str, Any],
        gamma_risk: Dict[str, Any],
        breakeven: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        adjustments = []

        adjustments.append(self.generate_strike_shift(positions, spot_price))
        adjustments.append(self.generate_recenter(positions, spot_price))
        adjustments.append(self.generate_strangle_conversion(positions, trend))
        adjustments.append(self.generate_iron_fly(positions, spot_price))
        adjustments.append(self.generate_iron_condor(positions, spot_price))
        adjustments.append(self.generate_protective_hedge(positions, gamma_risk, breakeven))

        return self.rank_adjustments(adjustments)

    def generate_strike_shift(self, positions: List[Dict[str, Any]], spot_price: float) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("STRIKE_SHIFT")

        current_strike = positions[0].get("strike", spot_price)
        distance_from_spot = spot_price - current_strike

        if abs(distance_from_spot) < spot_price * 0.01:
            action = "HOLD"
            new_strike = current_strike
        elif distance_from_spot > 0:
            action = "ROLL_UP"
            new_strike = current_strike + spot_price * 0.02
        else:
            action = "ROLL_DOWN"
            new_strike = current_strike - spot_price * 0.02

        new_delta = 0.15 if action == "HOLD" else 0.25
        new_gamma = 0.003 if action == "HOLD" else 0.005
        new_be_upper = new_strike + spot_price * 0.03
        new_be_lower = new_strike - spot_price * 0.03

        return {
            "id": str(uuid.uuid4()),
            "type": "STRIKE_SHIFT",
            "action": action,
            "legs": [{
                "instrument": positions[0].get("instrument", ""),
                "strike": round(new_strike, 2),
                "side": positions[0].get("side", "sell"),
                "lots": positions[0].get("lots", 1)
            }],
            "lots": positions[0].get("lots", 1),
            "new_delta": round(new_delta, 4),
            "new_gamma": round(new_gamma, 6),
            "new_breakeven": {
                "upper": round(new_be_upper, 2),
                "lower": round(new_be_lower, 2)
            },
            "success_probability": 0.75,
            "risk_reduction": 0.25,
            "capital_efficiency": 0.8,
            "delta_improvement": 0.3,
            "gamma_improvement": 0.2,
            "survival_probability": 0.85,
            "execute_command": f"EXECUTE STRIKE_SHIFT: {action} to {new_strike:.2f}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_recenter(self, positions: List[Dict[str, Any]], spot_price: float) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("RECENTER")

        current_strike = positions[0].get("strike", spot_price)
        recenter_strike = spot_price

        net_premium = sum(p.get("premium", 0) * p.get("lots", 1) * p.get("lot_size", 1) for p in positions)
        lots = positions[0].get("lots", 1)
        lot_size = positions[0].get("lot_size", 1)

        new_premium = abs(net_premium) / (lots * lot_size) if lots * lot_size > 0 else 0
        new_be_upper = recenter_strike + new_premium
        new_be_lower = recenter_strike - new_premium

        return {
            "id": str(uuid.uuid4()),
            "type": "RECENTER",
            "action": "RECENTER_STRADDLE",
            "legs": [{
                "instrument": positions[0].get("instrument", ""),
                "strike": round(recenter_strike, 2),
                "side": positions[0].get("side", "sell"),
                "lots": lots
            }],
            "lots": lots,
            "new_delta": 0.0,
            "new_gamma": 0.004,
            "new_breakeven": {
                "upper": round(new_be_upper, 2),
                "lower": round(new_be_lower, 2)
            },
            "success_probability": 0.80,
            "risk_reduction": 0.35,
            "capital_efficiency": 0.70,
            "delta_improvement": 0.60,
            "gamma_improvement": 0.30,
            "survival_probability": 0.90,
            "execute_command": f"EXECUTE RECENTER: Move straddle to {recenter_strike:.2f}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_strangle_conversion(self, positions: List[Dict[str, Any]], trend: Dict[str, Any]) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("STRANGLE_CONVERSION")

        spot_price = positions[0].get("spot_price", 0)
        current_strike = positions[0].get("strike", spot_price)
        direction = trend.get("direction", "SIDEWAYS")

        if direction == "UP":
            ce_strike = current_strike + spot_price * 0.03
            pe_strike = current_strike - spot_price * 0.05
        elif direction == "DOWN":
            ce_strike = current_strike + spot_price * 0.05
            pe_strike = current_strike - spot_price * 0.03
        else:
            ce_strike = current_strike + spot_price * 0.04
            pe_strike = current_strike - spot_price * 0.04

        new_be_upper = ce_strike + spot_price * 0.02
        new_be_lower = pe_strike - spot_price * 0.02

        return {
            "id": str(uuid.uuid4()),
            "type": "STRANGLE_CONVERSION",
            "action": "CONVERT_TO_STRANGLE",
            "legs": [
                {
                    "instrument": f"CE_{ce_strike:.0f}",
                    "strike": round(ce_strike, 2),
                    "side": "sell",
                    "lots": positions[0].get("lots", 1)
                },
                {
                    "instrument": f"PE_{pe_strike:.0f}",
                    "strike": round(pe_strike, 2),
                    "side": "sell",
                    "lots": positions[0].get("lots", 1)
                }
            ],
            "lots": positions[0].get("lots", 1),
            "new_delta": 0.10,
            "new_gamma": 0.002,
            "new_breakeven": {
                "upper": round(new_be_upper, 2),
                "lower": round(new_be_lower, 2)
            },
            "success_probability": 0.70,
            "risk_reduction": 0.40,
            "capital_efficiency": 0.60,
            "delta_improvement": 0.50,
            "gamma_improvement": 0.45,
            "survival_probability": 0.80,
            "execute_command": f"EXECUTE STRANGLE: CE {ce_strike:.2f} / PE {pe_strike:.2f}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_iron_fly(self, positions: List[Dict[str, Any]], spot_price: float) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("IRON_FLY")

        atm_strike = round(spot_price / 5) * 5
        wing_distance = spot_price * 0.03

        new_be_upper = atm_strike + wing_distance + spot_price * 0.005
        new_be_lower = atm_strike - wing_distance - spot_price * 0.005

        return {
            "id": str(uuid.uuid4()),
            "type": "IRON_FLY",
            "action": "CONVERT_TO_IRON_FLY",
            "legs": [
                {"instrument": f"CE_{atm_strike + wing_distance:.0f}", "strike": round(atm_strike + wing_distance, 2), "side": "sell", "lots": positions[0].get("lots", 1)},
                {"instrument": f"PE_{atm_strike - wing_distance:.0f}", "strike": round(atm_strike - wing_distance, 2), "side": "sell", "lots": positions[0].get("lots", 1)},
                {"instrument": f"CE_{atm_strike + wing_distance * 2:.0f}", "strike": round(atm_strike + wing_distance * 2, 2), "side": "buy", "lots": positions[0].get("lots", 1)},
                {"instrument": f"PE_{atm_strike - wing_distance * 2:.0f}", "strike": round(atm_strike - wing_distance * 2, 2), "side": "buy", "lots": positions[0].get("lots", 1)}
            ],
            "lots": positions[0].get("lots", 1),
            "new_delta": 0.05,
            "new_gamma": 0.001,
            "new_breakeven": {
                "upper": round(new_be_upper, 2),
                "lower": round(new_be_lower, 2)
            },
            "success_probability": 0.85,
            "risk_reduction": 0.55,
            "capital_efficiency": 0.50,
            "delta_improvement": 0.70,
            "gamma_improvement": 0.60,
            "survival_probability": 0.92,
            "execute_command": f"EXECUTE IRON_FLY: ATM {atm_strike} wings ±{wing_distance:.2f}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_iron_condor(self, positions: List[Dict[str, Any]], spot_price: float) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("IRON_CONDOR")

        inner_width = spot_price * 0.02
        outer_width = spot_price * 0.05

        short_ce = spot_price + inner_width
        long_ce = spot_price + outer_width
        short_pe = spot_price - inner_width
        long_pe = spot_price - outer_width

        new_be_upper = short_ce - spot_price * 0.005
        new_be_lower = short_pe + spot_price * 0.005

        return {
            "id": str(uuid.uuid4()),
            "type": "IRON_CONDOR",
            "action": "CONVERT_TO_IRON_CONDOR",
            "legs": [
                {"instrument": f"CE_{long_ce:.0f}", "strike": round(long_ce, 2), "side": "buy", "lots": positions[0].get("lots", 1)},
                {"instrument": f"CE_{short_ce:.0f}", "strike": round(short_ce, 2), "side": "sell", "lots": positions[0].get("lots", 1)},
                {"instrument": f"PE_{short_pe:.0f}", "strike": round(short_pe, 2), "side": "sell", "lots": positions[0].get("lots", 1)},
                {"instrument": f"PE_{long_pe:.0f}", "strike": round(long_pe, 2), "side": "buy", "lots": positions[0].get("lots", 1)}
            ],
            "lots": positions[0].get("lots", 1),
            "new_delta": 0.08,
            "new_gamma": 0.0015,
            "new_breakeven": {
                "upper": round(new_be_upper, 2),
                "lower": round(new_be_lower, 2)
            },
            "success_probability": 0.78,
            "risk_reduction": 0.50,
            "capital_efficiency": 0.55,
            "delta_improvement": 0.65,
            "gamma_improvement": 0.55,
            "survival_probability": 0.88,
            "execute_command": f"EXECUTE IRON_CONDOR: Short {short_ce:.2f}/{short_pe:.2f} Long {long_ce:.2f}/{long_pe:.2f}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_protective_hedge(
        self,
        positions: List[Dict[str, Any]],
        gamma_risk: Dict[str, Any],
        breakeven: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not positions:
            return self._empty_adjustment("PROTECTIVE_HEDGE")

        spot_price = positions[0].get("spot_price", 0)
        risk_level = gamma_risk.get("overall_risk", "LOW")
        upper_be = breakeven.get("upper_be", spot_price * 1.05)
        lower_be = breakeven.get("lower_be", spot_price * 0.95)

        if risk_level in ["CRITICAL", "HIGH"]:
            hedge_strike_ce = upper_be + spot_price * 0.02
            hedge_strike_pe = lower_be - spot_price * 0.02
            lots_to_hedge = max(1, positions[0].get("lots", 1) // 2)
        else:
            hedge_strike_ce = upper_be + spot_price * 0.04
            hedge_strike_pe = lower_be - spot_price * 0.04
            lots_to_hedge = max(1, positions[0].get("lots", 1) // 3)

        return {
            "id": str(uuid.uuid4()),
            "type": "PROTECTIVE_HEDGE",
            "action": "ADD_HEDGE",
            "legs": [
                {"instrument": f"CE_{hedge_strike_ce:.0f}", "strike": round(hedge_strike_ce, 2), "side": "buy", "lots": lots_to_hedge},
                {"instrument": f"PE_{hedge_strike_pe:.0f}", "strike": round(hedge_strike_pe, 2), "side": "buy", "lots": lots_to_hedge}
            ],
            "lots": lots_to_hedge,
            "new_delta": 0.12,
            "new_gamma": 0.002,
            "new_breakeven": {
                "upper": round(upper_be + spot_price * 0.01, 2),
                "lower": round(lower_be - spot_price * 0.01, 2)
            },
            "success_probability": 0.82,
            "risk_reduction": 0.45,
            "capital_efficiency": 0.40,
            "delta_improvement": 0.40,
            "gamma_improvement": 0.50,
            "survival_probability": 0.87,
            "execute_command": f"EXECUTE HEDGE: Buy CE {hedge_strike_ce:.2f} / PE {hedge_strike_pe:.2f} x{lots_to_hedge}",
            "timestamp": datetime.utcnow().isoformat()
        }

    def rank_adjustments(self, adjustments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for adj in adjustments:
            risk_reduction = adj.get("risk_reduction", 0)
            capital_efficiency = adj.get("capital_efficiency", 0)
            delta_improvement = adj.get("delta_improvement", 0)
            gamma_improvement = adj.get("gamma_improvement", 0)
            survival_probability = adj.get("survival_probability", 0)

            adj["composite_score"] = round(
                risk_reduction * 0.3 +
                capital_efficiency * 0.2 +
                delta_improvement * 0.25 +
                gamma_improvement * 0.15 +
                survival_probability * 0.1,
                4
            )

        return sorted(adjustments, key=lambda x: x.get("composite_score", 0), reverse=True)

    def get_best_adjustment(
        self,
        positions: List[Dict[str, Any]],
        spot_price: float,
        greeks: Dict[str, float],
        trend: Dict[str, Any],
        gamma_risk: Dict[str, Any],
        breakeven: Dict[str, Any]
    ) -> Dict[str, Any]:
        adjustments = self.evaluate_adjustments(
            positions, spot_price, greeks, trend, gamma_risk, breakeven
        )

        if not adjustments:
            return {
                "recommendation": "NO_ACTION",
                "message": "No adjustments necessary at this time",
                "execute_command": "HOLD_CURRENT_POSITION",
                "timestamp": datetime.utcnow().isoformat()
            }

        best = adjustments[0]

        return {
            "recommendation": best.get("type", "UNKNOWN"),
            "action": best.get("action", "UNKNOWN"),
            "legs": best.get("legs", []),
            "lots": best.get("lots", 0),
            "new_delta": best.get("new_delta", 0),
            "new_gamma": best.get("new_gamma", 0),
            "new_breakeven": best.get("new_breakeven", {}),
            "success_probability": best.get("success_probability", 0),
            "risk_reduction": best.get("risk_reduction", 0),
            "capital_efficiency": best.get("capital_efficiency", 0),
            "delta_improvement": best.get("delta_improvement", 0),
            "gamma_improvement": best.get("gamma_improvement", 0),
            "survival_probability": best.get("survival_probability", 0),
            "composite_score": best.get("composite_score", 0),
            "execute_command": best.get("execute_command", "EXECUTE ADJUSTMENT"),
            "alternatives": [a.get("type") for a in adjustments[1:3]] if len(adjustments) > 1 else [],
            "timestamp": datetime.utcnow().isoformat()
        }

    def _empty_adjustment(self, adj_type: str) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "type": adj_type,
            "action": "NO_DATA",
            "legs": [],
            "lots": 0,
            "new_delta": 0,
            "new_gamma": 0,
            "new_breakeven": {"upper": 0, "lower": 0},
            "success_probability": 0,
            "risk_reduction": 0,
            "capital_efficiency": 0,
            "delta_improvement": 0,
            "gamma_improvement": 0,
            "survival_probability": 0,
            "execute_command": f"NO_ACTION: Insufficient data for {adj_type}",
            "timestamp": datetime.utcnow().isoformat()
        }
