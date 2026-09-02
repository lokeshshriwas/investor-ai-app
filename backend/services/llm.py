"""
llm.py
------
LLM integration using the Groq API.

Functions:
    chat_with_investor(investor_key, conversation, stock_context="")
        -> reply text from the requested investor persona

    generate_pros_cons(stock)
        -> {"pros": [...], "cons": [...]} or a fallback dict on JSON parse failure
"""

from __future__ import annotations

import json
import os
import re
from typing import Optional

from dotenv import load_dotenv
from groq import Groq

from prompts.investor_prompts import get_system_prompt

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# -- Groq client --------------------------------------------------------------

_client: Optional[Groq] = None
_model_resolved: bool = False

# Chat-completion models only (ordered by preference)
_PREFERRED_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "gemma-7b-it",
    "llama-3.1-70b-versatile",
    "openai/gpt-oss-120b",   # available on some Groq tiers
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "groq/compound",
]

# Prefixes of model IDs that are KNOWN to support chat completions.
_CHAT_MODEL_PREFIXES = ("llama", "mixtral", "gemma", "mistral", "openai/gpt-oss", "qwen/qwen3", "groq/compound")

_ACTIVE_MODEL: str = "gemma2-9b-it"  # stable fallback on all Groq tiers


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        _client = Groq(api_key=api_key)
    return _client


def _resolve_model() -> str:
    """Pick the best available model from the user's active Groq models."""
    global _ACTIVE_MODEL, _model_resolved
    if _model_resolved:
        return _ACTIVE_MODEL
    try:
        client = _get_client()
        available = {m.id for m in client.models.list().data}
        for model in _PREFERRED_MODELS:
            if model in available:
                _ACTIVE_MODEL = model
                _model_resolved = True
                return model
        # None of the preferred models matched — pick first KNOWN chat model
        chat_models = [
            m for m in available
            if any(m.lower().startswith(prefix) for prefix in _CHAT_MODEL_PREFIXES)
        ]
        if chat_models:
            _ACTIVE_MODEL = chat_models[0]
            _model_resolved = True
            return _ACTIVE_MODEL
    except Exception:
        pass
    _ACTIVE_MODEL = "llama3-8b-8192"
    _model_resolved = True
    return _ACTIVE_MODEL


def _strip_thinking(text: str) -> str:
    """Remove <think>...</think> reasoning blocks emitted by some models."""
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    return text.strip()


# -- Public: chat_with_investor -----------------------------------------------

def chat_with_investor(
    investor_key: str,
    conversation: list[dict],
    stock_context: str = "",
) -> str:
    """
    Send a conversation to the investor persona and return the reply text.
    """
    system_prompt = get_system_prompt(investor_key)

    if stock_context:
        system_prompt = (
            system_prompt
            + "\n\n---\nHere is some data about the stock the user may be asking about. "
            "Use it to inform your answer, but explain it in plain terms:\n\n"
            + stock_context
        )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    for msg in conversation:
        role = msg.get("role", "user")
        content = str(msg.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    client = _get_client()
    model = _resolve_model()

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=300,
        temperature=0.5,
    )
    return _strip_thinking(response.choices[0].message.content or "")


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
    """
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
        model = _resolve_model()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt_content}],
            max_tokens=512,
            temperature=0.3,
        )
        raw = response.choices[0].message.content or ""
        raw = re.sub(r"```(?:json)?", "", raw).strip()
        raw = raw.strip("`").strip()

        result = json.loads(raw)
        if (
            isinstance(result, dict)
            and isinstance(result.get("pros"), list)
            and isinstance(result.get("cons"), list)
            and len(result["pros"]) > 0
            and len(result["cons"]) > 0
        ):
            return result

    except Exception:
        pass

    return _PROS_CONS_FALLBACK


def get_active_model() -> str:
    return _ACTIVE_MODEL
