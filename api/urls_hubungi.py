"""
AQUAVISION — Hubungi Admin URL Configuration (P2.1)
"""

from django.urls import path
from . import views

urlpatterns = [
    # User-facing page
    path('',                       views.hubungi_view,         name='hubungi'),

    # User AJAX
    path('send/',                  views.hubungi_send,         name='hubungi_send'),
    path('messages/',              views.hubungi_messages,     name='hubungi_messages'),

    # Admin HTML page
    path('admin/',                 views.hubungi_admin_page,   name='hubungi_admin_page'),

    # Admin AJAX
    path('admin/conversations/',   views.hubungi_admin_list,   name='hubungi_admin_list'),
    path('admin/<int:conv_id>/',   views.hubungi_admin_thread, name='hubungi_admin_thread'),
    path('queue/',                 views.queue_info,           name='queue_info'),
]
