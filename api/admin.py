"""
AQUAVISION — Django Admin Registration
"""

from django.contrib import admin

from .models import (
    AdministrasiDesa,
    CatchmentArea,
    Conversation,
    DAS,
    Feedback,
    FasilitasWisata,
    JaringanPipa,
    Message,
    Permukiman,
    RechargeArea,
    Reservoir,
    SumberAir,
)


@admin.register(SumberAir)
class SumberAirAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'jenis_sumber', 'kondisi', 'debit', 'tahun_pendataan']
    search_fields = ['nama', 'jenis_sumber', 'kondisi']
    list_filter   = ['jenis_sumber', 'kondisi']


@admin.register(FasilitasWisata)
class FasilitasWisataAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'jenis', 'kamar', 'kapasitas']
    search_fields = ['nama']
    list_filter   = ['jenis']


@admin.register(Permukiman)
class PermukimanAdmin(admin.ModelAdmin):
    list_display  = ['nama_dusun', 'jumlah_kk', 'jumlah_penduduk', 'kategori_pelanggan']
    search_fields = ['nama_dusun']
    list_filter   = ['kategori_pelanggan']


@admin.register(RechargeArea)
class RechargeAreaAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'kelas_potensi', 'luas_ha']
    search_fields = ['nama']


@admin.register(CatchmentArea)
class CatchmentAreaAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'luas_ha']
    search_fields = ['nama']


@admin.register(JaringanPipa)
class JaringanPipaAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'diameter_mm', 'kondisi', 'tahun_pasang']
    search_fields = ['nama']
    list_filter   = ['kondisi']


@admin.register(Reservoir)
class ReservoirAdmin(admin.ModelAdmin):
    list_display  = ['nama', 'kapasitas_m3', 'elevasi']
    search_fields = ['nama']


@admin.register(DAS)
class DASAdmin(admin.ModelAdmin):
    list_display  = ['nama']
    search_fields = ['nama']


@admin.register(AdministrasiDesa)
class AdministrasiDesaAdmin(admin.ModelAdmin):
    list_display  = ['wadmkd', 'wadmkc', 'wadmkk', 'wadmpr']
    search_fields = ['wadmkd', 'wadmkc', 'wadmkk']
    list_filter   = ['wadmkc', 'wadmkk']


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display    = ['nama', 'pesan', 'tanggal']
    list_filter     = ['tanggal']
    search_fields   = ['nama', 'pesan']
    readonly_fields = ['tanggal']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['user', 'status', 'created_at', 'updated_at']
    list_filter   = ['status']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'conversation', 'created_at', 'is_read']
    list_filter   = ['is_read']
    search_fields = ['sender__username', 'content']
    readonly_fields = ['created_at']
