# fitlytics-workout

Web app for tracking gym progress. Log workouts, track weights and reps, visualize progress over time.

**Stack:** Python 3.14 · FastAPI · SQLAlchemy 2.0 · MySQL · Pydantic v2 · Vue/Vite (planned)

---

## Features

- JWT authentication (register, login)
- Exercise library with primary/secondary muscle group tagging
- Workout session management — start, log sets, end session
- Per-set tracking: weight, reps, duration, distance
- Progress history per exercise — max weight, total volume, best reps
- Personal records — lifetime best weight per exercise
- Weekly training volume with muscle group breakdown
- Monthly training calendar

---

## Getting started

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example`, then:

```bash
python seed.py
uvicorn main:app --reload
```

API at `http://localhost:8000` · Docs at `http://localhost:8000/docs`
