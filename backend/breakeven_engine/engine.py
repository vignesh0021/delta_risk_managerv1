import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class BreakEvenEngine:
    def __init__(self):
        self.upper_be = 0
        self.lower_be = 0

    def calculate_break_even(self, positions: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not positions:
            return {
                "upper_be": 0,
                "lower_be": 0,
                "distance_upper": 0,
                "distance_lower": 0,
                "pct_distance_upper": 0,
                "pct_distance_lower": 0,
                "risk_level": "SAFE"
            }

        net_premium = sum(p.get("premium", 0) * p.get("lots", 1) * p.get("lot_size", 1) for p in positions)
        strikes = []
        for pos in positions:
            strikes.append(pos.get("strike", 0))
            if pos.get("type") == "straddle" and "pe_strike" in pos:
                strikes.append(pos.get("pe_strike", 0))

        strikes = np.array([s for s in strikes if s > 0])
        if len(strikes) == 0:
            return {
                "upper_be": 0,
                "lower_be": 0,
                "distance_upper": 0,
                "distance_lower": 0,
                "pct_distance_upper": 0,
                "pct_distance_lower": 0,
                "risk_level": "SAFE"
            }

        avg_strike = np.mean(strikes)
        abs_premium = abs(net_premium)

        position_types = [p.get("type", "") for p in positions]
        is_straddle = "straddle" in position_types
        is_iron_condor = "iron_condor" in position_types

        if is_straddle:
            straddle_strike = np.mean(strikes)
            upper_be = straddle_strike + abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
            lower_be = straddle_strike - abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
        elif is_iron_condor:
            sorted_strikes = np.sort(strikes)
            if len(sorted_strikes) >= 4:
                upper_be = sorted_strikes[2] - abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
                lower_be = sorted_strikes[1] + abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
            else:
                upper_be = avg_strike + abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
                lower_be = avg_strike - abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
        else:
            upper_be = avg_strike + abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)
            lower_be = avg_strike - abs_premium / (positions[0].get("lots", 1) * positions[0].get("lot_size", 1) if positions else 1)

        self.upper_be = upper_be
        self.lower_be = lower_be

        spot_price = positions[0].get("spot_price", avg_strike) if positions else avg_strike
        distance_upper = upper_be - spot_price
        distance_lower = spot_price - lower_be

        pct_distance_upper = (distance_upper / spot_price * 100) if spot_price > 0 else 0
        pct_distance_lower = (distance_lower / spot_price * 100) if spot_price > 0 else 0

        risk_level = self._classify_risk(pct_distance_upper, pct_distance_lower)

        return {
            "upper_be": round(upper_be, 2),
            "lower_be": round(lower_be, 2),
            "distance_upper": round(distance_upper, 2),
            "distance_lower": round(distance_lower, 2),
            "pct_distance_upper": round(pct_distance_upper, 2),
            "pct_distance_lower": round(pct_distance_lower, 2),
            "risk_level": risk_level
        }

    def _classify_risk(self, upper_pct: float, lower_pct: float) -> str:
        min_distance = min(abs(upper_pct), abs(lower_pct))
        if min_distance < 0.5:
            return "CRITICAL"
        elif min_distance < 1.5:
            return "DANGER"
        elif min_distance < 3.0:
            return "CAUTION"
        else:
            return "SAFE"

    def detect_breaching(self, positions: List[Dict[str, Any]], spot_price: float) -> List[Dict[str, Any]]:
        alerts = []
        be_data = self.calculate_break_even(positions)

        upper_be = be_data["upper_be"]
        lower_be = be_data["lower_be"]

        if spot_price >= upper_be:
            alerts.append({
                "type": "UPPER_BREACH",
                "severity": "CRITICAL",
                "message": f"Spot price {spot_price} has breached upper breakeven {upper_be}",
                "spot_price": spot_price,
                "breakeven": upper_be,
                "distance": round(spot_price - upper_be, 2),
                "timestamp": datetime.utcnow().isoformat()
            })
        elif spot_price >= upper_be * 0.99:
            alerts.append({
                "type": "UPPER_WARNING",
                "severity": "DANGER",
                "message": f"Spot price {spot_price} approaching upper breakeven {upper_be}",
                "spot_price": spot_price,
                "breakeven": upper_be,
                "distance": round(upper_be - spot_price, 2),
                "timestamp": datetime.utcnow().isoformat()
            })

        if spot_price <= lower_be:
            alerts.append({
                "type": "LOWER_BREACH",
                "severity": "CRITICAL",
                "message": f"Spot price {spot_price} has breached lower breakeven {lower_be}",
                "spot_price": spot_price,
                "breakeven": lower_be,
                "distance": round(lower_be - spot_price, 2),
                "timestamp": datetime.utcnow().isoformat()
            })
        elif spot_price <= lower_be * 1.01:
            alerts.append({
                "type": "LOWER_WARNING",
                "severity": "DANGER",
                "message": f"Spot price {spot_price} approaching lower breakeven {lower_be}",
                "spot_price": spot_price,
                "breakeven": lower_be,
                "distance": round(spot_price - lower_be, 2),
                "timestamp": datetime.utcnow().isoformat()
            })

        mid_be = (upper_be + lower_be) / 2
        range_pct = ((upper_be - lower_be) / mid_be * 100) if mid_be > 0 else 0
        if range_pct < 2:
            alerts.append({
                "type": "NARROW_RANGE",
                "severity": "CAUTION",
                "message": f"Breakeven range is narrow: {range_pct:.2f}%",
                "range_pct": round(range_pct, 2),
                "timestamp": datetime.utcnow().isoformat()
            })

        return alerts
