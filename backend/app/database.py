from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def get_db() -> AsyncGenerator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
