from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


class UserRegisterSchema(BaseModel):
    email: str
    last_name: str
    first_name: str
    password: str
    model_config = ConfigDict(from_attributes=True)


class UserOutSchema(BaseModel):
    id: int
    email: str
    last_name: str
    first_name: str
    is_superuser: bool
    model_config = ConfigDict(from_attributes=True)


class UserSchema(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    disabled: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateSchema(BaseModel):
    first_name: str | None = Field(min_length=1)
    last_name: str | None = Field(min_length=1)
    email: EmailStr | None = None
    model_config = ConfigDict(from_attributes=True)


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str
