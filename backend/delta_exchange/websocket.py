import asyncio
import json
import logging
import time
from typing import Any, Callable

import websockets
from websockets.exceptions import ConnectionClosed

from backend.config import settings

logger = logging.getLogger(__name__)


class DeltaWebSocket:
    def __init__(
        self,
        api_key: str = "",
        api_secret: str = "",
        on_message: Callable | None = None,
    ):
        self.api_key = api_key or settings.DELTA_API_KEY
        self.api_secret = api_secret or settings.DELTA_API_SECRET
        self.ws_url = settings.DELTA_WS_URL
        self.on_message = on_message
        self._ws = None
        self._running = False
        self._queue: asyncio.Queue = asyncio.Queue()
        self._reconnect_delay = 1.0
        self._max_reconnect_delay = 60.0
        self._subscriptions: list[dict] = []

    def _get_auth_payload(self) -> dict:
        import hashlib
        import hmac

        timestamp = str(int(time.time()))
        signature = hmac.new(
            self.api_secret.encode(),
            (timestamp + "GET" + "/live").encode(),
            hashlib.sha256,
        ).hexdigest()
        return {
            "type": "auth",
            "payload": {
                "api-key": self.api_key,
                "timestamp": timestamp,
                "signature": signature,
            },
        }

    def subscribe(self, channels: list[dict]):
        self._subscriptions = [{"type": "subscribe", "payload": {"channels": channels}}]

    async def connect(self):
        self._running = True
        while self._running:
            try:
                async with websockets.connect(
                    self.ws_url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=5,
                ) as ws:
                    self._ws = ws
                    self._reconnect_delay = 1.0
                    logger.info("Connected to Delta WebSocket")

                    if self.api_key and self.api_secret:
                        await ws.send(json.dumps(self._get_auth_payload()))
                        auth_resp = await asyncio.wait_for(ws.recv(), timeout=10)
                        logger.info(f"Auth response: {auth_resp}")

                    for sub in self._subscriptions:
                        await ws.send(json.dumps(sub))

                    async for message in ws:
                        try:
                            data = json.loads(message)
                            await self._queue.put(data)
                            if self.on_message:
                                result = self.on_message(data)
                                if asyncio.iscoroutine(result):
                                    await result
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON: {message}")

            except ConnectionClosed as e:
                logger.warning(f"WebSocket closed: {e}")
            except Exception as e:
                logger.error(f"WebSocket error: {e}")

            if self._running:
                logger.info(f"Reconnecting in {self._reconnect_delay}s...")
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(
                    self._reconnect_delay * 2, self._max_reconnect_delay
                )

    async def disconnect(self):
        self._running = False
        if self._ws:
            await self._ws.close()
            self._ws = None

    async def send(self, data: dict):
        if self._ws:
            await self._ws.send(json.dumps(data))

    async def get_message(self, timeout: float | None = None) -> Any:
        if timeout:
            return await asyncio.wait_for(self._queue.get(), timeout=timeout)
        return await self._queue.get()

    async def start(self, channels: list[dict]):
        self.subscribe(channels)
        self._task = asyncio.create_task(self.connect())
