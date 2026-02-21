from fastapi import APIRouter, Cookie, HTTPException, Response, status

from ..auth import create_token, verify_password, verify_token
from ..config import settings
from ..schemas import AuthStatus, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, response: Response):
    if not verify_password(body.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    token = create_token()
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.cookie_max_age,
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session_token")
    return {"ok": True}


@router.get("/check", response_model=AuthStatus)
def check_auth(session_token: str | None = Cookie(None)):
    authenticated = bool(session_token and verify_token(session_token))
    return AuthStatus(authenticated=authenticated)
