# AQUAVISION — Panduan Backup & Recovery

---

## 1. Database Backup

### Backup Manual

```bash
# Backup penuh (schema + data)
pg_dump -U aquavision -h localhost webgis_ta \
    --format=custom \
    --no-password \
    -f /var/backups/aquavision/db_$(date +%Y%m%d_%H%M%S).dump

# Backup dalam format SQL (human-readable)
pg_dump -U aquavision -h localhost webgis_ta \
    --format=plain \
    -f /var/backups/aquavision/db_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Otomatis (cron)

Setup direktori backup:

```bash
sudo mkdir -p /var/backups/aquavision
sudo chown www-data:www-data /var/backups/aquavision
```

Buat script backup:

```bash
sudo nano /usr/local/bin/aquavision-backup.sh
```

Isi:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/aquavision"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="webgis_ta"
DB_USER="aquavision"
KEEP_DAYS=30

# Backup database
pg_dump -U $DB_USER -h localhost $DB_NAME \
    --format=custom \
    -f "$BACKUP_DIR/db_${DATE}.dump"

# Backup media files
tar -czf "$BACKUP_DIR/media_${DATE}.tar.gz" \
    -C /var/www/aquavision media/

# Hapus backup lebih dari 30 hari
find $BACKUP_DIR -name "*.dump" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$KEEP_DAYS -delete

echo "Backup selesai: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/aquavision-backup.sh
```

Tambahkan ke crontab (backup setiap hari jam 02:00):

```bash
sudo crontab -e
```

```cron
0 2 * * * /usr/local/bin/aquavision-backup.sh >> /var/log/aquavision-backup.log 2>&1
```

### Verifikasi Backup

```bash
# List backup files
ls -lh /var/backups/aquavision/

# Verifikasi isi dump
pg_restore --list /var/backups/aquavision/db_YYYYMMDD_HHMMSS.dump | head -20
```

---

## 2. Database Restore

### Restore dari custom format dump

```bash
# Buat database baru (jika disaster recovery)
sudo -u postgres psql -c "CREATE DATABASE webgis_ta_restore OWNER aquavision;"
sudo -u postgres psql -c "CREATE EXTENSION postgis;" -d webgis_ta_restore
sudo -u postgres psql -c "CREATE EXTENSION postgis_topology;" -d webgis_ta_restore

# Restore
pg_restore -U aquavision -h localhost \
    -d webgis_ta_restore \
    --no-password \
    /var/backups/aquavision/db_YYYYMMDD_HHMMSS.dump

# Verifikasi
psql -U aquavision -h localhost -d webgis_ta_restore \
    -c "SELECT COUNT(*) FROM api_sumberair;"
```

### Restore ke database production (overwrite)

```bash
# HATI-HATI: ini akan menghapus data existing

# Stop aplikasi
sudo systemctl stop aquavision

# Drop dan recreate database
sudo -u postgres psql -c "DROP DATABASE webgis_ta;"
sudo -u postgres psql -c "CREATE DATABASE webgis_ta OWNER aquavision;"
sudo -u postgres psql -c "CREATE EXTENSION postgis;" -d webgis_ta
sudo -u postgres psql -c "CREATE EXTENSION postgis_topology;" -d webgis_ta

# Restore
pg_restore -U aquavision -h localhost \
    -d webgis_ta \
    --no-password \
    /var/backups/aquavision/db_YYYYMMDD_HHMMSS.dump

# Start aplikasi
sudo systemctl start aquavision
```

---

## 3. Media Backup

Media files (foto dokumentasi SumberAir) tersimpan di `/var/www/aquavision/media/`.

### Backup manual

```bash
tar -czf /var/backups/aquavision/media_$(date +%Y%m%d).tar.gz \
    -C /var/www/aquavision media/
```

### Restore media

```bash
# Stop aplikasi
sudo systemctl stop aquavision

# Restore
tar -xzf /var/backups/aquavision/media_YYYYMMDD.tar.gz \
    -C /var/www/aquavision

# Fix permissions
sudo chown -R www-data:www-data /var/www/aquavision/media

# Start aplikasi
sudo systemctl start aquavision
```

---

## 4. Disaster Recovery

### Skenario: VPS Rusak Total

Estimasi waktu recovery: **30–60 menit** dengan backup tersedia.

#### Langkah Recovery

**1. Provision VPS baru (10 menit)**

```bash
# Di VPS baru: install dependensi
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv \
    postgresql postgresql-contrib postgis \
    gdal-bin libgdal-dev nginx certbot python3-certbot-nginx git
```

**2. Setup PostgreSQL (5 menit)**

```bash
sudo -u postgres psql
CREATE USER aquavision WITH PASSWORD 'ganti_password_kuat';
CREATE DATABASE webgis_ta OWNER aquavision;
\c webgis_ta
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
\q
```

**3. Deploy aplikasi (5 menit)**

```bash
cd /var/www
git clone <repo-url> aquavision
cd aquavision
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p media logs staticfiles
```

**4. Restore database (5 menit)**

```bash
# Transfer backup dari lokal ke VPS baru
scp db_backup.dump root@new-vps-ip:/tmp/

# Restore
pg_restore -U aquavision -h localhost -d webgis_ta \
    --no-password /tmp/db_backup.dump
```

**5. Setup environment & Django (5 menit)**

```bash
# Buat /etc/aquavision.env
source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)
python manage.py collectstatic --noinput
python manage.py check --deploy
```

**6. Setup Nginx + Gunicorn (10 menit)**

Ikuti langkah 6–8 di [DEPLOYMENT.md](DEPLOYMENT.md).

**7. Verifikasi (5 menit)**

```bash
sudo systemctl status aquavision nginx postgresql
curl https://yourdomain.com/
```

---

### Skenario: Data Terhapus Tidak Sengaja

```bash
# Cek backup terbaru
ls -lt /var/backups/aquavision/*.dump | head -3

# Restore ke database sementara
sudo -u postgres psql -c "CREATE DATABASE webgis_recovery OWNER aquavision;"
sudo -u postgres psql -c "CREATE EXTENSION postgis;" -d webgis_recovery

pg_restore -U aquavision -h localhost -d webgis_recovery \
    --no-password /var/backups/aquavision/db_terbaru.dump

# Query data yang hilang dari webgis_recovery
# Copy data ke database production
```

---

## 5. Checklist Backup Rutin

| Frekuensi | Aksi |
|---|---|
| Harian (auto) | Database dump ke /var/backups/ |
| Harian (auto) | Media files tar.gz |
| Mingguan | Transfer backup ke storage eksternal (S3/GDrive) |
| Bulanan | Test restore ke database staging |
| Sebelum update besar | Manual backup + tag git |
