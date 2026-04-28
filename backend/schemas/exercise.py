from pydantic import BaseModel, ConfigDict, Field


class MuscleGroupOut(BaseModel):
    id: int
    name: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=50)
    equipment: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=2000)
    muscle_groups: list[dict]


class ExerciseOut(BaseModel):
    id: int
    name: str
    category: str
    equipment: str | None
    description: str | None
    primary_muscles: list[MuscleGroupOut]
    secondary_muscles: list[MuscleGroupOut]
    is_custom: bool = False

    model_config = ConfigDict(from_attributes=True)
