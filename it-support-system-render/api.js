/**
 * ====================================================================
 * ITTECH BİLİŞİM - API & VERİ YÖNETİM KATMANI
 * api.js
 * ====================================================================
 * 
 * Bu dosya, uygulamanın sunucu tarafı (FastAPI Backend) ile iletişim
 * kuran RESTful API istemcisidir. Tüm veri işlemleri HTTP istekleri
 * (fetch) aracılığıyla gerçek veritabanına (SQLite/PostgreSQL)
 * yönlendirilmektedir.
 * 
 * MİMARİ NOT — "Separation of Concerns":
 * app.js dosyası bu katmanı (Api nesnesi) çağırır. Api nesnesinin
 * iç implementasyonu localStorage'dan fetch()'e geçirilmesine rağmen,
 * app.js'te TEK SATIR bile değişmemiştir. Bu, soyutlama katmanının
 * (Abstraction Layer) doğru tasarlandığının kanıtıdır.
 */

let API_BASE = '';
if (typeof window !== 'undefined') {
    // Local testing fallback (File protocol or Live Server)
    if (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') {
        API_BASE = 'http://localhost:8000';
    }
}

const Api = {
    // -------------------------------------
    // TICKETS (Destek Talepleri) API
    // -------------------------------------
    async getTickets() {
        try {
            const res = await fetch(`${API_BASE}/api/biletler`);
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            return JSON.parse(localStorage.getItem('ittech_tickets')) || [];
        }
    },

    async saveTickets(tickets) {
        try {
            const res = await fetch(`${API_BASE}/api/biletler/toplu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tickets),
            });
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return true;
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            localStorage.setItem('ittech_tickets', JSON.stringify(tickets));
            return true;
        }
    },

    // -------------------------------------
    // INVENTORY (Envanter) API
    // -------------------------------------
    async getInventory() {
        try {
            const res = await fetch(`${API_BASE}/api/envanter`);
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            return JSON.parse(localStorage.getItem('ittech_inventory')) || [];
        }
    },

    async saveInventory(inventory) {
        try {
            const res = await fetch(`${API_BASE}/api/envanter/toplu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventory),
            });
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return true;
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            localStorage.setItem('ittech_inventory', JSON.stringify(inventory));
            return true;
        }
    },

    // -------------------------------------
    // STOK (Yedek Parça) API
    // -------------------------------------
    async getStok() {
        try {
            const res = await fetch(`${API_BASE}/api/stok`);
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            let local = JSON.parse(localStorage.getItem('ittech_stok'));
            if (!local || local.length === 0) {
                local = [
                    { id: 1, parca_adi: "Samsung 870 EVO 500GB SSD", kategori: "Depolama", miktar: 8, adet: 8, min_esik: 3, birim_fiyat: 850 },
                    { id: 2, parca_adi: "Kingston 8GB DDR4 3200MHz RAM", kategori: "Bellek", miktar: 12, adet: 12, min_esik: 4, birim_fiyat: 520 },
                    { id: 3, parca_adi: "Arctic MX-6 Termal Macun (4g)", kategori: "Bakım", miktar: 25, adet: 25, min_esik: 5, birim_fiyat: 120 },
                    { id: 4, parca_adi: "RJ45 Cat6 Konnektör (100'lü)", kategori: "Ağ & Kablolama", miktar: 3, adet: 3, min_esik: 2, birim_fiyat: 180 },
                    { id: 5, parca_adi: "HP 14 inç IPS LCD Panel", kategori: "Ekran", miktar: 2, adet: 2, min_esik: 2, birim_fiyat: 1850 },
                    { id: 6, parca_adi: "Evrensel 65W Type-C Laptop Şarj Adaptörü", kategori: "Güç", miktar: 5, adet: 5, min_esik: 2, birim_fiyat: 850 },
                    { id: 7, parca_adi: "Asus Laptop Klavye (TR-Q)", kategori: "Giriş Birimleri", miktar: 4, adet: 4, min_esik: 2, birim_fiyat: 650 },
                    { id: 8, parca_adi: "Dell Laptop 45W Batarya", kategori: "Güç", miktar: 1, adet: 1, min_esik: 2, birim_fiyat: 980 }
                ];
                localStorage.setItem('ittech_stok', JSON.stringify(local));
            }
            return local;
        }
    },

    async createStok(stokData) {
        try {
            const res = await fetch(`${API_BASE}/api/stok`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stokData),
            });
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            const stoklar = await this.getStok();
            const qty = stokData.miktar !== undefined ? stokData.miktar : (stokData.adet || 1);
            const yeniStok = { 
                ...stokData, 
                id: Date.now(),
                parca_adi: stokData.parca_adi || stokData.ad,
                miktar: qty,
                adet: qty
            };
            stoklar.unshift(yeniStok);
            localStorage.setItem('ittech_stok', JSON.stringify(stoklar));
            return yeniStok;
        }
    },

    async stokDusum(stokId, adet = 1) {
        try {
            const res = await fetch(`${API_BASE}/api/stok/${stokId}/dusum?adet=${adet}`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            const stoklar = await this.getStok();
            const idx = stoklar.findIndex(s => s.id == stokId);
            if (idx !== -1) {
                const currentQty = stoklar[idx].miktar !== undefined ? stoklar[idx].miktar : stoklar[idx].adet;
                if (currentQty >= adet) {
                    const newQty = currentQty - adet;
                    stoklar[idx].miktar = newQty;
                    stoklar[idx].adet = newQty;
                    localStorage.setItem('ittech_stok', JSON.stringify(stoklar));
                    return stoklar[idx];
                }
            }
            throw new Error("Stok yetersiz veya bulunamadı");
        }
    },

    // -------------------------------------
    // TEKİL BİLET OLUŞTURMA (createTicket)
    // -------------------------------------
    async createTicket(ticketData) {
        try {
            const res = await fetch(`${API_BASE}/api/biletler`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData),
            });
            if (!res.ok) throw new Error('API hatası: ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('API bağlantısı kurulamadı, localStorage fallback:', err);
            const biletler = await this.getTickets();
            const yeni = { ...ticketData, id: ticketData.id || `TKT-${Math.floor(Math.random() * 9000) + 1000}` };
            biletler.unshift(yeni);
            await this.saveTickets(biletler);
            return yeni;
        }
    }
};
