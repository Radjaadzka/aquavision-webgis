# 19 – SUMBER DATA

## Data untuk Pemodelan Potensi Air Tanah (GWP)

| Data | Sumber | URL / Lokasi | Format | Resolusi | Periode | Parameter |
|---|---|---|---|---|---|---|
| Curah Hujan | CHIRPS v.03 (Climate Hazards Group InfraRed Precipitation with Station Data) | Climate Hazards Center – UC Santa Barbara | Raster | 0,05° (~5 km) | Rata-rata 2016–2025 (10 tahun) | Rainfall |
| Geologi/Litologi | ESDM GeoMap (Kementerian ESDM) | – | Vektor polygon | Skala 1:100.000 | – | Geology/Lithology |
| Tutupan Lahan | ESA WorldCover 2021 (European Space Agency) | – | Raster | 10 × 10 m | 2021 | Land Use/Cover |
| Model Elevasi Digital | SRTM (Shuttle Radar Topography Mission) | – | Raster | 30 × 30 m (1 arc-second) | – | Elevation, Slope, Drainage Density, Lineament Density |
| Validasi Air Tanah | Borehole/Well Log | Tidak tersedia untuk wilayah studi | – | – | – | Verifikasi (tidak dilakukan karena data tidak tersedia) |

---

## Data untuk Pemodelan Debit Puncak Aliran

| Data | Sumber | Format | Resolusi | Periode | Parameter |
|---|---|---|---|---|---|
| Digital Elevation Model | DEMNAS (BIG – Badan Informasi Geospasial) | Raster | ~8,1 m | – | DEM, Flow Direction, Flow Accumulation, Jaringan Aliran, DAS |
| Curah Hujan Bulanan Klimatologis | CHIRPS v2.0 | Raster | 0,05° (~5,5 km) | 1996–2025 (30 tahun) | Intensitas hujan, limpasan per bulan |
| Tutupan Lahan | ESA WorldCover 2021 | Raster | 10 m | 2021 | Penentuan nilai CN |
| Jenis Tanah | FAO DSMW (Digital Soil Map of the World, Food and Agriculture Organization) | Vektor | Skala 1:5.000.000 | – | Penentuan kelompok hidrologi tanah (CN) |
| Data Debit Observasi | Tidak tersedia di wilayah studi | – | – | – | Verifikasi (digantikan NFV komparatif dengan Nst 2022) |

---

## Data Inventarisasi Lapangan (Dimasukkan ke Database)

| Data | Tipe Geometri | Sumber | Keterangan |
|---|---|---|---|
| Lokasi Sumber Air | Point | Survei lapangan / pemerintah desa | Nama, jenis, debit (L/dtk), kondisi, koordinat |
| Jaringan Pipa | MultiLineString | Pemetaan lapangan | Diameter, kondisi, tahun pasang |
| Tandon Air | Point | Survei lapangan | Nama, kapasitas (m³), elevasi (m) |
| Fasilitas Wisata (Hotel, Resto, Jasa) | Point | Pendataan lapangan | Nama, jenis, kamar, kapasitas, kebutuhan air |
| Permukiman/Dusun | Point | Data BPS/desa | Nama dusun, jumlah KK, jumlah penduduk |
| Administrasi Desa | MultiPolygon | BIG / Kemendagri | Batas wilayah administratif |

---

## Referensi Acuan Metodologi

| Referensi | Penggunaan |
|---|---|
| Tesfa, M. & Sewnet, A. (2025) | Bobot AHP, parameter GWP, klasifikasi kelas, metode weighted overlay |
| Nst/Nasution (2022) | Kerangka pemodelan debit puncak SCS-CN + Metode Rasional |
| Ouyang & Bartholic (1997) | Tabel nilai Curve Number (CN) berdasarkan tutupan lahan dan jenis tanah |
| Kartasapoetra (1991) | Tabel erodibilitas dan klasifikasi jenis tanah untuk CN |
| Saaty (2004) | Prinsip dasar Analytical Hierarchy Process (AHP) |
| Julian et al. (2026) | Pendekatan verifikasi komparatif GWP tanpa data borehole lapangan |
| Moriasi et al. (2007) | Batas toleransi 25% untuk verifikasi performa model aliran bulanan |
| WMO | Standar periode iklim 30 tahun untuk normal klimatologis |

---

## Standar dan Peraturan

| Standar / Peraturan | Relevansi |
|---|---|
| UU Nomor 17 Tahun 2019 tentang Sumber Daya Air | Definisi sumber daya air, air tanah, air permukaan |
| SNI 03-7065-2005 (Tata Cara Perencanaan Sistem Plambing) | Standar kebutuhan air hotel/homestay (250 L/kamar/hari) |
| Ditjen Cipta Karya – Standar Kebutuhan Air | Kebutuhan domestik (120 L/orang/hari) dan restoran (25 L/kursi/hari) |
| ISO/IEC 25010:2011 | Standar kualitas perangkat lunak untuk pengujian WebGIS |
| RFC 7946 | Standar format GeoJSON |
| OGC Standards | Interoperabilitas data geospasial |
| OWASP | Keamanan aplikasi web |
| INKINDO 2024 | Standar estimasi biaya konsultan untuk analisis finansial |

---

## Catatan Keterbatasan Data

1. **CHIRPS** (curah hujan): Resolusi spasial kasar (5 km); resampling ke 30 m atau 10 m hanya standardisasi grid, bukan peningkatan ketelitian.
2. **FAO DSMW** (tanah): Skala global 1:5.000.000; penyelarasan ke kelas CN bersifat pendekatan, bukan klasifikasi tanah lokal rinci.
3. **ESA WorldCover** (tutupan lahan): Klasifikasi global yang perlu diselaraskan ke kelas CN lokal melalui proses reklasifikasi.
4. **Data borehole/well log**: Tidak tersedia untuk wilayah studi; verifikasi GWP dilakukan secara komparatif terhadap literatur.
5. **Data debit observasi lapangan**: Tidak tersedia di DAS Wonotoro; verifikasi model debit dilakukan menggunakan NFV (Normalized Flow Variability) komparatif.
