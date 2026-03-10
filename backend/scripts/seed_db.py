"""
Seed script: creates default roles and an initial admin user.

Run from backend/:
    python -m scripts.seed_db
"""

import os
import sys

from app.api.v1.core.models import Role, User
from app.db_setup import engine
from app.security import hash_password
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.orm import Session

load_dotenv()

DEFAULT_ROLES = [
    {"name": "admin", "description": "Full system access"},
    {"name": "utbildningsledare", "description": "Manages assigned programs, courses, and students"},
    {"name": "student", "description": "Can view programs and own data"},
]


def seed_roles(session: Session) -> dict[str, Role]:
    """Create default roles if they don't exist. Returns a dict of name -> Role."""
    roles = {}
    for role_data in DEFAULT_ROLES:
        existing = session.scalars(
            select(Role).where(Role.name == role_data["name"])
        ).first()
        if existing:
            print(f"  Role '{role_data['name']}' already exists (id={existing.id})")
            roles[existing.name] = existing
        else:
            role = Role(**role_data)
            session.add(role)
            session.flush()
            print(f"  Created role '{role.name}' (id={role.id})")
            roles[role.name] = role
    return roles


def seed_admin(session: Session, admin_role: Role) -> None:
    """Create an admin user interactively if none exists."""
    existing_admin = session.scalars(
        select(User).where(User.role_id == admin_role.id)
    ).first()
    if existing_admin:
        print(f"  Admin user already exists: {existing_admin.email}")
        return

    print("\n  No admin user found. Let's create one.")

    # Read from env vars if available, fall back to interactive input
    email = os.getenv("ADMIN_EMAIL") or input("  Email: ").strip()
    first_name = os.getenv("ADMIN_FIRST_NAME") or input("  First name: ").strip()
    last_name = os.getenv("ADMIN_LAST_NAME") or input("  Last name: ").strip()
    password = os.getenv("ADMIN_PASSWORD") or input("  Password (min 8 chars): ").strip()

    print(f"  Using email: {email}")

    if len(password) < 8:
        print("  Error: Password must be at least 8 characters.")
        sys.exit(1)

    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=hash_password(password),
        role_id=admin_role.id,
    )
    session.add(user)
    session.flush()
    print(f"  Created admin user: {user.email} (id={user.id})")


def main():
    print("Seeding database...")
    with Session(engine) as session:
        print("\n[Roles]")
        roles = seed_roles(session)

        print("\n[Admin user]")
        seed_admin(session, roles["admin"])

        session.commit()
        print("\nDone!")


if __name__ == "__main__":
    main()
