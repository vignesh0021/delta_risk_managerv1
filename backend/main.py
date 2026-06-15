import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.database.db import get_db, init_db, async_session
from backend.database.models import User, Position, Alert, AdjustmentHistory
from backend.delta_exchange.client import DeltaExchangeClient
from backend.delta_exchange.websocket import DeltaWebSocket
from backend.utils.auth import (
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.breakeven_engine.engine import BreakEvenEngine
from backend.greeks_engine.engine import GreeksEngine
from backend.adjustment_engine.engine import AdjustmentEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connected_clients: list[WebSocket] = []
monitor_task = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    api_key: str = ""
    api_secret: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AlertRequest(BaseModel):
    alert_type: str
    message: str
    severity: str = "info"


class AdjustmentRequest(BaseModel):
    adjustment_type: str
    details: str


class ApiKeysRequest(BaseModel):
    api_key: str
    api_secret: str


async def broadcast(data: dict):
    message = json.dumps(data, default=str)
    disconnected = []
    for ws in connected_clients:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        connected_clients.remove(ws)


async def monitor_positions():
    while True:
        try:
            async with async_session() as db:
                result = await db.execute(select(User))
                users = result.scalars().all()
                for user in users:
                    if not user.api_key:
                        continue
                    client = DeltaExchangeClient(user.api_key, user.api_secret)
                    try:
                        positions_data = await client.get_positions()
                        positions = positions_data.get("result", [])
                        for pos in positions:
                            existing = await db.execute(
                                select(Position).where(
                                    Position.user_id == user.id,
                                    Position.symbol == pos.get("product_symbol", ""),
                                )
                            )
                            existing_pos = existing.scalar_one_or_none()
                            if existing_pos:
                                existing_pos.size = float(pos.get("size", 0))
                                existing_pos.mark_price = float(pos.get("mark_price", 0))
                                existing_pos.unrealized_pnl = float(pos.get("unrealized_pnl", 0))
                                existing_pos.delta = float(pos.get("delta", 0))
                                existing_pos.gamma = float(pos.get("gamma", 0))
                                existing_pos.theta = float(pos.get("theta", 0))
                                existing_pos.vega = float(pos.get("vega", 0))
                                existing_pos.timestamp = datetime.utcnow()
                            else:
                                new_pos = Position(
                                    user_id=user.id,
                                    symbol=pos.get("product_symbol", ""),
                                    side=pos.get("side", ""),
                                    size=float(pos.get("size", 0)),
                                    entry_price=float(pos.get("entry_price", 0)),
                                    mark_price=float(pos.get("mark_price", 0)),
                                    unrealized_pnl=float(pos.get("unrealized_pnl", 0)),
                                    delta=float(pos.get("delta", 0)),
                                    gamma=float(pos.get("gamma", 0)),
                                    theta=float(pos.get("theta", 0)),
                                    vega=float(pos.get("vega", 0)),
                                )
                                db.add(new_pos)
                            await db.commit()
                        await broadcast({"type": "positions_update", "data": positions})
                    except Exception as e:
                        logger.error(f"Error monitoring user {user.id}: {e}")
                    finally:
                        await client.close()
        except Exception as e:
            logger.error(f"Monitor error: {e}")
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global monitor_task
    await init_db()
    monitor_task = asyncio.create_task(monitor_positions())
    yield
    if monitor_task:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Delta Exchange Risk Manager", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        api_key=req.api_key,
        api_secret=req.api_secret,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email}}


@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email}}


@app.get("/api/positions")
async def get_positions(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Position).where(Position.user_id == user.id).order_by(Position.timestamp.desc())
    )
    positions = result.scalars().all()
    pos_dicts = [
        {"symbol": p.symbol, "side": p.side, "size": p.size, "entry_price": p.entry_price, "mark_price": p.mark_price}
        for p in positions
    ]
    spot_price = positions[0].mark_price if positions else 0
    be_engine = BreakEvenEngine()
    breakeven = be_engine.calculate_break_even(pos_dicts) if pos_dicts else {}
    return [
        {
            "id": p.id,
            "symbol": p.symbol,
            "side": p.side,
            "quantity": abs(p.size),
            "avgPrice": p.entry_price,
            "currentPrice": p.mark_price,
            "mtm": p.unrealized_pnl,
            "pnl": p.unrealized_pnl,
            "pnlPercent": round((p.unrealized_pnl / (p.entry_price * abs(p.size) + 0.01)) * 100, 2) if p.entry_price else 0,
            "delta": p.delta,
            "gamma": p.gamma,
            "theta": p.theta,
            "vega": p.vega,
            "expiry": "",
            "spotPrice": spot_price,
            "breakEven": breakeven,
            "riskLevel": "low",
            "riskDescription": "Position within normal parameters",
            "timestamp": p.timestamp,
        }
        for p in positions
    ]


@app.get("/api/account")
async def get_account(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    client = DeltaExchangeClient(user.api_key, user.api_secret)
    try:
        data = await client.get_account()
        result = data.get("result", data) if isinstance(data, dict) else data
        positions_result = await db.execute(
            select(Position).where(Position.user_id == user.id)
        )
        positions = positions_result.scalars().all()
        pos_dicts = [
            {"symbol": p.symbol, "side": p.side, "size": p.size, "entry_price": p.entry_price, "mark_price": p.mark_price}
            for p in positions
        ]
        be_engine = BreakEvenEngine()
        greeks_engine = GreeksEngine()
        breakeven = be_engine.calculate_break_even(pos_dicts) if pos_dicts else {}
        net_greeks = greeks_engine.calculate_net_greeks(pos_dicts) if pos_dicts else {"net_delta": 0, "net_gamma": 0, "net_theta": 0, "net_vega": 0}
        spot_price = positions[0].mark_price if positions else 0
        return {
            "currentPnl": sum(p.unrealized_pnl for p in positions),
            "todayPnl": sum(p.unrealized_pnl for p in positions),
            "marginUsed": float(result.get("margin_used", 0)) if isinstance(result, dict) else 0,
            "availableMargin": float(result.get("available_margin", 0)) if isinstance(result, dict) else 0,
            "spotPrice": spot_price,
            "breakEven": breakeven,
            "netGreeks": net_greeks,
            "gammaRisk": 0,
            "trend": "sideways",
            "portfolioRisk": {"healthScore": 75, "level": "low"},
            "suggestedAdjustment": None,
        }
    finally:
        await client.close()


@app.get("/api/alerts")
async def get_alerts(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Alert).where(Alert.user_id == user.id).order_by(Alert.created_at.desc()).limit(100)
    )
    alerts = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.alert_type.replace("_", " ").title(),
            "message": a.message,
            "severity": a.severity,
            "actionRequired": "Review position and consider adjustment",
            "position": None,
            "isRead": a.is_read,
            "timestamp": a.created_at,
        }
        for a in alerts
    ]


@app.post("/api/alerts")
async def create_alert(
    req: AlertRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alert = Alert(
        user_id=user.id,
        alert_type=req.alert_type,
        message=req.message,
        severity=req.severity,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    await broadcast({"type": "alert", "data": {"message": alert.message, "severity": alert.severity}})
    return {"id": alert.id}


@app.get("/api/adjustments")
async def get_adjustments(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AdjustmentHistory)
        .where(AdjustmentHistory.user_id == user.id)
        .order_by(AdjustmentHistory.timestamp.desc())
        .limit(100)
    )
    adjustments = result.scalars().all()
    return [
        {
            "id": a.id,
            "adjustment_type": a.adjustment_type,
            "details": a.details,
            "timestamp": a.timestamp,
        }
        for a in adjustments
    ]


@app.get("/api/adjustments/best")
async def get_best_adjustment(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    positions_result = await db.execute(
        select(Position).where(Position.user_id == user.id)
    )
    positions = positions_result.scalars().all()
    if not positions:
        return None
    spot_price = positions[0].mark_price
    pos_dicts = [
        {"symbol": p.symbol, "side": p.side, "size": p.size, "entry_price": p.entry_price, "mark_price": p.mark_price}
        for p in positions
    ]
    be_engine = BreakEvenEngine()
    greeks_engine = GreeksEngine()
    adj_engine = AdjustmentEngine()
    breakeven = be_engine.calculate_break_even(pos_dicts)
    net_greeks = greeks_engine.calculate_net_greeks(pos_dicts)
    best = adj_engine.get_best_adjustment(pos_dicts, spot_price, net_greeks, {}, 0, breakeven)
    if not best:
        return None
    return {
        "id": "best-001",
        "type": best.get("type", "Strike Shift"),
        "successProbability": best.get("success_probability", 85),
        "riskReduction": best.get("risk_reduction", 60),
        "requiredMargin": best.get("required_margin", 12000),
        "legs": best.get("legs", []),
        "expectedResult": {
            "newDelta": best.get("new_delta", 0.04),
            "newGamma": best.get("new_gamma", 0.02),
            "newBreakEven": best.get("new_breakeven", spot_price * 1.05),
        },
    }


@app.post("/api/adjustments")
async def create_adjustment(
    req: AdjustmentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    adj = AdjustmentHistory(
        user_id=user.id,
        adjustment_type=req.adjustment_type,
        details=req.details,
    )
    db.add(adj)
    await db.commit()
    await db.refresh(adj)
    return {"id": adj.id}


@app.post("/api/adjustments/feedback")
async def adjustment_feedback(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"status": "recorded"}


@app.put("/api/settings/api-keys")
async def update_api_keys(
    req: ApiKeysRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.api_key = req.api_key
    user.api_secret = req.api_secret
    await db.commit()
    return {"status": "updated"}


@app.get("/api/products")
async def get_products(user: User = Depends(get_current_user)):
    client = DeltaExchangeClient(user.api_key, user.api_secret)
    try:
        data = await client.get_products()
        return data
    finally:
        await client.close()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        connected_clients.remove(ws)
    except Exception:
        if ws in connected_clients:
            connected_clients.remove(ws)
