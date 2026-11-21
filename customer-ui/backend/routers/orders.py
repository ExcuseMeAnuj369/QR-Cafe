from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone
from models.qrdine import Order, OrderCreate, OrderItem, StatusEvent, RejectedItem
from lib.db import db
import uuid

router = APIRouter(tags=["orders"])

@router.post("/order", response_model=Order)
async def create_order(req: OrderCreate):
    sess = await db.sessions.find_one({"id": req.session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check idempotency
    existing = await db.orders.find_one({"idempotency_key": req.idempotency_key})
    if existing:
        return Order(**existing)

    # Count existing KOTs
    count = await db.orders.count_documents({"session_id": req.session_id})
    kot_number = f"KOT-{count + 1:02d}"

    order_items: List[OrderItem] = []
    rejected: List[RejectedItem] = []
    subtotal = 0

    for item_in in req.items:
        menu_item = await db.menu_items.find_one({"id": item_in.item_id})
        if not menu_item or menu_item.get("sold_out"):
            rejected.append(RejectedItem(
                item_id=item_in.item_id,
                name=menu_item["name"]["en"] if menu_item else "Unknown",
                reason="sold_out"
            ))
            continue

        addons_cost = 0
        addon_names = []
        addon_dict = {a["id"]: a for a in menu_item.get("addons", [])}
        for aid in item_in.addon_ids:
            if aid in addon_dict:
                addons_cost += addon_dict[aid]["price"]
                addon_names.append(addon_dict[aid]["name"]["en"])

        unit_price = menu_item["price"] + addons_cost
        line_total = unit_price * item_in.qty
        subtotal += line_total

        order_items.append(OrderItem(
            item_id=item_in.item_id,
            name=menu_item["name"],
            qty=item_in.qty,
            price=unit_price,
            spice=item_in.spice,
            addons=addon_names,
            notes=item_in.notes,
            seat=item_in.seat,
            line_total=line_total,
        ))

        # Decrement stock if finite
        if menu_item.get("stock") is not None:
            new_stock = max(0, menu_item["stock"] - item_in.qty)
            await db.menu_items.update_one({"id": item_in.item_id}, {"$set": {"stock": new_stock}})

    order = Order(
        kot_number=kot_number,
        session_id=req.session_id,
        table_id=sess["table_id"],
        items=order_items,
        subtotal=subtotal,
        status="placed",
        status_history=[StatusEvent(status="placed")],
        prep_seconds=480,
        rejected=rejected,
    )

    doc = order.model_dump()
    doc["idempotency_key"] = req.idempotency_key
    await db.orders.insert_one(doc)
    return order

@router.get("/orders/{session_id}", response_model=List[Order])
async def get_orders(session_id: str):
    cursor = db.orders.find({"session_id": session_id}).sort("created_at", 1)
    orders = await cursor.to_list(length=100)
    return [Order(**o) for o in orders]
