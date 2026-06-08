"""
Import SUNGAI_LN_25K ke database
Jalankan: python import_sungai.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, MultiLineString
from api.models import Sungai
import re

ds = DataSource('static/data/SUNGAI.shp')
layer = ds[0]
count = 0
errors = 0

Sungai.objects.all().delete()
print("Existing data deleted")

for feature in layer:
    try:
        wkt = feature.geom.wkt
        # Strip Z coordinates
        wkt = re.sub(r'LINESTRING\s+Z\s*', 'LINESTRING ', wkt)
        wkt = re.sub(r'MULTILINESTRING\s+Z\s*', 'MULTILINESTRING ', wkt)
        wkt = re.sub(r'(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+-?\d+\.?\d*', r'\1 \2', wkt)

        geom = GEOSGeometry(wkt, srid=4326)
        if geom.geom_type == 'LineString':
            geom = MultiLineString(geom, srid=4326)

        Sungai.objects.create(
            nama=str(feature.get('NAMOBJ') or ''),
            tipe=str(feature.get('TIPSNG') or ''),
            kelas=str(feature.get('KLSSNG') or ''),
            das=str(feature.get('NAMDAS') or ''),
            geom=geom,
        )
        count += 1
    except Exception as e:
        print(f"Error feature {feature.fid}: {e}")
        errors += 1

print(f"Done: {count} imported, {errors} errors")