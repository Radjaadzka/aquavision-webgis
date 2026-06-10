/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Berjalan otomatis sekali per browser saat peta siap.
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()
   Ulang:  window.startTour()
*/
(function () {
    var TOUR_KEY = 'aquavision_dashboard_tour_completed';
    var ACCORDION_BODIES = ['statsBody', 'debitBody', 'simBody', 'chartBody'];
    var activeDriver = null;

    console.log('[AQUAVISION Tour] loaded');

    /* ── Sidebar helpers ──────────────────────────────────────────── */

    function lockSidebar() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
            // Elevate above Driver.js overlay (z-index 100000) so sidebar content
            // stays visible during tour; popover (z-index 100002) remains on top.
            sidebar.style.zIndex = '100001';
        }
        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = 'none';
        var showBtn = document.getElementById('btnShowSidebar');
        if (showBtn) showBtn.style.display = 'none';
    }

    function unlockSidebar() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.zIndex = '';
        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = '';
        var legendCard = document.getElementById('legendCard');
        if (legendCard && legendCard.dataset.tourHidden === 'true') {
            legendCard.style.display = 'none';
            delete legendCard.dataset.tourHidden;
        }
        activeDriver = null;
    }

    /* ── Accordion helpers ────────────────────────────────────────── */

    function openAccordion(bodyId) {
        var body = document.getElementById(bodyId);
        if (!body) return;
        body.classList.add('open');
        var arrow = document.querySelector('[data-target="' + bodyId + '"] .accordion-arrow');
        if (arrow) arrow.classList.add('open');
    }

    function closeAccordion(bodyId) {
        var body = document.getElementById(bodyId);
        if (!body) return;
        body.classList.remove('open');
        var arrow = document.querySelector('[data-target="' + bodyId + '"] .accordion-arrow');
        if (arrow) arrow.classList.remove('open');
    }

    function openOnlyAccordion(bodyId) {
        ACCORDION_BODIES.forEach(function (id) { closeAccordion(id); });
        openAccordion(bodyId);
    }

    /* ── Steps ────────────────────────────────────────────────────── */

    function buildSteps() {
        return [

            // ── 1. FITUR PETA ────────────────────────────────────────
            // #sidebar (position:absolute) — Driver.js does NOT change its position.
            // lockSidebar() elevates it to z-index 100001 (above the overlay),
            // so the sidebar shows naturally with its dark background — no white box.
            {
                element: '#sidebar',
                popover: {
                    title:       '🗂️ Panel Fitur Peta',
                    description: 'Panel kiri ini adalah pusat pengendalian Dashboard AQUAVISION. Seluruh fitur analisis, visualisasi data, dan informasi sumber daya air dapat diakses melalui bagian ini.',
                    position:    'right'
                }
            },

            // ── 2. DAFTAR LAYER ──────────────────────────────────────
            {
                element: '#btnLayer',
                popover: {
                    title:       '🗂️ Daftar Layer',
                    description: 'Klik tombol ini untuk membuka atau menutup panel daftar layer. Aktifkan layer yang ingin dianalisis dengan mencentang pilihan yang tersedia — misalnya Potensi Air Tanah, Debit Puncak Aliran, atau Infrastruktur Air.',
                    position:    'right'
                }
            },

            // ── 3. RINGKASAN DATA ────────────────────────────────────
            {
                element: '.accordion-header[data-target="statsBody"]',
                onHighlightStarted: function () {
                    var lp = document.getElementById('layerPanel');
                    if (lp) lp.style.display = 'none';
                    openOnlyAccordion('statsBody');
                },
                popover: {
                    title:       '📊 Ringkasan Data',
                    description: 'Panel ini menampilkan ringkasan jumlah objek yang tersedia dalam sistem — sumber air, hotel, rumah makan, jasa, tandon air, dan jaringan sungai. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 4. KETERSEDIAAN AIR ──────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                onHighlightStarted: function () { openOnlyAccordion('debitBody'); },
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Panel ini menampilkan kondisi ketersediaan air berdasarkan hasil analisis sistem. Status dapat berupa: <b>AMAN</b> (kebutuhan &lt; 50% dari ketersediaan), <b>WASPADA</b> (50–80%), atau <b>KRITIS</b> (≥ 80%).',
                    position:    'right'
                }
            },

            // ── 5. SIMULASI SKENARIO ─────────────────────────────────
            {
                element: '#simHeader',
                onHighlightStarted: function () { openOnlyAccordion('simBody'); },
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Gunakan fitur ini untuk mensimulasikan berbagai kondisi penggunaan air. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b> untuk melihat proyeksi kebutuhan air.',
                    position:    'right'
                }
            },

            // ── 6. GRAFIK KETERSEDIAAN AIR ───────────────────────────
            {
                element: '#chartHeader',
                onHighlightStarted: function () { openOnlyAccordion('chartBody'); },
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Grafik ini menyajikan hasil analisis ketersediaan air dalam bentuk visual sehingga kondisi dan tren air lebih mudah dipahami. Angka di atas 100% menunjukkan kondisi defisit — kapasitas sumber tidak mencukupi kebutuhan.',
                    position:    'right'
                }
            },

            // ── 7. CARI LOKASI ───────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketikkan nama lokasi di kotak ini untuk menemukan tempat tertentu secara cepat tanpa perlu menggeser peta secara manual. Tekan <b>Enter</b> untuk mulai pencarian.',
                    position:    'bottom'
                }
            },

            // ── 8. EXPORT ────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       '🖨️ Ekspor Peta',
                    description: 'Klik tombol ini untuk mengekspor tampilan peta saat ini sebagai gambar PNG. Pastikan seluruh layer yang ingin disertakan sudah diaktifkan sebelum mengekspor.',
                    position:    'bottom'
                }
            },

            // ── 9. LEGENDA PETA ──────────────────────────────────────
            // #legendCard has display:none by default (shows only when layers active).
            // prepareUI() forces it visible so getBoundingClientRect() returns non-zero.
            {
                element: '.accordion-header[data-target="legendBody"]',
                popover: {
                    title:       '🗺️ Legenda Peta',
                    description: 'Legenda ini muncul otomatis di sidebar kiri saat Anda mengaktifkan layer pada peta. Legenda membantu memahami arti warna, simbol, dan kategori yang tampil pada peta.',
                    position:    'right'
                }
            },

            // ── 10. BERANDA ──────────────────────────────────────────
            // Selector updated: landing page moved to /tentang/ (homepage is now Dashboard).
            // Visibility filter skips this when .nav-links is display:none on mobile.
            {
                element: '.nav-links a[href="/tentang/"]',
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum mengenai AQUAVISION, latar belakang sistem, dan gambaran fitur utama. Dapat diakses kapan saja tanpa login.',
                    position:    'bottom'
                }
            },

            // ── 11. DASHBOARD ────────────────────────────────────────
            // Selector updated: Dashboard is now the root URL /.
            {
                element: '.nav-links a[href="/"]',
                popover: {
                    title:       '🗺️ Dashboard',
                    description: 'Menu Dashboard membawa Anda ke halaman ini — pusat analisis spasial dan visualisasi data sumber daya air dalam sistem AQUAVISION.',
                    position:    'bottom'
                }
            },

            // ── 12. DATA PORTAL ──────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Data Portal menyediakan tabel lengkap seluruh dataset dengan fitur pencarian dan paginasi. Dataset dapat diunduh dalam format CSV, GeoJSON, KML, atau Shapefile sesuai hak akses.',
                    position:    'bottom'
                }
            },

            // ── 13. HUBUNGI ADMIN ────────────────────────────────────
            // Skipped automatically when user is not authenticated (element absent).
            {
                element: '.nav-links a[href="/hubungi/"]',
                popover: {
                    title:       '✉️ Hubungi Admin',
                    description: 'Gunakan fitur ini untuk mengirim pertanyaan, laporan kendala, atau konsultasi kepada tim pengelola AQUAVISION. Sistem AI akan mencoba menjawab otomatis, atau admin akan membalas secara langsung.',
                    position:    'bottom'
                }
            },

            // ── 14. PUSAT BANTUAN ────────────────────────────────────
            {
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Pusat Bantuan',
                    description: 'Menu ini menyediakan panduan penggunaan sistem dan jawaban atas pertanyaan yang sering diajukan. Tersedia 6 kategori FAQ untuk membantu Anda menggunakan AQUAVISION secara optimal.',
                    position:    'bottom'
                }
            },

            // ── 15. SELESAI ──────────────────────────────────────────
            {
                element: '#btnGuide',
                popover: {
                    title:       '🎉 Panduan Selesai',
                    description: 'Anda siap menggunakan AQUAVISION. Untuk hasil terbaik: aktifkan layer yang ingin dianalisis, kemudian klik objek pada peta untuk melihat informasi detail. Untuk mengulang panduan ini kapan saja, klik tombol <b>ⓘ Lihat Panduan Dashboard</b> ini.',
                    position:    'right'
                }
            }
        ];
    }

    /* ── UI Prep ──────────────────────────────────────────────────── */

    function prepareUI() {
        lockSidebar();

        var layerPanel = document.getElementById('layerPanel');
        if (layerPanel) layerPanel.style.display = 'block';

        // Force legendCard visible so step 9 passes the getBoundingClientRect filter.
        // unlockSidebar() restores display:none if no layers were active.
        var legendCard = document.getElementById('legendCard');
        if (legendCard && legendCard.style.display === 'none') {
            legendCard.dataset.tourHidden = 'true';
            legendCard.style.display = '';
        }

        // Accordions opened per-step via onHighlightStarted (not all at once).
    }

    /* ── Run ──────────────────────────────────────────────────────── */

    function runTour() {
        try {
            if (typeof Driver === 'undefined') {
                console.warn('[AQUAVISION Tour] Driver.js not loaded — tour aborted.');
                return;
            }

            if (activeDriver) {
                try { activeDriver.reset(); } catch (e) {}
                activeDriver = null;
            }

            console.log('[AQUAVISION Tour] started');
            prepareUI();

            var steps = buildSteps().filter(function (s) {
                if (!s.element) return true;

                var el = document.querySelector(s.element);
                if (!el) {
                    console.warn('[AQUAVISION Tour] Skipped — element not found:', s.element);
                    return false;
                }

                var rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) {
                    console.warn('[AQUAVISION Tour] Skipped — element not visible:', s.element);
                    return false;
                }

                return true;
            });

            if (steps.length === 0) {
                console.warn('[AQUAVISION Tour] No visible steps — tour aborted.');
                return;
            }

            var d = new Driver({
                animate:      true,
                opacity:      0.75,
                padding:      8,
                allowClose:   true,
                doneBtnText:  'Selesai',
                closeBtnText: 'Lewati',
                nextBtnText:  'Lanjut →',
                prevBtnText:  '← Kembali',
                onHighlightStarted: function () {
                    lockSidebar();
                },
                onReset: function () {
                    localStorage.setItem(TOUR_KEY, 'true');
                    unlockSidebar();
                }
            });

            activeDriver = d;
            d.defineSteps(steps);
            d.start();

        } catch (e) {
            console.warn('[AQUAVISION Tour] Failed to start:', e);
            unlockSidebar();
        }
    }

    /* ── Public API ───────────────────────────────────────────────── */

    window.startTour = function () {
        setTimeout(runTour, 300);
    };

    window.resetTour = function () {
        localStorage.removeItem(TOUR_KEY);
        if (activeDriver) {
            try { activeDriver.reset(); } catch (e) {}
            activeDriver = null;
        }
        window.startTour();
    };

    /* ── Auto-start ───────────────────────────────────────────────── */

    function autoStart() {
        if (localStorage.getItem(TOUR_KEY) === 'true') {
            console.log('[AQUAVISION Tour] already completed — auto-start skipped (call resetTour() to replay).');
            return;
        }
        console.log('[AQUAVISION Tour] auto-start triggered');
        setTimeout(runTour, 600);
    }

    window.addEventListener('aquavision:mapReady', autoStart, { once: true });

})();
