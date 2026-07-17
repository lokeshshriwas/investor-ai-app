"""
llm.py
------
LLM integration using the Groq API.

Functions:
    chat_with_investor(investor_key, conversation, stock_context="")
        -> reply text from the requested investor persona

    generate_pros_cons(stock)
        -> {"pros": [...], "cons": [...]} or a fallback dict on JSON parse failure

Model: moonshotai/kimi-k2-instruct is checked first; falls back to
llama-3.3-70b-versatile if not available.  The active model slug is
resolved once at import time against the live Groq /models endpoint.
"""

from __future__ import annotations

import json
import os
import re
from typing import Optional

from dotenv import load_dotenv
from groq import Groq

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# -- Groq client --------------------------------------------------------------

_GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
_client: Optional[Groq] = None

# Ordered preference list -- first model that exists on the account wins
_PREFERRED_MODELS = [
    "moonshotai/kimi-k2-instruct",
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]

_ACTIVE_MODEL: str = "llama-3.3-70b-versatile"  # safe default


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=_GROQ_API_KEY)
    return _client


def _resolve_model() -> str:
    """Try to pick the best available model from the preference list."""
    global _ACTIVE_MODEL
    try:
        client = _get_client()
        available = {m.id for m in client.models.list().data}
        for model in _PREFERRED_MODELS:
            if model in available:
                _ACTIVE_MODEL = model
                return model
    except Exception:
        pass  # If listing fails, use the default
    return _ACTIVE_MODEL


# Resolve once at module import (silently if key is wrong — caller will get
# a clean error when they actually make a chat call)
try:
    _resolve_model()
except Exception:
    pass

# -- Investor prompt registry -------------------------------------------------

from prompts.investor_prompts import get_system_prompt  # noqa: E402


# -- Public: chat_with_investor -----------------------------------------------

def chat_with_investor(
    investor_key: str,
    conversation: list[dict],
    stock_context: str = "",
) -> str:
    """
    Send a conversation to the investor persona and return the reply text.

    Parameters
    ----------
    investor_key  : one of 'buffett' | 'lynch' | 'graham' | 'munger' | 'dalio'
    conversation  : list of {"role": "user"|"assistant", "content": "..."}
    stock_context : optional extra context about a specific stock; folded into
                    the system prompt (avoids the multiple-system-message bug
                    where some models ignore or error on a second system turn)

    Returns
    -------
    str -- the model's reply text

    BUG FIX (v2): stock_context is now appended to the SINGLE system message
    rather than sent as a second system-role message, which some Groq models
    silently discard or reject.
    """
    system_prompt = get_system_prompt(investor_key)

    # BUG FIX: merge stock_context into the single system message
    if stock_context:
        system_prompt = (
            system_prompt
            + "\n\n---\nHere is some data about the stock the user may be asking about. "
            "Use it to inform your answer, but explain it in plain terms:\n\n"
            + stock_context
        )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    # Append user conversation -- filter to only valid roles with non-empty content
    for msg in conversation:
        role = msg.get("role", "user")
        content = str(msg.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    client = _get_client()
    response = client.chat.completions.create(
        model=_ACTIVE_MODEL,
        messages=messages,
        max_tokens=300,
        temperature=0.5,
    )
    return response.choices[0].message.content or ""


# -- Public: generate_pros_cons -----------------------------------------------

_PROS_CONS_PROMPT = """\
You are a financial analyst assistant. Given the following stock data, return \
exactly 3 pros and 3 cons for this stock in plain, simple English that a \
beginner investor would understand. Focus on the fundamental metrics provided.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2", "con 3"]
}

Stock data:
"""

_PROS_CONS_FALLBACK = {
    "pros": [
        "Insufficient data available to generate specific pros.",
        "Please check the company's latest annual report for more detail.",
        "Consider consulting financial news sources for recent analysis.",
    ],
    "cons": [
        "Insufficient data available to generate specific cons.",
        "Some key metrics may be missing or unavailable.",
        "Always conduct thorough due diligence before investing.",
    ],
}


def generate_pros_cons(stock: dict) -> dict:
    """
    Ask the LLM for 3 pros and 3 cons for the given stock dict.

    Always returns a dict {"pros": [...], "cons": [...]}.
    On any error (API failure, timeout, rate limit, JSON parse failure),
    returns _PROS_CONS_FALLBACK.  This function NEVER raises.
    """
    # Build a readable summary of the key metrics
    fields = {
        "Symbol": stock.get("symbol"),
        "Company": stock.get("name"),
        "Sector": stock.get("sector"),
        "Current Price (INR)": stock.get("current_price"),
        "Market Cap (INR)": stock.get("market_cap"),
        "P/E Ratio": stock.get("pe_ratio"),
        "PEG Ratio": stock.get("peg_ratio"),
        "Return on Equity (ROE)": stock.get("roe"),
        "Debt-to-Equity": stock.get("debt_to_equity"),
        "Profit Margin": stock.get("profit_margin"),
        "Revenue Growth": stock.get("revenue_growth"),
    }
    stock_summary = "\n".join(
        f"  {k}: {v}" for k, v in fields.items() if v is not None
    )
    if not stock_summary.strip():
        return _PROS_CONS_FALLBACK

    prompt_content = _PROS_CONS_PROMPT + stock_summary

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=_ACTIVE_MODEL,
            messages=[{"role": "user", "content": prompt_content}],
            max_tokens=512,
            temperature=0.3,
        )
        raw = response.choices[0].message.content or ""

        # BUG FIX: strip BOTH opening and closing markdown code fences.
        # Previously only stripped the opening fence, leaving a trailing ```
        # which caused json.loads to fail.
        raw = re.sub(r"```(?:json)?", "", raw).strip()
        # Also strip any trailing fence that might not have the language tag
        raw = raw.strip("`").strip()

        result = json.loads(raw)
        # Validate structure
        if (
            isinstance(result, dict)
            and isinstance(result.get("pros"), list)
            and isinstance(result.get("cons"), list)
            and len(result["pros"]) > 0
            and len(result["cons"]) > 0
        ):
            return result

    except Exception:
        pass  # fall through to fallback

    return _PROS_CONS_FALLBACK


# -- Expose active model for debugging ----------------------------------------
def get_active_model() -> str:
    return _ACTIVE_MODEL
