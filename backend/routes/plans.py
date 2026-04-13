from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import WorkoutPlan, User
from schemas.plan import PlanCreate, PlanUpdate, PlanOut
from core.deps import get_current_user

router = APIRouter(prefix="/plans", tags=["plans"])


def _to_plan_out(plan: WorkoutPlan) -> PlanOut:
    now = datetime.now(timezone.utc)
    deadline = plan.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    is_overdue = deadline < now and not plan.is_completed
    return PlanOut(
        id=plan.id,
        name=plan.name,
        description=plan.description,
        planned_date=plan.planned_date,
        deadline=plan.deadline,
        is_completed=plan.is_completed,
        created_at=plan.created_at,
        is_overdue=is_overdue,
    )


def _fetch_plan(db: Session, plan_id: int, user: User) -> WorkoutPlan:
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan nie istnieje")
    if plan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")
    return plan


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
        planned_date=payload.planned_date,
        deadline=payload.deadline,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _to_plan_out(plan)


@router.get("", response_model=list[PlanOut])
def list_plans(
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == current_user.id)
    if not include_completed:
        query = query.filter(WorkoutPlan.is_completed == False)  # noqa: E712
    plans = query.order_by(WorkoutPlan.planned_date.asc()).all()
    return [_to_plan_out(p) for p in plans]


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _fetch_plan(db, plan_id, current_user)
    if payload.planned_date is not None:
        plan.planned_date = payload.planned_date
    if payload.deadline is not None:
        plan.deadline = payload.deadline
    if payload.is_completed is not None:
        plan.is_completed = payload.is_completed
    db.commit()
    db.refresh(plan)
    return _to_plan_out(plan)


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _fetch_plan(db, plan_id, current_user)
    db.delete(plan)
    db.commit()
    return {"message": "Usunięto"}
