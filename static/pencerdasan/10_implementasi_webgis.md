# 10 – IMPLEMENTASI WEBGIS

## Halaman-Halaman Utama AQUAVISION

### 1. Landing Page (Halaman Beranda)

**Akses:** Publik (tanpa login)

**Komponen:**

| Komponen | Fungsi |
|---|---|
| Hero Section | Memperkenalkan AQUAVISION dan tujuan sistem |
| Statistik Sistem | Menampilkan jumlah sumber air, fasilitas wisata, dan permukiman (data real-time dari database) |
| Identifikasi Permasalahan | Menjelaskan isu pengelolaan SDA di Desa Wonotoro |
| Informasi Fitur | Menjelaskan fitur utama yang tersedia |
| Informasi Dataset | Menampilkan jenis data yang digunakan |
| Pratinjau WebGIS | Memberikan gambaran antarmuka WebGIS |
| Feedback Form | Menampung masukan dan saran dari pengguna (tanpa login) |

---

### 2. Halaman Login

**Akses:** Publik

**Fitur:**
- Login username & password (autentikasi lokal Django).
- Login via akun Google (OAuth2 – aktif jika env var terkonfigurasi di server).
- Dilindungi CSRF Protection.
- Session Management setelah login berhasil.

---

### 3. Halaman Registrasi

**Akses:** Publik

**Proses:**
1. Pengguna mengisi username dan password.
2. Sistem memvalidasi dan memeriksa keunikan username.
3. Akun baru dibuat, otomatis masuk ke grup **User**.
4. Pengguna langsung login otomatis dan diarahkan ke Dashboard WebGIS.

---

### 4. Dashboard WebGIS (Halaman Utama)

**Akses:** Login required

**Komponen Dashboard:**

| Komponen | Fungsi |
|---|---|
| Peta Interaktif | Menampilkan seluruh data spasial (layer-layer) |
| Basemap Selector | Pilih peta dasar: OpenStreetMap, Satelit ESRI, Topografi ESRI |
| Layer Control | Tampilkan/sembunyikan layer data |
| Popup Informasi | Atribut objek yang dipilih di peta |
| Dashboard Neraca Air | Supply vs demand, status Aman/Waspada/Kritis, gauge chart |
| Simulasi Neraca Air | Input parameter untuk skenario perubahan kebutuhan air |
| Visualisasi Raster | Tampilan GeoTIFF debit puncak bulanan |
| Data Management | Tambah/ubah/hapus data (Admin only) |
| Guided Tour | Panduan penggunaan dashboard (opsional) |

**Layer yang tersedia di Dashboard:**
- Sumber Air (Point/Marker)
- Tandon Air (Point/Marker)
- Permukiman (Circle Marker)
| Fasilitas Wisata: Hotel, Tempat Makan, Jasa (Point/Marker)
- Jaringan Pipa (Garis/MultiLineString)
- Administrasi Desa (Polygon)
- Potensi Air Tanah (Polygon Tematik)
- Debit Puncak Air (Raster GeoTIFF – 12 bulan)

---

### 5. Data Portal

**Akses:** Login required (User dan Admin)

**Komponen:**

| Komponen | Fungsi |
|---|---|
| Dataset Listing | Menampilkan seluruh dataset yang tersedia beserta jumlah record |
| Dataset Search | Pencarian dataset berdasarkan kata kunci |
| Dataset Statistics | Jumlah record tiap dataset |
| Dataset Download | Unduh dataset dalam berbagai format (CSV, GeoJSON, KML, Shapefile) |
| Access Control | Dataset sensitif hanya untuk Admin (potensi air tanah, DAS, jaringan pipa) |

**Akses Dataset:**
- Dataset **umum** (public): dapat diakses User dan Admin.
- Dataset **Admin Only** (sensitif): hanya dapat diakses Admin (potensi air tanah, daerah tangkapan air, jaringan pipa distribusi).

---

### 6. Dataset Detail

**Akses:** Login required

**Komponen:**

| Komponen | Fungsi |
|---|---|
| Dataset Information | Informasi dasar dataset |
| Data Table | Record dan atribut dalam bentuk tabel |
| Pagination | Data dibagi beberapa halaman agar ringan |
| Role-Based Field Visibility | User melihat atribut terbatas; Admin melihat semua atribut |
| Download Access | Tombol download dataset |
| Data Management Access | Tambah/ubah/hapus data (Admin only) |

---

### 7. Hubungi Admin

**Akses:** User (kirim pesan); Admin (balas pesan dan kelola inbox)

**Komponen:**

| Komponen | Fungsi |
|---|---|
| Conversation List | Daftar percakapan yang dimiliki pengguna |
| Conversation Detail | Riwayat pesan dalam percakapan |
| Message System | Kirim dan terima pesan |
| Admin Inbox | Seluruh percakapan semua pengguna (Admin only) |
| Notification Indicator | Tandai pesan baru yang belum dibaca |
| Auto Refresh | Perbarui percakapan secara berkala |

**Perbedaan dengan Feedback:** Hubungi Admin memerlukan login dan memungkinkan percakapan dua arah. Feedback publik di landing page tidak memerlukan login dan hanya satu arah.

---

### 8. Halaman Error

| Jenis Error | Tampilan |
|---|---|
| 404 Not Found | Halaman tidak ditemukan, dengan tombol navigasi kembali ke beranda |
| 500 Internal Server Error | Kesalahan server, dengan tombol navigasi kembali ke beranda |

Desain konsisten dengan identitas visual AQUAVISION.

---

## Implementasi Fitur Analisis Neraca Air

### Perhitungan Kondisi Aktual

Fungsi `informasi_debit()` di `views.py`:

| Komponen | Parameter | Sumber Referensi |
|---|---|---|
| Kebutuhan domestik | 120 L/orang/hari | Ditjen Cipta Karya, Kategori IV |
| Kebutuhan hotel/homestay | 250 L/kamar/hari | SNI 03-7065-2005 |
| Kebutuhan restoran | 25 L/kursi/hari | Ditjen Cipta Karya |

### Nilai Default Simulasi (Frontend)

| Komponen | Nilai Default | Catatan |
|---|---|---|
| Kebutuhan domestik | 60 L/orang/hari | Nilai konservatif, dapat diubah pengguna |
| Kebutuhan hotel/homestay | 150 L/kamar/hari | Nilai konservatif, dapat diubah pengguna |
| Kebutuhan restoran | 25 L/kursi/hari | Sama dengan kondisi aktual |

### Status Neraca Air

| Tingkat Pemanfaatan (%) | Status |
|---|---|
| < 50% | Aman |
| 50–80% | Waspada |
| > 80% | Kritis |

### Parameter Simulasi yang Tersedia

| Parameter | Pengaruh |
|---|---|
| Jumlah Penduduk | Kebutuhan air domestik |
| Jumlah Kamar Hotel/Homestay | Kebutuhan air sektor akomodasi |
| Kapasitas Restoran | Kebutuhan air sektor restoran |
| Luas Lahan Pertanian | Kebutuhan air sektor pertanian |

---

## Implementasi Pengukuran Jarak

Dua metode tersedia:
1. **Klik Peta:** Pengguna menentukan 2 titik di peta; sistem menghitung jarak otomatis.
2. **Input Koordinat Manual:** Pengguna memasukkan koordinat yang sudah diketahui.

**Output:** Jarak dalam satuan meter dan kilometer, divisualisasikan di peta.

---

## Upload Shapefile

**Proses:**
1. Admin memilih dataset tujuan penyimpanan.
2. Admin mengunggah file Shapefile (.shp beserta file pendukung).
3. Sistem membaca informasi geometri dan atribut dari Shapefile.
4. Sistem memeriksa sistem koordinat dari file .prj; jika berbeda dari EPSG:4326, geometri ditransformasi otomatis.
5. Konversi tipe geometri otomatis (Polygon → MultiPolygon; LineString → MultiLineString).
6. Data disimpan ke PostgreSQL/PostGIS.

---

## Ringkasan Status Implementasi

| Komponen | Status |
|---|---|
| Landing Page | ✅ Berhasil |
| Login dan Registrasi | ✅ Berhasil |
| Dashboard WebGIS | ✅ Berhasil |
| Visualisasi Data Spasial | ✅ Berhasil |
| Neraca Air (real-time + simulasi) | ✅ Berhasil + Diperluas |
| Simulasi Skenario | ✅ Berhasil |
| Pengukuran Jarak | ✅ Berhasil |
| Data Portal | ✅ Berhasil |
| Pengelolaan Data (CRUD) | ✅ Berhasil |
| Unduh Data (CSV/GeoJSON/KML/SHP) | ✅ Berhasil |
| Upload Shapefile | ✅ Berhasil |
| Feedback Publik | ✅ Berhasil |
| Hubungi Admin | ✅ Berhasil |
| Deployment Sistem | ✅ Berhasil |
| WMS/WFS via GeoServer | ❌ Tidak Diimplementasikan (digantikan GeoJSON custom) |
| Entitas Persil/Status Lahan | ❌ Tidak Diimplementasikan |
