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
            {
                element: '#map',
                popover: {
                    title:       '👋 Selamat Datang di AQUAVISION',
                    description: 'AQUAVISION adalah platform WebGIS pengelolaan sumber daya air Desa Wonotoro. Navigasi peta dengan scroll untuk zoom dan drag untuk bergerak. Klik objek di peta untuk melihat atribut detail.',
                    position:    'left'
                }
            },
            {
                element: '#map',
                popover: {
                    title:       '🎯 Tujuan Dashboard',
                    description: 'Dashboard ini membantu pemangku kepentingan — pemerintah desa, pengelola air, dan peneliti — memantau kondisi sumber daya air secara spasial, menganalisis ketersediaan versus kebutuhan, dan merencanakan infrastruktur berbasis data.',
                    position:    'left'
                }
            },
            {
                element: '#btnLayer',
                popover: {
                    title:       '🗂️ Panel Fitur',
                    description: 'Klik <b>Daftar Layer</b> untuk membuka panel kontrol layer. Aktifkan satu atau beberapa layer sekaligus. Legenda peta muncul otomatis di bawah panel saat ada layer yang aktif.',
                    position:    'right'
                }
            },
            {
                element: '#chkPotensiAirTanah',
                popover: {
                    title:       '🌿 Daerah Potensi Air Tanah (10m × 10m)',
                    description: 'Peta zonasi potensi resapan air tanah resolusi 10m × 10m, dihasilkan dari metode AHP menggunakan 5 kriteria: tutupan lahan, kemiringan lereng, jenis tanah, curah hujan, dan geologi. Warna hijau tua = potensi sangat tinggi. Klik pixel di peta untuk membaca nilai.',
                    position:    'right'
                }
            },
            {
                element: '#chkDebitPuncak',
                popover: {
                    title:       '💧 Debit Puncak Aliran (30m × 30m)',
                    description: 'Peta debit puncak aliran permukaan resolusi 30m × 30m menggunakan metode Rasional dan data curah hujan BMKG 2014–2023. Pilih bulan dari dropdown yang muncul untuk melihat variasi musiman Januari–Desember.',
                    position:    'right'
                }
            },
            {
                element: '.sidebar-scroll a[href*="/data/"]',
                popover: {
                    title:       '📊 Data Portal',
                    description: 'Data Portal menyediakan tabel lengkap semua dataset dengan fitur pencarian dan paginasi. Setiap dataset dapat diunduh dalam format CSV, GeoJSON, KML, atau Shapefile setelah menyetujui ketentuan penggunaan.',
                    position:    'right'
                }
            },
            {
                element: '.sidebar-scroll a[href="/hubungi/"]',
                popover: {
                    title:       '✉️ Hubungi Admin',
                    description: 'Sampaikan pertanyaan teknis atau permintaan data kepada Admin AQUAVISION. Sistem AI akan mencoba menjawab otomatis dari 15 topik FAQ. Jika tidak berhasil, admin akan membalas langsung.',
                    position:    'right'
                }
            },
            {
                element: '#debitBody',
                popover: {
                    title:       '⚖️ Ketersediaan Air',
                    description: 'Panel ini membandingkan ketersediaan (total debit sumber air) versus kebutuhan harian dalam m³. Status: <b>AMAN</b> = rasio ≥ 120%, <b>WASPADA</b> = 80–120%, <b>KRITIS</b> = di bawah 80%. Diperbarui otomatis dari database.',
                    position:    'right'
                }
            },
            {
                element: '#simHeader',
                popover: {
                    title:       '🔢 Simulasi Skenario',
                    description: 'Masukkan skenario hipotetis — jumlah penduduk, kamar hotel, kursi restoran, luas pertanian — lalu klik <b>Hitung Simulasi</b> untuk memproyeksikan kebutuhan air masa depan dan merencanakan kapasitas infrastruktur.',
                    position:    'right'
                }
            },
            {
                element: '#chartHeader',
                popover: {
                    title:       '📈 Grafik Ketersediaan Air',
                    description: 'Gauge chart menampilkan persentase pemanfaatan air (demand ÷ supply × 100%). Angka di atas 100% berarti defisit — kapasitas sumber tidak mencukupi kebutuhan saat ini dan perlu tambahan infrastruktur.',
                    position:    'right'
                }
            },
            {
                element: '#map',
                popover: {
                    title:       '🖱️ Interaksi Layer dan Popup',
                    description: 'Klik titik, garis, atau area di peta untuk membuka popup atribut. Gunakan tombol <b>+/−</b> di pojok kanan bawah untuk zoom. Tombol <b>🖨️ Export</b> mencetak tampilan peta saat ini sebagai gambar PNG.',
                    position:    'left'
                }
            },
            {
                element: '#map',
                popover: {
                    title:       '🎉 Panduan Selesai',
                    description: 'Anda siap menggunakan AQUAVISION. Untuk mengulangi panduan ini kapan saja, klik <b>ⓘ Lihat Panduan Dashboard</b> di bagian bawah panel kiri.',
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
