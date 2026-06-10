/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Berjalan otomatis sekali per browser saat peta siap.
   localStorage key: aquavision_dashboard_tour_completed = 'true'
   Reset:  window.resetTour()
   Ulang:  window.startTour()
*/
(function () {
    var TOUR_KEY = 'aquavision_dashboard_tour_completed';

    function buildSteps() {
        return [
            // ── 1. Panel Fitur Peta ──────────────────────────────────────
            {
                element: '#sidebar',
                popover: {
                    title:       '🗂️ Panel Fitur Peta',
                    description: 'Panel ini merupakan pusat pengendalian Dashboard AQUAVISION. Seluruh fitur analisis, visualisasi data, dan informasi sumber daya air dapat diakses melalui bagian ini.',
                    position:    'right'
                }
            },

            // ── 2. Daftar Layer ──────────────────────────────────────────
            {
                element: '#btnLayer',
                popover: {
                    title:       '🗂️ Daftar Layer',
                    description: 'Klik tombol ini untuk membuka atau menutup panel daftar layer. Aktifkan layer yang ingin dianalisis dengan mencentang pilihan yang tersedia — misalnya Potensi Air Tanah, Debit Puncak Aliran, atau Infrastruktur Air.',
                    position:    'right'
                }
            },

            // ── 3. Input Data (hanya jika elemen ada — admin/user login) ─
            {
                element: '#btnInputToggle',
                popover: {
                    title:       '✏️ Input Data',
                    description: 'Tombol ini digunakan untuk menambahkan atau memperbarui data pada sistem. Tersedia dua cara: <b>Input Manual</b> untuk data individual, atau <b>Upload Shapefile</b> untuk dataset spasial. Fitur ini hanya aktif untuk pengguna dengan hak akses Admin.',
                    position:    'right'
                }
            },

            // ── 4. Ringkasan Data ────────────────────────────────────────
            {
                element: '.accordion-header[data-target="statsBody"]',
                popover: {
                    title:       '📊 Ringkasan Data',
                    description: 'Panel ini menampilkan ringkasan jumlah objek yang tersedia dalam sistem, seperti sumber air, hotel, rumah makan, jasa, tandon air, dan jaringan sungai. Data diperbarui otomatis dari sistem.',
                    position:    'right'
                }
            },

            // ── 5. Ketersediaan Air ──────────────────────────────────────
            {
                element: '.accordion-header[data-target="debitBody"]',
                popover: {
                    title:       '💧 Ketersediaan Air',
                    description: 'Panel ini menampilkan kondisi ketersediaan air berdasarkan hasil analisis sistem. Status dapat berupa: <b>AMAN</b> (kebutuhan &lt; 50% dari ketersediaan), <b>WASPADA</b> (50–80%), atau <b>KRITIS</b> (≥ 80%).',
                    position:    'right'
                }
            },

            // ── 6. Simulasi Skenario ─────────────────────────────────────
            {
                element: '#simHeader',
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Gunakan fitur ini untuk mensimulasikan berbagai kondisi penggunaan air. Masukkan jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian, lalu klik <b>Hitung Simulasi</b> untuk melihat proyeksi kebutuhan air.',
                    position:    'right'
                }
            },

            // ── 7. Grafik Ketersediaan Air ───────────────────────────────
            {
                element: '#chartHeader',
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Grafik ini menyajikan hasil analisis ketersediaan air dalam bentuk visual sehingga kondisi dan tren air lebih mudah dipahami. Angka di atas 100% menunjukkan kondisi defisit — kapasitas sumber tidak mencukupi kebutuhan.',
                    position:    'right'
                }
            },

            // ── 8. Cari Lokasi ───────────────────────────────────────────
            {
                element: '#mapSearchInput',
                popover: {
                    title:       '🔍 Cari Lokasi',
                    description: 'Ketikkan nama lokasi di kotak ini untuk menemukan tempat tertentu secara cepat tanpa perlu menggeser peta secara manual. Tekan <b>Enter</b> untuk mulai pencarian.',
                    position:    'bottom'
                }
            },

            // ── 9. Export ────────────────────────────────────────────────
            {
                element: '#btnPrintMap',
                popover: {
                    title:       '🖨️ Ekspor Peta',
                    description: 'Klik tombol ini untuk mengekspor tampilan peta saat ini sebagai gambar PNG. Pastikan seluruh layer yang ingin disertakan sudah diaktifkan sebelum mengekspor.',
                    position:    'bottom'
                }
            },

            // ── 10. Legenda ──────────────────────────────────────────────
            {
                element: '#legendToggle',
                popover: {
                    title:       '🗺️ Legenda Peta',
                    description: 'Legenda ini berada di pojok kanan atas peta. Klik untuk membuka atau menutup legenda. Legenda membantu memahami arti warna, simbol, dan kategori yang tampil pada peta saat layer aktif.',
                    position:    'left'
                }
            },

            // ── 11. Interaksi Peta ───────────────────────────────────────
            {
                element: '#map',
                popover: {
                    title:       '🖱️ Interaksi Peta',
                    description: 'Gunakan <b>scroll</b> untuk memperbesar atau memperkecil peta, dan <b>drag</b> untuk menggeser. Aktifkan layer di panel kiri, kemudian <b>klik objek pada peta</b> (titik, garis, atau area) untuk melihat informasi detail.',
                    position:    'left'
                }
            },

            // ── 12. Beranda (navbar) ─────────────────────────────────────
            {
                element: '.nav-links a[href="/"]',
                popover: {
                    title:       '🏠 Beranda',
                    description: 'Menu Beranda berisi informasi umum mengenai AQUAVISION, latar belakang sistem, dan gambaran fitur utama. Dapat diakses kapan saja tanpa login.',
                    position:    'bottom'
                }
            },

            // ── 13. Dashboard (navbar) ───────────────────────────────────
            {
                element: '.nav-links a[href="/map/"]',
                popover: {
                    title:       '🗺️ Dashboard',
                    description: 'Menu Dashboard membawa Anda ke halaman ini — pusat analisis spasial dan visualisasi data sumber daya air dalam sistem AQUAVISION.',
                    position:    'bottom'
                }
            },

            // ── 14. Data Portal (navbar) ─────────────────────────────────
            {
                element: '.nav-links a[href="/data/"]',
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Data Portal menyediakan tabel lengkap seluruh dataset dengan fitur pencarian dan paginasi. Dataset dapat diunduh dalam format CSV, GeoJSON, KML, atau Shapefile sesuai hak akses.',
                    position:    'bottom'
                }
            },

            // ── 15. Hubungi Admin (navbar — hanya jika elemen ada) ───────
            {
                element: '.nav-links a[href="/hubungi/"]',
                popover: {
                    title:       '✉️ Hubungi Admin',
                    description: 'Gunakan fitur ini untuk mengirim pertanyaan, laporan kendala, atau konsultasi kepada tim pengelola AQUAVISION. Sistem AI akan mencoba menjawab otomatis, atau admin akan membalas secara langsung.',
                    position:    'bottom'
                }
            },

            // ── 16. Pusat Bantuan (navbar) ───────────────────────────────
            {
                element: '.nav-links a[href="/bantuan/"]',
                popover: {
                    title:       '❓ Pusat Bantuan',
                    description: 'Menu ini menyediakan panduan penggunaan sistem dan jawaban atas pertanyaan yang sering diajukan. Tersedia 6 kategori FAQ untuk membantu Anda menggunakan AQUAVISION secara optimal.',
                    position:    'bottom'
                }
            },

            // ── 17. Informasi Data Layer ─────────────────────────────────
            {
                element: '#chkPotensiAirTanah',
                popover: {
                    title:       '📡 Informasi Data Layer',
                    description: 'Dua layer utama AQUAVISION tersedia dalam resolusi tinggi: <b>Potensi Air Tanah</b> (resolusi 10m × 10m) untuk zonasi resapan air tanah, dan <b>Debit Puncak Aliran</b> (resolusi 30m × 30m) untuk estimasi debit per bulan Januari–Desember.',
                    position:    'right'
                }
            },

            // ── 18. Selesai ──────────────────────────────────────────────
            {
                element: '#map',
                popover: {
                    title:       '🎉 Panduan Selesai',
                    description: 'Anda siap menggunakan AQUAVISION. Untuk hasil terbaik: aktifkan layer yang ingin dianalisis, kemudian klik objek pada peta untuk melihat informasi detail. Untuk mengulang panduan ini kapan saja, klik <b>ⓘ Lihat Panduan Dashboard</b> di bagian bawah panel kiri.',
                    position:    'left'
                }
            }
        ];
    }

    function prepareUI() {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('collapsed');
        var showBtn = document.getElementById('btnShowSidebar');
        if (showBtn) showBtn.style.display = 'none';

        var layerPanel = document.getElementById('layerPanel');
        if (layerPanel) layerPanel.style.display = 'block';

        var simBody = document.getElementById('simBody');
        if (simBody && !simBody.classList.contains('open')) {
            simBody.classList.add('open');
            var simArrow = document.querySelector('[data-target="simBody"] .accordion-arrow');
            if (simArrow) simArrow.classList.add('open');
        }

        var chartBody = document.getElementById('chartBody');
        if (chartBody && !chartBody.classList.contains('open')) {
            chartBody.classList.add('open');
            var chartArrow = document.querySelector('[data-target="chartBody"] .accordion-arrow');
            if (chartArrow) chartArrow.classList.add('open');
        }
    }

    function runTour() {
        try {
            if (typeof Driver === 'undefined') return;
            prepareUI();

            var steps = buildSteps().filter(function (s) {
                return !s.element || document.querySelector(s.element);
            });
            if (steps.length === 0) return;

            var d = new Driver({
                animate:      true,
                opacity:      0.75,
                padding:      8,
                allowClose:   true,
                doneBtnText:  'Selesai',
                closeBtnText: 'Lewati',
                nextBtnText:  'Lanjut →',
                prevBtnText:  '← Kembali',
                onReset: function () {
                    localStorage.setItem(TOUR_KEY, 'true');
                }
            });
            d.defineSteps(steps);
            d.start();
        } catch (e) {
            console.warn('Tour gagal dimulai:', e);
        }
    }

    window.startTour = function () {
        setTimeout(runTour, 300);
    };

    window.resetTour = function () {
        localStorage.removeItem(TOUR_KEY);
        window.startTour();
    };

    function autoStart() {
        if (localStorage.getItem(TOUR_KEY) === 'true') return;
        setTimeout(runTour, 600);
    }

    window.addEventListener('aquavision:mapReady', autoStart, { once: true });
})();
