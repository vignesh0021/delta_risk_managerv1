import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class GreeksEngine:
    def __init__(self):
        self.net_delta = 0
        self.net_gamma = 0
        self.net_theta = 0
        self.net_vega = 0

    def calculate_net_greeks(self, positions: List[Dict[str, Any]]) -> Dict[str, float]:
        if not positions:
            return {
                "net_delta": 0,
                "net_gamma": 0,
                "net_theta": 0,
                "net_vega": 0
            }

        net_delta = 0
        net_gamma = 0
        net_theta = 0
        net_vega = 0

        for pos in positions:
            lots = pos.get("lots", 1)
            lot_size = pos.get("lot_size", 1)
            multiplier = lots * lot_size

            if pos.get("side") == "buy":
                net_delta += pos.get("delta", 0) * multiplier
                net_gamma += pos.get("gamma", 0) * multiplier
                net_theta += pos.get("theta", 0) * multiplier
                net_vega += pos.get("vega", 0) * multiplier
            else:
                net_delta -= pos.get("delta", 0) * multiplier
                net_gamma -= pos.get("gamma", 0) * multiplier
                net_theta -= pos.get("theta", 0) * multiplier
                net_vega -= pos.get("vega", 0) * multiplier

        self.net_delta = net_delta
        self.net_gamma = net_gamma
        self.net_theta = net_theta
        self.net_vega = net_vega

        return {
            "net_delta": round(net_delta, 4),
            "net_gamma": round(net_gamma, 6),
            "net_theta": round(net_theta, 4),
            "net_vega": round(net_vega, 4)
        }

    def classify_delta(self, delta: float) -> str:
        abs_delta = abs(delta)
        if abs_delta < 0.05:
            return "Delta Neutral"
        elif delta > 0:
            if abs_delta < 0.20:
                return "Mild Bullish"
            else:
                return "Bullish"
        else:
            if abs_delta < 0.20:
                return "Mild Bearish"
            else:
                return "Bearish"

    def classify_gamma(self, gamma: float) -> str:
        abs_gamma = abs(gamma)
        if abs_gamma < 0.001:
            return "Low"
        elif abs_gamma < 0.005:
            return "Medium"
        elif abs_gamma < 0.015:
            return "High"
        else:
            return "Extreme"

    def assess_greeks_risk(self, greeks_dict: Dict[str, float], spot_price: float) -> Dict[str, Any]:
        net_delta = greeks_dict.get("net_delta", 0)
        net_gamma = greeks_dict.get("net_gamma", 0)
        net_theta = greeks_dict.get("net_theta", 0)
        net_vega = greeks_dict.get("net_vega", 0)

        delta_exposure = abs(net_delta * spot_price)
        gamma_exposure = abs(net_gamma * spot_price * spot_price * 0.01)
        theta_decay = abs(net_theta)
        vega_exposure = abs(net_vega * 0.01 * spot_price)

        risk_score = 0
        recommendations = []

        if delta_exposure > spot_price * 0.10:
            risk_score += 30
            recommendations.append("HIGH DELTA RISK: Consider delta hedging or closing directional exposure")
        elif delta_exposure > spot_price * 0.05:
            risk_score += 15
            recommendations.append("MODERATE DELTA: Monitor for directional moves")

        if gamma_exposure > spot_price * 0.02:
            risk_score += 35
            recommendations.append("HIGH GAMMA RISK: Position vulnerable to large moves, consider reducing gamma")
        elif gamma_exposure > spot_price * 0.01:
            risk_score += 20
            recommendations.append("ELEVATED GAMMA: Watch for volatility spikes")

        if theta_decay > spot_price * 0.005:
            risk_score += 10
            recommendations.append("GOOD THETA: Time decay working in favor")
        elif theta_decay < -spot_price * 0.005:
            risk_score += 25
            recommendations.append("NEGATIVE THETA: Time is working against position")

        if vega_exposure > spot_price * 0.01:
            risk_score += 20
            recommendations.append("HIGH VEGA: Significant volatility exposure, consider vega hedge")

        risk_level = "LOW"
        if risk_score > 70:
            risk_level = "CRITICAL"
        elif risk_score > 50:
            risk_level = "HIGH"
        elif risk_score > 30:
            risk_level = "MEDIUM"
        elif risk_score > 15:
            risk_level = "ELEVATED"

        if not recommendations:
            recommendations.append("Position Greeks within acceptable limits")

        return {
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "delta_exposure": round(delta_exposure, 2),
            "gamma_exposure": round(gamma_exposure, 2),
            "theta_decay": round(theta_decay, 2),
            "vega_exposure": round(vega_exposure, 2),
            "delta_classification": self.classify_delta(net_delta),
            "gamma_classification": self.classify_gamma(net_gamma),
            "recommendations": recommendations,
            "timestamp": datetime.utcnow().isoformat()
        }
