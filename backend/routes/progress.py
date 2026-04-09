from datetime import datetime, timezone, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import WorkoutSet, WorkoutSession, Exercise, ExerciseMuscle, MuscleGroup, User
from schemas.progress import ProgressPoint, PersonalRecord, MuscleVolumeBreakdown, WeeklyVolume, MonthlyTrainingDays
from core.deps import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/records", response_model=list[PersonalRecord])
def get_personal_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(
            Exercise.id,
            Exercise.name,
            func.max(WorkoutSet.weight_kg).label("max_weight"),
            func.max(WorkoutSession.date).label("date_achieved"),
        )
        .join(WorkoutSet, WorkoutSet.exercise_id == Exercise.id)
        .join(WorkoutSession, WorkoutSession.id == WorkoutSet.workout_session_id)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSet.weight_kg.isnot(None),
        )
        .group_by(Exercise.id, Exercise.name)
        .order_by(func.max(WorkoutSet.weight_kg).desc())
        .all()
    )

    result = []
    for row in rows:
        max_w = row.max_weight
        date_row = (
            db.query(WorkoutSession.date)
            .join(WorkoutSet, WorkoutSet.workout_session_id == WorkoutSession.id)
            .filter(
                WorkoutSession.user_id == current_user.id,
                WorkoutSet.exercise_id == row.id,
                WorkoutSet.weight_kg == max_w,
            )
            .order_by(WorkoutSession.date.asc())
            .first()
        )
        result.append(
            PersonalRecord(
                exercise_id=row.id,
                exercise_name=row.name,
                max_weight=max_w,
                date_achieved=date_row.date if date_row else row.date_achieved,
            )
        )
    return result


@router.get("/weekly-volume", response_model=list[WeeklyVolume])
def get_weekly_volume(
    weeks: int = Query(default=12, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(weeks=weeks)

    sets = (
        db.query(WorkoutSet, WorkoutSession.date, ExerciseMuscle.muscle_group_id, MuscleGroup.name)
        .join(WorkoutSession, WorkoutSession.id == WorkoutSet.workout_session_id)
        .join(ExerciseMuscle, ExerciseMuscle.exercise_id == WorkoutSet.exercise_id)
        .join(MuscleGroup, MuscleGroup.id == ExerciseMuscle.muscle_group_id)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= since,
            WorkoutSet.weight_kg.isnot(None),
            WorkoutSet.reps.isnot(None),
        )
        .all()
    )

    weeks_data: dict[datetime, dict] = {}

    for workout_set, session_date, muscle_group_id, muscle_name in sets:
        if session_date.tzinfo is None:
            session_date = session_date.replace(tzinfo=timezone.utc)
        days_since_monday = session_date.weekday()
        week_start = (session_date - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        if week_start not in weeks_data:
            weeks_data[week_start] = {"total_volume": 0.0, "muscle_volumes": defaultdict(float)}

        volume = workout_set.weight_kg * workout_set.reps
        weeks_data[week_start]["total_volume"] += volume
        weeks_data[week_start]["muscle_volumes"][muscle_name] += volume

    result = []
    for week_start in sorted(weeks_data.keys()):
        data = weeks_data[week_start]
        breakdown = [
            MuscleVolumeBreakdown(muscle_group=muscle, volume=vol)
            for muscle, vol in data["muscle_volumes"].items()
        ]
        result.append(
            WeeklyVolume(
                week_start_date=week_start,
                total_volume=data["total_volume"],
                muscle_breakdown=breakdown,
            )
        )
    return result


@router.get("/monthly-days", response_model=MonthlyTrainingDays)
def get_monthly_training_days(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(WorkoutSession.date)
        .filter(
            WorkoutSession.user_id == current_user.id,
            func.strftime("%Y", WorkoutSession.date) == str(year),
            func.strftime("%m", WorkoutSession.date) == f"{month:02d}",
        )
        .order_by(WorkoutSession.date.asc())
        .all()
    )

    dates = [row.date for row in sessions]
    return MonthlyTrainingDays(
        year=year,
        month=month,
        training_days=len(dates),
        dates=dates,
    )


@router.get("/{exercise_id}", response_model=list[ProgressPoint])
def get_exercise_progress(
    exercise_id: int,
    days: int = Query(default=90, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    sessions = (
        db.query(WorkoutSession.id, WorkoutSession.date)
        .join(WorkoutSet, WorkoutSet.workout_session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSet.exercise_id == exercise_id,
            WorkoutSession.date >= since,
        )
        .distinct()
        .order_by(WorkoutSession.date.asc())
        .all()
    )

    result = []
    for session_id, session_date in sessions:
        sets = (
            db.query(WorkoutSet)
            .filter(
                WorkoutSet.workout_session_id == session_id,
                WorkoutSet.exercise_id == exercise_id,
            )
            .all()
        )

        max_weight = None
        total_volume = 0.0
        best_set_reps = None

        for s in sets:
            if s.weight_kg is not None:
                max_weight = max(max_weight, s.weight_kg) if max_weight is not None else s.weight_kg
            if s.weight_kg is not None and s.reps is not None:
                total_volume += s.weight_kg * s.reps
            if s.reps is not None:
                best_set_reps = max(best_set_reps, s.reps) if best_set_reps is not None else s.reps

        result.append(
            ProgressPoint(
                date=session_date,
                max_weight=max_weight,
                total_volume=total_volume,
                best_set_reps=best_set_reps,
            )
        )
    return result
