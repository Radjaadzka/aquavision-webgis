/* Dashboard Onboarding Tour — Driver.js 0.9.8
   Runs once per browser (localStorage key: aquavision_tour_done)
   Starts only after aquavision:mapReady event fired by script.js (post 2 s).
   11 langkah: AQUAVISION, Dashboard, Layer, Potensi, Debit, Infrastruktur,
               Neraca, Simulasi, Data Portal, Hubungi Admin, Pusat Bantuan
*/
(function () {
    if (localStorage.getItem("aquavision_tour_done") === "1") return;

    function prepareUI() {
        // Pastikan sidebar terbuka
        var sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("collapsed");
        var showBtn = document.getElementById("btnShowSidebar");
        if (showBtn) showBtn.style.display = "none";

        // Buka panel layer agar checkbox terlihat oleh Driver
        var layerPanel = document.getElementById("layerPanel");
        if (layerPanel) layerPanel.style.display = "block";

        // Buka accordion Simulasi
        var simBody = document.getElementById("simBody");
        if (simBody && !simBody.classList.contains("open")) {
            simBody.classList.add("open");
            var simArrow = document.querySelector('[data-target="simBody"] .accordion-arrow');
            if (simArrow) simArrow.classList.add("open");
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
                            title:       "👋 Selamat Datang di AQUAVISION",
                            description: "AQUAVISION adalah platform informasi spasial sumber daya air Desa Wonotoro, dikembangkan sebagai Capstone Design Project ITB 2026. Ikuti tur singkat ini untuk mengenal setiap fitur yang tersedia.",
                            position:    "left"
                        }
                    },
                    {
                        element: "#map",
                        popover: {
                            title:       "🗺️ Dashboard Peta Interaktif",
                            description: "Dashboard ini adalah pusat visualisasi AQUAVISION. Seluruh data spasial — sumber air, pipa, debit aliran, dan potensi air tanah — divisualisasikan di peta interaktif berbasis Leaflet.js di atas basemap OpenStreetMap.",
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
                            description: "Peta zonasi resapan air tanah dengan resolusi 10m × 10m, dihasilkan dari metode AHP menggunakan data tutupan lahan, kemiringan lereng, jenis tanah, dan curah hujan. Warna menunjukkan tingkat potensi dari rendah hingga sangat tinggi.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkDebitPuncak",
                        popover: {
                            title:       "💧 Debit Puncak Aliran",
                            description: "Peta debit puncak aliran permukaan (m³/s) dengan resolusi 30m × 30m, tersedia untuk 12 bulan (Januari–Desember). Pilih bulan dari dropdown untuk melihat variasi musiman. Klik area peta untuk membaca nilai debit.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkAir",
                        popover: {
                            title:       "🏗️ Infrastruktur Air",
                            description: "Tampilkan lokasi sumber mata air, jaringan pipa distribusi, tandon air, dan fasilitas wisata (hotel, restoran, jasa). Klik titik atau garis di peta untuk melihat atribut detail.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#debitBody",
                        popover: {
                            title:       "⚖️ Neraca Ketersediaan Air",
                            description: "Membandingkan ketersediaan air (total debit sumber) versus kebutuhan harian (permukiman + fasilitas). Status: <b>AMAN</b> = surplus, <b>WASPADA</b> = mendekati batas, <b>KRITIS</b> = defisit. Diperbarui otomatis dari database.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#simHeader",
                        popover: {
                            title:       "🔢 Simulasi Skenario",
                            description: "Masukkan skenario hipotetis — jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian — untuk menghitung proyeksi kebutuhan air. Berguna untuk perencanaan pengembangan wisata dan infrastruktur ke depan.",
                            position:    "right"
                        }
                    },
                    {
                        element: ".sidebar-scroll a[href*='/data/']",
                        popover: {
                            title:       "📊 Data Portal",
                            description: "Akses dan unduh seluruh dataset spasial dalam format CSV, GeoJSON, KML, atau Shapefile untuk analisis lanjutan di GIS desktop atau spreadsheet. Data Portal menampilkan tabel lengkap dengan fitur pencarian dan paginasi.",
                            position:    "right"
                        }
                    },
                    {
                        element: ".sidebar-scroll a[href='/hubungi/']",
                        popover: {
                            title:       "✉️ Hubungi Admin",
                            description: "Sampaikan pertanyaan, laporan, atau permintaan data langsung kepada Admin AQUAVISION melalui fitur chat real-time. Admin akan membalas secepatnya.",
                            position:    "right"
                        }
                    },
                    {
                        element: ".sidebar-scroll a[href='/bantuan/']",
                        popover: {
                            title:       "❓ Pusat Bantuan",
                            description: "Temukan panduan lengkap penggunaan AQUAVISION, penjelasan setiap fitur, dan FAQ. Jika pertanyaan Anda belum terjawab, gunakan fitur Hubungi Admin. Selamat menggunakan AQUAVISION! 🎉",
                            position:    "right"
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
