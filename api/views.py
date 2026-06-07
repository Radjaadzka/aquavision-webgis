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
    import shapefile
except ImportError:
    shapefile = None

# Django
from django.contrib.auth.decorators  import login_required
from django.contrib.gis.gdal         import DataSource
from django.contrib.gis.geos         import GEOSGeometry, MultiLineString, MultiPolygon, Point
from django.core.paginator           import Paginator
from django.core.serializers         import serialize
from django.db.models                import ExpressionWrapper, F, FloatField, Q, Sum
from django.http                     import HttpResponse, JsonResponse
from django.shortcuts                import redirect, render
from django.utils                    import timezone

# Django REST Framework
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Local
from .models import (
    AdministrasiDesa,
    CatchmentArea,
    Feedback,
    FasilitasWisata,
    JaringanPipa,
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

@login_required
def sumber_air_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', SumberAir.objects.all())), safe=False)

@login_required
def fasilitas_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', FasilitasWisata.objects.all())), safe=False)

@login_required
def permukiman_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', Permukiman.objects.all())), safe=False)

@login_required
def administrasi_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', AdministrasiDesa.objects.all())), safe=False)

@login_required
def recharge_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', RechargeArea.objects.all())), safe=False)

@login_required
def catchment_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', CatchmentArea.objects.all())), safe=False)

@login_required
def jaringan_pipa_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', JaringanPipa.objects.all())), safe=False)

@login_required
def reservoir_geojson(request):
    return JsonResponse(json.loads(serialize('geojson', Reservoir.objects.all())), safe=False)


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
        return JsonResponse({'message': 'Reservoir berhasil disimpan'}, status=201)
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

            return JsonResponse({'message': msg, 'count': count, 'errors': errors[:5]}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ================================================================
# INFORMASI DEBIT — aggregate query, bukan loop Python
# ================================================================

def informasi_debit(request):
    total_debit = SumberAir.objects.aggregate(total=Sum('debit'))['total'] or 0
    supply_m3   = total_debit * 86.4

    sim_hotel     = request.GET.get('hotel')
    sim_penduduk  = request.GET.get('penduduk')
    sim_resto     = request.GET.get('resto')
    sim_pertanian = request.GET.get('pertanian')

    if any([sim_hotel, sim_penduduk, sim_resto, sim_pertanian]):
        # Mode simulasi — validasi input agar tidak crash
        demand_m3 = (
            safe_int(sim_penduduk)  * 0.12
            + safe_int(sim_hotel)   * 0.25
            + safe_int(sim_resto)   * 0.025
            + safe_int(sim_pertanian) * 86.4  # 1 L/dtk/ha × 86400 dtk = 86400 L = 86.4 m³
        )
    else:
        # Mode real — satu query per tipe, bukan Python loop
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

    return JsonResponse({
        'ketersediaan_m3':    round(supply_m3,   2),
        'kebutuhan_m3':       round(demand_m3,   2),
        'selisih_m3':         round(selisih,      2),
        'pemanfaatan_persen': round(persen,        1),
        'status':             status_str,
        'total_debit_ldetik': round(total_debit,  2),
    })


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
        {'name': 'Recharge Area Desa Wonotoro',  'slug': 'recharge',     'model': RechargeArea,
         'description': 'Zona daerah resapan air tanah'},
        {'name': 'Catchment Area Desa Wonotoro', 'slug': 'catchment',    'model': CatchmentArea,
         'description': 'Wilayah daerah tangkapan air'},
        {'name': 'Jaringan Pipa',                'slug': 'pipa',         'model': JaringanPipa,
         'description': 'Data jaringan pipa distribusi air'},
        {'name': 'Reservoir',                    'slug': 'reservoir',    'model': Reservoir,
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

    for d in datasets:
        d['count'] = d['model'].objects.count()

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
        data  = json.loads(request.body)
        nama  = str(data.get('nama',  '')).strip()[:100]
        pesan = str(data.get('pesan', '')).strip()[:1000]

        if not nama or not pesan:
            return JsonResponse({'error': 'Nama dan pesan wajib diisi'}, status=400)

        Feedback.objects.create(nama=nama, pesan=pesan)
        return JsonResponse({'message': 'Terima kasih atas masukan Anda!'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def feedback_list(request):
    """Kembalikan 10 feedback terbaru."""
    feedbacks = Feedback.objects.order_by('-tanggal')[:10].values('nama', 'pesan', 'tanggal')
    data = [
        {
            'nama':    f['nama'],
            'pesan':   f['pesan'],
            'tanggal': timezone.localtime(f['tanggal']).strftime('%d %b %Y') if f['tanggal'] else '-',
        }
        for f in feedbacks
    ]
    return JsonResponse(data, safe=False)