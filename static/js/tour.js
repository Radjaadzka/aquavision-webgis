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

   RULES:
   - #sidebar (Panel Fitur Peta) must remain visible for the entire
     tour — never hidden, collapsed, resized, or toggled.
   - Steps adapt to login state: guests don't see Hubungi Admin,
     Profil, or Logout; logged-in users don't see Login/Daftar.
   - Targets that are missing or not visible (0x0) are skipped
     silently — no floating tooltips, no empty steps.
   - Accordions referenced by a step are opened only while that step
     is active and restored to their pre-tour state afterwards.
   - When the tour ends, the page scrolls back to the top so the user
     is never left looking at the footer.
*/
(function () {
    var TOUR_KEY    = 'aquavision_dashboard_tour_completed';
    var TOUR_Z      = '100004';   // Above Driver.js overlay (100002) and stage (100003)
    var ACCORDION_BODIES = ['statsBody', 'debitBody', 'simBody', 'chartBody'];

    var activeDriver  = null;
    var currentSteps  = [];
    var currentAccordion = null;
    var originalAccordionState = {};
    var legendWasHidden = false;
    var legendOriginalHTML = null;

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

        restoreAccordions();
        restoreLegend();
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

    function captureAccordionState() {
        originalAccordionState = {};
        ACCORDION_BODIES.forEach(function (id) {
            var body = document.getElementById(id);
            originalAccordionState[id] = !!(body && body.classList.contains('open'));
        });
    }

    function restoreAccordions() {
        ACCORDION_BODIES.forEach(function (id) {
            if (originalAccordionState[id]) openAccordion(id); else closeAccordion(id);
        });
        currentAccordion = null;
    }

    // Opens the accordion belonging to the active step (if any) and
    // closes whichever accordion the previous step had opened — so
    // exactly one accordion (at most) is open at any time during the
    // tour, and everything is restored once the tour ends.
    function setAccordionForStep(step) {
        var target = (step && step.__accordionId) || null;
        if (target === currentAccordion) return;
        if (currentAccordion) closeAccordion(currentAccordion);
        if (target) openAccordion(target);
        currentAccordion = target;
    }

    /* ── Legenda Peta preview (hidden until a layer is active) ──────── */

    function prepareLegend() {
        var card = document.getElementById('legendCard');
        if (!card) return;
        legendWasHidden = (card.style.display === 'none' || getComputedStyle(card).display === 'none');
        if (!legendWasHidden) return;
        var items = document.getElementById('legendItems');
        if (items) {
            legendOriginalHTML = items.innerHTML;
            items.innerHTML = '<div class="legend-item"><span style="font-size:11px; color:rgba(255,255,255,.45); line-height:1.6;">Legenda akan menampilkan keterangan warna dan simbol untuk setiap layer yang Anda aktifkan di peta.</span></div>';
        }
        card.style.display = 'block';
    }

    function restoreLegend() {
        if (!legendWasHidden) return;
        var card  = document.getElementById('legendCard');
        var items = document.getElementById('legendItems');
        if (items && legendOriginalHTML !== null) items.innerHTML = legendOriginalHTML;
        if (window.updateLegend) {
            window.updateLegend();
        } else if (card) {
            card.style.display = 'none';
        }
        legendWasHidden = false;
        legendOriginalHTML = null;
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

    /* ── Steps — adapt to login state ────────────────────────────────
       Guest      (17 steps): ... Pusat Bantuan, Login, Daftar, Selesai
       User login (18 steps): ... Hubungi Admin, Pusat Bantuan, Profil,
                                   Logout, Selesai
       __accordionId marks steps that should open one of
       ACCORDION_BODIES while active (closed again once the user moves
       on to the next step). */

    function buildSteps() {
        var isLoggedIn = !!document.querySelector('.nav-btn-logout');

        var steps = [

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

            // ── 3. LEGENDA PETA ───────────────────────────────────────
            {
                element: '#legendCard',
                popover: {
                    title:       '🎨 Legenda Peta',
                    description: 'Legenda menampilkan arti warna dan simbol pada peta. Legenda akan otomatis menyesuaikan dengan layer yang sedang Anda aktifkan.',
                    position:    'right'
                }
            },

            // ── 4. PENGUKURAN JARAK ───────────────────────────────────
            {
                element: '#btnDistance',
                popover: {
                    title:       '📏 Pengukuran Jarak',
                    description: 'Ukur jarak antar dua titik di peta — klik dua titik langsung di peta, atau masukkan koordinat secara manual.',
                    position:    'right'
                }
            },

            // ── 5. RINGKASAN DATA ─────────────────────────────────────
            {
                element: '.accordion-header[data-target="statsBody"]',
                __accordionId: 'statsBody',
                popover: {
                    title:       '📊 Ringkasan Data',
                    description: 'Ringkasan jumlah objek yang tersedia: sumber air, segmen sungai, hotel, rumah makan, jasa, dan penduduk. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 6. KETERSEDIAAN AIR ───────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                __accordionId: 'debitBody',
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Kondisi ketersediaan air berdasarkan analisis sistem. Status <b>AMAN</b> = kebutuhan &lt; 50% ketersediaan; <b>WASPADA</b> = 50–80%; <b>KRITIS</b> = ≥ 80%.',
                    position:    'right'
                }
            },

            // ── 7. SIMULASI SKENARIO ──────────────────────────────────
            {
                element: '#simHeader',
                __accordionId: 'simBody',
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Simulasikan kebutuhan air berdasarkan skenario wisata. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b>.',
                    position:    'right'
                }
            },

            // ── 8. GRAFIK KETERSEDIAAN AIR ────────────────────────────
            {
                element: '#chartHeader',
                __accordionId: 'chartBody',
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Visualisasi hasil analisis ketersediaan air. Nilai di atas 100% menunjukkan kondisi defisit — kapasitas sumber tidak mencukupi kebutuhan.',
                    position:    'right'
                }
            },

            // ── 9. CARI LOKASI ─────────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketikkan nama lokasi di sini untuk menemukan tempat tertentu dengan cepat. Tekan <b>Enter</b> untuk mulai pencarian.',
                    position:    'bottom'
                }
            },

            // ── 10. EXPORT ─────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       '🖨️ Ekspor Peta',
                    description: 'Ekspor tampilan peta saat ini sebagai gambar PNG. Aktifkan layer yang ingin disertakan sebelum mengekspor.',
                    position:    'bottom'
                }
            },

            // ── 11. BERANDA ────────────────────────────────────────────
            {
                element: '.nav-links a[href="/tentang/"]',
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum AQUAVISION, latar belakang sistem, dan gambaran fitur utama.',
                    position:    'bottom'
                }
            },

            // ── 12. DASHBOARD ──────────────────────────────────────────
            {
                element: '.nav-links a[href="/"]',
                popover: {
                    title:       '🗺️ Dashboard',
                    description: 'Menu Dashboard membawa Anda ke halaman ini — pusat analisis spasial dan visualisasi data sumber daya air AQUAVISION.',
                    position:    'bottom'
                }
            },

            // ── 13. DATA PORTAL ────────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Tabel lengkap seluruh dataset dengan pencarian dan paginasi. Unduh dalam format CSV, GeoJSON, KML, atau Shapefile.',
                    position:    'bottom'
                }
            }
        ];

        if (isLoggedIn) {
            // ── 14. HUBUNGI ADMIN ─────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/hubungi/"]',
                popover: {
                    title:       '✉️ Hubungi Admin',
                    description: 'Punya pertanyaan? Kirim pesan ke tim AQUAVISION melalui menu ini. AI Assistant akan mencoba menjawab dulu — jika belum bisa, pertanyaan Anda diteruskan ke Admin.',
                    position:    'bottom'
                }
            });
            // ── 15. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Pusat Bantuan',
                    description: 'Kumpulan panduan dan FAQ seputar AQUAVISION — mulai dari cara membaca peta hingga mengunduh data.',
                    position:    'bottom'
                }
            });
            // ── 16. PROFIL ─────────────────────────────────────────────
            steps.push({
                element: '.nav-user',
                popover: {
                    title:       '👤 Profil',
                    description: 'Menampilkan akun yang sedang Anda gunakan untuk mengakses AQUAVISION.',
                    position:    'bottom'
                }
            });
            // ── 17. LOGOUT ─────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-logout',
                popover: {
                    title:       '🚪 Logout',
                    description: 'Keluar dari akun Anda dengan aman setelah selesai menggunakan AQUAVISION.',
                    position:    'bottom'
                }
            });
        } else {
            // ── 14. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Pusat Bantuan',
                    description: 'Kumpulan panduan dan FAQ seputar AQUAVISION — mulai dari cara membaca peta hingga mengunduh data.',
                    position:    'bottom'
                }
            });
            // ── 15. LOGIN ──────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-login',
                popover: {
                    title:       '🔑 Login',
                    description: 'Masuk dengan akun Anda untuk mengakses fitur tambahan seperti Hubungi Admin dan input data (khusus pengelola).',
                    position:    'bottom'
                }
            });
            // ── 16. DAFTAR ─────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-register',
                popover: {
                    title:       '📝 Daftar',
                    description: 'Belum punya akun? Daftar gratis untuk mendapatkan akses fitur tambahan AQUAVISION.',
                    position:    'bottom'
                }
            });
        }

        // ── SELESAI ────────────────────────────────────────────────────
        steps.push({
            element: '#btnGuide',
            popover: {
                title:       '🎉 Panduan Selesai',
                description: 'Anda siap menggunakan AQUAVISION! Aktifkan layer, klik objek di peta untuk detail. Untuk mengulang panduan kapan saja, klik tombol <b>✨ Jelajahi Dashboard</b> di pojok kanan bawah, atau tombol <b>ⓘ Lihat Panduan Dashboard</b> ini.',
                position:    'right'
            }
        });

        return steps;
    }

    /* ── UI Prep ──────────────────────────────────────────────────── */

    function prepareUI() {
        lockSidebar();
        lockMapControls();
        lockNavbar();

        captureAccordionState();
        currentAccordion = null;
        prepareLegend();
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
                console.warn('[AQUAVISION Tour] Skipped — target not found:', s.element);
                return false;
            }

            // Skip elements hidden via display:none (e.g. .nav-links on mobile,
            // or nav items that don't exist for the current login state).
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
            unlockAll();
            return;
        }

        currentSteps = steps;

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

                    // Find which step is being highlighted (by matching its DOM node)
                    // so the matching accordion can be opened/closed.
                    var node = element && (element.node || (element.getNode && element.getNode()));
                    var matched = null;
                    if (node) {
                        for (var i = 0; i < currentSteps.length; i++) {
                            var step = currentSteps[i];
                            if (step.element && document.querySelector(step.element) === node) {
                                matched = step;
                                break;
                            }
                        }
                    }
                    setAccordionForStep(matched);

                    if (node) {
                        console.log('[AQUAVISION Tour] Highlighting:', node.id || node.className || node.tagName);
                    }
                },
                onReset: function () {
                    localStorage.setItem(TOUR_KEY, 'true');
                    unlockAll();
                    // Never leave the user scrolled down (e.g. near the footer).
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
