"""Authentication and dataset MongoDB synchronization API routes."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.app.db.mongo import mongo_manager

logger = logging.getLogger("wind_portal.api.auth")
auth_router = APIRouter(prefix="/api/v1", tags=["Authentication & MongoDB"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Trader full name")
    email: str = Field(..., min_length=5, max_length=100, description="Trader work email")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=100, description="Trader email")
    password: str = Field(..., min_length=1, max_length=128, description="Password")


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str = "trader"
    createdAt: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Dependency to extract authenticated user from Bearer JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authentication header",
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
        )

    user = mongo_manager.get_user_by_email(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserProfile(
        id=str(user.get("_id", "")),
        name=user.get("name", ""),
        email=user["email"],
        role=user.get("role", "trader"),
        createdAt=user.get("created_at"),
    )


@auth_router.post("/auth/register", response_model=AuthResponse)
def register_user(req: RegisterRequest):
    """Register a new energy trader account in MongoDB."""
    email = req.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email format.",
        )

    existing = mongo_manager.get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{email}' already exists. Please sign in.",
        )

    pwd_hash = hash_password(req.password)
    user_doc = {
        "name": req.name.strip(),
        "email": email,
        "password_hash": pwd_hash,
        "role": "trader",
    }

    try:
        saved = mongo_manager.create_user(user_doc)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    token = create_access_token(data={"sub": email, "name": req.name, "role": "trader"})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            id=str(saved.get("_id", "")),
            name=saved["name"],
            email=saved["email"],
            role=saved.get("role", "trader"),
            createdAt=saved.get("created_at"),
        ),
    )


@auth_router.post("/auth/login", response_model=AuthResponse)
def login_user(req: LoginRequest):
    """Authenticate trader and issue JWT token."""
    email = req.email.strip().lower()
    user = mongo_manager.get_user_by_email(email)
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please try again.",
        )

    token = create_access_token(data={"sub": email, "name": user.get("name"), "role": user.get("role", "trader")})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            id=str(user.get("_id", "")),
            name=user.get("name", "Trader"),
            email=user["email"],
            role=user.get("role", "trader"),
            createdAt=user.get("created_at"),
        ),
    )


@auth_router.get("/auth/me", response_model=UserProfile)
def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Return currently authenticated trader profile."""
    return current_user


@auth_router.get("/dataset/mongo-status")
def get_mongo_status():
    """Check MongoDB connection and dataset collection telemetry."""
    return mongo_manager.get_dataset_status()
