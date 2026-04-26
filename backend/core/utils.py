from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.models import WorkoutSession, User


def fetch_session(db: Session, session_id: int, user: User) -> WorkoutSession:
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie istnieje")
    if session.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")
    return session
