from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid
from models.qrdine import Bill, BillLine, SeatLine, EqualPlan, Receipt, SplitPaymentCreate, Payment, PaymentResult, VerifyResult
from lib.db import db

router = APIRouter(tags=["billing"])

async def calculate_bill(session_id: str) -> Bill:
    sess = await db.sessions.find_one({"id": session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    orders = await db.orders.find({"session_id": session_id}).to_list(length=100)
    lines: List[BillLine] = []
    subtotal = 0

    seats_map = {}

    for order in orders:
        kot = order["kot_number"]
        for it in order["items"]:
            line = BillLine(
                kot_number=kot,
                item_id=it["item_id"],
                name=it["name"],
                qty=it["qty"],
                price=it["price"],
                line_total=it["line_total"],
                seat=it["seat"],
                spice=it["spice"],
                addons=it["addons"],
                notes=it["notes"],
            )
            lines.append(line)
            subtotal += it["line_total"]

            s = it["seat"]
            seats_map[s] = seats_map.get(s, 0) + it["line_total"]

    cgst = int(round(subtotal * 0.025))
    sgst = int(round(subtotal * 0.025))
    grand_total = subtotal + cgst + sgst

    # Payments check
    payments = await db.payments.find({"session_id": session_id}).to_list(length=100)
    paid_amount = sum(p["amount"] for p in payments)
    balance = max(0, grand_total - paid_amount)

    paid_seats_set = set(p["seat"] for p in payments if p["mode"] == "by_seat" and p.get("seat") is not None)

    seat_lines = []
    for s_num, s_sub in sorted(seats_map.items()):
        s_gst = int(round(s_sub * 0.05))
        seat_lines.append(SeatLine(
            seat=s_num,
            subtotal=s_sub,
            gst=s_gst,
            total=s_sub + s_gst,
            paid=(s_num in paid_seats_set) or (balance == 0 and grand_total > 0),
        ))

    status = "paid" if (balance == 0 and grand_total > 0) else ("partial" if paid_amount > 0 else "unpaid")

    receipt = None
    if status == "paid":
        receipt_doc = await db.receipts.find_one({"session_id": session_id})
        if receipt_doc:
            receipt = Receipt(**receipt_doc)
        else:
            receipt_code = f"VX-{uuid.uuid4().hex[:4].upper()}"
            receipt = Receipt(
                code=receipt_code,
                session_id=session_id,
                table_id=sess["table_id"],
                amount=grand_total,
                subtotal=subtotal,
                cgst=cgst,
                sgst=sgst,
                items_count=len(lines),
            )
            await db.receipts.insert_one(receipt.model_dump())

    return Bill(
        session_id=session_id,
        table_id=sess["table_id"],
        lines=lines,
        subtotal=subtotal,
        cgst=cgst,
        sgst=sgst,
        grand_total=grand_total,
        paid_amount=paid_amount,
        balance=balance,
        status=status,
        seats=seat_lines,
        receipt=receipt,
    )

@router.get("/bill/{session_id}", response_model=Bill)
async def get_bill(session_id: str):
    return await calculate_bill(session_id)

@router.post("/split-payment", response_model=PaymentResult)
async def make_split_payment(req: SplitPaymentCreate):
    bill = await calculate_bill(req.session_id)
    if bill.balance <= 0:
        return PaymentResult(
            payment=Payment(session_id=req.session_id, mode=req.mode, amount=0),
            bill=bill,
            receipt=bill.receipt,
            complete=True,
        )

    amount = 0
    if req.mode == "by_seat" and req.seat:
        seat = next((s for s in bill.seats if s.seat == req.seat), None)
        if seat:
            amount = seat.total
    elif req.mode == "equal" and req.shares:
        base = bill.grand_total // req.shares
        amount = (bill.grand_total - base * (req.shares - 1)) if req.share_index == req.shares - 1 else base

    amount = min(amount, bill.balance)
    payment = Payment(
        session_id=req.session_id,
        mode=req.mode,
        seat=req.seat,
        share_index=req.share_index,
        shares_total=req.shares,
        amount=amount,
    )
    await db.payments.insert_one(payment.model_dump())

    updated_bill = await calculate_bill(req.session_id)
    return PaymentResult(
        payment=payment,
        bill=updated_bill,
        receipt=updated_bill.receipt,
        complete=updated_bill.balance == 0,
    )

@router.get("/verify/{code}", response_model=VerifyResult)
async def verify_receipt(code: str):
    receipt = await db.receipts.find_one({"code": code.upper()})
    if not receipt:
        raise HTTPException(status_code=404, detail="Invalid verification code")
    return VerifyResult(
        valid=True,
        table_id=receipt["table_id"],
        amount=receipt["amount"],
        items_count=receipt["items_count"],
        paid_at=receipt["created_at"],
    )
