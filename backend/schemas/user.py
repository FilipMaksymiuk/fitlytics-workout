from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    email: str = Field(max_length=100)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    email: str = Field(max_length=100)
    password: str = Field(max_length=100)


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, max_length=100)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    current_password: str | None = Field(default=None, max_length=100)
    new_password: str | None = Field(default=None, min_length=8, max_length=100)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    created_at: datetime
