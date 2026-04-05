from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models.models  # noqa: F401
from routes.auth import router as auth_router

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


@app.get("/")
def root():
    return {"message": "Fitlytics API running"}
