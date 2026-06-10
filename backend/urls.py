"""
AQUAVISION — Root URL Configuration
Inline view functions for simple pages; GIS and data portal routed to api/.
"""

from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render, redirect
from django.contrib.auth import views as auth_views, login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import Group
from django.conf import settings
from django.conf.urls.static import static
from api.views import is_admin_user, audit_log_page, download_log_page


# ================================================================
# VIEW FUNCTIONS (inline — sederhana, tidak perlu file terpisah)
# ================================================================

def landing(request):
    """Landing page — data counter dari DB, bukan fetch JS."""
    from api.models import SumberAir, FasilitasWisata, Permukiman
    return render(request, 'landing.html', {
        'jumlah_air':        SumberAir.objects.count(),
        'jumlah_fasilitas':  FasilitasWisata.objects.count(),
        'jumlah_permukiman': Permukiman.objects.count(),
    })


def map_view(request):
    """WebGIS dashboard — accessible to guests; admin flag only for authenticated users."""
    is_admin = request.user.is_authenticated and is_admin_user(request.user)
    return render(request, 'index.html', {'is_admin': is_admin})


def register(request):
    """Registrasi user baru — otomatis masuk grup 'User'."""
    if request.user.is_authenticated:
        return redirect('map')

    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            group, _ = Group.objects.get_or_create(name='User')
            user.groups.add(group)
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect('map')
    else:
        form = UserCreationForm()

    return render(request, 'register.html', {'form': form})


def bantuan_view(request):
    """Pusat Bantuan AQUAVISION — halaman FAQ dan panduan penggunaan (publik)."""
    return render(request, 'bantuan.html')


def custom_404(request, _exception=None):
    return render(request, '404.html', status=404)


def custom_500(request):
    return render(request, '505.html', status=500)


# ================================================================
# URL PATTERNS
# ================================================================

urlpatterns = [
    # Halaman utama
    path('',          landing,      name='landing'),
    path('map/',      map_view,     name='map'),
    path('bantuan/',  bantuan_view, name='bantuan'),
    path('register/', register,     name='register'),

    # Auth
    path('login/',  auth_views.LoginView.as_view(
        template_name='login.html',
        extra_context={'google_auth_enabled': settings.GOOGLE_AUTH_ENABLED}
    ), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'),             name='logout'),

    # Django admin
    path('admin/', admin.site.urls),

    # Google OAuth
    path('auth/', include('social_django.urls', namespace='social')),

    # Data Portal (HTML)
    path('', include('api.urls_data')),

    # API JSON
    path('api/', include('api.urls_api')),

    # Hubungi Admin (P2.1)
    path('hubungi/', include('api.urls_hubungi')),

    # Audit & Download Log (P2.8, P2.9)
    path('admin-tools/audit-log/',    audit_log_page,    name='audit_log'),
    path('admin-tools/download-log/', download_log_page, name='download_log'),
]

# Media files — hanya saat DEBUG (di produksi Nginx yang serve)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ================================================================
# ERROR HANDLERS
# ================================================================

handler404 = 'backend.urls.custom_404'
handler500 = 'backend.urls.custom_500'