import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from routers import common, sessions, menu, orders, service, billing

app = FastAPI(title="QR DINE Backend", version="1.0.0")

# Setup CORS
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in cors_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router with prefix "/api"
api_router = APIRouter(prefix="/api")
api_router.include_router(common.router)
api_router.include_router(sessions.router)
api_router.include_router(menu.router)
api_router.include_router(orders.router)
api_router.include_router(service.router)
api_router.include_router(billing.router)

# Mount the unified API router on the FastAPI app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
