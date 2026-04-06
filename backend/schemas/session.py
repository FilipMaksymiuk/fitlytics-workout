from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    notes: str | None


class SessionEnd(BaseModel):
    duration_minutes: int


class WorkoutSetOut(BaseModel):
    id: int
    exercise_id: int
    weight_kg: float | None
    reps: int | None
    set_number: int
    duration_seconds: int | None
    distance_km: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionOut(BaseModel):
    id: int
    date: datetime
    duration_minutes: int | None
    notes: str | None
    planned_end: datetime | None

    model_config = ConfigDict(from_attributes=True)


class SessionDetailOut(BaseModel):
    id: int
    date: datetime
    duration_minutes: int | None
    notes: str | None
    sets: list[WorkoutSetOut]

    model_config = ConfigDict(from_attributes=True)
