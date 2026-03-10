from typing import Annotated

from app.api.v1.core.models import Token, User
from app.api.v1.core.schemas import (
    TokenSchema,
    UserOutSchema,
)
from app.db_setup import get_db
from app.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    verify_password,
)
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(tags=["auth"], prefix="/auth")


@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenSchema:
    user = db.scalars(
        select(User).where(User.email == form_data.username)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Passwords do not match",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_database_token(user_id=user.id, db=db)
    return {"access_token": access_token.token, "token_type": "bearer"}


@router.get("/me", response_model=UserOutSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    db.delete(current_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
