import logging
import os
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
        plan_cols = {c["name"] for c in sa_inspect(engine).get_columns("workout_plans")}
        with engine.begin() as conn:
            for col in ("planned_date", "deadline", "is_completed"):
                if col in plan_cols:
                    conn.execute(text(f"ALTER TABLE workout_plans DROP COLUMN {col}"))

        ex_cols = {c["name"] for c in sa_inspect(engine).get_columns("exercises")}
        with engine.begin() as conn:
            if "user_id" not in ex_cols:
                conn.execute(text("ALTER TABLE exercises ADD COLUMN user_id INT NULL"))
                conn.execute(text("ALTER TABLE exercises ADD CONSTRAINT fk_exercises_user FOREIGN KEY (user_id) REFERENCES users(id)"))

        indexes = sa_inspect(engine).get_indexes("exercises")
        for idx in indexes:
            if "name" in idx["column_names"] and idx.get("unique", False):
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE exercises DROP INDEX `{idx['name']}`"))
                break
    except Exception:
        logging.exception("Schema migration failed")


_migrate()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitlytics Workout API")

_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
