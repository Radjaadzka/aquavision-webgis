"""
AQUAVISION — Import ulang layer Potensi Air Tanah dari DaerahResapan.geojson.

Layer lama (kelas Low/Moderate/High/Very High) digantikan oleh hasil pemodelan
baru pada static/data/DaerahResapan.geojson, dengan field `DN` (1-4) yang
dipetakan ke klasifikasi Bahasa Indonesia:

    DN=1 -> Rendah          (skor 1.74-2.41)
    DN=2 -> Sedang          (skor 2.41-3.08)
    DN=3 -> Tinggi          (skor 3.08-3.75)
    DN=4 -> Sangat Tinggi   (skor 3.75-4.42)

Perintah ini MENGGANTI SELURUH isi tabel RechargeArea (model & API GeoJSON
/api/recharge-geojson/ TIDAK diubah — hanya datanya). Layer peta utama di
Dashboard sudah fetch langsung dari static/data/DaerahResapan.geojson (lihat
loadPotensiAirTanah() di static/js/script.js) dan tidak terpengaruh oleh
command ini; command ini khusus menyamakan data Data Portal (download
CSV/GeoJSON/KML/Shapefile) & AI knowledge (jumlah_zona_potensi_air_tanah)
dengan layer baru.

Jalankan dari direktori project:
    python manage.py import_daerah_resapan
    python manage.py import_daerah_resapan --dry-run   # cek tanpa menulis ke DB
"""

import json

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import RechargeArea

GEOJSON_PATH = settings.BASE_DIR / 'static' / 'data' / 'DaerahResapan.geojson'

DN_TO_KELAS = {
    1: 'Rendah',
    2: 'Sedang',
    3: 'Tinggi',
    4: 'Sangat Tinggi',
}

# CRS terprojeksi untuk perhitungan luas yang akurat (proyek ini memakai
# UTM Zone 49S sebagai standar — lihat glosarium "utm zone 49s").
AREA_SRID = 32749


class Command(BaseCommand):
    help = 'Import ulang RechargeArea (Potensi Air Tanah) dari static/data/DaerahResapan.geojson'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Parse & validasi file tanpa menulis ke database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if not GEOJSON_PATH.exists():
            self.stderr.write(self.style.ERROR(f'File tidak ditemukan: {GEOJSON_PATH}'))
            return

        with open(GEOJSON_PATH, encoding='utf-8') as f:
            data = json.load(f)

        features = data.get('features', [])
        self.stdout.write(f'Membaca {len(features)} feature dari {GEOJSON_PATH.name}...')

        objects = []
        skipped = 0
        kelas_count = {}

        for feat in features:
            props = feat.get('properties', {})
            dn = props.get('DN')
            kelas = DN_TO_KELAS.get(dn)
            if kelas is None:
                skipped += 1
                continue

            geom = GEOSGeometry(json.dumps(feat['geometry']), srid=4326)
            if geom.geom_type == 'Polygon':
                geom = MultiPolygon(geom, srid=4326)
            elif geom.geom_type != 'MultiPolygon':
                skipped += 1
                continue

            # Luas dihitung di UTM 49S (meter), bukan di CRS84 (derajat).
            geom_utm = geom.transform(AREA_SRID, clone=True)
            luas_ha = round(geom_utm.area / 10_000, 4)

            fid = props.get('fid')
            objects.append(RechargeArea(
                nama=f'Zona Resapan {kelas} #{fid}',
                geom=geom,
                kelas_potensi=kelas,
                luas_ha=luas_ha,
            ))
            kelas_count[kelas] = kelas_count.get(kelas, 0) + 1

        self.stdout.write('Ringkasan klasifikasi:')
        for kelas in ('Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'):
            self.stdout.write(f'  - {kelas}: {kelas_count.get(kelas, 0)} poligon')
        if skipped:
            self.stdout.write(self.style.WARNING(f'  ({skipped} feature dilewati — DN tidak dikenali / geometri tidak valid)'))

        if dry_run:
            self.stdout.write(self.style.WARNING('--dry-run aktif: tidak ada perubahan ditulis ke database.'))
            return

        with transaction.atomic():
            old_count = RechargeArea.objects.count()
            RechargeArea.objects.all().delete()
            RechargeArea.objects.bulk_create(objects, batch_size=500)

        cache.delete('geojson_recharge')

        self.stdout.write(self.style.SUCCESS(
            f'Selesai: {old_count} baris lama dihapus, {len(objects)} baris baru disimpan ke RechargeArea.'
        ))
