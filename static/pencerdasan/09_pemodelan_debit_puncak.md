# 09 – PEMODELAN DEBIT PUNCAK ALIRAN

## Pengertian

Debit puncak aliran (Qp) adalah estimasi besarnya debit maksimum yang berpotensi terjadi pada suatu daerah tangkapan air (DAS) berdasarkan respons maksimum aliran sungai terhadap curah hujan. Dalam AQUAVISION, debit puncak dimodelkan secara spasial dan temporal (per bulan) untuk seluruh DAS yang berkontribusi terhadap Desa Wonotoro.

**Penting:** Hasil pemodelan merupakan estimasi berbasis data klimatologis rata-rata jangka panjang, bukan debit aktual terukur. Interpretasi ditujukan untuk pola spasial dan perbandingan temporal, bukan perencanaan teknis bangunan air berbasis debit banjir rencana.

---

## Metode

1. **SCS-CN (Soil Conservation Service – Curve Number)** – untuk menghitung limpasan permukaan dari curah hujan berdasarkan tutupan lahan dan jenis tanah.
2. **Metode Rasional** – untuk menghitung debit puncak dari koefisien limpasan, intensitas hujan, dan luas DAS.

**Referensi utama:** Nst/Nasution (2022).

---

## Wilayah Analisis (DAS)

- **Batas analisis:** Batas DAS hasil delineasi (bukan batas administrasi desa).
- **Luas DAS:** 289,164 km²
- **Lokasi:** DAS yang berkontribusi secara hidrologis ke wilayah Desa Wonotoro, Kabupaten Probolinggo, Jawa Timur.
- **Alasan penggunaan batas DAS:** Proses hidrologi (limpasan, akumulasi aliran, debit) mengikuti batas alami topografi, bukan batas administrasi.

---

## Sumber Data

| Data | Sumber | Resolusi | Periode |
|---|---|---|---|
| Digital Elevation Model (DEM) | DEMNAS (BIG) | ~8,1 m | – |
| Curah Hujan Bulanan Klimatologis | CHIRPS v2.0 | 0,05° (~5,5 km) | 1996–2025 (30 tahun) |
| Tutupan Lahan | ESA WorldCover 2021 | 10 m | 2021 |
| Jenis Tanah | FAO DSMW (Digital Soil Map of the World) | Skala 1:5.000.000 | – |

**Resolusi analisis:** 10 m (mengikuti resolusi tertinggi ESA WorldCover 2021).

---

## Tahapan Pemodelan

### 1. Pre-Processing Data
- Reproyeksi semua data ke sistem koordinat proyek.
- Pemotongan (clip) sesuai area analisis.
- Penyamaan extent dan resolusi spasial ke 10 m.

### 2. Pemodelan Hidrologi Berbasis DEM (Delineasi DAS)

Dari DEM DEMNAS dilakukan:
1. **Fill Sink** – menghilangkan depresi semu pada DEM.
2. **Flow Direction (D8)** – menentukan arah aliran setiap piksel ke 8 tetangga.
3. **Flow Accumulation** – menghitung jumlah piksel yang mengalir ke suatu titik.
4. **Ekstraksi Jaringan Aliran** – dari nilai flow accumulation dengan ambang batas tertentu.
5. **Delineasi DAS** – menentukan batas daerah tangkapan air.
6. **Penentuan Orde Sungai** – menggunakan metode Strahler.

### 3. Reklasifikasi Tutupan Lahan (ESA WorldCover → CN)

| Kelas ESA WorldCover | Klasifikasi CN |
|---|---|
| Tree Cover | Hutan |
| Shrubland | Semak, Belukar, Taman |
| Grassland | Semak, Belukar, Taman |
| Cropland | Kebun, Lahan Kering |
| Built-up | Pemukiman |
| Bare/Sparse Vegetation | Kebun, Lahan Kering |
| Permanent Water Bodies | Sungai, Kolam, Danau |
| Herbaceous Wetland | Vegetasi Air/Lahan Basah |
| Mangroves | Vegetasi Air/Lahan Basah |
| Moss and Lichen | Semak, Belukar, Taman |

### 4. Reklasifikasi Jenis Tanah (FAO DSMW → CN)

| Kelas Tanah FAO | Kelas Penyelarasan |
|---|---|
| Vertic Luvisols | Mediteran |
| Eutric Fluvisols | Aluvial |
| Ochric Andosols | Andosol |
| Mollic Andosols | Andosol |

**Nilai Erodibilitas Tanah (Kartasapoetra, 1991):**
| Jenis Tanah | K | Kode |
|---|---|---|
| Aluvial, Planosol, Hidromorf Kelabu, Laterik, Gley | 0,20 | 3 |
| Latosol | 0,23 | 1 |
| Mediteran | 0,24 | 2 |
| Andosol, Grumosol, Podsol, Podsolik | 0,26 | 0 |
| Regosol, Litosol, Organosol, Renzina | 0,31 | 2 |

### 5. Perhitungan Curve Number (CN)

Overlay tutupan lahan hasil reklasifikasi × jenis tanah hasil reklasifikasi → nilai CN berdasarkan tabel Ouyang & Bartholic (1997):

| Tutupan Lahan | Jenis Tanah 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Pemukiman | 49 | 69 | 79 | 84 |
| Semak, Belukar, Taman | 48 | 67 | 77 | 83 |
| Hutan | 30 | 55 | 70 | 77 |
| Kebun, Lahan Kering | 72 | 81 | 88 | 81 |
| Vegetasi Air / Lahan Basah | 66 | 74 | 80 | 82 |
| Sungai, Kolam, Danau | 98 | 98 | 98 | 98 |

### 6. Estimasi Debit Puncak (SCS-CN + Metode Rasional)

**Potensi Retensi Maksimum (S):**
```
S = 25400/CN − 254
```
(S dalam mm; CN = nilai Curve Number)

**Initial Abstraction (Ia):**
```
Ia = 0,2 × S
```
(Kehilangan awal sebelum limpasan terbentuk)

**Limpasan Permukaan (Q):**
```
Q = (P − Ia)² / (P + S − Ia)   [hanya jika P > Ia; jika P ≤ Ia, maka Q = 0]
```
(P = curah hujan dalam mm)

**Koefisien Limpasan (C):**
```
C = Q / P
```

**Intensitas Hujan (I):**
```
I = P_bulan / (n × 24)
```
(P_bulan = curah hujan bulanan; n = jumlah hari dalam bulan; I dalam mm/jam)

**Debit Puncak (Qp) – Metode Rasional:**
```
Qp = 0,278 × C × I × A
```
(Qp dalam m³/s; C = koefisien limpasan; I = intensitas hujan mm/jam; A = luas DAS km²)

Konstanta 0,278 berlaku apabila I dalam mm/jam dan A dalam km².

### 7. Verifikasi Model

Karena tidak tersedia data debit observasi lapangan di wilayah studi, verifikasi dilakukan menggunakan metode **Normalized Flow Variability (NFV)**:

```
NFV = (Qmax − Qmin) / (Qmax + Qmin)
```

Perbandingan dengan Nasution (2022):
- NFV Wonotoro: 0,999
- NFV Nasution (2022): 0,976
- Selisih relatif: **2,36%** (jauh di bawah ambang toleransi 25%)

Kesimpulan: Model dapat diterima secara komparatif.

---

## Hasil Akhir Debit Puncak Aliran

### Statistik Deskriptif per Bulan

| Bulan | Min (m³/s) | Maks (m³/s) | Rata-rata (m³/s) | Std Dev (m³/s) |
|---|---|---|---|---|
| Januari | 2,913 | 39,208 | **14,477** | 9,288 |
| Februari | 2,828 | 40,485 | **14,942** | 9,941 |
| Maret | 2,313 | 35,227 | **13,552** | 8,590 |
| April | 0,242 | 22,143 | 6,026 | 5,303 |
| Mei | 0 | 15,953 | 3,583 | 3,692 |
| Juni | 0 | 8,897 | 1,254 | 1,750 |
| Juli | 0 | 10,059 | 0,668 | 1,186 |
| Agustus | 0 | 3,804 | **0,143** | 0,402 |
| September | 0 | 3,785 | **0,138** | 0,363 |
| Oktober | 0 | 19,042 | 2,726 | 3,483 |
| November | 0 | 27,399 | 6,774 | 6,403 |
| Desember | 1,282 | 40,828 | **13,595** | 9,221 |

**Debit tertinggi:** Februari (rata-rata 14,942 m³/s; maks 40,485 m³/s)
**Debit terendah:** September (rata-rata 0,138 m³/s; maks 3,785 m³/s)
**Debit absolut tertinggi:** Desember (maks 40,828 m³/s)

### Pola Musiman

- **Musim Hujan (Nov–Mar):** Debit puncak tinggi. Jan, Feb, Des, Mar memiliki rata-rata terbesar.
- **Musim Kemarau (Jun–Sep):** Debit puncak sangat rendah. Agustus–September = nilai minimum.
- **Transisi ke kering (Apr–Mei):** Debit menurun dari 6,026 ke 3,583 m³/s.
- **Transisi ke basah (Okt–Nov):** Debit naik dari 2,726 ke 6,774 m³/s.

### Pola Spasial

- Nilai debit puncak tertinggi terkonsentrasi pada **jaringan aliran utama** (area dengan akumulasi aliran besar).
- Cabang aliran kecil dan area hulu memiliki nilai debit lebih rendah.
- Pola ini sesuai dengan morfologi DAS yang memiliki banyak percabangan aliran.
