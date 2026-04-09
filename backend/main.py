from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models.models  # noqa: F401
from routes.auth import router as auth_router
from routes.exercises import router as exercises_router
from routes.sessions import router as sessions_router
from routes.sets import router as sets_router
from routes.progress import router as progress_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitlytics Workout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(exercises_router)
app.include_router(sessions_router)
app.include_router(sets_router)
app.include_router(progress_router)


@app.get("/")
def root():
    return {"message": "Fitlytics API running"}
