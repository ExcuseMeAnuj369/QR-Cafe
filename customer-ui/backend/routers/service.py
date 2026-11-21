from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timedelta, timezone
from models.qrdine import ServiceRequest, ServiceRequestCreate
from lib.db import db

router = APIRouter(tags=["service"])

@router.post("/service-request", response_model=ServiceRequest)
async def create_service_request(req: ServiceRequestCreate):
    sess = await db.sessions.find_one({"id": req.session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    # Anti-spam check: 180s cooldown for same type
    now = datetime.now(timezone.utc)
    active = await db.service_requests.find_one({
        "session_id": req.session_id,
        "type": req.type,
        "status": {"$ne": "resolved"}
    })
    if active:
        deadline = datetime.fromisoformat(active["sla_deadline"])
        remaining = max(0, int((deadline - now).total_seconds()))
        raise HTTPException(status_code=429, detail={"retry_after": remaining})

    deadline = now + timedelta(seconds=180)
    service_req = ServiceRequest(
        session_id=req.session_id,
        table_id=sess["table_id"],
        type=req.type,
        status="pending",
        sla_deadline=deadline.isoformat(),
        created_at=now.isoformat(),
    )
    await db.service_requests.insert_one(service_req.model_dump())
    return service_req

@router.get("/service-requests/{session_id}", response_model=List[ServiceRequest])
async def list_service_requests(session_id: str):
    cursor = db.service_requests.find({"session_id": session_id}).sort("created_at", -1)
    reqs = await cursor.to_list(length=50)
    return [ServiceRequest(**r) for r in reqs]
