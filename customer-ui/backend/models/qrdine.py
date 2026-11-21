from typing import List, Optional, Literal
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

Lang = Literal["en", "hi", "mr"]
MenuCategory = Literal["starters", "mains", "breads", "drinks", "desserts", "kids"]
SpiceLevel = Literal["mild", "medium", "hot", "extrahot"]
OrderStatus = Literal["placed", "preparing", "ready", "served"]
ServiceType = Literal["water", "napkin", "bowl", "spoon", "waiter", "highchair", "clean"]

class LocalizedText(BaseModel):
    en: str
    hi: str
    mr: str

class Addon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: LocalizedText
    price: int  # paise

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: LocalizedText
    desc: LocalizedText
    price: int  # paise
    category: MenuCategory
    veg: bool = True
    image: str
    stock: Optional[int] = None
    sold_out: bool = False
    spice_allowed: bool = False
    tags: List[str] = Field(default_factory=list)
    addons: List[Addon] = Field(default_factory=list)

class QRDSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    table_id: str
    group_id: Optional[str] = None
    language: Lang = "en"
    status: str = "active"  # active | paid | expired
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str

class OrderItemIn(BaseModel):
    item_id: str
    qty: int = Field(gt=0)
    spice: Optional[SpiceLevel] = None
    addon_ids: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    seat: int = 1

class OrderItem(BaseModel):
    item_id: str
    name: LocalizedText
    qty: int
    price: int
    spice: Optional[SpiceLevel] = None
    addons: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    seat: int
    line_total: int

class StatusEvent(BaseModel):
    status: str
    at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RejectedItem(BaseModel):
    item_id: str
    name: str
    reason: str

class OrderCreate(BaseModel):
    session_id: str
    idempotency_key: str
    items: List[OrderItemIn]

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kot_number: str
    session_id: str
    table_id: str
    group_id: Optional[str] = None
    items: List[OrderItem]
    subtotal: int
    status: OrderStatus = "placed"
    status_history: List[StatusEvent] = Field(default_factory=list)
    prep_seconds: int = 480
    warnings: List[str] = Field(default_factory=list)
    rejected: List[RejectedItem] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServiceRequestCreate(BaseModel):
    session_id: str
    type: ServiceType

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    table_id: str
    type: ServiceType
    status: Literal["pending", "acknowledged", "resolved"] = "pending"
    sla_deadline: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BillLine(BaseModel):
    kot_number: str
    item_id: str
    name: LocalizedText
    qty: int
    price: int
    line_total: int
    seat: int
    spice: Optional[str] = None
    addons: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class SeatLine(BaseModel):
    seat: int
    subtotal: int
    gst: int
    total: int
    paid: bool = False

class EqualPlan(BaseModel):
    shares: int
    shares_paid: int = 0
    share_amount: int

class Receipt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    session_id: str
    table_id: str
    amount: int
    subtotal: int
    cgst: int
    sgst: int
    items_count: int
    whatsapp_number: str = "+91 98765 43210"
    whatsapp_status: str = "sent"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Bill(BaseModel):
    session_id: str
    table_id: str
    lines: List[BillLine] = Field(default_factory=list)
    subtotal: int = 0
    cgst: int = 0
    sgst: int = 0
    grand_total: int = 0
    paid_amount: int = 0
    balance: int = 0
    status: Literal["unpaid", "partial", "paid"] = "unpaid"
    seats: List[SeatLine] = Field(default_factory=list)
    equal: Optional[EqualPlan] = None
    receipt: Optional[Receipt] = None

class SplitPaymentCreate(BaseModel):
    session_id: str
    mode: Literal["equal", "by_seat"]
    seat: Optional[int] = None
    shares: Optional[int] = None
    share_index: Optional[int] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    mode: Literal["equal", "by_seat"]
    seat: Optional[int] = None
    share_index: Optional[int] = None
    shares_total: Optional[int] = None
    amount: int
    status: str = "completed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentResult(BaseModel):
    payment: Payment
    bill: Bill
    receipt: Optional[Receipt] = None
    complete: bool

class VerifyResult(BaseModel):
    valid: bool
    table_id: str
    amount: int
    items_count: int
    paid_at: str

class ScanRequest(BaseModel):
    table_id: str
    token: str
    language: Lang = "en"

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "ok"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
