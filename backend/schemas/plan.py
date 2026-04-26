from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PlanSetCreate(BaseModel):
    set_number: int = Field(ge=1)
    planned_weight_kg: float | None = Field(default=None, ge=0)
    planned_reps: int | None = Field(default=None, ge=1)


class PlanExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int = Field(ge=0)
    sets: list[PlanSetCreate] = []


class PlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    exercises: list[PlanExerciseCreate] = []


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    exercises: list[PlanExerciseCreate] | None = None


class PlanSetOut(BaseModel):
    id: int
    set_number: int
    planned_weight_kg: float | None
    planned_reps: int | None

    model_config = ConfigDict(from_attributes=True)


class PlanExerciseOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    order_index: int
    sets: list[PlanSetOut]

    model_config = ConfigDict(from_attributes=True)


class PlanOut(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    exercises: list[PlanExerciseOut]

    model_config = ConfigDict(from_attributes=True)
