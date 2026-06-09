/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Runs once per browser (localStorage key: aquavision_tour_done)
   Starts only after aquavision:mapReady event fired by script.js (post 2 s).
*/
(function () {
    if (localStorage.getItem("aquavision_tour_done") === "1") return;

    function prepareUI() {
        // Ensure sidebar visible
        var sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("collapsed");
        var showBtn = document.getElementById("btnShowSidebar");
        if (showBtn) showBtn.style.display = "none";

        // Open layer panel so checkboxes are reachable by Driver highlight
        var layerPanel = document.getElementById("layerPanel");
        if (layerPanel) layerPanel.style.display = "block";

        // Open Simulasi accordion (step targets btnSimulasi inside it)
        var simBody = document.getElementById("simBody");
        if (simBody && !simBody.classList.contains("open")) {
            simBody.classList.add("open");
            var simArrow = document.querySelector('[data-target="simBody"] .accordion-arrow');
            if (simArrow) simArrow.classList.add("open");
        }

        // Open Grafik accordion
        var chartBody = document.getElementById("chartBody");
        if (chartBody && !chartBody.classList.contains("open")) {
            chartBody.classList.add("open");
            var chartArrow = document.querySelector('[data-target="chartBody"] .accordion-arrow');
            if (chartArrow) chartArrow.classList.add("open");
        }
    }

    function startTour() {
        setTimeout(function () {
            try {
                if (typeof Driver === "undefined") return;

                prepareUI();

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
                        localStorage.setItem("aquavision_tour_done", "1");
                    }
                });

                d.defineSteps([
                    {
                        element: "#map",
                        popover: {
                            title:       "👋 Selamat Datang di Dashboard AQUAVISION",
                            description: "Dashboard ini adalah pusat informasi spasial sumber daya air Desa Wonotoro. Ikuti tur singkat ini untuk memahami setiap fitur yang tersedia.",
                            position:    "left"
                        }
                    },
                    {
                        element: "#btnLayer",
                        popover: {
                            title:       "🗂️ Daftar Layer",
                            description: "Klik untuk membuka panel layer. Aktifkan atau nonaktifkan setiap lapisan peta sesuai kebutuhan analisis Anda.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkPotensiAirTanah",
                        popover: {
                            title:       "🌿 Daerah Potensi Air Tanah",
                            description: "Peta zonasi resapan air tanah dengan resolusi 10m × 10m. Warna menunjukkan tingkat potensi dari rendah hingga sangat tinggi.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkDebitPuncak",
                        popover: {
                            title:       "💧 Debit Puncak Aliran",
                            description: "Peta debit puncak aliran permukaan dengan resolusi 30m × 30m. Pilih bulan untuk melihat variasi musiman. Klik area peta untuk membaca nilai debit (m³/s).",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkAir",
                        popover: {
                            title:       "🏗️ Infrastruktur Air",
                            description: "Tampilkan lokasi sumber mata air, jaringan pipa distribusi, dan tandon air. Klik titik atau garis di peta untuk melihat detail atribut.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#debitBody",
                        popover: {
                            title:       "⚖️ Neraca Ketersediaan Air",
                            description: "Perbandingan pasokan versus kebutuhan air harian. Status <b>AMAN</b> = surplus, <b>WASPADA</b> = mendekati batas, <b>KRITIS</b> = defisit. Diperbarui otomatis.",
                            position:    "right"
                        }
                    },
                    {
                        element: ".sidebar-scroll a[href*='/data/']",
                        popover: {
                            title:       "📊 Data Portal",
                            description: "Akses dan unduh seluruh dataset spasial dalam format CSV, GeoJSON, KML, atau Shapefile untuk analisis lanjutan.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#btnPrintMap",
                        popover: {
                            title:       "🖨️ Export Data Peta",
                            description: "Unduh tampilan peta saat ini sebagai gambar PNG. Pastikan layer yang diinginkan sudah aktif sebelum mengekspor.",
                            position:    "bottom"
                        }
                    },
                    {
                        element: "#btnDistance",
                        popover: {
                            title:       "📏 Pengukuran Jarak",
                            description: "Ukur jarak antar dua titik di peta. Pilih mode Klik 2 Titik lalu klik lokasi pada peta, atau masukkan koordinat secara manual.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#map",
                        popover: {
                            title:       "✅ Tur Selesai",
                            description: "Anda kini siap menggunakan Dashboard AQUAVISION. Kombinasikan layer, analisis neraca air, dan unduh data untuk mendukung pengelolaan sumber daya air Wonotoro.",
                            position:    "left"
                        }
                    }
                ]);

                d.start();
            } catch (e) {
                console.warn("Tour gagal dimulai:", e);
            }
        }, 600);
    }

    window.addEventListener("aquavision:mapReady", startTour, { once: true });
})();
