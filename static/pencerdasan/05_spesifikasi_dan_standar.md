# 05 – SPESIFIKASI DAN STANDAR PRODUK

## Spesifikasi Teknis AQUAVISION

| Komponen | Spesifikasi |
|---|---|
| **Nama Produk** | AQUAVISION – WebGIS Sumber Daya Air Desa Wonotoro |
| **Platform** | Web-based (browser), tidak memerlukan instalasi |
| **Framework Aplikasi** | Django 4.2 + GeoDjango (django.contrib.gis) |
| **Basis Data** | PostgreSQL 14 + PostGIS 3.3; database: webgis_ta |
| **Frontend Library** | Leaflet.js 1.9, HTML5, CSS3, JavaScript (Vanilla) |
| **Sistem Koordinat** | WGS 84 / EPSG:4326 (geografis); UTM Zone 49S untuk display sistem proyeksi |
| **Format Data Exchange** | GeoJSON (vector layers), PNG / GeoTIFF (raster overlay) |
| **Format Download** | CSV, GeoJSON, KML, Shapefile (.zip) |
| **Basemap Pilihan** | OpenStreetMap, Satelit ESRI, Topografi ESRI |
| **Autentikasi** | Django session-based auth; 3 peran: Super Admin, Admin, User |
| **Browser Support** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **Jumlah Layer Peta** | 12 layer (8 vektor + 1 raster overlay raster GeoTIFF) |
| **Jumlah Model Data** | 9 model (SumberAir, FasilitasWisata, Permukiman, Daerah Potensi Air Tanah, Debit Puncak Air, JaringanPipa, TandonAir, AdministrasiDesa, Feedback) |
| **REST API** | Django REST Framework + djangorestframework-gis |

---

## Fitur Utama Sistem

| Fitur | Deskripsi |
|---|---|
| Dashboard Peta | Visualisasi interaktif seluruh layer sumber daya air |
| Informasi Ketersediaan Air | Neraca air real-time (supply vs demand) |
| Simulasi Skenario | Evaluasi dampak perubahan parameter kebutuhan air |
| Pengukuran Jarak | Klik peta & input koordinat manual |
| Input Data Manual | Tambah, ubah, hapus data (Admin) |
| Upload SHP | Impor data spasial via Shapefile (Admin) |
| Data Portal | Akses dan unduh dataset terpusat |
| Feedback Publik | Formulir umpan balik tanpa login |
| Hubungi Admin | Percakapan dua arah pengguna–administrator |

---

## Standar Produk

| Komponen | Standar yang Digunakan |
|---|---|
| **Kualitas Perangkat Lunak** | ISO/IEC 25010:2011 |
| **Interoperabilitas Data Geospasial** | OGC Standards (Open Geospatial Consortium) |
| **Keamanan Sistem** | OWASP Security Standards |
| **Format Data Geospasial** | RFC 7946 (GeoJSON Specification) |

### Detail ISO/IEC 25010:2011

Dari 8 karakteristik standar ISO/IEC 25010:2011, pengembangan difokuskan pada:
1. **Functional Suitability** – sistem menyediakan fungsi sesuai kebutuhan pengguna.
2. **Performance Efficiency** – kinerja sistem saat diakses.
3. **Compatibility** – kompatibilitas pada berbagai perangkat dan browser.
4. **Usability** – kemudahan penggunaan oleh pengguna non-teknis.

### Detail OGC Standards

- Seluruh layer spasial menggunakan sistem koordinat EPSG:4326 (WGS 84).
- Mendukung pertukaran data dalam format GeoJSON.
- Catatan: GeoServer (WMS/WFS) direncanakan namun tidak diimplementasikan; digantikan oleh custom GeoJSON endpoint dari Django REST Framework.

### Detail OWASP

Diterapkan pada:
- Mekanisme autentikasi berbasis sesi Django.
- CSRF Protection pada setiap operasi perubahan data.
- Field whitelist pada proses pembaruan data via API.
- Pembatasan akses berdasarkan peran (RBAC).
- Penggunaan HTTPS pada lingkungan produksi.

---

## Hak Akses Pengguna

| Fitur / Aksi | Guest | User | Admin | Super Admin |
|---|---|---|---|---|
| Landing Page | ✓ | ✓ | ✓ | ✓ |
| Dashboard WebGIS | – | ✓ | ✓ | ✓ |
| Layer Data Spasial (melihat) | – | ✓ | ✓ | ✓ |
| Neraca Air & Simulasi | – | ✓ | ✓ | ✓ |
| Pengukuran Jarak | – | ✓ | ✓ | ✓ |
| Data Portal (dataset umum) | – | ✓ | ✓ | ✓ |
| Unduh Dataset Umum | – | ✓ | ✓ | ✓ |
| Input Data Manual | – | – | ✓ | ✓ |
| Upload Shapefile | – | – | ✓ | ✓ |
| Edit / Hapus Data | – | – | ✓ | ✓ |
| Data Portal (Admin Only) | – | – | – | ✓ |
| Unduh Dataset Sensitif | – | – | – | ✓ |
| Hubungi Admin (kirim pesan) | ✓ | ✓ | – | – |
| Hubungi Admin (balas pesan) | – | – | ✓ | ✓ |
| Feedback Publik | ✓ | ✓ | ✓ | ✓ |
| Panel Admin Django | – | – | – | ✓ |
| Kelola User & Grup | – | – | – | ✓ |

**Catatan:**
- Guest (tidak login) hanya dapat mengakses Landing Page dan form Feedback. Dashboard WebGIS, peta interaktif, data spasial, dan seluruh fitur analisis memerlukan login.
- Pada implementasi aktual, peran Super Admin digabung melalui mekanisme superuser bawaan Django. Secara operasional terdapat dua peran efektif: **Admin** dan **User**.
- Seluruh endpoint GeoJSON API dilindungi `@login_required`; data layer tidak akan dimuat tanpa autentikasi.
