/* Dashboard Onboarding Tour — Driver.js 1.3.1
   Auto-starts once per browser after map is ready (and after the
   Hero Dashboard overlay has been dismissed).
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()   — always works, ignores localStorage
   Replay: window.startTour()

   Driver.js v1 ships its own spotlight/stage/popover positioning,
   auto-flip near viewport edges and smooth-scroll-into-view, so this
   file only wires AQUAVISION-specific behaviour (locking the sidebar,
   opening the right accordion per step, restoring state on exit) on
   top of it instead of re-implementing positioning logic.

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
    var TOUR_Z      = '100004';   // Above Driver.js overlay/stage layers.
    var ACCORDION_BODIES = ['statsBody', 'debitBody', 'simBody'];

    var activeDriver  = null;
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

    /* ── Steps — adapt to login state ────────────────────────────────
       Guest      (9 steps):  Panel Peta → Cari → Export → Tentang →
                               Data Portal → Bantuan → Login → Daftar → Selesai
       User login (10 steps): Panel Peta → Cari → Export → Tentang →
                               Data Portal → Hubungi Admin → Bantuan →
                               Profil → Logout → Selesai
       Targets that are missing/invisible are skipped automatically. */

    function buildSteps() {
        var isLoggedIn = !!document.querySelector('.nav-btn-logout');

        var steps = [

            // ── 1. PANEL FITUR PETA ──────────────────────────────────
            {
                element: '#sidebar',
                __accordionId: null,
                popover: {
                    title:       'Panel Fitur Peta',
                    description: 'Panel ini digunakan untuk mengakses seluruh fitur utama AQUAVISION seperti menampilkan layer peta, membaca informasi spasial, mencari lokasi, dan melakukan analisis sederhana.',
                    side: 'right', align: 'start'
                }
            },

            // ── 2. CARI LOKASI ────────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       'Cari Lokasi',
                    description: 'Ketik nama tempat atau desa untuk langsung menemukan lokasinya di peta. Tekan <b>Enter</b> untuk mulai mencari.',
                    side: 'bottom', align: 'start'
                }
            },

            // ── 3. EXPORT ─────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       'Simpan Gambar Peta',
                    description: 'Simpan tampilan peta saat ini sebagai gambar. Aktifkan layer yang diinginkan terlebih dahulu, lalu klik tombol ini.',
                    side: 'bottom', align: 'start'
                }
            },

            // ── 4. TENTANG AQUAVISION ─────────────────────────────────
            {
                element: '.nav-links a[href="/tentang/"]',
                popover: {
                    title:       'Tentang AQUAVISION',
                    description: 'Lihat informasi mengenai sistem AQUAVISION — fitur-fitur yang tersedia, tujuan pembuatannya, dan pihak-pihak yang terlibat.',
                    side: 'bottom', align: 'start'
                }
            },

            // ── 5. DATA PORTAL ────────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       'Data Portal',
                    description: 'Unduh data sumber daya air dalam berbagai format — CSV, GeoJSON, KML, dan Shapefile untuk keperluan analisis lanjutan.',
                    side: 'bottom', align: 'start'
                }
            }
        ];

        if (isLoggedIn) {
            // ── 6. HUBUNGI ADMIN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/hubungi/"]',
                popover: {
                    title:       'Hubungi Admin',
                    description: 'Sampaikan masukan atau pertanyaan kepada pengelola sistem AQUAVISION.',
                    side: 'bottom', align: 'start'
                }
            });
            // ── 7. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       'Pusat Bantuan',
                    description: 'Akses panduan penggunaan sistem, cara membaca peta, dan cara mengunduh data.',
                    side: 'bottom', align: 'start'
                }
            });
            // ── 8. PROFIL ─────────────────────────────────────────────
            steps.push({
                element: '.nav-user',
                popover: {
                    title:       'Profil',
                    description: 'Lihat informasi akun yang sedang Anda gunakan untuk masuk ke sistem.',
                    side: 'bottom', align: 'end'
                }
            });
            // ── 9. LOGOUT ─────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-logout',
                popover: {
                    title:       'Logout',
                    description: 'Keluar dari sistem AQUAVISION dengan aman setelah selesai menggunakan platform.',
                    side: 'bottom', align: 'end'
                }
            });
        } else {
            // ── 6. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       'Pusat Bantuan',
                    description: 'Akses panduan penggunaan sistem, cara membaca peta, dan cara mengunduh data.',
                    side: 'bottom', align: 'start'
                }
            });
            // ── 7. LOGIN ──────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-login',
                popover: {
                    title:       'Login',
                    description: 'Masuk dengan akun Anda untuk mengakses fitur lengkap AQUAVISION, termasuk mengirim pertanyaan ke admin.',
                    side: 'bottom', align: 'end'
                }
            });
            // ── 8. DAFTAR ────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-register',
                popover: {
                    title:       'Daftar',
                    description: 'Belum punya akun? Daftar gratis untuk mengakses semua fitur AQUAVISION.',
                    side: 'bottom', align: 'end'
                }
            });
        }

        // ── SELESAI ───────────────────────────────────────────────────
        steps.push({
            element: '#btnGuide',
            popover: {
                title:       'Siap Menjelajah!',
                description: 'Panduan selesai. Sekarang Anda bisa mulai menjelajahi data sumber daya air Desa Wonotoro. Untuk mengulang panduan ini kapan saja, klik tombol <b>Lihat Panduan Dashboard</b> ini.',
                side: 'top', align: 'start'
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

    function getDriverFactory() {
        return window.driver && window.driver.js && window.driver.js.driver;
    }

    /* ── Run ──────────────────────────────────────────────────────── */

    function runTour() {
        var driverFactory = getDriverFactory();
        if (!driverFactory) {
            console.warn('[AQUAVISION Tour] Driver.js not loaded — aborted.');
            return;
        }

        // Kill any running tour instance before starting a new one.
        if (activeDriver) {
            try { activeDriver.destroy(); } catch (e) {}
            activeDriver = null;
        }

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

        try {
            var d = driverFactory({
                animate:        true,
                smoothScroll:   true,
                overlayOpacity: 0.65,
                stagePadding:   6,
                stageRadius:    6,
                allowClose:     true,
                showProgress:   true,
                progressText:   '{{current}} / {{total}}',
                popoverClass:   'aq-tour-popover',
                doneBtnText:    'Selesai',
                nextBtnText:    'Lanjut →',
                prevBtnText:    '← Kembali',
                steps:          steps,
                onHighlightStarted: function (element, step) {
                    // Elevate containers above Driver.js overlay for every step.
                    lockSidebar();
                    lockMapControls();
                    lockNavbar();
                    setAccordionForStep(step);
                    if (element) {
                        console.log('[AQUAVISION Tour] Highlighting:', element.id || element.className || element.tagName);
                    }
                },
                onDestroyed: function () {
                    localStorage.setItem(TOUR_KEY, 'true');
                    unlockAll();
                    // Never leave the user scrolled down (e.g. near the footer).
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    console.log('[AQUAVISION Tour] tour ended / destroyed');
                }
            });

            activeDriver = d;
            d.drive();

        } catch (e) {
            console.warn('[AQUAVISION Tour] Failed to start:', e);
            unlockAll();
        }
    }

    /* ── Lazy-load driver.js CSS (removed from <head> to avoid render-blocking) ── */

    var _driverCssLoaded = false;
    function ensureDriverCss(callback) {
        if (_driverCssLoaded) { callback(); return; }
        if (document.querySelector('link[href*="driver.css"]')) {
            _driverCssLoaded = true; callback(); return;
        }
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
        link.crossOrigin = 'anonymous';
        link.onload = function () { _driverCssLoaded = true; callback(); };
        link.onerror = function () { _driverCssLoaded = true; callback(); }; // still try tour
        document.head.appendChild(link);
    }

    /* ── Public API ───────────────────────────────────────────────── */

    window.startTour = function () {
        ensureDriverCss(function () {
            waitForElement('#sidebar', function () {
                setTimeout(runTour, 300);
            }, 5000);
        });
    };

    // Always restarts the tour, regardless of localStorage state.
    window.resetTour = function () {
        localStorage.removeItem(TOUR_KEY);
        if (activeDriver) {
            try { activeDriver.destroy(); } catch (e) {}
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
        ensureDriverCss(function () {
            waitForElement('#sidebar', function () {
                console.log('[AQUAVISION Tour] auto-start triggered');
                setTimeout(runTour, 600);
            }, 5000);
        });
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
