from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from models.qrdine import ScanRequest, QRDSession, Lang
from lib.db import db
import uuid

router = APIRouter(tags=["sessions"])

@router.post("/session/scan", response_model=QRDSession)
async def scan_session(req: ScanRequest):
    # Verify table or token (demo token tok-t04-demo or active table)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=4)
    session_code = f"SES-{uuid.uuid4().hex[:6].upper()}"

    session = QRDSession(
        code=session_code,
        table_id=req.table_id,
        language=req.language,
        status="active",
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )
    await db.sessions.insert_one(session.model_dump())
    return session

@router.get("/session/{session_id}", response_model=QRDSession)
async def get_session(session_id: str):
    sess = await db.sessions.find_one({"id": session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return QRDSession(**sess)

@router.patch("/session/{session_id}", response_model=QRDSession)
async def update_session_lang(session_id: str, payload: dict):
    new_lang = payload.get("language")
    if new_lang:
        await db.sessions.update_one({"id": session_id}, {"$set": {"language": new_lang}})
    sess = await db.sessions.find_one({"id": session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return QRDSession(**sess)
