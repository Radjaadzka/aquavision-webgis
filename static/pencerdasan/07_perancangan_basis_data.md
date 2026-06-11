# 07 – PERANCANGAN BASIS DATA

## Ringkasan

AQUAVISION menggunakan **PostgreSQL 14 + PostGIS 3.3** untuk menyimpan data spasial dan non-spasial. Terdapat 9 model data utama yang terbagi menjadi model spasial (8 model) dan model non-spasial (sejumlah model pendukung).

Seluruh data spasial menggunakan sistem referensi koordinat **WGS 84 (EPSG:4326)**.

---

## Model Data Spasial

| Model | Tipe Geometri | Field Utama | Peran dalam Sistem |
|---|---|---|---|
| **SumberAir** | PointField | nama, lokasi, debit (Float, L/dtk), jenis_sumber, kondisi, tahun_pendataan, foto_dokumentasi | Sumber data ketersediaan air (supply) |
| **FasilitasWisata** | PointField | nama, jenis (hotel/resto/homestay/jasa), lokasi, kamar, kapasitas, kebutuhan_air_harian (L/hari) | Data kebutuhan air sektor wisata |
| **Permukiman** | PointField | nama_dusun, lokasi, jumlah_kk, jumlah_penduduk, kategori_pelanggan, rata_rata_kebutuhan (L/hari) | Data kebutuhan air domestik |
| **JaringanPipa** | MultiLineStringField | nama, geom, diameter_mm, kondisi, tahun_pasang | Jaringan distribusi air |
| **TandonAir** | PointField | nama, lokasi, kapasitas_m3, elevasi (m) | Infrastruktur penyimpanan air |
| **Daerah Potensi Air Tanah** | MultiPolygonField | nama, geom, kelas_potensi, luas_ha | Zonasi daerah resapan air tanah |
| **Debit Puncak Air** | MultiPolygonField | nama, geom, luas_ha | Batas daerah tangkapan air |
| **AdministrasiDesa** | MultiPolygonField (SRID 4326) | namobj, wadmkd, wadmkc, wadmkk, wadmpr, luas, geom | Batas administrasi wilayah |

---

## Model Data Non-Spasial

| Model | Fungsi |
|---|---|
| **User** | Menyimpan data akun pengguna sistem |
| **Group** | Mengelola hak akses berdasarkan peran pengguna (Admin / User) |
| **Feedback** | Menyimpan masukan dan saran dari pengguna publik (nama, pesan, tanggal) |
| **Conversation** | Mengelola percakapan antara pengguna dan administrator |
| **Message** | Menyimpan pesan dalam percakapan |
| **Notification** | Menyimpan notifikasi sistem kepada pengguna |
| **AuditLog** | Mencatat aktivitas pengguna dalam sistem |
| **DownloadLog** | Mencatat aktivitas pengunduhan dataset |

---

## Atribut Penting SumberAir

| Field | Tipe | Keterangan |
|---|---|---|
| nama | CharField | Nama sumber air |
| lokasi | PointField | Koordinat geografis (EPSG:4326) |
| debit | FloatField | Debit dalam satuan L/detik |
| jenis_sumber | CharField | Jenis sumber (mata air, sumur, dll.) |
| kondisi | CharField | Kondisi fisik sumber air |
| tahun_pendataan | IntegerField | Tahun data dikumpulkan |
| foto_dokumentasi | ImageField | Foto dokumentasi lokasi |

---

## Atribut Penting FasilitasWisata

| Field | Tipe | Keterangan |
|---|---|---|
| nama | CharField | Nama fasilitas |
| jenis | CharField | hotel / restoran / homestay / jasa |
| lokasi | PointField | Koordinat geografis |
| kamar | IntegerField | Jumlah kamar (untuk akomodasi) |
| kapasitas | IntegerField | Kapasitas tamu / kursi |
| kebutuhan_air_harian | FloatField | Estimasi kebutuhan air per hari (L/hari) |

---

## Kelompok Layanan Data

| Kelompok Layanan | Fungsi |
|---|---|
| Layanan Data Spasial | Menyediakan layer geospasial dalam format GeoJSON |
| Layanan Analisis | Menyediakan informasi ketersediaan dan kebutuhan air |
| Layanan Manajemen Data | Mendukung CRUD data (tambah, ubah, hapus) |
| Layanan Unduhan Data | Menyediakan ekspor data dalam berbagai format |
| Layanan Feedback | Menampung dan mengelola masukan pengguna |

---

## Operasi CRUD

| Operasi | Fungsi | Keterangan |
|---|---|---|
| Create | `create_*()` | Menambahkan data baru ke basis data |
| Read | Endpoint GeoJSON | Menampilkan data pada WebGIS |
| Update | `edit_data()` | Memperbarui atribut dan lokasi objek |
| Delete | `delete_data()` | Menghapus data dari basis data |

---

## Serializer

Setiap model spasial memiliki serializer menggunakan `GeoFeatureModelSerializer` dari Django REST Framework GIS. Ini memungkinkan data spasial dikemas dalam format GeoJSON untuk dikirim ke Leaflet.js.

| Serializer | Model | Geo Field |
|---|---|---|
| SumberAirSerializer | SumberAir | lokasi |
| FasilitasWisataSerializer | FasilitasWisata | lokasi |
| PermukimanSerializer | Permukiman | lokasi |
| DaerahPotensiAirSerializer | DaerahPotensi | geom |
| DebitAirSerializer | DebitAir | geom |
| JaringanPipaSerializer | JaringanPipa | geom |
| TandonSerializer | TandonAir | lokasi |
| DASSerializer | DAS | lokasi |

---

## Format Download Data

| Format | Kegunaan |
|---|---|
| CSV | Analisis tabular dan pengolahan data statistik |
| GeoJSON | Pertukaran data spasial berbasis web |
| KML | Visualisasi data pada Google Earth dan perangkat lunak sejenis |
| Shapefile (.zip) | Analisis dan pengolahan data pada perangkat lunak SIG desktop |

---

## Catatan Teknis Penyimpanan Raster

- Data raster debit puncak bulanan (12 file GeoTIFF) **tidak** disimpan di dalam PostgreSQL/PostGIS.
- File GeoTIFF disimpan sebagai file eksternal di direktori server.
- Dimuat oleh browser secara on-demand menggunakan pustaka GeoRaster.
- Ini adalah keterbatasan yang diidentifikasi dalam dokumen; pengembangan lanjutan perlu mengintegrasikan raster ke dalam basis data spasial.
