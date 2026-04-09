from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class SetCreate(BaseModel):
    workout_session_id: int
    exercise_id: int
    set_number: int
    weight_kg: float | None = None
    reps: int | None = None
    duration_seconds: int | None = None
    distance_km: float | None = None

    @model_validator(mode="after")
    def check_set_number_and_metrics(self):
        if self.set_number < 1:
            raise ValueError("set_number musi być większy od 0")
        if self.weight_kg is None and self.duration_seconds is None:
            raise ValueError("Podaj przynajmniej weight_kg lub duration_seconds")
        return self


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
