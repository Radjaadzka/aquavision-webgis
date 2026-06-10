/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Runs once per browser (localStorage key: aquavision_tour_done)
   Force restart: add ?tour=1 to URL, or call window.aquavisionStartTour()
   Starts only after aquavision:mapReady event fired by script.js (post 2 s).
   12 langkah: AQUAVISION, Tujuan Dashboard, Layer, Potensi, Debit, Infrastruktur,
               Neraca, Simulasi, Data Portal, Hubungi Admin, Pusat Bantuan, Selesai
*/
(function () {
    var TOUR_KEY = "aquavision_tour_done";

    // URL param ?tour=1 forces restart (clean URL afterwards)
    var forceRestart = (window.location.search.indexOf('tour=1') !== -1);
    if (forceRestart) {
        localStorage.removeItem(TOUR_KEY);
        try {
            history.replaceState(null, '', window.location.pathname + window.location.hash);
        } catch (e) {}
    }

    if (localStorage.getItem(TOUR_KEY) === "1") return;

    function prepareUI() {
        var sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("collapsed");
        var showBtn = document.getElementById("btnShowSidebar");
        if (showBtn) showBtn.style.display = "none";

        var layerPanel = document.getElementById("layerPanel");
        if (layerPanel) layerPanel.style.display = "block";

        var simBody = document.getElementById("simBody");
        if (simBody && !simBody.classList.contains("open")) {
            simBody.classList.add("open");
            var simArrow = document.querySelector('[data-target="simBody"] .accordion-arrow');
            if (simArrow) simArrow.classList.add("open");
        }
    }

    function buildSteps() {
        return [
            {
                element: "#map",
                popover: {
                    title:       "👋 Selamat Datang di AQUAVISION",
                    description: "AQUAVISION adalah platform informasi spasial sumber daya air Desa Wonotoro, dikembangkan sebagai Capstone Design Project ITB 2026. Ikuti tur singkat ini untuk mengenal setiap fitur yang tersedia.",
                    position:    "left"
                }
            },
            {
                element: "#map",
                popover: {
                    title:       "🎯 Tujuan Dashboard",
                    description: "Dashboard ini membantu pemangku kepentingan — pemerintah desa, pengelola air, dan peneliti — untuk memantau kondisi sumber daya air secara spasial, merencanakan infrastruktur, dan mengambil keputusan berbasis data.",
                    position:    "left"
                }
            },
            {
                element: "#btnLayer",
                popover: {
                    title:       "🗂️ Daftar Layer",
                    description: "Klik tombol ini untuk membuka panel layer. Aktifkan atau nonaktifkan lapisan data sesuai kebutuhan analisis. Beberapa layer dapat dikombinasikan secara bersamaan.",
                    position:    "right"
                }
            },
            {
                element: "#chkPotensiAirTanah",
                popover: {
                    title:       "🌿 Daerah Potensi Air Tanah",
                    description: "Peta zonasi resapan air tanah resolusi 10m × 10m, dihasilkan dari metode AHP menggunakan data tutupan lahan, kemiringan lereng, jenis tanah, dan curah hujan. Warna menunjukkan tingkat potensi dari rendah hingga sangat tinggi.",
                    position:    "right"
                }
            },
            {
                element: "#chkDebitPuncak",
                popover: {
                    title:       "💧 Debit Puncak Aliran",
                    description: "Peta debit puncak aliran permukaan (m³/s) resolusi 30m × 30m, tersedia untuk 12 bulan (Januari–Desember). Pilih bulan dari dropdown untuk melihat variasi musiman. Klik area peta untuk membaca nilai debit.",
                    position:    "right"
                }
            },
            {
                element: "#chkAir",
                popover: {
                    title:       "🏗️ Infrastruktur Air",
                    description: "Tampilkan lokasi sumber mata air, jaringan pipa distribusi, tandon air, dan fasilitas wisata. Klik titik atau garis di peta untuk melihat atribut detail setiap objek.",
                    position:    "right"
                }
            },
            {
                element: "#debitBody",
                popover: {
                    title:       "⚖️ Neraca Ketersediaan Air",
                    description: "Membandingkan ketersediaan air (total debit sumber) versus kebutuhan harian. Status: <b>AMAN</b> = surplus, <b>WASPADA</b> = mendekati batas, <b>KRITIS</b> = defisit. Diperbarui otomatis dari database.",
                    position:    "right"
                }
            },
            {
                element: "#simHeader",
                popover: {
                    title:       "🔢 Simulasi Skenario",
                    description: "Masukkan skenario hipotetis — jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian — untuk menghitung proyeksi kebutuhan air dan merencanakan pengembangan infrastruktur.",
                    position:    "right"
                }
            },
            {
                element: ".sidebar-scroll a[href*='/data/']",
                popover: {
                    title:       "📊 Data Portal",
                    description: "Akses dan unduh seluruh dataset spasial dalam format CSV, GeoJSON, KML, atau Shapefile. Data Portal menyediakan tabel lengkap dengan fitur pencarian dan paginasi.",
                    position:    "right"
                }
            },
            {
                element: ".sidebar-scroll a[href='/hubungi/']",
                popover: {
                    title:       "✉️ Hubungi Admin",
                    description: "Sampaikan pertanyaan kepada Admin AQUAVISION. Sistem akan mencoba menjawab otomatis; jika tidak berhasil, admin akan membalas secepatnya.",
                    position:    "right"
                }
            },
            {
                element: ".sidebar-scroll a[href='/bantuan/']",
                popover: {
                    title:       "❓ Pusat Bantuan",
                    description: "Temukan panduan lengkap penggunaan AQUAVISION, penjelasan fitur, dan FAQ dalam 6 kategori. Tersedia fitur pencarian cepat.",
                    position:    "right"
                }
            },
            {
                element: "#map",
                popover: {
                    title:       "🎉 Selesai!",
                    description: "Tur selesai! Anda telah mengenal semua fitur utama AQUAVISION. Mulailah dengan mengaktifkan layer yang Anda butuhkan. Untuk mengulangi tur ini, klik tombol <b>Mulai Tour</b> di sidebar.",
                    position:    "left"
                }
            }
        ];
    }

    function runTour() {
        try {
            if (typeof Driver === "undefined") return;
            prepareUI();
            // Filter out steps whose target element doesn't exist (e.g. guest vs authenticated)
            var steps = buildSteps().filter(function (s) {
                return !s.element || document.querySelector(s.element);
            });
            if (steps.length === 0) return;
            var d = new Driver({
                animate:      true,
                opacity:      0.75,
                padding:      8,
                allowClose:   true,
                doneBtnText:  "Selesai",
                closeBtnText: "Lewati",
                nextBtnText:  "Lanjut →",
                prevBtnText:  "← Kembali",
                onReset: function () {
                    localStorage.setItem(TOUR_KEY, "1");
                }
            });
            d.defineSteps(steps);
            d.start();
        } catch (e) {
            console.warn("Tour gagal dimulai:", e);
        }
    }

    function startTour() {
        setTimeout(runTour, 600);
    }

    // Called by "Mulai Tour" sidebar button
    window.aquavisionStartTour = function () {
        localStorage.removeItem(TOUR_KEY);
        runTour();
    };

    window.addEventListener("aquavision:mapReady", startTour, { once: true });
})();
