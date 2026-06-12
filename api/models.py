"""
AQUAVISION — Database Models
Spatial and non-spatial models for water resource management.
"""

from django.contrib.gis.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class SumberAir(models.Model):
    nama             = models.CharField(max_length=100)
    lokasi           = models.PointField()
    debit            = models.FloatField(help_text='L/detik')
    jenis_sumber     = models.CharField(max_length=50, blank=True, null=True)
    kondisi          = models.CharField(max_length=50, blank=True, null=True)
    tahun_pendataan  = models.IntegerField(blank=True, null=True)
    foto_dokumentasi = models.ImageField(upload_to='foto_sumber_air/', blank=True, null=True)

    USER_FIELDS  = ['nama', 'jenis_sumber', 'kondisi', 'lat', 'lon']
    ADMIN_FIELDS = ['nama', 'jenis_sumber', 'kondisi', 'debit', 'tahun_pendataan',
                    'lat', 'lon', 'easting', 'northing']

    def __str__(self):
        return self.nama


class FasilitasWisata(models.Model):
    JENIS_CHOICES = [
        ('hotel',    'Hotel'),
        ('resto',    'Restoran'),
        ('homestay', 'Homestay'),
        ('jasa',     'Jasa'),
    ]
    nama                 = models.CharField(max_length=100)
    jenis                = models.CharField(max_length=20, choices=JENIS_CHOICES, db_index=True)
    lokasi               = models.PointField()
    kamar                = models.IntegerField(blank=True, null=True)
    kapasitas            = models.IntegerField(blank=True, null=True)
    kebutuhan_air_harian = models.FloatField(blank=True, null=True, help_text='Liter/hari')

    USER_FIELDS  = ['nama', 'jenis', 'lat', 'lon']
    ADMIN_FIELDS = ['nama', 'jenis', 'kamar', 'kapasitas', 'kebutuhan_air_harian',
                    'lat', 'lon', 'easting', 'northing']

    def __str__(self):
        return self.nama


class Permukiman(models.Model):
    KATEGORI_CHOICES = [
        ('rumah_tangga', 'Rumah Tangga'),
        ('homestay',     'Homestay'),
        ('warung',       'Warung'),
        ('fasum',        'Fasilitas Umum'),
    ]
    nama_dusun          = models.CharField(max_length=100)
    lokasi              = models.PointField()
    jumlah_kk           = models.IntegerField()
    jumlah_penduduk     = models.IntegerField()
    kategori_pelanggan  = models.CharField(max_length=50, choices=KATEGORI_CHOICES,
                                           blank=True, null=True)
    rata_rata_kebutuhan = models.FloatField(blank=True, null=True, help_text='Liter/hari')

    USER_FIELDS  = ['nama_dusun', 'jumlah_penduduk', 'lat', 'lon']
    ADMIN_FIELDS = ['nama_dusun', 'jumlah_kk', 'jumlah_penduduk', 'kategori_pelanggan',
                    'rata_rata_kebutuhan', 'lat', 'lon', 'easting', 'northing']

    def __str__(self):
        return self.nama_dusun


class RechargeArea(models.Model):
    nama          = models.CharField(max_length=100)
    geom          = models.MultiPolygonField()
    kelas_potensi = models.CharField(max_length=50, blank=True, null=True)
    luas_ha       = models.FloatField(blank=True, null=True)

    USER_FIELDS  = ['nama', 'kelas_potensi']
    ADMIN_FIELDS = ['nama', 'kelas_potensi', 'luas_ha']

    class Meta:
        verbose_name        = 'Daerah Potensi Air Tanah'
        verbose_name_plural = 'Daerah Potensi Air Tanah'

    def __str__(self):
        return self.nama


class DAS(models.Model):
    """Daerah Aliran Sungai — digunakan untuk referensi internal."""
    nama = models.CharField(max_length=100, blank=True, null=True)
    geom = models.MultiPolygonField()

    def __str__(self):
        return self.nama or '-'


class CatchmentArea(models.Model):
    nama    = models.CharField(max_length=100)
    geom    = models.MultiPolygonField()
    luas_ha = models.FloatField(blank=True, null=True)

    USER_FIELDS  = ['nama']
    ADMIN_FIELDS = ['nama', 'luas_ha']

    class Meta:
        verbose_name        = 'Debit Puncak Aliran'
        verbose_name_plural = 'Debit Puncak Aliran'

    def __str__(self):
        return self.nama


class JaringanPipa(models.Model):
    nama        = models.CharField(max_length=100)
    geom        = models.MultiLineStringField()
    diameter_mm = models.FloatField(blank=True, null=True)
    kondisi     = models.CharField(max_length=50, blank=True, null=True)
    tahun_pasang = models.IntegerField(blank=True, null=True)

    USER_FIELDS  = ['nama', 'kondisi']
    ADMIN_FIELDS = ['nama', 'diameter_mm', 'kondisi', 'tahun_pasang']

    def __str__(self):
        return self.nama


class Reservoir(models.Model):
    nama         = models.CharField(max_length=100)
    lokasi       = models.PointField()
    kapasitas_m3 = models.FloatField()
    elevasi      = models.FloatField(blank=True, null=True)

    USER_FIELDS  = ['nama', 'kapasitas_m3', 'lat', 'lon']
    ADMIN_FIELDS = ['nama', 'kapasitas_m3', 'elevasi', 'lat', 'lon', 'easting', 'northing']

    class Meta:
        verbose_name        = 'Tandon Air'
        verbose_name_plural = 'Tandon Air'

    def __str__(self):
        return self.nama


class AdministrasiDesa(models.Model):
    namobj  = models.CharField(max_length=200, blank=True, null=True)
    remark  = models.CharField(max_length=100, blank=True, null=True)
    wadmkd  = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nama Desa')
    wadmkc  = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nama Kecamatan')
    wadmkk  = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nama Kabupaten')
    wadmpr  = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nama Provinsi')
    luas    = models.FloatField(blank=True, null=True)
    geom    = models.MultiPolygonField(srid=4326)

    USER_FIELDS  = ['wadmkd', 'wadmkc', 'wadmkk']
    ADMIN_FIELDS = ['wadmkd', 'wadmkc', 'wadmkk', 'luas', 'remark']

    class Meta:
        verbose_name        = 'Administrasi Desa'
        verbose_name_plural = 'Administrasi Desa'

    def __str__(self):
        return self.wadmkd or self.namobj or '-'


class Feedback(models.Model):
    """Masukan dari pengunjung landing page."""
    nama    = models.CharField(max_length=100)
    pesan   = models.TextField(max_length=1000)
    rating  = models.IntegerField(null=True, blank=True)  # 1–5 bintang
    tanggal = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-tanggal']

    def __str__(self):
        return f'{self.nama} — {self.tanggal.strftime("%d %b %Y")}'


# ── P2.1: Hubungi Admin ──────────────────────────────────────────

class Conversation(models.Model):
    STATUS_CHOICES = [
        ('open',              'Open'),
        ('ai_answered',       'Dijawab AI'),
        ('waiting_admin',     'Menunggu Admin'),
        ('WAITING_FOR_ADMIN', 'Menunggu Admin (lama)'),
        ('reviewing',         'Sedang Ditinjau'),
        ('closed',            'Selesai'),
    ]

    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='conversation')
    subject    = models.CharField(max_length=200, blank=True, default='')
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    ticket_id  = models.CharField(max_length=30, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'Conversation — {self.user.username}'

    def unread_count_for_admin(self):
        return self.messages.filter(is_read=False, sender=self.user).count()


class Message(models.Model):
    conversation    = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender          = models.ForeignKey(User, on_delete=models.CASCADE)
    content         = models.TextField()
    created_at      = models.DateTimeField(auto_now_add=True)
    is_read         = models.BooleanField(default=False, db_index=True)
    is_ai_response  = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:40]}'


# ── P2.2: Download Log ───────────────────────────────────────────

class DownloadLog(models.Model):
    FORMAT_CHOICES = [
        ('csv',     'CSV'),
        ('geojson', 'GeoJSON'),
        ('kml',     'KML'),
        ('shp',     'Shapefile'),
    ]
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    dataset    = models.CharField(max_length=50)
    format     = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    waktu      = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-waktu']

    def __str__(self):
        return f'{self.user} — {self.dataset}.{self.format}'


# ── P2.3: Audit Log ──────────────────────────────────────────────

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN',    'Login'),
        ('LOGOUT',   'Logout'),
        ('DOWNLOAD', 'Download'),
        ('UPLOAD',   'Upload'),
        ('EDIT',     'Edit'),
        ('DELETE',   'Delete'),
        ('CHAT',     'Chat'),
    ]
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action     = models.CharField(max_length=20, choices=ACTION_CHOICES)
    detail     = models.CharField(max_length=200, blank=True, default='')
    waktu      = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-waktu']

    def __str__(self):
        return f'{self.user} — {self.action}'


# ── P2.4: Notification ───────────────────────────────────────────

class Notification(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message    = models.CharField(max_length=300)
    is_read    = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.message[:50]}'