from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    api_key = Column(String(255), default="")
    api_secret = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    positions = relationship("Position", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    adjustments = relationship("AdjustmentHistory", back_populates="user")


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(100), nullable=False)
    side = Column(String(10), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    mark_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, default=0.0)
    delta = Column(Float, default=0.0)
    gamma = Column(Float, default=0.0)
    theta = Column(Float, default=0.0)
    vega = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="positions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")


class AdjustmentHistory(Base):
    __tablename__ = "adjustment_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    adjustment_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="adjustments")
