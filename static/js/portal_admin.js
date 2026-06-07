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
    var colors = {
        error:   { bg: "#fdedec", border: "#e74c3c", icon: "\u{1F6AB}" },
        success: { bg: "#e8f6f3", border: "#27ae60", icon: "\u2705" },
        warning: { bg: "#fef9e7", border: "#e67e22", icon: "\u26A0\uFE0F" },
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
            '<button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;padding:0;width:auto;">\u2715</button>' +
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
            '<h4>\uD83D\uDDD1\uFE0F ' + title + '</h4>' +
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

function showEditModal(modelName, pk) {
    var existing = document.getElementById("editDialog");
    if (existing) existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "editDialog";
    overlay.className = "confirm-overlay";
    overlay.innerHTML =
        '<div class="confirm-box" style="text-align:left;">' +
            '<h4 style="margin-bottom:16px;">\u270F\uFE0F Edit Data</h4>' +
            '<div style="margin-bottom:16px;">' +
                '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px;">Nama Baru</label>' +
                '<input id="editNameInput" type="text" placeholder="Masukkan nama baru" ' +
                    'style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;">' +
            '</div>' +
            '<div class="confirm-actions" style="justify-content:flex-end;">' +
                '<button class="btn-confirm-no" id="btnEditCancel">Batal</button>' +
                '<button class="btn-confirm-yes" style="background:#1a5276;" id="btnEditSave">Simpan</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    document.getElementById("editNameInput").focus();
    document.getElementById("btnEditCancel").onclick = function() {
        overlay.remove();
    };
    document.getElementById("btnEditSave").onclick = function() {
        var newName = document.getElementById("editNameInput").value.trim();
        if (!newName) { showToast("Validasi", "Nama tidak boleh kosong.", "warning"); return; }
        overlay.remove();
        fetch("/api/edit/" + modelName + "/" + pk + "/", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
            body: JSON.stringify({ nama: newName }),
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.message) {
                showToast("Berhasil", data.message, "success");
                setTimeout(function() { location.reload(); }, 1500);
            } else {
                showToast("Gagal", data.error || "Terjadi kesalahan.", "error");
            }
        })
        .catch(function() { showToast("Gagal", "Gagal mengedit data.", "error"); });
    };
    overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.remove(); });
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