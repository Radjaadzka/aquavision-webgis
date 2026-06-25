# 24 – ENTITY RELATIONSHIPS

*File ini mendefinisikan hubungan antar entitas dalam ekosistem AQUAVISION. AI Assistant harus memahami bahwa setiap entitas dapat menjadi KONTEKS, bukan selalu TOPIK UTAMA. Memahami hubungan ini mencegah kesalahan routing.*

---

## PRINSIP DASAR

```
Entitas = kata benda / nama yang muncul dalam pertanyaan

Jenis entitas:
├── TOPIK UTAMA  = apa yang ditanyakan (pokok jawaban)
├── KONTEKS      = lingkup / pembatas pertanyaan
└── AKSI         = apa yang ingin dilakukan pengguna

Contoh parsing:
"air tanah wonotoro"
  ├── TOPIK    = air tanah (→ route ke Potensi Air Tanah)
  ├── KONTEKS  = wonotoro (mempersempit ke wilayah ini)
  └── AKSI     = [tidak disebutkan, asumsikan: ingin tahu info]

"dimana wonotoro"
  ├── TOPIK    = lokasi/tempat (→ route ke info administratif)
  ├── KONTEKS  = wonotoro (entitas yang ditanyakan lokasinya)
  └── AKSI     = dimana (ingin tahu letak)
```

---

## ENTITAS UTAMA

### ENTITAS E01 – WONOTORO

**Tipe:** Wilayah / Entitas Geografis

**Definisi:** Desa Wonotoro, Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur.

**Peran dalam Pertanyaan:**
- Dapat menjadi TOPIK UTAMA → jika ditanya tentang lokasinya
- Dapat menjadi KONTEKS → jika ditanya tentang sesuatu DI Wonotoro

**Relasi dengan entitas lain:**

```
WONOTORO
├── memiliki layer → Potensi Air Tanah
├── memiliki layer → Debit Puncak Aliran
├── memiliki layer → Sumber Air
├── memiliki layer → Tandon Air
├── memiliki layer → Jaringan Pipa
├── memiliki layer → Daerah Aliran Sungai (DAS)
├── memiliki layer → Administrasi Desa
├── memiliki layer → Hotel / Penginapan
├── memiliki layer → Tempat Makan
├── memiliki layer → Jasa
├── memiliki layer → Permukiman
├── terletak di → Kecamatan Sukapura
├── terletak di → Kabupaten Probolinggo
├── terletak di → Jawa Timur
├── berada di sekitar → Taman Nasional Bromo Tengger Semeru
├── merupakan → Desa Penyangga Wisata Gunung Bromo
└── dianalisis oleh → Sistem AQUAVISION (Tim ITB 2026)
```

**Aturan Penting:**
> Ketika "Wonotoro" muncul bersama kata lain, JANGAN route ke info lokasi. Periksa topik utama terlebih dahulu.

**Contoh Parsing:**
| Pertanyaan | Topik Utama | Peran Wonotoro | Route ke |
|-----------|-------------|----------------|----------|
| "dimana wonotoro" | lokasi | TOPIK | Info administratif |
| "air tanah wonotoro" | air tanah | KONTEKS | Layer GWP |
| "debit puncak wonotoro" | debit puncak | KONTEKS | Layer Debit Puncak |
| "hotel wonotoro" | hotel | KONTEKS | Layer Hotel |
| "DAS wonotoro" | DAS | KONTEKS | Layer DAS |
| "simulasi air wonotoro" | simulasi | KONTEKS | Fitur Simulasi |

---

### ENTITAS E02 – POTENSI AIR TANAH (GWP)

**Tipe:** Layer Data / Hasil Pemodelan

**Definisi:** Peta zonasi potensi air tanah hasil analisis AHP berbasis 7 parameter hidrologi.

**Relasi:**

```
POTENSI AIR TANAH
├── dihasilkan oleh → Metode AHP (Weighted Overlay)
├── menggunakan parameter:
│   ├── Rainfall (bobot 0,40) → dari CHIRPS
│   ├── Geology/Lithology (bobot 0,23) → dari ESDM GeoMap
│   ├── Lineament Density (bobot 0,13) → dari SRTM/DEMNAS
│   ├── LULC / Tutupan Lahan (bobot 0,10) → dari ESA WorldCover
│   ├── Slope / Kelerengan (bobot 0,07) → dari SRTM/DEMNAS
│   ├── Drainage Density (bobot 0,04) → dari DEMNAS
│   └── Soil Type / Jenis Tanah (bobot 0,03) → dari FAO DSMW
├── menghasilkan kelas:
│   ├── Sangat Tinggi (10,6% luas)
│   ├── Tinggi (33,4% luas)
│   ├── Sedang (43,5% luas)
│   └── Rendah (12,4% luas)
├── berlokasi di → Wilayah Studi Wonotoro
├── ditampilkan sebagai → Layer Peta AQUAVISION
└── berkaitan dengan → Ketersediaan Air (supply)
```

**Sinonim:** air tanah, airtanah, groundwater, GWP, GWPZ, zona resapan

---

### ENTITAS E03 – DEBIT PUNCAK ALIRAN

**Tipe:** Layer Data / Hasil Pemodelan

**Definisi:** Nilai debit maksimum aliran permukaan yang dihitung per bulan menggunakan metode SCS-CN dan Metode Rasional.

**Relasi:**

```
DEBIT PUNCAK ALIRAN
├── dihitung menggunakan → SCS-CN + Metode Rasional
├── bergantung pada:
│   ├── Curah Hujan Bulanan → dari CHIRPS
│   ├── Curve Number (CN) → gabungan tutupan lahan + jenis tanah
│   ├── Luas DAS → 289,164 km²
│   └── Waktu Konsentrasi → dari karakteristik DEM
├── menghasilkan → 12 layer bulanan (Januari–Desember)
├── nilai tertinggi → Februari (rata-rata 14,942 m³/s)
├── nilai terendah → September (rata-rata 0,138 m³/s)
├── berlokasi di → DAS Wonotoro
└── terkait dengan → Risiko Banjir, Perencanaan Infrastruktur
```

**Sinonim:** debit puncak, debet puncak (typo), peak flow, limpasan, debit banjir

---

### ENTITAS E04 – DAS (DAERAH ALIRAN SUNGAI)

**Tipe:** Layer Data / Wilayah Hidrologi

**Definisi:** Area tangkapan air yang mengalirkan air hujan ke satu titik outlet. Berbeda dengan batas administrasi desa.

**Relasi:**

```
DAS WONOTORO
├── luas → 289,164 km²
├── batas → ditentukan berdasarkan DEM (bukan batas desa)
├── menjadi input → Pemodelan Debit Puncak Aliran
├── berisi → Sub-DAS, sungai, jaringan drainase
└── berbeda dari → Batas Administrasi Desa Wonotoro
```

**Aturan Penting:**
> Luas DAS (289,164 km²) tidak sama dengan luas Desa Wonotoro. DAS mengikuti batas alami topografi.

**Sinonim:** DAS, watershed, catchment area, daerah aliran, tangkapan air

---

### ENTITAS E05 – SUMBER AIR

**Tipe:** Layer Data / Infrastruktur

**Definisi:** Titik mata air/sumber air yang digunakan sebagai pasokan air bersih desa.

**Relasi:**

```
SUMBER AIR
├── tipe geometri → Point
├── atribut → nama, debit (L/dtk), jenis_sumber, kondisi
├── menjadi input → Perhitungan Ketersediaan Air (Supply)
├── terhubung ke → Jaringan Pipa (distribusi)
├── terhubung ke → Tandon Air (penampungan)
└── digunakan untuk → Neraca Air AQUAVISION
```

---

### ENTITAS E06 – TANDON AIR

**Tipe:** Layer Data / Infrastruktur

**Definisi:** Bak/tangki penampungan air yang mendistribusikan air dari sumber ke permukiman.

**Relasi:**

```
TANDON AIR
├── tipe geometri → Point
├── atribut → nama, kapasitas_m3, elevasi (m)
├── menerima air dari → Sumber Air
├── mendistribusikan ke → Permukiman via Jaringan Pipa
└── berkaitan dengan → Neraca Air (kapasitas penyimpanan)
```

---

### ENTITAS E07 – JARINGAN PIPA

**Tipe:** Layer Data / Infrastruktur

**Definisi:** Jaringan pipa distribusi air yang menghubungkan sumber air/tandon ke permukiman dan fasilitas.

**Relasi:**

```
JARINGAN PIPA
├── tipe geometri → MultiLineString (Polyline)
├── atribut → diameter_mm, kondisi, tahun_pasang
├── menghubungkan → Sumber Air ↔ Tandon ↔ Permukiman
├── diukur panjangnya → via fitur Pengukuran Jarak AQUAVISION
└── berkaitan dengan → Perencanaan Infrastruktur Air
```

---

### ENTITAS E08 – NERACA AIR

**Tipe:** Fitur Analisis / Perhitungan

**Definisi:** Perbandingan antara total ketersediaan air (supply) dengan total kebutuhan air (demand).

**Relasi:**

```
NERACA AIR
├── input supply dari → Sumber Air (debit total)
├── input demand dari → Permukiman + Hotel + Tempat Makan + Jasa
├── menghasilkan status:
│   ├── AMAN → penggunaan < 50% kapasitas
│   ├── WASPADA → penggunaan 50–80% kapasitas
│   └── KRITIS → penggunaan > 80% kapasitas
├── ditampilkan di → Panel Neraca Air (Dashboard)
└── dapat diproyeksikan via → Fitur Simulasi
```

---

### ENTITAS E09 – AQUAVISION (SISTEM)

**Tipe:** Sistem / Platform

**Definisi:** WebGIS sumber daya air untuk Desa Wisata Wonotoro, dikembangkan oleh Tim Mahasiswa ITB 2026.

**Relasi:**

```
AQUAVISION
├── dibuat oleh → Najwa Maharani, Rayhan Fadhil, M. Radja Adzka (ITB 2026)
├── jenis sistem → WebGIS (Web-based GIS)
├── tujuan → Pengelolaan SDA Desa Wisata Wonotoro
├── teknologi:
│   ├── Backend → Django 4.2 + GeoDjango
│   ├── Frontend → Leaflet.js 1.9
│   ├── Database → PostgreSQL 14 + PostGIS 3.3
│   └── Koordinat → EPSG:4326 (WGS84)
├── memiliki fitur → 12 fitur utama
├── memiliki layer → 11 layer data
├── ketercapaian → 85,7% (11/14 fitur + 2 tambahan)
└── kelayakan finansial → BCR 5,19 | NPV Rp 320,6 juta | ROI 485,79%
```

---

### ENTITAS E10 – HOTEL / FASILITAS WISATA

**Tipe:** Layer Data / Entitas Pariwisata

**Definisi:** Titik lokasi hotel, homestay, tempat makan, dan jasa wisata di wilayah studi.

**Relasi:**

```
FASILITAS WISATA
├── terdiri dari → Hotel, Tempat Makan, Jasa
├── atribut → jenis, jumlah kamar, kapasitas, kebutuhan_air_harian
├── menjadi input → Perhitungan Kebutuhan Air (Demand – sektor wisata)
├── berdampak pada → Neraca Air (jika wisatawan bertambah)
└── dapat disimulasikan → via Fitur Simulasi AQUAVISION
```

---

### ENTITAS E11 – AHP (METODE)

**Tipe:** Metode / Algoritma

**Relasi:**

```
AHP
├── digunakan untuk → Menghitung Potensi Air Tanah (GWP)
├── menggunakan → 7 parameter dengan bobot berbeda
├── menghasilkan → Peta GWP (Rendah/Sedang/Tinggi/Sangat Tinggi)
├── referensi → Tesfa & Sewnet (2025)
└── bagian dari → Analisis GIS-MCDM
```

---

### ENTITAS E12 – SCS-CN + METODE RASIONAL

**Tipe:** Metode / Algoritma

**Relasi:**

```
SCS-CN + METODE RASIONAL
├── digunakan untuk → Menghitung Debit Puncak Aliran
├── SCS-CN menghasilkan → Nilai limpasan (Q) dari curah hujan
├── Metode Rasional menghasilkan → Debit puncak (Qp) dalam m³/s
├── input → Curah hujan, CN, Luas DAS, Waktu konsentrasi
└── menghasilkan → 12 layer debit bulanan
```

---

## MATRIKS RELASI ANTAR ENTITAS

| | Wonotoro | GWP | Debit | DAS | Sumber Air | Tandon | Pipa | Neraca | Simulasi |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Wonotoro** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **GWP** | ✓ | — | ~ | ✓ | ✓ | ✗ | ✗ | ~ | ✓ |
| **Debit Puncak** | ✓ | ~ | — | ✓ | ~ | ✗ | ✗ | ~ | ✓ |
| **DAS** | ✓ | ✓ | ✓ | — | ~ | ✗ | ✗ | ✗ | ✗ |
| **Sumber Air** | ✓ | ✓ | ~ | ~ | — | ✓ | ✓ | ✓ | ✓ |
| **Tandon** | ✓ | ✗ | ✗ | ✗ | ✓ | — | ✓ | ✓ | ✓ |
| **Pipa** | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | — | ~ | ✗ |
| **Neraca Air** | ✓ | ~ | ~ | ✗ | ✓ | ✓ | ~ | — | ✓ |
| **Simulasi** | ✓ | ~ | ~ | ✗ | ✓ | ✓ | ✗ | ✓ | — |

*Keterangan: ✓ = terhubung langsung | ~ = terhubung tidak langsung | ✗ = tidak terhubung*

---

## RANTAI RELASI KRITIS (UNTUK JAWABAN MULTI-ENTITAS)

### Rantai 1: Pasokan Air
```
Sumber Air → Tandon Air → Jaringan Pipa → Permukiman/Fasilitas Wisata
```

### Rantai 2: Pemodelan Hidrologi
```
DEM + Curah Hujan → DAS → SCS-CN → Debit Puncak → Neraca Air
```

### Rantai 3: Potensi Air Tanah
```
7 Parameter (Hujan, Geologi, Lereng, dll.) → AHP → GWP → Zona Resapan → Lokasi Sumber Air Baru
```

### Rantai 4: Perencanaan Wisata
```
Hotel/Resto (kebutuhan) → Neraca Air → Simulasi → Rekomendasi Keberlanjutan
```

### Rantai 5: Dampak Bencana/Musim
```
Kemarau → Debit Turun → Supply Berkurang → Neraca Kritis → Rekomendasi Tindakan
```
