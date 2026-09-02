"""
services/supabase_client.py
────────────────────────────
Lightweight Supabase client using raw httpx REST calls.
Replaces the full supabase-py package — saves ~150 MB of transitive deps
on the Oracle 1 GB VM.

Usage:
    from services.supabase_client import SupabaseClient
    db = SupabaseClient()
    rows = await db.select("stocks", filters={"sector": "eq.Technology"})
    await db.upsert("stocks", {"symbol": "RELIANCE.NS", "price": 2800})

Phase 2 TODO: Add auth token support for row-level security.
"""

import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def _headers() -> dict:
    return {
        "apikey": _SUPABASE_KEY,
        "Authorization": f"Bearer {_SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


class SupabaseClient:
    """Minimal async Supabase REST client — no websockets, no realtime."""

    def __init__(self) -> None:
        if not _SUPABASE_URL or not _SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
            )
        self.base = f"{_SUPABASE_URL}/rest/v1"

    async def select(
        self,
        table: str,
        filters: dict[str, str] | None = None,
        columns: str = "*",
        limit: int | None = None,
    ) -> list[dict]:
        """SELECT rows. filters: {"column": "eq.value"} (PostgREST syntax)."""
        params: dict[str, Any] = {"select": columns}
        if filters:
            params.update(filters)
        if limit:
            params["limit"] = limit
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{self.base}/{table}", headers=_headers(), params=params
            )
            r.raise_for_status()
            return r.json()

    async def upsert(self, table: str, data: dict | list) -> list[dict]:
        """INSERT or UPDATE (merge by primary key)."""
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{self.base}/{table}",
                headers={
                    **_headers(),
                    "Prefer": "resolution=merge-duplicates,return=representation",
                },
                json=data,
            )
            r.raise_for_status()
            return r.json()

    async def delete(self, table: str, filters: dict[str, str]) -> None:
        """DELETE rows matching PostgREST filters."""
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.delete(
                f"{self.base}/{table}", headers=_headers(), params=filters
            )
            r.raise_for_status()
