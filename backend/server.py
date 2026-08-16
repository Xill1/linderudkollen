from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Depends, Query
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Object Storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "linderudkollen"
storage_key = None

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ── Password helpers ──
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# ── JWT helpers ──
def create_access_token(user_id: str, username: str) -> str:
    return jwt.encode(
        {"sub": user_id, "username": username, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

def create_refresh_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

# ── Auth dependency ──
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _protected_admin_username() -> str:
    return os.environ.get("ADMIN_USERNAME", "admin").lower()

# ── Activity log helper ──
async def log_activity(user: dict, action: str, target: str = ""):
    await db.activity_log.insert_one({
        "id": str(uuid.uuid4()),
        "username": user.get("username", ""),
        "name": user.get("name", ""),
        "action": action,
        "target": target,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

# ── Object Storage helpers ──
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Pydantic models ──
class LoginRequest(BaseModel):
    username: str
    password: str

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

class OpeningHoursUpdate(BaseModel):
    period: str
    schedule: list
    notices: list
    footer_note: str

class GalleryItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class MenuItemCreate(BaseModel):
    category: str
    name: str
    description: str = ""
    price: Optional[float] = None
    is_available: bool = True
    sort_order: int = 0
    allergens: Optional[List[str]] = []

class MenuItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    sort_order: Optional[int] = None
    allergens: Optional[List[str]] = None

class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0
    icon: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    icon: Optional[str] = None

class ReorderItem(BaseModel):
    id: str
    sort_order: int

class ReorderRequest(BaseModel):
    items: List[ReorderItem]

class UserCreate(BaseModel):
    username: str
    password: str
    name: str = ""
    role: str = "admin"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None

class ReservationCreate(BaseModel):
    name: str
    phone: str
    email: str
    date: str
    time: str
    guests: int
    message: str = ""

class ReservationStatusUpdate(BaseModel):
    status: str

class BlogPostCreate(BaseModel):
    title: str
    body: str
    is_published: bool = False
    category: Optional[str] = "Nyheter"

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    is_published: Optional[bool] = None
    category: Optional[str] = None

# ══════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    username = req.username.lower().strip()
    user = await db.users.find_one({"username": username})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ugyldig brukernavn eller passord")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, username)
    refresh_token = create_refresh_token(user_id)
    
    is_prod = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_prod, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_prod, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "username": user["username"], "name": user.get("name", ""), "role": user.get("role", "user"), "token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logget ut"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ══════════════════════════════════════
# GALLERY ROUTES (public read, admin write)
# ══════════════════════════════════════

@api_router.get("/gallery")
async def get_gallery():
    items = await db.gallery.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.post("/gallery/upload")
async def upload_gallery_image(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin kan laste opp bilder")
    
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Kun bilder (JPEG, PNG, WebP, GIF) er tillatt")
    
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maks filstørrelse er 10MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/gallery/{file_id}.{ext}"
    
    result = put_object(path, data, file.content_type)
    
    doc = {
        "id": file_id,
        "title": title or file.filename,
        "description": description,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gallery.insert_one(doc)
    doc.pop("_id", None)
    await log_activity(user, "Lastet opp galleribilde", doc["title"])
    return doc

@api_router.delete("/gallery/{item_id}")
async def delete_gallery_image(item_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin kan slette bilder")
    result = await db.gallery.update_one({"id": item_id}, {"$set": {"is_deleted": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Bilde ikke funnet")
    await log_activity(user, "Slettet galleribilde", item_id)
    return {"message": "Bilde slettet"}

@api_router.get("/gallery/image/{item_id}")
async def serve_gallery_image(item_id: str):
    record = await db.gallery.find_one({"id": item_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Bilde ikke funnet")
    data, ct = get_object(record["storage_path"])
    return Response(content=data, media_type=record.get("content_type", ct))

# ══════════════════════════════════════
# CONTACT ROUTES
# ══════════════════════════════════════

@api_router.post("/contact")
async def submit_contact(req: ContactRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "email": req.email,
        "message": req.message,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    return {"message": "Meldingen din er sendt! Vi svarer så fort vi kan."}

@api_router.get("/contact/messages")
async def get_contact_messages(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return messages

@api_router.patch("/contact/messages/{msg_id}/read")
async def mark_message_read(msg_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    await db.contact_messages.update_one({"id": msg_id}, {"$set": {"is_read": True}})
    return {"message": "Merket som lest"}

# ══════════════════════════════════════
# OPENING HOURS ROUTES
# ══════════════════════════════════════

@api_router.get("/opening-hours")
async def get_opening_hours():
    doc = await db.opening_hours.find_one({"id": "current"}, {"_id": 0})
    if not doc:
        return {
            "id": "current",
            "period": "16.02.2026 — 21.06.2026",
            "schedule": [
                {"day": "Mandag", "hours": "Stengt", "closed": True},
                {"day": "Tirsdag", "hours": "10:00 — 20:00", "closed": False},
                {"day": "Onsdag", "hours": "10:00 — 20:00", "closed": False},
                {"day": "Torsdag", "hours": "10:00 — 20:00", "closed": False},
                {"day": "Fredag", "hours": "10:00 — 20:00", "closed": False},
                {"day": "Lørdag", "hours": "10:00 — 16:00", "closed": False},
                {"day": "Søndag", "hours": "10:00 — 16:00", "closed": False},
            ],
            "notices": [
                "For oppdaterte åpningstider, sjekk vår Facebook-side",
                "Kveldsåpent tirsdag til fredag med utvidede tider",
                "Helårsvei med stor parkeringsplass",
            ],
            "footer_note": "Sjekk Facebook for eventuelle endringer i åpningstider"
        }
    return doc

@api_router.put("/opening-hours")
async def update_opening_hours(req: OpeningHoursUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    doc = {
        "id": "current",
        "period": req.period,
        "schedule": req.schedule,
        "notices": req.notices,
        "footer_note": req.footer_note,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.opening_hours.update_one({"id": "current"}, {"$set": doc}, upsert=True)
    await log_activity(user, "Oppdaterte åpningstider")
    return {"message": "Åpningstider oppdatert"}

# ══════════════════════════════════════
# MENU ROUTES
# ══════════════════════════════════════

@api_router.get("/menu")
async def get_menu():
    items = await db.menu_items.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("sort_order", 1).to_list(200)
    # Group by category
    categories = {}
    for item in items:
        cat = item.get("category", "Annet")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)
    return {"items": items, "categories": categories}

@api_router.post("/menu")
async def create_menu_item(req: MenuItemCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    doc = {
        "id": str(uuid.uuid4()),
        "category": req.category,
        "name": req.name,
        "description": req.description,
        "price": req.price,
        "is_available": req.is_available,
        "sort_order": req.sort_order,
        "allergens": req.allergens or [],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.menu_items.insert_one(doc)
    doc.pop("_id", None)
    await log_activity(user, "La til meny-vare", req.name)
    return doc

@api_router.put("/menu/reorder")
async def reorder_menu_items(req: ReorderRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    for item in req.items:
        await db.menu_items.update_one({"id": item.id}, {"$set": {"sort_order": item.sort_order}})
    await log_activity(user, "Omorganiserte meny-varer")
    return {"message": "Varer omorganisert"}

@api_router.put("/menu/{item_id}")
async def update_menu_item(item_id: str, req: MenuItemUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.menu_items.update_one({"id": item_id, "is_deleted": {"$ne": True}}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vare ikke funnet")
    await log_activity(user, "Oppdaterte meny-vare", update.get("name", item_id))
    return {"message": "Vare oppdatert"}

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = await db.menu_items.update_one({"id": item_id}, {"$set": {"is_deleted": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vare ikke funnet")
    await log_activity(user, "Slettet meny-vare", item_id)
    return {"message": "Vare slettet"}

# ══════════════════════════════════════
# MENU CATEGORIES ROUTES
# ══════════════════════════════════════

@api_router.get("/menu/categories")
async def get_menu_categories():
    cats = await db.menu_categories.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return cats

@api_router.post("/menu/categories")
async def create_menu_category(req: CategoryCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    existing = await db.menu_categories.find_one({"name": req.name, "is_deleted": {"$ne": True}})
    if existing:
        raise HTTPException(status_code=400, detail="Kategori finnes allerede")
    doc = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "sort_order": req.sort_order,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.menu_categories.insert_one(doc)
    doc.pop("_id", None)
    await log_activity(user, "La til kategori", req.name)
    return doc

@api_router.put("/menu/categories/reorder")
async def reorder_categories(req: ReorderRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    for item in req.items:
        await db.menu_categories.update_one({"id": item.id}, {"$set": {"sort_order": item.sort_order}})
    await log_activity(user, "Omorganiserte kategorier")
    return {"message": "Kategorier omorganisert"}

@api_router.put("/menu/categories/{cat_id}")
async def update_menu_category(cat_id: str, req: CategoryUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Ingen endringer")
    result = await db.menu_categories.update_one({"id": cat_id, "is_deleted": {"$ne": True}}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kategori ikke funnet")
    await log_activity(user, "Oppdaterte kategori", update.get("name", cat_id))
    return {"message": "Kategori oppdatert"}

@api_router.delete("/menu/categories/{cat_id}")
async def delete_menu_category(cat_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = await db.menu_categories.update_one({"id": cat_id}, {"$set": {"is_deleted": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Kategori ikke funnet")
    await log_activity(user, "Slettet kategori", cat_id)
    return {"message": "Kategori slettet"}

# ══════════════════════════════════════
# MENU EXPORT / IMPORT
# ══════════════════════════════════════

@api_router.get("/menu/export")
async def export_menu(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    items = await db.menu_items.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    cats = await db.menu_categories.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    payload = {"categories": cats, "items": items, "exported_at": datetime.now(timezone.utc).isoformat()}
    return JSONResponse(content=payload, headers={"Content-Disposition": "attachment; filename=meny-backup.json"})

@api_router.post("/menu/import")
async def import_menu(request: Request, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    payload = await request.json()
    cats = payload.get("categories", [])
    items = payload.get("items", [])
    await db.menu_categories.update_many({}, {"$set": {"is_deleted": True}})
    await db.menu_items.update_many({}, {"$set": {"is_deleted": True}})
    now = datetime.now(timezone.utc).isoformat()
    for i, cat in enumerate(cats):
        cat.pop("_id", None)
        cat["is_deleted"] = False
        cat.setdefault("id", str(uuid.uuid4()))
        cat.setdefault("sort_order", i + 1)
        await db.menu_categories.insert_one(cat)
    for i, item in enumerate(items):
        item.pop("_id", None)
        item["is_deleted"] = False
        item.setdefault("id", str(uuid.uuid4()))
        item.setdefault("sort_order", i + 1)
        await db.menu_items.insert_one(item)
    await log_activity(user, "Importerte meny", f"{len(cats)} kategorier, {len(items)} varer")
    return {"message": f"Import fullført: {len(cats)} kategorier, {len(items)} varer"}

# ══════════════════════════════════════
# USER MANAGEMENT ROUTES
# ══════════════════════════════════════

@api_router.get("/users")
async def get_users(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = []
    async for u in db.users.find({}):
        result.append({
            "id": str(u["_id"]),
            "username": u.get("username", ""),
            "name": u.get("name", ""),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at", ""),
        })
    return result

@api_router.post("/users")
async def create_user(req: UserCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    username = req.username.lower().strip()
    existing = await db.users.find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Brukernavn er allerede i bruk")
    doc = {
        "username": username,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "role": req.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(doc)
    await log_activity(user, "La til bruker", username)
    return {"id": str(result.inserted_id), "username": username, "name": req.name, "role": req.role}

@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, req: UserUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet")
    is_self = str(target["_id"]) == str(user["_id"])
    if target.get("username") == _protected_admin_username() and not is_self:
        raise HTTPException(status_code=403, detail="Admin-brukeren kan kun endres av seg selv")

    update_doc = {}
    if req.username is not None:
        new_username = req.username.lower().strip()
        if not new_username:
            raise HTTPException(status_code=400, detail="Brukernavn kan ikke være tomt")
        existing = await db.users.find_one({"username": new_username})
        if existing and str(existing["_id"]) != user_id:
            raise HTTPException(status_code=400, detail="Brukernavn er allerede i bruk")
        update_doc["username"] = new_username
    if req.name is not None:
        update_doc["name"] = req.name
    if req.password:
        update_doc["password_hash"] = hash_password(req.password)

    if update_doc:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_doc})

    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    await log_activity(user, "Oppdaterte bruker", updated.get("username", user_id))
    return {
        "id": str(updated["_id"]),
        "username": updated.get("username", ""),
        "name": updated.get("name", ""),
        "role": updated.get("role", "user"),
    }

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    if user_id == str(user["_id"]):
        raise HTTPException(status_code=400, detail="Du kan ikke slette deg selv")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet")
    if target.get("username") == _protected_admin_username():
        raise HTTPException(status_code=403, detail="Admin-brukeren kan ikke slettes")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet")
    await log_activity(user, "Slettet bruker", target.get("username", user_id))
    return {"message": "Bruker slettet"}

# ══════════════════════════════════════
# RESERVATION ROUTES
# ══════════════════════════════════════

@api_router.post("/reservations")
async def create_reservation(req: ReservationCreate):
    if req.guests < 1 or req.guests > 50:
        raise HTTPException(status_code=400, detail="Antall gjester må være mellom 1 og 50")
    doc = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "phone": req.phone,
        "email": req.email,
        "date": req.date,
        "time": req.time,
        "guests": req.guests,
        "message": req.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reservations.insert_one(doc)
    doc.pop("_id", None)
    return {"message": "Reservasjon mottatt! Vi bekrefter snart."}

@api_router.get("/reservations")
async def get_reservations(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    docs = await db.reservations.find({}, {"_id": 0}).sort("date", -1).to_list(500)
    return docs

@api_router.patch("/reservations/{res_id}/status")
async def update_reservation_status(res_id: str, req: ReservationStatusUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    if req.status not in {"pending", "confirmed", "cancelled"}:
        raise HTTPException(status_code=400, detail="Ugyldig status")
    result = await db.reservations.update_one({"id": res_id}, {"$set": {"status": req.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservasjon ikke funnet")
    await log_activity(user, f"Endret reservasjonsstatus til «{req.status}»", res_id)
    return {"message": "Status oppdatert"}

@api_router.delete("/reservations/{res_id}")
async def delete_reservation(res_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = await db.reservations.delete_one({"id": res_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservasjon ikke funnet")
    await log_activity(user, "Slettet reservasjon", res_id)
    return {"message": "Reservasjon slettet"}

# ══════════════════════════════════════
# SITE IMAGE MANAGEMENT
# ══════════════════════════════════════

DEFINED_SLOTS = [
    'hero_bakgrunn', 'om_oss_bilde',
    'menu_hero',
    'arrangement_hero', 'arrangement_tilbyr',
    'arrangement_galleri_1', 'arrangement_galleri_2',
    'arrangement_galleri_3', 'arrangement_galleri_4',
]

@api_router.get("/site-images")
async def get_site_images():
    result = []
    for slot_id in DEFINED_SLOTS:
        doc = await db.site_images.find_one({"slot_id": slot_id}, {"_id": 0})
        result.append({
            "id": slot_id,
            "url": f"/api/site-images/{slot_id}/image" if doc else None,
            "focus_x": doc.get("focus_x", 50) if doc else 50,
            "focus_y": doc.get("focus_y", 50) if doc else 50,
        })
    return {"slots": result}

@api_router.post("/site-images/{slot_id}/upload")
async def upload_site_image(
    slot_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin kan laste opp bilder")
    if slot_id not in DEFINED_SLOTS:
        raise HTTPException(status_code=400, detail="Ukjent bildeslot")
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Kun bilder (JPEG, PNG, WebP, GIF) er tillatt")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maks filstørrelse er 10MB")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/site-images/{slot_id}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.site_images.update_one(
        {"slot_id": slot_id},
        {"$set": {
            "slot_id": slot_id,
            "storage_path": result["path"],
            "content_type": file.content_type,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True
    )
    await log_activity(user, "Lastet opp bilde", slot_id)
    return {"message": "Bilde lastet opp", "slot_id": slot_id}

@api_router.get("/site-images/{slot_id}/image")
async def serve_site_image(slot_id: str):
    doc = await db.site_images.find_one({"slot_id": slot_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ingen tilpasset bilde for dette sloten")
    data, ct = get_object(doc["storage_path"])
    return Response(content=data, media_type=doc.get("content_type", ct))

@api_router.put("/site-images/{slot_id}/focus")
async def update_site_image_focus(slot_id: str, request: Request, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    if slot_id not in DEFINED_SLOTS:
        raise HTTPException(status_code=400, detail="Ukjent bildeslot")
    body = await request.json()
    await db.site_images.update_one(
        {"slot_id": slot_id},
        {"$set": {"focus_x": body.get("focus_x", 50), "focus_y": body.get("focus_y", 50)}},
        upsert=True
    )
    await log_activity(user, "Endret bildefokus", slot_id)
    return {"message": "Fokus oppdatert"}

@api_router.delete("/site-images/{slot_id}")
async def reset_site_image(slot_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    if slot_id not in DEFINED_SLOTS:
        raise HTTPException(status_code=400, detail="Ukjent bildeslot")
    await db.site_images.delete_one({"slot_id": slot_id})
    await log_activity(user, "Tilbakestilte bilde", slot_id)
    return {"message": "Tilbakestilt til standardbilde"}

# ══════════════════════════════════════
# ARRANGEMENT SLIDESHOW
# ══════════════════════════════════════

@api_router.get("/arrangement-slides")
async def get_arrangement_slides():
    slides = await db.arrangement_slides.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return [{"id": s["id"], "url": f"/api/arrangement-slides/{s['id']}/image", "sort_order": s["sort_order"]} for s in slides]

@api_router.post("/arrangement-slides/upload")
async def upload_arrangement_slide(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin kan laste opp bilder")
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Kun bilder (JPEG, PNG, WebP, GIF) er tillatt")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maks filstørrelse er 10MB")
    slide_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/arrangement-slides/{slide_id}.{ext}"
    result = put_object(path, data, file.content_type)
    max_doc = await db.arrangement_slides.find_one(sort=[("sort_order", -1)])
    next_order = (max_doc["sort_order"] + 1) if max_doc else 1
    doc = {
        "id": slide_id,
        "storage_path": result["path"],
        "content_type": file.content_type,
        "sort_order": next_order,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.arrangement_slides.insert_one(doc)
    await log_activity(user, "La til slideshow-bilde (arrangement)", slide_id)
    return {"id": slide_id, "url": f"/api/arrangement-slides/{slide_id}/image", "sort_order": next_order}

@api_router.get("/arrangement-slides/{slide_id}/image")
async def serve_arrangement_slide(slide_id: str):
    doc = await db.arrangement_slides.find_one({"id": slide_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Bilde ikke funnet")
    data, ct = get_object(doc["storage_path"])
    return Response(content=data, media_type=doc.get("content_type", ct))

@api_router.put("/arrangement-slides/reorder")
async def reorder_arrangement_slides(req: ReorderRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    for item in req.items:
        await db.arrangement_slides.update_one({"id": item.id}, {"$set": {"sort_order": item.sort_order}})
    await log_activity(user, "Omorganiserte slideshow (arrangement)")
    return {"message": "Omorganisert"}

@api_router.delete("/arrangement-slides/{slide_id}")
async def delete_arrangement_slide(slide_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = await db.arrangement_slides.delete_one({"id": slide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bilde ikke funnet")
    await log_activity(user, "Slettet slideshow-bilde (arrangement)", slide_id)
    return {"message": "Bilde slettet"}

# ══════════════════════════════════════
# BLOG ROUTES
# ══════════════════════════════════════

@api_router.get("/blog")
async def get_blog_posts(include_drafts: bool = Query(False)):
    query = {} if include_drafts else {"is_published": True}
    posts = await db.blog.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.get("/blog/{post_id}")
async def get_blog_post(post_id: str):
    post = await db.blog.find_one({"id": post_id, "is_published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Innlegg ikke funnet")
    return post

@api_router.post("/blog")
async def create_blog_post(req: BlogPostCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    now = datetime.now(timezone.utc).isoformat()
    post = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "body": req.body,
        "image_url": None,
        "is_published": req.is_published,
        "category": req.category or "Nyheter",
        "created_at": now,
        "updated_at": now,
    }
    await db.blog.insert_one(post)
    post.pop("_id", None)
    await log_activity(user, "La til blogginnlegg", req.title)
    return post

@api_router.put("/blog/{post_id}")
async def update_blog_post(post_id: str, req: BlogPostUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    updates = {k: v for k, v in req.dict().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.blog.update_one({"id": post_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Innlegg ikke funnet")
    post = await db.blog.find_one({"id": post_id}, {"_id": 0})
    await log_activity(user, "Oppdaterte blogginnlegg", post.get("title", post_id))
    return post

@api_router.post("/blog/{post_id}/image")
async def upload_blog_image(post_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Kun bilder (JPEG, PNG, WebP)")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maks filstørrelse er 10MB")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/blog/{post_id}.{ext}"
    result = put_object(path, data, file.content_type)
    image_url = f"/api/blog/{post_id}/image"
    await db.blog.update_one(
        {"id": post_id},
        {"$set": {"image_path": result["path"], "image_url": image_url, "image_content_type": file.content_type, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await log_activity(user, "Lastet opp blogginnlegg-bilde", post_id)
    return {"image_url": image_url}

@api_router.get("/blog/{post_id}/image")
async def serve_blog_image(post_id: str):
    post = await db.blog.find_one({"id": post_id}, {"_id": 0})
    if not post or not post.get("image_path"):
        raise HTTPException(status_code=404, detail="Ingen bilde")
    data, ct = get_object(post["image_path"])
    return Response(content=data, media_type=post.get("image_content_type", ct))

@api_router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    result = await db.blog.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Innlegg ikke funnet")
    await log_activity(user, "Slettet blogginnlegg", post_id)
    return {"message": "Innlegg slettet"}

# ══════════════════════════════════════
# SITE TEXT
# ══════════════════════════════════════

class SiteTextUpdate(BaseModel):
    texts: dict

@api_router.get("/site-text")
async def get_site_text():
    doc = await db.site_text.find_one({}, {"_id": 0})
    return doc or {}

@api_router.put("/site-text")
async def update_site_text(req: SiteTextUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bare admin")
    await db.site_text.update_one({}, {"$set": req.texts}, upsert=True)
    await log_activity(user, "Oppdaterte tekster")
    return {"message": "Tekster oppdatert"}

# ══════════════════════════════════════
# ACTIVITY LOG (kun for hovedadmin)
# ══════════════════════════════════════

@api_router.get("/activity-log")
async def get_activity_log(user: dict = Depends(get_current_user)):
    if user.get("username") != _protected_admin_username():
        raise HTTPException(status_code=403, detail="Bare hovedadmin har tilgang til loggen")
    logs = await db.activity_log.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)
    return logs

# ══════════════════════════════════════
# HEALTH / ROOT
# ══════════════════════════════════════

@api_router.get("/")
async def root():
    return {"message": "Linderudkollen Sportsstue API"}

@api_router.get("/sitemap.xml")
async def sitemap():
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://linderudkollen.no/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://linderudkollen.no/meny</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://linderudkollen.no/arrangement</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://linderudkollen.no/blogg</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>'''
    return Response(content=xml, media_type="application/xml")

# ══════════════════════════════════════
# STARTUP & CONFIG
# ══════════════════════════════════════

async def seed_admin():
    admin_username = os.environ.get("ADMIN_USERNAME", "admin").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin")
    existing = await db.users.find_one({"username": admin_username})
    if existing is None:
        # Check if old email-based admin exists and migrate
        old_admin = await db.users.find_one({"email": os.environ.get("ADMIN_EMAIL", "")})
        if old_admin:
            await db.users.update_one(
                {"_id": old_admin["_id"]},
                {"$set": {"username": admin_username, "password_hash": hash_password(admin_password)}}
            )
            logger.info(f"Migrated admin to username: {admin_username}")
        else:
            hashed = hash_password(admin_password)
            await db.users.insert_one({
                "username": admin_username,
                "password_hash": hashed,
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin user seeded: {admin_username}")
    # Only update password if explicitly set in environment (not the generic default)
    elif os.environ.get("ADMIN_PASSWORD") and not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"username": admin_username}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated from environment")

async def seed_menu():
    count = await db.menu_items.count_documents({"is_deleted": {"$ne": True}})
    if count > 0:
        return
    default_items = [
        {"category": "Bakst", "name": "Surdeigbrød, påsmurt", "description": "Hjemmelaget surdeig med smør og pålegg", "price": 79, "sort_order": 1},
        {"category": "Bakst", "name": "Surdeigbrød, ta med hjem", "description": "Helt brød til å ta med", "price": 89, "sort_order": 2},
        {"category": "Bakst", "name": "Kanelsnurr", "description": "Klassisk nybakt kanelsnurr", "price": 49, "sort_order": 3},
        {"category": "Bakst", "name": "Vaffel m/ syltetøy", "description": "Norsk vaffel med syltetøy og rømme", "price": 59, "sort_order": 4},
        {"category": "Varm mat", "name": "Dagens kraftsuppe", "description": "Varm, næringsrik suppe laget fra bunnen", "price": 119, "sort_order": 10},
        {"category": "Drikke", "name": "Kaffe", "description": "Nybrygget filterkaffe", "price": 39, "sort_order": 20},
        {"category": "Drikke", "name": "Kakao", "description": "Varm kakao med krem", "price": 49, "sort_order": 21},
        {"category": "Drikke", "name": "Te", "description": "Utvalg av te-sorter", "price": 39, "sort_order": 22},
        {"category": "Drikke", "name": "Fruktsmoothie", "description": "Frisk smoothie med sesongens frukter", "price": 69, "sort_order": 23},
        {"category": "Spesielt", "name": "Glutenfritt alternativ", "description": "Spør oss om dagens glutenfrie tilbud", "price": None, "sort_order": 30},
    ]
    for item in default_items:
        item["id"] = str(uuid.uuid4())
        item["is_available"] = True
        item["is_deleted"] = False
        item["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.menu_items.insert_many(default_items)
    logger.info(f"Seeded {len(default_items)} menu items")

async def seed_categories():
    count = await db.menu_categories.count_documents({"is_deleted": {"$ne": True}})
    if count > 0:
        return
    default_cats = [
        {"name": "Bakst", "sort_order": 1},
        {"name": "Varm mat", "sort_order": 2},
        {"name": "Drikke", "sort_order": 3},
        {"name": "Spesielt", "sort_order": 4},
    ]
    for cat in default_cats:
        cat["id"] = str(uuid.uuid4())
        cat["is_deleted"] = False
        cat["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.menu_categories.insert_many(default_cats)
    logger.info(f"Seeded {len(default_cats)} categories")

@app.on_event("startup")
async def startup():
    await db.users.create_index("username", unique=True)
    await db.reservations.create_index("date")
    await seed_admin()
    await seed_menu()
    await seed_categories()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Object storage init failed (will retry on first upload): {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api_router)

_allowed_origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://liamp.no",
    "https://www.liamp.no",
    "http://liamp.no",
    "http://www.liamp.no",
    "https://linderudkollen.no",
    "https://www.linderudkollen.no",
    "http://linderudkollen.no",
    "http://www.linderudkollen.no",
]
_frontend_url = os.environ.get("FRONTEND_URL")
if _frontend_url and _frontend_url not in _allowed_origins:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https?://.*\.preview\.emergentagent\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
