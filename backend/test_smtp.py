"""Run from project root: python backend/test_smtp.py"""
import os
import smtplib
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "backend" / ".env")
load_dotenv(ROOT / ".env")

host = os.getenv("SMTP_HOST", "")
port = int(os.getenv("SMTP_PORT", "587"))
user = os.getenv("SMTP_USER", "")
password = os.getenv("SMTP_PASSWORD", "")
contact = os.getenv("CONTACT_EMAIL", "")

print("--- SMTP check ---")
print(f"SMTP_HOST:     {host or '(missing)'}")
print(f"SMTP_USER:     {user or '(missing)'}")
print(f"SMTP_PASSWORD: {'set (' + str(len(password)) + ' chars)' if password else '(missing)'}")
print(f"CONTACT_EMAIL: {contact or '(missing)'}")

if not user.endswith("@gmail.com"):
    print("\nWARN: SMTP_USER must be your @gmail.com address (same account as the App Password).")
    print("      College/other emails cannot use smtp.gmail.com.")

if password and len(password.replace(" ", "")) != 16:
    print("\nWARN: Gmail App Passwords are 16 characters (no spaces).")

if not all([host, user, password, contact]):
    print("\nFAIL: Fill all variables in backend/.env")
    sys.exit(1)

try:
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password.replace(" ", ""))
    print("\nOK: Gmail login succeeded. Contact form emails should work.")
    print("    Restart: pnpm run dev")
except smtplib.SMTPAuthenticationError as e:
    print("\nFAIL: Gmail rejected login (535 Bad Credentials).")
    print("  1. Use a new App Password: https://myaccount.google.com/apppasswords")
    print("  2. SMTP_USER = gokulsrinivasan2020@gmail.com (not college email)")
    print("  3. SMTP_PASSWORD = 16-char app password, no spaces")
    print(f"  Detail: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\nFAIL: {type(e).__name__}: {e}")
    sys.exit(1)
