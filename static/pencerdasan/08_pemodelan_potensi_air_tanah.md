# 08 – PEMODELAN POTENSI AIR TANAH (GROUNDWATER POTENTIAL ZONE)

## Pengertian

Groundwater Potential Zone (GWP) adalah model spasial yang menunjukkan tingkat potensi relatif suatu wilayah dalam mendukung keberadaan, pergerakan, dan pengisian air tanah. Hasilnya berupa peta klasifikasi zona potensi dari Low hingga Very High.

**Penting:** GWP adalah **potensi relatif**, bukan bukti langsung keberadaan air tanah. Validasi menggunakan data sumur, titik mata air, atau survei geolistrik tetap diperlukan.

---

## Metode

**GIS-MCDM (Geographic Information System – Multi Criteria Decision Making)** berbasis **AHP (Analytical Hierarchy Process)**.

Referensi utama: Tesfa & Sewnet (2025).

---

## Wilayah Analisis (Area of Interest)

- **Dasar penetapan:** Tidak dibatasi oleh batas administrasi Desa Wonotoro, karena proses air tanah mengikuti kondisi fisik wilayah, bukan batas administratif.
- **Cakupan:** Desa Wonotoro + area sekitar yang relevan secara hidrogeologi.

---

## 7 Parameter (Conditioning Factors)

| Parameter | Fungsi dalam Pemodelan | Arah Skor |
|---|---|---|
| **Rainfall** | Suplai air yang berpotensi masuk ke sistem air tanah | Semakin tinggi curah hujan → skor lebih tinggi |
| **Geology/Lithology** | Kemampuan batuan menyimpan dan meloloskan air | Bergantung jenis litologi |
| **Lineament Density** | Kerapatan rekahan/patahan sebagai jalur pergerakan air tanah | Semakin rapat → skor lebih tinggi |
| **Elevation** | Posisi topografis dan kondisi morfologi | Semakin tinggi elevasi → skor lebih tinggi (mengacu Tesfa & Sewnet) |
| **Slope** | Keseimbangan infiltrasi vs limpasan permukaan | Semakin curam → skor lebih rendah (lereng curam = lebih banyak limpasan) |
| **Drainage Density** | Kerapatan jaringan aliran permukaan | Semakin rapat → skor lebih rendah (air cepat mengalir, sedikit infiltrasi) |
| **Land Use/Cover (LULC)** | Pengaruh tutupan lahan terhadap infiltrasi | Vegetasi/lahan permeabel → skor lebih tinggi |

---

## Bobot AHP (Tesfa & Sewnet, 2025)

| Parameter | Bobot (W) |
|---|---|
| Rainfall | 0,40 |
| Geology/Lithology | 0,23 |
| Lineament Density | 0,13 |
| Elevation | 0,09 |
| Slope | 0,07 |
| Drainage Density | 0,05 |
| Land Use/Cover | 0,03 |
| **Total** | **1,00** |

**Uji Konsistensi AHP:** λmax = 7,39; CI = 0,065; CR = 0,049 (di bawah batas toleransi 0,10 → konsisten dan dapat diterima).

---

## Sumber Data

| Data | Sumber | Format | Resolusi |
|---|---|---|---|
| Rainfall | CHIRPS v.03 | Raster | 5 × 5 km |
| Geology/Lithology | ESDM GeoMap | Vektor polygon | Skala 1:100.000 |
| Land Use/Cover | ESA WorldCover | Raster | 10 × 10 m |
| DEM (Elevation, Slope, Drainage Density, Lineament Density) | SRTM | Raster | 30 × 30 m |

**Periode data Rainfall:** Rata-rata tahunan 2016–2025 (10 tahun).

---

## Tahapan Pemodelan

### 1. Pre-Processing
- Penyamaan sistem koordinat ke **UTM Zona 49S**.
- Pemotongan (clip) ke wilayah studi.
- Rasterisasi data vektor geologi ke resolusi 30 × 30 m.
- Resampling data rainfall ke resolusi 30 × 30 m (Nearest Neighbor).
- Penyelarasan kelas lithologi dan LULC ke kelas acuan Tesfa & Sewnet (2025).
- **Resolusi analisis standar:** 30 × 30 m (mengikuti DEM SRTM sebagai data dasar utama).

### 2. Reklasifikasi
Setiap parameter diubah ke skala skor seragam (1–5) berdasarkan pengaruhnya terhadap potensi air tanah.

**Rentang nilai dan skor di wilayah studi:**

**Rainfall (2025–3511 mm/tahun):**
| Rentang (mm) | Skor |
|---|---|
| 2025–2323 | 1 |
| 2323–2620 | 2 |
| 2620–2917 | 3 |
| 2917–3214 | 4 |
| 3214–3511 | 5 |

**Lithology:**
| Kelas | Skor |
|---|---|
| Scoriaceous basalt | 2 |
| Quaternary Sediments | 3 |
| Robu Gebya Basalt | 4 |
| Arero Gido Basalt | 5 |

*Catatan: Kelas Sedimentary Rocks dan Arat Mekerakir Basalt tidak ditemukan padanannya di wilayah studi.*

**Lineament Density (0–2,144):**
| Rentang | Skor |
|---|---|
| 0,00–0,21 | 1 |
| 0,21–0,64 | 2 |
| 0,64–1,07 | 3 |
| 1,07–1,50 | 4 |
| 1,50–2,15 | 5 |

**Elevation (246–2775 m):**
| Rentang (m) | Skor |
|---|---|
| 246–781 | 1 |
| 781–1123 | 2 |
| 1123–1427 | 3 |
| 1427–1851 | 4 |
| 1851–2775 | 5 |

**Slope (0–71,41°) – skor terbalik:**
| Rentang (°) | Skor |
|---|---|
| 33,60–71,41 | 1 |
| 23,10–33,60 | 2 |
| 13,65–23,10 | 3 |
| 7,35–13,65 | 4 |
| 0–7,36 | 5 |

**Drainage Density (0–1,88) – skor terbalik:**
| Rentang | Skor |
|---|---|
| 1,13–1,88 | 1 |
| 0,79–1,13 | 2 |
| 0,49–0,79 | 3 |
| 0,25–0,49 | 4 |
| 0–0,25 | 5 |

**Land Use/Cover:**
| Kelas | Skor |
|---|---|
| Water | 1 |
| Agriculture | 2 |
| Agro-Silvicultural | 4 |
| Pastoral | 6 |
| Urban | 8 |
| Unused | 9 |

### 3. Weighted Overlay

Formula:
```
GWP = (0,40 × R_rainfall) + (0,23 × R_geology/lithology) + (0,13 × R_lineament)
      + (0,09 × R_elevation) + (0,07 × R_slope) + (0,05 × R_drainage)
      + (0,03 × R_LULC)
```

### 4. Klasifikasi Indeks GWP

Metode Equal Interval Classification (nilai indeks minimum 1,61 – maksimum 4,90; interval 0,8225):

| Kelas | Rentang Nilai Indeks |
|---|---|
| Low | 1,61–2,43 |
| Moderate | 2,43–3,26 |
| High | 3,26–4,08 |
| Very High | 4,08–4,90 |

### 5. Verifikasi
- Idealnya menggunakan data borehole/well log (tidak tersedia untuk wilayah studi).
- Verifikasi dilakukan melalui perbandingan komparatif terhadap Tesfa & Sewnet (2025) sebagai penelitian referensi yang telah tervalidasi.

---

## Hasil Akhir GWP Wilayah Studi

| Kelas | Rentang Nilai | Luas (km²) | Persentase (%) |
|---|---|---|---|
| Low | 1,61–2,43 | 20 | 11% |
| Moderate | 2,43–3,26 | 50 | 29% |
| High | 3,26–4,08 | 76 | 43% |
| Very High | 4,08–4,90 | 29 | 17% |

**Interpretasi:** Area Desa Wonotoro didominasi kelas High dan Very High, menunjukkan kondisi fisik yang mendukung infiltrasi dan penyimpanan air tanah. Kelas High dan Very High dapat dijadikan **zona prioritas** untuk konservasi sumber daya air dan investigasi lanjutan (survei geolistrik, verifikasi sumur).

---

## Penyelarasan Kelas Lithologi Lokal

| Kelas Geologi Lokal | Kelas Acuan (Tesfa & Sewnet) | Alasan |
|---|---|---|
| Tengger Volcanic Sands | Quaternary Sediments | Material lepas vulkanik, banyak pori, mudah diresapi air |
| Cemara Tiga Debris | Quaternary Sediments | Sama – material rombakan batuan |
| Bromo Volcanic | Scoriaceous Basalt | Material vulkanik muda, potensi rongga/rekahan |
| Lower Quaternary Volcanics | Basalt | Batuan vulkanik lebih padat; aliran melalui rekahan |
| Tengger Volcanic Rocks | Basalt | Sama – batuan vulkanik keras |

---

## Penyelarasan Kelas LULC (ESA WorldCover → Tesfa & Sewnet)

| Kelas ESA WorldCover | Kelas Acuan | Alasan |
|---|---|---|
| Tree Cover | Agro-silvicultural | Tutupan pohon, mendukung infiltrasi |
| Shrubland, Grassland, Moss & Lichen | Pastoral | Vegetasi rendah/rumput |
| Cropland | Agriculture | Langsung setara |
| Built-up | Urban | Area terbangun, limpasan tinggi |
| Bare/Sparse Vegetation | Unused | Lahan terbuka, vegetasi jarang |
| Permanent Water Bodies | Water | Badan air permanen |
