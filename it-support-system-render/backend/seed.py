"""
ITTECH Bilişim — Demo Veri Yükleyici (seed.py)
===============================================
Veritabanına başlangıç test verilerini yükler.
Mevcut app.js'teki defaultTickets ve defaultInventory verileri
burada ilişkisel tablolara aktarılmıştır.
"""

from datetime import datetime
from .database import SessionLocal
from . import models


def seed_database():
    """Veritabanı boşsa demo verileri ekler."""
    db = SessionLocal()

    # Zaten veri varsa ekleme
    if db.query(models.Bilet).count() > 0:
        db.close()
        return

    # ─── Demo Müşteriler ───
    musteriler = [
        models.Musteri(id=1, ad_soyad="Fatma D.", telefon="0532 111 22 33"),
        models.Musteri(id=2, ad_soyad="Ahmet Y.", telefon="0533 444 55 66"),
        models.Musteri(id=3, ad_soyad="Mehmet K.", telefon="0535 777 88 99"),
        models.Musteri(id=4, ad_soyad="Ayşe T.", telefon="0536 222 33 44"),
        models.Musteri(id=5, ad_soyad="Burak S.", telefon="0537 555 66 77"),
        models.Musteri(id=6, ad_soyad="Zeynep A.", telefon="0538 888 99 00"),
    ]
    db.add_all(musteriler)
    db.flush()

    # ─── Demo Biletler (Arıza Kayıtları) ───
    biletler = [
        models.Bilet(
            bilet_no="TKT-1048",
            baslik="HP LaserJet Pro 400 - Yazıcı Ağ Bağlantı Sorunu",
            kategori="Ağ/İnternet",
            oncelik="Normal",
            durum="Açık",
            aciklama="HP LaserJet yazıcı kablosuz ağa bağlanamıyor. IP çakışması ve sürücü protokol hatası şüphesi.",
            teknisyen_notu="Teknisyen Burak S. atandı. Ağ kartı donanım kontrolü ve MAC adresi filtreleme denetimi yapılıyor.",
            talep_eden="Fatma D.",
            musteri_id=1,
        ),
        models.Bilet(
            bilet_no="TKT-1047",
            baslik="Ofis Ağı - Switch ve Modem Arası Bağlantı Kopması",
            kategori="Ağ/İnternet",
            oncelik="Yüksek",
            durum="İşlemde",
            aciklama="Ana modem ile switch arasındaki kabloda temassızlık ve paket kaybı. İnternet erişimi kesintide.",
            teknisyen_notu="Teknisyen Mustafa E. Cat6 kabloyu yeniden sonlandırdı, RJ45 konnektör değişti ve IP çakışması giderildi.",
            talep_eden="Ahmet Y.",
            musteri_id=2,
        ),
        models.Bilet(
            bilet_no="TKT-1046",
            baslik="Asus ZenBook 14 - Laptop Ekran Kırığı & Panel Değişimi",
            kategori="Bilgisayar/Donanım",
            oncelik="Normal",
            durum="Açık",
            aciklama="Düşme sonucu 14 inç OLED panel kırıldı, harici monitöre görüntü veriyor.",
            teknisyen_notu="Orijinal uyumlu Full HD IPS ekran paneli tedarik merkezinden istendi. Kasa menteşe yuvaları güçlendirilecek.",
            talep_eden="Mehmet K.",
            musteri_id=3,
        ),
        models.Bilet(
            bilet_no="TKT-1045",
            baslik="Seagate 1TB HDD - Muhasebe Veritabanı Kurtarma",
            kategori="Veri Kurtarma",
            oncelik="Yüksek",
            durum="Çözüldü",
            aciklama="Tıkırtı sesi gelen diskin dosya sistemi RAW olmuş. 5 yıllık SQL muhasebe kayıtları mevcut.",
            teknisyen_notu="Atölyede harici adaptör ve Linux ddrescue aracıyla sektör sektör imaj alınarak yeni 1TB SSD'ye aktarıldı.",
            talep_eden="Ayşe T.",
            musteri_id=4,
        ),
        models.Bilet(
            bilet_no="TKT-1044",
            baslik="Windows 11 Pro Lisanslama & Aktivasyon Hatası",
            kategori="Yazılım/İşletim Sistemi",
            oncelik="Düşük",
            durum="Çözüldü",
            aciklama="Yeni kurulan ofis bilgisayarında dijital lisans aktivasyon hatası 0xC004C003.",
            teknisyen_notu="Resmi Microsoft destek adımlarıyla OEM dijital lisans anahtarı girildi, slmgr komutlarıyla başarıyla etkinleştirildi.",
            talep_eden="Burak S.",
            musteri_id=5,
        ),
        models.Bilet(
            bilet_no="TKT-1043",
            baslik="Dell OptiPlex İş İstasyonu Aşırı Isınma & Kapanma",
            kategori="Bilgisayar/Donanım",
            oncelik="Yüksek",
            durum="İşlemde",
            aciklama="Ağır render işlemlerinde CPU 98°C sıcaklığa ulaşıp termal koruma nedeniyle aniden kapanıyor.",
            teknisyen_notu="Fan rulmanı temizlendi, Arctic MX-6 termal macun uygulaması yapıldı. Stres testleri devam ediyor.",
            talep_eden="Zeynep A.",
            musteri_id=6,
        ),
    ]
    db.add_all(biletler)

    # ─── Demo Stok (Yedek Parça) ───
    stok_listesi = [
        models.Stok(parca_adi="Samsung 870 EVO 500GB SSD", kategori="Depolama", miktar=8, min_esik=3, birim_fiyat=850),
        models.Stok(parca_adi="Kingston 8GB DDR4 3200MHz RAM", kategori="Bellek", miktar=12, min_esik=4, birim_fiyat=520),
        models.Stok(parca_adi="Arctic MX-6 Termal Macun (4g)", kategori="Bakım", miktar=25, min_esik=5, birim_fiyat=120),
        models.Stok(parca_adi="RJ45 Cat6 Konnektör (100'lü)", kategori="Ağ", miktar=3, min_esik=2, birim_fiyat=180),
        models.Stok(parca_adi="HP 14 inç IPS LCD Panel", kategori="Ekran", miktar=2, min_esik=1, birim_fiyat=1850),
        models.Stok(parca_adi="Asus Laptop Klavye (TR-Q)", kategori="Giriş Birimleri", miktar=4, min_esik=2, birim_fiyat=650),
        models.Stok(parca_adi="Dell Laptop 45W Batarya", kategori="Güç", miktar=3, min_esik=2, birim_fiyat=980),
        models.Stok(parca_adi="USB 3.0 SATA Adaptör Kablosu", kategori="Aksesuar", miktar=6, min_esik=3, birim_fiyat=95),
    ]
    db.add_all(stok_listesi)

    # ─── Demo Envanter (Donanım Varlıkları) ───
    envanter_cihazlari = [
        models.Cihaz(
            musteri_id=0, marka="Asus", model="Asus ExpertBook B1500 (i5-1135G7, 16GB, 512GB SSD)",
            seri_no="ENV-PC-101", tip="health-good",
        ),
        models.Cihaz(
            musteri_id=0, marka="TP-Link", model="TP-Link TL-SG1024D 24-Port Gigabit Switch",
            seri_no="ENV-SW-01", tip="health-good",
        ),
        models.Cihaz(
            musteri_id=0, marka="Lenovo", model="Lenovo ThinkCentre M70q (i5, 16GB, 512GB SSD)",
            seri_no="ENV-PC-104", tip="health-warn",
        ),
        models.Cihaz(
            musteri_id=0, marka="HP", model="HP LaserJet Pro M404dn Ağ Yazıcısı",
            seri_no="ENV-PRN-02", tip="health-good",
        ),
        models.Cihaz(
            musteri_id=0, marka="Synology", model="Synology DS220+ 2-Bay NAS (2x 4TB Seagate IronWolf)",
            seri_no="ENV-NAS-01", tip="health-good",
        ),
    ]
    db.add_all(envanter_cihazlari)

    db.commit()
    db.close()
    print("[OK] Demo verileri basariyla yuklendi.")
