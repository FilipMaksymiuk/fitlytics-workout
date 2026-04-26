import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, inspect as sa_inspect
from database import Base, engine
import models.models  # noqa: F401
from routes.auth import router as auth_router
from routes.exercises import router as exercises_router
from routes.sessions import router as sessions_router
from routes.sets import router as sets_router
from routes.progress import router as progress_router
from routes.plans import router as plans_router
from routes.users import router as users_router


def _migrate():
    try:
        cols = {c["name"] for c in sa_inspect(engine).get_columns("workout_plans")}
        with engine.begin() as conn:
            for col in ("planned_date", "deadline", "is_completed"):
                if col in cols:
                    conn.execute(text(f"ALTER TABLE workout_plans DROP COLUMN {col}"))
    except Exception:
        logging.exception("Schema migration failed")


_migrate()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitlytics Workout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(exercises_router)
app.include_router(sessions_router)
app.include_router(sets_router)
app.include_router(progress_router)
app.include_router(plans_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {"message": "Fitlytics API running"}
