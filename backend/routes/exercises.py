from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models.models import Exercise, ExerciseMuscle, MuscleGroup, User
from schemas.exercise import ExerciseCreate, ExerciseOut, MuscleGroupOut
from core.deps import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])


def build_exercise_out(exercise: Exercise) -> ExerciseOut:
    primary = []
    secondary = []
    for em in exercise.exercise_muscles:
        entry = MuscleGroupOut(
            id=em.muscle_group.id,
            name=em.muscle_group.name,
            is_primary=em.is_primary,
        )
        if em.is_primary:
            primary.append(entry)
        else:
            secondary.append(entry)
    return ExerciseOut(
        id=exercise.id,
        name=exercise.name,
        category=exercise.category,
        equipment=exercise.equipment,
        description=exercise.description,
        primary_muscles=primary,
        secondary_muscles=secondary,
    )


def get_exercise_with_muscles(db: Session, exercise_id: int) -> Exercise:
    exercise = (
        db.query(Exercise)
        .options(joinedload(Exercise.exercise_muscles).joinedload(ExerciseMuscle.muscle_group))
        .filter(Exercise.id == exercise_id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ćwiczenie nie istnieje")
    return exercise


@router.get("", response_model=list[ExerciseOut])
def list_exercises(
    muscle_group: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Exercise).options(
        joinedload(Exercise.exercise_muscles).joinedload(ExerciseMuscle.muscle_group)
    )
    if muscle_group:
        query = (
            query
            .join(Exercise.exercise_muscles)
            .join(ExerciseMuscle.muscle_group)
            .filter(MuscleGroup.name == muscle_group)
        )
    exercises = query.all()
    return [build_exercise_out(ex) for ex in exercises]


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return build_exercise_out(get_exercise_with_muscles(db, exercise_id))


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if db.query(Exercise).filter(Exercise.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ćwiczenie o tej nazwie już istnieje")

    exercise = Exercise(
        name=payload.name,
        category=payload.category,
        equipment=payload.equipment,
        description=payload.description,
    )
    db.add(exercise)
    db.flush()

    for mg in payload.muscle_groups:
        db.add(ExerciseMuscle(
            exercise_id=exercise.id,
            muscle_group_id=mg["muscle_group_id"],
            is_primary=mg["is_primary"],
        ))

    db.commit()
    return build_exercise_out(get_exercise_with_muscles(db, exercise.id))


@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ćwiczenie nie istnieje")
    db.delete(exercise)
    db.commit()
    return {"message": "Usunięto"}
