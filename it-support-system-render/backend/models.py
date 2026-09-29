"""
ITTECH Bilişim — ORM Modelleri (models.py)
==========================================
SQLAlchemy ile tanımlanan ilişkisel veritabanı tabloları.

Tablo İlişkileri (Foreign Key):
  Musteri  1 ──── N  Cihaz
  Musteri  1 ──── N  Bilet
  Cihaz    1 ──── N  Bilet
  Bilet    N ──── N  Stok   (ara tablo: BiletParca)
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


class Musteri(Base):
    """Müşteri tablosu — servise cihaz getiren kişiler."""
    __tablename__ = "musteriler"

    id = Column(Integer, primary_key=True, index=True)
    ad_soyad = Column(String(120), nullable=False)
    telefon = Column(String(20), nullable=True)
    email = Column(String(120), nullable=True)
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    cihazlar = relationship("Cihaz", back_populates="sahip")
    biletler = relationship("Bilet", back_populates="musteri")


class Cihaz(Base):
    """Cihaz tablosu — servise bırakılan donanımlar."""
    __tablename__ = "cihazlar"

    id = Column(Integer, primary_key=True, index=True)
    musteri_id = Column(Integer, ForeignKey("musteriler.id"), nullable=False)
    marka = Column(String(80), nullable=True)
    model = Column(String(120), nullable=True)
    seri_no = Column(String(80), nullable=True)
    tip = Column(String(40), default="laptop")   # laptop / masaustu / yazici / ag_cihazi
    teslim_tarihi = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    sahip = relationship("Musteri", back_populates="cihazlar")
    biletler = relationship("Bilet", back_populates="cihaz")


class Bilet(Base):
    """Arıza bileti tablosu — destek talepleri."""
    __tablename__ = "biletler"

    id = Column(Integer, primary_key=True, index=True)
    bilet_no = Column(String(20), unique=True, index=True, nullable=False)
    musteri_id = Column(Integer, ForeignKey("musteriler.id"), nullable=True)
    cihaz_id = Column(Integer, ForeignKey("cihazlar.id"), nullable=True)

    baslik = Column(String(255), nullable=False)
    kategori = Column(String(60), default="Bilgisayar/Donanım")
    oncelik = Column(String(20), default="Normal")
    durum = Column(String(20), default="Açık")
    aciklama = Column(Text, nullable=True)
    teknisyen_notu = Column(Text, nullable=True)
    tahmini_ucret = Column(Float, nullable=True)
    talep_eden = Column(String(120), nullable=True)

    olusturulma = Column(DateTime, default=datetime.utcnow)
    guncelleme = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # İlişkiler
    musteri = relationship("Musteri", back_populates="biletler")
    cihaz = relationship("Cihaz", back_populates="biletler")
    kullanilan_parcalar = relationship("BiletParca", back_populates="bilet")


class Stok(Base):
    """Yedek parça stok tablosu."""
    __tablename__ = "stok"

    id = Column(Integer, primary_key=True, index=True)
    parca_adi = Column(String(160), nullable=False)
    kategori = Column(String(60), nullable=True)
    miktar = Column(Integer, default=0)
    min_esik = Column(Integer, default=2)
    birim_fiyat = Column(Float, default=0.0)
    son_guncelleme = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    kullanilan_biletler = relationship("BiletParca", back_populates="stok_parcasi")


class BiletParca(Base):
    """
    Bilet ↔ Stok ara tablosu (Many-to-Many).
    Bir bilette hangi parçadan kaç adet kullanıldığını kaydeder.
    """
    __tablename__ = "bilet_parca"

    id = Column(Integer, primary_key=True, index=True)
    bilet_id = Column(Integer, ForeignKey("biletler.id"), nullable=False)
    stok_id = Column(Integer, ForeignKey("stok.id"), nullable=False)
    kullanilan_adet = Column(Integer, default=1)

    bilet = relationship("Bilet", back_populates="kullanilan_parcalar")
    stok_parcasi = relationship("Stok", back_populates="kullanilan_biletler")
