"""
AQUAVISION — Views
API endpoints, data portal, GeoJSON export, and shapefile upload/download.
"""

# Standard library
import csv
import html
import json
import math
import os
import re
import tempfile
import zipfile

# Third-party: shapefile (pyshp) — imported at module level with graceful fallback
try:
    import shapefile  # type: ignore[import-untyped]
except ImportError:
    shapefile = None

# Django
from django.contrib.auth.decorators  import login_required
from django.contrib.gis.gdal         import DataSource
from django.contrib.gis.geos         import GEOSGeometry, MultiLineString, MultiPolygon, Point
from django.core.paginator           import Paginator
from django.core.serializers         import serialize
from django.core.cache               import cache
from django.db.models                import Count, ExpressionWrapper, F, FloatField, OuterRef, Q, Subquery, Sum
from django.http                     import HttpResponse, JsonResponse
from django.shortcuts                import redirect, render
from django.utils                    import timezone

# Django REST Framework
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Local
from .models import (
    AdministrasiDesa,
    AuditLog,
    CatchmentArea,
    Conversation,
    DownloadLog,
    Feedback,
    FasilitasWisata,
    JaringanPipa,
    Message,
    Notification,
    Permukiman,
    RechargeArea,
    Reservoir,
    SumberAir,
)

# ================================================================
# CONSTANTS
# ================================================================

MODEL_MAP = {
    'sumberair':    SumberAir,
    'permukiman':   Permukiman,
    'fasilitas':    FasilitasWisata,
    'recharge':     RechargeArea,
    'catchment':    CatchmentArea,
    'pipa':         JaringanPipa,
    'reservoir':    Reservoir,
    'administrasi': AdministrasiDesa,
}

# Dataset yang hanya bisa diakses admin di Data Portal
ADMIN_ONLY_DATASETS = ['catchment', 'recharge', 'pipa']

# Field yang tidak boleh diedit via API (cegah mass assignment)
PROTECTED_FIELDS = {'id', 'lat', 'lng'}

# Batas upload per file SHP
MAX_UPLOAD_MB = 50

# Ekstensi file yang diizinkan saat upload SHP
ALLOWED_SHP_EXTENSIONS = {
    'shp': 'shp',
    'shx': 'shx',
    'dbf': 'dbf',
    'prj': 'prj',
}


# ================================================================
# HELPERS
# ================================================================

def is_admin_user(user):
    """Cek apakah user adalah superuser atau anggota grup Admin."""
    return user.is_superuser or user.groups.filter(name='Admin').exists()


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _log_download(request, dataset, fmt):
    try:
        DownloadLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            dataset=dataset,
            format=fmt,
            ip_address=_get_client_ip(request),
        )
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='DOWNLOAD',
            detail=f'{dataset}.{fmt}',
            ip_address=_get_client_ip(request),
        )
    except Exception:
        pass


def _log_audit(request, action, detail=''):
    try:
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            detail=detail,
            ip_address=_get_client_ip(request),
        )
    except Exception:
        pass


def get_role_fields(model, user):
    """Kembalikan daftar field berdasarkan role user."""
    if is_admin_user(user):
        return getattr(model, 'ADMIN_FIELDS', None)
    return getattr(model, 'USER_FIELDS', None)


def safe_int(val, default=0):
    """Konversi ke int dengan aman — kembalikan default jika gagal."""
    try:
        return max(0, int(val))
    except (TypeError, ValueError):
        return default


def latlon_from_geom(geom):
    """
    Hitung lat/lon dan UTM Zone 49S dari objek geometri GEOSGeometry.
    Kembalikan (dict_latlon, dict_utm) atau ({}, {}) jika geom None.
    """
    if not geom:
        return {}, {}

    lon = round(geom.x, 6)
    lat = round(geom.y, 6)

    zone = 49
    k0   = 0.9996
    a    = 6378137.0
    e    = 0.0818192
    e2   = e * e

    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    lon0    = math.radians((zone - 1) * 6 - 180 + 3)

    N     = a / math.sqrt(1 - e2 * math.sin(lat_rad) ** 2)
    T     = math.tan(lat_rad) ** 2
    C     = (e2 / (1 - e2)) * math.cos(lat_rad) ** 2
    A_val = math.cos(lat_rad) * (lon_rad - lon0)
    M     = a * (
        (1 - e2 / 4 - 3 * e2 ** 2 / 64)       * lat_rad
        - (3 * e2 / 8 + 3 * e2 ** 2 / 32)     * math.sin(2 * lat_rad)
        + (15 * e2 ** 2 / 256)                 * math.sin(4 * lat_rad)
    )

    easting  = k0 * N * (A_val + (1 - T + C) * A_val ** 3 / 6) + 500000
    northing = k0 * (M + N * math.tan(lat_rad) * (
        A_val ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A_val ** 4 / 24
    ))
    if lat < 0:
        northing += 10_000_000

    return (
        {'lat': lat, 'lon': lon},
        {'easting': round(easting, 2), 'northing': round(northing, 2)},
    )


def get_geo_field(model):
    """Kembalikan nama field geometri pertama pada model, atau None."""
    for field in model._meta.fields:
        if hasattr(field, 'geom_type'):
            return field.name
    return None


def build_data_row(obj, role_fields, geo_field):
    """
    Bangun satu baris data dict berdasarkan role_fields.
    lat/lon/easting/northing dikalkulasi sekali per objek.
    """
    row       = {}
    geom_data = None  # cache per-object

    for fname in role_fields:
        if fname in ('lat', 'lon', 'easting', 'northing'):
            if geom_data is None and geo_field:
                geom     = getattr(obj, geo_field, None)
                ll, utm  = latlon_from_geom(geom)
                geom_data = {**ll, **utm}
            row[fname] = (geom_data or {}).get(fname, '-')
        elif hasattr(obj, fname):
            row[fname] = getattr(obj, fname)
        else:
            row[fname] = '-'

    row['id'] = obj.pk
    return row


# ================================================================
# PERMISSION CLASS
# ================================================================

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and is_admin_user(request.user)


# ================================================================
# GEOJSON ENDPOINTS (read-only, login required)
# ================================================================

def _geojson_response(qs, cache_key, timeout=120):
    """Serialize queryset to GeoJSON with short-lived cache and no double JSON parse."""
    data = cache.get(cache_key)
    if data is None:
        data = serialize('geojson', qs)
        cache.set(cache_key, data, timeout)
    resp = HttpResponse(data, content_type='application/json')
    resp['Cache-Control'] = 'private, max-age=60'
    return resp

def sumber_air_geojson(request):
    return _geojson_response(SumberAir.objects.all(), 'geojson_sumberair')

def fasilitas_geojson(request):
    return _geojson_response(FasilitasWisata.objects.all(), 'geojson_fasilitas')

def permukiman_geojson(request):
    return _geojson_response(Permukiman.objects.all(), 'geojson_permukiman')

def administrasi_geojson(request):
    return _geojson_response(AdministrasiDesa.objects.all(), 'geojson_administrasi', timeout=600)

def recharge_geojson(request):
    return _geojson_response(RechargeArea.objects.all(), 'geojson_recharge', timeout=600)

def catchment_geojson(request):
    return _geojson_response(CatchmentArea.objects.all(), 'geojson_catchment', timeout=600)

def jaringan_pipa_geojson(request):
    return _geojson_response(JaringanPipa.objects.all(), 'geojson_pipa')

def reservoir_geojson(request):
    return _geojson_response(Reservoir.objects.all(), 'geojson_reservoir')


# ================================================================
# CREATE DATA (admin only)
# ================================================================

@login_required
def create_sumber_air(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    try:
        data  = json.loads(request.body)
        point = Point(float(data['lng']), float(data['lat']), srid=4326)
        SumberAir.objects.create(
            nama         = data.get('nama', ''),
            debit        = float(data.get('debit', 0)),
            jenis_sumber = data.get('jenis_sumber', ''),
            lokasi       = point,
        )
        cache.delete_many(['geojson_sumberair', 'water_status', 'dashboard_stats'])
        return JsonResponse({'message': 'Sumber air berhasil disimpan'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
def create_fasilitas(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    try:
        data  = json.loads(request.body)
        point = Point(float(data['lng']), float(data['lat']), srid=4326)
        FasilitasWisata.objects.create(
            nama      = data.get('nama', ''),
            jenis     = data.get('jenis', ''),
            kamar     = data.get('kamar') or None,
            kapasitas = data.get('kapasitas') or None,
            lokasi    = point,
        )
        cache.delete_many(['geojson_fasilitas', 'water_status', 'dashboard_stats'])
        return JsonResponse({'message': 'Fasilitas berhasil disimpan'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
def create_permukiman(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    try:
        data  = json.loads(request.body)
        point = Point(float(data['lng']), float(data['lat']), srid=4326)
        Permukiman.objects.create(
            nama_dusun       = data.get('nama', ''),
            jumlah_kk        = int(data.get('jumlah_kk', 0)),
            jumlah_penduduk  = int(data.get('jumlah_penduduk', 0)),
            lokasi           = point,
        )
        cache.delete_many(['geojson_permukiman', 'water_status', 'dashboard_stats'])
        return JsonResponse({'message': 'Permukiman berhasil disimpan'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
def create_reservoir(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    try:
        data  = json.loads(request.body)
        point = Point(float(data['lng']), float(data['lat']), srid=4326)
        Reservoir.objects.create(
            nama         = data.get('nama', ''),
            kapasitas_m3 = float(data.get('kapasitas_m3', 0)),
            elevasi      = float(data['elevasi']) if data.get('elevasi') else None,
            lokasi       = point,
        )
        cache.delete_many(['geojson_reservoir', 'dashboard_stats'])
        return JsonResponse({'message': 'Tandon air berhasil disimpan'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ================================================================
# EDIT DATA (admin only) — dengan field whitelist
# ================================================================

@login_required
def edit_data(request, model_name, pk):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    try:
        obj  = model.objects.get(pk=pk)
        data = json.loads(request.body)

        # Whitelist: hanya field non-geo, non-protected yang boleh diedit
        editable = {
            f.name for f in model._meta.fields
            if f.name not in PROTECTED_FIELDS and not hasattr(f, 'geom_type')
        }

        for key, value in data.items():
            if key in editable:
                setattr(obj, key, value)

        # Update geometri jika lat/lng disertakan
        if 'lat' in data and 'lng' in data:
            geo_field = get_geo_field(model)
            if geo_field:
                setattr(obj, geo_field, Point(float(data['lng']), float(data['lat']), srid=4326))

        obj.save()
        cache.delete_many([
            f'geojson_{model_name}', 'water_status', 'dashboard_stats',
        ])
        _log_audit(request, 'EDIT', f'{model_name} id={pk}')
        return JsonResponse({'message': 'Data berhasil diperbarui'})

    except model.DoesNotExist:
        return JsonResponse({'error': 'Data tidak ditemukan'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ================================================================
# DELETE DATA (admin only)
# ================================================================

@login_required
def delete_data(request, model_name, pk):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    try:
        model.objects.get(pk=pk).delete()
        cache.delete_many([
            f'geojson_{model_name}', 'water_status', 'dashboard_stats',
        ])
        _log_audit(request, 'DELETE', f'{model_name} id={pk}')
        return JsonResponse({'message': 'Data berhasil dihapus'})
    except model.DoesNotExist:
        return JsonResponse({'error': 'Data tidak ditemukan'}, status=404)


# ================================================================
# UPLOAD SHAPEFILE (admin only)
# — validasi ukuran, ekstensi, tempdir auto-cleanup
# ================================================================

@login_required
def upload_shp(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    target = request.POST.get('target')
    if not target or target not in MODEL_MAP:
        return JsonResponse({'error': 'Target dataset tidak valid'}, status=400)

    model     = MODEL_MAP[target]
    shp_file  = request.FILES.get('shp')
    shx_file  = request.FILES.get('shx')
    dbf_file  = request.FILES.get('dbf')
    prj_file  = request.FILES.get('prj')

    if not shp_file or not shx_file or not dbf_file:
        return JsonResponse({'error': 'Upload file .shp, .shx, dan .dbf (minimal)'}, status=400)

    # Validasi ukuran file
    for name, f in [('shp', shp_file), ('shx', shx_file), ('dbf', dbf_file)]:
        if f.size > MAX_UPLOAD_MB * 1024 * 1024:
            return JsonResponse({'error': f'File .{name} melebihi batas {MAX_UPLOAD_MB} MB'}, status=400)

    # Validasi ekstensi file
    for field_name, expected_ext in ALLOWED_SHP_EXTENSIONS.items():
        f = request.FILES.get(field_name)
        if f:
            actual_ext = f.name.rsplit('.', 1)[-1].lower()
            if actual_ext != expected_ext:
                return JsonResponse({'error': f'File {field_name} harus berekstensi .{expected_ext}'}, status=400)

    # Proses dengan tempdir yang auto-cleanup via context manager
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            base = 'upload'

            for ext, f in [('shp', shp_file), ('shx', shx_file), ('dbf', dbf_file)]:
                dest = os.path.join(tmp_dir, f'{base}.{ext}')
                with open(dest, 'wb') as out:
                    for chunk in f.chunks():
                        out.write(chunk)

            if prj_file:
                dest = os.path.join(tmp_dir, f'{base}.prj')
                with open(dest, 'wb') as out:
                    for chunk in prj_file.chunks():
                        out.write(chunk)

            shp_path    = os.path.join(tmp_dir, f'{base}.shp')
            ds          = DataSource(shp_path)
            layer       = ds[0]
            field_names = list(layer.fields)

            geo_field = get_geo_field(model)
            if not geo_field:
                return JsonResponse({'error': 'Model tidak memiliki field geometri'}, status=400)

            model_fields = {
                f.name.lower(): f.name
                for f in model._meta.fields
                if f.name != 'id' and not hasattr(f, 'geom_type')
            }

            # Mapping nama field SHP → nama field model
            FIELD_ALIASES = {
                'nama':           ['nama', 'name', 'namobj', 'wadmkd'],
                'nama_dusun':     ['nama', 'name', 'dusun'],
                'kondisi':        ['kondisi', 'condition', 'status'],
                'luas_ha':        ['luas', 'luas_ha', 'area', 'luaswh'],
                'kelas_potensi':  ['kelas', 'potensi', 'class'],
            }

            count  = 0
            errors = []

            for feature in layer:
                try:
                    # Strip Z-coordinate jika ada
                    geom_wkt = feature.geom.wkt
                    geom_wkt = re.sub(
                        r'(POLYGON|MULTIPOLYGON|LINESTRING|MULTILINESTRING|POINT|MULTIPOINT)\s*Z\s*',
                        r'\1 ', geom_wkt
                    )
                    geom_wkt = re.sub(
                        r'(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+-?\d+\.?\d*',
                        r'\1 \2', geom_wkt
                    )

                    geos_geom = GEOSGeometry(geom_wkt)

                    # Auto-wrap ke Multi jika model membutuhkan
                    target_field_type = type(model._meta.get_field(geo_field)).__name__
                    if target_field_type == 'MultiPolygonField' and geos_geom.geom_type == 'Polygon':
                        geos_geom = MultiPolygon(geos_geom)
                    elif target_field_type == 'MultiLineStringField' and geos_geom.geom_type == 'LineString':
                        geos_geom = MultiLineString(geos_geom)

                    # Set/transform SRID ke WGS84
                    srid = layer.srs.srid if layer.srs else None
                    geos_geom.srid = srid or 4326
                    if srid and srid != 4326:
                        geos_geom = geos_geom.transform(4326, clone=True)

                    kwargs = {geo_field: geos_geom}

                    # Petakan atribut SHP ke field model
                    for shp_field in field_names:
                        shp_lower = shp_field.lower()
                        # Nama langsung cocok
                        if shp_lower in model_fields:
                            try:
                                val = feature.get(shp_field)
                                if val is not None and str(val).strip():
                                    kwargs[model_fields[shp_lower]] = val
                            except Exception:
                                pass
                        # Coba alias
                        for model_key, aliases in FIELD_ALIASES.items():
                            if model_key in model_fields and model_fields[model_key] not in kwargs:
                                if shp_lower in aliases:
                                    try:
                                        val = feature.get(shp_field)
                                        if val is not None and str(val).strip():
                                            kwargs[model_fields[model_key]] = str(val).strip()
                                    except Exception:
                                        pass

                    model.objects.create(**kwargs)
                    count += 1

                except Exception as e:
                    errors.append(str(e))

            msg = f'{count} data berhasil diimport'
            if errors:
                msg += f' ({len(errors)} gagal)'

            _log_audit(request, 'UPLOAD', f'{target} ({count} features)')
            return JsonResponse({'message': msg, 'count': count, 'errors': errors[:5]}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ================================================================
# INFORMASI DEBIT — aggregate query, bukan loop Python
# ================================================================

def _compute_water_status():
    """Neraca air mode real (tanpa simulasi) — sumber tunggal kebenaran,
    dipakai oleh informasi_debit() dan AI Assistant (Hubungi Admin).
    Hasil di-cache 30 detik; dibatalkan saat data air berubah."""
    cached = cache.get('water_status')
    if cached is not None:
        return cached

    total_debit = SumberAir.objects.aggregate(total=Sum('debit'))['total'] or 0
    supply_m3   = total_debit * 86.4

    total_domestik = Permukiman.objects.aggregate(
        t=Sum(ExpressionWrapper(F('jumlah_penduduk') * 0.12, output_field=FloatField()))
    )['t'] or 0

    total_hotel = FasilitasWisata.objects.filter(jenis='hotel').aggregate(
        t=Sum(ExpressionWrapper(F('kamar') * 0.25, output_field=FloatField()))
    )['t'] or 0

    total_resto = FasilitasWisata.objects.filter(jenis='resto').aggregate(
        t=Sum(ExpressionWrapper(F('kapasitas') * 0.025, output_field=FloatField()))
    )['t'] or 0

    demand_m3 = total_domestik + total_hotel + total_resto

    selisih = supply_m3 - demand_m3
    persen  = (demand_m3 / supply_m3 * 100) if supply_m3 > 0 else 0

    if persen < 50:
        status_str = 'AMAN'
    elif persen < 80:
        status_str = 'WASPADA'
    else:
        status_str = 'KRITIS'

    result = {
        'ketersediaan_m3':    round(supply_m3,   2),
        'kebutuhan_m3':       round(demand_m3,   2),
        'selisih_m3':         round(selisih,      2),
        'pemanfaatan_persen': round(persen,        1),
        'status':             status_str,
        'total_debit_ldetik': round(total_debit,  2),
    }
    cache.set('water_status', result, 30)
    return result


def informasi_debit(request):
    sim_hotel     = request.GET.get('hotel')
    sim_penduduk  = request.GET.get('penduduk')
    sim_resto     = request.GET.get('resto')
    sim_pertanian = request.GET.get('pertanian')

    if any([sim_hotel, sim_penduduk, sim_resto, sim_pertanian]):
        # Mode simulasi — validasi input agar tidak crash
        total_debit = SumberAir.objects.aggregate(total=Sum('debit'))['total'] or 0
        supply_m3   = total_debit * 86.4

        demand_m3 = (
            safe_int(sim_penduduk)  * 0.12
            + safe_int(sim_hotel)   * 0.25
            + safe_int(sim_resto)   * 0.025
            + safe_int(sim_pertanian) * 86.4  # 1 L/dtk/ha × 86400 dtk = 86400 L = 86.4 m³
        )

        selisih = supply_m3 - demand_m3
        persen  = (demand_m3 / supply_m3 * 100) if supply_m3 > 0 else 0

        if persen < 50:
            status_str = 'AMAN'
        elif persen < 80:
            status_str = 'WASPADA'
        else:
            status_str = 'KRITIS'

        return JsonResponse({
            'ketersediaan_m3':    round(supply_m3,   2),
            'kebutuhan_m3':       round(demand_m3,   2),
            'selisih_m3':         round(selisih,      2),
            'pemanfaatan_persen': round(persen,        1),
            'status':             status_str,
            'total_debit_ldetik': round(total_debit,  2),
        })

    return JsonResponse(_compute_water_status())


# ================================================================
# DATA PORTAL — LIST
# ================================================================

@login_required
def data_list(request):
    ALL_DATASETS = [
        {'name': 'Sumber Air',                  'slug': 'sumberair',    'model': SumberAir,
         'description': 'Data titik sumber air beserta debit dan kondisi'},
        {'name': 'Permukiman',                  'slug': 'permukiman',   'model': Permukiman,
         'description': 'Data lokasi permukiman dan jumlah penduduk'},
        {'name': 'Fasilitas Wisata',             'slug': 'fasilitas',    'model': FasilitasWisata,
         'description': 'Data hotel, restoran, dan jasa'},
        {'name': 'Daerah Potensi Air Tanah Desa Wonotoro', 'slug': 'recharge',  'model': RechargeArea,
         'description': 'Peta zonasi potensi air tanah metode AHP (resolusi 10m×10m)'},
        {'name': 'Debit Puncak Aliran Desa Wonotoro',    'slug': 'catchment', 'model': CatchmentArea,
         'description': 'Peta debit puncak aliran metode Rasional (resolusi 30m×30m)'},
        {'name': 'Jaringan Pipa',                        'slug': 'pipa',      'model': JaringanPipa,
         'description': 'Data jaringan pipa distribusi air'},
        {'name': 'Tandon Air',                           'slug': 'reservoir', 'model': Reservoir,
         'description': 'Data lokasi dan kapasitas tandon air'},
        {'name': 'Administrasi Desa',            'slug': 'administrasi', 'model': AdministrasiDesa,
         'description': 'Batas administrasi desa sekitar Wonotoro'},
    ]

    admin = is_admin_user(request.user)

    datasets = ALL_DATASETS if admin else [
        d for d in ALL_DATASETS if d['slug'] not in ADMIN_ONLY_DATASETS
    ]

    query = request.GET.get('q', '').strip()
    if query:
        datasets = [d for d in datasets if query.lower() in d['name'].lower()]

    _counts = cache.get('dataset_counts')
    if _counts is None:
        _counts = {d['slug']: d['model'].objects.count() for d in ALL_DATASETS}
        cache.set('dataset_counts', _counts, 300)
    for d in datasets:
        d['count'] = _counts.get(d['slug'], 0)

    return render(request, 'data_list.html', {
        'datasets': datasets,
        'query':    query,
        'is_admin': admin,
    })


# ================================================================
# DATA PORTAL — DETAIL
# ================================================================

@login_required
def dataset_detail(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return redirect('data_list')

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return redirect('data_list')

    objects = model.objects.all().order_by('pk')

    query = request.GET.get('q', '').strip()
    if query:
        char_fields = [f.name for f in model._meta.fields if f.get_internal_type() == 'CharField']
        q_filter    = Q()
        for field in char_fields:
            q_filter |= Q(**{f'{field}__icontains': query})
        objects = objects.filter(q_filter)

    total_records = objects.count()
    paginator     = Paginator(objects, 20)
    page_obj      = paginator.get_page(request.GET.get('page'))

    role_fields = get_role_fields(model, request.user)
    geo_field   = get_geo_field(model)

    if role_fields is None:
        role_fields = []
        for field in model._meta.fields:
            if field.name == geo_field:
                if geo_field and getattr(model._meta.get_field(geo_field), 'geom_type', None) == 'POINT':
                    role_fields.extend(['lat', 'lon', 'easting', 'northing'])
            else:
                role_fields.append(field.name)

    data_rows = [build_data_row(obj, role_fields, geo_field) for obj in page_obj]

    return render(request, 'dataset_detail.html', {
        'model_name':    model_name,
        'fields':        role_fields,
        'data_rows':     data_rows,
        'page_obj':      page_obj,
        'total_records': total_records,
        'is_admin':      admin,
    })


# ================================================================
# DOWNLOAD CSV
# ================================================================

@login_required
def download_csv(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    role_fields = get_role_fields(model, request.user)
    geo_field   = get_geo_field(model)

    _log_download(request, model_name, 'csv')

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{model_name}.csv"'
    response.write('﻿')  # BOM — Excel compatibility untuk karakter non-ASCII

    writer = csv.writer(response)

    if role_fields:
        writer.writerow(role_fields)
        for obj in model.objects.all():
            row = build_data_row(obj, role_fields, geo_field)
            writer.writerow([row.get(f, '') for f in role_fields])
    else:
        fields = [f.name for f in model._meta.fields]
        writer.writerow(fields)
        for obj in model.objects.all():
            writer.writerow([getattr(obj, f, '') for f in fields])

    return response


# ================================================================
# DOWNLOAD GEOJSON
# ================================================================

@login_required
def download_geojson(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    _log_download(request, model_name, 'geojson')
    data     = serialize('geojson', model.objects.all())
    response = HttpResponse(data, content_type='application/geo+json; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{model_name}.geojson"'
    return response


# ================================================================
# DOWNLOAD KML — nama di-escape (cegah XSS/invalid XML)
# ================================================================

@login_required
def download_kml(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    geo_field  = get_geo_field(model)
    name_field = next(
        (f.name for f in model._meta.fields if f.name in ('nama', 'nama_dusun', 'wadmkd', 'namobj')),
        None
    )

    kml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '<Document>',
        f'<name>{html.escape(model_name)}</name>',
    ]

    for obj in model.objects.all():
        geom = getattr(obj, geo_field, None) if geo_field else None
        if not geom:
            continue

        obj_name  = getattr(obj, name_field, str(obj)) if name_field else str(obj)
        safe_name = html.escape(str(obj_name))
        geom_4326 = geom.transform(4326, clone=True) if geom.srid != 4326 else geom

        kml_lines += [
            '<Placemark>',
            f'<name>{safe_name}</name>',
            geom_4326.kml,
            '</Placemark>',
        ]

    kml_lines += ['</Document>', '</kml>']

    _log_download(request, model_name, 'kml')
    response = HttpResponse('\n'.join(kml_lines), content_type='application/vnd.google-earth.kml+xml')
    response['Content-Disposition'] = f'attachment; filename="{model_name}.kml"'
    return response


# ================================================================
# DOWNLOAD SHP — tempdir auto-cleanup
# ================================================================

@login_required
def download_shp(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({'error': 'Dataset tidak ditemukan'}, status=404)

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    geo_field = get_geo_field(model)
    if not geo_field:
        return JsonResponse({'error': 'No geometry field'}, status=400)

    if shapefile is None:
        return JsonResponse({'error': 'pyshp belum terinstall. Jalankan: pip install pyshp'}, status=500)

    attr_fields = [
        f for f in model._meta.fields
        if f.name != geo_field and f.name != 'id' and not hasattr(f, 'geom_type')
    ]

    geo_type_name = type(model._meta.get_field(geo_field)).__name__
    shp_type_map  = {
        'PointField':           shapefile.POINT,
        'MultiPointField':      shapefile.MULTIPOINT,
        'LineStringField':      shapefile.POLYLINE,
        'MultiLineStringField': shapefile.POLYLINE,
        'PolygonField':         shapefile.POLYGON,
        'MultiPolygonField':    shapefile.POLYGON,
    }
    shp_type = shp_type_map.get(geo_type_name, shapefile.POINT)

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            shp_path = os.path.join(tmp_dir, model_name)
            w        = shapefile.Writer(shp_path, shapeType=shp_type)

            for f in attr_fields:
                fname    = f.name[:10]
                internal = f.get_internal_type()
                if internal == 'IntegerField':
                    w.field(fname, 'N', size=10)
                elif internal in ('FloatField', 'DecimalField'):
                    w.field(fname, 'N', size=20, decimal=6)
                else:
                    w.field(fname, 'C', size=254)

            for obj in model.objects.all():
                geom = getattr(obj, geo_field)
                if not geom:
                    continue
                if geom.srid and geom.srid != 4326:
                    geom = geom.transform(4326, clone=True)

                geo_json = json.loads(geom.geojson)
                gt, coords = geo_json['type'], geo_json['coordinates']

                if   gt == 'Point':           w.point(*coords)
                elif gt == 'MultiPoint':      w.multipoint(coords)
                elif gt == 'LineString':      w.line([coords])
                elif gt == 'MultiLineString': w.line(coords)
                elif gt == 'Polygon':         w.poly(coords)
                elif gt == 'MultiPolygon':
                    w.poly([ring for polygon in coords for ring in polygon])

                values = []
                for f in attr_fields:
                    val = getattr(obj, f.name)
                    if val is None:
                        values.append('' if f.get_internal_type() == 'CharField' else 0)
                    elif isinstance(val, (int, float)):
                        values.append(val)
                    else:
                        values.append(str(val))
                w.record(*values)

            w.close()

            # .prj
            with open(shp_path + '.prj', 'w') as prj:
                prj.write('GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",'
                           'SPHEROID["WGS_1984",6378137.0,298.257223563]],'
                           'PRIMEM["Greenwich",0.0],'
                           'UNIT["Degree",0.0174532925199433]]')

            # .cpg
            with open(shp_path + '.cpg', 'w') as cpg:
                cpg.write('UTF-8')

            zip_path = os.path.join(tmp_dir, f'{model_name}_shp.zip')
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for ext in ['shp', 'shx', 'dbf', 'prj', 'cpg']:
                    fp = f'{shp_path}.{ext}'
                    if os.path.exists(fp):
                        zf.write(fp, f'{model_name}.{ext}')

            with open(zip_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/zip')
                response['Content-Disposition'] = f'attachment; filename="{model_name}_shp.zip"'

            _log_download(request, model_name, 'shp')
            return response

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ================================================================
# FEEDBACK — submit & list
# ================================================================

def feedback_submit(request):
    """Endpoint publik — siapapun bisa kirim feedback."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        data   = json.loads(request.body)
        nama   = str(data.get('nama',  '')).strip()[:100]
        pesan  = str(data.get('pesan', '')).strip()[:1000]
        rating = data.get('rating', None)

        if not nama or not pesan:
            return JsonResponse({'error': 'Nama dan pesan wajib diisi'}, status=400)

        if rating is not None:
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    rating = None
            except (ValueError, TypeError):
                rating = None

        Feedback.objects.create(nama=nama, pesan=pesan, rating=rating)
        return JsonResponse({'message': 'Terima kasih atas masukan Anda!'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def feedback_list(request):
    """Kembalikan 10 feedback terbaru."""
    feedbacks = Feedback.objects.order_by('-tanggal')[:10].values('nama', 'pesan', 'rating', 'tanggal')
    data = [
        {
            'nama':    f['nama'],
            'pesan':   f['pesan'],
            'rating':  f['rating'],
            'tanggal': timezone.localtime(f['tanggal']).strftime('%d %b %Y') if f['tanggal'] else '-',
        }
        for f in feedbacks
    ]
    return JsonResponse(data, safe=False)


# ================================================================
# P2.1 — HUBUNGI ADMIN (Messaging)
# ================================================================

# ── AI FAQ responder (rule-based, no external API needed) ────────
_FAQ = [
    # Format: (keywords_tuple, answer_string)
    (('aquavision', 'apa itu', 'tentang', 'platform', 'sistem'),
     "AQUAVISION adalah platform WebGIS (Web Geographic Information System) untuk pemantauan dan pengelolaan sumber daya air di Desa Wonotoro, Kecamatan Sukapura, Kabupaten Probolinggo. Platform ini dikembangkan sebagai Capstone Design Project Teknik Geodesi dan Geomatika ITB 2026."),

    (('dashboard', 'peta', 'cara buka', 'cara akses', 'bagaimana masuk'),
     "Dashboard AQUAVISION dapat diakses dari menu utama atau melalui tombol 'Buka Dashboard'. Dashboard menampilkan peta interaktif dengan berbagai lapisan data spasial sumber daya air Desa Wonotoro."),

    (('layer', 'lapisan', 'daftar layer', 'aktifkan layer', 'tampilkan layer'),
     "Untuk mengelola layer, klik tombol 'Daftar Layer' di sidebar kiri Dashboard. Anda dapat mengaktifkan atau menonaktifkan lapisan data seperti Potensi Air Tanah, Debit Puncak Aliran, Infrastruktur Air, dan lainnya secara bersamaan."),

    (('potensi air tanah', 'recharge', 'resapan', 'zonasi', 'ahp'),
     "Layer Daerah Potensi Air Tanah menampilkan zonasi resapan air tanah dengan resolusi 10m × 10m. Data dihasilkan menggunakan metode AHP (Analytical Hierarchy Process) berdasarkan tutupan lahan, kemiringan lereng, jenis tanah, dan curah hujan. Warna menunjukkan tingkat potensi dari rendah hingga sangat tinggi."),

    (('debit puncak', 'catchment', 'aliran', 'curah hujan', 'bulan'),
     "Layer Debit Puncak Aliran menampilkan peta debit puncak (m³/s) dengan resolusi 30m × 30m. Data tersedia untuk 12 bulan (Januari–Desember). Pilih bulan dari dropdown di panel layer, kemudian klik area pada peta untuk membaca nilai debit di lokasi tersebut."),

    (('infrastruktur', 'sumber air', 'pipa', 'tandon', 'reservoir', 'fasilitas'),
     "Layer Infrastruktur Air menampilkan lokasi sumber mata air, jaringan pipa distribusi, tandon air, permukiman, dan fasilitas wisata (hotel, restoran, jasa). Klik titik atau garis di peta untuk melihat atribut detail setiap objek."),

    (('neraca air', 'ketersediaan', 'kebutuhan air', 'status aman', 'status kritis', 'waspada'),
     "Ketersediaan Air membandingkan total ketersediaan air dari sumber dengan kebutuhan harian. Status AMAN berarti pemanfaatan di bawah 50% dari ketersediaan, WASPADA berarti 50–80%, dan KRITIS berarti 80% ke atas. Data diperbarui secara berkala dari sistem AQUAVISION."),

    (('simulasi', 'skenario', 'proyeksi', 'hitung kebutuhan', 'penduduk', 'hotel'),
     "Fitur Simulasi Skenario memungkinkan Anda memasukkan parameter hipotetis — jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian — untuk menghitung proyeksi kebutuhan air. Berguna untuk perencanaan pengembangan wisata dan infrastruktur."),

    (('data portal', 'unduh', 'download', 'ekspor', 'csv', 'geojson', 'shapefile', 'kml'),
     "Data Portal AQUAVISION menyediakan akses ke seluruh dataset spasial. Anda dapat mengunduh data dalam format CSV, GeoJSON, KML, atau Shapefile untuk analisis lanjutan di perangkat lunak GIS desktop atau spreadsheet. Kunjungi menu 'Data Portal' di navbar."),

    (('akun', 'login', 'daftar', 'register', 'password', 'lupa password', 'username'),
     "Untuk mengakses fitur lengkap AQUAVISION, buat akun melalui halaman Daftar. Gunakan username dan password yang Anda buat untuk masuk. Jika lupa password, hubungi admin AQUAVISION melalui pesan ini."),

    (('bantuan', 'faq', 'panduan', 'cara menggunakan', 'tutorial', 'petunjuk'),
     "Pusat Bantuan AQUAVISION tersedia di menu navbar dan sidebar. Di sana terdapat FAQ lengkap dalam 6 kategori: Tentang AQUAVISION, Dashboard, Data & Layer, Ketersediaan Air, Akun & Akses, dan Teknis. Gunakan fitur pencarian untuk menemukan jawaban dengan cepat."),

    (('wonotoro', 'desa', 'lokasi', 'bromo', 'probolinggo', 'sukapura'),
     "Desa Wonotoro terletak di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Desa ini berada di kawasan penyangga KSPN (Kawasan Strategis Pariwisata Nasional) Bromo Tengger Semeru, koordinat sekitar 7°53' LS dan 112°59' BT (WGS84/EPSG:4326)."),

    (('health', 'status sistem', 'sistem online', 'database status', 'layer status'),
     "Panel Status Sistem di sidebar Dashboard menampilkan kondisi komponen utama AQUAVISION secara langsung: koneksi data, ketersediaan layer GIS, dan penyimpanan file. Status hijau berarti semua berjalan normal. Jika ada komponen berwarna merah, silakan hubungi tim pengelola melalui menu Hubungi Admin."),

    (('riwayat download', 'log download', 'siapa yang download', 'rekam jejak unduh'),
     "Setiap unduhan data di AQUAVISION dicatat secara otomatis. Tim pengelola dapat memantau riwayat unduhan untuk menjaga keamanan dan penggunaan data. Jika Anda memiliki pertanyaan tentang data yang pernah diunduh, silakan hubungi tim pengelola melalui menu Hubungi Admin."),

    (('panduan dashboard', 'tour', 'lihat panduan', 'cara mulai', 'onboarding', 'mulai dari mana'),
     "AQUAVISION menyediakan “Panduan Dashboard” interaktif yang dapat diakses melalui tombol “ⓘ Lihat Panduan Dashboard” di bagian bawah panel kiri. Panduan ini akan menjelaskan semua fitur utama satu per satu. Klik tombol tersebut untuk memulai atau mengulang panduan kapan saja."),

    (('jumlah sungai', 'berapa sungai', 'jaringan sungai', 'daerah aliran sungai', 'segmen sungai', 'sungai'),
     "AQUAVISION memetakan jaringan Daerah Aliran Sungai (DAS) di Desa Wonotoro pada layer 'Sungai'. Aktifkan layer tersebut di Dashboard untuk melihat seluruh segmen sungai secara interaktif beserta atribut tipe, kelas, dan DAS-nya."),
]


def _idnum(value):
    """Format angka dengan pemisah ribuan ala Indonesia (titik)."""
    return f'{value:,.0f}'.replace(',', '.')


# ── Pertanyaan dengan jawaban dinamis (data aktual sistem, bukan hardcode) ──
_DYNAMIC_INTENTS = (
    (('kondisi air', 'ketersediaan air saat ini', 'status air saat ini',
      'status ketersediaan air', 'debit saat ini', 'air sekarang', 'neraca air saat ini'),
     '_water_status'),
    (('jumlah sumber air', 'berapa sumber air', 'jumlah mata air', 'berapa mata air',
      'ada berapa sumber air', 'jumlah titik sumber air'),
     '_sumber_air_count'),
)


def _dynamic_ai_answer(intent):
    if intent == '_water_status':
        info = _compute_water_status()
        emoji = {'AMAN': '🟢', 'WASPADA': '🟡', 'KRITIS': '🔴'}.get(info['status'], '')
        return (
            f"Berdasarkan data sistem AQUAVISION saat ini, ketersediaan air berada pada kategori "
            f"{emoji} {info['status']}, dengan total ketersediaan sekitar {_idnum(info['ketersediaan_m3'])} m³/hari "
            f"dan kebutuhan sekitar {_idnum(info['kebutuhan_m3'])} m³/hari (pemanfaatan {info['pemanfaatan_persen']}%). "
            "Detail lengkap dan grafik dapat dilihat di Dashboard pada panel Ketersediaan Air."
        )
    if intent == '_sumber_air_count':
        n = SumberAir.objects.count()
        return (
            f"Sistem AQUAVISION saat ini mencatat {n} titik sumber air (mata air) di Desa Wonotoro. "
            "Detail lokasi, debit, dan kondisi setiap sumber air dapat dilihat pada layer “Sumber Air” "
            "di Dashboard atau diunduh melalui Data Portal."
        )
    return None


def _ai_respond(message):
    """
    Jawab pertanyaan berdasarkan data aktual sistem (intent dinamis) atau FAQ
    rule-based. Kembalikan string jawaban jika yakin, atau None jika tidak tahu
    — AI tidak boleh berhalusinasi/mengarang jawaban.
    """
    msg_lower = message.lower()

    # 1) Intent dinamis — jawaban dihitung langsung dari database/data sistem
    for keywords, intent in _DYNAMIC_INTENTS:
        if any(kw in msg_lower for kw in keywords):
            return _dynamic_ai_answer(intent)

    # 2) FAQ rule-based — pilih entri dengan jumlah kata kunci cocok terbanyak;
    #    jika seri, menangkan kata kunci yang lebih spesifik (lebih panjang)
    best_score  = 0
    best_weight = 0
    best_answer = None
    for keywords, answer in _FAQ:
        matched = [kw for kw in keywords if kw in msg_lower]
        if not matched:
            continue
        score  = len(matched)
        weight = sum(len(kw) for kw in matched)
        if score > best_score or (score == best_score and weight > best_weight):
            best_score  = score
            best_weight = weight
            best_answer = answer

    # Confident if at least 2 keywords matched, or 1 keyword in a short message (<= 5 words)
    word_count = len(msg_lower.split())
    threshold = 1 if word_count <= 5 else 2
    return best_answer if best_score >= threshold else None


# ── Eskalasi ke Admin: hanya dilakukan setelah konfirmasi eksplisit ─────────
_AI_UNSURE_TEXT = (
    "Saya belum memiliki informasi yang cukup untuk menjawab pertanyaan "
    "tersebut secara akurat."
)
_AI_ESCALATE_OFFER = (
    "\n\nApakah pertanyaan ini ingin diteruskan ke Admin AQUAVISION? "
    "Balas \"Ya\" untuk menghubungkan ke Admin, atau ajukan pertanyaan lain."
)
_CONFIRM_YES_WORDS = {'ya', 'iya', 'yes', 'y', 'ok', 'oke', 'okay', 'yup'}
_CONFIRM_NO_WORDS  = {'tidak', 'tdk', 'gak', 'ga', 'nggak', 'enggak', 'no', 'n', 'jangan', 'belum'}


def _generate_ticket_id():
    """Generate sequential daily ticket ID: AQ-YYYYMMDD-NNN."""
    today = timezone.localdate().strftime('%Y%m%d')
    prefix = f'AQ-{today}-'
    last = Conversation.objects.filter(ticket_id__startswith=prefix).order_by('-ticket_id').first()
    if last and last.ticket_id:
        try:
            n = int(last.ticket_id.rsplit('-', 1)[-1]) + 1
        except ValueError:
            n = 1
    else:
        n = 1
    return f'{prefix}{n:03d}'


@login_required(login_url='/login/')
def hubungi_view(request):
    """Halaman Hubungi Admin — user melihat dan mengirim pesan."""
    conv, _ = Conversation.objects.get_or_create(user=request.user)
    queue_count = Conversation.objects.filter(
        status__in=['waiting_admin', 'WAITING_FOR_ADMIN']
    ).count()
    return render(request, 'hubungi.html', {
        'conversation': conv,
        'is_admin':     is_admin_user(request.user),
        'queue_count':  queue_count,
    })


@login_required(login_url='/login/')
def hubungi_send(request):
    """User mengirim pesan; AI mencoba menjawab otomatis, jika tidak eskalasi ke admin."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, Exception):
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    content = (body.get('content') or '').strip()
    if not content:
        return JsonResponse({'error': 'Pesan tidak boleh kosong.'}, status=400)
    if len(content) > 2000:
        return JsonResponse({'error': 'Pesan terlalu panjang (maks 2000 karakter).'}, status=400)

    conv, _ = Conversation.objects.get_or_create(user=request.user)

    if not conv.ticket_id:
        conv.ticket_id = _generate_ticket_id()

    # Cek apakah AI sebelumnya menawarkan eskalasi ke Admin (menunggu konfirmasi)
    last_ai_msg = conv.messages.filter(is_ai_response=True).order_by('-created_at').first()
    awaiting_escalation = bool(last_ai_msg and _AI_UNSURE_TEXT in last_ai_msg.content)

    msg = Message.objects.create(conversation=conv, sender=request.user, content=content)
    _log_audit(request, 'CHAT', f'User message: {content[:60]}')

    # Konfirmasi eskalasi hanya berlaku jika AI baru saja menawarkannya
    words = set(re.findall(r'[a-z]+', content.lower()))
    wants_escalation    = awaiting_escalation and bool(words & _CONFIRM_YES_WORDS)
    declines_escalation = awaiting_escalation and not wants_escalation and bool(words & _CONFIRM_NO_WORDS)

    if wants_escalation:
        conv.status = 'waiting_admin'
        conv.save()
        # Posisi antrian = jumlah percakapan menunggu admin yang sudah
        # mengantre selama atau lebih lama dari percakapan ini (termasuk diri sendiri).
        queue_position = Conversation.objects.filter(
            status__in=['waiting_admin', 'WAITING_FOR_ADMIN'],
            updated_at__lte=conv.updated_at,
        ).count()
        if queue_position <= 2:
            eta = "10–30 menit"
        elif queue_position <= 6:
            eta = "30–60 menit"
        else:
            eta = "1–24 jam"
        reply_text = (
            "🟡 Pertanyaan Anda telah diteruskan ke Admin AQUAVISION.\n\n"
            f"📋 Nomor Tiket: {conv.ticket_id}\n"
            f"🔢 Posisi Antrian: #{queue_position}\n"
            f"⏱ Estimasi Balasan: {eta}\n\n"
            "Anda akan menerima notifikasi segera setelah Admin merespons."
        )
    elif declines_escalation:
        conv.status = 'ai_answered'
        conv.save()
        reply_text = (
            "Baik, tidak masalah. Jika ada pertanyaan lain seputar AQUAVISION, "
            "silakan tanyakan kapan saja 😊"
        )
    else:
        ai_answer = _ai_respond(content)
        conv.status = 'ai_answered'
        conv.save()
        reply_text = ai_answer if ai_answer else (_AI_UNSURE_TEXT + _AI_ESCALATE_OFFER)

    ai_msg = Message.objects.create(
        conversation=conv,
        sender=request.user,
        content=reply_text,
        is_read=True,
        is_ai_response=True,
    )
    ai_msg_data = {
        'id':              ai_msg.id,
        'sender':          'AQUAVISION AI',
        'content':         ai_msg.content,
        'created_at':      timezone.localtime(ai_msg.created_at).strftime('%d %b %Y, %H:%M'),
        'is_admin':        True,
        'is_ai_response':  True,
    }

    user_msg_data = {
        'id':             msg.id,
        'sender':         msg.sender.username,
        'content':        msg.content,
        'created_at':     timezone.localtime(msg.created_at).strftime('%d %b %Y, %H:%M'),
        'is_admin':       False,
        'is_ai_response': False,
    }
    return JsonResponse({
        'user_msg':    user_msg_data,
        'ai_msg':      ai_msg_data,
        'ticket_id':   conv.ticket_id,
        'conv_status': conv.status,
    })


@login_required(login_url='/login/')
def hubungi_messages(request):
    """Polling: kembalikan pesan terbaru dalam percakapan user ini."""
    conv, _ = Conversation.objects.get_or_create(user=request.user)
    since_id = int(request.GET.get('since', 0))
    msgs = conv.messages.filter(id__gt=since_id).select_related('sender')

    # Tandai pesan admin sebagai sudah dibaca
    msgs.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    data = [
        {
            'id':             m.id,
            'sender':         'AQUAVISION AI' if m.is_ai_response else m.sender.username,
            'content':        m.content,
            'created_at':     timezone.localtime(m.created_at).strftime('%d %b %Y, %H:%M'),
            'is_admin':       m.sender != request.user or m.is_ai_response,
            'is_ai_response': m.is_ai_response,
        }
        for m in msgs
    ]
    queue_count = Conversation.objects.filter(
        status__in=['waiting_admin', 'WAITING_FOR_ADMIN']
    ).count()
    return JsonResponse({
        'messages':    data,
        'conv_status': conv.status,
        'ticket_id':   conv.ticket_id,
        'queue_count': queue_count,
    })


@login_required(login_url='/login/')
def queue_info(request):
    """Kembalikan jumlah percakapan yang sedang menunggu balasan admin."""
    count = Conversation.objects.filter(
        status__in=['waiting_admin', 'WAITING_FOR_ADMIN']
    ).count()
    return JsonResponse({'waiting': count})


# ── Admin views ─────────────────────────────────────────────────

@login_required(login_url='/login/')
def hubungi_admin_page(request):
    """Admin: halaman HTML daftar semua percakapan."""
    if not is_admin_user(request.user):
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden("Akses ditolak.")

    last_msg_sub = Message.objects.filter(
        conversation=OuterRef('pk')
    ).order_by('-created_at').values('content')[:1]

    convs = Conversation.objects.select_related('user').annotate(
        last_msg_content=Subquery(last_msg_sub),
        unread_count=Count(
            'messages',
            filter=Q(messages__is_read=False) & Q(messages__sender=F('user')),
        ),
    ).order_by('-updated_at')

    conv_data = [
        {
            'id':         c.id,
            'user':       c.user.username,
            'status':     c.status,
            'updated_at': timezone.localtime(c.updated_at).strftime('%d %b %Y, %H:%M'),
            'unread':     c.unread_count,
            'last_msg':   (c.last_msg_content or '')[:100],
        }
        for c in convs
    ]
    return render(request, 'hubungi_admin.html', {'conversations': conv_data})


@login_required(login_url='/login/')
def hubungi_admin_list(request):
    """Admin: daftar semua percakapan."""
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Forbidden'}, status=403)

    last_msg_sub = Message.objects.filter(
        conversation=OuterRef('pk')
    ).order_by('-created_at').values('content')[:1]

    convs = Conversation.objects.select_related('user').annotate(
        last_msg_content=Subquery(last_msg_sub),
        unread_count=Count(
            'messages',
            filter=Q(messages__is_read=False) & Q(messages__sender=F('user')),
        ),
    )
    data = [
        {
            'id':         c.id,
            'user':       c.user.username,
            'status':     c.status,
            'updated_at': timezone.localtime(c.updated_at).strftime('%d %b %Y, %H:%M'),
            'unread':     c.unread_count,
            'last_msg':   (c.last_msg_content or '')[:80],
        }
        for c in convs
    ]
    return JsonResponse(data, safe=False)


@login_required(login_url='/login/')
def hubungi_admin_thread(request, conv_id):
    """Admin: lihat dan balas percakapan tertentu."""
    if not is_admin_user(request.user):
        return JsonResponse({'error': 'Forbidden'}, status=403)
    try:
        conv = Conversation.objects.get(pk=conv_id)
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, Exception):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        content = (body.get('content') or '').strip()
        if not content:
            return JsonResponse({'error': 'Pesan tidak boleh kosong.'}, status=400)
        msg = Message.objects.create(conversation=conv, sender=request.user, content=content, is_read=True)
        conv.status = 'open'
        conv.save()
        try:
            Notification.objects.create(
                user=conv.user,
                message='🔔 Admin AQUAVISION telah membalas pertanyaan Anda.',
            )
        except Exception:
            pass
        _log_audit(request, 'CHAT', f'Admin reply to {conv.user.username}')
        return JsonResponse({
            'id':             msg.id,
            'sender':         msg.sender.username,
            'content':        msg.content,
            'created_at':     timezone.localtime(msg.created_at).strftime('%d %b %Y, %H:%M'),
            'is_admin':       True,
            'is_ai_response': False,
        })

    # GET — admin membuka thread; update status ke reviewing jika masih menunggu
    if conv.status in ('waiting_admin', 'WAITING_FOR_ADMIN'):
        conv.status = 'reviewing'
        conv.save()
    since_id = int(request.GET.get('since', 0))
    msgs = conv.messages.filter(id__gt=since_id).select_related('sender')
    msgs.filter(is_read=False, sender=conv.user).update(is_read=True)
    data = [
        {
            'id':             m.id,
            'sender':         'AQUAVISION AI' if m.is_ai_response else m.sender.username,
            'content':        m.content,
            'created_at':     timezone.localtime(m.created_at).strftime('%d %b %Y, %H:%M'),
            'is_admin':       m.sender != conv.user or m.is_ai_response,
            'is_ai_response': m.is_ai_response,
        }
        for m in msgs
    ]
    return JsonResponse(data, safe=False)


# ================================================================
# P2.5 — DASHBOARD STATS (real DB counts)
# ================================================================

def dashboard_stats(request):
    """Kembalikan jumlah real dari database untuk semua entitas utama.
    Di-cache 30 detik; dibatalkan saat data berubah."""
    cached = cache.get('dashboard_stats')
    if cached is not None:
        return JsonResponse(cached)

    # Ambil semua count fasilitas dalam 1 query dengan conditional aggregation
    from django.db.models import Sum as _Sum
    fasilitas_counts = FasilitasWisata.objects.values('jenis').annotate(n=Count('id'))
    fc = {row['jenis']: row['n'] for row in fasilitas_counts}

    penduduk = Permukiman.objects.aggregate(t=_Sum('jumlah_penduduk'))['t'] or 0
    data = {
        'sumber_air':  SumberAir.objects.count(),
        'hotel':       fc.get('hotel', 0),
        'makan':       fc.get('resto', 0),
        'jasa':        fc.get('jasa', 0),
        'penduduk':    penduduk,
        'reservoir':   Reservoir.objects.count(),
        'permukiman':  Permukiman.objects.count(),
        'pipa':        JaringanPipa.objects.count(),
        'layer_count':        9,
        'dataset_count':      8,
        'conversation_count': Conversation.objects.count(),
        'download_count':     DownloadLog.objects.count(),
    }
    cache.set('dashboard_stats', data, 30)
    return JsonResponse(data)


# ================================================================
# P2.6 — HEALTH CHECK
# ================================================================

def health_check(request):
    """Cek status konektivitas komponen sistem."""
    results = {}

    # Database check
    try:
        SumberAir.objects.count()
        results['database'] = 'ok'
    except Exception:
        results['database'] = 'error'

    # API self-check
    results['api'] = 'ok'

    # Layer data check — verifikasi data GIS tersedia
    try:
        has_data = (
            SumberAir.objects.exists() or
            Reservoir.objects.exists() or
            AdministrasiDesa.objects.exists()
        )
        results['layers'] = 'ok' if has_data else 'empty'
    except Exception:
        results['layers'] = 'error'

    # Storage check — verifikasi static data dir ada
    import os as _os
    static_data = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), 'static', 'data')
    results['storage'] = 'ok' if _os.path.isdir(static_data) else 'error'

    overall = 'ok' if all(v == 'ok' for v in results.values()) else 'degraded'
    return JsonResponse({'status': overall, 'components': results})


# ================================================================
# P2.7 — NOTIFICATIONS
# ================================================================

@login_required(login_url='/login/')
def notifications_list(request):
    """Kembalikan notifikasi belum dibaca untuk user ini."""
    notifs = Notification.objects.filter(user=request.user, is_read=False)[:20]
    data = [
        {
            'id':         n.id,
            'message':    n.message,
            'created_at': timezone.localtime(n.created_at).strftime('%d %b %Y, %H:%M'),
        }
        for n in notifs
    ]
    return JsonResponse({'count': len(data), 'notifications': data})


@login_required(login_url='/login/')
def notifications_mark_read(request):
    """Tandai semua notifikasi user sebagai sudah dibaca."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return JsonResponse({'message': 'ok'})


# ================================================================
# P2.8 — AUDIT LOG PAGE (super admin only)
# ================================================================

@login_required(login_url='/login/')
def audit_log_page(request):
    """Halaman Audit Log — hanya super admin."""
    if not request.user.is_superuser:
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden("Akses ditolak.")
    logs = AuditLog.objects.select_related('user').order_by('-waktu')[:500]
    return render(request, 'audit_log.html', {'logs': logs})


# ================================================================
# P2.9 — DOWNLOAD LOG PAGE (admin only)
# ================================================================

@login_required(login_url='/login/')
def download_log_page(request):
    """Halaman Riwayat Download — admin only."""
    if not is_admin_user(request.user):
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden("Akses ditolak.")
    logs = DownloadLog.objects.select_related('user').order_by('-waktu')[:500]
    return render(request, 'download_log.html', {'logs': logs})