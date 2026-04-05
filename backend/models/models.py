from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        back_populates="user"
    )


class MuscleGroup(Base):
    __tablename__ = "muscle_groups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    exercise_muscles: Mapped[list["ExerciseMuscle"]] = relationship(
        back_populates="muscle_group"
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    equipment: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    exercise_muscles: Mapped[list["ExerciseMuscle"]] = relationship(
        back_populates="exercise"
    )
    workout_sets: Mapped[list["WorkoutSet"]] = relationship(back_populates="exercise")


class ExerciseMuscle(Base):
    __tablename__ = "exercise_muscles"

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id"), primary_key=True
    )
    muscle_group_id: Mapped[int] = mapped_column(
        ForeignKey("muscle_groups.id"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    exercise: Mapped["Exercise"] = relationship(back_populates="exercise_muscles")
    muscle_group: Mapped["MuscleGroup"] = relationship(back_populates="exercise_muscles")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    planned_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="workout_sessions")
    workout_sets: Mapped[list["WorkoutSet"]] = relationship(
        back_populates="workout_session"
    )


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workout_session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id"), nullable=False
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id"), nullable=False
    )
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    workout_session: Mapped["WorkoutSession"] = relationship(
        back_populates="workout_sets"
    )
    exercise: Mapped["Exercise"] = relationship(back_populates="workout_sets")
