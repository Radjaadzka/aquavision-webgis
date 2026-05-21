from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import views as auth_views, login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import Group
from api import views


def landing(request):
    return render(request, "landing.html")


@login_required(login_url='/login/')
def map_view(request):
    is_admin = request.user.groups.filter(name='Admin').exists()

    return render(request, "index.html", {
        "is_admin": is_admin
    })


def register(request):

    if request.method == 'POST':
        form = UserCreationForm(request.POST)

        if form.is_valid():
            user = form.save()
            group, created = Group.objects.get_or_create(name='User')
            user.groups.add(group)
            login(request, user)
            return redirect('map')
    else:
        form = UserCreationForm()

    return render(request, 'register.html', {'form': form})


urlpatterns = [
    path('', landing, name='landing'),
    path('map/', map_view, name='map'),

    path('login/',
         auth_views.LoginView.as_view(template_name='login.html'),
         name='login'),

    path('logout/',
         auth_views.LogoutView.as_view(next_page='/'),
         name='logout'),

    path('register/', register, name='register'),

    path('admin/', admin.site.urls),

    # DATA PORTAL (HTML)
    path('', include('api.urls_data')),

    # API JSON
    path('api/', include('api.urls_api')),
]

handler404 = 'django.views.defaults.page_not_found'
handler500 = 'django.views.defaults.server_error'