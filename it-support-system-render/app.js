/**
 * ====================================================================
 * ITTECH BİLİŞİM - KURUMSAL TEKNİK DESTEK VE BİLİŞİM YÖNETİM PORTALI
 * Ana Uygulama Mantığı (app.js)
 * ====================================================================
 * 
 * Bu dosya, Teknik Destek ve Bilişim Altyapı Yönetim Portalı'nın
 * tüm iş mantığını (business logic) içermektedir:
 *   1. Kullanıcı Rolü ve Kimlik Yönetimi (RBAC - Role Based Access Control)
 *   2. Çok Sekmeli (Multi-Tab) Modüler Gezinme
 *   3. Arıza Biletleme CRUD ve Canlı Durum Otomasyonu
 *   4. Donanım ve Cihaz Envanteri (Asset Management)
 *   5. Bilgi Bankası (Knowledge Base) Teşhis Rehberleri
 *   6. Chart.js ile Canlı Metrik ve SLA Analitiği
 *   7. Veri Kalıcılığı (LocalStorage Persistence) ve CSV/JSON Dışa Aktarımı
 * 
 * Yazar: Bilgisayar Bilimleri Stajyeri
 * Kurum: ITTECH Elektrik Elektronik Bilişim Ltd. Şti.
 * Tarih: 13 Eylül 2026
 * ====================================================================
 */

// ============================================
// 1. STATE YÖNETİMİ & VERİ MODELLERİ
// ============================================

/** @type {Object} Aktif kullanıcı oturum nesnesi */
let currentUser = { username: 'Yönetici', role: 'admin' };

/** @type {Chart|null} Durum dağılımı Chart.js örneği */
let statusChartInstance = null;

/** @type {Chart|null} Kategori dağılımı Chart.js örneği */
let categoryChartInstance = null;

/** @type {string|null} Detayı açık olan bilet ID'si */
let currentModalTicketId = null;

/**
 * Başlangıç Arıza Kayıtları (Varsayılan kurumsal test verisi)
 */
const defaultTickets = [
    {
        id: 'TKT-1048',
        title: 'HP LaserJet Pro 400 - Yazıcı Ağ Bağlantı Sorunu',
        category: 'Ağ/İnternet',
        priority: 'Normal',
        desc: 'HP LaserJet yazıcı kablosuz ağa bağlanamıyor. IP çakışması ve sürücü protokol hatası şüphesi.',
        status: 'Açık',
        owner: 'Fatma D.',
        date: '14.09.2026',
        techNote: 'Teknisyen Burak S. atandı. Ağ kartı donanım kontrolü ve MAC adresi filtreleme denetimi yapılıyor.'
    },
    {
        id: 'TKT-1047',
        title: 'Ofis Ağı - Switch ve Modem Arası Bağlantı Kopması',
        category: 'Ağ/İnternet',
        priority: 'Yüksek',
        desc: 'Ana modem ile switch arasındaki kabloda temassızlık ve paket kaybı. İnternet erişimi kesintide.',
        status: 'İşlemde',
        owner: 'Ahmet Y.',
        date: '12.09.2026',
        techNote: 'Teknisyen Mustafa E. Cat6 kabloyu yeniden sonlandırdı, RJ45 konnektör değişti ve IP çakışması giderildi.'
    },
    {
        id: 'TKT-1046',
        title: 'Asus ZenBook 14 - Laptop Ekran Kırığı & Panel Değişimi',
        category: 'Bilgisayar/Donanım',
        priority: 'Normal',
        desc: 'Düşme sonucu 14 inç OLED panel kırıldı, harici monitöre görüntü veriyor.',
        status: 'Açık',
        owner: 'Mehmet K.',
        date: '13.09.2026',
        techNote: 'Orijinal uyumlu Full HD IPS ekran paneli tedarik merkezinden istendi. Kasa menteşe yuvaları güçlendirilecek.'
    },
    {
        id: 'TKT-1045',
        title: 'Seagate 1TB HDD - Muhasebe Veritabanı Kurtarma',
        category: 'Veri Kurtarma',
        priority: 'Yüksek',
        desc: 'Tıkırtı sesi gelen diskin dosya sistemi RAW olmuş. 5 yıllık SQL muhasebe kayıtları mevcut.',
        status: 'Çözüldü',
        owner: 'Ayşe T.',
        date: '10.09.2026',
        techNote: 'Atölyede harici adaptör ve Linux ddrescue aracıyla sektör sektör imaj alınarak yeni 1TB SSD\'ye aktarıldı.'
    },
    {
        id: 'TKT-1044',
        title: 'Windows 11 Pro Lisanslama & Aktivasyon Hatası',
        category: 'Yazılım/İşletim Sistemi',
        priority: 'Düşük',
        desc: 'Yeni kurulan ofis bilgisayarında dijital lisans aktivasyon hatası 0xC004C003.',
        status: 'Çözüldü',
        owner: 'Burak S.',
        date: '09.09.2026',
        techNote: 'Resmi Microsoft destek adımlarıyla OEM dijital lisans anahtarı girildi, slmgr komutlarıyla başarıyla etkinleştirildi.'
    },
    {
        id: 'TKT-1043',
        title: 'Dell OptiPlex İş İstasyonu Aşırı Isınma & Kapanma',
        category: 'Bilgisayar/Donanım',
        priority: 'Yüksek',
        desc: 'Ağır render işlemlerinde CPU 98°C sıcaklığa ulaşıp termal koruma nedeniyle aniden kapanıyor.',
        status: 'İşlemde',
        owner: 'Zeynep A.',
        date: '08.09.2026',
        techNote: 'Fan rulmanı temizlendi, Arctic MX-6 termal macun uygulaması yapıldı. Stres testleri devam ediyor.'
    }
];

let tickets = [];

// ============================================
// 0. PROFESYONEL BİLDİRİM SİSTEMİ (TOAST & MODAL)
// ============================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconSvg = type === 'success'
        ? `<svg class="svg-icon" style="color:var(--success);" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg class="svg-icon" style="color:var(--warning);" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span> <span class="toast-text">${message}</span>`;
    
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Tetikleme gecikmesi (Animasyon için)
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirm(message, onConfirm) {
    document.getElementById('confirm-modal-text').textContent = message;
    document.getElementById('confirm-modal').classList.remove('hidden');
    
    const confirmBtn = document.getElementById('confirm-btn-yes');
    const cancelBtn = document.getElementById('confirm-btn-no');
    
    confirmBtn.onclick = () => {
        document.getElementById('confirm-modal').classList.add('hidden');
        onConfirm();
    };
    cancelBtn.onclick = () => {
        document.getElementById('confirm-modal').classList.add('hidden');
    };
}


// ============================================
// 2. KULLANICI GİRİŞİ & HIZLI ROL DEĞİŞİMİ
// ============================================

/**
 * Login formu submit
 */
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (username.toLowerCase() === 'admin') {
        currentUser = { username: 'Yönetici', role: 'admin' };
    } else if (username.toLowerCase().includes('tek') || username.toLowerCase() === 'teknisyen') {
        currentUser = { username: username || 'Teknisyen Mustafa', role: 'tech' };
    } else {
        currentUser = { username: username || 'Fatma D.', role: 'user' };
    }
    localStorage.setItem('ittech_user', JSON.stringify(currentUser));
    showDashboard();
});

/**
 * Hızlı tek tıkla giriş
 */
function quickLogin(username) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = '123456';
    document.getElementById('login-form').dispatchEvent(new Event('submit'));
}

/**
 * Çıkış butonu
 */
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('ittech_user');
    currentUser = null;
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('login-form').reset();
});

/**
 * Header içinden canlı rol değiştirme (Test kolaylığı için)
 */
function switchUserRole(newRole) {
    if (newRole === 'admin') {
        currentUser = { username: 'Yönetici', role: 'admin' };
    } else if (newRole === 'tech') {
        currentUser = { username: 'Teknisyen Mustafa', role: 'tech' };
    } else {
        currentUser = { username: 'Fatma D.', role: 'user' };
    }
    localStorage.setItem('ittech_user', JSON.stringify(currentUser));
    
    // Buton aktifliklerini güncelle
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    if (newRole === 'admin') document.getElementById('role-admin-btn').classList.add('active');
    if (newRole === 'tech') document.getElementById('role-tech-btn').classList.add('active');
    if (newRole === 'user') document.getElementById('role-user-btn').classList.add('active');

    // Selamlama güncelle
    document.getElementById('user-greeting').textContent = `Hoş Geldiniz, ${currentUser.username} (${currentUser.role.toUpperCase()})`;
    
    // Tabloyu ve kontrolleri yeniden render et
    renderTickets();
    updateSummary();
}

/**
 * Dashboard ekranını gösterir
 */
function showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    
    document.getElementById('user-greeting').textContent = `Hoş Geldiniz, ${currentUser.username}`;
    
    // Rol butonunu ayarla
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    if (currentUser.role === 'admin') document.getElementById('role-admin-btn')?.classList.add('active');
    if (currentUser.role === 'tech') document.getElementById('role-tech-btn')?.classList.add('active');
    if (currentUser.role === 'user') document.getElementById('role-user-btn')?.classList.add('active');

    // Başlangıç sekmesi
    switchTab('dashboard');
    updateSummary();
    renderTickets();
    renderInventory();
    initCharts();
}

// ============================================
// 3. ÇOK SEKMELİ (MULTI-TAB) YÖNETİM
// ============================================

function switchTab(tabId) {
    // Sekme butonlarını güncelle
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`tab-${tabId}-btn`);
    if (targetBtn) targetBtn.classList.add('active');

    // Sekme içeriklerini güncelle
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.remove('hidden');

    // İlgili sekmeye göre tazeleme
    if (tabId === 'tickets') {
        renderTickets();
    } else if (tabId === 'inventory') {
        renderInventory();
    } else if (tabId === 'stock') {
        renderStok();
    } else if (tabId === 'dashboard') {
        updateSummary();
        initCharts();
    }
}

// ============================================
// 4. BİLET CRUD İŞLEMLERİ & FİLTRELEME
// ============================================

function toggleNewTicketForm() {
    const formContainer = document.getElementById('new-ticket-form-container');
    formContainer.classList.toggle('hidden');
}

/**
 * Yeni Bilet Ekleme Formu
 */
document.getElementById('ticket-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ticket-title').value.trim();
    const owner = document.getElementById('ticket-owner').value.trim();
    const category = document.getElementById('ticket-category').value;
    const priority = document.getElementById('ticket-priority').value;
    const desc = document.getElementById('ticket-desc').value.trim();

    const randomId = Math.floor(1050 + Math.random() * 500);
    const newId = `TKT-${randomId}`;

    const newTicket = {
        id: newId,
        title: title,
        category: category,
        priority: priority,
        desc: desc,
        status: 'Açık',
        owner: owner || currentUser.username,
        date: new Date().toLocaleDateString('tr-TR'),
        techNote: 'Sisteme yeni talep eklendi. Teşhis sırasına alındı.'
    };

    tickets.unshift(newTicket);
    await Api.saveTickets(tickets);

    // Formu temizle ve gizle
    document.getElementById('ticket-form').reset();
    toggleNewTicketForm();

    // Görünümü güncelle
    renderTickets();
    updateSummary();
    initCharts();

    showToast(`'${newId}' numaralı destek talebi başarıyla oluşturuldu.`, 'success');
});

/**
 * Bilet Listesini Tabloya Render Etme
 */
function renderTickets(filteredList = null) {
    const list = filteredList || getPermittedTickets();
    const tbody = document.getElementById('tickets-tbody');
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:30px;">Eşleşen destek talebi bulunamadı.</td></tr>`;
        return;
    }

    list.forEach(ticket => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="viewTicketModal('${ticket.id}')">${ticket.id}</strong></td>
            <td>
                <div style="font-weight:600; cursor:pointer;" onclick="viewTicketModal('${ticket.id}')">${ticket.title}</div>
                <small style="color:var(--text-muted);">${ticket.date}</small>
            </td>
            <td>${ticket.owner}</td>
            <td><span style="font-size:12px;">${ticket.category}</span></td>
            <td><span class="badge priority-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge status-${ticket.status}">${ticket.status}</span></td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="viewTicketModal('${ticket.id}')">Detay</button>
                    ${currentUser.role !== 'user' ? `
                        <select class="status-select" onchange="quickChangeStatus('${ticket.id}', this.value)">
                            <option value="Açık" ${ticket.status === 'Açık' ? 'selected' : ''}>Açık</option>
                            <option value="İşlemde" ${ticket.status === 'İşlemde' ? 'selected' : ''}>İşlemde</option>
                            <option value="Çözüldü" ${ticket.status === 'Çözüldü' ? 'selected' : ''}>Çözüldü</option>
                        </select>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Kullanıcı yetkisine göre bilet listesini sınırlandır
 */
function getPermittedTickets() {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'tech') {
        return tickets;
    }
    // Müşteri sadece kendi açtığı biletleri görür
    return tickets.filter(t => t.owner.toLowerCase().includes(currentUser.username.toLowerCase()) || t.owner === 'Fatma D.');
}

/**
 * Çoklu Filtreleme
 */
function applyFilters() {
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    const statusVal = document.getElementById('filter-status').value;
    const priorityVal = document.getElementById('filter-priority').value;
    const categoryVal = document.getElementById('filter-category').value;

    let result = getPermittedTickets();

    if (searchVal) {
        result = result.filter(t => 
            t.id.toLowerCase().includes(searchVal) ||
            t.title.toLowerCase().includes(searchVal) ||
            t.owner.toLowerCase().includes(searchVal) ||
            t.desc.toLowerCase().includes(searchVal)
        );
    }
    if (statusVal !== 'all') {
        result = result.filter(t => t.status === statusVal);
    }
    if (priorityVal !== 'all') {
        result = result.filter(t => t.priority === priorityVal);
    }
    if (categoryVal !== 'all') {
        result = result.filter(t => t.category === categoryVal);
    }

    renderTickets(result);
}

/**
 * Hızlı Durum Değiştirme
 */
async function quickChangeStatus(id, newStatus) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = newStatus;
        await Api.saveTickets(tickets);
        renderTickets();
        updateSummary();
        initCharts();
    }
}

// ============================================
// 5. BİLET DETAY MODALI & SERVİS FİŞİ
// ============================================

function viewTicketModal(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    currentModalTicketId = ticketId;
    document.getElementById('modal-id').textContent = ticket.id;
    document.getElementById('modal-owner').textContent = ticket.owner;
    document.getElementById('modal-date').textContent = ticket.date;
    document.getElementById('modal-cat-prio').textContent = `${ticket.category} — ${ticket.priority} Öncelik`;
    document.getElementById('modal-desc').textContent = ticket.desc;

    // Status
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = ticket.status;
    statusBadge.className = `badge status-${ticket.status}`;

    const statusSelect = document.getElementById('modal-status-select');
    statusSelect.value = ticket.status;
    statusSelect.style.display = (currentUser.role === 'user') ? 'none' : 'inline-block';

    // Tech note
    document.getElementById('modal-tech-log').textContent = ticket.techNote || 'Henüz eklenmiş bir teknisyen servis notu bulunmuyor.';
    document.getElementById('modal-tech-input').value = '';

    // Admin silme butonu
    const delBtn = document.getElementById('modal-delete-btn');
    delBtn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';

    document.getElementById('ticket-modal').classList.remove('hidden');
}

function updateTicketStatusFromModal(newStatus) {
    if (!currentModalTicketId) return;
    quickChangeStatus(currentModalTicketId, newStatus);
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = newStatus;
    statusBadge.className = `badge status-${newStatus}`;
}

function saveTechnicianNote() {
    const noteInput = document.getElementById('modal-tech-input');
    const noteText = noteInput.value.trim();
    if (!noteText || !currentModalTicketId) return;

    const ticket = tickets.find(t => t.id === currentModalTicketId);
    if (ticket) {
        const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        ticket.techNote = `[${timeStr} - ${currentUser.username}]: ${noteText}`;
        
        Api.saveTickets(tickets).then(() => {
            document.getElementById('modal-tech-log').textContent = ticket.techNote;
            noteInput.value = '';
            showToast('Teknisyen notu başarıyla eklendi.', 'success');
        });
    }
}

function deleteTicketFromModal() {
    if (!currentModalTicketId || currentUser.role !== 'admin') return;
    
    showConfirm(`'${currentModalTicketId}' numaralı destek kaydını kalıcı olarak silmek istediğinize emin misiniz?`, async () => {
        tickets = tickets.filter(t => t.id !== currentModalTicketId);
        await Api.saveTickets(tickets);
        closeModal();
        renderTickets();
        updateSummary();
        initCharts();
        showToast('Kayıt kalıcı olarak silindi.', 'success');
    });
}

function closeModal() {
    document.getElementById('ticket-modal').classList.add('hidden');
    currentModalTicketId = null;
}

// ============================================
// 6. METRİKLER & CHART.JS GRAFİKLERİ
// ============================================

function updateSummary() {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Açık').length;
    const progress = tickets.filter(t => t.status === 'İşlemde').length;
    const done = tickets.filter(t => t.status === 'Çözüldü').length;

    document.getElementById('sc-total').textContent = total;
    document.getElementById('sc-open').textContent = open;
    document.getElementById('sc-progress').textContent = progress;
    document.getElementById('sc-done').textContent = done;
}

function initCharts() {
    const statusCounts = {
        'Açık': tickets.filter(t => t.status === 'Açık').length,
        'İşlemde': tickets.filter(t => t.status === 'İşlemde').length,
        'Çözüldü': tickets.filter(t => t.status === 'Çözüldü').length
    };

    const categoryCounts = {};
    tickets.forEach(t => {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // Durum Doughnut Grafiği
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (statusCtx) {
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } }
                }
            }
        });
    }

    // Kategori Bar Grafiği
    const catCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (catCtx) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    label: 'Talep Sayısı',
                    data: Object.values(categoryCounts),
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
}

// ============================================
// 7. BİLGİ BANKASI REHBERLERİ
// ============================================

const kbGuides = {
    bsod: {
        title: 'Mavi Ekran (BSOD) ve Minidump Hata Analiz Prosedürü',
        content: `
            <div style="line-height:1.7; font-size:14px; color:var(--text-main);">
                <p><strong>Amaç:</strong> Windows işletim sisteminde beklenmedik sistem kilitlenmeleri ve çekirdek (kernel) çökmelerinin kök nedenini belirlemek.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">1. Minidump Dosyalarının Konumu:</h4>
                <p>Kilitlenme kayıtları varsayılan olarak <code>C:\\Windows\\Minidump\\*.dmp</code> dizininde saklanır. Sistem açılmıyorsa Windows PE USB ortamından bu dosya harici ortama kopyalanır.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">2. WinDbg (Windows Debugger) ile Analiz:</h4>
                <pre style="background:rgba(0,0,0,0.5); padding:12px; border-radius:6px; font-family:monospace; color:#60a5fa;">!analyze -v</pre>
                <p>Bu komut çıktısında <code>MODULE_NAME</code>, <code>PROCESS_NAME</code> ve <code>FAILURE_BUCKET_ID</code> parametreleri çökmeye neden olan üçüncü taraf sürücüyü (örn: <code>nvlddmkm.sys</code> ekran kartı sürücüsü veya <code>netwtw10.sys</code> Wi-Fi sürücüsü) işaret eder.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">3. Donanımsal Test Protokolü:</h4>
                <p>Yazılımsal sürücü güncellemesi sorunu çözmezse, MemTest86 ile 4 geçişli (pass) RAM bütünlük testi yapılır ve disk SMART CRC Error Count (ID 199) incelenir.</p>
            </div>
        `
    },
    network: {
        title: 'Kurumsal Ağda IP Çakışması ve DHCP Giderme Rehberi',
        content: `
            <div style="line-height:1.7; font-size:14px; color:var(--text-main);">
                <p><strong>Amaç:</strong> İki veya daha fazla ağ cihazının aynı IP adresini talep etmesi sonucu oluşan bağlantı kesintilerini izole etmek.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">1. ARP Tablosu ve Çift IP Tespiti:</h4>
                <p>Yönetici komut satırından komut çalıştırılarak IP adresiyle eşleşen MAC adresi sorgulanır:</p>
                <pre style="background:rgba(0,0,0,0.5); padding:12px; border-radius:6px; font-family:monospace; color:#60a5fa;">arp -a 192.168.1.104</pre>
                <h4 style="margin:16px 0 8px; color:var(--primary);">2. DHCP Kiralama (Lease) Havuzu Rezervasyonu:</h4>
                <p>Yazıcılar, NAS ve sunucular DHCP dinamik aralığı dışında (örn: 192.168.1.2 - 192.168.1.50) statik olarak tanımlanmalı veya MAC adresine rezerve edilmelidir.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">3. İstemci DNS/IP Temizleme:</h4>
                <pre style="background:rgba(0,0,0,0.5); padding:12px; border-radius:6px; font-family:monospace; color:#60a5fa;">ipconfig /release & ipconfig /renew & ipconfig /flushdns</pre>
            </div>
        `
    },
    disk: {
        title: 'Bad Sector Tespiti & Güvenli İmaj Alma Prosedürü',
        content: `
            <div style="line-height:1.7; font-size:14px; color:var(--text-main);">
                <p><strong>Amaç:</strong> Okuma/yazma kafası zayıflayan veya manyetik yüzeyinde bad sector oluşan disklerden veri kaybı yaşamadan kurtarma yapmak.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">1. Canlı İşletim Sisteminden Asla Taramayın!</h4>
                <p>Bozuk diske Windows üzerinden chkdsk çalıştırmak verileri kalıcı olarak bozabilir. Disk salt-okunur (read-only) donanım bloklayıcı ile bağlanmalıdır.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">2. GNU ddrescue ile İki Aşamalı Ham İmaj:</h4>
                <pre style="background:rgba(0,0,0,0.5); padding:12px; border-radius:6px; font-family:monospace; color:#60a5fa;">ddrescue -d -r 3 /dev/sdb /hedef/disk_imaji.img /hedef/kurtarma.logfile</pre>
                <p>İlk geçişte bozuk sektörler atlanarak sağlam alanlar hızla kurtarılır; ikinci geçişte ise logfile kullanılarak hasarlı sektörler ters yönden zorlanmadan taranır.</p>
            </div>
        `
    },
    vlan: {
        title: '802.1Q VLAN ve Firewall Ağ Yalıtımı Mimarisi',
        content: `
            <div style="line-height:1.7; font-size:14px; color:var(--text-main);">
                <p><strong>Amaç:</strong> Şirket ağında muhasebe departmanını, misafir Wi-Fi ve IoT cihazlarını katman 2 seviyesinde izole etmek.</p>
                <h4 style="margin:16px 0 8px; color:var(--primary);">1. VLAN Kimlikleri (VLAN ID):</h4>
                <ul>
                    <li>VLAN 10 - Kurumsal Yönetim (192.168.10.0/24)</li>
                    <li>VLAN 20 - Muhasebe & ERP (192.168.20.0/24) - Yüksek Güvenlik</li>
                    <li>VLAN 30 - Misafir Wi-Fi (172.16.30.0/24) - Yalnızca Dış İnternet</li>
                </ul>
                <h4 style="margin:16px 0 8px; color:var(--primary);">2. pfSense Firewall Kuralı:</h4>
                <p>VLAN 30 arayüzünden VLAN 20 subnetine doğru tüm TCP/UDP trafikleri 'Block & Log' kuralı ile engellenir.</p>
            </div>
        `
    }
};

function openKbModal(guideKey) {
    const guide = kbGuides[guideKey];
    if (!guide) return;
    document.getElementById('kb-modal-title').textContent = guide.title;
    document.getElementById('kb-modal-content').innerHTML = guide.content;
    document.getElementById('kb-modal').classList.remove('hidden');
}

function closeKbModal() {
    document.getElementById('kb-modal').classList.add('hidden');
}

// ============================================
// 8. ENVANTER VE DONANIM YÖNETİMİ
// ============================================

const defaultInventory = [
    {
        id: 'ENV-PC-101',
        model: 'Asus ExpertBook B1500 (i5-1135G7, 16GB, 512GB SSD)',
        ip: '192.168.1.42',
        mac: '00:1A:2B:3C:4D:5E',
        dept: 'Teknik Servis Atölyesi',
        health: 'health-good',
        healthLabel: '%100 Sağlam',
        date: '01.09.2026',
        specs: 'Test ve teşhis istasyonu. Windows 11 Pro 64-bit kurulu, MemTest86 ve disk analiz yazılımları yüklü.',
        warranty: '12 Ay Distribütör Garantisi'
    },
    {
        id: 'ENV-SW-01',
        model: 'TP-Link TL-SG1024D 24-Port Gigabit Switch',
        ip: '192.168.1.2',
        mac: '00:2B:3C:4D:5E:6F',
        dept: 'Atölye Ağ Omurgası',
        health: 'health-good',
        healthLabel: '%100 Sağlam',
        date: '15.08.2026',
        specs: 'Cat6 patch kablolarla tüm servis masalarına 1Gbps yerel ağ erişimi sağlar.',
        warranty: '2 Yıl Garanti'
    },
    {
        id: 'ENV-PC-104',
        model: 'Lenovo ThinkCentre M70q (i5, 16GB, 512GB SSD)',
        ip: '192.168.1.45',
        mac: 'A4:BB:6D:88:12:30',
        dept: 'Muhasebe Masası',
        health: 'health-warn',
        healthLabel: '%78 SMART Uyarısı',
        date: '20.08.2026',
        specs: 'CrystalDiskInfo SMART uyarısı verdi. Reallocated Sectors Count artışta, veri yedeklemesi yapıldı.',
        warranty: 'SSD Değişimi Planlandı'
    },
    {
        id: 'ENV-PRN-02',
        model: 'HP LaserJet Pro M404dn Ağ Yazıcısı',
        ip: '192.168.1.80',
        mac: '3C:D9:2B:10:44:02',
        dept: 'Müşteri Kabul Masası',
        health: 'health-good',
        healthLabel: '%95 Normal',
        date: '05.09.2026',
        specs: 'Servis fişi ve teslimat dökümü için çift taraflı gigabit ağ yazıcısı. Toner seviyesi %65.',
        warranty: 'Kalan Garanti: 6 Ay'
    },
    {
        id: 'ENV-NAS-01',
        model: 'Synology DS220+ 2-Bay NAS (2x 4TB Seagate IronWolf)',
        ip: '192.168.1.15',
        mac: '90:09:D0:A2:18:77',
        dept: 'Yedekleme & İmaj Arşivi',
        health: 'health-good',
        healthLabel: '%100 Sağlam',
        date: '10.09.2026',
        specs: 'RAID 1 ayna yapılandırması. Müşteri veri yedekleri ve sürücü ISO arşivleri saklanıyor.',
        warranty: '2 Yıl Resmi Garanti'
    }
];

let inventory = [];
// inventory Api üzerinden DOMContentLoaded içerisinde çekiliyor.

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    inventory.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.model}</td>
            <td><code>${item.ip || '-'}</code><br><small style="color:var(--text-muted)">${item.mac || '-'}</small></td>
            <td>${item.dept}</td>
            <td><span class="health-badge ${item.health}">${item.healthLabel}</span></td>
            <td>${item.date}</td>
            <td><button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="viewInventoryDetail('${item.id}')">Detay</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function viewInventoryDetail(assetId) {
    const d = inventory.find(i => i.id === assetId);
    if (!d) return;

    document.getElementById('inv-modal-title').textContent = `${d.id} - Varlık Detayı`;
    document.getElementById('inv-modal-content').innerHTML = `
        <div style="line-height:1.6; font-size:14px;">
            <p><strong>Cihaz / Donanım Modeli:</strong> ${d.model}</p>
            <p style="margin-top:6px;"><strong>Departman / Konum:</strong> ${d.dept}</p>
            <p style="margin-top:6px;"><strong>Teknik Özellikler:</strong> ${d.specs || 'Belirtilmedi'}</p>
            <p style="margin-top:6px;"><strong>Ağ Yapılandırması:</strong> IP: ${d.ip || '-'} | MAC: <code>${d.mac || '-'}</code></p>
            <p style="margin-top:6px;"><strong>Sağlık Durumu:</strong> <span class="health-badge ${d.health}">${d.healthLabel}</span></p>
            <p style="margin-top:6px;"><strong>Son Bakım Tarihi:</strong> ${d.date}</p>
            <p style="margin-top:6px;"><strong>Garanti Durumu:</strong> ${d.warranty || 'Belirtilmedi'}</p>
        </div>
    `;
    document.getElementById('inv-modal').classList.remove('hidden');
}

function closeInvModal() {
    document.getElementById('inv-modal').classList.add('hidden');
}

function openNewDeviceModal() {
    document.getElementById('new-device-modal').classList.remove('hidden');
}

function closeNewDeviceModal() {
    document.getElementById('new-device-modal').classList.add('hidden');
    document.getElementById('new-device-form').reset();
}

async function saveNewDevice(e) {

    e.preventDefault();
    const id = document.getElementById('dev-asset-id').value.trim();
    const dept = document.getElementById('dev-dept').value.trim();
    const model = document.getElementById('dev-model').value.trim();
    const ip = document.getElementById('dev-ip').value.trim() || '-';
    const mac = document.getElementById('dev-mac').value.trim() || '-';
    const healthSelect = document.getElementById('dev-health');
    const health = healthSelect.value;
    const healthLabel = healthSelect.options[healthSelect.selectedIndex].text;
    const date = document.getElementById('dev-date').value.trim() || new Date().toLocaleDateString('tr-TR');
    const specs = document.getElementById('dev-specs').value.trim();

    const newDev = {
        id,
        model,
        dept,
        ip,
        mac,
        health,
        healthLabel,
        date,
        specs,
        warranty: 'Atölye Kaydı'
    };

    inventory.unshift(newDev);
    await Api.saveInventory(inventory);
    renderInventory();
    closeNewDeviceModal();
    showToast(`'${id}' envanter kaydı başarıyla eklendi!`, 'success');

}

// ============================================
// 9. DIŞA AKTARMA (CSV & JSON EXPORT)
// ============================================

function exportTicketsCSV() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Kayit No;Baslik;Talep Eden;Kategori;Oncelik;Durum;Tarih;Teknisyen Notu\n";

    tickets.forEach(t => {
        const row = [
            `"${t.id}"`,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${(t.owner || '').replace(/"/g, '""')}"`,
            `"${t.category}"`,
            `"${t.priority}"`,
            `"${t.status}"`,
            `"${t.date}"`,
            `"${(t.techNote || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(";") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ITTECH_Destek_Talepleri_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportTicketsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tickets, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `ITTECH_Veritabani_Yedegi_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// 10. YEDEK PARÇA & STOK YÖNETİMİ
// ============================================

let stokList = [];

/**
 * Stok tablosunu dinamik doldurur
 */
async function renderStok() {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">Stok verileri yükleniyor...</td></tr>';

    try {
        stokList = await Api.getStok();
    } catch (err) {
        console.error('Stok verisi yüklenirken hata:', err);
    }

    if (!stokList || stokList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">Kayıtlı yedek parça bulunamadı.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    stokList.forEach(s => {
        const tr = document.createElement('tr');
        const id = s.id;
        const name = s.parca_adi || s.ad || 'İsimsiz Parça';
        const kat = s.kategori || 'Genel';
        const adet = (s.miktar !== undefined ? s.miktar : s.adet) || 0;
        const fiyat = (s.birim_fiyat !== undefined ? s.birim_fiyat : s.fiyat) || 0;
        const minEsik = s.min_esik || 2;

        let badgeClass = 'health-good';
        let badgeText = 'Yeterli';

        if (adet === 0) {
            badgeClass = 'health-bad';
            badgeText = 'Tükendi (0 Adet)';
        } else if (adet <= minEsik) {
            badgeClass = 'health-crit';
            badgeText = `Kritik (${adet} Adet)`;
        } else {
            badgeClass = 'health-good';
            badgeText = `Stokta (${adet} Adet)`;
        }

        tr.innerHTML = `
            <td><strong>${name}</strong></td>
            <td><span style="background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 4px; font-size: 12px; color: var(--text-muted);">${kat}</span></td>
            <td><strong>${adet} Adet</strong></td>
            <td>${fiyat ? fiyat + ' ₺' : '-'}</td>
            <td><span class="health-badge ${badgeClass}">${badgeText}</span></td>
            <td>
                <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;" onclick="handleStokDusum(${id})" ${adet <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    <svg class="svg-icon" style="width:12px; height:12px;" viewBox="0 0 24 24"><polyline points="16.5 9.4 7.55 4.24"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    1 Adet Kullan
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Servis işlemi için stoktan parça düşümü
 */
async function handleStokDusum(stokId) {
    try {
        await Api.stokDusum(stokId, 1);
        showToast('1 adet parça servis işleminde kullanıldı ve stoktan düşüldü.', 'success');
        await renderStok();
    } catch (err) {
        showToast(err.message || 'Stok düşümü yapılamadı.', 'error');
    }
}

/**
 * Stok modalı açma
 */
function openNewStockModal() {
    document.getElementById('new-stock-modal').classList.remove('hidden');
}

/**
 * Stok modalı kapatma
 */
function closeNewStockModal() {
    document.getElementById('new-stock-modal').classList.add('hidden');
    const form = document.getElementById('new-stock-form');
    if (form) form.reset();
}

/**
 * Yeni stok kaydetme
 */
async function saveNewStok(e) {
    e.preventDefault();
    const ad = document.getElementById('stok-ad').value.trim();
    const kategori = document.getElementById('stok-kategori').value.trim();
    const miktar = parseInt(document.getElementById('stok-adet').value, 10) || 1;
    const birim_fiyat = parseFloat(document.getElementById('stok-fiyat').value) || 0;

    const payload = {
        parca_adi: ad,
        kategori: kategori,
        miktar: miktar,
        adet: miktar,
        min_esik: 2,
        birim_fiyat: birim_fiyat
    };

    try {
        await Api.createStok(payload);
        closeNewStockModal();
        await renderStok();
        showToast(`'${ad}' başarıyla stok kayıtlarına eklendi.`, 'success');
    } catch (err) {
        showToast('Stok eklenirken hata oluştu: ' + err.message, 'error');
    }
}

// ============================================
// 11. UYGULAMA BAŞLANGICI (AUTO-INIT)
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Verileri API veya LocalStorage'dan yükle
    tickets = await Api.getTickets();
    if (!tickets || tickets.length === 0) {
        tickets = [...defaultTickets];
        await Api.saveTickets(tickets);
    }

    inventory = await Api.getInventory();
    if (!inventory || inventory.length === 0) {
        inventory = [...defaultInventory];
        await Api.saveInventory(inventory);
    }

    // 2. Kullanıcı oturumu kontrolü (Rapor ekran görüntüsü ve canlı kullanım için varsayılan Yönetici)
    const savedUser = localStorage.getItem('ittech_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        currentUser = { username: 'Yönetici (Admin)', role: 'admin' };
        localStorage.setItem('ittech_user', JSON.stringify(currentUser));
    }

    // 3. Portalı hemen aç ve göstergeleri hazırla
    showDashboard();
});
