---
paths:
  - "backend/**/*.py"
---

# Backend API Rules (never break these)

1. **Never use Python enums for database values** — use dedicated lookup tables or plain string constants instead. Only use enums if the user explicitly asks for them.
2. **Use modern SQLAlchemy 2.0 syntax** — `Mapped[T]`, `mapped_column()`, `select()`, `Session.execute()`, `Session.scalars()`. No legacy `Column()`, `Query()`, or implicit `session.query()`.
3. **Always require authentication and permissions on every endpoint** — no unguarded routes except the login endpoint. Use `Depends()` with role-checking guards.
4. **Always rate limit endpoints** — (TO BE ADDED) every endpoint must have rate limiting applied.
5. **Use modern python type annotations** — Always use modern python type annotations, avoid importing custom types unless its needed. 
6. **SQLALCHEMY rules** - Prioritize querying using the session-object
- Avoid using the core functions update, delete, insert, unless needed.
7. **Never run Alembic migrations without explicit user permission** — do not run `alembic revision`, `alembic upgrade`, `alembic downgrade`, or any other Alembic CLI commands automatically. Always ask the user before running any migration command.