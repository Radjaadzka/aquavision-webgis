# AQUAVISION — WebGIS Sumber Daya Air

Sistem informasi geografis berbasis web untuk manajemen sumber daya air di Desa Wonotoro, Kabupaten Malang. Dikembangkan sebagai Tugas Akhir Teknik Geodesi ITB.

---

## Deskripsi

AQUAVISION memvisualisasikan data spasial sumber air, fasilitas wisata, permukiman, jaringan pipa, dan neraca air secara interaktif dalam satu dashboard WebGIS. Sistem ini membantu pemangku kepentingan dalam perencanaan pengelolaan air bersih dan pengembangan pariwisata berbasis data.

---

## Tujuan Sistem

- Menyediakan peta interaktif sumber daya air Desa Wonotoro
- Menampilkan analisis neraca air (ketersediaan vs. kebutuhan)
- Memfasilitasi input, edit, dan hapus data spasial oleh admin
- Menyediakan portal unduhan dataset (CSV, GeoJSON, KML, SHP)
- Mendukung upload data shapefile langsung dari browser

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| WebGIS Dashboard | Peta interaktif Leaflet dengan 10+ layer |
| Neraca Air | Gauge chart ketersediaan vs. kebutuhan air |
| Debit Puncak | Visualisasi raster bulanan (GeoRaster TIFF) |
| Data Portal | Tabel, pencarian, dan paginasi dataset |
| Download | CSV, GeoJSON, KML, SHP per-dataset |
| Upload SHP | Import shapefile langsung dari browser (admin) |
| Admin CRUD | Edit & hapus data via modal tanpa reload halaman |
| Google OAuth | Login dengan akun Google (opsional) |
| Pencarian Lokasi | Geocoding via Nominatim |
| Pengukuran Jarak | Klik peta atau input koordinat manual |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Django 6.0.4 + Django REST Framework 3.16.1 |
| Spatial | PostGIS, djangorestframework-gis, GDAL 3.8.4 |
| Frontend | Leaflet.js, GeoRaster, html2canvas (CDN) |
| Database | PostgreSQL + PostGIS |
| Auth | Django Auth + PSA (Google OAuth2) |
| Static | WhiteNoise 6.12.0 |
| Server | Gunicorn 26.0.0 + Nginx |
| Python | 3.12.3 |

---

## Struktur Project

```
webgis/
├── api/                        # Django app utama
│   ├── migrations/             # Database migrations
│   ├── templatetags/           # Custom template filter (get_item)
│   ├── admin.py                # Django admin registration
│   ├── models.py               # Spatial & non-spatial models
│   ├── serializers.py          # DRF GeoJSON serializers
│   ├── urls_api.py             # URL: /api/...
│   ├── urls_data.py            # URL: /data/...
│   └── views.py                # Semua view functions
├── backend/                    # Django project config
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── scripts/                    # One-time data import tools
│   ├── import_administrasi.py
│   ├── import_das.py
│   ├── import_sungai.py
│   └── convert_tiff.py
├── static/                     # Source static files
│   ├── css/style.css
│   ├── data/                   # GeoJSON & TIF raster
│   ├── images/
│   └── js/
├── staticfiles/                # Output collectstatic (gitignored)
├── templates/                  # HTML templates
│   ├── base.html
│   ├── index.html              # WebGIS
│   ├── landing.html
│   ├── login.html
│   ├── register.html
│   ├── data_list.html
│   ├── dataset_detail.html
│   ├── 404.html
│   └── 505.html
├── media/                      # Upload files (gitignored)
├── manage.py
├── requirements.txt
└── Procfile
```

---

## Cara Instalasi (Development)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd webgis
python -m venv venv
source venv/bin/activate        # Linux/Mac
# atau: venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

### 2. Database

```bash
# Pastikan PostgreSQL + PostGIS sudah berjalan
psql -U postgres -c "CREATE DATABASE webgis_ta;"
psql -U postgres -c "CREATE EXTENSION postgis;" -d webgis_ta
```

### 3. Environment Variables

Buat file `.env` atau set environment variables:

```bash
export DJANGO_SECRET_KEY="your-secret-key-here"
export DJANGO_DEBUG="True"
export ALLOWED_HOSTS="localhost,127.0.0.1"
export DB_NAME="webgis_ta"
export DB_USER="postgres"
export DB_PASSWORD="your-db-password"
export DB_HOST="localhost"
export DB_PORT="5432"
```

> Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk konfigurasi production.

### 4. Migrasi Database

```bash
python manage.py migrate
```

### 5. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 6. Buat Superuser

```bash
python manage.py createsuperuser
```

### 7. Jalankan Server

```bash
python manage.py runserver
```

Akses: [http://localhost:8000](http://localhost:8000)

---

## Environment Variables Lengkap

| Variable | Default | Keterangan |
|---|---|---|
| `DJANGO_SECRET_KEY` | (insecure dev key) | **Wajib diganti di production** |
| `DJANGO_DEBUG` | `False` | Set `True` hanya untuk development |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Domain yang diizinkan (koma-separated) |
| `DB_NAME` | `webgis_ta` | Nama database PostgreSQL |
| `DB_USER` | `postgres` | User PostgreSQL |
| `DB_PASSWORD` | _(kosong)_ | Password PostgreSQL |
| `DB_HOST` | `localhost` | Host database |
| `DB_PORT` | `5432` | Port database |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:8000` | Domain HTTPS trusted (koma-separated) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8000` | Origin CORS (koma-separated) |
| `GDAL_LIBRARY_PATH` | _(auto)_ | Path ke libgdal.so (jika perlu) |
| `GOOGLE_CLIENT_ID` | _(kosong)_ | Google OAuth2 Client ID (opsional) |
| `GOOGLE_CLIENT_SECRET` | _(kosong)_ | Google OAuth2 Secret (opsional) |
| `DJANGO_LOG_LEVEL` | `WARNING` | Level log Django |

---

## Models

| Model | Tipe Geometri | Deskripsi |
|---|---|---|
| `SumberAir` | Point | Sumber air (mata air, sumur bor, sungai) |
| `FasilitasWisata` | Point | Hotel, restoran, jasa |
| `Permukiman` | Point | Dusun/permukiman |
| `Reservoir` | Point | Tandon air |
| `JaringanPipa` | MultiLineString | Jaringan distribusi air |
| `RechargeArea` | MultiPolygon | Daerah resapan air |
| `CatchmentArea` | MultiPolygon | Daerah tangkapan air |
| `DAS` | MultiPolygon | Daerah aliran sungai |
| `AdministrasiDesa` | MultiPolygon | Batas administrasi desa |
| `Feedback` | — | Masukan dari pengunjung |

---

## API Endpoints

```
GET  /api/sumber-air-geojson/        GeoJSON sumber air
GET  /api/fasilitas-geojson/         GeoJSON fasilitas wisata
GET  /api/permukiman-geojson/        GeoJSON permukiman
GET  /api/administrasi-geojson/      GeoJSON batas desa
GET  /api/recharge-geojson/          GeoJSON daerah resapan
GET  /api/catchment-geojson/         GeoJSON catchment area
GET  /api/jaringan-pipa-geojson/     GeoJSON jaringan pipa
GET  /api/reservoir-geojson/         GeoJSON reservoir
GET  /api/informasi-debit/           Neraca air (JSON)
POST /api/create-sumber-air/         Tambah sumber air (admin)
POST /api/create-fasilitas/          Tambah fasilitas (admin)
POST /api/create-permukiman/         Tambah permukiman (admin)
POST /api/create-reservoir/          Tambah reservoir (admin)
PUT  /api/edit/<model>/<pk>/         Edit nama record (admin)
DEL  /api/delete/<model>/<pk>/       Hapus record (admin)
POST /api/upload-shp/                Upload shapefile (admin)
POST /api/feedback/                  Kirim feedback (publik)
GET  /api/feedback/list/             List feedback (publik)

GET  /data/                          Data Portal list
GET  /data/<model>/                  Dataset detail + paginasi
GET  /download/csv/<model>/          Download CSV
GET  /download/geojson/<model>/      Download GeoJSON
GET  /download/kml/<model>/          Download KML
GET  /download/shp/<model>/          Download SHP (ZIP)
```

---

## Deployment

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap deployment ke OVHcloud VPS.

---

## Backup & Recovery

Lihat [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) untuk panduan backup database dan recovery.

---

## Arsitektur

Lihat [ARCHITECTURE.md](ARCHITECTURE.md) untuk diagram arsitektur sistem.

---

## Maintenance

Lihat [MAINTENANCE.md](MAINTENANCE.md) untuk panduan pemeliharaan rutin.
