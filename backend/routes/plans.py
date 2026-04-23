from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models.models import WorkoutPlan, PlanExercise, PlanSet, User
from schemas.plan import PlanCreate, PlanUpdate, PlanOut, PlanExerciseOut, PlanSetOut
from core.deps import get_current_user

router = APIRouter(prefix="/plans", tags=["plans"])


def _build_out(plan: WorkoutPlan) -> PlanOut:
    exercises = []
    for pe in sorted(plan.exercises, key=lambda x: x.order_index):
        sets = [
            PlanSetOut(
                id=ps.id,
                set_number=ps.set_number,
                planned_weight_kg=ps.planned_weight_kg,
                planned_reps=ps.planned_reps,
            )
            for ps in sorted(pe.sets, key=lambda x: x.set_number)
        ]
        exercises.append(PlanExerciseOut(
            id=pe.id,
            exercise_id=pe.exercise_id,
            exercise_name=pe.exercise.name,
            order_index=pe.order_index,
            sets=sets,
        ))
    return PlanOut(
        id=plan.id,
        name=plan.name,
        description=plan.description,
        created_at=plan.created_at,
        exercises=exercises,
    )


def _fetch_plan(db: Session, plan_id: int, user: User) -> WorkoutPlan:
    plan = (
        db.query(WorkoutPlan)
        .options(
            joinedload(WorkoutPlan.exercises).joinedload(PlanExercise.exercise),
            joinedload(WorkoutPlan.exercises).joinedload(PlanExercise.sets),
        )
        .filter(WorkoutPlan.id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan nie istnieje")
    if plan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")
    return plan


def _save_exercises(db: Session, plan_id: int, exercises_data: list) -> None:
    db.query(PlanExercise).filter(PlanExercise.plan_id == plan_id).delete()
    for ex in exercises_data:
        pe = PlanExercise(
            plan_id=plan_id,
            exercise_id=ex.exercise_id,
            order_index=ex.order_index,
        )
        db.add(pe)
        db.flush()
        for s in ex.sets:
            db.add(PlanSet(
                plan_exercise_id=pe.id,
                set_number=s.set_number,
                planned_weight_kg=s.planned_weight_kg,
                planned_reps=s.planned_reps,
            ))


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = WorkoutPlan(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(plan)
    db.flush()
    _save_exercises(db, plan.id, payload.exercises)
    db.commit()
    return _build_out(_fetch_plan(db, plan.id, current_user))


@router.get("", response_model=list[PlanOut])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = (
        db.query(WorkoutPlan)
        .options(
            joinedload(WorkoutPlan.exercises).joinedload(PlanExercise.exercise),
            joinedload(WorkoutPlan.exercises).joinedload(PlanExercise.sets),
        )
        .filter(WorkoutPlan.user_id == current_user.id)
        .order_by(WorkoutPlan.created_at.desc())
        .all()
    )
    return [_build_out(p) for p in plans]


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _build_out(_fetch_plan(db, plan_id, current_user))


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _fetch_plan(db, plan_id, current_user)
    if payload.name is not None:
        plan.name = payload.name
    if payload.description is not None:
        plan.description = payload.description
    if payload.exercises is not None:
        _save_exercises(db, plan.id, payload.exercises)
    db.commit()
    return _build_out(_fetch_plan(db, plan_id, current_user))


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _fetch_plan(db, plan_id, current_user)
    db.delete(plan)
    db.commit()
