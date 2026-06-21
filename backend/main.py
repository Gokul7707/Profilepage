import json
import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "backend" / ".env")
load_dotenv(ROOT / ".env")

DATA_DIR = ROOT / "data"
MESSAGES_FILE = DATA_DIR / "messages.json"

CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "gokulsrinivasan2020@gmail.com")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Gokul Portfolio API", version="1.0.0")

origins = list(CORS_ORIGINS)
render_url = os.getenv("RENDER_EXTERNAL_URL", "").strip()
if render_url and render_url not in origins:
    origins.append(render_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContactPayload(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Invalid email address")
        local, _, domain = value.partition("@")
        if not local or not domain or "." not in domain:
            raise ValueError("Invalid email address")
        return value


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not MESSAGES_FILE.exists():
        MESSAGES_FILE.write_text("[]", encoding="utf-8")


def load_messages() -> list:
    ensure_data_dir()
    try:
        return json.loads(MESSAGES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_message(entry: dict) -> None:
    messages = load_messages()
    messages.append(entry)
    MESSAGES_FILE.write_text(json.dumps(messages, indent=2), encoding="utf-8")


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD and CONTACT_EMAIL)


def send_email_notification(entry: dict) -> tuple[bool, str | None]:
    if not smtp_configured():
        return False, "SMTP not configured in backend/.env"

    if not SMTP_USER.endswith("@gmail.com"):
        return False, "SMTP_USER must be your @gmail.com address (App Password account)"

    pwd = SMTP_PASSWORD.replace(" ", "")
    if len(pwd) != 16:
        return False, "SMTP_PASSWORD should be a 16-character Gmail App Password"

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = CONTACT_EMAIL
    msg["Subject"] = f"Portfolio message from {entry['name']}"

    body = (
        f"New message from your portfolio\n\n"
        f"Name: {entry['name']}\n"
        f"Email: {entry['email']}\n"
        f"Time: {entry['timestamp']}\n\n"
        f"Message:\n{entry['message']}\n"
    )
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, pwd)
            server.send_message(msg)
        return True, None
    except smtplib.SMTPAuthenticationError:
        return False, "Gmail login failed — use App Password for gokulsrinivasan2020@gmail.com"
    except Exception as exc:
        return False, f"Email send failed: {exc}"


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "gokul-portfolio",
        "smtp_configured": smtp_configured(),
        "smtp_user_is_gmail": SMTP_USER.endswith("@gmail.com") if SMTP_USER else False,
    }


@app.post("/api/contact")
async def contact(payload: ContactPayload, request: Request):
    entry = {
        "name": payload.name.strip(),
        "email": str(payload.email).strip(),
        "message": payload.message.strip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip": request.client.host if request.client else "unknown",
    }

    save_message(entry)
    emailed, email_error = send_email_notification(entry)

    response = {
        "success": True,
        "message": "Thanks! Your message was received.",
        "emailed": emailed,
    }
    if not emailed and email_error:
        response["email_note"] = email_error
    return response


@app.get("/")
async def serve_home():
    hello = ROOT / "hello.html"
    if hello.exists():
        return FileResponse(hello)
    raise HTTPException(status_code=404, detail="Portfolio not found")


# Static assets (resume PDF, logos, etc.)
for folder in ("resume", "assets"):
    folder_path = ROOT / folder
    if folder_path.exists():
        app.mount(f"/{folder}", StaticFiles(directory=folder_path), name=folder)

index_file = ROOT / "index.html"
if index_file.exists():

    @app.get("/index.html")
    async def serve_index():
        return FileResponse(index_file)
