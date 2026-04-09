from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProgressPoint(BaseModel):
    date: datetime
    max_weight: float | None
    total_volume: float
    best_set_reps: int | None

    model_config = ConfigDict(from_attributes=True)


class PersonalRecord(BaseModel):
    exercise_id: int
    exercise_name: str
    max_weight: float
    date_achieved: datetime

    model_config = ConfigDict(from_attributes=True)


class MuscleVolumeBreakdown(BaseModel):
    muscle_group: str
    volume: float

    model_config = ConfigDict(from_attributes=True)


class WeeklyVolume(BaseModel):
    week_start_date: datetime
    total_volume: float
    muscle_breakdown: list[MuscleVolumeBreakdown]

    model_config = ConfigDict(from_attributes=True)


class MonthlyTrainingDays(BaseModel):
    year: int
    month: int
    training_days: int
    dates: list[datetime]

    model_config = ConfigDict(from_attributes=True)
