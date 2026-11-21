from fastapi import APIRouter
from typing import List
from models.qrdine import MenuItem
from lib.db import db

router = APIRouter(tags=["menu"])

@router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    cursor = db.menu_items.find({})
    items = await cursor.to_list(length=200)
    return [MenuItem(**i) for i in items]
