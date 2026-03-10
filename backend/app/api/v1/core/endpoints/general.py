from app.api.v1.core.models import Role, User
from math import ceil

from app.api.v1.core.schemas import (
    AdminPasswordResetSchema,
    AdminUserCreateSchema,
    AdminUserUpdateSchema,
    PaginatedResponse,
    PasswordChangeSchema,
    RoleOutSchema,
    UserRoleUpdateSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.api.v1.core.services import (
    admin_reset_password,
    admin_update_user,
    create_user_as_admin,
    toggle_user_status,
    update_user_role,
)
from app.db_setup import get_db
from app.security import (
    get_current_admin,
    get_current_user,
    hash_password,
    verify_password,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

router = APIRouter(tags=["dashboard"], prefix="/general")


@router.get("/profile", response_model=UserUpdateSchema)
def get_user_profile(current_user: User = Depends(get_current_user)):
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

@router.get("/roles", response_model=list[RoleOutSchema])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return list(db.scalars(select(Role)).all())


@router.get("/user", response_model=PaginatedResponse[UserSchema])
def list_users(
    role: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = select(User)
    count_query = select(func.count(User.id))
    if role:
        query = query.join(Role).where(Role.name == role)
        count_query = count_query.join(Role).where(Role.name == role)

    total = db.scalar(count_query)
    total_pages = ceil(total / page_size) if total > 0 else 1

    users = db.scalars(
        query.offset((page - 1) * page_size).limit(page_size)
    ).all()

    return PaginatedResponse(
        items=list(users),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/user/{user_id}", response_model=UserSchema)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user = db.scalars(
        select(User).where(User.id == user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    return user


@router.put("/user/{user_id}/role", response_model=UserSchema)
def change_user_role(
    user_id: int,
    data: UserRoleUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return update_user_role(db, user_id, data.role_id)


@router.post("/user", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    data: AdminUserCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return create_user_as_admin(db, data)


@router.put("/user/{user_id}", response_model=UserSchema)
def update_user_endpoint(
    user_id: int,
    data: AdminUserUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return admin_update_user(db, user_id, data)


@router.put("/user/{user_id}/reset-password")
def reset_user_password_endpoint(
    user_id: int,
    data: AdminPasswordResetSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    admin_reset_password(db, user_id, data)
    return {"message": "Password reset successfully"}


@router.put("/user/{user_id}/toggle-status", response_model=UserSchema)
def toggle_user_status_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return toggle_user_status(db, user_id)
