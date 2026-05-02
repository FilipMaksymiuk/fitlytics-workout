from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import exists
from database import get_db
from models.models import WorkoutSession, WorkoutSet, User, Exercise
from schemas.session import SessionCreate, SessionEnd, SessionOut, SessionDetailOut, SessionUpdate
from core.deps import get_current_user
from core.utils import fetch_session

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = WorkoutSession(user_id=current_user.id, notes=payload.notes)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/{session_id}/end", response_model=SessionOut)
def end_session(
    session_id: int,
    payload: SessionEnd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = fetch_session(db, session_id, current_user)
    session.duration_minutes = payload.duration_minutes
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[SessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id)
        .filter(exists().where(WorkoutSet.workout_session_id == WorkoutSession.id))
        .order_by(WorkoutSession.date.desc())
        .limit(20)
        .all()
    )


@router.patch("/{session_id}", response_model=SessionOut)
def update_session(
    session_id: int,
    payload: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = fetch_session(db, session_id, current_user)
    if payload.notes is not None:
        session.notes = payload.notes
    if payload.duration_minutes is not None:
        session.duration_minutes = payload.duration_minutes
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = fetch_session(db, session_id, current_user)
    db.delete(session)
    db.commit()


@router.get("/{session_id}", response_model=SessionDetailOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.workout_sets).joinedload(WorkoutSet.exercise))
        .filter(WorkoutSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")
    return session
