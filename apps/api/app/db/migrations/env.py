import asyncio
import os
import re
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

from app.models.base import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Load apps/api/.env so DATABASE_URL is available when alembic runs from CLI
_env_file = Path(__file__).resolve().parents[3] / ".env"
if _env_file.exists():
    with open(_env_file) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip().strip("\"'"))


def _build_async_url(raw: str) -> str:
    """Normalise any postgres URL variant to postgresql+asyncpg://."""
    # Strip unsupported query params (e.g. ?schema=public from Prisma)
    url = re.sub(r"\?.*$", "", raw.strip())
    # Replace plain postgresql:// or postgres:// with asyncpg driver
    url = re.sub(r"^postgres(ql)?://", "postgresql+asyncpg://", url)
    # If someone already wrote postgresql+psycopg2:// swap that too
    url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
    return url


_raw_db_url = os.environ.get("DATABASE_URL") or config.get_main_option("sqlalchemy.url", "")
_async_db_url = _build_async_url(_raw_db_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=_async_db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # Use create_async_engine directly — avoids config-section propagation quirks
    connectable = create_async_engine(_async_db_url, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
