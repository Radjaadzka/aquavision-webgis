document.addEventListener("DOMContentLoaded", function () {

    // ================================================================
    // 0. CSRF HELPER
    // ================================================================

    function getCsrfToken() {
        var name  = "csrftoken";
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        var meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute("content") : "";
    }

    // ================================================================
    // 1. INISIALISASI MAP
    // ================================================================

    const map = L.map("map", {
        center: [-7.9, 112.95],
        zoom: 12,
        zoomControl: false
    });

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }
    ).addTo(map);

    // Gentle welcome zoom into Desa Wonotoro on every page load.
    setTimeout(function () {
        map.flyTo([-7.88, 112.98], 14, { duration: 1.5, easeLinearity: 0.4 });
    }, 1200);


    // ================================================================
    // 2. NOTIFIKASI
    // ================================================================

    function showNotif(title, message, type) {
        var existing = document.getElementById("notifPopup");
        if (existing) existing.remove();

        var colors = {
            error:   { bg: "#fdedec", border: "#e74c3c", icon: "🚫" },
            success: { bg: "#e8f6f3", border: "#27ae60", icon: "✅" },
            warning: { bg: "#fef9e7", border: "#e67e22", icon: "⚠️" }
        };
        var c = colors[type] || colors.warning;

        var div = document.createElement("div");
        div.id = "notifPopup";
        div.style.cssText = [
            "position:fixed", "top:80px", "right:20px", "z-index:9999",
            "background:" + c.bg, "border-left:4px solid " + c.border,
            "padding:16px 20px", "border-radius:10px",
            "box-shadow:0 8px 30px rgba(0,0,0,0.15)", "max-width:360px",
            "animation:slideIn 0.3s ease", "font-family:inherit"
        ].join(";");

        div.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:4px;">' + c.icon + " " + title + "</div>" +
                    '<div style="font-size:13px;color:#555;line-height:1.5;">' + message + "</div>" +
                "</div>" +
                '<button onclick="this.parentElement.parentElement.remove()" ' +
                    'style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;padding:0;width:auto;line-height:1;">✕</button>' +
            "</div>";

        document.body.appendChild(div);
        setTimeout(function () { if (div.parentElement) div.remove(); }, 5000);
    }


    // ================================================================
    // 3. SKALA PETA
    // ================================================================

    function updateScale() {
        var center = map.getCenter();
        var zoom   = map.getZoom();
        var mpp    = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
        var scale  = Math.round(mpp * 96 * 39.3701);
        var el     = document.getElementById("scaleDisplay");
        if (!el) return;

        if      (scale >= 1000000) el.textContent = "1 : " + (scale / 1000000).toFixed(1) + " jt";
        else if (scale >= 1000)    el.textContent = "1 : " + (scale / 1000).toFixed(1) + " rb";
        else                       el.textContent = "1 : " + scale.toLocaleString("id-ID");
    }

    map.on("zoomend", updateScale);
    map.on("moveend", updateScale);
    updateScale();


    // ================================================================
    // 4. LAYER GROUPS
    // ================================================================

    var airLayer          = L.layerGroup();
    var hotelLayer        = L.layerGroup();
    var makanLayer        = L.layerGroup();
    var jasaLayer         = L.layerGroup();
    var pendudukLayer     = L.layerGroup();
    var reservoirLayer    = L.layerGroup();
    var pipaLayer         = L.layerGroup();
    var adminLayer        = null;
    var sungaiVektorLayer = null;
    var potensiAirTanahLayer = null;
    var highlightedLayer  = null;
    var tempMarker        = null;

    // Jarak
    var titikKlik      = [];
    var garisJarak     = null;
    var distanceActive = false;
    var distanceMarkers = [];


    // ================================================================
    // 5. DEBIT PUNCAK — KONSTANTA & WARNA
    // ================================================================

    var BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    var BULAN_LABEL = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    var DEBIT_COLORS = [
        "#c7e9ff", "#93cfee", "#5fb5de", "#2e9bc8",
        "#1a7fad", "#0f638f", "#074870", "#022d4d"
    ];

    function getDebitColor(k) {
        return DEBIT_COLORS[Math.max(0, Math.min(7, Math.round(k) - 1))];
    }

    var debitGeoJSONLayers = {};
    var debitGeoRasters    = {};
    var activeDebitBulan   = null;


    // ================================================================
    // 6. TOOLTIPS
    // ================================================================

    var tooltipDebit = document.createElement("div");
    tooltipDebit.style.cssText =
        "position:fixed;background:white;color:#333;padding:8px 12px;" +
        "border-radius:8px;font-size:13px;pointer-events:none;display:none;" +
        "z-index:9200;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:1px solid #ddd;max-width:220px;";
    document.body.appendChild(tooltipDebit);

    var tooltipPotensi = document.createElement("div");
    tooltipPotensi.style.cssText =
        "position:fixed;background:white;color:#333;padding:8px 12px;" +
        "border-radius:8px;font-size:13px;pointer-events:none;display:none;" +
        "z-index:9200;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:1px solid #ddd;max-width:220px;";
    document.body.appendChild(tooltipPotensi);

    var mouseOnPotensi = false;


    // ================================================================
    // 7. TOOLTIP DEBIT (dari GeoRaster TIFF)
    // ================================================================

    // P0.4: extract raster lookup into reusable helper
    function getDebitRasterValue(lat, lng) {
        if (!activeDebitBulan || !debitGeoRasters[activeDebitBulan]) return null;
        var gr    = debitGeoRasters[activeDebitBulan];
        var west  = gr.xmin, east = gr.xmax, south = gr.ymin, north = gr.ymax;
        if (lat < south || lat > north || lng < west || lng > east) return null;

        var col = Math.max(0, Math.min(Math.floor((lng - west)  / (east - west)   * gr.width),  gr.width  - 1));
        var row = Math.max(0, Math.min(Math.floor((north - lat) / (north - south) * gr.height), gr.height - 1));

        outer:
        for (var dr = -3; dr <= 3; dr++) {
            for (var dc = -3; dc <= 3; dc++) {
                var c2 = Math.max(0, Math.min(col + dc, gr.width  - 1));
                var r2 = Math.max(0, Math.min(row + dr, gr.height - 1));
                var v  = gr.values[0][r2][c2];
                if (v !== null && !isNaN(v) && v !== gr.noDataValue && Math.abs(v) > 0.0001 && v !== -9999) {
                    return v;
                }
            }
        }
        return null;
    }

    function updateTooltipDebit(eLat, eLng, eX, eY, offsetY) {
        var foundVal = getDebitRasterValue(eLat, eLng);

        if (foundVal !== null) {
            var bulanLabel = BULAN_LABEL[BULAN.indexOf(activeDebitBulan)];
            var kelas =
                foundVal <= 5  ? 1 : foundVal <= 10 ? 2 : foundVal <= 15 ? 3 :
                foundVal <= 21 ? 4 : foundVal <= 26 ? 5 : foundVal <= 31 ? 6 :
                foundVal <= 36 ? 7 : 8;
            var warna = getDebitColor(kelas);

            tooltipDebit.style.display = "block";
            tooltipDebit.style.left    = (eX + 16) + "px";
            tooltipDebit.style.top     = (eY + (offsetY || 0)) + "px";
            tooltipDebit.innerHTML =
                '<div style="font-weight:600;font-size:13px;margin-bottom:4px;color:' + warna + ';border-bottom:1px solid #eee;padding-bottom:4px;">🌊 Debit Puncak — ' + bulanLabel + "</div>" +
                '<div style="font-size:12px;">Debit Puncak: <b>' + foundVal.toFixed(2) + " m³/s</b></div>";
        } else {
            tooltipDebit.style.display = "none";
        }
    }


    // ================================================================
    // 8. MOUSEMOVE & MOUSEOUT
    // ================================================================

    var mouseMoveTimer = null;

    map.on("mousemove", function (e) {
        var el = document.getElementById("coordDisplay");
        if (el) el.textContent = e.latlng.lat.toFixed(6) + ", " + e.latlng.lng.toFixed(6);

        if (mouseOnPotensi) return;

        tooltipDebit.style.display = "none";
        clearTimeout(mouseMoveTimer);

        var eLat = e.latlng.lat;
        var eLng = e.latlng.lng;
        var eX   = e.originalEvent.clientX;
        var eY   = e.originalEvent.clientY;

        mouseMoveTimer = setTimeout(function () {
            updateTooltipDebit(eLat, eLng, eX, eY, -12);
        }, 30);
    });

    map.on("mouseout", function () {
        var el = document.getElementById("coordDisplay");
        if (el) el.textContent = "-";
        tooltipDebit.style.display  = "none";
        tooltipPotensi.style.display = "none";
        mouseOnPotensi = false;
        clearTimeout(mouseMoveTimer);
    });


    // ================================================================
    // 9. POTENSI AIR TANAH
    // ================================================================

    function getPotensiColor(dn) {
        if (dn === 1) return "#e74c3c";
        if (dn === 2) return "#e67e22";
        if (dn === 3) return "#f1c40f";
        if (dn === 4) return "#27ae60";
        return "#95a5a6";
    }

    function getPotensiLabel(dn) {
        if (dn === 1) return "Rendah";
        if (dn === 2) return "Sedang";
        if (dn === 3) return "Tinggi";
        if (dn === 4) return "Sangat Tinggi";
        return "-";
    }

    function loadPotensiAirTanah(addToMap) {
        fetch("/static/data/DaerahResapan.geojson")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                potensiAirTanahLayer = L.geoJSON(data, {
                    style: function (f) {
                        var dn = f.properties.DN || f.properties.dn || f.properties.VALUE || 1;
                        return {
                            color: "#333",
                            weight: 0.5,
                            fillColor: getPotensiColor(dn),
                            fillOpacity: 0.65
                        };
                    },
                    onEachFeature: function (f, l) {
                        var dn    = f.properties.DN || f.properties.dn || f.properties.VALUE || 1;
                        var label = getPotensiLabel(dn);
                        var color = getPotensiColor(dn);

                        l.bindPopup(
                            '<div style="font-family:\'Inter\',sans-serif;padding:2px 0;min-width:160px;">' +
                                '<div style="font-weight:700;font-size:13px;color:' + color + ';margin-bottom:8px;border-bottom:1px solid rgba(0,0,0,.08);padding-bottom:6px;">💧 Potensi Air Tanah</div>' +
                                '<div style="font-size:22px;font-weight:700;color:' + color + ';letter-spacing:-.3px;">' + label + '</div>' +
                            '</div>'
                        );

                        // Prevent map-level click popup from firing on top of this popup
                        l.on("click", function (ev) { L.DomEvent.stopPropagation(ev); });

                        l.on("mouseover", function () { mouseOnPotensi = true; });

                        l.on("mouseout", function () {
                            mouseOnPotensi = false;
                            tooltipPotensi.style.display = "none";
                        });

                        l.on("mousemove", function (ev) {
                            var eX = ev.originalEvent.clientX;
                            var eY = ev.originalEvent.clientY;
                            mouseOnPotensi = true;

                            tooltipPotensi.style.display = "block";
                            tooltipPotensi.style.left    = (eX + 16) + "px";
                            tooltipPotensi.style.top     = (eY - 12) + "px";
                            tooltipPotensi.innerHTML =
                                '<div style="font-weight:600;font-size:13px;margin-bottom:4px;color:' + color + ';border-bottom:1px solid #eee;padding-bottom:4px;">💧 Daerah Potensi Air Tanah</div>' +
                                '<div style="font-size:12px;">Potensi: <b style="color:' + color + ';">' + label + "</b></div>";

                            updateTooltipDebit(ev.latlng.lat, ev.latlng.lng, eX, eY, 80);
                        });
                    }
                });
                if (addToMap) map.addLayer(potensiAirTanahLayer);
                console.log("Potensi Air Tanah loaded");
            })
            .catch(function (err) { console.log("Potensi Air Tanah error:", err); });
    }
    // loadPotensiAirTanah() — dibuat lazy: hanya dimuat saat checkbox diaktifkan (hemat 1.49 MB)


    // ================================================================
    // 10. DEBIT PUNCAK — LOAD & SET BULAN
    // ================================================================

    function loadDebitBulan(kode) {
        // GeoJSON
        fetch("/static/data/DebitPuncak_" + kode + ".geojson")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                debitGeoJSONLayers[kode] = L.geoJSON(data, {
                    style: function (f) {
                        var kelas = f.properties.DN || f.properties.dn || f.properties.VALUE || 1;
                        return {
                            color:       "#1a7fad",
                            weight:      0.3,
                            fillColor:   getDebitColor(kelas),
                            fillOpacity: 0.72,
                            opacity:     1
                        };
                    },
                    // No per-feature click handler — all clicks route to map.on("click")
                    // which shows a unified popup: coordinates + UTM + debit value.
                });
                // Add immediately if this month is still the active one
                if (activeDebitBulan === kode) {
                    map.addLayer(debitGeoJSONLayers[kode]);
                }
                console.log("Debit GeoJSON loaded:", kode);
            })
            .catch(function (err) { console.log("Debit GeoJSON error:", kode, err); });

        // GeoRaster TIFF (untuk tooltip nilai piksel)
        if (typeof parseGeoraster !== "undefined") {
            fetch("/static/data/DebitPuncak_" + kode + ".tif")
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (buf) {
                    parseGeoraster(buf).then(function (georaster) {
                        debitGeoRasters[kode] = georaster;
                        console.log("Debit TIFF loaded:", kode);
                    });
                })
                .catch(function (err) { console.log("Debit TIFF error:", kode, err); });
        }
    }

    function setDebitBulan(kode) {
        // Hapus layer bulan sebelumnya
        if (activeDebitBulan && debitGeoJSONLayers[activeDebitBulan]) {
            if (map.hasLayer(debitGeoJSONLayers[activeDebitBulan])) {
                map.removeLayer(debitGeoJSONLayers[activeDebitBulan]);
            }
        }

        tooltipDebit.style.display = "none";

        if (!kode) {
            activeDebitBulan = null;
            return;
        }

        activeDebitBulan = kode;

        if (debitGeoJSONLayers[kode]) {
            map.addLayer(debitGeoJSONLayers[kode]);
            return;
        }

        // Belum dimuat — muat sekarang; layer akan ditambah ke map di dalam callback
        showNotif("Memuat", "Memuat data " + BULAN_LABEL[BULAN.indexOf(kode)] + "...", "warning");
        loadDebitBulan(kode);
    }


    // ================================================================
    // 11. ICONS
    // ================================================================

    // ── SVG Marker Factory — no CDN dependency, icons sesuai objek ───
    function makeSvgMarker(svgPaths, bg, size) {
        size = size || 30;
        var inner = Math.round(size * 0.55);
        return L.divIcon({
            html: '<div style="width:' + size + 'px;height:' + size + 'px;background:' + bg +
                  ';border-radius:50%;display:flex;align-items:center;justify-content:center;' +
                  'border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(0,0,0,.4);">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
                  'width="' + inner + '" height="' + inner + '" fill="white">' +
                  svgPaths + '</svg></div>',
            iconSize:    [size, size],
            iconAnchor:  [size / 2, size / 2],
            popupAnchor: [0, -(size / 2 + 4)],
            className:   ''
        });
    }

    // Sumber Air — tetes air / mata air
    var iconAir = makeSvgMarker(
        '<path d="M12 3.5C9.5 7 7 11 7 14.5a5 5 0 0010 0C17 11 14.5 7 12 3.5z"/>',
        '#2563EB'
    );

    // Tandon Air — tangki penyimpan air (silinder dengan permukaan air)
    var iconReservoir = makeSvgMarker(
        '<path d="M6 10c0-1.1 2.7-2 6-2s6 .9 6 2v8c0 1.1-2.7 2-6 2s-6-.9-6-2v-8z"/>' +
        '<path d="M6 10c0 1.1 2.7 2 6 2s6-.9 6-2" stroke="rgba(255,255,255,.5)" stroke-width="1.2" fill="none"/>' +
        '<path d="M7.5 14h9" stroke="rgba(255,255,255,.45)" stroke-width="1" fill="none"/>',
        '#0891B2'
    );

    // Hotel — gedung penginapan
    var iconHotel = makeSvgMarker(
        '<path d="M12 3L4 8v13h16V8L12 3zm-3 13H7v-5h2v5zm3 0h-2v-5h2v5zm3 0h-2v-5h2v5zm0-7H8V8h8v2z"/>',
        '#EA580C'
    );

    // Tempat Makan — garpu & pisau
    var iconMakan = makeSvgMarker(
        '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.1 1.7 3.8 3.8 4V21h2.5v-8C11.3 12.8 13 11.1 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.8 0-5 2.2-5 4z"/>',
        '#CA8A04'
    );

    // Jasa — kunci pas / layanan
    var iconJasa = makeSvgMarker(
        '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>',
        '#7C3AED', 28
    );

    // Permukiman — ikon rumah
    var iconPermukiman = makeSvgMarker(
        '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
        '#8e44ad'
    );


    // ================================================================
    // 12a. POPUP HELPER — format seragam untuk semua layer titik
    // ================================================================

    function makePopup(accentColor, typeLabel, name, rows) {
        var html =
            '<div style="font-family:\'Inter\',sans-serif;min-width:170px;font-size:13px;line-height:1.65;">' +
            '<div style="font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;' +
            'color:' + accentColor + ';margin-bottom:3px;">' + typeLabel + '</div>' +
            '<div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:7px;' +
            'padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.07);">' + (name || '—') + '</div>';
        rows.forEach(function (r) {
            if (r.value !== null && r.value !== undefined && String(r.value).trim() !== '') {
                html +=
                    '<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:2px;">' +
                    '<span style="color:#6B7280;font-size:12px;">' + r.label + '</span>' +
                    '<span style="font-weight:500;color:#111827;font-size:12px;text-align:right;">' + r.value + '</span>' +
                    '</div>';
            }
        });
        return html + '</div>';
    }


    // ================================================================
    // 12. HELPER STATUS NERACA AIR
    // ================================================================

    function getStatusColor(p) { return p < 50 ? "#22C55E" : p < 80 ? "#F59E0B" : "#EF4444"; }
    function getStatusLabel(p) { return p < 50 ? "AMAN"    : p < 80 ? "WASPADA" : "KRITIS";  }
    function getStatusBg(p)    { return p < 50 ? "rgba(34,197,94,.12)" : p < 80 ? "rgba(245,158,11,.12)" : "rgba(239,68,68,.12)"; }


    // ================================================================
    // 13. POLYGON STATS
    // ================================================================

    function clearHighlight() {
        if (highlightedLayer) {
            highlightedLayer.setStyle({ weight: 0.5, fillOpacity: 0.65 });
            highlightedLayer = null;
        }
    }

    function showPolygonStats(title, rows) {
        document.getElementById("polygonStatsTitle").textContent = title;

        var html = '<div class="polygon-stats-rows">';
        rows.forEach(function (r) {
            html +=
                '<div class="polygon-stat-row">' +
                    '<span class="polygon-stat-label">' + r.label + "</span>" +
                    '<span class="polygon-stat-value" style="' + (r.color ? "color:" + r.color + ";font-weight:600;" : "") + '">' + r.value + "</span>" +
                "</div>";
        });
        html += "</div>";

        document.getElementById("polygonStatsContent").innerHTML = html;
        document.getElementById("polygonStatsPanel").style.display = "block";
    }

    function hidePolygonStats() {
        document.getElementById("polygonStatsPanel").style.display = "none";
        clearHighlight();
    }

    document.getElementById("btnCloseStats")?.addEventListener("click", hidePolygonStats);


    // ================================================================
    // 14. LOAD DATA TITIK
    // ================================================================

    function loadTitik() {
        airLayer.clearLayers();
        hotelLayer.clearLayers();
        makanLayer.clearLayers();
        jasaLayer.clearLayers();
        pendudukLayer.clearLayers();
        reservoirLayer.clearLayers();
        pipaLayer.clearLayers();

        // Sumber Air
        fetch("/api/sumber-air-geojson/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var c = 0;
                L.geoJSON(data, {
                    pointToLayer: function (f, ll) {
                        c++;
                        return L.marker(ll, { icon: iconAir }).addTo(airLayer);
                    },
                    onEachFeature: function (f, l) {
                        var p = f.properties;
                        l.bindPopup(makePopup('#2563EB', '💧 Sumber Air', p.nama, [
                            { label: 'Jenis',   value: p.jenis_sumber },
                            { label: 'Kondisi', value: p.kondisi },
                            { label: 'Debit',   value: p.debit ? p.debit + ' L/det' : null }
                        ]));
                    }
                });
                document.getElementById("countAir").textContent = c;
            })
            .catch(function () { console.warn("Sumber air layer gagal dimuat."); });

        // Fasilitas (Hotel, Resto, Jasa)
        var JENIS_LABEL = { hotel: 'Hotel', resto: 'Restoran', homestay: 'Homestay', jasa: 'Jasa' };
        fetch("/api/fasilitas-geojson/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var hotel = 0, resto = 0, jasa = 0;
                L.geoJSON(data, {
                    pointToLayer: function (f, ll) {
                        if (f.properties.jenis === "hotel") { hotel++; return L.marker(ll, { icon: iconHotel }).addTo(hotelLayer); }
                        if (f.properties.jenis === "resto") { resto++; return L.marker(ll, { icon: iconMakan }).addTo(makanLayer); }
                        if (f.properties.jenis === "jasa")  { jasa++;  return L.marker(ll, { icon: iconJasa  }).addTo(jasaLayer);  }
                    },
                    onEachFeature: function (f, l) {
                        var p = f.properties;
                        var jenis = p.jenis;
                        var accent = jenis === 'hotel' ? '#EA580C' : jenis === 'resto' ? '#CA8A04' : '#7C3AED';
                        var icon   = jenis === 'hotel' ? '🏨 Hotel' : jenis === 'resto' ? '🍽️ Tempat Makan' : '🔧 Jasa';
                        l.bindPopup(makePopup(accent, icon, p.nama, [
                            { label: 'Kategori',  value: JENIS_LABEL[p.jenis] || p.jenis },
                            { label: 'Kamar',     value: p.kamar    ? p.kamar + ' kamar'  : null },
                            { label: 'Kapasitas', value: p.kapasitas ? p.kapasitas + ' orang' : null }
                        ]));
                    }
                });
                document.getElementById("countHotel").textContent = hotel;
                document.getElementById("countMakan").textContent = resto;
                document.getElementById("countJasa").textContent  = jasa;
            })
            .catch(function () { console.warn("Fasilitas layer gagal dimuat."); });

        // Permukiman — gunakan ikon rumah, bukan circleMarker
        fetch("/api/permukiman-geojson/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var tot = 0;
                L.geoJSON(data, {
                    pointToLayer: function (f, ll) {
                        tot += f.properties.jumlah_penduduk || 0;
                        return L.marker(ll, { icon: iconPermukiman }).addTo(pendudukLayer);
                    },
                    onEachFeature: function (f, l) {
                        var p = f.properties;
                        l.bindPopup(makePopup('#8e44ad', '🏠 Permukiman', p.nama_dusun, [
                            { label: 'Jumlah KK',      value: p.jumlah_kk       ? p.jumlah_kk + ' KK'      : null },
                            { label: 'Jumlah Penduduk', value: p.jumlah_penduduk ? p.jumlah_penduduk + ' jiwa' : null }
                        ]));
                    }
                });
                document.getElementById("totalPenduduk").textContent = tot;
            })
            .catch(function () { console.warn("Permukiman layer gagal dimuat."); });

        // Reservoir / Tandon Air
        fetch("/api/reservoir-geojson/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var c = 0;
                L.geoJSON(data, {
                    pointToLayer: function (f, ll) {
                        c++;
                        return L.marker(ll, { icon: iconReservoir }).addTo(reservoirLayer);
                    },
                    onEachFeature: function (f, l) {
                        var p = f.properties;
                        l.bindPopup(makePopup('#0891B2', '🏗️ Tandon Air', p.nama, [
                            { label: 'Kapasitas', value: p.kapasitas_m3 ? p.kapasitas_m3 + ' m³' : null },
                            { label: 'Elevasi',   value: p.elevasi      ? p.elevasi + ' m dpl'    : null }
                        ]));
                    }
                });
                document.getElementById("countReservoir").textContent = c;
            })
            .catch(function () { console.warn("Reservoir layer gagal dimuat."); });

        // Jaringan Pipa
        fetch("/api/jaringan-pipa-geojson/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                L.geoJSON(data, {
                    style: { color: "#F59E0B", weight: 3, opacity: 0.85 },
                    onEachFeature: function (f, l) {
                        var p = f.properties;
                        l.bindPopup(makePopup('#D97706', '🔗 Jaringan Pipa', p.nama, [
                            { label: 'Diameter', value: p.diameter_mm ? p.diameter_mm + ' mm' : null },
                            { label: 'Kondisi',  value: p.kondisi }
                        ]));
                    }
                }).addTo(pipaLayer);
            })
            .catch(function () { console.warn("Pipa layer gagal dimuat."); });
    }


    // ================================================================
    // 15. LOAD POLYGON LAYERS
    // ================================================================

    function loadGeoJSON() {
        if (adminLayer) map.removeLayer(adminLayer);

        fetch("/static/data/BatasDesa.geojson")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                adminLayer = L.geoJSON(data, {
                    style: function (f) {
                        var nama       = f.properties.wadmkd || f.properties.NAMOBJ || f.properties.nama || "";
                        var isWonotoro = nama.toLowerCase().includes("wonotoro");
                        return {
                            color:       isWonotoro ? "#e74c3c" : "#2c3e50",
                            weight:      isWonotoro ? 2.5       : 1.5,
                            fillColor:   isWonotoro ? "#e74c3c" : "#2c3e50",
                            fillOpacity: isWonotoro ? 0.08      : 0.02,
                            dashArray:   isWonotoro ? null      : "4,4"
                        };
                    },
                    onEachFeature: function (f, l) {
                        var p    = f.properties;
                        var nama = p.wadmkd || p.namobj || "-";
                        l.on("click", function () {
                            showPolygonStats("Desa: " + nama, [
                                { label: "Desa",      value: nama             },
                                { label: "Kecamatan", value: p.wadmkc || "-"  },
                                { label: "Kabupaten", value: p.wadmkk || "-"  },
                                { label: "Luas",      value: p.luas ? p.luas.toFixed(2) + " ha" : "-" }
                            ]);
                        });
                    }
                });
                if (document.getElementById("chkAdminGab").checked) adminLayer.addTo(map);
            })
            .catch(function () { console.warn("BatasDesa layer gagal dimuat."); });
    }

    // Sungai.geojson — dibuat lazy: hanya dimuat saat checkbox diaktifkan (hemat 463 KB)


    // ================================================================
    // 16. CHECKBOX LAYER TOGGLES
    // ================================================================

    function toggleLayer(id, layer) {
        document.getElementById(id)?.addEventListener("change", function (e) {
            e.target.checked ? map.addLayer(layer) : map.removeLayer(layer);
        });
    }

    toggleLayer("chkAir",        airLayer);
    toggleLayer("chkHotel",      hotelLayer);
    toggleLayer("chkMakan",      makanLayer);
    toggleLayer("chkJasa",       jasaLayer);
    toggleLayer("chkPermukiman", pendudukLayer);
    toggleLayer("chkReservoir",  reservoirLayer);
    toggleLayer("chkPipa",       pipaLayer);

    document.getElementById("chkAdminGab")?.addEventListener("change", function (e) {
        if (!adminLayer) return;
        e.target.checked ? map.addLayer(adminLayer) : map.removeLayer(adminLayer);
    });

    document.getElementById("chkSungaiVektor")?.addEventListener("change", function (e) {
        if (!sungaiVektorLayer) {
            if (!e.target.checked) return;
            showNotif("Memuat", "Layer sungai sedang dimuat...", "warning");
            fetch("/static/data/Sungai.geojson")
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    sungaiVektorLayer = L.geoJSON(data, {
                        style: { color: "#2980b9", weight: 2, opacity: 0.85 }
                    });
                    map.addLayer(sungaiVektorLayer);
                })
                .catch(function () { showNotif("Gagal", "Layer sungai gagal dimuat.", "error"); });
            return;
        }
        e.target.checked ? map.addLayer(sungaiVektorLayer) : map.removeLayer(sungaiVektorLayer);
    });

    document.getElementById("chkPotensiAirTanah")?.addEventListener("change", function (e) {
        if (!potensiAirTanahLayer) {
            if (!e.target.checked) return;
            showNotif("Memuat", "Layer potensi air tanah sedang dimuat...", "warning");
            loadPotensiAirTanah(true);  // muat + langsung tampilkan di peta
            return;
        }
        if (e.target.checked) {
            map.addLayer(potensiAirTanahLayer);
        } else {
            map.removeLayer(potensiAirTanahLayer);
            tooltipPotensi.style.display = "none";
            mouseOnPotensi = false;
        }
    });

    document.getElementById("chkDebitPuncak")?.addEventListener("change", function (e) {
        var panel = document.getElementById("debitBulanPanel");
        if (panel) panel.style.display = e.target.checked ? "block" : "none";
        if (!e.target.checked) {
            setDebitBulan(null);
            var sel = document.getElementById("selectDebitBulan");
            if (sel) sel.value = "";
        }
    });

    document.getElementById("selectDebitBulan")?.addEventListener("change", function () {
        setDebitBulan(this.value || null);
    });


    // ================================================================
    // 17. TOGGLE PANELS & MODAL
    // ================================================================

    document.getElementById("btnLayer")?.addEventListener("click", function () {
        var p = document.getElementById("layerPanel");
        p.style.display = p.style.display === "block" ? "none" : "block";
    });

    document.getElementById("btnInputToggle")?.addEventListener("click", function () {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur input data hanya tersedia untuk Admin.", "error"); return; }
        var p = document.getElementById("inputChoicePanel");
        p.style.display = p.style.display === "block" ? "none" : "block";
    });

    document.getElementById("btnInput")?.addEventListener("click", function () {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur input data hanya tersedia untuk Admin.", "error"); return; }
        document.getElementById("modalInput").style.display = "flex";
    });

    document.getElementById("btnUploadSHP")?.addEventListener("click", function () {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur upload data hanya tersedia untuk Admin.", "error"); return; }
        document.getElementById("modalSHP").style.display = "flex";
    });

    document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
        overlay.addEventListener("click", function (e) {
            if (e.target === this) this.style.display = "none";
        });
    });


    // ================================================================
    // 18. DYNAMIC INPUT FIELDS
    // ================================================================

    document.getElementById("jenisData")?.addEventListener("change", function () {
        var d = document.getElementById("dynamicFields");
        d.innerHTML = "";

        function field(label, id, type, ph, extra) {
            return '<div class="auth-field"><label>' + label + '</label>' +
                   '<input type="' + (type || "text") + '" id="' + id + '" placeholder="' + ph + '" ' + (extra || "") + '></div>';
        }
        function sel(label, id, opts) {
            var h = '<div class="auth-field"><label>' + label + '</label>' +
                    '<select id="' + id + '" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:14px;">';
            opts.forEach(function (o) { h += '<option value="' + o[0] + '">' + o[1] + "</option>"; });
            return h + "</select></div>";
        }

        if (this.value === "air") {
            d.innerHTML =
                field("Nama Sumber Air", "namaData", "text", "Nama sumber air") +
                sel("Jenis Sumber", "jenisSumber", [
                    ["", "-- Pilih --"], ["Mata Air", "Mata Air"],
                    ["Sumur Bor", "Sumur Bor"], ["Sungai", "Sungai"]
                ]) +
                field("Ketersediaan Air (L/detik)", "debit", "number", "0", "step='any'");
        }
        if (this.value === "hotel") {
            d.innerHTML =
                field("Nama Hotel", "namaData", "text", "Nama hotel") +
                field("Jumlah Kamar", "kamar", "number", "0");
        }
        if (this.value === "makan") {
            d.innerHTML =
                field("Nama Tempat Makan", "namaData", "text", "Nama tempat makan") +
                field("Kapasitas Kursi", "kapasitas", "number", "0");
        }
        if (this.value === "jasa") {
            d.innerHTML =
                field("Nama Jasa", "namaData", "text", "Nama jasa") +
                field("Kapasitas", "kapasitas", "number", "0");
        }
        if (this.value === "penduduk") {
            d.innerHTML =
                field("Nama Dusun", "namaData", "text", "Nama dusun") +
                field("Jumlah KK", "jumlahKK", "number", "0") +
                field("Jumlah Penduduk", "jumlahPenduduk", "number", "0") +
                sel("Kategori", "kategoriPelanggan", [
                    ["", "-- Pilih --"], ["rumah_tangga", "Rumah Tangga"],
                    ["homestay", "Homestay"], ["warung", "Warung"], ["fasum", "Fasilitas Umum"]
                ]);
        }
        if (this.value === "reservoir") {
            d.innerHTML =
                field("Nama Tandon Air", "namaData", "text", "Nama tandon air") +
                field("Kapasitas (m³)", "kapasitasM3", "number", "0", "step='any'") +
                field("Elevasi (m)", "elevasi", "number", "0", "step='any'");
        }
    });


    // ================================================================
    // 19. SIMPAN DATA
    // ================================================================

    document.getElementById("btnSimpan")?.addEventListener("click", function () {
        if (!IS_ADMIN) return;

        var jenis = document.getElementById("jenisData").value;
        var lat   = parseFloat(document.getElementById("lat").value);
        var lng   = parseFloat(document.getElementById("lng").value);
        var nama  = document.getElementById("namaData")?.value?.trim();

        if (!jenis)            { showNotif("Validasi", "Pilih jenis data terlebih dahulu.", "warning"); return; }
        if (!nama)             { showNotif("Validasi", "Nama tidak boleh kosong.", "warning"); return; }
        if (isNaN(lat) || isNaN(lng)) { showNotif("Koordinat Belum Diisi", "Klik pada peta atau isi koordinat secara manual.", "warning"); return; }

        var url     = "";
        var payload = {};

        if (jenis === "air") {
            var debit = document.getElementById("debit")?.value;
            if (!debit || debit <= 0) { showNotif("Validasi", "Ketersediaan air harus diisi.", "warning"); return; }
            url     = "/api/create-sumber-air/";
            payload = { nama, debit, jenis_sumber: document.getElementById("jenisSumber")?.value || "", lat, lng };
        }
        if (jenis === "hotel")    { url = "/api/create-fasilitas/";  payload = { nama, jenis: "hotel", kamar:    document.getElementById("kamar")?.value    || 0, lat, lng }; }
        if (jenis === "makan")    { url = "/api/create-fasilitas/";  payload = { nama, jenis: "resto", kapasitas: document.getElementById("kapasitas")?.value || 0, lat, lng }; }
        if (jenis === "jasa")     { url = "/api/create-fasilitas/";  payload = { nama, jenis: "jasa",  kapasitas: document.getElementById("kapasitas")?.value || 0, lat, lng }; }
        if (jenis === "penduduk") { url = "/api/create-permukiman/"; payload = { nama, jumlah_kk: document.getElementById("jumlahKK")?.value || 0, jumlah_penduduk: document.getElementById("jumlahPenduduk")?.value || 0, lat, lng }; }
        if (jenis === "reservoir"){ url = "/api/create-reservoir/";  payload = { nama, kapasitas_m3: document.getElementById("kapasitasM3")?.value || 0, elevasi: document.getElementById("elevasi")?.value || null, lat, lng }; }

        if (!url) return;

        fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken(),
            },
            body: JSON.stringify(payload)
        })
        .then(function (r) { return r.json(); })
        .then(function (d) {
            showNotif("Berhasil", d.message || "Data berhasil disimpan.", "success");
            document.getElementById("modalInput").style.display = "none";
            loadTitik();
            loadGeoJSON();
        })
        .catch(function () { showNotif("Gagal", "Terjadi kesalahan saat menyimpan data.", "error"); });
    });


    // ================================================================
    // 20. UPLOAD SHAPEFILE
    // ================================================================

    document.getElementById("btnUploadSHPSubmit")?.addEventListener("click", function () {
        if (!IS_ADMIN) return;

        var target   = document.getElementById("shpTarget").value;
        var shpFile  = document.getElementById("fileShp").files[0];
        var shxFile  = document.getElementById("fileShx").files[0];
        var dbfFile  = document.getElementById("fileDbf").files[0];
        var prjFile  = document.getElementById("filePrj").files[0];
        var statusEl = document.getElementById("shpUploadStatus");

        if (!target)                    { showNotif("Validasi", "Pilih target dataset terlebih dahulu.", "warning"); return; }
        if (!shpFile || !shxFile || !dbfFile) { showNotif("File Kurang", "Upload file .shp, .shx, dan .dbf (minimal).", "warning"); return; }

        var formData = new FormData();
        formData.append("target", target);
        formData.append("shp", shpFile);
        formData.append("shx", shxFile);
        formData.append("dbf", dbfFile);
        if (prjFile) formData.append("prj", prjFile);

        statusEl.innerHTML = '<span style="color:#e67e22;">Mengupload dan memproses...</span>';
        this.disabled = true;
        var btn = this;

        fetch("/api/upload-shp/", { method: "POST", credentials: "include", headers: { "X-CSRFToken": getCsrfToken() }, body: formData })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                btn.disabled = false;
                if (data.message) {
                    statusEl.innerHTML = '<span style="color:#27ae60;">' + data.message + "</span>";
                    loadTitik();
                    loadGeoJSON();
                    setTimeout(function () {
                        document.getElementById("modalSHP").style.display = "none";
                        statusEl.innerHTML = "";
                    }, 2000);
                } else {
                    statusEl.innerHTML = '<span style="color:#e74c3c;">Error: ' + data.error + "</span>";
                }
            })
            .catch(function () {
                btn.disabled = false;
                statusEl.innerHTML = '<span style="color:#e74c3c;">Gagal mengupload file</span>';
            });
    });


    // ================================================================
    // 21. GAUGE CHART NERACA AIR
    // ================================================================

    function renderChart(supply, demand, apiPersen) {
        var CX = 130, CY = 130, R = 100, SA = Math.PI;
        var svg = document.getElementById("gaugeSVG");
        if (!svg) return;

        // Use server-provided persen to match status label exactly.
        // Fall back to local calculation only if not provided.
        var persen = (apiPersen !== undefined)
            ? apiPersen
            : (supply > 0 ? (demand / supply) * 100 : 0);

        // Cap gauge fill arc at 100% visually, but use real persen for color/label
        var displayPct = Math.min(persen, 100);

        function polar(a, r)      { return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
        function arcPath(sA, eA, r) {
            var s = polar(sA, r), e = polar(eA, r);
            var large = (eA - sA) > Math.PI ? 1 : 0;
            return "M " + s[0] + " " + s[1] + " A " + r + " " + r + " 0 " + large + " 1 " + e[0] + " " + e[1];
        }

        var color     = getStatusColor(persen);
        var fillAngle = SA + (displayPct / 100) * Math.PI;

        svg.querySelector("#arcBg").setAttribute("d",            arcPath(SA, 2 * Math.PI, R));
        svg.querySelector("#arcBg").setAttribute("stroke",       "rgba(255,255,255,.08)");
        svg.querySelector("#arcBg").setAttribute("stroke-width", "14");

        svg.querySelector("#arcFill").setAttribute("d",            arcPath(SA, fillAngle, R));
        svg.querySelector("#arcFill").setAttribute("stroke",       color);
        svg.querySelector("#arcFill").setAttribute("stroke-width", "14");

        var tip    = polar(fillAngle, R - 20);
        var needle = svg.querySelector("#gaugeNeedle");
        needle.setAttribute("x2",     tip[0]);
        needle.setAttribute("y2",     tip[1]);
        needle.setAttribute("stroke", color);

        svg.querySelector("#needleHub").setAttribute("fill", color);
        svg.querySelector("#pctText").textContent = displayPct.toFixed(1) + "%";
        svg.querySelector("#pctText").setAttribute("fill", color);
        svg.querySelector("#statusText").textContent = getStatusLabel(persen);

        var sisa = supply - demand;
        var cs   = document.getElementById("cardSupply");
        var cd   = document.getElementById("cardDemand");
        var cr   = document.getElementById("cardSisa");

        if (cs) cs.textContent = supply.toLocaleString("id-ID");
        if (cd) cd.textContent = demand.toLocaleString("id-ID");
        if (cr) {
            cr.textContent = (sisa < 0 ? '' : '') + sisa.toLocaleString("id-ID");
            cr.style.color = sisa >= 0 ? color : '#F87171';
        }
    }

    function loadDebit() {
        fetch("/api/informasi-debit/")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var persen = data.pemanfaatan_persen;
                document.getElementById("debitSupply").textContent  = data.ketersediaan_m3.toLocaleString('id-ID');
                document.getElementById("debitDemand").textContent  = data.kebutuhan_m3.toLocaleString('id-ID');
                document.getElementById("statusLabel").textContent  = getStatusLabel(persen);
                document.getElementById("statusLabel").style.color  = getStatusColor(persen);
                document.getElementById("statusPersen").textContent = Math.min(Math.round(persen), 100) + "% terpakai";
                document.getElementById("statusDot").style.background = getStatusColor(persen);
                document.getElementById("statusBar").style.background = getStatusBg(persen);
                renderChart(data.ketersediaan_m3, data.kebutuhan_m3, persen);
            })
            .catch(function () { console.warn("Informasi debit gagal dimuat."); });
    }

    document.getElementById("btnSimulasi")?.addEventListener("click", function () {
        var hotel     = document.getElementById("simHotel")?.value     || 0;
        var penduduk  = document.getElementById("simPenduduk")?.value  || 0;
        var resto     = document.getElementById("simResto")?.value     || 0;
        var pertanian = document.getElementById("simPertanian")?.value || 0;

        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Menghitung...';

        fetch("/api/informasi-debit/?hotel=" + hotel + "&penduduk=" + penduduk + "&resto=" + resto + "&pertanian=" + pertanian)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                btn.disabled = false;
                btn.textContent = '⚡ Hitung Simulasi';
                var p = data.pemanfaatan_persen;
                // Update Ketersediaan Air panel
                document.getElementById("debitSupply").textContent  = data.ketersediaan_m3.toLocaleString('id-ID');
                document.getElementById("debitDemand").textContent  = data.kebutuhan_m3.toLocaleString('id-ID');
                document.getElementById("statusLabel").textContent  = getStatusLabel(p);
                document.getElementById("statusLabel").style.color  = getStatusColor(p);
                document.getElementById("statusPersen").textContent = Math.min(Math.round(p), 100) + "% terpakai";
                document.getElementById("statusDot").style.background = getStatusColor(p);
                document.getElementById("statusBar").style.background = getStatusBg(p);
                renderChart(data.ketersediaan_m3, data.kebutuhan_m3, p);

                // Show inline result in simulasi panel
                var resultEl = document.getElementById('simResult');
                if (resultEl) {
                    resultEl.style.display = 'block';
                    var sisa = data.selisih_m3;
                    document.getElementById('simDemandVal').textContent = data.kebutuhan_m3.toLocaleString('id-ID') + ' m³/hari';
                    document.getElementById('simSupplyVal').textContent = data.ketersediaan_m3.toLocaleString('id-ID') + ' m³/hari';
                    var sisaEl = document.getElementById('simSisaVal');
                    sisaEl.textContent = (sisa >= 0 ? '+' : '') + sisa.toLocaleString('id-ID') + ' m³/hari';
                    sisaEl.style.color = sisa >= 0 ? '#4ADE80' : '#F87171';
                    var badge = document.getElementById('simStatusBadge');
                    var statusColors = { AMAN: { bg:'rgba(34,197,94,.15)', color:'#4ADE80', border:'rgba(34,197,94,.3)' },
                                         WASPADA: { bg:'rgba(245,158,11,.15)', color:'#FCD34D', border:'rgba(245,158,11,.3)' },
                                         KRITIS:  { bg:'rgba(239,68,68,.15)',  color:'#F87171', border:'rgba(239,68,68,.3)' } };
                    var sc = statusColors[data.status] || statusColors.AMAN;
                    badge.textContent = data.status;
                    badge.style.cssText = 'display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:.8px; background:' + sc.bg + '; color:' + sc.color + '; border:1px solid ' + sc.border + ';';
                }
                // Force-sync hero card in case status label didn't change
                if (window.aquaSyncStatus) window.aquaSyncStatus();
            })
            .catch(function () {
                btn.disabled = false;
                btn.textContent = '⚡ Hitung Simulasi';
                console.warn("Simulasi debit gagal.");
            });
    });


    // ================================================================
    // 22. PENGUKURAN JARAK
    // ================================================================

    document.querySelectorAll("input[name='mode']").forEach(function (r) {
        r.addEventListener("change", function () {
            document.getElementById("manualInput").style.display = this.value === "manual" ? "block" : "none";
        });
    });

    document.getElementById("btnDistance")?.addEventListener("click", function () {
        distanceActive = !distanceActive;
        document.getElementById("distancePanel").style.display = distanceActive ? "block" : "none";
        if (!distanceActive) resetDistance();
    });

    document.getElementById("btnHitungManual")?.addEventListener("click", function () {
        var lat1 = parseFloat(document.getElementById("lat1").value);
        var lng1 = parseFloat(document.getElementById("lng1").value);
        var lat2 = parseFloat(document.getElementById("lat2").value);
        var lng2 = parseFloat(document.getElementById("lng2").value);

        if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
            showNotif("Validasi", "Isi semua koordinat terlebih dahulu.", "warning");
            return;
        }

        var a = L.latLng(lat1, lng1);
        var b = L.latLng(lat2, lng2);
        var j = map.distance(a, b);

        document.getElementById("distanceResult").innerHTML =
            "Jarak: " + j.toFixed(2) + " m (" + (j / 1000).toFixed(3) + " km)";

        if (garisJarak) map.removeLayer(garisJarak);
        garisJarak = L.polyline([a, b], { color: "red", weight: 3 }).addTo(map);
    });

    function resetDistance() {
        titikKlik = [];
        if (garisJarak) { map.removeLayer(garisJarak); garisJarak = null; }
        distanceMarkers.forEach(function (m) { map.removeLayer(m); });
        distanceMarkers = [];
        var r = document.getElementById("distanceResult");
        if (r) r.innerHTML = "";
    }


    // ================================================================
    // 23. KLIK PETA — KOORDINAT & UTM
    // ================================================================

    map.on("click", function (e) {
        // Mode pengukuran jarak
        if (distanceActive) {
            if (titikKlik.length === 2) resetDistance();
            titikKlik.push(e.latlng);
            var m = L.circleMarker(e.latlng, { radius: 6, color: "red", fillColor: "red", fillOpacity: 1 }).addTo(map);
            distanceMarkers.push(m);
            if (titikKlik.length === 2) {
                var j = map.distance(titikKlik[0], titikKlik[1]);
                document.getElementById("distanceResult").innerHTML =
                    "Jarak: " + j.toFixed(2) + " m (" + (j / 1000).toFixed(3) + " km)";
                garisJarak = L.polyline(titikKlik, { color: "red", weight: 3 }).addTo(map);
            }
            return;
        }

        // Tampilkan koordinat + UTM
        var lat  = e.latlng.lat;
        var lng  = e.latlng.lng;
        var latR = lat * Math.PI / 180;
        var lngR = lng * Math.PI / 180;

        var zone = 49, k0 = 0.9996, a = 6378137.0, e2 = 0.00669438;
        var lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
        var N    = a / Math.sqrt(1 - e2 * Math.sin(latR) * Math.sin(latR));
        var T    = Math.tan(latR) * Math.tan(latR);
        var C    = (e2 / (1 - e2)) * Math.cos(latR) * Math.cos(latR);
        var A    = Math.cos(latR) * (lngR - lon0);
        var M    = a * (
            (1 - e2 / 4 - 3 * e2 * e2 / 64) * latR -
            (3 * e2 / 8 + 3 * e2 * e2 / 32) * Math.sin(2 * latR) +
            (15 * e2 * e2 / 256) * Math.sin(4 * latR)
        );

        var easting  = k0 * N * (A + (1 - T + C) * A * A * A / 6) + 500000;
        var northing = k0 * (M + N * Math.tan(latR) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24));
        if (lat < 0) northing += 10000000;

        // Debit Puncak section — always shown when a month is active
        var debitHtml = "";
        var debitVal  = getDebitRasterValue(lat, lng);
        if (activeDebitBulan) {
            var dLabel = BULAN_LABEL[BULAN.indexOf(activeDebitBulan)];
            if (debitVal !== null) {
                var dKelas =
                    debitVal <= 5  ? 1 : debitVal <= 10 ? 2 : debitVal <= 15 ? 3 :
                    debitVal <= 21 ? 4 : debitVal <= 26 ? 5 : debitVal <= 31 ? 6 :
                    debitVal <= 36 ? 7 : 8;
                var dWarna = getDebitColor(dKelas);
                debitHtml =
                    '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">' +
                        '<div style="font-weight:600;color:' + dWarna + ';font-size:11px;margin-bottom:4px;">🌊 Debit Puncak — ' + dLabel + '</div>' +
                        '<div><b>Nilai:</b> <span style="color:' + dWarna + ';font-weight:600;">' + debitVal.toFixed(2) + ' m³/s</span></div>' +
                    '</div>';
            } else {
                debitHtml =
                    '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">' +
                        '<div style="font-weight:600;color:#60A5FA;font-size:11px;margin-bottom:4px;">🌊 Debit Puncak — ' + dLabel + '</div>' +
                        '<div style="font-size:11px;color:#999;">Memuat nilai piksel...</div>' +
                    '</div>';
            }
        }

        L.popup().setLatLng(e.latlng).setContent(
            '<div style="font-size:13px;line-height:1.8;min-width:200px;">' +
                '<div style="font-weight:600;color:#1a5276;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px;">📍 Koordinat Titik</div>' +
                "<div><b>Lat:</b> " + lat.toFixed(6) + "</div>" +
                "<div><b>Lng:</b> " + lng.toFixed(6) + "</div>" +
                '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">' +
                    '<div style="font-weight:600;color:#666;font-size:11px;margin-bottom:4px;">UTM Zone 49S</div>' +
                    "<div><b>E:</b> " + easting.toFixed(2)  + " m</div>" +
                    "<div><b>N:</b> " + northing.toFixed(2) + " m</div>" +
                "</div>" +
                debitHtml +
            "</div>"
        ).openOn(map);

        if (IS_ADMIN) {
            var latI = document.getElementById("lat");
            var lngI = document.getElementById("lng");
            if (latI && lngI) { latI.value = lat.toFixed(6); lngI.value = lng.toFixed(6); }
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng).addTo(map);
        }
    });


    // ================================================================
    // 25. PENCARIAN LOKASI
    // ================================================================

    var searchMarker = null;

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var input = document.getElementById("mapSearchInput");
        if (!input || document.activeElement !== input) return;

        var query = input.value.trim();
        if (!query) return;

        fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(query) + "&limit=1")
            .then(function (r) { return r.json(); })
            .then(function (results) {
                if (results.length === 0) { showNotif("Tidak Ditemukan", "Lokasi tidak ditemukan.", "warning"); return; }
                var r = results[0];
                map.setView([parseFloat(r.lat), parseFloat(r.lon)], 15);
                if (searchMarker) map.removeLayer(searchMarker);
                searchMarker = L.marker([parseFloat(r.lat), parseFloat(r.lon)])
                    .addTo(map)
                    .bindPopup("<b>" + r.display_name + "</b>")
                    .openPopup();
            })
            .catch(function () { showNotif("Gagal", "Gagal mencari lokasi.", "error"); });
    });


    // ================================================================
    // 26. EXPORT PETA
    // ================================================================

    document.addEventListener("click", function (e) {
        if (e.target.id === "btnPrintMap" || e.target.closest("#btnPrintMap")) {
            if (typeof html2canvas !== "undefined") {
                html2canvas(document.getElementById("map"), { useCORS: true, allowTaint: true })
                    .then(function (canvas) {
                        var link      = document.createElement("a");
                        link.download = "peta_wonotoro.png";
                        link.href     = canvas.toDataURL("image/png");
                        link.click();
                    });
            } else {
                window.print();
            }
        }
    });


    // ================================================================
    // 27. SIDEBAR COLLAPSE
    // ================================================================

    document.getElementById("btnHideSidebar")?.addEventListener("click", function () {
        document.getElementById("sidebar").classList.add("collapsed");
        document.getElementById("btnShowSidebar").classList.add("visible");
        // On desktop only: sidebar collapses horizontally so the search/export
        // controls need to shift left. The compass stays fixed top-right.
        // On mobile: sidebar collapses vertically; CSS handles control positioning
        if (window.innerWidth > 768) {
            var ctrl = document.querySelector(".map-ctrl-topleft");
            if (ctrl) ctrl.style.left = "14px";
        }
    });

    document.getElementById("btnShowSidebar")?.addEventListener("click", function () {
        document.getElementById("sidebar").classList.remove("collapsed");
        this.classList.remove("visible");
        if (window.innerWidth > 768) {
            var ctrl = document.querySelector(".map-ctrl-topleft");
            if (ctrl) ctrl.style.left = "320px";
        }
    });


    // ================================================================
    // 28. ZOOM MANUAL
    // ================================================================

    document.getElementById("btnZoomIn")?.addEventListener("click",  function () { map.zoomIn();  });
    document.getElementById("btnZoomOut")?.addEventListener("click", function () { map.zoomOut(); });


    // ================================================================
    // 29. INITIAL LOAD
    // ================================================================

    loadTitik();
    loadGeoJSON();
    loadDebit();

    setTimeout(function () {
        try {
            var el = document.getElementById("mapLoading");
            if (el) el.style.display = "none";
        } catch (e) { /* ignore */ }
        window.dispatchEvent(new CustomEvent('aquavision:mapReady'));
    }, 2000);

    // P0.5: global JS error guard — catch uncaught errors from CDN scripts
    window.addEventListener("error", function (e) {
        // Suppress CDN-related errors silently so they don't break the app
        if (e && e.filename && (
            e.filename.indexOf("georaster") !== -1 ||
            e.filename.indexOf("driver")    !== -1 ||
            e.filename.indexOf("html2canvas") !== -1
        )) {
            console.warn("CDN script error suppressed:", e.message);
            e.preventDefault();
        }
    });

});