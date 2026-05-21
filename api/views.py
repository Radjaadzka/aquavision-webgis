# ==================================================
# IMPORTS
# ==================================================

import json
import csv
import math
import os
import tempfile
import zipfile

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.core.serializers import serialize
from django.db.models import Sum, Q
from django.core.paginator import Paginator
from django.forms.models import model_to_dict
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from .models import Feedback

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework import status

from .models import (
    SumberAir,
    FasilitasWisata,
    Permukiman,
    RechargeArea,
    CatchmentArea,
    JaringanPipa,
    Reservoir,
    AdministrasiDesa,
)

MODEL_MAP = {
    "sumberair": SumberAir,
    "permukiman": Permukiman,
    "fasilitas": FasilitasWisata,
    "recharge": RechargeArea,
    "catchment": CatchmentArea,
    "pipa": JaringanPipa,
    "reservoir": Reservoir,
    "administrasi": AdministrasiDesa,
}

# Datasets that only admin/superadmin can see in data portal
ADMIN_ONLY_DATASETS = ["catchment", "recharge", "pipa"]


# ==================================================
# HELPER
# ==================================================

def is_admin_user(user):
    return user.is_superuser or user.groups.filter(name="Admin").exists()


def get_role_fields(model, user):
    """Return field list based on user role."""
    if is_admin_user(user):
        return getattr(model, 'ADMIN_FIELDS', None)
    return getattr(model, 'USER_FIELDS', None)


def latlon_from_geom(geom):
    if not geom:
        return {}, {}
    lon = round(geom.x, 6)
    lat = round(geom.y, 6)
    zone = 49
    k0 = 0.9996
    a = 6378137.0
    e = 0.0818192
    e2 = e * e
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    lon0 = math.radians((zone - 1) * 6 - 180 + 3)
    N = a / math.sqrt(1 - e2 * math.sin(lat_rad)**2)
    T = math.tan(lat_rad)**2
    C = (e2 / (1 - e2)) * math.cos(lat_rad)**2
    A_val = math.cos(lat_rad) * (lon_rad - lon0)
    M = a * ((1 - e2/4 - 3*e2**2/64) * lat_rad
             - (3*e2/8 + 3*e2**2/32) * math.sin(2*lat_rad)
             + (15*e2**2/256) * math.sin(4*lat_rad))
    easting = k0 * N * (A_val + (1-T+C)*A_val**3/6) + 500000
    northing = k0 * (M + N * math.tan(lat_rad) * (A_val**2/2 + (5-T+9*C+4*C**2)*A_val**4/24))
    if lat < 0:
        northing += 10000000
    return (
        {"lat": lat, "lon": lon},
        {"easting": round(easting, 2), "northing": round(northing, 2)}
    )


# ==================================================
# LANDING & MAP
# ==================================================

def landing_page(request):
    return render(request, "landing.html", {
        "jumlah_air": SumberAir.objects.count(),
        "jumlah_fasilitas": FasilitasWisata.objects.count(),
        "jumlah_permukiman": Permukiman.objects.count(),
    })


def map_view(request):
    is_admin = is_admin_user(request.user) if request.user.is_authenticated else False
    return render(request, "index.html", {"is_admin": is_admin})


# ==================================================
# CUSTOM PERMISSION
# ==================================================

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and is_admin_user(request.user)


# ==================================================
# AUTH API
# ==================================================

@api_view(['POST'])
@csrf_exempt
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        role = "superadmin" if user.is_superuser else ("admin" if user.groups.filter(name="Admin").exists() else "user")
        return Response({"username": user.username, "role": role})
    return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({"message": "Logged out successfully"})


# ==================================================
# GEOJSON ENDPOINTS
# ==================================================

@login_required
def sumber_air_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", SumberAir.objects.all())), safe=False)

@login_required
def fasilitas_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", FasilitasWisata.objects.all())), safe=False)

@login_required
def permukiman_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", Permukiman.objects.all())), safe=False)

@login_required
def administrasi_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", AdministrasiDesa.objects.all())), safe=False)

@login_required
def recharge_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", RechargeArea.objects.all())), safe=False)

@login_required
def catchment_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", CatchmentArea.objects.all())), safe=False)

@login_required
def jaringan_pipa_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", JaringanPipa.objects.all())), safe=False)

@login_required
def reservoir_geojson(request):
    return JsonResponse(json.loads(serialize("geojson", Reservoir.objects.all())), safe=False)


# ==================================================
# CREATE DATA (ADMIN ONLY)
# ==================================================

@csrf_exempt
@login_required
def create_sumber_air(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    try:
        data = json.loads(request.body)
        point = Point(float(data["lng"]), float(data["lat"]), srid=4326)
        SumberAir.objects.create(
            nama=data.get("nama", ""), debit=float(data.get("debit", 0)),
            jenis_sumber=data.get("jenis_sumber", ""), lokasi=point,
        )
        return JsonResponse({"message": "Sumber air berhasil disimpan"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@login_required
def create_fasilitas(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    try:
        data = json.loads(request.body)
        point = Point(float(data["lng"]), float(data["lat"]), srid=4326)
        FasilitasWisata.objects.create(
            nama=data.get("nama", ""), jenis=data.get("jenis", ""),
            kamar=data.get("kamar") or None, kapasitas=data.get("kapasitas") or None,
            lokasi=point,
        )
        return JsonResponse({"message": "Fasilitas berhasil disimpan"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@login_required
def create_permukiman(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    try:
        data = json.loads(request.body)
        point = Point(float(data["lng"]), float(data["lat"]), srid=4326)
        Permukiman.objects.create(
            nama_dusun=data.get("nama", ""), jumlah_kk=int(data.get("jumlah_kk", 0)),
            jumlah_penduduk=int(data.get("jumlah_penduduk", 0)), lokasi=point,
        )
        return JsonResponse({"message": "Permukiman berhasil disimpan"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@login_required
def create_reservoir(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    try:
        data = json.loads(request.body)
        point = Point(float(data["lng"]), float(data["lat"]), srid=4326)
        Reservoir.objects.create(
            nama=data.get("nama", ""), kapasitas_m3=float(data.get("kapasitas_m3", 0)),
            elevasi=float(data.get("elevasi", 0)) if data.get("elevasi") else None,
            lokasi=point,
        )
        return JsonResponse({"message": "Reservoir berhasil disimpan"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

#feedback
@csrf_exempt
def submit_feedback(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        nama = data.get("nama", "").strip()
        pesan = data.get("pesan", "").strip()
        if not nama or not pesan:
            return JsonResponse({"error": "Nama dan pesan wajib diisi"}, status=400)
        Feedback.objects.create(nama=nama, pesan=pesan)
        return JsonResponse({"message": "Terima kasih atas masukan Anda!"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_feedback(request):
    feedbacks = Feedback.objects.all()[:10]
    data = [{"nama": f.nama, "pesan": f.pesan, "tanggal": f.tanggal.strftime("%d %b %Y")} for f in feedbacks]
    return JsonResponse(data, safe=False)
# ==================================================
# EDIT DATA (ADMIN ONLY)
# ==================================================

@csrf_exempt
@login_required
def edit_data(request, model_name, pk):
    if request.method != "PUT":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"}, status=404)

    try:
        obj = model.objects.get(pk=pk)
        data = json.loads(request.body)

        for key, value in data.items():
            if key in ('lat', 'lng'):
                continue
            if hasattr(obj, key):
                setattr(obj, key, value)

        # Update lokasi if lat/lng provided
        if 'lat' in data and 'lng' in data:
            geo_field = None
            for field in model._meta.fields:
                if hasattr(field, 'geom_type') and field.geom_type == 'POINT':
                    geo_field = field.name
                    break
            if geo_field:
                point = Point(float(data['lng']), float(data['lat']), srid=4326)
                setattr(obj, geo_field, point)

        obj.save()
        return JsonResponse({"message": "Data berhasil diperbarui"})
    except model.DoesNotExist:
        return JsonResponse({"error": "Data tidak ditemukan"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ==================================================
# DELETE DATA (ADMIN ONLY)
# ==================================================

@csrf_exempt
@login_required
def delete_data(request, model_name, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"}, status=404)

    try:
        obj = model.objects.get(pk=pk)
        obj.delete()
        return JsonResponse({"message": "Data berhasil dihapus"})
    except model.DoesNotExist:
        return JsonResponse({"error": "Data tidak ditemukan"}, status=404)


# ==================================================
# UPLOAD SHP (ADMIN ONLY)
# ==================================================

@csrf_exempt
@login_required
def upload_shp(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not is_admin_user(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    target = request.POST.get("target")
    if not target or target not in MODEL_MAP:
        return JsonResponse({"error": "Target dataset tidak valid"}, status=400)

    model = MODEL_MAP[target]

    # Check uploaded files — need .shp, .shx, .dbf minimum
    files = request.FILES
    shp_file = files.get("shp")
    shx_file = files.get("shx")
    dbf_file = files.get("dbf")
    prj_file = files.get("prj")

    if not shp_file or not shx_file or not dbf_file:
        return JsonResponse({"error": "Upload file .shp, .shx, dan .dbf (minimal)"}, status=400)

    # Save to temp dir
    import shutil
    tmp_dir = tempfile.mkdtemp()
    base_name = "upload"

    for ext, f in [("shp", shp_file), ("shx", shx_file), ("dbf", dbf_file)]:
        path = os.path.join(tmp_dir, f"{base_name}.{ext}")
        with open(path, "wb") as dest:
            for chunk in f.chunks():
                dest.write(chunk)

    if prj_file:
        path = os.path.join(tmp_dir, f"{base_name}.prj")
        with open(path, "wb") as dest:
            for chunk in prj_file.chunks():
                dest.write(chunk)

    try:
        from django.contrib.gis.gdal import DataSource
        from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, MultiLineString

        shp_path = os.path.join(tmp_dir, f"{base_name}.shp")
        ds = DataSource(shp_path)
        layer = ds[0]

        field_names = list(layer.fields)

        # Detect geometry field in model
        geo_field = None
        for field in model._meta.fields:
            if hasattr(field, 'geom_type'):
                geo_field = field.name
                break

        if not geo_field:
            return JsonResponse({"error": "Model tidak memiliki field geometri"}, status=400)

        # Get model field names (non-geo, non-id)
        model_fields = {}
        for f in model._meta.fields:
            if f.name != 'id' and not hasattr(f, 'geom_type'):
                model_fields[f.name.lower()] = f.name

        count = 0
        errors = []

        for feature in layer:
            try:
                # Process geometry
                import re
                geom_wkt = feature.geom.wkt
                geom_wkt_2d = re.sub(r'(POLYGON|MULTIPOLYGON|LINESTRING|MULTILINESTRING|POINT|MULTIPOINT)\s*Z\s*', r'\1 ', geom_wkt)
                geom_wkt_2d = re.sub(r'(\-?\d+\.?\d*)\s+(\-?\d+\.?\d*)\s+\-?\d+\.?\d*', r'\1 \2', geom_wkt_2d)

                geos_geom = GEOSGeometry(geom_wkt_2d)

                # Ensure correct geometry type
                target_type = type(model._meta.get_field(geo_field))
                target_type_name = target_type.__name__

                if target_type_name == 'MultiPolygonField' and geos_geom.geom_type == 'Polygon':
                    geos_geom = MultiPolygon(geos_geom)
                elif target_type_name == 'MultiLineStringField' and geos_geom.geom_type == 'LineString':
                    from django.contrib.gis.geos import MultiLineString as MLS
                    geos_geom = MLS(geos_geom)

                # Set/transform SRID
                if layer.srs:
                    srid = layer.srs.srid
                    if srid:
                        geos_geom.srid = srid
                        if srid != 4326:
                            geos_geom.transform(4326)
                    else:
                        geos_geom.srid = 4326
                else:
                    geos_geom.srid = 4326

                # Build kwargs
                kwargs = {geo_field: geos_geom}

                # Map SHP attributes to model fields
                for shp_field in field_names:
                    shp_lower = shp_field.lower()
                    if shp_lower in model_fields:
                        try:
                            val = feature.get(shp_field)
                            if val is not None and str(val).strip():
                                kwargs[model_fields[shp_lower]] = val
                        except:
                            pass

                    # Try common mappings
                    mapping = {
                        'nama': ['nama', 'name', 'namobj', 'wadmkd'],
                        'nama_dusun': ['nama', 'name', 'dusun'],
                        'kondisi': ['kondisi', 'condition', 'status'],
                        'luas_ha': ['luas', 'luas_ha', 'area', 'luaswh'],
                        'kelas_potensi': ['kelas', 'potensi', 'class'],
                    }
                    for model_key, shp_aliases in mapping.items():
                        if model_key in model_fields and model_fields[model_key] not in kwargs:
                            if shp_lower in shp_aliases:
                                try:
                                    val = feature.get(shp_field)
                                    if val is not None and str(val).strip():
                                        kwargs[model_fields[model_key]] = str(val).strip()
                                except:
                                    pass

                model.objects.create(**kwargs)
                count += 1

            except Exception as e:
                errors.append(str(e))

        shutil.rmtree(tmp_dir, ignore_errors=True)

        msg = f"{count} data berhasil diimport"
        if errors:
            msg += f" ({len(errors)} gagal)"

        return JsonResponse({"message": msg, "count": count, "errors": errors[:5]}, status=201)

    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        return JsonResponse({"error": str(e)}, status=400)


# ==================================================
# INFORMASI DEBIT AIR
# ==================================================

def informasi_debit(request):
    total_debit = SumberAir.objects.aggregate(total=Sum("debit"))["total"] or 0
    supply_m3 = total_debit * 86.4  # L/detik → m³/hari

    sim_hotel = request.GET.get("hotel")
    sim_penduduk = request.GET.get("penduduk")
    sim_resto = request.GET.get("resto")
    sim_pertanian = request.GET.get("pertanian")

    if sim_hotel or sim_penduduk or sim_resto or sim_pertanian:
        demand_m3 = (
            int(sim_penduduk or 0) * 0.06 +      # 60 L/orang/hari = 0.06 m³
            int(sim_hotel or 0) * 0.15 +           # 150 L/kamar/hari = 0.15 m³
            int(sim_resto or 0) * 0.1 +            # 100 L/kursi/hari = 0.1 m³
            float(sim_pertanian or 0) * 86.4       # 1 L/detik/ha = 86.4 m³/hari/ha
        )
    else:
        total_domestik = sum((p.jumlah_penduduk or 0) * 0.06 for p in Permukiman.objects.all())
        total_hotel = sum((f.kamar or 0) * 0.15 for f in FasilitasWisata.objects.filter(jenis__in=["hotel","homestay"]))
        total_resto = sum((f.kapasitas or 0) * 0.1 for f in FasilitasWisata.objects.filter(jenis="resto"))
        demand_m3 = total_domestik + total_hotel + total_resto

    selisih = supply_m3 - demand_m3
    persen = (demand_m3 / supply_m3 * 100) if supply_m3 > 0 else 0

    if persen < 50:
        st = "AMAN"
    elif persen < 80:
        st = "WASPADA"
    else:
        st = "KRITIS"

    return JsonResponse({
        "ketersediaan_m3": round(supply_m3, 2),
        "kebutuhan_m3": round(demand_m3, 2),
        "selisih_m3": round(selisih, 2),
        "pemanfaatan_persen": round(persen, 1),
        "status": st,
        "total_debit_ldetik": round(total_debit, 2),
    })


# ==================================================
# DATA PORTAL — LIST (role-based)
# ==================================================

@login_required
def data_list(request):
    all_datasets = [
        {"name": "Sumber Air", "slug": "sumberair", "model": SumberAir,
         "description": "Data titik sumber air beserta debit dan kondisi"},
        {"name": "Permukiman", "slug": "permukiman", "model": Permukiman,
         "description": "Data lokasi permukiman dan jumlah penduduk"},
        {"name": "Fasilitas Wisata", "slug": "fasilitas", "model": FasilitasWisata,
         "description": "Data hotel, restoran, dan jasa"},
        {"name": "Daerah Resapan Air Area Desa Wonotoro", "slug": "recharge", "model": RechargeArea,
         "description": "Zona daerah resapan air tanah"},
        {"name": "Daerah Tangkapan Air Desa Wonotoro", "slug": "catchment", "model": CatchmentArea,
         "description": "Wilayah daerah tangkapan air"},
        {"name": "Jaringan Pipa", "slug": "pipa", "model": JaringanPipa,
         "description": "Data jaringan pipa distribusi air"},
        {"name": "Reservoir", "slug": "reservoir", "model": Reservoir,
         "description": "Data lokasi dan kapasitas tandon air"},
        {"name": "Administrasi Desa", "slug": "administrasi", "model": AdministrasiDesa,
         "description": "Batas administrasi desa sekitar Wonotoro"},
    ]

    admin = is_admin_user(request.user)

    # Filter datasets based on role
    if admin:
        datasets = all_datasets
    else:
        datasets = [d for d in all_datasets if d["slug"] not in ADMIN_ONLY_DATASETS]

    query = request.GET.get("q")
    if query:
        datasets = [d for d in datasets if query.lower() in d["name"].lower()]

    for d in datasets:
        d["count"] = d["model"].objects.count()

    return render(request, "data_list.html", {
        "datasets": datasets,
        "query": query,
        "is_admin": admin,
    })


# ==================================================
# DATA PORTAL — DETAIL (role-based fields)
# ==================================================

@login_required
def dataset_detail(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"})

    admin = is_admin_user(request.user)

    # Block user from admin-only datasets
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({"error": "Anda tidak memiliki akses ke dataset ini"}, status=403)

    objects = model.objects.all()

    query = request.GET.get("q")
    if query:
        char_fields = [f.name for f in model._meta.fields if f.get_internal_type() == "CharField"]
        q_filter = Q()
        for field in char_fields:
            q_filter |= Q(**{f"{field}__icontains": query})
        objects = objects.filter(q_filter)

    total_records = objects.count()
    paginator = Paginator(objects, 20)
    page_obj = paginator.get_page(request.GET.get("page"))

    # Get role-based fields
    role_fields = get_role_fields(model, request.user)

    # If model doesn't have field config, fallback to all fields with coord split
    if role_fields is None:
        geo_field = None
        geo_type = None
        for field in model._meta.fields:
            if hasattr(field, 'geom_type'):
                geo_field = field.name
                geo_type = field.geom_type
                break

        role_fields = []
        for field in model._meta.fields:
            if field.name == geo_field:
                if geo_type == 'POINT':
                    role_fields.extend(["lat", "lon", "easting", "northing"])
            else:
                role_fields.append(field.name)

    # Build data rows based on role fields
    data_rows = []
    for obj in page_obj:
        row = {}
        for fname in role_fields:
            if fname in ('lat', 'lon', 'easting', 'northing'):
                # Find geometry field
                geo_field = None
                for field in model._meta.fields:
                    if hasattr(field, 'geom_type'):
                        geo_field = field.name
                        break
                if geo_field:
                    geom = getattr(obj, geo_field)
                    ll, utm = latlon_from_geom(geom)
                    row["lat"] = ll.get("lat", "-")
                    row["lon"] = ll.get("lon", "-")
                    row["easting"] = utm.get("easting", "-")
                    row["northing"] = utm.get("northing", "-")
            elif hasattr(obj, fname):
                row[fname] = getattr(obj, fname)
            else:
                row[fname] = "-"
        data_rows.append(row)

    return render(request, "dataset_detail.html", {
        "model_name": model_name,
        "fields": role_fields,
        "data_rows": data_rows,
        "page_obj": page_obj,
        "total_records": total_records,
        "is_admin": admin,
    })


# ==================================================
# DOWNLOAD CSV (role-based)
# ==================================================

@login_required
def download_csv(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"})

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    role_fields = get_role_fields(model, request.user)

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{model_name}.csv"'

    writer = csv.writer(response)

    if role_fields:
        writer.writerow(role_fields)
        geo_field = None
        for field in model._meta.fields:
            if hasattr(field, 'geom_type'):
                geo_field = field.name
                break

        for obj in model.objects.all():
            row = []
            for fname in role_fields:
                if fname in ('lat', 'lon', 'easting', 'northing') and geo_field:
                    geom = getattr(obj, geo_field)
                    ll, utm = latlon_from_geom(geom)
                    if fname == 'lat': row.append(ll.get("lat", ""))
                    elif fname == 'lon': row.append(ll.get("lon", ""))
                    elif fname == 'easting': row.append(utm.get("easting", ""))
                    elif fname == 'northing': row.append(utm.get("northing", ""))
                elif hasattr(obj, fname):
                    row.append(getattr(obj, fname))
                else:
                    row.append("")
            writer.writerow(row)
    else:
        fields = [f.name for f in model._meta.fields]
        writer.writerow(fields)
        for obj in model.objects.all():
            writer.writerow([getattr(obj, f) for f in fields])

    return response


# ==================================================
# DOWNLOAD GEOJSON
# ==================================================

@login_required
def download_geojson(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"})

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    data = serialize("geojson", model.objects.all())
    response = HttpResponse(data, content_type="application/json")
    response["Content-Disposition"] = f'attachment; filename="{model_name}.geojson"'
    return response


# ==================================================
# DOWNLOAD KML
# ==================================================

@login_required
def download_kml(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"})

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    geo_field = None
    for field in model._meta.fields:
        if hasattr(field, 'geom_type'):
            geo_field = field.name
            break

    name_field = None
    for field in model._meta.fields:
        if field.name in ('nama', 'nama_dusun', 'wadmkd', 'namobj'):
            name_field = field.name
            break

    kml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '<Document>',
        f'<name>{model_name}</name>',
    ]

    for obj in model.objects.all():
        geom = getattr(obj, geo_field, None)
        if not geom:
            continue
        obj_name = getattr(obj, name_field, str(obj)) if name_field else str(obj)
        geom_4326 = geom.transform(4326, clone=True) if geom.srid != 4326 else geom
        kml_lines.append('<Placemark>')
        kml_lines.append(f'<name>{obj_name}</name>')
        kml_lines.append(geom_4326.kml)
        kml_lines.append('</Placemark>')

    kml_lines.extend(['</Document>', '</kml>'])

    response = HttpResponse('\n'.join(kml_lines), content_type="application/vnd.google-earth.kml+xml")
    response["Content-Disposition"] = f'attachment; filename="{model_name}.kml"'
    return response


# ==================================================
# DOWNLOAD SHP (pyshp)
# ==================================================

@login_required
def download_shp(request, model_name):
    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": "Dataset tidak ditemukan"})

    admin = is_admin_user(request.user)
    if not admin and model_name in ADMIN_ONLY_DATASETS:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    geo_field = None
    for field in model._meta.fields:
        if hasattr(field, 'geom_type'):
            geo_field = field.name
            break
    if not geo_field:
        return JsonResponse({"error": "No geometry field"})

    try:
        import shapefile
    except ImportError:
        return JsonResponse({"error": "pyshp belum terinstall"}, status=500)

    attr_fields = [f for f in model._meta.fields if f.name != geo_field and f.name != 'id' and not hasattr(f, 'geom_type')]

    geo_type_name = type([f for f in model._meta.fields if f.name == geo_field][0]).__name__
    shp_type_map = {
        'PointField': shapefile.POINT, 'MultiPointField': shapefile.MULTIPOINT,
        'LineStringField': shapefile.POLYLINE, 'MultiLineStringField': shapefile.POLYLINE,
        'PolygonField': shapefile.POLYGON, 'MultiPolygonField': shapefile.POLYGON,
    }
    shp_type = shp_type_map.get(geo_type_name, shapefile.POINT)

    tmp_dir = tempfile.mkdtemp()
    shp_path = os.path.join(tmp_dir, model_name)
    w = shapefile.Writer(shp_path, shapeType=shp_type)

    for f in attr_fields:
        fname = f.name[:10]
        internal = f.get_internal_type()
        if internal in ('IntegerField',):
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

        geojson = json.loads(geom.geojson)
        gt, coords = geojson['type'], geojson['coordinates']

        if gt == 'Point': w.point(*coords)
        elif gt == 'MultiPoint': w.multipoint(coords)
        elif gt == 'LineString': w.line([coords])
        elif gt == 'MultiLineString': w.line(coords)
        elif gt == 'Polygon': w.poly(coords)
        elif gt == 'MultiPolygon':
            parts = [ring for polygon in coords for ring in polygon]
            w.poly(parts)

        values = []
        for f in attr_fields:
            val = getattr(obj, f.name)
            values.append(str(val) if val is not None and not isinstance(val, (int, float)) else (val if val is not None else ""))
        w.record(*values)

    w.close()

    with open(shp_path + '.prj', 'w') as prj:
        prj.write('GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]')

    zip_path = os.path.join(tmp_dir, f"{model_name}_shp.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for ext in ['shp', 'shx', 'dbf', 'prj', 'cpg']:
            fp = f"{shp_path}.{ext}"
            if os.path.exists(fp):
                zf.write(fp, f"{model_name}.{ext}")

    with open(zip_path, 'rb') as f:
        response = HttpResponse(f.read(), content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="{model_name}_shp.zip"'

    import shutil
    shutil.rmtree(tmp_dir, ignore_errors=True)
    return response