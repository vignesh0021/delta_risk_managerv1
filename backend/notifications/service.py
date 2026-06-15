import logging
from typing import Any

import firebase_admin
from firebase_admin import credentials, messaging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.db import async_session
from backend.database.models import Alert, User

logger = logging.getLogger(__name__)

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
    except Exception:
        logger.warning("Firebase credentials not configured. Push notifications disabled.")
        _firebase_initialized = False


class NotificationService:
    def __init__(self, db: AsyncSession | None = None):
        self._db = db
        _init_firebase()

    async def _get_db(self) -> AsyncSession:
        if self._db:
            return self._db
        return async_session()

    async def _get_fcm_tokens(self, user_id: int) -> list[str]:
        db = await self._get_db()
        result = await db.execute(
            select(User.api_key).where(User.id == user_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            return []
        return [row] if row else []

    async def _save_alert(
        self, user_id: int, alert_type: str, message: str, severity: str = "info"
    ) -> None:
        try:
            db = await self._get_db()
            alert = Alert(
                user_id=user_id,
                alert_type=alert_type,
                message=message,
                severity=severity,
            )
            db.add(alert)
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to save alert for user {user_id}: {e}")

    async def send_push_notification(
        self, user_id: int, title: str, body: str, data: dict[str, Any] | None = None
    ) -> bool:
        if not _firebase_initialized:
            logger.warning("Firebase not initialized. Skipping push notification.")
            return False

        tokens = await self._get_fcm_tokens(user_id)
        if not tokens:
            return False

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=tokens,
        )

        try:
            response = messaging.send_each_for_multicast(message)
            failed_tokens = [
                tokens[i]
                for i, resp in enumerate(response.responses)
                if not resp.success
            ]
            if failed_tokens:
                logger.warning(f"Failed FCM tokens for user {user_id}: {failed_tokens}")
            return response.success_count > 0
        except Exception as e:
            logger.error(f"Push notification failed for user {user_id}: {e}")
            return False

    async def send_emergency_alert(
        self, user_id: int, message: str, action_required: str
    ) -> dict[str, Any]:
        title = "EMERGENCY: Immediate Action Required"
        body = f"{message}\n\nAction: {action_required}"

        await self._save_alert(user_id, "emergency", body, "critical")
        await self.send_push_notification(user_id, title, body, {
            "severity": "critical",
            "action_required": action_required,
        })

        return {
            "status": "sent",
            "type": "emergency",
            "message": message,
            "action_required": action_required,
        }

    async def send_adjustment_alert(
        self, user_id: int, adjustment_details: dict[str, Any]
    ) -> dict[str, Any]:
        title = "Position Adjustment Recommended"
        adjustment_type = adjustment_details.get("type", "unknown")
        reason = adjustment_details.get("reason", "Risk threshold exceeded")
        body = f"Adjustment: {adjustment_type}\nReason: {reason}"

        await self._save_alert(user_id, "adjustment", body, "warning")
        await self.send_push_notification(user_id, title, body, {
            "adjustment_type": adjustment_type,
            "reason": reason,
        })

        return {
            "status": "sent",
            "type": "adjustment",
            "details": adjustment_details,
        }

    async def send_breakeven_alert(
        self, user_id: int, breach_info: dict[str, Any]
    ) -> dict[str, Any]:
        breach_type = breach_info.get("type", "unknown")
        spot = breach_info.get("spot_price", 0)
        breakeven = breach_info.get("breakeven", 0)
        severity = breach_info.get("severity", "warning")

        title = f"Breakeven {breach_type} Alert"
        body = (
            f"Spot: {spot} | Breakeven: {breakeven}\n"
            f"Severity: {severity}"
        )

        alert_severity = "critical" if severity == "CRITICAL" else "warning"
        await self._save_alert(user_id, "breakeven", body, alert_severity)
        await self.send_push_notification(user_id, title, body, {
            "breach_type": breach_type,
            "spot": str(spot),
            "breakeven": str(breakeven),
            "severity": severity,
        })

        return {
            "status": "sent",
            "type": "breakeven",
            "breach_info": breach_info,
        }

    async def send_gamma_alert(
        self, user_id: int, gamma_info: dict[str, Any]
    ) -> dict[str, Any]:
        gamma_value = gamma_info.get("gamma", 0)
        risk_level = gamma_info.get("risk_level", "SAFE")
        exposure = gamma_info.get("gamma_exposure", 0)

        title = f"Gamma Risk Alert - {risk_level}"
        body = (
            f"Portfolio Gamma: {gamma_value}\n"
            f"Gamma Exposure: {exposure}\n"
            f"Risk Level: {risk_level}"
        )

        alert_severity = "critical" if risk_level in ("CRITICAL", "HIGH") else "warning"
        await self._save_alert(user_id, "gamma", body, alert_severity)
        await self.send_push_notification(user_id, title, body, {
            "gamma": str(gamma_value),
            "gamma_exposure": str(exposure),
            "risk_level": risk_level,
        })

        return {
            "status": "sent",
            "type": "gamma",
            "gamma_info": gamma_info,
        }
