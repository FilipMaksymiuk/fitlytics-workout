from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PlanSetCreate(BaseModel):
    set_number: int
    planned_weight_kg: float | None = None
    planned_reps: int | None = None


class PlanExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int
    sets: list[PlanSetCreate] = []


class PlanCreate(BaseModel):
    name: str
    description: str | None = None
    exercises: list[PlanExerciseCreate] = []


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
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
