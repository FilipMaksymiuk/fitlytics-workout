from database import SessionLocal
from models.models import User, Exercise, WorkoutSession, WorkoutSet
from datetime import datetime, timezone, timedelta
import random

random.seed(42)

WEIGHTS = [
    80.0, 80.0, 82.5, 82.5, 85.0, 85.0, 85.0,
    87.5, 87.5, 90.0, 90.0, 90.0, 92.5, 92.5,
    95.0, 95.0, 95.0, 97.5, 97.5, 100.0, 100.0,
    100.0, 102.5, 102.5, 105.0, 105.0, 105.0,
    107.5, 107.5, 110.0,
]


def seed_bench_press():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("Brak użytkownika – najpierw utwórz konto w aplikacji")
            return

        bench = db.query(Exercise).filter(Exercise.name == "Bench Press").first()
        if not bench:
            print("Brak ćwiczenia Bench Press – uruchom najpierw seed.py")
            return

        existing = (
            db.query(WorkoutSet)
            .filter(WorkoutSet.exercise_id == bench.id)
            .join(WorkoutSession)
            .filter(WorkoutSession.user_id == user.id)
            .count()
        )
        if existing > 0:
            print(f"Dane Bench Press już istnieją ({existing} setów) – pomijam")
            return

        now = datetime.now(timezone.utc)
        date = now - timedelta(days=89)

        for i, top_weight in enumerate(WEIGHTS):
            session = WorkoutSession(
                user_id=user.id,
                date=date,
                duration_minutes=random.randint(55, 75),
            )
            db.add(session)
            db.flush()

            num_sets = random.choice([3, 3, 4])
            for s in range(num_sets):
                weight = top_weight if s == 0 else top_weight - random.choice([0, 2.5, 5.0])
                reps = random.choice([5, 5, 6]) if s == 0 else random.choice([6, 8, 8, 10])
                db.add(WorkoutSet(
                    workout_session_id=session.id,
                    exercise_id=bench.id,
                    weight_kg=weight,
                    reps=reps,
                    set_number=s + 1,
                ))

            date += timedelta(days=random.choice([2, 2, 3]))

        db.commit()
        print(f"Dodano 30 sesji Bench Press dla użytkownika '{user.username}'")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_bench_press()
