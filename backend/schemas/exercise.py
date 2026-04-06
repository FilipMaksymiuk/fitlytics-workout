from pydantic import BaseModel, ConfigDict


class MuscleGroupOut(BaseModel):
    id: int
    name: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ExerciseCreate(BaseModel):
    name: str
    category: str
    equipment: str | None
    description: str | None
    muscle_groups: list[dict]


class ExerciseOut(BaseModel):
    id: int
    name: str
    category: str
    equipment: str | None
    description: str | None
    primary_muscles: list[MuscleGroupOut]
    secondary_muscles: list[MuscleGroupOut]

    model_config = ConfigDict(from_attributes=True)
