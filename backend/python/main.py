import os
import hashlib
import hmac
import secrets
from datetime import datetime, date, timedelta
from calendar import monthrange
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Header, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from database import get_collection
from calculations import (
    days_until_due, rent_status, calculate_penalty,
    prorate_rent, months_between, total_due_for_period,
    lease_time_remaining, generate_due_months
)

app = FastAPI(title="PG Management API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "pg-management-secret-key-change-in-production")

def serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, date):
        return obj.isoformat()
    return obj

def serialize_doc(doc):
    if doc is None:
        return None
    return {k: serialize(v) for k, v in doc.items()}

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{h}"

def verify_password(password: str, stored: str) -> bool:
    salt, h = stored.split(":", 1)
    return hmac.compare_digest(hashlib.sha256((salt + password).encode()).hexdigest(), h)

def create_token(user_id: str) -> str:
    payload = f"{user_id}:{int(datetime.now().timestamp()) + 86400 * 30}"
    sig = hmac.new(JWT_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_token(token: str) -> Optional[str]:
    try:
        parts = token.split(":")
        if len(parts) != 3:
            return None
        user_id, exp_ts, sig = parts
        expected = hmac.new(JWT_SECRET.encode(), f"{user_id}:{exp_ts}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        if int(exp_ts) < datetime.now().timestamp():
            return None
        return user_id
    except:
        return None

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(401, "Not authenticated")
    token = authorization.replace("Bearer ", "")
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(401, "Invalid token")
    return user_id

# ── Models ──

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""
    role: str = "viewer"

class LoginBody(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class PropertyBody(BaseModel):
    title: str
    description: Optional[str] = ""
    price: Optional[float] = 0
    city: Optional[str] = ""
    area: Optional[str] = ""
    pincode: Optional[str] = ""
    propertyType: Optional[str] = "flat"
    bhk: Optional[str] = "1"
    bathrooms: Optional[int] = 1
    areaSize: Optional[float] = 0
    furnishing: Optional[str] = "unfurnished"
    amenities: Optional[list] = []
    images: Optional[list] = []

class RoomBody(BaseModel):
    propertyId: str
    roomNumber: str
    roomType: Optional[str] = "general"
    rentAmount: float
    deposit: Optional[float] = 0
    status: Optional[str] = "vacant"
    floor: Optional[str] = ""

class TenantBody(BaseModel):
    propertyId: str
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    roomId: str
    rentAmount: float
    rentDueDate: int = 1
    leaseStart: Optional[str] = None
    leaseEnd: Optional[str] = None

class PaymentBody(BaseModel):
    propertyId: str
    tenantId: str
    roomId: str
    amount: float
    month: int
    year: int
    paymentMethod: Optional[str] = "cash"
    notes: Optional[str] = ""

class StaffBody(BaseModel):
    propertyId: str
    name: str
    role: str
    phone: Optional[str] = ""
    salary: Optional[float] = 0
    duties: Optional[str] = ""

# ── Auth Routes ──

@app.post("/api/auth/register")
def register(body: RegisterBody):
    users = get_collection("users")
    if users is None:
        raise HTTPException(500, "Database unavailable")
    existing = users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    user = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "phone": body.phone or "",
        "role": body.role or "viewer",
        "isApproved": True,
        "isBlocked": False,
        "createdAt": datetime.utcnow(),
    }
    result = users.insert_one(user)
    token = create_token(str(result.inserted_id))
    return {
        "_id": str(result.inserted_id),
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "role": user["role"],
        "isApproved": user["isApproved"],
        "isBlocked": user["isBlocked"],
        "token": token,
    }

@app.post("/api/auth/login")
def login(body: LoginBody):
    users = get_collection("users")
    if users is None:
        raise HTTPException(500, "Database unavailable")
    user = users.find_one({"email": body.email})
    if not user:
        raise HTTPException(400, "Invalid email or password")
    if not verify_password(body.password, user["password"]):
        raise HTTPException(400, "Invalid email or password")
    if body.role and user["role"] != body.role:
        users.update_one({"_id": user["_id"]}, {"$set": {"role": body.role}})
        user["role"] = body.role
    token = create_token(str(user["_id"]))
    return {
        "_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "profilePic": user.get("profilePic"),
        "role": user["role"],
        "isApproved": user.get("isApproved", True),
        "isBlocked": user.get("isBlocked", False),
        "token": token,
    }

@app.get("/api/auth/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    users = get_collection("users")
    if users is None:
        raise HTTPException(500, "Database unavailable")
    user = users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return serialize_doc(user)

@app.put("/api/auth/profile")
def update_profile(body: dict, user_id: str = Depends(get_current_user)):
    users = get_collection("users")
    if users is None:
        raise HTTPException(500, "Database unavailable")
    allowed = {"name", "phone", "profilePic"}
    updates = {k: v for k, v in body.items() if k in allowed and v is not None}
    if updates:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    user = users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    return serialize_doc(user)

# ── Property Routes ──

@app.get("/api/property")
def get_properties(
    city: Optional[str] = Query(None),
    propertyType: Optional[str] = Query(None),
    bhk: Optional[str] = Query(None),
    maxPrice: Optional[float] = Query(None),
    furnishing: Optional[str] = Query(None),
    sort: Optional[str] = Query("latest"),
    limit: Optional[int] = Query(0),
):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {"status": "published"}
    if city:
        filter_q["city"] = {"$regex": city, "$options": "i"}
    if propertyType:
        filter_q["propertyType"] = {"$in": propertyType.split(",")}
    if bhk:
        filter_q["bhk"] = {"$gte": bhk} if bhk == "5+" else bhk
    if maxPrice:
        filter_q["price"] = {"$lte": maxPrice}
    if furnishing:
        filter_q["furnishing"] = {"$in": furnishing.split(",")}
    sort_q = {"createdAt": -1} if sort == "latest" else {"price": 1 if sort == "priceLow" else -1}
    cursor = props.find(filter_q).sort(list(sort_q.items())).limit(limit or 0)
    properties = [serialize_doc(p) for p in cursor]
    return {"success": True, "properties": properties, "count": len(properties)}

@app.get("/api/property/my-properties")
def get_my_properties(user_id: str = Depends(get_current_user)):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    cursor = props.find({"sellerId": user_id}).sort("createdAt", -1)
    properties = [serialize_doc(p) for p in cursor]
    return {"success": True, "properties": properties}

@app.get("/api/property/{property_id}")
def get_property(property_id: str):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    prop = props.find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(404, "Property not found")
    return {"success": True, "property": serialize_doc(prop)}

@app.post("/api/property")
def create_property(body: PropertyBody, user_id: str = Depends(get_current_user)):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    prop = body.dict()
    prop["sellerId"] = user_id
    prop["status"] = "draft"
    prop["views"] = 0
    prop["createdAt"] = datetime.utcnow()
    result = props.insert_one(prop)
    return {"success": True, "property": serialize_doc(props.find_one({"_id": result.inserted_id}))}

@app.put("/api/property/{property_id}")
def update_property(property_id: str, body: dict, user_id: str = Depends(get_current_user)):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    prop = props.find_one({"_id": ObjectId(property_id)})
    if not prop or prop.get("sellerId") != user_id:
        raise HTTPException(403, "Not authorized")
    allowed = {"title", "description", "price", "city", "area", "pincode", "propertyType", "bhk", "bathrooms", "areaSize", "furnishing", "amenities", "status"}
    updates = {k: v for k, v in body.items() if k in allowed and v is not None}
    if updates:
        props.update_one({"_id": ObjectId(property_id)}, {"$set": updates})
    return {"success": True, "property": serialize_doc(props.find_one({"_id": ObjectId(property_id)}))}

@app.delete("/api/property/{property_id}")
def delete_property(property_id: str, user_id: str = Depends(get_current_user)):
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    prop = props.find_one({"_id": ObjectId(property_id)})
    if not prop or prop.get("sellerId") != user_id:
        raise HTTPException(403, "Not authorized")
    props.delete_one({"_id": ObjectId(property_id)})
    return {"success": True}

@app.get("/api/property/counts")
def get_property_counts():
    props = get_collection("properties")
    if props is None:
        raise HTTPException(500, "Database unavailable")
    pipeline = [{"$match": {"status": "published"}}, {"$group": {"_id": "$propertyType", "count": {"$sum": 1}}}]
    results = props.aggregate(pipeline)
    counts = {r["_id"]: r["count"] for r in results}
    return {"success": True, "counts": counts}

# ── Room Routes ──

@app.get("/api/rooms")
def get_rooms(propertyId: Optional[str] = Query(None)):
    rooms = get_collection("rooms")
    if rooms is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {}
    if propertyId:
        filter_q["propertyId"] = propertyId
    cursor = rooms.find(filter_q).sort("roomNumber", 1)
    return [serialize_doc(r) for r in cursor]

@app.post("/api/rooms")
def create_room(body: RoomBody, user_id: str = Depends(get_current_user)):
    rooms = get_collection("rooms")
    if rooms is None:
        raise HTTPException(500, "Database unavailable")
    room = body.dict()
    room["createdAt"] = datetime.utcnow()
    result = rooms.insert_one(room)
    return serialize_doc(rooms.find_one({"_id": result.inserted_id}))

@app.put("/api/rooms/{room_id}")
def update_room(room_id: str, body: dict, user_id: str = Depends(get_current_user)):
    rooms = get_collection("rooms")
    if rooms is None:
        raise HTTPException(500, "Database unavailable")
    allowed = {"roomNumber", "roomType", "rentAmount", "deposit", "status", "floor"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        rooms.update_one({"_id": ObjectId(room_id)}, {"$set": updates})
    return serialize_doc(rooms.find_one({"_id": ObjectId(room_id)}))

@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: str, user_id: str = Depends(get_current_user)):
    rooms = get_collection("rooms")
    if rooms is None:
        raise HTTPException(500, "Database unavailable")
    rooms.delete_one({"_id": ObjectId(room_id)})
    return {"success": True}

# ── Tenant Routes ──

@app.get("/api/tenants")
def get_tenants(propertyId: Optional[str] = Query(None)):
    tenants = get_collection("tenants")
    if tenants is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {}
    if propertyId:
        filter_q["propertyId"] = propertyId
    cursor = tenants.find(filter_q).sort("name", 1)
    return [serialize_doc(t) for t in cursor]

@app.get("/api/tenants/my-rent")
def get_my_rent(email: Optional[str] = Query(None)):
    tenants = get_collection("tenants")
    payments_coll = get_collection("payments")
    if tenants is None or payments_coll is None:
        raise HTTPException(500, "Database unavailable")
    if not email:
        raise HTTPException(400, "Email is required")
    tenant = tenants.find_one({"email": email, "status": "active"})
    if not tenant:
        raise HTTPException(404, "No active tenancy found for this email")
    payments = list(payments_coll.find({"tenantId": str(tenant["_id"])}).sort("year", -1).sort("month", -1))
    today = date.today()
    due_day = tenant.get("rentDueDate", 1)
    rs = rent_status(due_day)
    penalty = calculate_penalty(tenant.get("rentAmount", 0), rs["days"] if rs["status"] == "overdue" else 0)
    months_occupied = 1
    if tenant.get("leaseStart"):
        ls = datetime.fromisoformat(tenant["leaseStart"])
        months_occupied = max(1, months_between(ls.date(), today) + 1)
    total = total_due_for_period(tenant.get("rentAmount", 0), months_occupied, len(payments))
    lease_info = None
    if tenant.get("leaseEnd"):
        lease_info = lease_time_remaining(datetime.fromisoformat(tenant["leaseEnd"]).date())
    return {
        "tenant": serialize_doc(tenant),
        "payments": [serialize_doc(p) for p in payments],
        "rentStatus": rs,
        "penalty": penalty,
        "totalDue": total,
        "leaseInfo": lease_info,
    }

@app.post("/api/tenants")
def create_tenant(body: TenantBody, user_id: str = Depends(get_current_user)):
    tenants = get_collection("tenants")
    rooms = get_collection("rooms")
    if tenants is None or rooms is None:
        raise HTTPException(500, "Database unavailable")
    tenant = body.dict()
    tenant["status"] = "active"
    tenant["createdAt"] = datetime.utcnow()
    if not tenant.get("leaseStart"):
        tenant["leaseStart"] = datetime.utcnow().isoformat()
    result = tenants.insert_one(tenant)
    rooms.update_one({"_id": ObjectId(tenant["roomId"])}, {"$set": {"status": "occupied"}})
    return serialize_doc(tenants.find_one({"_id": result.inserted_id}))

@app.put("/api/tenants/{tenant_id}")
def update_tenant(tenant_id: str, body: dict, user_id: str = Depends(get_current_user)):
    tenants = get_collection("tenants")
    rooms = get_collection("rooms")
    if tenants is None or rooms is None:
        raise HTTPException(500, "Database unavailable")
    allowed = {"name", "email", "phone", "rentAmount", "rentDueDate", "status", "leaseEnd"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates.get("status") == "left":
        tenant = tenants.find_one({"_id": ObjectId(tenant_id)})
        if tenant and tenant.get("roomId"):
            rooms.update_one({"_id": ObjectId(tenant["roomId"])}, {"$set": {"status": "vacant"}})
    if updates:
        tenants.update_one({"_id": ObjectId(tenant_id)}, {"$set": updates})
    return serialize_doc(tenants.find_one({"_id": ObjectId(tenant_id)}))

@app.delete("/api/tenants/{tenant_id}")
def delete_tenant(tenant_id: str, user_id: str = Depends(get_current_user)):
    tenants = get_collection("tenants")
    if tenants is None:
        raise HTTPException(500, "Database unavailable")
    tenants.delete_one({"_id": ObjectId(tenant_id)})
    return {"success": True}

# ── Payment Routes ──

@app.get("/api/payments")
def get_payments(propertyId: Optional[str] = Query(None), tenantId: Optional[str] = Query(None)):
    payments = get_collection("payments")
    if payments is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {}
    if propertyId:
        filter_q["propertyId"] = propertyId
    if tenantId:
        filter_q["tenantId"] = tenantId
    cursor = payments.find(filter_q).sort("year", -1).sort("month", -1)
    return [serialize_doc(p) for p in cursor]

@app.get("/api/payments/pending")
def get_pending_payments(propertyId: Optional[str] = Query(None)):
    tenants = get_collection("tenants")
    payments = get_collection("payments")
    if tenants is None or payments is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {"status": "active"}
    if propertyId:
        filter_q["propertyId"] = propertyId
    active_tenants = list(tenants.find(filter_q))
    pending = []
    months_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    today = date.today()
    for t in active_tenants:
        ls = t.get("leaseStart")
        if ls:
            ls_date = datetime.fromisoformat(ls).date()
        else:
            ls_date = today - timedelta(days=30)
        total_months = max(1, months_between(ls_date, today) + 2)
        due_months = generate_due_months(ls_date.year, ls_date.month, total_months)
        paid_records = list(payments.find({"tenantId": str(t["_id"])}))
        paid_set = {(p["month"], p["year"]) for p in paid_records}
        for dm in due_months:
            if (dm["month"], dm["year"]) not in paid_set:
                due_date = date(dm["year"], dm["month"], min(t.get("rentDueDate", 1), monthrange(dm["year"], dm["month"])[1]))
                pending.append({
                    "tenantId": str(t["_id"]),
                    "tenantName": t["name"],
                    "tenantPhone": t.get("phone", ""),
                    "month": dm["month"],
                    "year": dm["year"],
                    "monthLabel": f"{months_names[dm['month']-1]} {dm['year']}",
                    "amount": t.get("rentAmount", 0),
                    "dueDate": due_date.isoformat(),
                })
    return pending

@app.post("/api/payments")
def create_payment(body: PaymentBody, user_id: str = Depends(get_current_user)):
    payments = get_collection("payments")
    if payments is None:
        raise HTTPException(500, "Database unavailable")
    payment = body.dict()
    payment["paidDate"] = datetime.utcnow()
    payment["recordedBy"] = user_id
    result = payments.insert_one(payment)
    return serialize_doc(payments.find_one({"_id": result.inserted_id}))

# ── Staff Routes ──

@app.get("/api/staff")
def get_staff(propertyId: Optional[str] = Query(None)):
    staff = get_collection("staff")
    if staff is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {}
    if propertyId:
        filter_q["propertyId"] = propertyId
    cursor = staff.find(filter_q).sort("name", 1)
    return [serialize_doc(s) for s in cursor]

@app.post("/api/staff")
def create_staff(body: StaffBody, user_id: str = Depends(get_current_user)):
    staff = get_collection("staff")
    if staff is None:
        raise HTTPException(500, "Database unavailable")
    s = body.dict()
    s["createdAt"] = datetime.utcnow()
    result = staff.insert_one(s)
    return serialize_doc(staff.find_one({"_id": result.inserted_id}))

@app.put("/api/staff/{staff_id}")
def update_staff(staff_id: str, body: dict, user_id: str = Depends(get_current_user)):
    staff = get_collection("staff")
    if staff is None:
        raise HTTPException(500, "Database unavailable")
    allowed = {"name", "role", "phone", "salary", "duties"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        staff.update_one({"_id": ObjectId(staff_id)}, {"$set": updates})
    return serialize_doc(staff.find_one({"_id": ObjectId(staff_id)}))

@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: str, user_id: str = Depends(get_current_user)):
    staff = get_collection("staff")
    if staff is None:
        raise HTTPException(500, "Database unavailable")
    staff.delete_one({"_id": ObjectId(staff_id)})
    return {"success": True}

# ── Notification Routes ──

@app.get("/api/notifications")
def get_notifications(user_id: str = Depends(get_current_user)):
    tenants = get_collection("tenants")
    properties = get_collection("properties")
    payments = get_collection("payments")
    if tenants is None or properties is None or payments is None:
        raise HTTPException(500, "Database unavailable")
    my_props = list(properties.find({"sellerId": user_id}))
    prop_ids = [str(p["_id"]) for p in my_props]
    active_tenants = list(tenants.find({"propertyId": {"$in": prop_ids}, "status": "active"}))
    today = date.today()
    months_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    overdue = []
    due_soon = []
    vacant_rooms = []
    for t in active_tenants:
        due_day = t.get("rentDueDate", 1)
        rs = rent_status(due_day)
        if rs["status"] == "overdue":
            overdue.append({"tenantName": t["name"], "days": rs["days"], "amount": t.get("rentAmount", 0)})
        elif rs["status"] == "due_soon":
            due_soon.append({"tenantName": t["name"], "days": rs["days"], "amount": t.get("rentAmount", 0)})
    rooms_coll = get_collection("rooms")
    if rooms_coll:
        for pid in prop_ids:
            vacants = rooms_coll.count_documents({"propertyId": pid, "status": "vacant"})
            if vacants > 0:
                prop = next((p for p in my_props if str(p["_id"]) == pid), None)
                vacant_rooms.append({"propertyName": prop["title"] if prop else "Unknown", "count": vacants})
    return {
        "counts": {
            "overdue": len(overdue),
            "dueSoon": len(due_soon),
            "vacantRooms": sum(v["count"] for v in vacant_rooms),
        },
        "overdue": overdue,
        "dueSoon": due_soon,
        "vacantRooms": vacant_rooms,
    }

# ── Reports Routes ──

@app.get("/api/reports/occupancy")
def get_occupancy(propertyId: Optional[str] = Query(None)):
    rooms_col = get_collection("rooms")
    if rooms_col is None:
        raise HTTPException(500, "Database unavailable")
    filter_q = {}
    if propertyId:
        filter_q["propertyId"] = propertyId
    total = rooms_col.count_documents(filter_q)
    occupied = rooms_col.count_documents({**filter_q, "status": "occupied"})
    vacant = total - occupied
    rate = round(occupied / total * 100, 1) if total > 0 else 0
    return {"total": total, "occupied": occupied, "vacant": vacant, "occupancyRate": rate}

@app.get("/api/reports/revenue")
def get_revenue(propertyId: Optional[str] = Query(None), year: Optional[int] = Query(None)):
    payments_col = get_collection("payments")
    if payments_col is None:
        return {"months": [], "total": 0}
    yr = year or datetime.now().year
    filter_q = {"year": yr}
    if propertyId:
        filter_q["propertyId"] = propertyId
    pipeline = [
        {"$match": filter_q},
        {"$group": {"_id": "$month", "total": {"$sum": "$amount"}}},
        {"$sort": {"_id": 1}},
    ]
    results = list(payments_col.aggregate(pipeline))
    months_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    months_data = []
    total_rev = 0
    for r in results:
        m = r["_id"]
        months_data.append({"month": months_names[m - 1], "total": round(r["total"], 2)})
        total_rev += r["total"]
    return {"months": months_data, "total": round(total_rev, 2)}

@app.get("/api/reports/rent-collection")
def get_rent_collection(propertyId: Optional[str] = Query(None), month: Optional[int] = Query(None), year: Optional[int] = Query(None)):
    tenants_col = get_collection("tenants")
    payments_col = get_collection("payments")
    if tenants_col is None or payments_col is None:
        return {"expected": 0, "collected": 0, "pending": 0, "rate": 0}
    filter_q = {"status": "active"}
    if propertyId:
        filter_q["propertyId"] = propertyId
    m = month or datetime.now().month
    y = year or datetime.now().year
    active = list(tenants_col.find(filter_q))
    expected = sum(t.get("rentAmount", 0) for t in active)
    paid_payments = list(payments_col.find({"month": m, "year": y}))
    collected = sum(p.get("amount", 0) for p in paid_payments)
    pending = expected - collected
    rate = round(collected / expected * 100, 1) if expected > 0 else 0
    return {"expected": round(expected, 2), "collected": round(collected, 2), "pending": round(pending, 2), "collectionRate": rate}

# ── Admin Routes ──

def admin_required(user_id: str = Depends(get_current_user)):
    users = get_collection("users")
    if users is None:
        raise HTTPException(500, "Database unavailable")
    user = users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user_id

@app.get("/api/admin/stats")
def admin_stats(user_id: str = Depends(admin_required)):
    users_col = get_collection("users")
    props_col = get_collection("properties")
    tenants_col = get_collection("tenants")
    payments_col = get_collection("payments")
    return {
        "totalUsers": users_col.count_documents({}) if users_col else 0,
        "totalProperties": props_col.count_documents({}) if props_col else 0,
        "totalTenants": tenants_col.count_documents({}) if tenants_col else 0,
        "totalRevenue": round(sum(p.get("amount", 0) for p in (payments_col.find({}) if payments_col else [])), 2),
    }

@app.get("/api/admin/users")
def admin_users(user_id: str = Depends(admin_required)):
    users_col = get_collection("users")
    if users_col is None:
        raise HTTPException(500, "Database unavailable")
    cursor = users_col.find({}, {"password": 0}).sort("createdAt", -1)
    return [serialize_doc(u) for u in cursor]

@app.put("/api/admin/users/{uid}")
def admin_update_user(uid: str, body: dict, user_id: str = Depends(admin_required)):
    users_col = get_collection("users")
    if users_col is None:
        raise HTTPException(500, "Database unavailable")
    allowed = {"role", "isApproved", "isBlocked"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        users_col.update_one({"_id": ObjectId(uid)}, {"$set": updates})
    return {"success": True}

@app.delete("/api/admin/users/{uid}")
def admin_delete_user(uid: str, user_id: str = Depends(admin_required)):
    users_col = get_collection("users")
    if users_col is None:
        raise HTTPException(500, "Database unavailable")
    users_col.delete_one({"_id": ObjectId(uid)})
    return {"success": True}

# ── Inquiry Routes ──

@app.post("/api/inquiry")
def create_inquiry(body: dict):
    inquiries = get_collection("inquiries")
    if inquiries is None:
        raise HTTPException(500, "Database unavailable")
    body["createdAt"] = datetime.utcnow()
    inquiries.insert_one(body)
    return {"success": True, "message": "Inquiry sent"}

@app.post("/api/contact")
def create_contact(body: dict):
    inquiries = get_collection("inquiries")
    if inquiries is None:
        raise HTTPException(500, "Database unavailable")
    body["createdAt"] = datetime.utcnow()
    inquiries.insert_one(body)
    return {"success": True, "message": "Message sent"}

# ── Health Check ──

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# ── Start ──

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting PG Management Python API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
