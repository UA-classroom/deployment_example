import base64
from datetime import UTC, datetime, timedelta, timezone
from random import SystemRandom
from typing import Annotated
from uuid import UUID, uuid4

from app.api.v1.core.models import Token, User
from app.db_setup import get_db
from app.settings import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/token")

# Create a PasswordHash instance with recommended settings (uses Argon2 by default)
password_hash = PasswordHash.recommended()

DEFAULT_ENTROPY = 32  # number of bytes to return by default
_sysrand = SystemRandom()

def hash_password(password: str) -> str:
    """Hash a password using Argon2 (recommended algorithm)."""
    return password_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return password_hash.verify(plain_password, hashed_password)

def token_bytes(nbytes=None):
    """Return a random byte string containing *nbytes* bytes."""
    if nbytes is None:
        nbytes = DEFAULT_ENTROPY
    return _sysrand.randbytes(nbytes)

def token_urlsafe(nbytes=None):
    """Return a random URL-safe text string, in Base64 encoding."""
    tok = token_bytes(nbytes)
    return base64.urlsafe_b64encode(tok).rstrip(b"=").decode("ascii")

def create_database_token(user_id: int, db: Session):
    """Create a randomized token and store it in the database."""
    randomized_token = token_urlsafe()
    new_token = Token(token=randomized_token, user_id=user_id)
    db.add(new_token)
    db.commit()
    return new_token

def verify_token_access(token_str: str, db: Session) -> Token:
    """Return a token if valid, otherwise raise an exception."""
    max_age = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    token = (
        db.execute(
            select(Token).where(
                Token.token == token_str, Token.created >= datetime.now(UTC) - max_age
            ),
        )
        .scalars()
        .first()
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """Get the current user based on the authentication token."""
    token = verify_token_access(token_str=token, db=db)
    user = token.user
    return user

def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Verify the current user is a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Superuser privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

def get_current_token(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """Get the current token object (useful for logout)."""
    token = verify_token_access(token_str=token, db=db)
    return token

def authenticate_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """Simply verify the user is authenticated."""
    token = verify_token_access(token_str=token, db=db)
    return