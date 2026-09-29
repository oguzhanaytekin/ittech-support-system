"""
ITTECH Bilişim — Pydantic Şemaları (schemas.py)
================================================
API istek (request) ve yanıt (response) veri doğrulama modelleri.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ─── Bilet Şemaları ───

class BiletCreate(BaseModel):
    """Yeni bilet oluşturma isteği."""
    baslik: str
    kategori: str = "Bilgisayar/Donanım"
    oncelik: str = "Normal"
    aciklama: Optional[str] = None
    talep_eden: Optional[str] = None
    tahmini_ucret: Optional[float] = None


class BiletUpdate(BaseModel):
    """Bilet güncelleme isteği (durum veya not değişikliği)."""
    durum: Optional[str] = None
    teknisyen_notu: Optional[str] = None
    oncelik: Optional[str] = None


class BiletResponse(BaseModel):
    """API'den dönen bilet verisi."""
    id: int
    bilet_no: str
    baslik: str
    kategori: str
    oncelik: str
    durum: str
    aciklama: Optional[str] = None
    teknisyen_notu: Optional[str] = None
    talep_eden: Optional[str] = None
    tahmini_ucret: Optional[float] = None
    olusturulma: datetime
    guncelleme: datetime

    model_config = {"from_attributes": True}


# ─── Eski Frontend Uyumluluk Şeması ───

class BiletLegacy(BaseModel):
    """
    Mevcut frontend (app.js) ile tam uyumlu bilet formatı.
    Frontend'in beklediği alan adlarını (id, title, category...) kullanır.
    """
    id: str              # "TKT-1048"
    title: str
    category: str
    priority: str
    desc: Optional[str] = None
    status: str
    owner: Optional[str] = None
    date: str
    techNote: Optional[str] = None

    model_config = {"from_attributes": True}


class BiletLegacyCreate(BaseModel):
    """Frontend'den gelen bilet oluşturma verisi (eski format)."""
    id: Optional[str] = None
    title: str
    category: str = "Bilgisayar/Donanım"
    priority: str = "Normal"
    desc: Optional[str] = None
    status: str = "Açık"
    owner: Optional[str] = None
    date: Optional[str] = None
    techNote: Optional[str] = None


# ─── Envanter Şemaları ───

class EnvanterCreate(BaseModel):
    """Yeni envanter kaydı oluşturma."""
    id: Optional[str] = None    # "ENV-PC-101"
    model: str
    ip: Optional[str] = "-"
    mac: Optional[str] = "-"
    dept: Optional[str] = None
    health: str = "health-good"
    healthLabel: str = "%100 Sağlam"
    date: Optional[str] = None
    specs: Optional[str] = None
    warranty: Optional[str] = None


class EnvanterResponse(BaseModel):
    """API'den dönen envanter verisi (frontend uyumlu)."""
    id: str
    model: str
    ip: Optional[str] = "-"
    mac: Optional[str] = "-"
    dept: Optional[str] = None
    health: str
    healthLabel: str
    date: str
    specs: Optional[str] = None
    warranty: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Stok Şemaları ───

class StokCreate(BaseModel):
    """Yeni stok kaydı oluşturma."""
    parca_adi: str
    kategori: Optional[str] = None
    miktar: int = 0
    min_esik: int = 2
    birim_fiyat: float = 0.0


class StokResponse(BaseModel):
    """API'den dönen stok verisi."""
    id: int
    parca_adi: str
    kategori: Optional[str] = None
    miktar: int
    min_esik: int
    birim_fiyat: float
    uyari: bool = False   # miktar < min_esik ise True

    model_config = {"from_attributes": True}


# ─── Fiyat Hesaplama Şeması ───

class FiyatHesaplaRequest(BaseModel):
    """Fiyat algoritması girdi parametreleri."""
    cihaz_turu: str       # "laptop", "desktop", "hdd_ssd", ...
    hizmet_turu: str      # "bakim", "format", "ekran", ...
    aciliyet: str = "Normal"


class FiyatHesaplaResponse(BaseModel):
    """Fiyat algoritması çıktısı."""
    iscilik: float
    parca_min: float
    parca_max: float
    toplam_min: float
    toplam_max: float
    sure: str
    formul: str
