# 22 – KNOWLEDGE GRAPH

*Relasi pengetahuan antar entitas dalam ekosistem AQUAVISION. Digunakan untuk pemahaman kontekstual oleh AI Assistant.*

---

## Relasi Utama: Sistem & Komponen

```
AQUAVISION
├── adalah → WebGIS (Web-based Geographic Information System)
├── dikembangkan oleh → Tim Mahasiswa ITB (Najwa, Rayhan, Radja)
├── bertujuan → Pengelolaan SDA Desa Wisata Wonotoro
├── wilayah studi → Desa Wonotoro, Kab. Probolinggo, Jawa Timur
├── menggunakan arsitektur → Three-Tier Client-Server
├── teknologi backend → Django 4.2 + GeoDjango
├── teknologi frontend → Leaflet.js 1.9 + HTML5 + CSS3 + JavaScript
├── database → PostgreSQL 14 + PostGIS 3.3
├── standar kualitas → ISO/IEC 25010:2011
├── standar keamanan → OWASP
├── standar data geospasial → OGC Standards + RFC 7946 (GeoJSON)
└── diuji dengan → Functional Suitability + Performance + Compatibility + Usability
```

---

## Relasi: Layer Data

```
Layer AQUAVISION
├── Sumber Air (Point)
│   └── atribut → nama, debit (L/dtk), jenis_sumber, kondisi
│   └── digunakan untuk → perhitungan ketersediaan air (supply)
│
├── Tandon Air (Point)
│   └── atribut → nama, kapasitas_m3, elevasi (m)
│   └── digunakan untuk → infrastruktur distribusi air
│
├── Jaringan Pipa (MultiLineString)
│   └── atribut → diameter_mm, kondisi, tahun_pasang
│   └── digunakan untuk → pemetaan distribusi air
│
├── Permukiman (Point)
│   └── atribut → nama_dusun, jumlah_penduduk, rata_rata_kebutuhan
│   └── digunakan untuk → perhitungan kebutuhan air domestik
│
├── Fasilitas Wisata (Point) [Hotel, Resto, Jasa]
│   └── atribut → jenis, kamar, kapasitas, kebutuhan_air_harian
│   └── digunakan untuk → perhitungan kebutuhan air sektor wisata
│
├── Administrasi Desa (MultiPolygon)
│   └── atribut → wadmkd, wadmkc, wadmkk, wadmpr
│   └── digunakan untuk → batas referensi wilayah
│
├── Potensi Air Tanah (MultiPolygon)
│   └── atribut → kelas_potensi (Low/Moderate/High/Very High), luas_ha
│   └── dihasilkan dari → Pemodelan GWP (AHP + Weighted Overlay)
│
└── Debit Puncak Aliran (Raster GeoTIFF, 12 layer)
    └── atribut → nilai debit (m³/s) per piksel per bulan
    └── dihasilkan dari → Pemodelan SCS-CN + Metode Rasional
```

---

## Relasi: Pemodelan Potensi Air Tanah (GWP)

```
Potensi Air Tanah (GWP)
│
└── dihitung menggunakan → Metode GIS-MCDM berbasis AHP
    │
    └── AHP menggunakan 7 parameter:
        ├── Rainfall (bobot 0,40)
        │   └── sumber data → CHIRPS v.03 (rata-rata 2016–2025)
        │
        ├── Geology/Lithology (bobot 0,23)
        │   └── sumber data → ESDM GeoMap (1:100.000)
        │
        ├── Lineament Density (bobot 0,13)
        │   └── diturunkan dari → DEM SRTM 30 m
        │
        ├── Elevation (bobot 0,09)
        │   └── sumber data → DEM SRTM 30 m
        │
        ├── Slope (bobot 0,07)
        │   └── diturunkan dari → DEM SRTM 30 m
        │
        ├── Drainage Density (bobot 0,05)
        │   └── diturunkan dari → DEM SRTM 30 m
        │
        └── Land Use/Cover (bobot 0,03)
            └── sumber data → ESA WorldCover 2021 (10 m)
    │
    ├── proses → Pre-Processing → Reklasifikasi → Weighted Overlay → Klasifikasi
    │
    ├── menghasilkan kelas → Low | Moderate | High | Very High
    │
    ├── hasil wilayah studi →
    │   ├── Low: 11% (20 km²)
    │   ├── Moderate: 29% (50 km²)
    │   ├── High: 43% (76 km²) ← dominan
    │   └── Very High: 17% (29 km²)
    │
    └── referensi → Tesfa & Sewnet (2025)
```

---

## Relasi: Pemodelan Debit Puncak Aliran

```
Debit Puncak Aliran (Qp)
│
└── dihitung menggunakan → SCS-CN + Metode Rasional
    │
    ├── INPUT 1: DEM DEMNAS (~8,1 m)
    │   └── menghasilkan →
    │       ├── Fill Sink
    │       ├── Flow Direction (D8)
    │       ├── Flow Accumulation
    │       ├── Jaringan Aliran (Stream Network)
    │       └── Batas DAS (luas 289,164 km²)
    │
    ├── INPUT 2: Curah Hujan CHIRPS v2.0 (1996–2025, 30 tahun)
    │   └── menghasilkan → 12 raster curah hujan klimatologis bulanan
    │   └── digunakan untuk → Intensitas Hujan (I = P_bulan / n×24 jam)
    │
    ├── INPUT 3: Tutupan Lahan ESA WorldCover 2021 (10 m)
    │   └── direklasifikasi ke → Kelas CN (Hutan, Semak, Permukiman, dll.)
    │   └── dioverlay dengan → Jenis Tanah
    │
    ├── INPUT 4: Jenis Tanah FAO DSMW (1:5.000.000)
    │   └── direklasifikasi ke → Kode Tanah CN (Mediteran, Aluvial, Andosol)
    │
    ├── PROSES PERHITUNGAN:
    │   ├── CN (Curve Number) = f(tutupan lahan × jenis tanah)
    │   ├── S (Retensi Maks) = 25400/CN − 254
    │   ├── Ia (Initial Abstraction) = 0,2 × S
    │   ├── Q (Limpasan) = (P−Ia)² / (P+S−Ia)
    │   ├── C (Koef. Limpasan) = Q / P
    │   └── Qp (Debit Puncak) = 0,278 × C × I × A
    │
    └── menghasilkan → 12 raster debit puncak bulanan
        ├── Tertinggi → Februari (rata-rata 14,942 m³/s; maks 40,485 m³/s)
        └── Terendah → September (rata-rata 0,138 m³/s)
```

---

## Relasi: Neraca Air & Fitur AQUAVISION

```
Neraca Air (Water Balance)
│
├── Supply (Ketersediaan Air)
│   └── bersumber dari → Total Debit Sumber Air (L/dtk, dari layer Sumber Air)
│
├── Demand (Kebutuhan Air)
│   ├── Domestik → Jumlah Penduduk × 120 L/orang/hari
│   ├── Hotel/Homestay → Jumlah Kamar × 250 L/kamar/hari
│   └── Restoran → Jumlah Kursi × 25 L/kursi/hari
│
├── Persentase Pemanfaatan = Demand / Supply × 100%
│
├── Status:
│   ├── Aman → pemanfaatan < 50%
│   ├── Waspada → pemanfaatan 50–80%
│   └── Kritis → pemanfaatan > 80%
│
├── ditampilkan di → Panel Neraca Air pada Dashboard WebGIS
│   └── divisualisasikan dengan → Gauge Chart + Angka + Status Berwarna
│
└── dapat disimulasikan melalui → Fitur Simulasi Skenario
    └── parameter yang bisa diubah:
        ├── Jumlah Penduduk
        ├── Jumlah Kamar Hotel/Homestay
        ├── Kapasitas Restoran
        └── Luas Lahan Pertanian
```

---

## Relasi: Pengguna & Hak Akses

```
Pengguna AQUAVISION
│
├── Guest (tidak login)
│   └── dapat akses → Landing Page, Feedback Publik
│
├── User (sudah registrasi & login)
│   ├── dapat akses → Dashboard WebGIS, Peta, Neraca Air, Simulasi
│   ├── dapat akses → Data Portal (dataset umum), Download dataset umum
│   └── dapat → Hubungi Admin (kirim pesan), Feedback
│
├── Admin
│   ├── semua akses User +
│   ├── dapat → Input data manual, Upload Shapefile, Edit, Hapus data
│   ├── dapat akses → Dataset sensitif (potensi air tanah, pipa, DAS)
│   └── dapat → Balas pesan di Hubungi Admin, Audit Log, Download Log
│
└── Super Admin (via Django superuser)
    └── semua akses Admin + Panel Admin Django + Kelola User & Grup
```

---

## Relasi: Masalah → Solusi AQUAVISION

```
Masalah 1: Fragmentasi data aset SDA
└── diselesaikan oleh → Dashboard WebGIS multi-layer
    └── semua aset tersaji dalam satu platform

Masalah 2: Penurunan debit vs lonjakan kebutuhan wisata
└── diselesaikan oleh → Fitur Analisis Ketersediaan Air + Simulasi Skenario
    └── monitoring balance supply-demand dengan status Aman/Waspada/Kritis

Masalah 3: Tidak ada identifikasi zona air baru
└── diselesaikan oleh → Layer Potensi Air Tanah (GWP)
    └── zona resapan teridentifikasi secara spasial

Masalah 4: Tidak ada informasi pola musiman debit
└── diselesaikan oleh → Layer Debit Puncak Aliran Bulanan (12 layer)
    └── pola musiman debit dapat dipahami dan dimanfaatkan untuk perencanaan

Masalah 5: Estimasi kebutuhan material pipa sulit
└── diselesaikan oleh → Fitur Pengukuran Jarak
    └── estimasi panjang pipa baru langsung dari peta
```

---

## Relasi: Desa Wonotoro & Konteks

```
Desa Wonotoro
├── lokasi → Kabupaten Probolinggo, Jawa Timur
├── status → Desa Wisata (diakui Kemenparekraf – Jadesta)
├── kawasan → Penyangga Taman Nasional Bromo Tengger Semeru
├── masalah utama → Krisis air bersih, terutama saat musim kemarau
├── event terkait → Kebakaran Bromo 2023 (jalur pipa rusak, data tidak ada)
├── DAS yang berkontribusi → 289,164 km²
└── pemangku kepentingan:
    ├── Pemerintah Desa / BUMDes
    ├── Pengelola Wisata (hotel, restoran, jasa)
    └── Masyarakat / Wisatawan
```
