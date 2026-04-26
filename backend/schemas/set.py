from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SetCreate(BaseModel):
    workout_session_id: int
    exercise_id: int
    set_number: int = Field(ge=1)
    weight_kg: float | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=1)
    duration_seconds: int | None = Field(default=None, ge=0)
    distance_km: float | None = Field(default=None, ge=0)


class SetUpdate(BaseModel):
    weight_kg: float | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=1)
    duration_seconds: int | None = Field(default=None, ge=0)
    distance_km: float | None = Field(default=None, ge=0)


class SetOut(BaseModel):
    id: int
    workout_session_id: int
    exercise_id: int
    weight_kg: float | None
    reps: int | None
    set_number: int
    duration_seconds: int | None
    distance_km: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
