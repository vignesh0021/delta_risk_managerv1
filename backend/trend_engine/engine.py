import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class TrendEngine:
    def __init__(self):
        self.direction = "SIDEWAYS"
        self.strength = "WEAK"
        self.momentum = 0
        self.volatility_regime = "NORMAL"

    def analyze_trend(self, price_history: List[float]) -> Dict[str, Any]:
        if len(price_history) < 2:
            return {
                "direction": "SIDEWAYS",
                "strength": "WEAK",
                "momentum": 0,
                "volatility_regime": "NORMAL",
                "trend_score": 0,
                "acceleration": 0
            }

        prices = np.array(price_history, dtype=float)
        returns = np.diff(prices) / prices[:-1]

        if len(returns) == 0:
            return {
                "direction": "SIDEWAYS",
                "strength": "WEAK",
                "momentum": 0,
                "volatility_regime": "NORMAL",
                "trend_score": 0,
                "acceleration": 0
            }

        recent_returns = returns[-5:] if len(returns) >= 5 else returns
        momentum = np.mean(recent_returns) * 100

        if momentum > 0.5:
            direction = "UP"
        elif momentum < -0.5:
            direction = "DOWN"
        else:
            direction = "SIDEWAYS"

        volatility = np.std(returns) * 100 if len(returns) > 1 else 0

        if volatility > 3.0:
            volatility_regime = "HIGH"
        elif volatility > 1.5:
            volatility_regime = "ELEVATED"
        elif volatility < 0.5:
            volatility_regime = "LOW"
        else:
            volatility_regime = "NORMAL"

        trend_score = abs(momentum) / (volatility + 0.001)

        if trend_score > 2.0:
            strength = "EXPLOSIVE"
        elif trend_score > 1.0:
            strength = "STRONG"
        else:
            strength = "WEAK"

        if len(returns) >= 3:
            first_half = np.mean(returns[:len(returns)//2])
            second_half = np.mean(returns[len(returns)//2:])
            acceleration = (second_half - first_half) * 100
        else:
            acceleration = 0

        self.direction = direction
        self.strength = strength
        self.momentum = momentum
        self.volatility_regime = volatility_regime

        return {
            "direction": direction,
            "strength": strength,
            "momentum": round(momentum, 4),
            "volatility_regime": volatility_regime,
            "trend_score": round(trend_score, 4),
            "acceleration": round(acceleration, 4),
            "current_volatility": round(volatility, 4),
            "timestamp": datetime.utcnow().isoformat()
        }

    def detect_breakout(self, prices: List[float], volume: List[float] = None) -> Dict[str, Any]:
        if len(prices) < 10:
            return {
                "breakout_detected": False,
                "direction": "NONE",
                "strength": 0,
                "confirmation": False
            }

        price_arr = np.array(prices[-20:] if len(prices) >= 20 else prices, dtype=float)
        recent_price = price_arr[-1]
        high = np.max(price_arr[:-1])
        low = np.min(price_arr[:-1])
        mid = (high + low) / 2

        upper_break = recent_price > high * 1.005
        lower_break = recent_price < low * 0.995

        price_range = high - low
        range_pct = (price_range / mid * 100) if mid > 0 else 0

        breakout_strength = 0
        direction = "NONE"

        if upper_break:
            direction = "UP"
            breakout_strength = ((recent_price - high) / high * 100) if high > 0 else 0
        elif lower_break:
            direction = "DOWN"
            breakout_strength = ((low - recent_price) / low * 100) if low > 0 else 0

        confirmation = False
        if volume and len(volume) >= len(prices):
            vol_arr = np.array(volume[-20:] if len(volume) >= 20 else volume, dtype=float)
            avg_vol = np.mean(vol_arr[:-1]) if len(vol_arr) > 1 else 1
            recent_vol = vol_arr[-1]
            vol_ratio = recent_vol / avg_vol if avg_vol > 0 else 1

            if vol_ratio > 1.5 and (upper_break or lower_break):
                confirmation = True
                breakout_strength *= vol_ratio

        breakout_detected = upper_break or lower_break

        return {
            "breakout_detected": breakout_detected,
            "direction": direction,
            "strength": round(breakout_strength, 4),
            "confirmation": confirmation,
            "price_range_pct": round(range_pct, 2),
            "timestamp": datetime.utcnow().isoformat()
        }

    def classify_market(self, price_history: List[float]) -> str:
        if len(price_history) < 5:
            return "Insufficient Data"

        trend_data = self.analyze_trend(price_history)
        trend_score = trend_data.get("trend_score", 0)
        volatility_regime = trend_data.get("volatility_regime", "NORMAL")

        if volatility_regime == "HIGH" and trend_score > 2.0:
            return "Explosive Trend"
        elif trend_score > 1.5:
            return "Strong Trend"
        elif trend_score > 0.8:
            return "Weak Trend"
        else:
            return "Range Bound"
