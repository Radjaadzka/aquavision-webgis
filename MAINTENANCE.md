# AQUAVISION — Panduan Pemeliharaan

---

## 1. Perintah Dasar

```bash
# Aktifkan environment
cd /var/www/aquavision
source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)

# Restart aplikasi
sudo systemctl restart aquavision

# Reload Nginx (setelah update config)
sudo systemctl reload nginx

# Cek status semua service
sudo systemctl status aquavision nginx postgresql
```

---

## 2. Monitoring Log

```bash
# Log Gunicorn (error)
tail -f /var/www/aquavision/logs/gunicorn-error.log

# Log Gunicorn (access)
tail -f /var/www/aquavision/logs/gunicorn-access.log

# Log Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Log PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# Log system (service failures)
sudo journalctl -u aquavision -f
```

---

## 3. Update Aplikasi

### Update minor (bugfix, documentation)

```bash
cd /var/www/aquavision
git pull origin main

source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)

# Jalankan hanya jika ada perubahan models
python manage.py migrate

# Selalu jalankan setelah pull (jika ada perubahan static)
python manage.py collectstatic --noinput

sudo systemctl restart aquavision
```

### Update dependency

```bash
# Cek dependency yang outdated
pip list --outdated

# Update satu package (test dulu di staging)
pip install django==X.Y.Z

# Update requirements.txt
pip freeze > requirements.txt

# Test
python manage.py check

# Deploy
sudo systemctl restart aquavision
```

> **Perhatian:** Jangan update GDAL, PostGIS, atau Django major version tanpa testing menyeluruh.

---

## 4. Update Database

### Menambah model baru

```bash
# Di development, edit models.py
python manage.py makemigrations
python manage.py migrate

# Di VPS: HANYA jalankan migrate
git pull origin main
python manage.py migrate
```

### Menambah data baru via admin panel

Akses `/admin/` dengan akun superuser untuk:
- Tambah/edit/hapus data spatial
- Kelola akun user
- Review feedback

### Import data via scripts

Script import tersedia di folder `scripts/`:

```bash
# Import administrasi desa dari shapefile
python scripts/import_administrasi.py

# Import DAS dari GeoJSON
python manage.py shell < scripts/import_das.py
```

---

## 5. Update Dataset GeoJSON/Raster

Layer yang diambil dari file statis (bukan database):

| File | Layer |
|---|---|
| `static/data/BatasDesa.geojson` | Batas administrasi desa |
| `static/data/Sungai.geojson` | Daerah aliran sungai |
| `static/data/DaerahResapan.geojson` | Potensi air tanah |
| `static/data/DebitPuncak_*.geojson` | Debit puncak bulanan |
| `static/data/DebitPuncak_*.tif` | Raster debit puncak |

Untuk update layer statis:
1. Ganti file di `static/data/`
2. Jalankan `python manage.py collectstatic --noinput`
3. Clear browser cache (Ctrl+Shift+R)

---

## 6. SSL Renewal

Certbot auto-renewal sudah dikonfigurasi. Verifikasi:

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

Manual renewal jika diperlukan:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 7. Backup Rutin

```bash
# Jalankan backup manual kapan saja
sudo /usr/local/bin/aquavision-backup.sh

# Verifikasi backup otomatis berjalan
ls -lh /var/backups/aquavision/
cat /var/log/aquavision-backup.log | tail -20
```

Lihat [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) untuk detail.

---

## 8. Pembersihan Berkala

### Hapus file temp upload (jika ada)

```bash
# Lihat ukuran folder
du -sh /var/www/aquavision/media/

# Hapus file upload lama jika sudah tidak dibutuhkan (hati-hati!)
find /var/www/aquavision/media/ -mtime +365 -name "*.jpg" -ls
```

### Vacuum database

```bash
sudo -u postgres psql -d webgis_ta -c "VACUUM ANALYZE;"
```

### Rotate logs Gunicorn

Tambahkan ke crontab:

```cron
0 0 * * 0 mv /var/www/aquavision/logs/gunicorn-access.log \
    /var/www/aquavision/logs/gunicorn-access-$(date +%Y%m%d).log && \
    sudo systemctl restart aquavision
```

---

## 9. Monitoring Disk Space

```bash
# Cek penggunaan disk
df -h

# Cek ukuran folder penting
du -sh /var/www/aquavision/
du -sh /var/backups/aquavision/
du -sh /var/www/aquavision/staticfiles/
du -sh /var/www/aquavision/media/
```

---

## 10. Maintenance Checklist Mingguan

```
□ Cek status service (aquavision, nginx, postgresql)
□ Cek log error Gunicorn dan Nginx
□ Verifikasi backup otomatis berjalan
□ Cek disk space (minimal 20% free)
□ Verifikasi SSL aktif (tanggal expiry)
□ Test akses aplikasi dari browser
```

## Maintenance Checklist Bulanan

```
□ Update sistem operasi (apt upgrade)
□ Cek dependency outdated (pip list --outdated)
□ Test restore backup ke staging
□ Review log error bulan berjalan
□ Vacuum database PostgreSQL
□ Review feedback dari pengguna
```
