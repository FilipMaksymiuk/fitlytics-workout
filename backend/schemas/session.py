from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SessionCreate(BaseModel):
    notes: str | None = Field(default=None, max_length=1000)


class SessionEnd(BaseModel):
    duration_minutes: int = Field(ge=0)


class SessionUpdate(BaseModel):
    notes: str | None = Field(default=None, max_length=1000)
    duration_minutes: int | None = Field(default=None, ge=0)


class WorkoutSetOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str = ""
    weight_kg: float | None
    reps: int | None
    set_number: int
    duration_seconds: int | None
    distance_km: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='before')
    @classmethod
    def extract_exercise_name(cls, data: Any) -> Any:
        if hasattr(data, 'exercise') and data.exercise is not None:
            data.__dict__['exercise_name'] = data.exercise.name
        return data


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
    workout_sets: list[WorkoutSetOut]

    model_config = ConfigDict(from_attributes=True)
