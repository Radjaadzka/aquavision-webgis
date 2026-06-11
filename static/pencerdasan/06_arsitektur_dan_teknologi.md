# 06 – ARSITEKTUR DAN TEKNOLOGI

## Arsitektur Sistem: Three-Tier Client-Server

AQUAVISION dibangun menggunakan arsitektur **Three-Tier Client-Server** yang memisahkan sistem ke dalam tiga lapisan utama:

```
┌─────────────────────────────────────────────────┐
│          PRESENTATION TIER (Frontend)           │
│   HTML5, CSS3, JavaScript, Leaflet.js 1.9       │
│   Browser: Chrome, Firefox, Edge, Safari        │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/HTTPS (JSON / GeoJSON)
┌─────────────────┴───────────────────────────────┐
│          APPLICATION TIER (Backend)             │
│   Django 4.2 + GeoDjango                       │
│   Django REST Framework                        │
│   djangorestframework-gis                      │
└─────────────────┬───────────────────────────────┘
                  │ Django ORM / GeoDjango ORM
┌─────────────────┴───────────────────────────────┐
│          DATA TIER (Database)                   │
│   PostgreSQL 14 + PostGIS 3.3                  │
│   Database: webgis_ta                          │
└─────────────────────────────────────────────────┘
```

---

## Detail Setiap Lapisan

### Lapisan 1: Presentation Tier (Frontend)

| Teknologi | Fungsi |
|---|---|
| HTML5 | Struktur halaman web |
| CSS3 | Desain dan styling antarmuka |
| JavaScript (Vanilla) | Logika interaksi dan dinamis |
| Leaflet.js 1.9 | Pustaka peta interaktif (visualisasi layer spasial) |
| GeoRaster | Memuat dan menampilkan data raster GeoTIFF |
| GeoRaster Layer for Leaflet | Integrasi raster GeoTIFF dengan Leaflet |

**Halaman utama yang diimplementasikan:**
- `landing.html` – Landing page publik
- `login.html` – Autentikasi pengguna
- `register.html` – Registrasi pengguna baru
- `index.html` – Dashboard WebGIS utama
- `datalist.html` – Daftar dataset (Data Portal)
- `dataset_detail.html` – Detail dan pengelolaan dataset
- `404.html`, `500.html` – Halaman error kustom

### Lapisan 2: Application Tier (Backend)

| Teknologi | Fungsi |
|---|---|
| Django 4.2 | Framework aplikasi web Python |
| GeoDjango (django.contrib.gis) | Ekstensi Django untuk data spasial |
| Django REST Framework | Pembuatan REST API |
| djangorestframework-gis | Serialisasi data spasial ke format GeoJSON |
| django-allauth / Google OAuth2 | Autentikasi via akun Google (opsional) |

**File-file utama:**
- `models.py` – Definisi model data spasial dan non-spasial
- `views.py` – Logika bisnis, endpoint API, dan pengiriman halaman
- `urls.py` / `urls_api.py` – Konfigurasi routing URL
- `serializers.py` – Serialisasi data ke format GeoJSON/JSON

### Lapisan 3: Data Tier (Database)

| Teknologi | Fungsi |
|---|---|
| PostgreSQL 14 | Sistem manajemen basis data relasional |
| PostGIS 3.3 | Ekstensi PostgreSQL untuk penyimpanan dan pengolahan data spasial |

---

## Mekanisme Integrasi Komponen

| Integrasi | Teknologi | Fungsi |
|---|---|---|
| Backend ↔ Basis Data | Django ORM, GeoDjango, PostGIS | Mengelola data spasial dan nonspasial sebagai objek Python |
| Backend ↔ Frontend | Django Template, JSON, GeoJSON | Mengirim data dan informasi hak akses pengguna |
| Frontend ↔ Data Vektor | Leaflet.js, GeoJSON | Menampilkan layer spasial interaktif |
| Frontend ↔ Data Raster | GeoRaster, GeoTIFF | Menampilkan dan melihat nilai piksel raster debit puncak aliran |

---

## Alur Pertukaran Data

1. Pengguna mengakses URL `/map/` → Django merender `index.html` + meneruskan info hak akses.
2. JavaScript meminta data **bertahap** via endpoint API (bukan sekaligus saat loading).
3. Data spasial (GeoJSON) dikirim dari `views.py` → ditampilkan oleh Leaflet.js sebagai layer peta.
4. Data raster (GeoTIFF debit puncak) dimuat **on-demand** menggunakan GeoRaster.
5. Operasi perubahan data (tambah/ubah/hapus) dilindungi autentikasi + CSRF Token.

---

## Endpoint GeoJSON API

| Endpoint URL | Model | Tipe Geometri | Akses |
|---|---|---|---|
| `/api/sumber-air-geojson/` | SumberAir | Point | Login required |
| `/api/fasilitas-geojson/` | FasilitasWisata | Point | Login required |
| `/api/permukiman-geojson/` | Permukiman | Point | Login required |
| `/api/administrasi-geojson/` | AdministrasiDesa | MultiPolygon | Login required |
| `/api/potensiair-geojson/` | Daerah Potensi Air Tanah | MultiPolygon | Login required |
| `/api/debit-geojson/` | Debit Puncak Air | MultiPolygon | Login required |
| `/api/jaringan-pipa-geojson/` | JaringanPipa | MultiLineString | Login required |
| `/api/tandon-geojson/` | TandonAir | Point | Login required |

---

## Mekanisme Keamanan

| Mekanisme | Implementasi |
|---|---|
| Autentikasi | Django session-based; opsional Google OAuth2 |
| Otorisasi | Role-Based Access Control (RBAC); fungsi `is_admin_user()` |
| CSRF Protection | Token CSRF pada setiap operasi perubahan data |
| Field Whitelist | Hanya atribut yang ditentukan yang dapat diubah via API |
| HTTPS | Aktif di lingkungan produksi |
| Akses Dataset Sensitif | Dibatasi khusus Admin (potensi air tanah, jaringan pipa, DAS) |

---

## Kelompok Fungsi pada `views.py`

| Kelompok | Contoh Fungsi | Fungsi Utama |
|---|---|---|
| Halaman Web | `landing()`, `map_view()`, `data_list()` | Menampilkan halaman dan mengelola interaksi pengguna |
| Layanan API | Endpoint GeoJSON dan JSON | Menyediakan data spasial dan nonspasial untuk WebGIS |
| Logika Bisnis | `informasi_debit()` | Menghitung neraca air dan simulasi skenario |
| Administrasi Sistem | Audit Log, Download Log, Manajemen Data | Mendukung pengelolaan dan pemantauan sistem |
| Pengelolaan Hak Akses | `is_admin_user()`, `login_required` | Validasi peran dan pembatasan akses |

---

## Perbedaan Rancangan vs Implementasi

| Aspek | Rancangan (TG300) | Implementasi Aktual |
|---|---|---|
| Middleware Spasial | GeoServer (WMS/WFS) | Custom GeoJSON endpoint via Django REST Framework GIS |
| Peran Pengguna | 3 peran (Super Admin, Admin, User) | 2 peran operasional (Admin, User) + superuser Django |
| DAS Layer | Direncanakan sebagai layer publik | Tersimpan di DB namun belum diekspos ke WebGIS |
| Entitas Persil | Direncanakan | Tidak diimplementasikan |
