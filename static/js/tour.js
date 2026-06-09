/* WebGIS Onboarding Tour — Driver.js 0.9.8
   Runs once per browser (localStorage key: aquavision_tour_done)
   Starts only after aquavision:mapReady event is fired by script.js.
*/
(function () {
    if (localStorage.getItem("aquavision_tour_done") === "1") return;

    function startTour() {
        setTimeout(function () {
            try {
                if (typeof Driver === "undefined") return;

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
                        element: "#btnLayer",
                        popover: {
                            title:       "🗺️ Daftar Layer",
                            description: "Klik di sini untuk mengaktifkan atau menonaktifkan layer peta. Pilih layer yang ingin Anda analisis.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#chkDebitPuncak",
                        popover: {
                            title:       "💧 Debit Puncak Aliran",
                            description: "Aktifkan layer ini lalu pilih bulan untuk melihat peta debit puncak aliran. Klik titik di peta untuk membaca nilai debit.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#debitBody",
                        popover: {
                            title:       "⚖️ Neraca Ketersediaan Air",
                            description: "Pantau ketersediaan versus kebutuhan air harian. Status AMAN, WASPADA, atau KRITIS diperbarui secara otomatis.",
                            position:    "right"
                        }
                    },
                    {
                        element: "#mapCtrlTop",
                        popover: {
                            title:       "🔍 Pencarian Lokasi",
                            description: "Ketik nama lokasi lalu tekan Enter untuk langsung menuju titik tersebut di peta.",
                            position:    "bottom"
                        }
                    },
                    {
                        element: "#map",
                        popover: {
                            title:       "📍 Peta Interaktif",
                            description: "Klik peta untuk melihat koordinat dan UTM. Aktifkan layer Debit Puncak untuk membaca nilai debit di setiap lokasi.",
                            position:    "left"
                        }
                    },
                    {
                        element: "#btnPrintMap",
                        popover: {
                            title:       "🖨️ Export Peta",
                            description: "Unduh tampilan peta saat ini sebagai gambar PNG.",
                            position:    "bottom"
                        }
                    },
                    {
                        element: ".sidebar-scroll a[href*='/data/']",
                        popover: {
                            title:       "📊 Data Portal",
                            description: "Akses dan unduh semua dataset dalam format CSV, GeoJSON, KML, dan Shapefile.",
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

    window.addEventListener('aquavision:mapReady', startTour, { once: true });
})();
