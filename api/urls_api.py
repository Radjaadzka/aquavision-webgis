from django.urls import path
from . import views

urlpatterns = [
    path('informasi-debit/', views.informasi_debit, name='informasi_debit'),

    path('sumber-air-geojson/', views.sumber_air_geojson),
    path('fasilitas-geojson/', views.fasilitas_geojson),
    path('permukiman-geojson/', views.permukiman_geojson),
    path('administrasi-geojson/', views.administrasi_geojson),
    path('recharge-geojson/', views.recharge_geojson),
    path('catchment-geojson/', views.catchment_geojson),
    path('jaringan-pipa-geojson/', views.jaringan_pipa_geojson),
    path('reservoir-geojson/', views.reservoir_geojson),

    path('create-sumber-air/', views.create_sumber_air),
    path('create-fasilitas/', views.create_fasilitas),
    path('create-permukiman/', views.create_permukiman),
    path('create-reservoir/', views.create_reservoir),

    # Edit & Delete (admin only)
    path('edit/<str:model_name>/<int:pk>/', views.edit_data),
    path('delete/<str:model_name>/<int:pk>/', views.delete_data),

    # Upload SHP (admin only)
    path('upload-shp/', views.upload_shp),
    #feedback
    path('feedback/', views.submit_feedback),
    path('feedback/list/', views.get_feedback),
]