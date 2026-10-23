"""Groq-powered Energy AI Copilot API routes for authenticated power buyers."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.auth.security import decode_access_token

logger = logging.getLogger("wind_portal.api.chat")

chat_router = APIRouter(prefix="/api/v1/chat", tags=["energy-ai-copilot"])

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "openai/gpt-oss-20b"


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Message text content")


class CopilotRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation history")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Current market & decision state")


def get_current_user_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Require valid JWT token in Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access the Energy AI Copilot.",
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )
    return payload


@chat_router.post("/completions")
def generate_copilot_response(
    req: CopilotRequest,
    user: Dict[str, Any] = Depends(get_current_user_token),
) -> Dict[str, Any]:
    """Generate intelligent trading guidance using Groq inference."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is not configured on the server.",
        )

    # Build market-grounded system prompt
    ctx = req.context or {}
    day = ctx.get("day", "selected delivery day")
    freeze_hour = ctx.get("deadlineHour", 9)
    mean_wind = ctx.get("meanForecastMw", 11610)
    demand = ctx.get("consumerDemandMw", 18000)
    thermal_gap = ctx.get("netThermalNeededMw", max(0, demand - mean_wind))
    p90_buffer = ctx.get("p90SafetyBufferMw", 1851)
    unit = ctx.get("unit", "MW")
    total_order = thermal_gap + p90_buffer

    user_email = user.get("sub", "Trader")
    user_name = user.get("name", user_email.split("@")[0])

    system_prompt = f"""You are the AI Energy Copilot for the UK Wind Forecast Decision Portal.
You provide executive, rapid-fire trading guidance for power procurement desks (EPEX SPOT / Nord Pool).

AUTHENTICATED TRADER: {user_name} ({user_email})

LIVE TRADING & DECISION CONTEXT:
- Delivery Date: {day}
- Gate Closure Freeze: {freeze_hour:02d}:00 Europe/London (D-1)
- Forecasted Wind Generation (Mean): {mean_wind:.1f} {unit}
- Target Consumer Electricity Demand: {demand:.1f} {unit}
- Net Thermal Procurement Required: {thermal_gap:.1f} {unit} (to buy from CCGT/thermal peakers)
- Sized P90 Wind Shortfall Buffer: +{p90_buffer:.1f} {unit} (over-forecast hedge)
- Total Recommended Day-Ahead Bid: {total_order:.1f} {unit}
- Systematic Over-Forecast Bias: +1,852 MW (forecasts systematically over-estimate output)
- Benchmark Accuracy: 2,127 MW MAE (18.4%), 2,606 MW RMSE

STRICT HUMAN-READABLE CONCISENESS RULES (MAX 80-100 WORDS):
1. WRITE IN CLEAN, DIRECT, HUMAN-READABLE TEXT. Avoid markdown hashtags (#) or complex table syntax.
2. Structure your response into exactly 3 clear, short parts:
   - **Recommended Bid**: State total volume ({total_order:.0f} {unit}) and split ({thermal_gap:.0f} {unit} deficit + {p90_buffer:.0f} {unit} P90 buffer).
   - **Desk Rationale**: 1-2 direct sentences using the figures from context (demand vs wind and +1,852 MW bias).
   - **What You Have To Do**: 1 clear, direct instruction telling the trader exactly what order to submit and by what deadline (e.g. "Submit a {total_order:.0f} {unit} buy order on EPEX SPOT before {freeze_hour:02d}:00 London gate closure to eliminate imbalance cash-out penalty risk.").
3. No filler introductions, no sign-offs, no multi-item checklists. Strictly these 3 parts.
4. Strictly zero unicode emojis.
"""

    messages_payload = [{"role": "system", "content": system_prompt}]
    for m in req.messages[-8:]:  # keep last 8 turns for conversational context
        messages_payload.append({"role": m.role, "content": m.content})

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }

    # Attempt primary model, fallback if needed
    for model_name in [DEFAULT_MODEL, FALLBACK_MODEL]:
        try:
            payload = {
                "model": model_name,
                "messages": messages_payload,
                "temperature": 0.3,
                "max_tokens": 1024,
            }
            resp = requests.post(GROQ_BASE_URL, headers=headers, json=payload, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                reply_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {
                    "reply": reply_text,
                    "model": model_name,
                    "usage": data.get("usage", {}),
                }
            logger.warning(f"Groq model {model_name} returned HTTP {resp.status_code}: {resp.text[:200]}")
        except requests.RequestException as exc:
            logger.warning(f"Groq model {model_name} failed: {exc}")

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Failed to generate AI response via Groq API. Please try again shortly.",
    )
