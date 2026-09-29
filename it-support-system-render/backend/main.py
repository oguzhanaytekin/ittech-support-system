"""
ITTECH Bilişim — FastAPI Ana Uygulama (main.py)
================================================
RESTful API sunucusu. CORS, statik dosya servisi ve tüm endpoint'ler.

Çalıştırma:
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

Otomatik API Dokümantasyonu:
    http://localhost:8000/docs  (Swagger UI)
"""

from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .database import engine, get_db, Base
from . import crud, schemas, models
from .seed import seed_database

# ─── Veritabanı tablolarını oluştur ───
Base.metadata.create_all(bind=engine)

# ─── Demo verileri yükle ───
seed_database()

# ─── FastAPI uygulaması ───
app = FastAPI(
    title="ITTECH Bilişim API",
    description="Kurumsal Teknik Destek ve Arıza Takip Sistemi RESTful API",
    version="1.0.0",
)

# ─── CORS (Cross-Origin Resource Sharing) ───
# Üretim (Production) ortamında allow_origins=["https://siteniz.com", "https://api.siteniz.com"] olarak güncellenmelidir.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Statik Dosya Dizini ───
STATIC_DIR = Path(__file__).resolve().parent.parent

# ═══════════════════════════════════════════
# BİLET (TICKET) API ENDPOİNT'LERİ
# ═══════════════════════════════════════════

@app.get("/api/biletler", tags=["Biletler"])
async def biletleri_listele(db: Session = Depends(get_db)):
    """Tüm arıza biletlerini listeler."""
    return crud.get_biletler(db)


@app.get("/api/biletler/{bilet_no}", tags=["Biletler"])
async def bilet_detay(bilet_no: str, db: Session = Depends(get_db)):
    """Belirtilen bilet numarasıyla bilet detayını getirir."""
    bilet = crud.get_bilet_by_no(db, bilet_no)
    if not bilet:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
    return crud.bilet_to_legacy(bilet)


@app.post("/api/biletler", tags=["Biletler"], status_code=201)
async def bilet_olustur(data: schemas.BiletLegacyCreate, db: Session = Depends(get_db)):
    """Yeni arıza bileti oluşturur."""
    return crud.create_bilet(db, data)


@app.put("/api/biletler/{bilet_no}", tags=["Biletler"])
async def bilet_guncelle(bilet_no: str, data: dict, db: Session = Depends(get_db)):
    """Biletin durumunu, teknisyen notunu veya önceliğini günceller."""
    result = crud.update_bilet(db, bilet_no, data)
    if not result:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
    return result


@app.delete("/api/biletler/{bilet_no}", tags=["Biletler"])
async def bilet_sil(bilet_no: str, db: Session = Depends(get_db)):
    """Bileti kalıcı olarak siler."""
    success = crud.delete_bilet(db, bilet_no)
    if not success:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
    return {"mesaj": f"{bilet_no} silindi", "ok": True}


# Toplu kaydetme endpoint'i (frontend saveTickets uyumu)
@app.post("/api/biletler/toplu", tags=["Biletler"])
async def biletleri_toplu_kaydet(biletler: list[schemas.BiletLegacyCreate], db: Session = Depends(get_db)):
    """
    Frontend'den gelen tüm bilet listesini veritabanıyla senkronize eder.
    Mevcut frontend yapısı (Api.saveTickets) ile tam uyumlu.
    """
    # Mevcut biletleri temizle ve yeniden yaz
    db.query(models.Bilet).delete()
    db.commit()

    sonuclar = []
    for b in biletler:
        sonuclar.append(crud.create_bilet(db, b))
    return sonuclar


# ═══════════════════════════════════════════
# ENVANTER (INVENTORY) API ENDPOİNT'LERİ
# ═══════════════════════════════════════════

@app.get("/api/envanter", tags=["Envanter"])
async def envanter_listele(db: Session = Depends(get_db)):
    """Donanım envanterini listeler."""
    return crud.get_envanter(db)


@app.post("/api/envanter", tags=["Envanter"])
async def envanter_ekle(data: schemas.EnvanterCreate, db: Session = Depends(get_db)):
    """Yeni envanter kaydı ekler."""
    return crud.create_envanter(db, data)


# Toplu kaydetme (frontend saveInventory uyumu)
@app.post("/api/envanter/toplu", tags=["Envanter"])
async def envanter_toplu_kaydet(kayitlar: list[schemas.EnvanterCreate], db: Session = Depends(get_db)):
    """Frontend'den gelen envanter listesini veritabanıyla senkronize eder."""
    # Envanter cihazlarını temizle (musteri_id=0 olanlar)
    db.query(models.Cihaz).filter(models.Cihaz.musteri_id == 0).delete()
    db.commit()

    sonuclar = []
    for k in kayitlar:
        sonuclar.append(crud.create_envanter(db, k))
    return sonuclar


# ═══════════════════════════════════════════
# STOK (SPARE PARTS) API ENDPOİNT'LERİ
# ═══════════════════════════════════════════

@app.get("/api/stok", tags=["Stok"])
async def stok_listele(db: Session = Depends(get_db)):
    """Yedek parça stok durumunu listeler."""
    return crud.get_stok(db)


@app.post("/api/stok", tags=["Stok"])
async def stok_ekle(data: schemas.StokCreate, db: Session = Depends(get_db)):
    """Yeni yedek parça kaydı ekler."""
    return crud.create_stok(db, data)


@app.post("/api/stok/{stok_id}/dusum", tags=["Stok"])
async def stok_dusum(stok_id: int, adet: int = 1, db: Session = Depends(get_db)):
    """
    İŞ MANTIĞI: Belirtilen parçayı stoktan düşer.
    Onarım tamamlandığında kullanılan parça adedini azaltır.
    """
    result = crud.stok_dusumu(db, stok_id, adet)
    if not result:
        raise HTTPException(status_code=404, detail="Stok kaydı bulunamadı")
    return result


# ═══════════════════════════════════════════
# FİYAT HESAPLAMA API
# ═══════════════════════════════════════════

@app.post("/api/fiyat-hesapla", tags=["Fiyat"])
async def fiyat_hesapla_endpoint(data: schemas.FiyatHesaplaRequest):
    """
    Sunucu tarafında fiyat hesaplama algoritması.
    Cihaz türü, hizmet türü ve aciliyete göre tahmini maliyet hesaplar.
    """
    return crud.fiyat_hesapla(data.cihaz_turu, data.hizmet_turu, data.aciliyet)


# ═══════════════════════════════════════════
# SAĞLIK KONTROLÜ
# ═══════════════════════════════════════════

@app.get("/api/health", tags=["Sistem"])
async def health_check():
    """API sağlık kontrolü endpoint'i."""
    return {"status": "ok", "mesaj": "ITTECH API çalışıyor"}


# ═══════════════════════════════════════════
# STATİK DOSYALAR (HTML, CSS, JS, GÖRSELLER)
# ═══════════════════════════════════════════
# Tüm API endpoint'lerinden sonra en alta eklenir.
# Böylece /style.css, /landing.css, /app.js, /support.html vb.
# dosyalar doğrudan kök dizinden doğru MIME tipiyle sunulur.
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
