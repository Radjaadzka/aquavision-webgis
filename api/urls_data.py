"""
AQUAVISION — Data Portal URL Configuration
File: api/urls_data.py
"""

from django.urls import path
from . import views

urlpatterns = [
    path('data/',                              views.data_list,       name='data_list'),
    path('data/<str:model_name>/',             views.dataset_detail,  name='dataset_detail'),
    path('download/csv/<str:model_name>/',     views.download_csv,    name='download_csv'),
    path('download/geojson/<str:model_name>/', views.download_geojson,name='download_geojson'),
    path('download/kml/<str:model_name>/',     views.download_kml,    name='download_kml'),
    path('download/shp/<str:model_name>/',     views.download_shp,    name='download_shp'),
]