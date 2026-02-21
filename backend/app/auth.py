import secrets

from fastapi import Cookie, HTTPException, status
from itsdangerous import BadSignature, URLSafeTimedSerializer

from .config import settings

serializer = URLSafeTimedSerializer(settings.secret_key)
TOKEN_SALT = "auth-token"


def create_token() -> str:
    return serializer.dumps("authenticated", salt=TOKEN_SALT)


def verify_token(token: str) -> bool:
    try:
        serializer.loads(token, salt=TOKEN_SALT, max_age=settings.cookie_max_age)
        return True
    except BadSignature:
        return False


def verify_password(password: str) -> bool:
    return secrets.compare_digest(password, settings.app_password)


def require_auth(session_token: str | None = Cookie(None)) -> None:
    if not session_token or not verify_token(session_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
