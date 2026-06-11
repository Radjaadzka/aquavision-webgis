/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Auto-starts once per browser after map is ready.
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()
   Replay: window.startTour()

   Driver.js v0.9.8 z-index values (from driver.min.css):
     #driver-page-overlay              → 100002
     #driver-highlighted-element-stage → 100003
     .driver-highlighted-element       → 100004
     #driver-popover-item              → 1000000000
   All containers that need to be visible during the tour must be set
   to at least 100004 so they are not covered by the overlay (100002).
*/
(function () {
    var TOUR_KEY   = 'aquavision_dashboard_tour_completed';
    var TOUR_Z     = '100004';   // Above Driver.js overlay (100002) and stage (100003)
    var ACCORDION_BODIES = ['statsBody', 'debitBody', 'simBody', 'chartBody'];
    var activeDriver = null;

    console.log('[AQUAVISION Tour] loaded');

    /* ── Wait helper ──────────────────────────────────────────────── */

    function waitForElement(selector, callback, maxWaitMs) {
        var el = document.querySelector(selector);
        if (el) { callback(); return; }
        var elapsed = 0;
        var iv = setInterval(function () {
            elapsed += 100;
            el = document.querySelector(selector);
            if (el) {
                clearInterval(iv);
                callback();
            } else if (elapsed >= maxWaitMs) {
                clearInterval(iv);
                console.error('[AQUAVISION Tour] Timeout waiting for element:', selector);
            }
        }, 100);
    }

    /* ── Z-index elevation helpers ────────────────────────────────── */

    function lockSidebar() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
            sidebar.style.zIndex = TOUR_Z;
        }
        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = 'none';
        var showBtn = document.getElementById('btnShowSidebar');
        if (showBtn) showBtn.style.display = 'none';
    }

    function lockMapControls() {
        var mc = document.getElementById('mapCtrlTop');
        if (mc) mc.style.zIndex = TOUR_Z;
    }

    function lockNavbar() {
        var nav = document.querySelector('.navbar');
        if (nav) nav.style.zIndex = TOUR_Z;
    }

    function unlockAll() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.zIndex = '';

        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = '';

        var mc = document.getElementById('mapCtrlTop');
        if (mc) mc.style.zIndex = '';

        var nav = document.querySelector('.navbar');
        if (nav) nav.style.zIndex = '';

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
                    description: 'Klik tombol ini untuk membuka atau menutup panel daftar layer. Aktifkan layer yang ingin dianalisis — misalnya Potensi Air Tanah, Debit Puncak Aliran, atau Infrastruktur Air.',
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
                    description: 'Ringkasan jumlah objek yang tersedia: sumber air, hotel, rumah makan, jasa, tandon air, dan jalur sungai. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 4. KETERSEDIAAN AIR ──────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                onHighlightStarted: function () { openOnlyAccordion('debitBody'); },
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Kondisi ketersediaan air berdasarkan analisis sistem. Status <b>AMAN</b> = kebutuhan &lt; 50% ketersediaan; <b>WASPADA</b> = 50–80%; <b>KRITIS</b> = ≥ 80%.',
                    position:    'right'
                }
            },

            // ── 5. SIMULASI SKENARIO ─────────────────────────────────
            {
                element: '#simHeader',
                onHighlightStarted: function () { openOnlyAccordion('simBody'); },
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Simulasikan kebutuhan air berdasarkan skenario wisata. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b>.',
                    position:    'right'
                }
            },

            // ── 6. GRAFIK KETERSEDIAAN AIR ───────────────────────────
            {
                element: '#chartHeader',
                onHighlightStarted: function () { openOnlyAccordion('chartBody'); },
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Visualisasi hasil analisis ketersediaan air. Nilai di atas 100% menunjukkan kondisi defisit — kapasitas sumber tidak mencukupi kebutuhan.',
                    position:    'right'
                }
            },

            // ── 7. CARI LOKASI ───────────────────────────────────────
            {
                element: '#mapSearchInput',
                onHighlightStarted: function () { lockMapControls(); },
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketikkan nama lokasi di sini untuk menemukan tempat tertentu dengan cepat. Tekan <b>Enter</b> untuk mulai pencarian.',
                    position:    'bottom'
                }
            },

            // ── 8. EXPORT ────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                onHighlightStarted: function () { lockMapControls(); },
                popover: {
                    title:       '🖨️ Ekspor Peta',
                    description: 'Ekspor tampilan peta saat ini sebagai gambar PNG. Aktifkan layer yang ingin disertakan sebelum mengekspor.',
                    position:    'bottom'
                }
            },

            // ── 9. LEGENDA PETA ──────────────────────────────────────
            // #legendCard starts display:none — prepareUI() forces it visible.
            {
                element: '.accordion-header[data-target="legendBody"]',
                popover: {
                    title:       '🗺️ Legenda Peta',
                    description: 'Legenda muncul otomatis di sidebar kiri saat Anda mengaktifkan layer. Legenda menjelaskan arti warna, simbol, dan kategori yang tampil pada peta.',
                    position:    'right'
                }
            },

            // ── 10. BERANDA ──────────────────────────────────────────
            // Updated selector: landing page moved to /tentang/.
            // getBoundingClientRect filter skips this if .nav-links is display:none on mobile.
            {
                element: '.nav-links a[href="/tentang/"]',
                onHighlightStarted: function () { lockNavbar(); },
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum AQUAVISION, latar belakang sistem, dan gambaran fitur utama.',
                    position:    'bottom'
                }
            },

            // ── 11. DASHBOARD ────────────────────────────────────────
            // Updated selector: Dashboard is now the root URL /.
            {
                element: '.nav-links a[href="/"]',
                onHighlightStarted: function () { lockNavbar(); },
                popover: {
                    title:       '🗺️ Dashboard',
                    description: 'Menu Dashboard membawa Anda ke halaman ini — pusat analisis spasial dan visualisasi data sumber daya air AQUAVISION.',
                    position:    'bottom'
                }
            },

            // ── 12. DATA PORTAL ──────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                onHighlightStarted: function () { lockNavbar(); },
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Tabel lengkap seluruh dataset dengan pencarian dan paginasi. Unduh dalam format CSV, GeoJSON, KML, atau Shapefile.',
                    position:    'bottom'
                }
            },

            // ── 13. HUBUNGI ADMIN ────────────────────────────────────
            // Automatically skipped when user is not authenticated (element absent from DOM).
            {
                element: '.nav-links a[href="/hubungi/"]',
                onHighlightStarted: function () { lockNavbar(); },
                popover: {
                    title:       '✉️ Hubungi Admin',
                    description: 'Kirim pertanyaan atau laporan kendala ke tim pengelola AQUAVISION. Sistem AI akan menjawab otomatis atau admin membalas langsung.',
                    position:    'bottom'
                }
            },

            // ── 14. PUSAT BANTUAN ────────────────────────────────────
            {
                element: '.nav-links a[href="/bantuan/"]',
                onHighlightStarted: function () { lockNavbar(); },
                popover: {
                    title:       '❓ Pusat Bantuan',
                    description: 'Panduan penggunaan dan jawaban atas pertanyaan yang sering diajukan, tersedia dalam 6 kategori FAQ.',
                    position:    'bottom'
                }
            },

            // ── 15. SELESAI ──────────────────────────────────────────
            {
                element: '#btnGuide',
                popover: {
                    title:       '🎉 Panduan Selesai',
                    description: 'Anda siap menggunakan AQUAVISION! Aktifkan layer, klik objek di peta untuk detail. Untuk mengulang panduan kapan saja, klik tombol <b>ⓘ Lihat Panduan Dashboard</b> ini.',
                    position:    'right'
                }
            }
        ];
    }

    /* ── UI Prep ──────────────────────────────────────────────────── */

    function prepareUI() {
        lockSidebar();
        lockMapControls();
        lockNavbar();

        var layerPanel = document.getElementById('layerPanel');
        if (layerPanel) layerPanel.style.display = 'block';

        // Force legendCard visible so step 9 passes getBoundingClientRect filter.
        var legendCard = document.getElementById('legendCard');
        if (legendCard && legendCard.style.display === 'none') {
            legendCard.dataset.tourHidden = 'true';
            legendCard.style.display = '';
        }
        // Accordions opened per-step via onHighlightStarted.
    }

    /* ── Run ──────────────────────────────────────────────────────── */

    function runTour() {
        if (typeof Driver === 'undefined') {
            console.warn('[AQUAVISION Tour] Driver.js not loaded — aborted.');
            return;
        }

        // Kill any running tour instance before starting a new one.
        if (activeDriver) {
            try { activeDriver.reset(); } catch (e) {}
            activeDriver = null;
        }

        console.log('[AQUAVISION Tour] started');
        prepareUI();

        var allSteps = buildSteps();
        var steps = allSteps.filter(function (s) {
            if (!s.element) return true;

            var el = document.querySelector(s.element);
            if (!el) {
                console.error('[AQUAVISION Tour] Target not found:', s.element);
                return false;
            }

            // Skip elements hidden via display:none (e.g. .nav-links on mobile).
            var rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
                console.warn('[AQUAVISION Tour] Skipped — not visible:', s.element);
                return false;
            }

            console.log('[AQUAVISION Tour] Step OK:', s.element);
            return true;
        });

        if (steps.length === 0) {
            console.warn('[AQUAVISION Tour] No visible steps — aborted.');
            return;
        }

        try {
            var d = new Driver({
                animate:      true,
                opacity:      0.65,
                padding:      8,
                allowClose:   true,
                doneBtnText:  'Selesai',
                closeBtnText: 'Lewati',
                nextBtnText:  'Lanjut →',
                prevBtnText:  '← Kembali',
                onHighlightStarted: function (element) {
                    // Elevate containers above Driver.js overlay (z-index 100002) for every step.
                    lockSidebar();
                    lockMapControls();
                    lockNavbar();
                    if (element) {
                        console.log('[AQUAVISION Tour] Highlighting:', element.id || element.className || element.tagName);
                    }
                },
                onReset: function () {
                    localStorage.setItem(TOUR_KEY, 'true');
                    unlockAll();
                    console.log('[AQUAVISION Tour] tour ended / reset');
                }
            });

            activeDriver = d;
            d.defineSteps(steps);
            d.start();

        } catch (e) {
            console.warn('[AQUAVISION Tour] Failed to start:', e);
            unlockAll();
        }
    }

    /* ── Public API ───────────────────────────────────────────────── */

    window.startTour = function () {
        waitForElement('#sidebar', function () {
            setTimeout(runTour, 300);
        }, 5000);
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
        // Allow ?tour=1 in URL to force-restart tour regardless of localStorage.
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tour') === '1') {
            localStorage.removeItem(TOUR_KEY);
        }
        if (localStorage.getItem(TOUR_KEY) === 'true') {
            console.log('[AQUAVISION Tour] already completed — skipped.');
            return;
        }
        waitForElement('#sidebar', function () {
            console.log('[AQUAVISION Tour] auto-start triggered');
            setTimeout(runTour, 600);
        }, 5000);
    }

    window.addEventListener('aquavision:mapReady', autoStart, { once: true });

})();
