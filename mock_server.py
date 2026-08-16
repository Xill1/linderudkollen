from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

menu_data = {
    "categories": {
        "Bakst": [
            {"id": "1", "name": "Surdeigsbrod", "description": "Hjemmelaget surdeig", "price": 79, "is_available": True},
            {"id": "2", "name": "Kanelsnurr", "description": "Nybakt kanelsnurr", "price": 49, "is_available": True},
            {"id": "3", "name": "Vafler", "description": "Med romme og syltetoy", "price": 59, "is_available": True},
        ],
        "Varm mat": [
            {"id": "4", "name": "Dagssuppe", "description": "Hjemmelaget suppe", "price": 119, "is_available": True},
        ],
        "Drikke": [
            {"id": "5", "name": "Kaffe", "description": "Kokt kaffe", "price": 39, "is_available": True},
            {"id": "6", "name": "Varm sjokolade", "description": "Ekte kakao", "price": 49, "is_available": True},
            {"id": "7", "name": "Te", "description": "Utvalg av teer", "price": 39, "is_available": True},
        ],
        "Spesielt": [
            {"id": "8", "name": "Glutenfritt brod", "description": "For deg med glutenintoleranse", "price": 89, "is_available": True},
        ],
    }
}

categories = [
    {"id": "1", "name": "Bakst", "sort_order": 0},
    {"id": "2", "name": "Varm mat", "sort_order": 1},
    {"id": "3", "name": "Drikke", "sort_order": 2},
    {"id": "4", "name": "Spesielt", "sort_order": 3},
]

opening_hours = {
    "period": "16.02.2026 — 21.06.2026",
    "schedule": [
        {"day": "Mandag", "hours": "Stengt"},
        {"day": "Tirsdag", "hours": "10:00 – 20:00"},
        {"day": "Onsdag", "hours": "10:00 – 20:00"},
        {"day": "Torsdag", "hours": "10:00 – 20:00"},
        {"day": "Fredag", "hours": "10:00 – 20:00"},
        {"day": "Lordag", "hours": "10:00 – 16:00"},
        {"day": "Sondag", "hours": "10:00 – 16:00"},
    ],
    "notices": [],
    "footer_note": "Apningstider kan endres pa korte varsel."
}

gallery = []

blog_posts = [
    {
        "id": "demo-1",
        "title": "Velkommen til Linderudkollen Sportsstue!",
        "body": "Vi er så glade for å endelig ha åpnet dørene igjen. Etter en grundig oppgradering med nytt storkjøkken, nye kaffemaskiner og nyrestaurerte møbler er vi klare til å ta imot gjester.\n\nKom innom for en kopp kaffe, surdeig rett fra ovnen, eller bare for å nyte utsikten over Lillomarka. Vi gleder oss til å se dere!",
        "image_url": None,
        "is_published": True,
        "category": "Om oss",
        "created_at": "2026-02-14T10:00:00+00:00",
        "updated_at": "2026-02-14T10:00:00+00:00",
    },
    {
        "id": "demo-2",
        "title": "Onsdagskveldens middag er tilbake",
        "body": "Fra og med denne uken serverer vi varm middag hver onsdag kveld. Gryter og supper laget fra bunnen av ferske råvarer — akkurat det du trenger etter en lang dag i marka.\n\nVi holder åpent til kl. 20:00 på onsdager. Ta med familien eller stikk innom alene — alle er velkomne!",
        "image_url": None,
        "is_published": True,
        "category": "Nyheter",
        "created_at": "2026-03-01T12:00:00+00:00",
        "updated_at": "2026-03-01T12:00:00+00:00",
    },
]

@app.get("/api/menu")
def get_menu():
    return menu_data

@app.get("/api/menu/categories")
def get_categories():
    return categories

@app.get("/api/opening-hours")
def get_opening_hours():
    return opening_hours

@app.get("/api/gallery")
def get_gallery():
    return gallery

@app.post("/api/contact")
def contact():
    return {"message": "Melding mottatt"}

@app.get("/api/blog")
def get_blog():
    return [p for p in blog_posts if p["is_published"]]

@app.post("/api/blog")
def create_blog(post: dict):
    from datetime import datetime
    import uuid
    now = datetime.utcnow().isoformat() + "+00:00"
    new_post = {
        "id": str(uuid.uuid4()),
        "title": post.get("title", ""),
        "body": post.get("body", ""),
        "image_url": None,
        "is_published": post.get("is_published", False),
        "category": post.get("category", "Nyheter"),
        "created_at": now,
        "updated_at": now,
    }
    blog_posts.insert(0, new_post)
    return new_post

@app.put("/api/blog/{post_id}")
def update_blog(post_id: str, updates: dict):
    for p in blog_posts:
        if p["id"] == post_id:
            p.update({k: v for k, v in updates.items() if v is not None})
            return p
    from fastapi import HTTPException
    raise HTTPException(status_code=404)

@app.delete("/api/blog/{post_id}")
def delete_blog(post_id: str):
    global blog_posts
    blog_posts = [p for p in blog_posts if p["id"] != post_id]
    return {"message": "Slettet"}

site_text_store = {}

@app.get("/api/site-text")
def get_site_text():
    return site_text_store

@app.put("/api/site-text")
def update_site_text(data: dict):
    site_text_store.update(data.get("texts", data))
    return {"message": "OK"}

@app.get("/api/auth/me")
def get_me():
    from fastapi import HTTPException
    raise HTTPException(status_code=401, detail="Not authenticated")

@app.get("/")
def root():
    return {"status": "ok"}
