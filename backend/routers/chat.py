"""
routers/chat.py
───────────────
POST /chat/{investor_key}
Body: {"conversation": [...], "stock_context": "optional string"}
Response: {"reply": "..."}
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.llm import chat_with_investor
from prompts.investor_prompts import VALID_INVESTOR_KEYS

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    conversation: list[dict]
    stock_context: str = ""


@router.post("/{investor_key}")
def chat(investor_key: str, body: ChatRequest):
    """
    Send a conversation to the requested investor persona and receive a reply.

    **investor_key** must be one of: `buffett`, `lynch`, `graham`, `munger`, `dalio`

    **conversation** is a list of `{"role": "user"|"assistant", "content": "..."}` dicts.

    **stock_context** (optional) - any extra stock info to prepend as system context.
    """
    if investor_key not in VALID_INVESTOR_KEYS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown investor key '{investor_key}'. "
                f"Valid options: {VALID_INVESTOR_KEYS}"
            ),
        )

    if not body.conversation:
        raise HTTPException(
            status_code=422,
            detail="'conversation' must contain at least one message.",
        )

    try:
        reply = chat_with_investor(
            investor_key=investor_key,
            conversation=body.conversation,
            stock_context=body.stock_context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"reply": reply, "investor": investor_key}
