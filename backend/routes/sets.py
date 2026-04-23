from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import WorkoutSet, WorkoutSession, Exercise, User
from schemas.set import SetCreate, SetOut, SetUpdate
from core.deps import get_current_user

router = APIRouter(prefix="/sets", tags=["sets"])


@router.post("", response_model=SetOut, status_code=status.HTTP_201_CREATED)
def log_set(
    payload: SetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == payload.workout_session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")

    exercise = db.query(Exercise).filter(Exercise.id == payload.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ćwiczenie nie istnieje")

    workout_set = WorkoutSet(
        workout_session_id=payload.workout_session_id,
        exercise_id=payload.exercise_id,
        set_number=payload.set_number,
        weight_kg=payload.weight_kg,
        reps=payload.reps,
        duration_seconds=payload.duration_seconds,
        distance_km=payload.distance_km,
    )
    db.add(workout_set)
    db.commit()
    db.refresh(workout_set)
    return workout_set


@router.get("/session/{session_id}", response_model=list[SetOut])
def get_sets_for_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")

    return (
        db.query(WorkoutSet)
        .filter(WorkoutSet.workout_session_id == session_id)
        .order_by(WorkoutSet.exercise_id, WorkoutSet.set_number)
        .all()
    )


@router.patch("/{set_id}", response_model=SetOut)
def update_set(
    set_id: int,
    payload: SetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    if not workout_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set nie istnieje")

    session = db.query(WorkoutSession).filter(WorkoutSession.id == workout_set.workout_session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")

    if payload.weight_kg is not None:
        workout_set.weight_kg = payload.weight_kg
    if payload.reps is not None:
        workout_set.reps = payload.reps
    if payload.duration_seconds is not None:
        workout_set.duration_seconds = payload.duration_seconds
    if payload.distance_km is not None:
        workout_set.distance_km = payload.distance_km

    db.commit()
    db.refresh(workout_set)
    return workout_set


@router.delete("/{set_id}")
def delete_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    if not workout_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set nie istnieje")

    session = db.query(WorkoutSession).filter(WorkoutSession.id == workout_set.workout_session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")

    db.delete(workout_set)
    db.commit()
    return {"message": "Usunięto"}
