"""Create or update a site staff user.

Usage (inside the backend container or venv):

    python -m scripts.create_staff --email founder@ember.gg \\
        --name "Founder" --role admin --password "<plaintext>"

Password is optional (Discord-only logins). Re-running with an existing email
updates the row instead of failing.
"""
from __future__ import annotations

import argparse
import asyncio
import getpass
import sys

from nanoid import generate as nanoid

from app.db.database import AsyncSessionLocal
from app.db.repos import staff_repo
from app.db.site_models import StaffUser
from app.security.site_auth import hash_password


async def main() -> int:
    parser = argparse.ArgumentParser(description="Create or update a staff user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True, help="Display name")
    parser.add_argument("--role", choices=("admin", "moderator"), default="moderator")
    parser.add_argument("--password", help="Password (or omit to be prompted; pass '' for Discord-only)")
    parser.add_argument("--discord-id", help="Discord user id (optional)")
    args = parser.parse_args()

    email = args.email.strip().lower()
    pw_arg = args.password
    if pw_arg is None:
        pw_arg = getpass.getpass("Password (blank for Discord-only): ")
    password_hash = hash_password(pw_arg) if pw_arg else None

    async with AsyncSessionLocal() as db:
        existing = await staff_repo.get_by_email(db, email)
        if existing:
            existing.display_name = args.name
            existing.role = args.role
            if password_hash is not None:
                existing.password_hash = password_hash
            if args.discord_id:
                existing.discord_id = args.discord_id
            await db.commit()
            print(f"Updated staff {existing.id} <{email}>")
        else:
            staff = StaffUser(
                id=nanoid(size=21),
                email=email,
                display_name=args.name,
                role=args.role,
                password_hash=password_hash,
                discord_id=args.discord_id,
            )
            db.add(staff)
            await db.commit()
            print(f"Created staff {staff.id} <{email}>")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
