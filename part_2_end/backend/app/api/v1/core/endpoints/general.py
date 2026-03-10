from app.api.v1.core.models import User
from app.api.v1.core.schemas import (
    PasswordChangeSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.db_setup import get_db
from app.security import (
    get_current_superuser,
    get_current_user,
    hash_password,
    verify_password,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(tags=["dashboard"], prefix="/general")


@router.get("/profile", response_model=UserUpdateSchema)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile information"""
    return current_user

@router.put("/profile", response_model=UserUpdateSchema)
def update_user_profile(
    user_update: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)

    db.commit()
    return current_user


@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: PasswordChangeSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's password. Requires the current password for verification."""
    if not password_data.current_password or not password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current and new passwords are required",
        )

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user = db.scalars(select(User).where(User.id == current_user.id)).first()
    current_user.hashed_password = hash_password(password_data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}


# Admin endpoints

@router.get("/user", response_model=list[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """List all users (superuser only)"""
    users = db.scalars(select(User)).all()
    return users


@router.get("/user/{user_id}", response_model=UserSchema)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Get detailed information about a specific user (superuser only)"""
    user = db.scalars(
        select(User).where(User.id == user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    return user
