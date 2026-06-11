/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Auto-starts once per browser after map is ready (and after the
   Hero Dashboard overlay has been dismissed).
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()   — always works, ignores localStorage
   Replay: window.startTour()

   Driver.js v0.9.8 z-index values (from driver.min.css):
     #driver-page-overlay              → 100002
     #driver-highlighted-element-stage → 100003
     .driver-highlighted-element       → 100004
     #driver-popover-item              → 1000000000
   All containers that need to be visible during the tour must be set
   to at least 100004 so they are not covered by the overlay (100002).

   RULE: #sidebar (Panel Fitur Peta) must remain visible for the
   entire tour — never hidden, collapsed, or removed. Accordions that
   need to be shown are opened once before the tour starts and
   restored to their original state when the tour ends.
*/
(function () {
    var TOUR_KEY   = 'aquavision_dashboard_tour_completed';
    var TOUR_Z     = '100004';   // Above Driver.js overlay (100002) and stage (100003)
    var ACCORDION_BODIES = ['statsBody', 'debitBody', 'simBody', 'chartBody'];
    var activeDriver = null;
    var preOpenedAccordions = [];

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

        // Restore accordions that were closed before the tour opened them.
        preOpenedAccordions.forEach(function (id) { closeAccordion(id); });
        preOpenedAccordions = [];

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

    /* ── Driver.js stale-DOM cleanup ──────────────────────────────── */
    /* Defensive cleanup in case a previous tour was interrupted before
       Driver.js finished its own reset (cause of the empty white
       popover bug when restarting via "Lihat Panduan Dashboard"). */
    function cleanupDriverArtifacts() {
        ['#driver-popover-item', '#driver-page-overlay', '#driver-highlighted-element-stage'].forEach(function (sel) {
            var el = document.querySelector(sel);
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        document.querySelectorAll('.driver-highlighted-element, .driver-position-relative, .driver-fix-stacking')
            .forEach(function (el) {
                el.classList.remove('driver-highlighted-element', 'driver-position-relative', 'driver-fix-stacking');
            });
    }

    /* ── Steps (14 total, fixed order — do not add/remove/duplicate) ─ */

    function buildSteps() {
        // Step 12 dynamically targets "Hubungi Admin" when the user is
        // logged in (link present in navbar), otherwise "Pusat Bantuan".
        var hasHubungi = !!document.querySelector('.nav-links a[href="/hubungi/"]');
        var contactTarget = hasHubungi
            ? '.nav-links a[href="/hubungi/"]'
            : '.nav-links a[href="/bantuan/"]';
        var contactDesc = hasHubungi
            ? 'Gunakan menu <b>Hubungi Admin</b> untuk mengirim pertanyaan ke tim AQUAVISION, atau buka <b>Pusat Bantuan</b> untuk panduan dan FAQ.'
            : 'Buka <b>Pusat Bantuan</b> untuk panduan penggunaan dan FAQ. Setelah masuk (login), tersedia juga menu Hubungi Admin untuk mengirim pertanyaan langsung ke tim AQUAVISION.';

        return [

            // ── 1. PANEL FITUR PETA ──────────────────────────────────
            {
                element: '#sidebar',
                popover: {
                    title:       '🗂️ Panel Fitur Peta',
                    description: 'Panel kiri ini adalah pusat pengendalian Dashboard AQUAVISION. Seluruh fitur analisis, visualisasi data, dan informasi sumber daya air dapat diakses melalui bagian ini. Panel ini akan tetap terlihat selama panduan berlangsung.',
                    position:    'right'
                }
            },

            // ── 2. DAFTAR LAYER ──────────────────────────────────────
            {
                element: '#btnLayer',
                popover: {
                    title:       '🗂️ Daftar Layer',
                    description: 'Klik tombol ini untuk membuka atau menutup daftar layer peta. Aktifkan layer yang ingin dianalisis — misalnya Potensi Air Tanah, Debit Puncak Aliran, atau Infrastruktur Air.',
                    position:    'right'
                }
            },

            // ── 3. RINGKASAN DATA ────────────────────────────────────
            {
                element: '.accordion-header[data-target="statsBody"]',
                popover: {
                    title:       '📊 Ringkasan Data',
                    description: 'Ringkasan jumlah objek yang tersedia: sumber air, hotel, rumah makan, jasa, tandon air, dan jalur sungai. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 4. KETERSEDIAAN AIR ──────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Kondisi ketersediaan air berdasarkan analisis sistem. Status <b>AMAN</b> = kebutuhan &lt; 50% ketersediaan; <b>WASPADA</b> = 50–80%; <b>KRITIS</b> = ≥ 80%.',
                    position:    'right'
                }
            },

            // ── 5. SIMULASI SKENARIO ─────────────────────────────────
            {
                element: '#simHeader',
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Simulasikan kebutuhan air berdasarkan skenario wisata. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b>.',
                    position:    'right'
                }
            },

            // ── 6. GRAFIK KETERSEDIAAN AIR ───────────────────────────
            {
                element: '#chartHeader',
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Visualisasi hasil analisis ketersediaan air. Nilai di atas 100% menunjukkan kondisi defisit — kapasitas sumber tidak mencukupi kebutuhan.',
                    position:    'right'
                }
            },

            // ── 7. CARI LOKASI ───────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketikkan nama lokasi di sini untuk menemukan tempat tertentu dengan cepat. Tekan <b>Enter</b> untuk mulai pencarian.',
                    position:    'bottom'
                }
            },

            // ── 8. EXPORT ────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       '🖨️ Ekspor Peta',
                    description: 'Ekspor tampilan peta saat ini sebagai gambar PNG. Aktifkan layer yang ingin disertakan sebelum mengekspor.',
                    position:    'bottom'
                }
            },

            // ── 9. BERANDA ───────────────────────────────────────────
            // getBoundingClientRect filter skips this if .nav-links is display:none on mobile.
            {
                element: '.nav-links a[href="/tentang/"]',
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum AQUAVISION, latar belakang sistem, dan gambaran fitur utama.',
                    position:    'bottom'
                }
            },

            // ── 10. DASHBOARD ────────────────────────────────────────
            {
                element: '.nav-links a[href="/"]',
                popover: {
                    title:       '🗺️ Dashboard',
                    description: 'Menu Dashboard membawa Anda ke halaman ini — pusat analisis spasial dan visualisasi data sumber daya air AQUAVISION.',
                    position:    'bottom'
                }
            },

            // ── 11. DATA PORTAL ──────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Tabel lengkap seluruh dataset dengan pencarian dan paginasi. Unduh dalam format CSV, GeoJSON, KML, atau Shapefile.',
                    position:    'bottom'
                }
            },

            // ── 12. HUBUNGI ADMIN / PUSAT BANTUAN ────────────────────
            {
                element: contactTarget,
                popover: {
                    title:       '✉️ Hubungi Admin & Pusat Bantuan',
                    description: contactDesc,
                    position:    'bottom'
                }
            },

            // ── 13. LOGIN / DAFTAR ───────────────────────────────────
            // Automatically skipped when user is already logged in (element absent from DOM).
            {
                element: '.nav-btn-login',
                popover: {
                    title:       '🔑 Login / Daftar',
                    description: 'Masuk atau daftar untuk mengakses fitur tambahan seperti Hubungi Admin dan input data (khusus pengelola).',
                    position:    'bottom'
                }
            },

            // ── 14. SELESAI ──────────────────────────────────────────
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

        // Pre-open every accordion referenced by the tour so its content
        // is visible without hiding or collapsing the main panel.
        // Accordions that were already open are left untouched; the rest
        // are restored to "closed" by unlockAll() once the tour ends.
        preOpenedAccordions = [];
        ACCORDION_BODIES.forEach(function (id) {
            var body = document.getElementById(id);
            if (body && !body.classList.contains('open')) {
                preOpenedAccordions.push(id);
                openAccordion(id);
            }
        });
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
        cleanupDriverArtifacts();

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
        cleanupDriverArtifacts();
        waitForElement('#sidebar', function () {
            setTimeout(runTour, 300);
        }, 5000);
    };

    // Always restarts the tour, regardless of localStorage state.
    window.resetTour = function () {
        localStorage.removeItem(TOUR_KEY);
        if (activeDriver) {
            try { activeDriver.reset(); } catch (e) {}
            activeDriver = null;
        }
        unlockAll();
        window.startTour();
    };

    /* ── Auto-start ───────────────────────────────────────────────── */

    // Starts the tour automatically for first-time visitors, unless the
    // Hero Dashboard overlay is still showing (it calls this again once
    // dismissed via window.aquavisionMaybeAutoStartTour).
    function maybeAutoStart() {
        if (localStorage.getItem(TOUR_KEY) === 'true') {
            console.log('[AQUAVISION Tour] already completed — skipped.');
            return;
        }
        var hero = document.getElementById('heroDashboard');
        if (hero && hero.offsetParent !== null && !hero.classList.contains('hero-hidden')) {
            console.log('[AQUAVISION Tour] waiting for Hero Dashboard to be dismissed.');
            return;
        }
        waitForElement('#sidebar', function () {
            console.log('[AQUAVISION Tour] auto-start triggered');
            setTimeout(runTour, 600);
        }, 5000);
    }

    function autoStart() {
        // Allow ?tour=1 in URL to force-restart tour regardless of localStorage.
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tour') === '1') {
            localStorage.removeItem(TOUR_KEY);
        }
        maybeAutoStart();
    }

    window.aquavisionMaybeAutoStartTour = maybeAutoStart;
    window.addEventListener('aquavision:mapReady', autoStart, { once: true });

})();
