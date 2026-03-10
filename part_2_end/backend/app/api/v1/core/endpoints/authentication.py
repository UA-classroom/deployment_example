from typing import Annotated

from app.api.v1.core.models import Token, User
from app.api.v1.core.schemas import (
    TokenSchema,
    UserOutSchema,
    UserRegisterSchema,
)
from app.db_setup import get_db
from app.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    # get_current_token,
    hash_password,
    verify_password,
)
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(tags=["auth"], prefix="/auth")

@router.post("/user/create", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserRegisterSchema, db: Session = Depends(get_db)
) -> UserOutSchema:
    # TODO ADD VALIDATION TO CREATION OF PASSWORD
    # if user.password < 10:
    #     raise HTTPException(detail="Password too short")
    # ETC ETC
    
    # bil123123 --> ASOJDASJdsAKDJIASODi32384esdJSAD2
    hashed_password = hash_password(user.password)
    # We exclude password from the validated pydantic model since the field/column is called hashed_password, we add that manually
    try:
        new_user = User(
            **user.model_dump(exclude={"password"}), hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()
    except IntegrityError:
        raise HTTPException(status_code=409, detail="User already exists")
    return new_user 

@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenSchema:
    # Keep in mind that without the response model or return schema
    # we would expose the hashed password, which absolutely cannot happen
    # Perhaps better to use .only or select the columns explicitly
    user = (
        db.execute(
            select(User).where(User.email == form_data.username),
        )
        .scalars()
        .first()
    )
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
    # db.execute(delete(Token).where(Token.token == current_token.token))
    db.delete(current_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# @router.put("/user", response_model=UserOutSchema)
# def read_users_me(data: UserInSchema, current_user: User = Depends(get_current_user)):
#     user.name = data.name
#     return current_user

