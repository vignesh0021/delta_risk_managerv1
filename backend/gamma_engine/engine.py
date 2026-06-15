import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class GammaEngine:
    def __init__(self):
        self.gamma_exposure = 0
        self.is_accelerating = False
        self.gamma_squeeze_risk = False
        self.directional_explosion_risk = False

    def calculate_gamma_exposure(
        self,
        positions: List[Dict[str, Any]],
        spot_price: float,
        spot_move_speed: float = 1.0
    ) -> Dict[str, Any]:
        if not positions:
            return {
                "gamma_exposure": 0,
                "is_accelerating": False,
                "gamma_squeeze_risk": False,
                "directional_explosion_risk": False,
                "gamma_dollar_exposure": 0,
                "gamma_speed_impact": 0
            }

        total_gamma = 0
        for pos in positions:
            lots = pos.get("lots", 1)
            lot_size = pos.get("lot_size", 1)
            gamma = pos.get("gamma", 0)
            multiplier = lots * lot_size

            if pos.get("side") == "sell":
                total_gamma -= gamma * multiplier
            else:
                total_gamma += gamma * multiplier

        gamma_dollar_exposure = abs(total_gamma * spot_price * spot_price * 0.01)
        gamma_speed_impact = gamma_dollar_exposure * spot_move_speed

        is_accelerating = abs(gamma_speed_impact) > gamma_dollar_exposure * 0.5

        gamma_squeeze_risk = False
        directional_explosion_risk = False

        if abs(total_gamma) > 0.01:
            gamma_squeeze_risk = True

        if abs(total_gamma) > 0.02 and abs(spot_move_speed) > 2:
            directional_explosion_risk = True

        if spot_move_speed > 3 and total_gamma < -0.005:
            directional_explosion_risk = True

        self.gamma_exposure = total_gamma
        self.is_accelerating = is_accelerating
        self.gamma_squeeze_risk = gamma_squeeze_risk
        self.directional_explosion_risk = directional_explosion_risk

        return {
            "gamma_exposure": round(total_gamma, 6),
            "is_accelerating": is_accelerating,
            "gamma_squeeze_risk": gamma_squeeze_risk,
            "directional_explosion_risk": directional_explosion_risk,
            "gamma_dollar_exposure": round(gamma_dollar_exposure, 2),
            "gamma_speed_impact": round(gamma_speed_impact, 2)
        }

    def detect_gamma_risk(
        self,
        gamma_exposure: float,
        time_to_expiry_hours: float,
        spot_volatility: float
    ) -> Dict[str, Any]:
        abs_gamma = abs(gamma_exposure)
        alerts = []

        gamma_risk_level = "LOW"
        if abs_gamma > 0.015:
            gamma_risk_level = "HIGH"
            alerts.append({
                "type": "HIGH_GAMMA",
                "severity": "HIGH",
                "message": f"Gamma exposure {gamma_exposure:.6f} exceeds safe threshold",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif abs_gamma > 0.008:
            gamma_risk_level = "MEDIUM"
            alerts.append({
                "type": "ELEVATED_GAMMA",
                "severity": "MEDIUM",
                "message": f"Gamma exposure {gamma_exposure:.6f} is elevated",
                "timestamp": datetime.utcnow().isoformat()
            })

        expiry_risk = "LOW"
        if time_to_expiry_hours < 4:
            expiry_risk = "CRITICAL"
            alerts.append({
                "type": "CRITICAL_EXPIRY",
                "severity": "CRITICAL",
                "message": f"Only {time_to_expiry_hours:.1f} hours to expiry - extreme gamma risk",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif time_to_expiry_hours < 24:
            expiry_risk = "HIGH"
            alerts.append({
                "type": "NEAR_EXPIRY",
                "severity": "HIGH",
                "message": f"{time_to_expiry_hours:.1f} hours to expiry - gamma increasing",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif time_to_expiry_hours < 72:
            expiry_risk = "MEDIUM"

        vol_risk = "LOW"
        if spot_volatility > 3.0:
            vol_risk = "HIGH"
            alerts.append({
                "type": "HIGH_VOLATILITY",
                "severity": "HIGH",
                "message": f"Spot volatility {spot_volatility:.2f}% is elevated",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif spot_volatility > 2.0:
            vol_risk = "MEDIUM"

        overall_risk = "LOW"
        risk_factors = 0
        if gamma_risk_level == "HIGH":
            risk_factors += 3
        elif gamma_risk_level == "MEDIUM":
            risk_factors += 1

        if expiry_risk == "CRITICAL":
            risk_factors += 4
        elif expiry_risk == "HIGH":
            risk_factors += 2
        elif expiry_risk == "MEDIUM":
            risk_factors += 1

        if vol_risk == "HIGH":
            risk_factors += 2
        elif vol_risk == "MEDIUM":
            risk_factors += 1

        if risk_factors >= 6:
            overall_risk = "CRITICAL"
        elif risk_factors >= 4:
            overall_risk = "HIGH"
        elif risk_factors >= 2:
            overall_risk = "MEDIUM"
        else:
            overall_risk = "LOW"

        return {
            "overall_risk": overall_risk,
            "gamma_risk_level": gamma_risk_level,
            "expiry_risk": expiry_risk,
            "volatility_risk": vol_risk,
            "risk_factors": risk_factors,
            "alerts": alerts,
            "timestamp": datetime.utcnow().isoformat()
        }

    def monitor_near_expiry(
        self,
        positions: List[Dict[str, Any]],
        hours_to_expiry: float
    ) -> List[Dict[str, Any]]:
        alerts = []

        if hours_to_expiry < 2:
            alerts.append({
                "type": "EXTREME_EXPIRY_RISK",
                "severity": "CRITICAL",
                "message": "EXTREME: Position expires in < 2 hours. Gamma explosion imminent.",
                "action": "CONSIDER IMMEDIATE EXIT OR HEDGE",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif hours_to_expiry < 4:
            alerts.append({
                "type": "HIGH_EXPIRY_RISK",
                "severity": "CRITICAL",
                "message": "HIGH RISK: Position expires in < 4 hours.",
                "action": "ACTIVE MONITORING REQUIRED",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif hours_to_expiry < 8:
            alerts.append({
                "type": "ELEVATED_EXPIRY_RISK",
                "severity": "HIGH",
                "message": "ELEVATED: Position expires in < 8 hours.",
                "action": "PREPARE FOR POTENTIAL ADJUSTMENT",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif hours_to_expiry < 24:
            alerts.append({
                "type": "APPROACHING_EXPIRY",
                "severity": "MEDIUM",
                "message": "Position expires within 24 hours.",
                "action": "MONITOR GAMMA LEVELS",
                "timestamp": datetime.utcnow().isoformat()
            })

        total_gamma = sum(
            abs(p.get("gamma", 0) * p.get("lots", 1) * p.get("lot_size", 1))
            for p in positions
        )

        if total_gamma > 0.01 and hours_to_expiry < 24:
            alerts.append({
                "type": "GAMMA_EXPIRY_COMPOUND",
                "severity": "HIGH",
                "message": f"High gamma ({total_gamma:.4f}) combined with near expiry.",
                "action": "REDUCE POSITION SIZE OR HEDGE",
                "timestamp": datetime.utcnow().isoformat()
            })

        return alerts
