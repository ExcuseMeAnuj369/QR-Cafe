from fastapi import APIRouter
from models.qrdine import StatusCheck
from lib.db import db
from lib.dates import today_iso

router = APIRouter(tags=["common"])

@router.get("/status", response_model=StatusCheck)
async def get_status():
    doc = {"status": "ok", "timestamp": today_iso()}
    return StatusCheck(**doc)
