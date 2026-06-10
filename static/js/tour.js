/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Berjalan otomatis sekali per browser saat peta siap.
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()
   Ulang:  window.startTour()
*/
(function () {
    var TOUR_KEY = 'aquavision_dashboard_tour_completed';
    console.log('[AQUAVISION Tour] loaded');

    /* ── Sidebar helpers ──────────────────────────────────────────── */

    function lockSidebar() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('collapsed');

        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = 'none';

        var showBtn = document.getElementById('btnShowSidebar');
        if (showBtn) showBtn.style.display = 'none';
    }

    function unlockSidebar() {
        var hideBtn = document.getElementById('btnHideSidebar');
        if (hideBtn) hideBtn.style.pointerEvents = '';
    }

    /* ── Accordion helper ─────────────────────────────────────────── */

    function openAccordion(bodyId) {
        var body = document.getElementById(bodyId);
        if (!body) return;
        if (!body.classList.contains('open')) {
            body.classList.add('open');
            var arrow = document.querySelector('[data-target="' + bodyId + '"] .accordion-arrow');
            if (arrow) arrow.classList.add('open');
        }
    }

    /* ── Steps ────────────────────────────────────────────────────── */

    function buildSteps() {
        return [

            // ── 1. FITUR PETA ────────────────────────────────────────
            // FIX: .sidebar-head (position:static) instead of #sidebar
            // (position:absolute) to prevent Driver.js from breaking layout.
            {
                element: '.sidebar-head',
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
                onHighlightStarted: function () { openAccordion('statsBody'); },
                popover: {
                    title:       '📊 Ringkasan Data',
                    description: 'Panel ini menampilkan ringkasan jumlah objek yang tersedia dalam sistem — sumber air, hotel, rumah makan, jasa, tandon air, dan jaringan sungai. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 4. KETERSEDIAAN AIR ──────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                onHighlightStarted: function () { openAccordion('debitBody'); },
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Panel ini menampilkan kondisi ketersediaan air berdasarkan hasil analisis sistem. Status dapat berupa: <b>AMAN</b> (kebutuhan &lt; 50% dari ketersediaan), <b>WASPADA</b> (50–80%), atau <b>KRITIS</b> (≥ 80%).',
                    position:    'right'
                }
            },

            // ── 5. SIMULASI SKENARIO ─────────────────────────────────
            {
                element: '#simHeader',
                onHighlightStarted: function () { openAccordion('simBody'); },
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Gunakan fitur ini untuk mensimulasikan berbagai kondisi penggunaan air. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b> untuk melihat proyeksi kebutuhan air.',
                    position:    'right'
                }
            },

            // ── 6. GRAFIK KETERSEDIAAN AIR ───────────────────────────
            {
                element: '#chartHeader',
                onHighlightStarted: function () { openAccordion('chartBody'); },
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

            // ── 9. LEGENDA ───────────────────────────────────────────
            {
                element: '#legendToggle',
                popover: {
                    title:       '🗺️ Legenda Peta',
                    description: 'Legenda ini berada di pojok kanan atas peta. Klik untuk membuka atau menutup legenda. Legenda membantu memahami arti warna, simbol, dan kategori yang tampil pada peta saat layer aktif.',
                    position:    'left'
                }
            },

            // ── 10. BERANDA ──────────────────────────────────────────
            // FIX: visibility filter (below) skips these when .nav-links is
            // display:none on mobile, preventing the 0×0 spotlight bug.
            {
                element: '.nav-links a[href="/"]',
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum mengenai AQUAVISION, latar belakang sistem, dan gambaran fitur utama. Dapat diakses kapan saja tanpa login.',
                    position:    'bottom'
                }
            },

            // ── 11. DASHBOARD ────────────────────────────────────────
            {
                element: '.nav-links a[href="/map/"]',
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
            // Also skipped when user is not authenticated (element absent from DOM).
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
            // FIX: element:'#btnGuide' instead of null.
            // Driver.js 0.9.8 typeof-checks element: null becomes typeof 'object',
            // falls through to call .getBoundingClientRect() on null → TypeError.
            // try-catch silently swallows this, aborting the ENTIRE tour.
            // '#btnGuide' is always in the DOM and points to the restart button.
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

        openAccordion('statsBody');
        openAccordion('debitBody');
        openAccordion('simBody');
        openAccordion('chartBody');
    }

    /* ── Run ──────────────────────────────────────────────────────── */

    function runTour() {
        try {
            if (typeof Driver === 'undefined') {
                console.warn('[AQUAVISION Tour] Driver.js not loaded — tour aborted.');
                return;
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

                // Skip elements that are hidden (display:none → 0×0 bounding rect).
                // This is the fix for the "overlay without popup" bug on mobile where
                // .nav-links is display:none but querySelector still returns the element.
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
