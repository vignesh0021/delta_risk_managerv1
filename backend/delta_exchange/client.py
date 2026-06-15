import asyncio
import hashlib
import hmac
import time
from typing import Any

import httpx

from backend.config import settings


class DeltaExchangeError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Delta API error {status_code}: {message}")


class RateLimiter:
    def __init__(self, max_requests: int = 10, per_seconds: float = 1.0):
        self.max_requests = max_requests
        self.per_seconds = per_seconds
        self.tokens = max_requests
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(
                self.max_requests, self.tokens + elapsed * (self.max_requests / self.per_seconds)
            )
            self.last_refill = now
            if self.tokens < 1:
                wait = (1 - self.tokens) * (self.per_seconds / self.max_requests)
                await asyncio.sleep(wait)
                self.tokens = 0
            else:
                self.tokens -= 1


class DeltaExchangeClient:
    def __init__(self, api_key: str = "", api_secret: str = ""):
        self.api_key = api_key or settings.DELTA_API_KEY
        self.api_secret = api_secret or settings.DELTA_API_SECRET
        self.base_url = settings.DELTA_REST_URL
        self.client = httpx.AsyncClient(timeout=30.0)
        self.rate_limiter = RateLimiter()

    def _sign(self, method: str, timestamp: str, path: str, body: str = "") -> str:
        message = method + timestamp + path + body
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return signature

    def _headers(self, method: str, path: str, body: str = "") -> dict[str, str]:
        timestamp = str(int(time.time()))
        return {
            "api-key": self.api_key,
            "timestamp": timestamp,
            "signature": self._sign(method, timestamp, path, body),
            "Content-Type": "application/json",
            "User-Agent": "DeltaRiskManager/1.0",
        }

    async def _request(
        self, method: str, path: str, params: dict | None = None, json_data: Any = None
    ) -> Any:
        await self.rate_limiter.acquire()
        import json as json_mod

        body = json_mod.dumps(json_data) if json_data else ""
        url = f"{self.base_url}{path}"
        headers = self._headers(method.upper(), path, body)

        try:
            if method.upper() == "GET":
                resp = await self.client.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                resp = await self.client.post(url, headers=headers, json=json_data)
            elif method.upper() == "DELETE":
                resp = await self.client.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")

            if resp.status_code >= 400:
                try:
                    err = resp.json()
                    msg = err.get("message", resp.text)
                except Exception:
                    msg = resp.text
                raise DeltaExchangeError(resp.status_code, msg)

            return resp.json()
        except httpx.HTTPError as e:
            raise DeltaExchangeError(0, str(e))

    async def get_products(self) -> Any:
        return await self._request("GET", "/v2/products")

    async def get_account(self) -> Any:
        return await self._request("GET", "/v2/wallet/balances")

    async def get_positions(self) -> Any:
        return await self._request("GET", "/v2/positions")

    async def get_orders(self, product_id: int | None = None) -> Any:
        params = {}
        if product_id:
            params["product_id"] = product_id
        return await self._request("GET", "/v2/orders", params=params)

    async def place_order(self, order_data: dict) -> Any:
        return await self._request("POST", "/v2/orders", json_data=order_data)

    async def cancel_order(self, order_id: int, product_id: int) -> Any:
        return await self._request(
            "DELETE",
            "/v2/orders",
            params={"id": order_id, "product_id": product_id},
        )

    async def get_orderbook(self, product_id: int, depth: int = 20) -> Any:
        return await self._request(
            "GET", "/v2/l2orderbook", params={"product_id": product_id, "depth": depth}
        )

    async def close(self):
        await self.client.aclose()
