# AQUAVISION — Panduan Deployment

Target: OVHcloud VPS | Ubuntu 24.04 | PostgreSQL/PostGIS | Django + Gunicorn + Nginx + SSL

---

## Prasyarat VPS

- Ubuntu 24.04 LTS
- Minimal 2 GB RAM, 20 GB disk
- Domain yang sudah diarahkan ke IP VPS
- Akses SSH root atau sudo

---

## 1. Persiapan Server

### Update sistem

```bash
sudo apt update && sudo apt upgrade -y
```

### Install dependensi sistem

```bash
sudo apt install -y \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib postgis \
    gdal-bin libgdal-dev \
    nginx certbot python3-certbot-nginx \
    git curl
```

---

## 2. Setup PostgreSQL + PostGIS

```bash
sudo -u postgres psql

-- Di dalam psql:
CREATE USER aquavision WITH PASSWORD 'ganti_password_kuat';
CREATE DATABASE webgis_ta OWNER aquavision;
\c webgis_ta
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
\q
```

---

## 3. Deploy Aplikasi

### Clone repository

```bash
cd /var/www
sudo git clone <repo-url> aquavision
sudo chown -R $USER:$USER aquavision
cd aquavision
```

### Setup virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Buat direktori yang dibutuhkan

```bash
mkdir -p media logs staticfiles
```

---

## 4. Environment Variables

Buat file `/etc/aquavision.env`:

```bash
sudo nano /etc/aquavision.env
```

Isi:

```ini
DJANGO_SECRET_KEY=ganti-dengan-secret-key-panjang-dan-acak
DJANGO_DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=webgis_ta
DB_USER=aquavision
DB_PASSWORD=ganti_password_kuat
DB_HOST=localhost
DB_PORT=5432
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
DJANGO_LOG_LEVEL=WARNING
```

> **Opsional** — hanya jika menggunakan Google OAuth:
> ```ini
> GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
> GOOGLE_CLIENT_SECRET=your-client-secret
> ```

Amankan file:

```bash
sudo chmod 600 /etc/aquavision.env
```

Cek path GDAL yang benar:

```bash
find /usr -name "libgdal.so*" 2>/dev/null | head -5
```

---

## 5. Django Setup

Load environment dan jalankan commands:

```bash
source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)

# Wajib: migrations (HANYA migrate, JANGAN makemigrations di VPS)
python manage.py migrate

# Wajib: collect static files
python manage.py collectstatic --noinput

# Wajib: buat superuser
python manage.py createsuperuser

# Verifikasi Django
python manage.py check --deploy
```

---

## 6. Gunicorn (systemd service)

Buat file service:

```bash
sudo nano /etc/systemd/system/aquavision.service
```

Isi:

```ini
[Unit]
Description=AQUAVISION — Gunicorn WSGI Server
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/aquavision
EnvironmentFile=/etc/aquavision.env
ExecStart=/var/www/aquavision/venv/bin/gunicorn \
    --workers 3 \
    --timeout 60 \
    --bind unix:/run/aquavision.sock \
    --access-logfile /var/www/aquavision/logs/gunicorn-access.log \
    --error-logfile /var/www/aquavision/logs/gunicorn-error.log \
    backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Aktifkan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable aquavision
sudo systemctl start aquavision
sudo systemctl status aquavision
```

---

## 7. Nginx

Buat config:

```bash
sudo nano /etc/nginx/sites-available/aquavision
```

Isi:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    # SSL (diisi otomatis oleh Certbot)
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Static files (WhiteNoise serving via Django — Nginx bisa juga langsung)
    location /static/ {
        alias /var/www/aquavision/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files (upload foto)
    location /media/ {
        alias /var/www/aquavision/media/;
        expires 7d;
    }

    # Proxy ke Gunicorn
    location / {
        proxy_pass http://unix:/run/aquavision.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 60M;
    }
}
```

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/aquavision /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL dengan Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal sudah diatur otomatis oleh Certbot. Verifikasi:

```bash
sudo certbot renew --dry-run
```

---

## 9. Ownership & Permissions

```bash
sudo chown -R www-data:www-data /var/www/aquavision/media
sudo chown -R www-data:www-data /var/www/aquavision/logs
sudo chmod -R 755 /var/www/aquavision
```

---

## 10. Verifikasi Deployment

```bash
# Status services
sudo systemctl status aquavision
sudo systemctl status nginx
sudo systemctl status postgresql

# Test Django
source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)
python manage.py check --deploy

# Log Gunicorn
tail -f /var/www/aquavision/logs/gunicorn-error.log

# Log Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## Update Aplikasi

```bash
cd /var/www/aquavision
git pull origin main

source venv/bin/activate
export $(cat /etc/aquavision.env | xargs)

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

sudo systemctl restart aquavision
```

---

## Troubleshooting Umum

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| 502 Bad Gateway | Gunicorn tidak berjalan | `sudo systemctl restart aquavision` |
| CSRF Failed (403) | `CSRF_TRUSTED_ORIGINS` salah | Cek env var, harus include `https://` |
| Static tidak muncul | `collectstatic` belum dijalankan | `python manage.py collectstatic --noinput` |
| Upload gagal | GDAL path salah | Cek `GDAL_LIBRARY_PATH` di env |
| Google OAuth gagal | Client ID/Secret salah | Cek Google Cloud Console credentials |
| `ModuleNotFoundError` | venv tidak aktif | `source venv/bin/activate` |
