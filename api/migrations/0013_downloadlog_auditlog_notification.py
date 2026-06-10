from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_message_is_ai_response'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DownloadLog',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dataset',    models.CharField(max_length=50)),
                ('format',     models.CharField(max_length=10, choices=[('csv','CSV'),('geojson','GeoJSON'),('kml','KML'),('shp','Shapefile')])),
                ('waktu',      models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user',       models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-waktu']},
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action',     models.CharField(max_length=20, choices=[('LOGIN','Login'),('LOGOUT','Logout'),('DOWNLOAD','Download'),('UPLOAD','Upload'),('EDIT','Edit'),('DELETE','Delete'),('CHAT','Chat')])),
                ('detail',     models.CharField(blank=True, default='', max_length=200)),
                ('waktu',      models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user',       models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-waktu']},
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message',    models.CharField(max_length=300)),
                ('is_read',    models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user',       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
