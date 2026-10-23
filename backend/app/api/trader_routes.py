"""Trader workstation API routes for logged-in users:
- Day-Ahead Auction Order Curve CSV export
- Custom Utility Demand Portfolios (MongoDB persisted)
- Financial Imbalance Penalty Savings Calculator
- Trader Decision Notes & Trade Journal (MongoDB persisted)
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field

from backend.app.api.chat_routes import get_current_user_token
from backend.app.core.selection import merge_decision_with_actuals, select_decision_forecasts
from backend.app.data_store import data_store
from backend.app.db.mongo import mongo_manager

logger = logging.getLogger("wind_portal.api.trader")

trader_router = APIRouter(prefix="/api/v1/trader", tags=["trader-workstation"])


# In-memory fallbacks when MongoDB is not connected
_fallback_portfolios: Dict[str, List[Dict[str, Any]]] = {}
_fallback_notes: Dict[str, List[Dict[str, Any]]] = {}


class PortfolioRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Portfolio name e.g. 'Northern Industrial'")
    demandMw: float = Field(..., gt=0, le=100000, description="Target consumer load in MW")
    description: Optional[str] = Field(default="", max_length=200)


class NoteRequest(BaseModel):
    day: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    note: str = Field(..., min_length=1, max_length=1000, description="Trader operational note")


@trader_router.get("/export-order-sheet")
def export_auction_order_sheet(
    day: str = Query(..., description="Target delivery date YYYY-MM-DD"),
    deadline_hour: int = Query(9, ge=0, le=23, description="Decision freeze hour in London"),
    demand_mw: float = Query(18000, gt=0, description="Target consumer demand MW"),
    p90_buffer_mw: float = Query(1851, ge=0, description="Empirical P90 buffer MW"),
    user: Dict[str, Any] = Depends(get_current_user_token),
):
    """Export formatted EPEX SPOT / Nord Pool Day-Ahead Half-Hourly auction order sheet as CSV."""
    try:
        target_day = date.fromisoformat(day)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {exc}",
        ) from exc

    selected = select_decision_forecasts(
        data_store.forecasts_df, start_date=target_day, end_date=target_day, deadline_hour=deadline_hour
    )
    if selected.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No decision data available for day {day} with freeze hour {deadline_hour}",
        )

    df = merge_decision_with_actuals(selected, data_store.actuals_df)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header metadata comments
    writer.writerow(["# UK DAY-AHEAD POWER AUCTION PROCUREMENT ORDER SHEET"])
    writer.writerow([f"# Trader: {user.get('name', user.get('sub'))} ({user.get('sub')})"])
    writer.writerow([f"# Delivery Date: {day}"])
    writer.writerow([f"# Freeze Deadline: {deadline_hour:02d}:00 Europe/London"])
    writer.writerow([f"# Target Consumer Demand: {demand_mw:.1f} MW"])
    writer.writerow([f"# Sized P90 Standby Buffer: +{p90_buffer_mw:.1f} MW"])
    writer.writerow([f"# Generated UTC: {datetime.now(timezone.utc).isoformat()}"])
    writer.writerow([])

    # Table columns
    writer.writerow(
        [
            "Period",
            "Delivery_Time_UTC",
            "Consumer_Demand_MW",
            "Wind_Forecast_MW",
            "Net_Thermal_Deficit_MW",
            "P90_Buffer_MW",
            "Total_Auction_Bid_MW",
            "Outturn_Actual_MW",
            "Forecast_Horizon_Hours",
        ]
    )

    for idx, row in df.iterrows():
        period = idx + 1
        t_utc = row["startTime"].strftime("%H:%M")
        fc_val = float(row["forecast"])
        act_val = float(row["actual"]) if pd.notnull(row["actual"]) else ""
        thermal_deficit = max(0.0, demand_mw - fc_val)
        total_bid = thermal_deficit + p90_buffer_mw
        horizon = float(row["horizonHours"])

        writer.writerow(
            [
                period,
                t_utc,
                f"{demand_mw:.1f}",
                f"{fc_val:.1f}",
                f"{thermal_deficit:.1f}",
                f"{p90_buffer_mw:.1f}",
                f"{total_bid:.1f}",
                f"{act_val:.1f}" if act_val != "" else "-",
                f"{horizon:.1f}",
            ]
        )

    csv_data = output.getvalue()
    filename = f"UK_DayAhead_OrderSheet_{day}_Freeze{deadline_hour:02d}London.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# -------------------------------------------------------------
# SAVED DEMAND PORTFOLIOS
# -------------------------------------------------------------

@trader_router.get("/portfolios")
def get_user_portfolios(user: Dict[str, Any] = Depends(get_current_user_token)) -> List[Dict[str, Any]]:
    """Retrieve custom saved consumer demand portfolios for the user."""
    email = user["sub"].lower()
    if mongo_manager.is_connected and mongo_manager._db is not None:
        docs = list(mongo_manager._db.portfolios.find({"user_email": email}, {"_id": 0}))
        return docs
    return _fallback_portfolios.get(email, [])


@trader_router.post("/portfolios")
def save_user_portfolio(
    req: PortfolioRequest,
    user: Dict[str, Any] = Depends(get_current_user_token),
) -> Dict[str, Any]:
    """Save or update a custom consumer demand portfolio in MongoDB."""
    email = user["sub"].lower()
    doc = {
        "user_email": email,
        "name": req.name.strip(),
        "demandMw": req.demandMw,
        "description": req.description,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if mongo_manager.is_connected and mongo_manager._db is not None:
        mongo_manager._db.portfolios.update_one(
            {"user_email": email, "name": doc["name"]},
            {"$set": doc},
            upsert=True,
        )
    else:
        user_list = _fallback_portfolios.setdefault(email, [])
        user_list = [p for p in user_list if p["name"] != doc["name"]]
        user_list.append(doc)
        _fallback_portfolios[email] = user_list

    return {"status": "saved", "portfolio": doc}


# -------------------------------------------------------------
# TRADER DECISION NOTES & TRADE JOURNAL
# -------------------------------------------------------------

@trader_router.get("/notes")
def get_trader_notes(
    day: str = Query(..., description="Target delivery date YYYY-MM-DD"),
    user: Dict[str, Any] = Depends(get_current_user_token),
) -> List[Dict[str, Any]]:
    """Retrieve trader operational notes for a specific delivery day."""
    if mongo_manager.is_connected and mongo_manager._db is not None:
        docs = list(mongo_manager._db.trade_notes.find({"day": day}, {"_id": 0}).sort("created_at", -1))
        return docs
    return _fallback_notes.get(day, [])


@trader_router.post("/notes")
def save_trader_note(
    req: NoteRequest,
    user: Dict[str, Any] = Depends(get_current_user_token),
) -> Dict[str, Any]:
    """Save a timestamped trade decision note for a delivery day."""
    email = user["sub"].lower()
    name = user.get("name", email.split("@")[0])
    doc = {
        "day": req.day,
        "user_email": email,
        "author": name,
        "note": req.note.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if mongo_manager.is_connected and mongo_manager._db is not None:
        mongo_manager._db.trade_notes.insert_one(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
    else:
        day_notes = _fallback_notes.setdefault(req.day, [])
        day_notes.insert(0, doc)

    return {"status": "saved", "note": doc}


# -------------------------------------------------------------
# FINANCIAL RISK & SAVINGS CALCULATOR
# -------------------------------------------------------------

@trader_router.get("/savings-estimate")
def calculate_imbalance_savings(
    imbalance_price_gbp: float = Query(125.0, ge=10.0, le=500.0, description="System Buy Price (£/MWh)"),
    buffer_quantile: float = Query(0.90, ge=0.50, le=0.99, description="Buffer quantile hedge (P90)"),
    user: Dict[str, Any] = Depends(get_current_user_token),
) -> Dict[str, Any]:
    """Calculate projected £ cash-out penalty savings from safety buffer hedging."""
    # Empirical Jan 2026 ground truth values:
    # 744 hours, Mean Absolute Error = 2,127 MW, Mean Over-Forecast Bias = +1,852 MW
    # Total monthly unhedged shortfall = 1,851.53 MW * 744 hours = 1,377,538 MWh
    # With P90 hedge (1,851 MW buffer), ~90% of physical shortfall events are covered.
    hours = 744
    bias_mw = 1851.53
    total_shortfall_mwh = bias_mw * hours
    total_unhedged_penalty_gbp = total_shortfall_mwh * imbalance_price_gbp

    # Avoided cash-out penalty (assuming 88-92% coverage from P90 hedge)
    coverage_ratio = buffer_quantile
    avoided_penalty_gbp = total_unhedged_penalty_gbp * coverage_ratio
    daily_avoided_gbp = avoided_penalty_gbp / 31.0

    return {
        "hours_evaluated": hours,
        "imbalance_price_gbp_per_mwh": imbalance_price_gbp,
        "buffer_quantile": buffer_quantile,
        "mean_overforecast_bias_mw": bias_mw,
        "total_unhedged_exposure_mwh": round(total_shortfall_mwh, 1),
        "total_unhedged_penalty_gbp": round(total_unhedged_penalty_gbp, 2),
        "estimated_savings_gbp": round(avoided_penalty_gbp, 2),
        "daily_average_savings_gbp": round(daily_avoided_gbp, 2),
        "trader": user.get("name", user.get("sub")),
    }
