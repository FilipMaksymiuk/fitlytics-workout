from database import SessionLocal
from models.models import MuscleGroup, Exercise, ExerciseMuscle

MUSCLE_GROUPS = [
    "Klatka", "Biceps", "Triceps", "Plecy",
    "Barki", "Nogi", "Pośladki", "Brzuch", "Łydki",
]

EXERCISES = [
    # Siłowe / Sztanga
    ("Bench Press",       "Siłowe", "Sztanga",      [("Klatka", True), ("Triceps", False), ("Barki", False)]),
    ("Squat",             "Siłowe", "Sztanga",      [("Nogi", True), ("Pośladki", False)]),
    ("Deadlift",          "Siłowe", "Sztanga",      [("Plecy", True), ("Nogi", False), ("Pośladki", False)]),
    ("Overhead Press",    "Siłowe", "Sztanga",      [("Barki", True), ("Triceps", False)]),
    ("Barbell Row",       "Siłowe", "Sztanga",      [("Plecy", True), ("Biceps", False)]),
    ("Romanian Deadlift", "Siłowe", "Sztanga",      [("Pośladki", True), ("Nogi", False)]),
    # Siłowe / Hantle
    ("Dumbbell Curl",     "Siłowe", "Hantle",       [("Biceps", True)]),
    ("Dumbbell Press",    "Siłowe", "Hantle",       [("Klatka", True), ("Barki", False), ("Triceps", False)]),
    ("Lateral Raise",     "Siłowe", "Hantle",       [("Barki", True)]),
    ("Dumbbell Row",      "Siłowe", "Hantle",       [("Plecy", True), ("Biceps", False)]),
    # Siłowe / Maszyna
    ("Triceps Pushdown",  "Siłowe", "Maszyna",      [("Triceps", True)]),
    ("Leg Press",         "Siłowe", "Maszyna",      [("Nogi", True), ("Pośladki", False)]),
    ("Leg Curl",          "Siłowe", "Maszyna",      [("Nogi", True)]),
    ("Leg Extension",     "Siłowe", "Maszyna",      [("Nogi", True)]),
    ("Cable Row",         "Siłowe", "Maszyna",      [("Plecy", True), ("Biceps", False)]),
    # Siłowe / Własne ciało
    ("Pull-up",           "Siłowe", "Własne ciało", [("Plecy", True), ("Biceps", False)]),
    ("Dip",               "Siłowe", "Własne ciało", [("Triceps", True), ("Klatka", False)]),
    ("Push-up",           "Siłowe", "Własne ciało", [("Klatka", True), ("Triceps", False), ("Barki", False)]),
    ("Plank",             "Siłowe", "Własne ciało", [("Brzuch", True)]),
    # Cardio / Własne ciało
    ("Running",           "Cardio", "Własne ciało", [("Nogi", True), ("Łydki", False)]),
    ("Cycling",           "Cardio", "Własne ciało", [("Nogi", True), ("Pośladki", False)]),
]


def seed():
    db = SessionLocal()
    try:
        existing_muscles = {mg.name for mg in db.query(MuscleGroup).all()}
        new_muscles = [MuscleGroup(name=name) for name in MUSCLE_GROUPS if name not in existing_muscles]
        db.add_all(new_muscles)
        db.flush()

        muscle_map = {mg.name: mg.id for mg in db.query(MuscleGroup).all()}

        existing_exercises = {ex.name for ex in db.query(Exercise).all()}
        added_exercises = 0

        for name, category, equipment, muscles in EXERCISES:
            if name in existing_exercises:
                continue

            exercise = Exercise(name=name, category=category, equipment=equipment)
            db.add(exercise)
            db.flush()

            for muscle_name, is_primary in muscles:
                db.add(ExerciseMuscle(
                    exercise_id=exercise.id,
                    muscle_group_id=muscle_map[muscle_name],
                    is_primary=is_primary,
                ))

            added_exercises += 1

        db.commit()
        added_muscles = len(new_muscles)
        print(f"Seed zakończony – dodano {added_exercises} ćwiczeń i {added_muscles} partii mięśniowych")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
