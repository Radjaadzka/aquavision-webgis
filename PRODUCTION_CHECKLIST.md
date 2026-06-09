# AQUAVISION — Production Deployment Checklist

Gunakan checklist ini setiap kali melakukan deployment ke VPS production.

---

## Environment & Security

- [ ] `DJANGO_DEBUG=False` — **WAJIB**, jangan pernah `True` di production
- [ ] `DJANGO_SECRET_KEY` menggunakan ENV — jangan hardcode, minimal 50 karakter acak
- [ ] `ALLOWED_HOSTS` benar — berisi domain production, bukan `*`
- [ ] `CSRF_TRUSTED_ORIGINS` benar — berisi `https://yourdomain.com` (dengan https://)
- [ ] `CORS_ALLOWED_ORIGINS` benar — hanya domain yang perlu akses API
- [ ] File `/etc/aquavision.env` permission `600` (hanya owner yang bisa baca)
- [ ] Tidak ada secret/password di-commit ke git (cek `.gitignore`)

---

## Database

- [ ] PostgreSQL berjalan — `sudo systemctl status postgresql`
- [ ] PostGIS extension aktif — `psql -U aquavision webgis_ta -c "\dx"`
- [ ] User database bukan superuser — hanya memiliki privilege yang dibutuhkan
- [ ] Password database kuat (minimal 16 karakter)
- [ ] `python manage.py migrate` berhasil — 0 pending migrations
- [ ] `python manage.py makemigrations --check` — no changes detected

---

## Aplikasi Django

- [ ] `python manage.py check --deploy` — 0 errors, 0 warnings
- [ ] `python manage.py collectstatic --noinput` — berhasil
- [ ] `staticfiles/` berisi file terbaru
- [ ] Superuser sudah dibuat — `python manage.py createsuperuser`
- [ ] Grup 'User' ada di database — dibuat otomatis saat register pertama

---

## Gunicorn

- [ ] Gunicorn berjalan — `sudo systemctl status aquavision`
- [ ] `--workers 3` (atau sesuai CPU: `2*CPU+1`)
- [ ] `--timeout 60` — cukup untuk upload shapefile
- [ ] Unix socket tersedia — `/run/aquavision.sock`
- [ ] Log file dapat ditulis — `/var/www/aquavision/logs/`
- [ ] Service enabled — aktif otomatis saat server reboot

---

## Nginx

- [ ] Nginx berjalan — `sudo systemctl status nginx`
- [ ] Config valid — `sudo nginx -t`
- [ ] `proxy_pass` mengarah ke unix socket yang benar
- [ ] `client_max_body_size 60M` — untuk upload shapefile
- [ ] `proxy_read_timeout 60s` — cukup untuk request besar
- [ ] `/static/` mengarah ke `staticfiles/`
- [ ] `/media/` mengarah ke `media/`
- [ ] HTTP redirect ke HTTPS aktif

---

## SSL

- [ ] SSL aktif — `https://yourdomain.com` tidak ada browser warning
- [ ] Certificate valid — belum expired
- [ ] Auto-renewal aktif — `sudo certbot renew --dry-run`
- [ ] HSTS header tersedia — cek di browser DevTools > Network > Response Headers

---

## Fungsionalitas

- [ ] Landing page dapat diakses
- [ ] Register user baru berhasil
- [ ] Login berhasil
- [ ] Logout berhasil
- [ ] WebGIS terbuka dan peta tampil
- [ ] Layer sumber air muncul di peta
- [ ] Popup data muncul saat klik marker
- [ ] Search lokasi berfungsi
- [ ] Neraca air (gauge) tampil
- [ ] Data Portal dapat diakses
- [ ] Dataset detail dan paginasi berfungsi
- [ ] Download CSV berhasil
- [ ] Download GeoJSON berhasil
- [ ] Download KML berhasil
- [ ] Download SHP berhasil (ZIP)
- [ ] Upload SHP berhasil (login sebagai admin)
- [ ] Admin Edit data berhasil
- [ ] Admin Delete data berhasil
- [ ] Halaman 404 kustom tampil
- [ ] Django Admin (`/admin/`) dapat diakses

---

## Backup & Monitoring

- [ ] Direktori backup tersedia — `/var/backups/aquavision/`
- [ ] Script backup tersedia — `/usr/local/bin/aquavision-backup.sh`
- [ ] Cron backup aktif — `sudo crontab -l`
- [ ] Backup manual pertama sudah dibuat
- [ ] Log Gunicorn dapat dibaca — tidak ada error kritis

---

## Pasca-Deployment

- [ ] Akses aplikasi dari browser (bukan localhost) — berfungsi
- [ ] Test dari perangkat mobile — responsive
- [ ] Test login Google OAuth (jika dikonfigurasi)
- [ ] Beritahu stakeholder bahwa deployment selesai

---

## Perintah Verifikasi Cepat

```bash
# Semua service
sudo systemctl status aquavision nginx postgresql

# Django check
source /var/www/aquavision/venv/bin/activate
export $(cat /etc/aquavision.env | xargs)
python manage.py check --deploy

# Database
psql -U aquavision -h localhost webgis_ta -c "SELECT COUNT(*) FROM api_sumberair;"

# SSL
curl -I https://yourdomain.com | grep -E "HTTP|X-Frame|Strict-Transport"
```
