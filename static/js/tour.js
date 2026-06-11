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
       Guest      (11 steps): Panel Peta → Layer → Legenda → Cari →
                               Export → Tentang → Data Portal →
                               Bantuan → Login → Daftar → Selesai
       User login (12 steps): + Hubungi Admin, Profil, Logout (no Login/Daftar)
       Targets that are missing/invisible are skipped automatically. */

    function buildSteps() {
        var isLoggedIn = !!document.querySelector('.nav-btn-logout');

        var steps = [

            // ── 1. PANEL FITUR PETA ──────────────────────────────────
            {
                element: '#sidebar',
                popover: {
                    title:       '🗂️ Panel Fitur Peta',
                    description: 'Panel ini adalah tempat utama untuk menggunakan semua fitur AQUAVISION — mengaktifkan layer peta, melihat legenda, mencari lokasi, dan mengakses analisis data sumber daya air.',
                    position:    'right'
                }
            },

            // ── 2. DAFTAR LAYER ──────────────────────────────────────
            {
                element: '#btnLayer',
                popover: {
                    title:       '🗺️ Tampilkan Data di Peta',
                    description: 'Klik tombol ini untuk memilih data apa yang ingin ditampilkan di peta — misalnya lokasi sumber air, jaringan pipa, potensi air tanah, atau debit aliran sungai.',
                    position:    'right'
                }
            },

            // ── 3. LEGENDA PETA ───────────────────────────────────────
            {
                element: '#legendCard',
                popover: {
                    title:       '🎨 Keterangan Warna Peta',
                    description: 'Bagian ini menjelaskan arti setiap warna dan simbol yang muncul di peta. Keterangan akan berubah sesuai data yang sedang ditampilkan.',
                    position:    'right'
                }
            },

            // ── 4. CARI LOKASI ─────────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketik nama tempat atau desa untuk langsung menemukan lokasinya di peta. Tekan <b>Enter</b> untuk mulai mencari.',
                    position:    'bottom'
                }
            },

            // ── 5. EXPORT ─────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       '🖨️ Simpan Gambar Peta',
                    description: 'Simpan tampilan peta saat ini sebagai gambar. Aktifkan layer yang diinginkan terlebih dahulu, lalu klik tombol ini.',
                    position:    'bottom'
                }
            },

            // ── 6. TENTANG AQUAVISION ─────────────────────────────────
            {
                element: '.nav-links a[href="/tentang/"]',
                popover: {
                    title:       'ℹ️ Tentang AQUAVISION',
                    description: 'Pelajari lebih lanjut tentang AQUAVISION — apa itu, untuk siapa, dan bagaimana platform ini membantu pengelolaan sumber daya air Desa Wonotoro.',
                    position:    'bottom'
                }
            },

            // ── 7. DATA PORTAL ────────────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       '📊 Unduh Data',
                    description: 'Lihat dan unduh semua data yang tersedia dalam sistem — dalam format spreadsheet, peta digital, atau file GIS untuk keperluan analisis lanjutan.',
                    position:    'bottom'
                }
            }
        ];

        if (isLoggedIn) {
            // ── 8. HUBUNGI ADMIN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/hubungi/"]',
                popover: {
                    title:       '✉️ Tanya atau Hubungi Tim',
                    description: 'Ada pertanyaan tentang data atau sistem? Kirim pesan langsung ke tim AQUAVISION. Pertanyaan umum dijawab otomatis, pertanyaan khusus akan diteruskan ke admin.',
                    position:    'bottom'
                }
            });
            // ── 9. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Panduan Penggunaan',
                    description: 'Kumpulan panduan singkat dan jawaban atas pertanyaan yang sering ditanyakan — cara membaca peta, cara mengunduh data, dan lainnya.',
                    position:    'bottom'
                }
            });
            // ── 10. PROFIL ────────────────────────────────────────────
            steps.push({
                element: '.nav-user',
                popover: {
                    title:       '👤 Akun Anda',
                    description: 'Ini adalah akun yang sedang Anda gunakan untuk masuk ke AQUAVISION.',
                    position:    'bottom'
                }
            });
            // ── 11. LOGOUT ────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-logout',
                popover: {
                    title:       '🚪 Keluar',
                    description: 'Klik di sini untuk keluar dari akun Anda dengan aman setelah selesai menggunakan AQUAVISION.',
                    position:    'bottom'
                }
            });
        } else {
            // ── 8. PUSAT BANTUAN ──────────────────────────────────────
            steps.push({
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Panduan Penggunaan',
                    description: 'Kumpulan panduan singkat dan jawaban atas pertanyaan yang sering ditanyakan — cara membaca peta, cara mengunduh data, dan lainnya.',
                    position:    'bottom'
                }
            });
            // ── 9. LOGIN ──────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-login',
                popover: {
                    title:       '🔑 Masuk ke Sistem',
                    description: 'Masuk dengan akun Anda untuk mengakses fitur lengkap AQUAVISION, termasuk kirim pertanyaan ke admin.',
                    position:    'bottom'
                }
            });
            // ── 10. DAFTAR ────────────────────────────────────────────
            steps.push({
                element: '.nav-btn-register',
                popover: {
                    title:       '📝 Buat Akun Baru',
                    description: 'Belum punya akun? Daftar gratis untuk mengakses semua fitur AQUAVISION.',
                    position:    'bottom'
                }
            });
        }

        // ── SELESAI ───────────────────────────────────────────────────
        steps.push({
            element: '#btnGuide',
            popover: {
                title:       '🎉 Siap Menjelajah!',
                description: 'Panduan selesai. Sekarang Anda bisa mulai menjelajahi data sumber daya air Desa Wonotoro. Untuk mengulang panduan ini kapan saja, klik tombol <b>ⓘ Lihat Panduan Dashboard</b> ini.',
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
