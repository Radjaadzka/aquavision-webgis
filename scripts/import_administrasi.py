"""
Script import SHP Administrasi Desa ke PostgreSQL/PostGIS
Jalankan: python manage.py shell < import_administrasi.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from api.models import AdministrasiDesa

SHP_PATH = os.path.join('static', 'data', 'shp_sekitar_wonotoro.shp')


def import_shp():
    if not os.path.exists(SHP_PATH):
        print(f"File tidak ditemukan: {SHP_PATH}")
        return

    # Hapus data lama
    count_old = AdministrasiDesa.objects.count()
    if count_old > 0:
        AdministrasiDesa.objects.all().delete()
        print(f"Hapus {count_old} data lama")

    ds = DataSource(SHP_PATH)
    layer = ds[0]

    print(f"Membaca {len(layer)} fitur dari {SHP_PATH}")
    print(f"Geometry type: {layer.geom_type}")
    print()

    # Get field names as list of strings
    field_names = list(layer.fields)
    print(f"Fields: {field_names}")
    print()

    count = 0
    for feature in layer:
        # Ambil geometry sebagai WKT
        geom_wkt = feature.geom.wkt

        # Strip Z coordinate dari WKT jika ada POLYGON Z atau MULTIPOLYGON Z
        # Contoh: "POLYGON Z ((x y z, ...))" -> "POLYGON ((x y, ...))"
        import re
        # Remove Z from geometry type
        geom_wkt_2d = re.sub(r'(POLYGON|MULTIPOLYGON|LINESTRING|POINT)\s*Z\s*', r'\1 ', geom_wkt)
        # Remove third coordinate (z value) from coordinate tuples
        # Pattern: number number number -> number number
        geom_wkt_2d = re.sub(r'(\-?\d+\.?\d*)\s+(\-?\d+\.?\d*)\s+\-?\d+\.?\d*', r'\1 \2', geom_wkt_2d)

        try:
            geos_geom = GEOSGeometry(geom_wkt_2d)
        except Exception as e:
            print(f"  Error parsing geometry: {e}")
            continue

        # Pastikan MultiPolygon
        if geos_geom.geom_type == 'Polygon':
            geos_geom = MultiPolygon(geos_geom)

        # Set SRID dari source (UTM 49S = 32749)
        geos_geom.srid = 32749

        # Transform ke WGS84
        geos_geom.transform(4326)

        # Ambil atribut
        def get_val(name):
            try:
                if name in field_names:
                    val = feature.get(name)
                    if val and str(val).strip():
                        return str(val).strip()
                return None
            except:
                return None

        def get_num(name):
            try:
                if name in field_names:
                    val = feature.get(name)
                    if val is not None:
                        return float(val)
                return None
            except:
                return None

        obj = AdministrasiDesa(
            namobj=get_val('NAMOBJ'),
            remark=get_val('REMARK'),
            wadmkd=get_val('WADMKD'),
            wadmkc=get_val('WADMKC'),
            wadmkk=get_val('WADMKK'),
            wadmpr=get_val('WADMPR'),
            luas=get_num('LUAS'),
            geom=geos_geom,
        )
        obj.save()
        count += 1
        print(f"  [{count}] {obj.wadmkd or obj.namobj}")

    print(f"\nSelesai! {count} desa berhasil diimport.")


import_shp()