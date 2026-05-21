document.addEventListener("DOMContentLoaded", function () {

    // ============================================================
    // 1. INISIALISASI MAP — Zoom ke Desa Wonotoro
    // ============================================================
    const map = L.map("map").setView([-7.88, 113.00], 14);

    var basemaps = {
        "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
        "Satelit": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19, attribution: '&copy; Esri',
        }),
        "Topografi": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19, attribution: '&copy; Esri',
        }),
    };
    basemaps["OpenStreetMap"].addTo(map);
    L.control.layers(basemaps, null, { position: "topright", collapsed: true }).addTo(map);

    // ============================================================
    // NOTIFIKASI POPUP
    // ============================================================
    function showNotif(title, message, type) {
        var existing = document.getElementById("notifPopup");
        if (existing) existing.remove();
        var colors = {
            error:   { bg:"#fdedec", border:"#e74c3c", icon:"\u{1F6AB}" },
            success: { bg:"#e8f6f3", border:"#27ae60", icon:"\u2705" },
            warning: { bg:"#fef9e7", border:"#e67e22", icon:"\u26A0\uFE0F" },
        };
        var c = colors[type] || colors.warning;
        var div = document.createElement("div");
        div.id = "notifPopup";
        div.style.cssText = "position:fixed;top:80px;right:20px;z-index:9999;background:" + c.bg + ";border-left:4px solid " + c.border + ";padding:16px 20px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.15);max-width:360px;animation:slideIn 0.3s ease;font-family:inherit;";
        div.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:4px;">' + c.icon + ' ' + title + '</div>' +
                    '<div style="font-size:13px;color:#555;line-height:1.5;">' + message + '</div>' +
                '</div>' +
                '<button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;padding:0;width:auto;line-height:1;">\u2715</button>' +
            '</div>';
        document.body.appendChild(div);
        setTimeout(function() { if (div.parentElement) div.remove(); }, 5000);
    }

    // ============================================================
    // KOORDINAT + SKALA
    // ============================================================
    function updateScale() {
        var center = map.getCenter();
        var zoom = map.getZoom();
        var metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
        var scale = Math.round(metersPerPixel * 96 * 39.3701);
        var el = document.getElementById("scaleDisplay");
        if (el) {
            if (scale >= 1000000) el.textContent = "1 : " + (scale / 1000000).toFixed(1) + " jt";
            else if (scale >= 1000) el.textContent = "1 : " + (scale / 1000).toFixed(1) + " rb";
            else el.textContent = "1 : " + scale.toLocaleString("id-ID");
        }
    }
    map.on("mousemove", function(e) {
        var el = document.getElementById("coordDisplay");
        if (el) el.textContent = e.latlng.lat.toFixed(6) + ", " + e.latlng.lng.toFixed(6);
    });
    map.on("mouseout", function() {
        var el = document.getElementById("coordDisplay");
        if (el) el.textContent = "-";
    });
    map.on("zoomend", updateScale);
    map.on("moveend", updateScale);
    updateScale();

    // ============================================================
    // LAYER GROUPS
    // ============================================================
    var airLayer       = L.layerGroup().addTo(map);
    var hotelLayer     = L.layerGroup().addTo(map);
    var makanLayer     = L.layerGroup().addTo(map);
    var jasaLayer      = L.layerGroup().addTo(map);
    var pendudukLayer  = L.layerGroup().addTo(map);
    var reservoirLayer = L.layerGroup().addTo(map);
    var pipaLayer      = L.layerGroup().addTo(map);
    var sungaiLayer    = L.layerGroup();
    var debitPotLayer  = L.imageOverlay(
        "/static/data/Debit.png",
        [[-7.986586, 112.904783], [-7.701422, 113.261897]],
        { opacity: 0.6 }
    );

    var adminLayer     = null;
    var subDasLayer    = null;
    var catchmentLayer = null;
    var rechargeLayer  = null;
    var tempMarker     = null;
    var titikKlik      = [];
    var garisJarak     = null;
    var distanceActive = false;
    var distanceMarkers = [];
    var highlightedLayer = null;

    // ============================================================
    // ICONS
    // ============================================================
    var iconAir = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/728/728093.png", iconSize: [28,28] });
    var iconHotel = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/139/139899.png", iconSize: [28,28] });
    var iconMakan = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png", iconSize: [28,28] });
    var iconReservoir = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/2038/2038152.png", iconSize: [28,28] });
    var iconJasa = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/3067/3067451.png", iconSize: [26,26] });

    // ============================================================
    // STATUS COLORS
    // ============================================================
    function getStatusColor(p) { return p < 50 ? "#27ae60" : p < 80 ? "#e67e22" : "#e74c3c"; }
    function getStatusLabel(p) { return p < 50 ? "AMAN" : p < 80 ? "WASPADA" : "KRITIS"; }
    function getStatusBg(p)    { return p < 50 ? "#e8f6f3" : p < 80 ? "#fef9e7" : "#fdedec"; }

    // ============================================================
    // POLYGON HIGHLIGHT + STATS
    // ============================================================
    function clearHighlight() {
        if (highlightedLayer) { highlightedLayer.setStyle({ weight: 2, fillOpacity: 0.25 }); highlightedLayer = null; }
    }
    function highlightPolygon(layer) {
        clearHighlight();
        layer.setStyle({ weight: 4, fillOpacity: 0.5 });
        highlightedLayer = layer;
        layer.bringToFront();
    }
    function showPolygonStats(title, rows) {
        document.getElementById("polygonStatsTitle").textContent = title;
        var html = '<div class="polygon-stats-rows">';
        rows.forEach(function(r) {
            html += '<div class="polygon-stat-row"><span class="polygon-stat-label">' + r.label + '</span><span class="polygon-stat-value" style="' + (r.color ? 'color:'+r.color+';font-weight:600;' : '') + '">' + r.value + '</span></div>';
        });
        html += '</div>';
        document.getElementById("polygonStatsContent").innerHTML = html;
        document.getElementById("polygonStatsPanel").style.display = "block";
    }
    function hidePolygonStats() {
        document.getElementById("polygonStatsPanel").style.display = "none";
        clearHighlight();
    }
    document.getElementById("btnCloseStats")?.addEventListener("click", hidePolygonStats);

    // ============================================================
    // LOAD DATA TITIK
    // ============================================================
    function loadTitik() {
        airLayer.clearLayers(); hotelLayer.clearLayers(); makanLayer.clearLayers();
        jasaLayer.clearLayers(); pendudukLayer.clearLayers(); reservoirLayer.clearLayers();
        pipaLayer.clearLayers();

        fetch("/api/sumber-air-geojson/").then(function(r){return r.json();}).then(function(data) {
            var c = 0;
            L.geoJSON(data, {
                pointToLayer: function(f,ll) { c++; return L.marker(ll,{icon:iconAir}).addTo(airLayer); },
                onEachFeature: function(f,l) {
                    var p = f.properties;
                    l.bindPopup("<b>"+p.nama+"</b><br>"+(p.jenis_sumber ? "Jenis: "+p.jenis_sumber+"<br>" : "")+(p.kondisi ? "Kondisi: "+p.kondisi : ""));
                },
            });
            document.getElementById("countAir").textContent = c;
        });

        fetch("/api/fasilitas-geojson/").then(function(r){return r.json();}).then(function(data) {
            var hotel=0, resto=0, jasa=0;
            L.geoJSON(data, {
                pointToLayer: function(f,ll) {
                    if (f.properties.jenis==="hotel") { hotel++; return L.marker(ll,{icon:iconHotel}).addTo(hotelLayer); }
                    if (f.properties.jenis==="resto") { resto++; return L.marker(ll,{icon:iconMakan}).addTo(makanLayer); }
                    if (f.properties.jenis==="jasa") { jasa++; return L.marker(ll,{icon:iconJasa}).addTo(jasaLayer); }
                },
                onEachFeature: function(f,l) {
                    var p = f.properties;
                    l.bindPopup("<b>"+p.nama+"</b><br>Jenis: "+p.jenis+"<br>"+(p.kamar ? "Kamar: "+p.kamar+"<br>" : "")+(p.kapasitas ? "Kapasitas: "+p.kapasitas : ""));
                },
            });
            document.getElementById("countHotel").textContent = hotel;
            document.getElementById("countMakan").textContent = resto;
            document.getElementById("countJasa").textContent = jasa;
        });

        fetch("/api/permukiman-geojson/").then(function(r){return r.json();}).then(function(data) {
            var tot = 0;
            L.geoJSON(data, {
                pointToLayer: function(f,ll) { tot += f.properties.jumlah_penduduk||0; return L.circleMarker(ll,{radius:6,color:"#8e44ad",fillOpacity:0.8}).addTo(pendudukLayer); },
                onEachFeature: function(f,l) { var p=f.properties; l.bindPopup("<b>"+p.nama_dusun+"</b><br>KK: "+p.jumlah_kk+"<br>Penduduk: "+p.jumlah_penduduk); },
            });
            document.getElementById("totalPenduduk").textContent = tot;
        });

        fetch("/api/reservoir-geojson/").then(function(r){return r.json();}).then(function(data) {
            var c = 0;
            L.geoJSON(data, {
                pointToLayer: function(f,ll) { c++; return L.marker(ll,{icon:iconReservoir}).addTo(reservoirLayer); },
                onEachFeature: function(f,l) { var p=f.properties; l.bindPopup("<b>"+p.nama+"</b><br>Kapasitas: "+p.kapasitas_m3+" m\u00B3"); },
            });
            document.getElementById("countReservoir").textContent = c;
        });

        fetch("/api/jaringan-pipa-geojson/").then(function(r){return r.json();}).then(function(data) {
            var c = 0;
            L.geoJSON(data, {
                style: {color:"#e67e22",weight:3,opacity:0.8},
                onEachFeature: function(f,l) { c++; var p=f.properties; l.bindPopup("<b>"+p.nama+"</b><br>"+(p.diameter_mm?"Diameter: "+p.diameter_mm+" mm<br>":"")+(p.kondisi?"Kondisi: "+p.kondisi:"")); },
            }).addTo(pipaLayer);
        });
    }

    // ============================================================
    // LOAD POLYGON LAYERS
    // ============================================================
    function loadGeoJSON() {
        if (adminLayer) map.removeLayer(adminLayer);
        fetch("/api/administrasi-geojson/").then(function(r){return r.json();}).then(function(data) {
            adminLayer = L.geoJSON(data, {
                style: {color:"#2c3e50",weight:1.5,fillOpacity:0.03,dashArray:"4,4"},
                onEachFeature: function(f,l) {
                    var p = f.properties;
                    var nama = p.wadmkd||p.namobj||"-";
                    l.on("click", function() {
                        highlightPolygon(l);
                        showPolygonStats("Desa: "+nama, [
                            {label:"Desa",value:nama},
                            {label:"Kecamatan",value:p.wadmkc||"-"},
                            {label:"Kabupaten",value:p.wadmkk||"-"},
                            {label:"Luas",value:p.luas?p.luas.toFixed(2)+" ha":"-"},
                        ]);
                    });
                },
            });
            if (document.getElementById("chkAdminGab").checked) adminLayer.addTo(map);
        });

        if (catchmentLayer) map.removeLayer(catchmentLayer);
        fetch("/api/catchment-geojson/").then(function(r){return r.json();}).then(function(data) {
            catchmentLayer = L.geoJSON(data, {
                style: {color:"#2980b9",weight:2,fillColor:"#3498db",fillOpacity:0.15,dashArray:"5,5"},
                onEachFeature: function(f,l) {
                    var p = f.properties;
                    l.on("click", function() {
                        highlightPolygon(l);
                        showPolygonStats("Catchment: "+p.nama, [{label:"Nama",value:p.nama},{label:"Luas",value:(p.luas_ha||"-")+" ha"}]);
                    });
                },
            });
            if (document.getElementById("chkCatchment").checked) catchmentLayer.addTo(map);
        });

        if (rechargeLayer) map.removeLayer(rechargeLayer);
        fetch("/static/data/recharge_area.geojson").then(function(r){return r.json();}).then(function(data) {
            rechargeLayer = L.geoJSON(data, {
                style: function(f) {
                    var dn = f.properties.DN;
                    var fc = "#e74c3c";
                    if (dn === 2) fc = "#e67e22";
                    if (dn === 3) fc = "#f1c40f";
                    if (dn === 4) fc = "#27ae60";
                    return {color:"#7f5a00",weight:1,fillColor:fc,fillOpacity:0.35};
                },
                onEachFeature: function(f,l) {
                    var dn = f.properties.DN;
                    var label = "Rendah", c = "#e74c3c";
                    if (dn === 2) { label = "Sedang"; c = "#e67e22"; }
                    if (dn === 3) { label = "Tinggi"; c = "#f1c40f"; }
                    if (dn === 4) { label = "Sangat Tinggi"; c = "#27ae60"; }
                    l.on("click", function() {
                        highlightPolygon(l);
                        showPolygonStats("Recharge Area", [
                            {label:"Potensi Resapan",value:label,color:c},
                            {label:"Kelas (DN)",value:dn}
                        ]);
                    });
                },
            });
            if (document.getElementById("chkRecharge").checked) rechargeLayer.addTo(map);
        });
    }

    // ============================================================
    // CHECKBOX TOGGLES
    // ============================================================
    document.getElementById("chkAir")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(airLayer) : map.removeLayer(airLayer); });
    document.getElementById("chkHotel")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(hotelLayer) : map.removeLayer(hotelLayer); });
    document.getElementById("chkMakan")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(makanLayer) : map.removeLayer(makanLayer); });
    document.getElementById("chkJasa")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(jasaLayer) : map.removeLayer(jasaLayer); });
    document.getElementById("chkPermukiman")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(pendudukLayer) : map.removeLayer(pendudukLayer); });
    document.getElementById("chkReservoir")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(reservoirLayer) : map.removeLayer(reservoirLayer); });
    document.getElementById("chkPipa")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(pipaLayer) : map.removeLayer(pipaLayer); });
    document.getElementById("chkSungai")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(sungaiLayer) : map.removeLayer(sungaiLayer); });
    document.getElementById("chkDebitPot")?.addEventListener("change", function(e) { e.target.checked ? map.addLayer(debitPotLayer) : map.removeLayer(debitPotLayer); });
    document.getElementById("chkAdminGab")?.addEventListener("change", function(e) { if (!adminLayer) return; e.target.checked ? map.addLayer(adminLayer) : map.removeLayer(adminLayer); });
    document.getElementById("chkSubDAS")?.addEventListener("change", function(e) { if (!subDasLayer) return; e.target.checked ? map.addLayer(subDasLayer) : map.removeLayer(subDasLayer); });
    document.getElementById("chkCatchment")?.addEventListener("change", function(e) { if (!catchmentLayer) return; e.target.checked ? map.addLayer(catchmentLayer) : map.removeLayer(catchmentLayer); });
    document.getElementById("chkRecharge")?.addEventListener("change", function(e) { if (!rechargeLayer) return; e.target.checked ? map.addLayer(rechargeLayer) : map.removeLayer(rechargeLayer); });

    // ============================================================
    // TOGGLE PANELS
    // ============================================================
    document.getElementById("btnLayer")?.addEventListener("click", function() {
        var p = document.getElementById("layerPanel");
        p.style.display = p.style.display==="block" ? "none" : "block";
    });
    document.getElementById("btnInputToggle")?.addEventListener("click", function() {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur input data hanya tersedia untuk Admin.", "error"); return; }
        var p = document.getElementById("inputChoicePanel");
        p.style.display = p.style.display==="block" ? "none" : "block";
    });
    document.getElementById("btnInput")?.addEventListener("click", function() {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur input data hanya tersedia untuk Admin.", "error"); return; }
        document.getElementById("modalInput").style.display = "flex";
    });
    document.getElementById("btnUploadSHP")?.addEventListener("click", function() {
        if (!IS_ADMIN) { showNotif("Akses Ditolak", "Fitur upload data hanya tersedia untuk Admin.", "error"); return; }
        document.getElementById("modalSHP").style.display = "flex";
    });
    document.querySelectorAll(".modal-overlay").forEach(function(overlay) {
        overlay.addEventListener("click", function(e) { if (e.target === this) this.style.display = "none"; });
    });

    // ============================================================
    // DYNAMIC INPUT FIELDS
    // ============================================================
    document.getElementById("jenisData")?.addEventListener("change", function() {
        var d = document.getElementById("dynamicFields");
        d.innerHTML = "";
        function field(label, id, type, ph, extra) {
            return '<div class="auth-field"><label>'+label+'</label><input type="'+(type||'text')+'" id="'+id+'" placeholder="'+ph+'" '+(extra||'')+'></div>';
        }
        function sel(label, id, opts) {
            var h = '<div class="auth-field"><label>'+label+'</label><select id="'+id+'" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:14px;">';
            opts.forEach(function(o) { h += '<option value="'+o[0]+'">'+o[1]+'</option>'; });
            return h + '</select></div>';
        }
        if (this.value==="air") d.innerHTML = field("Nama Sumber Air","namaData","text","Nama sumber air")+sel("Jenis Sumber","jenisSumber",[["","-- Pilih --"],["Mata Air","Mata Air"],["Sumur Bor","Sumur Bor"],["Sungai","Sungai"]])+field("Debit (L/detik)","debit","number","0","step='any'");
        if (this.value==="hotel") d.innerHTML = field("Nama Hotel","namaData","text","Nama hotel")+field("Jumlah Kamar","kamar","number","0");
        if (this.value==="makan") d.innerHTML = field("Nama Tempat Makan","namaData","text","Nama tempat makan")+field("Kapasitas","kapasitas","number","0");
        if (this.value==="jasa") d.innerHTML = field("Nama Jasa","namaData","text","Nama jasa")+field("Kapasitas","kapasitas","number","0");
        if (this.value==="penduduk") d.innerHTML = field("Nama Dusun","namaData","text","Nama dusun")+field("Jumlah KK","jumlahKK","number","0")+field("Jumlah Penduduk","jumlahPenduduk","number","0")+sel("Kategori","kategoriPelanggan",[["","-- Pilih --"],["rumah_tangga","Rumah Tangga"],["homestay","Homestay"],["warung","Warung"],["fasum","Fasilitas Umum"]]);
        if (this.value==="reservoir") d.innerHTML = field("Nama Reservoir","namaData","text","Nama reservoir")+field("Kapasitas (m\u00B3)","kapasitasM3","number","0","step='any'")+field("Elevasi (m)","elevasi","number","0","step='any'");
    });

    // ============================================================
    // SIMPAN DATA
    // ============================================================
    document.getElementById("btnSimpan")?.addEventListener("click", function() {
        if (!IS_ADMIN) return;
        var jenis = document.getElementById("jenisData").value;
        var lat = parseFloat(document.getElementById("lat").value);
        var lng = parseFloat(document.getElementById("lng").value);
        var nama = document.getElementById("namaData")?.value?.trim();
        if (!jenis) { showNotif("Validasi", "Pilih jenis data terlebih dahulu.", "warning"); return; }
        if (!nama) { showNotif("Validasi", "Nama tidak boleh kosong.", "warning"); return; }
        if (isNaN(lat)||isNaN(lng)) { showNotif("Koordinat Belum Diisi", "Klik pada peta atau isi koordinat secara manual.", "warning"); return; }

        var url="", payload={};
        if (jenis==="air") {
            var debit = document.getElementById("debit")?.value;
            if (!debit || debit <= 0) { showNotif("Validasi", "Debit sumber air harus diisi.", "warning"); return; }
            url="/api/create-sumber-air/"; payload={nama:nama,debit:debit,jenis_sumber:document.getElementById("jenisSumber")?.value||"",lat:lat,lng:lng};
        }
        if (jenis==="hotel") { url="/api/create-fasilitas/"; payload={nama:nama,jenis:"hotel",kamar:document.getElementById("kamar")?.value||0,lat:lat,lng:lng}; }
        if (jenis==="makan") { url="/api/create-fasilitas/"; payload={nama:nama,jenis:"resto",kapasitas:document.getElementById("kapasitas")?.value||0,lat:lat,lng:lng}; }
        if (jenis==="jasa") { url="/api/create-fasilitas/"; payload={nama:nama,jenis:"jasa",kapasitas:document.getElementById("kapasitas")?.value||0,lat:lat,lng:lng}; }
        if (jenis==="penduduk") { url="/api/create-permukiman/"; payload={nama:nama,jumlah_kk:document.getElementById("jumlahKK")?.value||0,jumlah_penduduk:document.getElementById("jumlahPenduduk")?.value||0,lat:lat,lng:lng}; }
        if (jenis==="reservoir") { url="/api/create-reservoir/"; payload={nama:nama,kapasitas_m3:document.getElementById("kapasitasM3")?.value||0,elevasi:document.getElementById("elevasi")?.value||null,lat:lat,lng:lng}; }
        if (!url) return;

        fetch(url,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
        .then(function(r){return r.json();})
        .then(function(d){
            showNotif("Berhasil", d.message||"Data berhasil disimpan.", "success");
            document.getElementById("modalInput").style.display = "none";
            loadTitik(); loadGeoJSON();
        })
        .catch(function(){showNotif("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");});
    });

    // ============================================================
    // UPLOAD SHP
    // ============================================================
    document.getElementById("btnUploadSHPSubmit")?.addEventListener("click", function() {
        if (!IS_ADMIN) return;
        var target = document.getElementById("shpTarget").value;
        var shpFile = document.getElementById("fileShp").files[0];
        var shxFile = document.getElementById("fileShx").files[0];
        var dbfFile = document.getElementById("fileDbf").files[0];
        var prjFile = document.getElementById("filePrj").files[0];
        var statusEl = document.getElementById("shpUploadStatus");

        if (!target) { showNotif("Validasi", "Pilih target dataset terlebih dahulu.", "warning"); return; }
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

        fetch("/api/upload-shp/", {method:"POST",credentials:"include",body:formData})
        .then(function(r){return r.json();})
        .then(function(data) {
            btn.disabled = false;
            if (data.message) {
                statusEl.innerHTML = '<span style="color:#27ae60;">'+data.message+'</span>';
                loadTitik(); loadGeoJSON();
                setTimeout(function() { document.getElementById("modalSHP").style.display = "none"; statusEl.innerHTML = ""; }, 2000);
            } else {
                statusEl.innerHTML = '<span style="color:#e74c3c;">Error: '+data.error+'</span>';
            }
        })
        .catch(function() { btn.disabled = false; statusEl.innerHTML = '<span style="color:#e74c3c;">Gagal mengupload file</span>'; });
    });

    // ============================================================
    // GAUGE CHART
    // ============================================================
    function renderChart(supply, demand) {
        var CX = 130, CY = 130, R = 100;
        var START_ANGLE = Math.PI;
        var svg = document.getElementById("gaugeSVG");
        if (!svg) return;

        var persen = supply > 0 ? Math.min((demand / supply) * 100, 100) : 0;

        function polar(angle, r) { return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]; }
        function arcPath(startA, endA, r) {
            var s = polar(startA, r), e = polar(endA, r);
            var large = (endA - startA) > Math.PI ? 1 : 0;
            return "M "+s[0]+" "+s[1]+" A "+r+" "+r+" 0 "+large+" 1 "+e[0]+" "+e[1];
        }
        function getColor(p) { return p < 50 ? "#1D9E75" : p < 80 ? "#BA7517" : "#E24B4A"; }
        function getLabel(p) { return p < 50 ? "AMAN" : p < 80 ? "WASPADA" : "KRITIS"; }

        var color = getColor(persen);
        var fillAngle = START_ANGLE + (persen / 100) * Math.PI;

        svg.querySelector("#arcBg").setAttribute("d", arcPath(START_ANGLE, 2 * Math.PI, R));
        svg.querySelector("#arcBg").setAttribute("stroke", "#e8e8e8");
        svg.querySelector("#arcBg").setAttribute("stroke-width", "14");
        svg.querySelector("#arcFill").setAttribute("d", arcPath(START_ANGLE, fillAngle, R));
        svg.querySelector("#arcFill").setAttribute("stroke", color);
        svg.querySelector("#arcFill").setAttribute("stroke-width", "14");

        var tip = polar(fillAngle, R - 20);
        var needle = svg.querySelector("#gaugeNeedle");
        needle.setAttribute("x2", tip[0]); needle.setAttribute("y2", tip[1]); needle.setAttribute("stroke", color);
        svg.querySelector("#needleHub").setAttribute("fill", color);
        svg.querySelector("#pctText").textContent = persen.toFixed(1) + "%";
        svg.querySelector("#pctText").setAttribute("fill", color);
        svg.querySelector("#statusText").textContent = getLabel(persen);

        var sisa = Math.max(supply - demand, 0);
        var cs = document.getElementById("cardSupply"), cd = document.getElementById("cardDemand"), cr = document.getElementById("cardSisa");
        if (cs) cs.textContent = supply.toLocaleString("id-ID");
        if (cd) cd.textContent = demand.toLocaleString("id-ID");
        if (cr) { cr.textContent = sisa.toLocaleString("id-ID"); cr.style.color = color; }
    }

    // ============================================================
    // LOAD INFORMASI DEBIT
    // ============================================================
    function loadDebit() {
        fetch("/api/informasi-debit/").then(function(r){return r.json();}).then(function(data) {
            document.getElementById("debitSupply").textContent = data.ketersediaan_m3;
            document.getElementById("debitDemand").textContent = data.kebutuhan_m3;
            var persen = data.pemanfaatan_persen;
            var color = getStatusColor(persen), label = getStatusLabel(persen), bg = getStatusBg(persen);
            document.getElementById("statusLabel").textContent = label;
            document.getElementById("statusLabel").style.color = color;
            document.getElementById("statusPersen").textContent = persen + "% terpakai";
            document.getElementById("statusDot").style.background = color;
            document.getElementById("statusBar").style.background = bg;
            renderChart(data.ketersediaan_m3, data.kebutuhan_m3);
        });
    }

    document.getElementById("btnDebit")?.addEventListener("click", function() {
        var el = document.getElementById("debitBody");
        if (el && !el.classList.contains("open")) el.classList.add("open");
        el?.scrollIntoView({behavior:"smooth", block:"center"});
    });

    // ============================================================
    // SIMULASI
    // ============================================================
    document.getElementById("btnSimulasi")?.addEventListener("click", function() {
        var hotel = document.getElementById("simHotel").value || 0;
        var penduduk = document.getElementById("simPenduduk").value || 0;
        var resto = document.getElementById("simResto").value || 0;
        var pertanian = document.getElementById("simPertanian").value || 0;

        fetch("/api/informasi-debit/?hotel="+hotel+"&penduduk="+penduduk+"&resto="+resto+"&pertanian="+pertanian)
        .then(function(r){return r.json();}).then(function(data) {
            document.getElementById("debitSupply").textContent = data.ketersediaan_m3;
            document.getElementById("debitDemand").textContent = data.kebutuhan_m3;
            var persen = data.pemanfaatan_persen;
            document.getElementById("statusLabel").textContent = getStatusLabel(persen);
            document.getElementById("statusLabel").style.color = getStatusColor(persen);
            document.getElementById("statusPersen").textContent = persen + "% terpakai";
            document.getElementById("statusDot").style.background = getStatusColor(persen);
            document.getElementById("statusBar").style.background = getStatusBg(persen);
            renderChart(data.ketersediaan_m3, data.kebutuhan_m3);
        });
    });

    // ============================================================
    // PENGUKURAN JARAK
    // ============================================================
    document.querySelectorAll("input[name='mode']").forEach(function(r) {
        r.addEventListener("change", function() { document.getElementById("manualInput").style.display = this.value==="manual" ? "block" : "none"; });
    });
    document.getElementById("btnDistance")?.addEventListener("click", function() {
        distanceActive = !distanceActive;
        document.getElementById("distancePanel").style.display = distanceActive ? "block" : "none";
        if (!distanceActive) resetDistance();
    });
    document.getElementById("btnHitungManual")?.addEventListener("click", function() {
        var lat1=parseFloat(document.getElementById("lat1").value), lng1=parseFloat(document.getElementById("lng1").value);
        var lat2=parseFloat(document.getElementById("lat2").value), lng2=parseFloat(document.getElementById("lng2").value);
        if (isNaN(lat1)||isNaN(lng1)||isNaN(lat2)||isNaN(lng2)) { showNotif("Validasi", "Isi semua koordinat terlebih dahulu.", "warning"); return; }
        var a=L.latLng(lat1,lng1), b=L.latLng(lat2,lng2), j=map.distance(a,b);
        document.getElementById("distanceResult").innerHTML = "Jarak: "+j.toFixed(2)+" m ("+(j/1000).toFixed(3)+" km)";
        if (garisJarak) map.removeLayer(garisJarak);
        garisJarak = L.polyline([a,b],{color:"red",weight:3}).addTo(map);
    });
    function resetDistance() {
        titikKlik=[]; if(garisJarak){map.removeLayer(garisJarak);garisJarak=null;}
        distanceMarkers.forEach(function(m){map.removeLayer(m);}); distanceMarkers=[];
        var r=document.getElementById("distanceResult"); if(r) r.innerHTML="";
    }

    // ============================================================
    // CLICK MAP
    // ============================================================
    map.on("click", function(e) {
        if (distanceActive) {
            if (titikKlik.length===2) resetDistance();
            titikKlik.push(e.latlng);
            var m = L.circleMarker(e.latlng,{radius:6,color:"red",fillColor:"red",fillOpacity:1}).addTo(map);
            distanceMarkers.push(m);
            if (titikKlik.length===2) {
                var j=map.distance(titikKlik[0],titikKlik[1]);
                document.getElementById("distanceResult").innerHTML = "Jarak: "+j.toFixed(2)+" m ("+(j/1000).toFixed(3)+" km)";
                garisJarak = L.polyline(titikKlik,{color:"red",weight:3}).addTo(map);
            }
            return;
        }
        if (IS_ADMIN) {
            var latI=document.getElementById("lat"), lngI=document.getElementById("lng");
            if(!latI||!lngI) return;
            latI.value=e.latlng.lat.toFixed(6); lngI.value=e.latlng.lng.toFixed(6);
            if(tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng).addTo(map);
        }
    });

    // ============================================================
    // LEGENDA (collapsible)
    // ============================================================
    var legendCtrl = L.control({ position: "bottomleft" });
    legendCtrl.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML =
            '<div id="legendToggle" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">' +
                '<h4 style="margin:0;">Legenda</h4><span id="legendArrow" style="font-size:12px;">\u25BC</span>' +
            '</div>' +
            '<div id="legendBody" style="display:none;margin-top:6px;">' +
                '<div><img src="https://cdn-icons-png.flaticon.com/512/728/728093.png" width="16"> Sumber Air</div>' +
                '<div><img src="https://cdn-icons-png.flaticon.com/512/139/139899.png" width="16"> Hotel</div>' +
                '<div><img src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png" width="16"> Tempat Makan</div>' +
                '<div><img src="https://cdn-icons-png.flaticon.com/512/3067/3067451.png" width="16"> Jasa</div>' +
                '<div><img src="https://cdn-icons-png.flaticon.com/512/2038/2038152.png" width="16"> Reservoir</div>' +
                '<div><span style="display:inline-block;width:16px;height:3px;background:#e67e22;vertical-align:middle;"></span> Jaringan Pipa</div>' +
                '<div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#8e44ad;vertical-align:middle;"></span> Permukiman</div>' +
                '<div style="margin-top:4px;border-top:1px solid #ddd;padding-top:4px;">' +
                    '<div><span style="display:inline-block;width:16px;height:10px;background:#3498db;opacity:0.4;border:1px solid #2980b9;"></span> Catchment</div>' +
                    '<div><span style="display:inline-block;width:16px;height:10px;background:#27ae60;opacity:0.6;border:1px solid #7f5a00;"></span> Recharge (Sangat Tinggi)</div>' +
                    '<div><span style="display:inline-block;width:16px;height:10px;background:#f1c40f;opacity:0.6;border:1px solid #7f5a00;"></span> Recharge (Tinggi)</div>' +
                    '<div><span style="display:inline-block;width:16px;height:10px;background:#e67e22;opacity:0.6;border:1px solid #7f5a00;"></span> Recharge (Sedang)</div>' +
                    '<div><span style="display:inline-block;width:16px;height:10px;background:#e74c3c;opacity:0.6;border:1px solid #7f5a00;"></span> Recharge (Rendah)</div>' +     
                    '<div><span style="display:inline-block;width:16px;height:10px;background:transparent;border:1.5px dashed #2c3e50;"></span> Batas Desa</div>' +
                '</div>' +
            '</div>';
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    legendCtrl.addTo(map);
    document.addEventListener("click", function(e) {
        if (e.target.closest("#legendToggle")) {
            var body = document.getElementById("legendBody");
            var arrow = document.getElementById("legendArrow");
            if (body.style.display === "none") { body.style.display = "block"; arrow.textContent = "\u25B2"; }
            else { body.style.display = "none"; arrow.textContent = "\u25BC"; }
        }
    });

    // ============================================================
    // SEARCH LOKASI
    // ============================================================
    var searchCtrl = L.control({ position: "topleft" });
    searchCtrl.onAdd = function () {
        var div = L.DomUtil.create("div", "search-map-control");
        div.innerHTML = '<input type="text" id="mapSearchInput" placeholder="Cari lokasi..." style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:13px;width:220px;font-family:inherit;">';
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    searchCtrl.addTo(map);
    var searchMarker = null;
    document.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            var input = document.getElementById("mapSearchInput");
            if (!input || document.activeElement !== input) return;
            var query = input.value.trim();
            if (!query) return;
            fetch("https://nominatim.openstreetmap.org/search?format=json&q="+encodeURIComponent(query)+"&limit=1")
            .then(function(r){return r.json();})
            .then(function(results) {
                if (results.length === 0) { showNotif("Tidak Ditemukan", "Lokasi tidak ditemukan.", "warning"); return; }
                var r = results[0], lat = parseFloat(r.lat), lon = parseFloat(r.lon);
                map.setView([lat, lon], 15);
                if (searchMarker) map.removeLayer(searchMarker);
                searchMarker = L.marker([lat, lon]).addTo(map).bindPopup("<b>"+r.display_name+"</b>").openPopup();
            })
            .catch(function() { showNotif("Gagal", "Gagal mencari lokasi.", "error"); });
        }
    });

    // ============================================================
    // PRINT / EXPORT
    // ============================================================
    var printCtrl = L.control({ position: "topleft" });
    printCtrl.onAdd = function () {
        var div = L.DomUtil.create("div", "print-map-control");
        div.innerHTML = '<button id="btnPrintMap" title="Export peta" style="padding:6px 10px;background:white;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:14px;">\uD83D\uDDA8\uFE0F Export</button>';
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    printCtrl.addTo(map);
    document.addEventListener("click", function(e) {
        if (e.target.id === "btnPrintMap" || e.target.closest("#btnPrintMap")) {
            if (typeof html2canvas !== "undefined") {
                html2canvas(document.getElementById("map"), { useCORS: true, allowTaint: true }).then(function(canvas) {
                    var link = document.createElement("a");
                    link.download = "peta_wonotoro.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                });
            } else { window.print(); }
        }
    });

    // ============================================================
    // SIDEBAR RESIZE FIX
    // ============================================================
    document.getElementById("btnHideSidebar")?.addEventListener("click", function() { setTimeout(function() { map.invalidateSize(); }, 300); });
    document.getElementById("btnShowSidebar")?.addEventListener("click", function() { setTimeout(function() { map.invalidateSize(); }, 300); });

    // ============================================================
    // INITIAL LOAD
    // ============================================================
    loadTitik();
    loadGeoJSON();
    loadDebit();

    // Hide loading spinner after all loaded
    setTimeout(function() {
        var el = document.getElementById("mapLoading");
        if (el) el.style.display = "none";
    }, 2000);

});