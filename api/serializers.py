from rest_framework_gis.serializers import GeoFeatureModelSerializer  # type: ignore[import-untyped]

from .models import (
    SumberAir,
    FasilitasWisata,
    Permukiman,
    RechargeArea,
    CatchmentArea,
    JaringanPipa,
    Reservoir,
    DAS,
)


# ==================================================
# GEOJSON SERIALIZERS
# ==================================================

class SumberAirSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = SumberAir
        geo_field = "lokasi"
        fields = '__all__'


class FasilitasWisataSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FasilitasWisata
        geo_field = "lokasi"
        fields = '__all__'


class PermukimanSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Permukiman
        geo_field = "lokasi"
        fields = '__all__'


class RechargeAreaSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = RechargeArea
        geo_field = "geom"
        fields = '__all__'


class CatchmentAreaSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = CatchmentArea
        geo_field = "geom"
        fields = '__all__'


class JaringanPipaSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = JaringanPipa
        geo_field = "geom"
        fields = '__all__'


class ReservoirSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Reservoir
        geo_field = "lokasi"
        fields = '__all__'


class DASSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = DAS
        geo_field = "geom"
        fields = '__all__'