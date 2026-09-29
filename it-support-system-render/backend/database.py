"""
ITTECH Bilişim — Veritabanı Bağlantı Katmanı (database.py)
===========================================================
SQLAlchemy ORM motoru ve oturum (session) fabrikası.
Geliştirme ortamında SQLite, üretim ortamında PostgreSQL kullanılır.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Ortam değişkeninden veritabanı URL'si al; yoksa yerel SQLite kullan
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ittech.db")

# SQLite için check_same_thread gerekli
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI Dependency Injection için veritabanı oturumu üreteci.
    Her istek için yeni oturum açılır, istek bitince kapatılır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
