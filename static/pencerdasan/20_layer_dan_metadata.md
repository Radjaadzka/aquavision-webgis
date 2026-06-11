# 20 – LAYER DAN METADATA

*File ini mendeskripsikan setiap layer data yang tersedia di AQUAVISION secara detail untuk keperluan AI Assistant, RAG, dan pengguna.*

---

# Layer 1: Potensi Air Tanah (Groundwater Potential Zone)

## Kategori
Layer Analitik Spasial – Hasil Pemodelan

## Deskripsi
Peta potensi air tanah yang menunjukkan tingkat potensi relatif wilayah dalam mendukung keberadaan, pergerakan, dan pengisian air tanah berdasarkan kombinasi 7 parameter fisik yang dibobotkan dengan metode AHP.

## Tujuan
Membantu identifikasi zona prioritas untuk konservasi sumber daya air, pencarian sumber air baru, dan investigasi lanjutan (sumur bor, survei geolistrik).

## Sumber Data
- Rainfall: CHIRPS v.03 (rata-rata 2016–2025)
- Geology/Lithology: ESDM GeoMap (1:100.000)
- Land Use/Cover: ESA WorldCover 2021 (10 m)
- DEM (Elevation, Slope, Drainage Density, Lineament Density): SRTM 30 m

## Metode
GIS-MCDM berbasis AHP (Analytical Hierarchy Process); Weighted Overlay; Equal Interval Classification.

## Resolusi Spasial
30 × 30 m (resolusi analisis)

## Format Data
Vektor MultiPolygon (GeoJSON)

## Kegunaan bagi Pengguna
- Identifikasi lokasi potensial untuk eksplorasi air tanah.
- Dasar perencanaan konservasi wilayah resapan air.
- Informasi pendukung keputusan pengelolaan SDA jangka panjang.

## Cara Membaca Layer
- Layer ditampilkan sebagai poligon berwarna tematik.
- Setiap poligon mewakili suatu kelas potensi air tanah.
- Klik poligon untuk melihat atribut: nama, kelas_potensi, luas_ha.

## Interpretasi Nilai

| Kelas | Rentang Indeks | Luas (km²) | % | Makna |
|---|---|---|---|---|
| Low | 1,61–2,43 | 20 | 11% | Kondisi fisik kurang mendukung infiltrasi dan penyimpanan air tanah |
| Moderate | 2,43–3,26 | 50 | 29% | Kondisi fisik cukup mendukung; area penyangga |
| High | 3,26–4,08 | 76 | 43% | Kondisi fisik mendukung; zona prioritas konservasi |
| Very High | 4,08–4,90 | 29 | 17% | Kondisi fisik sangat mendukung; zona prioritas tertinggi |

## Pertanyaan yang Sering Muncul
- **"Apakah ada air tanah di zona High?"** → Zona High menunjukkan potensi yang baik, tetapi bukan jaminan pasti ada air. Survei lapangan tetap diperlukan.
- **"Berapa luas zona very high?"** → ~29 km² atau 17% dari total wilayah studi.
- **"Zona mana yang paling bagus untuk sumur bor?"** → Zona High dan Very High adalah prioritas untuk eksplorasi.
- **"Data ini dari kapan?"** → Rainfall dari rata-rata 2016–2025; tutupan lahan 2021; geologi tidak berperiodisasi (statis).

---

# Layer 2: Debit Puncak Aliran

## Kategori
Layer Analitik Raster – Hasil Pemodelan (12 Layer Bulanan)

## Deskripsi
Peta debit puncak aliran bulanan yang menampilkan estimasi nilai debit maksimum pada jaringan sungai per bulan, berdasarkan curah hujan klimatologis 1996–2025 dan karakteristik fisik DAS Wonotoro (luas 289,164 km²).

## Tujuan
Memahami pola musiman debit air permukaan, identifikasi periode potensi limpasan tinggi, dan dasar perencanaan distribusi air.

## Sumber Data
- DEM: DEMNAS BIG (~8,1 m)
- Curah Hujan: CHIRPS v2.0 klimatologis 1996–2025
- Tutupan Lahan: ESA WorldCover 2021
- Jenis Tanah: FAO DSMW

## Metode
SCS-CN (limpasan permukaan) + Metode Rasional (debit puncak).

## Resolusi Spasial
10 m (resolusi analisis)

## Format Data
Raster (GeoTIFF) – 12 file, satu per bulan (Januari–Desember)

## Kegunaan bagi Pengguna
- Identifikasi bulan dengan potensi debit tinggi (risiko limpasan/banjir).
- Identifikasi bulan dengan debit rendah (risiko kekurangan air).
- Perencanaan distribusi air berdasarkan kondisi musiman.

## Cara Membaca Layer
- Pilih bulan dari dropdown di panel layer.
- Raster ditampilkan dengan gradasi warna (biru muda = rendah, biru tua = tinggi).
- Klik piksel di peta untuk melihat nilai debit (m³/s) pada titik tersebut.

## Interpretasi Nilai (Rata-rata Bulanan)

| Bulan | Rata-rata (m³/s) | Kategori |
|---|---|---|
| Januari | 14,477 | Musim Hujan – Tinggi |
| Februari | 14,942 | Musim Hujan – Tertinggi |
| Maret | 13,552 | Musim Hujan – Tinggi |
| April | 6,026 | Transisi – Menurun |
| Mei | 3,583 | Transisi – Menurun |
| Juni | 1,254 | Kemarau – Rendah |
| Juli | 0,668 | Kemarau – Rendah |
| Agustus | 0,143 | Kemarau – Terendah |
| September | 0,138 | Kemarau – Terendah |
| Oktober | 2,726 | Transisi – Meningkat |
| November | 6,774 | Transisi – Meningkat |
| Desember | 13,595 | Musim Hujan – Tinggi |

## Pertanyaan yang Sering Muncul
- **"Debit puncak tertinggi bulan apa?"** → Februari (rata-rata 14,942 m³/s; maks 40,485 m³/s).
- **"Kapan musim kemarau debit paling rendah?"** → September dan Agustus (sekitar 0,138–0,143 m³/s).
- **"Ini debit sekarang atau perkiraan?"** → Ini adalah estimasi klimatologis berdasarkan rata-rata 30 tahun (1996–2025), bukan debit aktual hari ini.

---

# Layer 3: Sumber Air

## Kategori
Layer Inventarisasi – Data Lapangan

## Deskripsi
Titik-titik lokasi sumber air yang terdaftar di Desa Wonotoro, termasuk mata air alami, sumur, atau sumber air lainnya.

## Tipe Geometri
Point (PointField)

## Field Utama
nama, lokasi, debit (L/dtk), jenis_sumber, kondisi, tahun_pendataan, foto_dokumentasi

## Kegunaan bagi Pengguna
- Mengetahui lokasi sumber air terdekat dari suatu titik.
- Melihat debit dan kondisi setiap sumber air.
- Dasar perhitungan ketersediaan air (supply) dalam neraca air.

## Cara Membaca Layer
- Setiap titik mewakili satu sumber air.
- Klik titik untuk melihat nama, jenis, debit, dan kondisi sumber air.
- Satuan debit: L/detik (liter per detik).

## Interpretasi
- Debit lebih tinggi = sumber air lebih produktif.
- Kondisi sumber air menunjukkan apakah sumber masih aktif/berfungsi.

---

# Layer 4: Tandon Air

## Kategori
Layer Inventarisasi – Infrastruktur

## Deskripsi
Lokasi tandon/reservoir penyimpanan air yang ada di Desa Wonotoro.

## Tipe Geometri
Point (PointField)

## Field Utama
nama, lokasi, kapasitas_m3, elevasi (m)

## Kegunaan bagi Pengguna
- Mengetahui lokasi dan kapasitas tampungan air.
- Perencanaan sistem distribusi air.

## Cara Membaca Layer
- Klik titik tandon untuk melihat kapasitas (m³) dan elevasi (m dpl).
- Elevasi penting untuk sistem distribusi gravitasi.

---

# Layer 5: Jaringan Pipa

## Kategori
Layer Inventarisasi – Infrastruktur

## Deskripsi
Jaringan distribusi pipa air yang menghubungkan sumber air ke permukiman dan fasilitas di Desa Wonotoro.

## Tipe Geometri
MultiLineString (MultiLineStringField)

## Field Utama
nama, geom, diameter_mm, kondisi, tahun_pasang

## Kegunaan bagi Pengguna
- Memetakan rute distribusi air yang sudah ada.
- Identifikasi jalur pipa yang perlu diperbaiki/diperluas.
- Estimasi panjang pipa menggunakan fitur pengukuran jarak.

## Cara Membaca Layer
- Setiap garis mewakili segmen pipa.
- Warna garis dapat menunjukkan kondisi pipa.
- Klik garis untuk informasi diameter dan kondisi.

---

# Layer 6: Daerah Aliran Sungai (Jaringan Sungai)

## Kategori
Layer Analitik – Jaringan Hidrologi

## Deskripsi
Jaringan sungai dan aliran permukaan yang diekstraksi dari Digital Elevation Model (DEM) di wilayah studi Desa Wonotoro. Layer ini menampilkan rute aliran air dari hulu ke hilir sebagai garis (LineString).

> **Catatan penting:** Layer ini menampilkan JARINGAN SUNGAI (stream network), bukan batas polygon DAS. Batas polygon daerah tangkapan air (DAS, luas 289,164 km²) disimpan sebagai data referensi internal dan belum diekspos sebagai layer terpisah di WebGIS versi saat ini.

## Tipe Geometri
MultiLineString (Garis)

## Sumber Data
DEM SRTM 30 m / DEMNAS BIG (~8,1 m)

## Metode
Ekstraksi jaringan aliran dari DEM menggunakan: Fill Sink → Flow Direction (D8) → Flow Accumulation → Stream Extraction (dengan ambang batas flow accumulation)

## Resolusi Spasial
Turunan dari DEM; garis vektor (tidak berbasis piksel)

## Format Data
GeoJSON / Shapefile

## Kegunaan bagi Pengguna
- Memahami pola aliran air permukaan di wilayah Desa Wonotoro.
- Konteks spasial untuk interpretasi peta debit puncak aliran.
- Identifikasi sungai dan saluran air utama.

## Cara Membaca Layer
- Setiap garis mewakili segmen sungai atau saluran aliran.
- Jaringan ini adalah dasar untuk memahami ke mana air mengalir setelah hujan.
- Hubungan antara jaringan sungai dan debit puncak: semakin besar accumulation flow → segmen sungai lebih besar → debit lebih tinggi.

## Interpretasi
- Percabangan aliran yang banyak menunjukkan morfologi DAS dengan banyak sub-DAS.
- Jaringan utama (orde tinggi) mengakumulasi aliran dari seluruh wilayah.

## Informasi DAS (Daerah Aliran Sungai — Referensi Internal)
Batas daerah tangkapan air (DAS polygon):
- **Luas:** 289,164 km²
- **Status di WebGIS:** Disimpan sebagai data referensi internal, belum diekspos sebagai layer yang dapat ditampilkan pengguna.
- **Relevansi:** Batas DAS ini digunakan sebagai domain analisis debit puncak aliran (file 09_pemodelan_debit_puncak.md).

---

# Layer 7: Administrasi Desa

## Kategori
Layer Referensi – Batas Administratif

## Deskripsi
Batas wilayah administratif Desa Wonotoro dan desa-desa sekitarnya di Kecamatan Sukapura, Kabupaten Probolinggo.

## Tipe Geometri
MultiPolygon (SRID 4326)

## Sumber Data
BIG (Badan Informasi Geospasial) / Kemendagri

## Metode
Digitasi dari peta RBI skala 1:50.000

## Resolusi Spasial
Poligon vektor (tidak berbasis piksel)

## Format Data
GeoJSON / Shapefile

## Field Utama
namobj, wadmkd (nama desa), wadmkc (nama kecamatan), wadmkk (nama kabupaten), wadmpr (nama provinsi), luas, geom

## Kegunaan bagi Pengguna
- Referensi batas wilayah untuk interpretasi data layer lainnya.
- Identifikasi dusun atau wilayah administrasi tertentu.
- Konteks spasial bagi semua analisis yang bersifat administratif.

## Cara Membaca Layer
- Layer ditampilkan sebagai poligon transparan dengan garis batas berwarna merah.
- Klik poligon untuk melihat nama desa, kecamatan, kabupaten, provinsi, dan luas wilayah.

## Interpretasi
- Batas administrasi berbeda dari batas DAS. Analisis hidrologi (debit puncak, GWP) menggunakan batas DAS (289,164 km²), bukan batas administratif.
- Desa Wonotoro berada di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur.

---

# Layer 8: Hotel / Akomodasi

## Kategori
Layer Inventarisasi – Fasilitas Wisata

## Deskripsi
Lokasi penginapan, hotel, homestay, dan fasilitas akomodasi lainnya di Desa Wonotoro. Termasuk dalam model FasilitasWisata dengan nilai jenis = 'hotel' atau 'homestay'.

## Tipe Geometri
Point (PointField)

## Sumber Data
Survey lapangan GPS + validasi Google Maps; Tim AQUAVISION

## Metode
Pendataan lapangan (survei primer)

## Resolusi Spasial
Titik (Point)

## Format Data
GeoJSON / CSV / Shapefile

## Field Utama
nama, jenis (hotel/homestay), lokasi, kamar, kapasitas, kebutuhan_air_harian (L/hari)

## Kegunaan bagi Pengguna
- Peta sebaran akomodasi wisata di Desa Wonotoro.
- Dasar perhitungan kebutuhan air sektor akomodasi (standar: 250 L/kamar/hari, SNI 03-7065-2005).
- Perencanaan infrastruktur air untuk mendukung pertumbuhan wisata.

## Cara Membaca Layer
- Setiap titik mewakili satu fasilitas akomodasi.
- Klik titik untuk melihat nama, jumlah kamar, kapasitas, dan kebutuhan air harian.

## Interpretasi
- Kebutuhan air harian hotel = Jumlah Kamar × 250 L/hari.
- Fasilitas dengan jumlah kamar lebih banyak membutuhkan pasokan air lebih besar.
- Data ini digunakan dalam perhitungan neraca air (demand sektor akomodasi).

---

# Layer 9: Tempat Makan

## Kategori
Layer Inventarisasi – Fasilitas Wisata

## Deskripsi
Lokasi restoran, warung makan, kedai, dan fasilitas kuliner lainnya di Desa Wonotoro. Termasuk dalam model FasilitasWisata dengan nilai jenis = 'resto'.

## Tipe Geometri
Point (PointField)

## Sumber Data
Survey lapangan GPS + validasi Google Maps; Tim AQUAVISION

## Metode
Pendataan lapangan (survei primer)

## Resolusi Spasial
Titik (Point)

## Format Data
GeoJSON / CSV / Shapefile

## Field Utama
nama, jenis (restoran/warung), lokasi, kapasitas (jumlah kursi), kebutuhan_air_harian (L/hari)

## Kegunaan bagi Pengguna
- Peta sebaran fasilitas kuliner di kawasan wisata Desa Wonotoro.
- Dasar perhitungan kebutuhan air sektor restoran (standar: 25 L/kursi/hari, Ditjen Cipta Karya).
- Informasi bagi wisatawan mengenai lokasi tempat makan.

## Cara Membaca Layer
- Setiap titik mewakili satu fasilitas makan.
- Klik titik untuk melihat nama, kapasitas (jumlah kursi), dan kebutuhan air harian.

## Interpretasi
- Kebutuhan air harian restoran = Jumlah Kursi × 25 L/hari.
- Data ini digunakan dalam perhitungan neraca air (demand sektor restoran).

---

# Layer 10: Jasa (Fasilitas Jasa Wisata)

## Kategori
Layer Inventarisasi – Fasilitas Wisata

## Deskripsi
Lokasi fasilitas jasa pendukung pariwisata di Desa Wonotoro: pemandu wisata, penyewaan kendaraan/jeep, ticketing, dan layanan wisata lainnya. Termasuk dalam model FasilitasWisata dengan nilai jenis = 'jasa'.

## Tipe Geometri
Point (PointField)

## Sumber Data
Survey lapangan GPS + validasi Google Maps; Tim AQUAVISION

## Metode
Pendataan lapangan (survei primer)

## Resolusi Spasial
Titik (Point)

## Format Data
GeoJSON / CSV / Shapefile

## Field Utama
nama, jenis (jasa), lokasi, kapasitas, kebutuhan_air_harian (L/hari)

## Kegunaan bagi Pengguna
- Peta sebaran fasilitas jasa wisata di Desa Wonotoro.
- Identifikasi lokasi layanan pendukung pariwisata bagi wisatawan.

## Cara Membaca Layer
- Setiap titik mewakili satu fasilitas jasa.
- Klik titik untuk melihat nama, kapasitas, dan kebutuhan air harian.

## Interpretasi
- Fasilitas jasa berkontribusi pada kebutuhan air wisata meski lebih kecil dibanding hotel atau restoran.
- Data ini dapat memperkaya analisis neraca air dengan memperhitungkan seluruh sektor wisata.

---

# Layer 11: Permukiman

## Kategori
Layer Inventarisasi – Data Sosial

## Deskripsi
Lokasi dusun/permukiman warga di Desa Wonotoro beserta data kependudukan.

## Tipe Geometri
Point (PointField)

## Field Utama
nama_dusun, lokasi, jumlah_kk, jumlah_penduduk, kategori_pelanggan, rata_rata_kebutuhan (L/hari)

## Kegunaan bagi Pengguna
- Peta sebaran permukiman.
- Dasar perhitungan kebutuhan air domestik (120 L/orang/hari).
- Perencanaan perluasan jaringan distribusi air.

## Cara Membaca Layer
- Klik titik permukiman untuk melihat jumlah KK, penduduk, dan kebutuhan air rata-rata.

---

# Rangkuman Layer AQUAVISION

| No | Nama Layer | Tipe | Sumber | Status Publik |
|---|---|---|---|---|
| 1 | Potensi Air Tanah | Vektor Poligon | Pemodelan GWP | Login required |
| 2 | Debit Puncak Aliran (Jan–Des) | Raster GeoTIFF | Pemodelan SCS-CN | Login required |
| 3 | Sumber Air | Vektor Titik | Inventarisasi Lapangan | Login required |
| 4 | Tandon Air | Vektor Titik | Inventarisasi Lapangan | Login required |
| 5 | Jaringan Pipa | Vektor Garis | Inventarisasi Lapangan | Login required |
| 6 | DAS | Vektor Poligon | Pemodelan Hidrologi | Belum diekspos publik |
| 7 | Administrasi Desa | Vektor Poligon | BIG/Kemendagri | Login required |
| 8 | Hotel/Akomodasi | Vektor Titik | Inventarisasi Lapangan | Login required |
| 9 | Tempat Makan/Restoran | Vektor Titik | Inventarisasi Lapangan | Login required |
| 10 | Jasa Wisata | Vektor Titik | Inventarisasi Lapangan | Login required |
| 11 | Permukiman | Vektor Titik | Data BPS/Desa | Login required |
