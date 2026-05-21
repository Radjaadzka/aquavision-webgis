import json
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from api.models import DAS

with open("static/data/das.json") as f:
    data = json.load(f)

for i, feature in enumerate(data["features"], start=1):
    geom = GEOSGeometry(json.dumps(feature["geometry"]))

    if geom.geom_type == "Polygon":
        geom = MultiPolygon(geom)

    DAS.objects.create(
        nama=f"DAS_{i}",
        geom=geom
    )
print("Import selesai")