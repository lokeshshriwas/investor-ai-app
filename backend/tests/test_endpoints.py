"""
tests/test_endpoints.py
-----------------------
Integration tests for all 3 FastAPI endpoints using TestClient.

Groq API calls are mocked by default (pytest.mark.unit).
Tests tagged @pytest.mark.live skip unless --live flag is passed or
GROQ_API_KEY env var is set to a real key (for manual verification).

Run all unit tests (no API quota burned):
    pytest tests/test_endpoints.py -v

Run live tests manually:
    pytest tests/test_endpoints.py -v -m live
"""

import json
import pytest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_pros_cons():
    """Return a valid pros/cons structure for mocking generate_pros_cons."""
    return {
        "pros": ["Good company", "Low debt", "Growing revenue"],
        "cons": ["High P/E", "Competition risk", "Regulatory exposure"],
    }


def _mock_chat_reply():
    return "That's a great question about investing! Here's my perspective..."


# ---------------------------------------------------------------------------
# GET /api/v1/screen/{investor_key}
# ---------------------------------------------------------------------------

class TestScreenEndpoint:

    def test_all_valid_keys_return_200(self):
        all_keys = [
            "buffett", "lynch", "graham", "munger", "dalio",
            "fisher", "templeton", "marks", "greenblatt", "klarman",
            "pabrai", "cundill", "terrysmith", "jhunjhunwala", "damani",
        ]
        for key in all_keys:
            resp = client.get(f"/api/v1/screen/{key}")
            assert resp.status_code == 200, f"Expected 200 for key='{key}', got {resp.status_code}"

    def test_response_structure(self):
        resp = client.get("/api/v1/screen/buffett")
        assert resp.status_code == 200
        data = resp.json()
        assert "investor" in data
        assert "count" in data
        assert "stocks" in data
        assert isinstance(data["stocks"], list)

    def test_stocks_have_score(self):
        resp = client.get("/api/v1/screen/buffett")
        data = resp.json()
        for stock in data["stocks"]:
            assert "score" in stock
            assert isinstance(stock["score"], (int, float))
            assert 0 <= stock["score"] <= 100

    def test_stocks_sorted_descending(self):
        resp = client.get("/api/v1/screen/dalio")
        data = resp.json()
        scores = [s["score"] for s in data["stocks"]]
        assert scores == sorted(scores, reverse=True)

    def test_count_matches_stocks_length(self):
        resp = client.get("/api/v1/screen/munger")
        data = resp.json()
        assert data["count"] == len(data["stocks"])

    def test_top_n_query_param(self):
        resp = client.get("/api/v1/screen/buffett?top_n=3")
        data = resp.json()
        assert len(data["stocks"]) <= 3

    def test_invalid_investor_key_returns_400(self):
        resp = client.get("/api/v1/screen/soros")
        assert resp.status_code == 400

    def test_invalid_key_returns_4xx_not_500(self):
        resp = client.get("/api/v1/screen/INVALID_KEY_THAT_SHOULD_ERROR")
        assert resp.status_code in (400, 404, 422)

    def test_investor_field_in_response(self):
        resp = client.get("/api/v1/screen/lynch")
        data = resp.json()
        assert data["investor"] == "lynch"

    def test_case_sensitivity(self):
        """Investor keys are case-sensitive; BUFFETT should return 400."""
        resp = client.get("/api/v1/screen/BUFFETT")
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/v1/stock/{symbol}
# ---------------------------------------------------------------------------

class TestStockEndpoint:

    @patch("routers.stocks.generate_pros_cons")
    def test_known_ticker_returns_200(self, mock_pros_cons):
        mock_pros_cons.return_value = _mock_pros_cons()
        resp = client.get("/api/v1/stock/RELIANCE.NS")
        assert resp.status_code == 200

    @patch("routers.stocks.generate_pros_cons")
    def test_response_has_pros_cons(self, mock_pros_cons):
        mock_pros_cons.return_value = _mock_pros_cons()
        resp = client.get("/api/v1/stock/TCS.NS")
        assert resp.status_code == 200
        data = resp.json()
        assert "pros_cons" in data
        assert "pros" in data["pros_cons"]
        assert "cons" in data["pros_cons"]
        assert isinstance(data["pros_cons"]["pros"], list)
        assert isinstance(data["pros_cons"]["cons"], list)

    @patch("routers.stocks.generate_pros_cons")
    def test_response_has_stock_fields(self, mock_pros_cons):
        mock_pros_cons.return_value = _mock_pros_cons()
        resp = client.get("/api/v1/stock/ITC.NS")
        assert resp.status_code == 200
        data = resp.json()
        assert "symbol" in data
        assert "name" in data

    @patch("routers.stocks.generate_pros_cons")
    def test_symbol_without_ns_suffix_resolves(self, mock_pros_cons):
        """RELIANCE (without .NS) should resolve to RELIANCE.NS cache file."""
        mock_pros_cons.return_value = _mock_pros_cons()
        resp = client.get("/api/v1/stock/RELIANCE")
        assert resp.status_code == 200

    def test_unknown_ticker_returns_404(self):
        resp = client.get("/api/v1/stock/FAKESTOCK999")
        assert resp.status_code == 404

    def test_unknown_ticker_does_not_return_500(self):
        resp = client.get("/api/v1/stock/DOESNOTEXIST")
        assert resp.status_code != 500

    @patch("routers.stocks.generate_pros_cons")
    def test_pros_cons_api_failure_does_not_500(self, mock_pros_cons):
        """
        If generate_pros_cons returns the fallback (due to API error),
        the endpoint should still return 200 with a valid response body.
        """
        from services.llm import _PROS_CONS_FALLBACK
        mock_pros_cons.return_value = _PROS_CONS_FALLBACK
        resp = client.get("/api/v1/stock/HDFCBANK.NS")
        assert resp.status_code == 200
        data = resp.json()
        assert "pros_cons" in data


# ---------------------------------------------------------------------------
# POST /api/v1/chat/{investor_key}
# ---------------------------------------------------------------------------

class TestChatEndpoint:

    SIMPLE_CONVERSATION = [
        {"role": "user", "content": "What is a P/E ratio?"}
    ]

    @patch("routers.chat.chat_with_investor")
    def test_valid_investor_returns_200(self, mock_chat):
        mock_chat.return_value = _mock_chat_reply()
        all_keys = [
            "buffett", "lynch", "graham", "munger", "dalio",
            "fisher", "templeton", "marks", "greenblatt", "klarman",
            "pabrai", "cundill", "terrysmith", "jhunjhunwala", "damani",
        ]
        for key in all_keys:
            resp = client.post(
                f"/api/v1/chat/{key}",
                json={"conversation": self.SIMPLE_CONVERSATION},
            )
            assert resp.status_code == 200, f"Expected 200 for key='{key}'"

    @patch("routers.chat.chat_with_investor")
    def test_reply_is_non_empty_string(self, mock_chat):
        mock_chat.return_value = _mock_chat_reply()
        resp = client.post(
            "/api/v1/chat/buffett",
            json={"conversation": self.SIMPLE_CONVERSATION},
        )
        data = resp.json()
        assert "reply" in data
        assert isinstance(data["reply"], str)
        assert len(data["reply"]) > 0

    @patch("routers.chat.chat_with_investor")
    def test_investor_field_in_response(self, mock_chat):
        mock_chat.return_value = _mock_chat_reply()
        resp = client.post(
            "/api/v1/chat/munger",
            json={"conversation": self.SIMPLE_CONVERSATION},
        )
        assert resp.json()["investor"] == "munger"

    @patch("routers.chat.chat_with_investor")
    def test_with_stock_context(self, mock_chat):
        mock_chat.return_value = _mock_chat_reply()
        resp = client.post(
            "/api/v1/chat/dalio",
            json={
                "conversation": self.SIMPLE_CONVERSATION,
                "stock_context": "RELIANCE.NS: P/E=28, ROE=12%",
            },
        )
        assert resp.status_code == 200

    def test_invalid_investor_key_returns_400(self):
        resp = client.post(
            "/api/v1/chat/soros",
            json={"conversation": self.SIMPLE_CONVERSATION},
        )
        assert resp.status_code == 400

    def test_empty_conversation_returns_422(self):
        resp = client.post(
            "/api/v1/chat/buffett",
            json={"conversation": []},
        )
        assert resp.status_code == 422

    def test_missing_conversation_field_returns_422(self):
        resp = client.post("/api/v1/chat/buffett", json={})
        assert resp.status_code == 422

    @patch("routers.chat.chat_with_investor", side_effect=Exception("Groq API error"))
    def test_api_failure_returns_502_not_500(self, mock_chat):
        """If the LLM call raises, we should get 502, not an unhandled 500."""
        resp = client.post(
            "/api/v1/chat/buffett",
            json={"conversation": self.SIMPLE_CONVERSATION},
        )
        assert resp.status_code == 502

    @patch("routers.chat.chat_with_investor")
    def test_multi_turn_conversation(self, mock_chat):
        """Multi-turn conversation should be accepted without error."""
        mock_chat.return_value = _mock_chat_reply()
        resp = client.post(
            "/api/v1/chat/graham",
            json={
                "conversation": [
                    {"role": "user", "content": "What is P/E?"},
                    {"role": "assistant", "content": "P/E is price to earnings."},
                    {"role": "user", "content": "What about PEG?"},
                ]
            },
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Misc / health
# ---------------------------------------------------------------------------

class TestHealthAndMeta:
    def test_health_returns_200(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_investors_list(self):
        resp = client.get("/api/v1/investors")
        assert resp.status_code == 200
        data = resp.json()
        assert "investors" in data
        expected = {
            "buffett", "lynch", "graham", "munger", "dalio",
            "fisher", "templeton", "marks", "greenblatt", "klarman",
            "pabrai", "cundill", "terrysmith", "jhunjhunwala", "damani",
        }
        assert set(data["investors"]) == expected

    def test_investors_list_count(self):
        resp = client.get("/api/v1/investors")
        data = resp.json()
        assert len(data["investors"]) == 15


# ---------------------------------------------------------------------------
# Live tests (marked -- only run with: pytest -m live)
# ---------------------------------------------------------------------------

@pytest.mark.live
class TestLiveGroq:
    """
    These tests make REAL calls to the Groq API.
    Run manually with: pytest tests/test_endpoints.py -v -m live

    They will fail if GROQ_API_KEY is invalid or missing.
    """

    def test_live_chat_buffett(self):
        resp = client.post(
            "/api/v1/chat/buffett",
            json={"conversation": [{"role": "user", "content": "What is intrinsic value?"}]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["reply"]) > 50  # non-trivial response

    def test_live_chat_lynch(self):
        resp = client.post(
            "/api/v1/chat/lynch",
            json={"conversation": [{"role": "user", "content": "What is PEG ratio?"}]},
        )
        assert resp.status_code == 200
        assert len(resp.json()["reply"]) > 50

    def test_live_pros_cons_reliance(self):
        resp = client.get("/api/v1/stock/RELIANCE.NS")
        assert resp.status_code == 200
        data = resp.json()
        pros = data["pros_cons"]["pros"]
        cons = data["pros_cons"]["cons"]
        # Live call should return real (non-fallback) content
        assert not pros[0].startswith("Insufficient data")
        assert len(pros) == 3
        assert len(cons) == 3
