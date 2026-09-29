"""
ITTECH Bilişim — CRUD İşlemleri (crud.py)
=========================================
Veritabanı üzerinde Oluştur / Oku / Güncelle / Sil işlemleri.
İş mantığı (business logic): stok düşümü, fiyat hesaplama.
"""

import random
from datetime import datetime
from sqlalchemy.orm import Session
from . import models, schemas


# ═══════════════════════════════════════════
# BİLET (TICKET) CRUD
# ═══════════════════════════════════════════

def bilet_no_uret() -> str:
    """Rastgele bilet numarası üretir: TKT-1000 ... TKT-9999"""
    return f"TKT-{random.randint(1000, 9999)}"


def get_biletler(db: Session) -> list[dict]:
    """Tüm biletleri frontend uyumlu formatta döndürür."""
    biletler = db.query(models.Bilet).order_by(models.Bilet.id.desc()).all()
    return [bilet_to_legacy(b) for b in biletler]


def get_bilet_by_no(db: Session, bilet_no: str) -> models.Bilet | None:
    """Bilet numarasına göre tek bilet getirir."""
    return db.query(models.Bilet).filter(models.Bilet.bilet_no == bilet_no).first()


def create_bilet(db: Session, data: schemas.BiletLegacyCreate) -> dict:
    """Yeni bilet oluşturur ve frontend formatında döndürür."""
    if data.id:
        bilet_no = data.id
    else:
        bilet_no = bilet_no_uret()
        # Çakışma (collision) güvenliği
        while get_bilet_by_no(db, bilet_no) is not None:
            bilet_no = bilet_no_uret()

    tarih = data.date or datetime.now().strftime("%d.%m.%Y")

    yeni = models.Bilet(
        bilet_no=bilet_no,
        baslik=data.title,
        kategori=data.category,
        oncelik=data.priority,
        durum=data.status,
        aciklama=data.desc,
        teknisyen_notu=data.techNote,
        talep_eden=data.owner,
    )
    db.add(yeni)
    db.commit()
    db.refresh(yeni)
    return bilet_to_legacy(yeni, tarih_override=tarih)


def update_bilet(db: Session, bilet_no: str, data: dict) -> dict | None:
    """Bilet günceller (durum, not vb.) ve frontend formatında döndürür."""
    bilet = get_bilet_by_no(db, bilet_no)
    if not bilet:
        return None

    # Gelen alanları güncelle
    if "status" in data:
        bilet.durum = data["status"]
    if "techNote" in data:
        bilet.teknisyen_notu = data["techNote"]
    if "priority" in data:
        bilet.oncelik = data["priority"]
    if "title" in data:
        bilet.baslik = data["title"]

    bilet.guncelleme = datetime.utcnow()
    db.commit()
    db.refresh(bilet)
    return bilet_to_legacy(bilet)


def delete_bilet(db: Session, bilet_no: str) -> bool:
    """Bileti kalıcı olarak siler."""
    bilet = get_bilet_by_no(db, bilet_no)
    if not bilet:
        return False
    db.delete(bilet)
    db.commit()
    return True


def bilet_to_legacy(bilet: models.Bilet, tarih_override: str = None) -> dict:
    """ORM nesnesini frontend'in beklediği JSON yapısına çevirir."""
    return {
        "id": bilet.bilet_no,
        "title": bilet.baslik,
        "category": bilet.kategori,
        "priority": bilet.oncelik,
        "desc": bilet.aciklama or "",
        "status": bilet.durum,
        "owner": bilet.talep_eden or "",
        "date": tarih_override or bilet.olusturulma.strftime("%d.%m.%Y"),
        "techNote": bilet.teknisyen_notu or "",
    }


# ═══════════════════════════════════════════
# ENVANTER (INVENTORY) CRUD
# ═══════════════════════════════════════════

def get_envanter(db: Session) -> list[dict]:
    """Tüm envanter kayıtlarını frontend uyumlu formatta döndürür."""
    # Envanter basit model: Stok tablosundan ayrı, donanım listesi
    # Mevcut frontend yapısıyla uyum için ayrı tablo kullanıyoruz
    kayitlar = db.query(models.Cihaz).all()
    return [envanter_to_legacy(c) for c in kayitlar]


def create_envanter(db: Session, data: schemas.EnvanterCreate) -> dict:
    """Yeni envanter kaydı oluşturur."""
    yeni = models.Cihaz(
        musteri_id=0,  # Envanter cihazları (sahipsiz / şirket malı)
        marka=data.model.split(" ")[0] if data.model else "",
        model=data.model,
        seri_no=data.id or f"ENV-{random.randint(100, 999)}",
        tip=data.health,
    )
    db.add(yeni)
    db.commit()
    db.refresh(yeni)

    return {
        "id": data.id or yeni.seri_no,
        "model": data.model,
        "ip": data.ip or "-",
        "mac": data.mac or "-",
        "dept": data.dept or "",
        "health": data.health,
        "healthLabel": data.healthLabel,
        "date": data.date or datetime.now().strftime("%d.%m.%Y"),
        "specs": data.specs or "",
        "warranty": data.warranty or "",
    }


def envanter_to_legacy(cihaz: models.Cihaz) -> dict:
    """ORM Cihaz nesnesini frontend envanter formatına çevirir."""
    return {
        "id": cihaz.seri_no or f"ENV-{cihaz.id}",
        "model": cihaz.model or "",
        "ip": "-",
        "mac": "-",
        "dept": "",
        "health": cihaz.tip or "health-good",
        "healthLabel": "%100 Sağlam",
        "date": cihaz.teslim_tarihi.strftime("%d.%m.%Y") if cihaz.teslim_tarihi else "",
        "specs": "",
        "warranty": "",
    }


# ═══════════════════════════════════════════
# STOK (SPARE PARTS) CRUD
# ═══════════════════════════════════════════

def get_stok(db: Session) -> list[dict]:
    """Tüm stok kayitlarini dondurur."""
    parcalar = db.query(models.Stok).all()
    return [
        {
            "id": p.id,
            "parca_adi": p.parca_adi,
            "kategori": p.kategori or "",
            "miktar": p.miktar,
            "min_esik": p.min_esik,
            "birim_fiyat": p.birim_fiyat,
            "uyari": p.miktar < p.min_esik,
        }
        for p in parcalar
    ]


def create_stok(db: Session, data: schemas.StokCreate) -> dict:
    """Yeni stok kaydı oluşturur."""
    yeni = models.Stok(
        parca_adi=data.parca_adi,
        kategori=data.kategori,
        miktar=data.miktar,
        min_esik=data.min_esik,
        birim_fiyat=data.birim_fiyat,
    )
    db.add(yeni)
    db.commit()
    db.refresh(yeni)
    return {
        "id": yeni.id,
        "parca_adi": yeni.parca_adi,
        "kategori": yeni.kategori or "",
        "miktar": yeni.miktar,
        "min_esik": yeni.min_esik,
        "birim_fiyat": yeni.birim_fiyat,
        "uyari": yeni.miktar < yeni.min_esik,
    }


def stok_dusumu(db: Session, stok_id: int, adet: int = 1) -> dict | None:
    """
    İŞ MANTIĞI (Business Logic): Parça stoktan düşüm.
    Bir arıza giderildiğinde kullanılan parçanın adedi stoktan düşer.
    Stok minimum eşiğin altına düşerse uyarı döner.
    """
    parca = db.query(models.Stok).filter(models.Stok.id == stok_id).first()
    if not parca:
        return None

    parca.miktar = max(0, parca.miktar - adet)
    parca.son_guncelleme = datetime.utcnow()
    db.commit()
    db.refresh(parca)

    return {
        "id": parca.id,
        "parca_adi": parca.parca_adi,
        "miktar": parca.miktar,
        "min_esik": parca.min_esik,
        "uyari": parca.miktar < parca.min_esik,
        "mesaj": f"Stok güncellendi: {parca.parca_adi} → {parca.miktar} adet kaldı."
                 + (" ⚠️ MİNİMUM STOK SEVİYESİ ALTINA DÜŞTÜ!" if parca.miktar < parca.min_esik else ""),
    }


# ═══════════════════════════════════════════
# FİYAT HESAPLAMA ALGORİTMASI (Sunucu Tarafı)
# ═══════════════════════════════════════════

# Hizmet bazlı taban işçilik ve parça maliyetleri
HIZMET_TABLOSU = {
    "bakim":           {"labor": 350,  "partMin": 0,    "partMax": 50,   "sla": "3 - 6 Saat"},
    "format":          {"labor": 400,  "partMin": 0,    "partMax": 100,  "sla": "4 - 8 Saat"},
    "ekran":           {"labor": 300,  "partMin": 1200, "partMax": 2600, "sla": "1 - 3 Gün (Parça Tedarik)"},
    "klavye_batarya":  {"labor": 250,  "partMin": 400,  "partMax": 1200, "sla": "1 - 2 Gün"},
    "ssd_ram":         {"labor": 200,  "partMin": 600,  "partMax": 2000, "sla": "2 - 4 Saat (Stokta Varsa)"},
    "veri_kurtarma":   {"labor": 500,  "partMin": 0,    "partMax": 200,  "sla": "1 - 3 Gün (Disk Durumuna Bağlı)"},
    "ag_modem":        {"labor": 300,  "partMin": 50,   "partMax": 400,  "sla": "2 - 4 Saat"},
    "anakart":         {"labor": 650,  "partMin": 200,  "partMax": 1500, "sla": "3 - 7 Gün (Mikro Lehim)"},
}

# Cihaz türü çarpanları
CIHAZ_KATSAYILARI = {
    "laptop":         {"mult": 1.2, "name": "Dizüstü Bilgisayar"},
    "desktop":        {"mult": 1.0,  "name": "Masaüstü Bilgisayar"},
    "hdd_ssd":        {"mult": 0.9,  "name": "Harici Disk / SSD"},
    "server_network": {"mult": 1.25, "name": "Ağ Cihazı / Sunucu"},
    "printer":        {"mult": 1.1,  "name": "Yazıcı / Çevre Birimi"},
}

# Aciliyet çarpanları
ACILIYET_KATSAYILARI = {
    "Normal":  {"mult": 1.0,  "label": "Standart Servis"},
    "Yüksek":  {"mult": 1.3,  "label": "Acil / Aynı Gün (+%30)"},
    "Düşük":   {"mult": 0.9,  "label": "Esnek Teslimat (-%10)"},
}


def fiyat_hesapla(cihaz_turu: str, hizmet_turu: str, aciliyet: str = "Normal") -> dict:
    """
    Sunucu tarafinda calisan fiyat hesaplama algoritmasi.
    Formul: Tahmini Iscilik = Taban * K_cihaz * K_aciliyet
    """
    hizmet = HIZMET_TABLOSU.get(hizmet_turu, HIZMET_TABLOSU["bakim"])
    cihaz = CIHAZ_KATSAYILARI.get(cihaz_turu, CIHAZ_KATSAYILARI["laptop"])
    oncelik = ACILIYET_KATSAYILARI.get(aciliyet, ACILIYET_KATSAYILARI["Normal"])

    iscilik = round(hizmet["labor"] * cihaz["mult"] * oncelik["mult"])
    parca_min = round(hizmet["partMin"] * cihaz["mult"])
    parca_max = round(hizmet["partMax"] * cihaz["mult"])
    toplam_min = iscilik + parca_min
    toplam_max = iscilik + parca_max

    sla = hizmet["sla"]
    if aciliyet == "Yuksek":
        sla = "Ayni Gun (2 - 6 Saat Oncelikli)"

    return {
        "iscilik": iscilik,
        "parca_min": parca_min,
        "parca_max": parca_max,
        "toplam_min": toplam_min,
        "toplam_max": toplam_max,
        "sure": sla,
        "formul": f"({hizmet['labor']}₺ × {cihaz['mult']} × {oncelik['mult']}) + Parça",
    }
