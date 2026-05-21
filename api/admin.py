from django.contrib import admin
from .models import Feedback
from .models import (
    SumberAir,
    FasilitasWisata,
    Permukiman,
    DAS,
    JaringanPipa,
    Reservoir,
    RechargeArea,
    CatchmentArea,
)

admin.site.register(SumberAir)
admin.site.register(FasilitasWisata)
admin.site.register(Permukiman)
admin.site.register(DAS)
admin.site.register(JaringanPipa)
admin.site.register(Reservoir)
admin.site.register(RechargeArea)
admin.site.register(CatchmentArea)
@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['nama', 'pesan', 'tanggal']
    list_filter = ['tanggal']
    search_fields = ['nama', 'pesan']
    readonly_fields = ['tanggal']