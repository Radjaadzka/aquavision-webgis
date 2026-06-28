// portal_admin.js — Admin functions for Data Portal

function getCsrfToken() {
    var name  = "csrftoken";
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

function showToast(title, message, type) {
    var existing = document.getElementById("toastNotif");
    if (existing) existing.remove();
    var ICON_X_CIRCLE = '<svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    var ICON_CHECK    = '<svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    var ICON_ALERT    = '<svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    var colors = {
        error:   { bg: "#fdedec", border: "#e74c3c", icon: ICON_X_CIRCLE },
        success: { bg: "#e8f6f3", border: "#27ae60", icon: ICON_CHECK },
        warning: { bg: "#fef9e7", border: "#e67e22", icon: ICON_ALERT },
    };
    var c = colors[type] || colors.warning;
    var div = document.createElement("div");
    div.id = "toastNotif";
    div.style.cssText = "position:fixed;top:80px;right:20px;z-index:9999;background:" + c.bg + ";border-left:4px solid " + c.border + ";padding:16px 20px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.15);max-width:360px;animation:slideIn 0.3s ease;font-family:inherit;";
    div.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">' +
            '<div>' +
                '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:4px;">' + c.icon + ' ' + title + '</div>' +
                '<div style="font-size:13px;color:#555;line-height:1.5;">' + message + '</div>' +
            '</div>' +
            '<button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:#aaa;padding:0;width:auto;"><svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentElement) div.remove(); }, 5000);
}

function showConfirm(title, message, onYes) {
    var existing = document.getElementById("confirmDialog");
    if (existing) existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "confirmDialog";
    overlay.className = "confirm-overlay";
    overlay.innerHTML =
        '<div class="confirm-box">' +
            '<h4><svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg> ' + title + '</h4>' +
            '<p>' + message + '</p>' +
            '<div class="confirm-actions">' +
                '<button class="btn-confirm-no" id="btnConfirmNo">Batal</button>' +
                '<button class="btn-confirm-yes" id="btnConfirmYes">Hapus</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    document.getElementById("btnConfirmYes").onclick = function() {
        overlay.remove();
        onYes();
    };
    document.getElementById("btnConfirmNo").onclick = function() {
        overlay.remove();
    };
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

// ================================================================
// EDIT MODAL — skema field per model (atribut yang benar-benar
// ada di model, kondisi/kategori sesuai pilihan asli)
// ================================================================

var EDIT_SCHEMA = {
    sumberair: {
        title: 'Sumber Air',
        fields: [
            { key: 'nama',            label: 'Nama',            type: 'text',     required: true },
            { key: 'jenis_sumber',    label: 'Jenis Sumber',    type: 'datalist', list: ['Mata Air', 'Sumur Bor', 'Sumur Gali', 'PDAM'] },
            { key: 'kondisi',         label: 'Kondisi',         type: 'datalist', list: ['Baik', 'Rusak Ringan', 'Rusak Berat'] },
            { key: 'debit',          label: 'Debit (L/detik)', type: 'number' },
            { key: 'tahun_pendataan', label: 'Tahun Pendataan', type: 'integer' },
            { key: 'lat',             label: 'Latitude',        type: 'number' },
            { key: 'lng',             label: 'Longitude',       type: 'number', rowKey: 'lon' },
        ]
    },
    reservoir: {
        title: 'Tandon Air',
        fields: [
            { key: 'nama',         label: 'Nama',           type: 'text', required: true },
            { key: 'kapasitas_m3', label: 'Kapasitas (m³)', type: 'number' },
            { key: 'elevasi',      label: 'Elevasi (m)',    type: 'number' },
            { key: 'lat',          label: 'Latitude',       type: 'number' },
            { key: 'lng',          label: 'Longitude',      type: 'number', rowKey: 'lon' },
        ]
    },
    pipa: {
        title: 'Jaringan Pipa',
        fields: [
            { key: 'nama',         label: 'Nama',             type: 'text', required: true },
            { key: 'diameter_mm',  label: 'Diameter (mm)',    type: 'number' },
            { key: 'kondisi',      label: 'Kondisi',          type: 'datalist', list: ['Baik', 'Rusak Ringan', 'Rusak Berat'] },
            { key: 'tahun_pasang', label: 'Tahun Pemasangan', type: 'integer' },
        ]
    },
    permukiman: {
        title: 'Permukiman',
        fields: [
            { key: 'nama_dusun',         label: 'Nama Dusun',      type: 'text', required: true },
            { key: 'jumlah_kk',          label: 'Jumlah KK',       type: 'integer' },
            { key: 'jumlah_penduduk',    label: 'Jumlah Penduduk', type: 'integer' },
            { key: 'kategori_pelanggan', label: 'Kategori',        type: 'select', options: [
                ['', '-- Pilih Kategori --'],
                ['rumah_tangga', 'Rumah Tangga'],
                ['homestay', 'Homestay'],
                ['warung', 'Warung'],
                ['fasum', 'Fasilitas Umum']
            ] },
            { key: 'lat',                label: 'Latitude',        type: 'number' },
            { key: 'lng',                label: 'Longitude',       type: 'number', rowKey: 'lon' },
        ]
    },
    fasilitas: {
        title: 'Fasilitas Wisata',
        fields: [
            { key: 'nama',      label: 'Nama',              type: 'text', required: true },
            { key: 'jenis',     label: 'Kategori',          type: 'select', options: [
                ['', '-- Pilih Kategori --'],
                ['hotel', 'Hotel'],
                ['resto', 'Restoran'],
                ['homestay', 'Homestay'],
                ['jasa', 'Jasa']
            ] },
            { key: 'kamar',     label: 'Jumlah Kamar',      type: 'integer' },
            { key: 'kapasitas', label: 'Kapasitas (orang)', type: 'integer' },
            { key: 'lat',       label: 'Latitude',          type: 'number' },
            { key: 'lng',       label: 'Longitude',         type: 'number', rowKey: 'lon' },
        ]
    },
    recharge: {
        title: 'Daerah Potensi Air Tanah',
        fields: [
            { key: 'nama',          label: 'Nama',          type: 'text', required: true },
            { key: 'kelas_potensi', label: 'Kelas Potensi', type: 'text' },
            { key: 'luas_ha',       label: 'Luas (ha)',     type: 'number', readonly: true },
        ]
    },
    catchment: {
        title: 'Debit Puncak Aliran',
        fields: [
            { key: 'nama',    label: 'Nama',      type: 'text', required: true },
            { key: 'luas_ha', label: 'Luas (ha)', type: 'number', readonly: true },
        ]
    },
    administrasi: {
        title: 'Administrasi Desa',
        fields: [
            { key: 'wadmkd', label: 'Nama Desa',      type: 'text' },
            { key: 'wadmkc', label: 'Nama Kecamatan', type: 'text' },
            { key: 'wadmkk', label: 'Nama Kabupaten', type: 'text' },
        ]
    }
};

function htmlEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEditFormHtml(schema, current) {
    var html = '<div class="confirm-box" style="text-align:left;max-width:540px;width:95%;max-height:82vh;overflow-y:auto;padding:28px;">';
    html += '<h4 style="margin:0 0 18px;font-size:17px;color:#1a5276;"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg> Edit ' + htmlEscape(schema.title) + '</h4>';
    html += '<div id="editFormBody">';

    schema.fields.forEach(function(field) {
        var val = current[field.rowKey || field.key];
        if (val === null || val === undefined) val = '';

        html += '<div style="margin-bottom:14px;">';
        html += '<label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:5px;">' + htmlEscape(field.label);
        if (field.required) html += ' <span style="color:#e74c3c;">*</span>';
        if (field.readonly) html += ' <span style="font-size:11px;color:#aaa;font-weight:400;">(hanya baca — dihitung dari geometri)</span>';
        html += '</label>';

        var baseStyle = 'width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:6px;font-size:13px;box-sizing:border-box;font-family:inherit;';
        if (field.readonly) baseStyle += 'background:#f8f9fa;color:#999;cursor:not-allowed;';

        if (field.type === 'select') {
            html += '<select data-key="' + field.key + '" style="' + baseStyle + '"' + (field.readonly ? ' disabled' : '') + '>';
            field.options.forEach(function(opt) {
                var selected = (String(val) === String(opt[0])) ? ' selected' : '';
                html += '<option value="' + htmlEscape(opt[0]) + '"' + selected + '>' + htmlEscape(opt[1]) + '</option>';
            });
            html += '</select>';
        } else if (field.type === 'datalist') {
            var listId = 'dl_' + field.key;
            html += '<input type="text" data-key="' + field.key + '" value="' + htmlEscape(val) + '" list="' + listId + '" style="' + baseStyle + '"' + (field.readonly ? ' readonly' : '') + '>';
            html += '<datalist id="' + listId + '">';
            field.list.forEach(function(item) { html += '<option value="' + htmlEscape(item) + '">'; });
            html += '</datalist>';
        } else {
            var inputType = (field.type === 'number' || field.type === 'integer') ? 'number' : 'text';
            var stepAttr  = field.type === 'number' ? ' step="any"' : (field.type === 'integer' ? ' step="1"' : '');
            html += '<input type="' + inputType + '" data-key="' + field.key + '" value="' + htmlEscape(val) + '"' + stepAttr + ' style="' + baseStyle + '"' + (field.readonly ? ' readonly' : '') + '>';
        }
        html += '</div>';
    });

    html += '</div>'; // editFormBody
    html += '<div class="confirm-actions" style="margin-top:18px;justify-content:flex-end;gap:10px;">';
    html += '<button class="btn-confirm-no" id="btnEditCancel">Batal</button>';
    html += '<button class="btn-confirm-yes" style="background:#1a5276;" id="btnEditSave"><svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan</button>';
    html += '</div>';
    html += '</div>'; // confirm-box
    return html;
}

function wireEditForm(overlay, schema, modelName, pk) {
    document.getElementById("btnEditCancel").onclick = function() { overlay.remove(); };

    document.getElementById("btnEditSave").onclick = function() {
        var payload = {};
        var latVal = null, lngVal = null;
        var valid = true;

        schema.fields.forEach(function(field) {
            if (!valid || field.readonly) return;

            var el = overlay.querySelector('[data-key="' + field.key + '"]');
            if (!el) return;

            var raw = el.value.trim();

            if (field.required && !raw) {
                el.style.borderColor = '#e74c3c';
                showToast("Validasi", field.label + " tidak boleh kosong.", "warning");
                valid = false;
                return;
            }
            el.style.borderColor = '#ddd';
            if (!raw) return; // field opsional kosong -> tidak dikirim (tidak mengubah nilai lama)

            if (field.key === 'lat') {
                latVal = parseFloat(raw);
                if (isNaN(latVal) || latVal < -90 || latVal > 90) {
                    showToast("Validasi", "Latitude harus angka antara -90 dan 90.", "warning");
                    valid = false;
                }
                return;
            }
            if (field.key === 'lng') {
                lngVal = parseFloat(raw);
                if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
                    showToast("Validasi", "Longitude harus angka antara -180 dan 180.", "warning");
                    valid = false;
                }
                return;
            }
            if (field.type === 'number' || field.type === 'integer') {
                var numVal = field.type === 'integer' ? parseInt(raw, 10) : parseFloat(raw);
                if (isNaN(numVal)) {
                    showToast("Validasi", field.label + " harus berupa angka.", "warning");
                    valid = false;
                    return;
                }
                payload[field.key] = numVal;
            } else {
                payload[field.key] = raw;
            }
        });

        if (!valid) return;

        // lat/lng hanya dikirim sebagai pasangan lengkap (sesuai kontrak backend)
        if (latVal !== null && lngVal !== null) {
            payload.lat = latVal;
            payload.lng = lngVal;
        } else if (latVal !== null || lngVal !== null) {
            showToast("Validasi", "Latitude dan Longitude harus diisi bersamaan.", "warning");
            return;
        }

        if (Object.keys(payload).length === 0) {
            showToast("Info", "Tidak ada perubahan untuk disimpan.", "warning");
            return;
        }

        var saveBtn = document.getElementById("btnEditSave");
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";

        fetch("/api/edit/" + modelName + "/" + pk + "/", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
            body: JSON.stringify(payload),
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.message) {
                overlay.remove();
                showToast("Berhasil", data.message, "success");
                setTimeout(function() { location.reload(); }, 1200);
            } else {
                saveBtn.disabled = false;
                saveBtn.textContent = "Simpan";
                showToast("Gagal", data.error || "Terjadi kesalahan.", "error");
            }
        })
        .catch(function() {
            saveBtn.disabled = false;
            saveBtn.textContent = "Simpan";
            showToast("Gagal", "Gagal menyimpan data.", "error");
        });
    };
}

function showEditModal(modelName, pk) {
    var existing = document.getElementById("editDialog");
    if (existing) existing.remove();

    var schema = EDIT_SCHEMA[modelName];
    if (!schema) {
        showToast("Error", "Form edit belum dikonfigurasi untuk dataset ini.", "error");
        return;
    }

    var overlay = document.createElement("div");
    overlay.id = "editDialog";
    overlay.className = "confirm-overlay";
    overlay.innerHTML = '<div class="confirm-box" style="text-align:center;"><div style="padding:24px;color:#666;font-size:13px;">Memuat data...</div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.remove(); });

    fetch("/api/edit/" + modelName + "/" + pk + "/", {
        credentials: "include",
        headers: { "X-CSRFToken": getCsrfToken() },
    })
    .then(function(r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
    })
    .then(function(current) {
        if (!document.getElementById("editDialog")) return; // ditutup user sebelum data datang
        overlay.innerHTML = buildEditFormHtml(schema, current);
        wireEditForm(overlay, schema, modelName, pk);
    })
    .catch(function() {
        overlay.remove();
        showToast("Gagal", "Gagal memuat data untuk diedit.", "error");
    });
}

// Event delegation for edit/delete buttons
document.addEventListener("click", function(e) {
    var editBtn = e.target.closest(".btn-edit");
    if (editBtn) {
        var model = editBtn.getAttribute("data-model");
        var id = parseInt(editBtn.getAttribute("data-id"));
        if (!id || id === 0) { showToast("Error", "ID data tidak valid.", "error"); return; }
        showEditModal(model, id);
        return;
    }

    var deleteBtn = e.target.closest(".btn-delete");
    if (deleteBtn) {
        var model2 = deleteBtn.getAttribute("data-model");
        var id2 = parseInt(deleteBtn.getAttribute("data-id"));
        if (!id2 || id2 === 0) { showToast("Error", "ID data tidak valid.", "error"); return; }
        showConfirm("Hapus Data", "Data yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?", function() {
            fetch("/api/delete/" + model2 + "/" + id2 + "/", {
                method: "DELETE",
                credentials: "include",
                headers: { "X-CSRFToken": getCsrfToken() },
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.message) {
                    showToast("Berhasil", data.message, "success");
                    setTimeout(function() { location.reload(); }, 1500);
                } else {
                    showToast("Gagal", data.error || "Gagal menghapus.", "error");
                }
            })
            .catch(function() { showToast("Gagal", "Gagal menghapus data.", "error"); });
        });
        return;
    }
});
