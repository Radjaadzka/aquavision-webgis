# AQUAVISION — Arsitektur Sistem

---

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                             │
│  Leaflet.js · GeoRaster · html2canvas · Nominatim API   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      NGINX                               │
│  - SSL termination (Let's Encrypt)                       │
│  - Reverse proxy ke Gunicorn                             │
│  - Serve /static/ langsung dari staticfiles/             │
│  - Serve /media/ langsung dari media/                    │
└──────────────────────┬──────────────────────────────────┘
                       │ Unix socket
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   GUNICORN (3 workers)                    │
│              backend.wsgi:application                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  DJANGO 6.0.4                             │
│                                                           │
│  Middleware stack:                                        │
│  ├── CorsMiddleware                                       │
│  ├── SecurityMiddleware                                   │
│  ├── WhiteNoiseMiddleware (static files)                  │
│  ├── SessionMiddleware                                    │
│  ├── SocialAuthExceptionMiddleware                        │
│  ├── CsrfViewMiddleware                                   │
│  ├── AuthenticationMiddleware                             │
│  └── MessageMiddleware                                    │
│                                                           │
│  URL routing:                                             │
│  ├── /              → backend.urls (landing, map, auth)   │
│  ├── /api/          → api.urls_api (GeoJSON, CRUD)        │
│  ├── /data/         → api.urls_data (portal, download)    │
│  ├── /admin/        → Django Admin                        │
│  └── /auth/         → social_django (Google OAuth)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL + PostGIS                         │
│                                                           │
│  Tables:                                                  │
│  ├── api_sumberair          (Point)                       │
│  ├── api_fasilitaswisata    (Point)                       │
│  ├── api_permukiman         (Point)                       │
│  ├── api_reservoir          (Point)                       │
│  ├── api_jaringanpipa       (MultiLineString)             │
│  ├── api_rechargearea       (MultiPolygon)                │
│  ├── api_catchmentarea      (MultiPolygon)                │
│  ├── api_das                (MultiPolygon)                │
│  ├── api_administrasidesa   (MultiPolygon)                │
│  └── api_feedback           (-)                           │
└─────────────────────────────────────────────────────────┘
```

---

## Alur Autentikasi

### Login Biasa

```
Browser → POST /login/ (username + password)
       ↓
Django AuthenticationForm
       ↓
ModelBackend.authenticate()
       ↓
session created → redirect /map/
```

### Google OAuth2

```
Browser → GET /auth/login/google-oauth2/
       ↓
social_django redirect ke Google
       ↓
Google → callback /auth/complete/google-oauth2/
       ↓
PSA pipeline: social_details → social_uid → auth_allowed
           → social_user → get_username → create_user
           → associate_user → load_extra_data
       ↓
session created → redirect /map/
```

### Register

```
Browser → POST /register/ (username + password1 + password2)
       ↓
Django UserCreationForm.is_valid()
       ↓
user.save()
       ↓
Group.objects.get_or_create(name='User')
user.groups.add(group)
       ↓
login(request, user, backend='ModelBackend')
       ↓
redirect /map/
```

---

## Alur WebGIS

```
User akses /map/
       ↓
@login_required → map_view()
       ↓
render index.html { is_admin: bool }
       ↓
Browser load Leaflet.js (CDN)
       ↓
DOMContentLoaded → script.js
       ↓
┌── loadTitik() ─── fetch /api/sumber-air-geojson/  ──► airLayer
│                   fetch /api/fasilitas-geojson/    ──► hotelLayer, makanLayer, jasaLayer
│                   fetch /api/permukiman-geojson/   ──► pendudukLayer
│                   fetch /api/reservoir-geojson/    ──► reservoirLayer
│                   fetch /api/jaringan-pipa-geojson/ ─► pipaLayer
│
├── loadGeoJSON() ─ fetch /static/data/BatasDesa.geojson ──► adminLayer
│                   fetch /static/data/Sungai.geojson     ──► sungaiVektorLayer
│
├── loadDebit() ─── fetch /api/informasi-debit/           ──► gauge chart
│
└── loadPotensiAirTanah() ─ /static/data/DaerahResapan.geojson ──► potensiAirTanahLayer
```

---

## Alur Data Portal

```
User akses /data/
       ↓
@login_required → data_list()
       ↓
render data_list.html (daftar 9 model)
       ↓
User klik model → /data/<model_name>/
       ↓
dataset_detail(request, model_name)
       ↓
MODEL_MAP[model_name] → queryset.order_by('pk')
       ↓
Paginator(queryset, 25)
       ↓
render dataset_detail.html {
    data_rows, fields, is_admin,
    page_obj, total_records
}
```

---

## Alur Upload Shapefile

```
Admin klik Upload SHP
       ↓
Browser → modalSHP form (file .shp + .shx + .dbf + optional .prj)
       ↓
POST /api/upload-shp/ (multipart/form-data)
       ↓
upload_shp(request) — @is_admin_required
       ↓
Validasi: ekstensi, ukuran (max 50MB)
       ↓
tempfile.TemporaryDirectory()
       ↓
django.contrib.gis.gdal.DataSource(shp_path)
       ↓
Loop fitur → transform ke WGS84
       ↓
model.objects.bulk_create(features)
       ↓
JsonResponse({ message: "N fitur berhasil diimport" })
       ↓
Browser reload layer
```

---

## Alur Download Dataset

```
User klik Download (CSV/GeoJSON/KML/SHP)
       ↓
GET /download/<format>/<model_name>/
       ↓
@login_required → download_<format>(request, model_name)
       ↓
MODEL_MAP[model_name] → queryset
       ↓
┌── CSV     → csv.writer → HttpResponse(content_type='text/csv')
├── GeoJSON → django.core.serializers.serialize('geojson') → HttpResponse
├── KML     → manual KML XML string → HttpResponse(content_type='application/vnd.google-earth.kml+xml')
└── SHP     → shapefile.Writer (pyshp) → ZipFile in memory → HttpResponse(content_type='application/zip')
```

---

## Static Files Architecture

```
Sumber: static/
       ↓
python manage.py collectstatic
       ↓
staticfiles/ (WhiteNoise CompressedManifestStaticFilesStorage)
  ├── Versioning: style.abc123.css
  ├── Compression: .gz
  └── Immutable cache headers
       ↓
Production: Nginx serve /static/ langsung dari staticfiles/
Development: WhiteNoise serve via Django WSGI
```

---

## Komponen Frontend

| Komponen | Source | Versi |
|---|---|---|
| Leaflet.js | CDN (unpkg) | 1.9.4 |
| GeoRasterLayer | CDN (unpkg) | — |
| parseGeoraster | CDN (unpkg) | — |
| html2canvas | CDN (cdnjs) | 1.4.1 |
| Font (Google Fonts) | CDN | Poppins |

---

## Permissions Model

```
Unauthenticated user:
  - Akses /           (landing page) ✓
  - Akses /login/     ✓
  - Akses /register/  ✓
  - POST /api/feedback/ ✓
  - Semua lainnya     ✗ (redirect /login/)

Authenticated user (grup 'User'):
  - Akses /map/       ✓ (view only)
  - GET semua /api/   ✓
  - GET /data/        ✓
  - Download dataset  ✓
  - CRUD operations   ✗

Admin (staff/superuser):
  - Semua di atas     ✓
  - POST /api/create-* ✓
  - PUT /api/edit/*   ✓
  - DELETE /api/delete/* ✓
  - POST /api/upload-shp/ ✓
  - /admin/ panel     ✓
```
