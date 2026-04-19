from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class PlanCreate(BaseModel):
    name: str
    description: str | None = None
    planned_date: datetime
    deadline: datetime

    @model_validator(mode="after")
    def deadline_after_planned(self) -> "PlanCreate":
        if self.deadline <= self.planned_date:
            raise ValueError("deadline musi być późniejszy niż planned_date")
        return self


class PlanUpdate(BaseModel):
    planned_date: datetime | None = None
    deadline: datetime | None = None
    is_completed: bool | None = None


class PlanOut(BaseModel):
    id: int
    name: str
    description: str | None
    planned_date: datetime
    deadline: datetime
    is_completed: bool
    created_at: datetime
    is_overdue: bool

    model_config = ConfigDict(from_attributes=True)
