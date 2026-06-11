# 21 – METODOLOGI RINGKAS

*Penjelasan metodologi dalam bahasa awam yang dapat dipahami oleh masyarakat umum.*

---

## 1. AHP (Analytical Hierarchy Process)

### Apa itu?
AHP adalah cara ilmiah untuk menentukan seberapa penting masing-masing faktor dalam membuat suatu keputusan. Bayangkan kita ingin memilih lokasi terbaik untuk mencari air tanah: ada banyak faktor yang berpengaruh (curah hujan, jenis batuan, kemiringan lereng, dll.). AHP membantu kita menentukan mana yang paling penting.

### Mengapa Digunakan?
Dalam pembuatan peta potensi air tanah, ada 7 faktor yang semuanya berpengaruh tapi dengan kepentingan berbeda. AHP memungkinkan penggabungan semua faktor itu menjadi satu peta yang bermakna.

### Input
7 parameter fisik: curah hujan, litologi/geologi, kerapatan rekahan (lineament density), ketinggian, kemiringan lereng, kerapatan drainase, tutupan lahan.

### Proses
1. Setiap pasang faktor dibandingkan: mana yang lebih penting dan seberapa banyak?
2. Dari perbandingan ini, dihitung "bobot" setiap faktor.
3. Uji konsistensi: apakah perbandingan kita logis dan tidak bertentangan? (CR < 0,10 = konsisten).
4. Hasilnya: Rainfall dapat bobot 40%, Geologi 23%, dst.

### Output
Bobot setiap parameter (W) yang digunakan untuk weighted overlay.

### Kelebihan
- Transparan dan terdokumentasi dengan baik.
- Memungkinkan beberapa faktor digabungkan secara ilmiah.
- Sudah divalidasi dalam banyak penelitian air tanah global.

### Keterbatasan
- Bobot berdasarkan penelitian referensi (Tesfa & Sewnet, 2025), bukan dari ahli lokal.
- Keputusan subjektif peneliti; hasil berbeda jika peneliti berbeda yang membuat perbandingan.

---

## 2. Metode Rasional

### Apa itu?
Metode untuk menghitung debit puncak aliran (volume air terbesar yang mengalir melalui sungai per detik) berdasarkan tiga faktor: berapa banyak hujan yang turun, seberapa besar area yang terkena hujan, dan seberapa banyak air yang langsung mengalir (bukan diserap tanah).

### Mengapa Digunakan?
Sederhana, banyak digunakan, dan cocok untuk analisis spasial skala regional ketika data debit lapangan tidak tersedia.

### Rumus
```
Qp = 0,278 × C × I × A
```
- Qp = debit puncak (m³/s)
- C = koefisien limpasan (0–1; semakin besar = semakin banyak air yang mengalir)
- I = intensitas hujan (mm/jam)
- A = luas daerah tangkapan air/DAS (km²)

### Input
- Koefisien limpasan (C) dari SCS-CN
- Intensitas hujan (I) dari data curah hujan CHIRPS
- Luas DAS (A) dari hasil delineasi DEM

### Output
Debit puncak aliran (Qp) dalam m³/s untuk setiap piksel jaringan sungai, per bulan.

### Kelebihan
- Sederhana dan efisien untuk pemodelan spasial.
- Menghasilkan distribusi spasial debit secara serentak untuk seluruh DAS.

### Keterbatasan
- Tidak memperhitungkan proses hidrologi kompleks (waktu konsentrasi, routing aliran, dll.).
- Menggunakan curah hujan rata-rata bulanan, bukan intensitas hujan kejadian ekstrem.
- Cocok untuk analisis pola, bukan perencanaan teknis bangunan air.

---

## 3. SCS-CN (Soil Conservation Service – Curve Number)

### Apa itu?
SCS-CN adalah metode untuk menghitung berapa banyak air hujan yang menjadi aliran permukaan (limpasan) dan berapa yang diserap tanah. Angka CN (Curve Number) menunjukkan karakter wilayah: CN tinggi = banyak limpasan, CN rendah = banyak air diserap tanah.

### Mengapa Digunakan?
Metode ini menghubungkan dua faktor utama: jenis tutupan lahan (hutan/sawah/gedung) dan jenis tanah (kemampuan menyerap air). Hasilnya adalah angka CN yang merepresentasikan respons hidrologis wilayah.

### Input
- Tutupan lahan (dari ESA WorldCover 2021)
- Jenis tanah (dari FAO DSMW)
- Curah hujan (dari CHIRPS 1996–2025)

### Proses Bertahap
1. **Tentukan CN** dari kombinasi tutupan lahan + jenis tanah (tabel referensi).
2. **Hitung potensi retensi maksimum (S):** S = 25400/CN − 254
3. **Hitung initial abstraction (Ia):** Ia = 0,2 × S (air yang "hilang" sebelum limpasan terbentuk)
4. **Hitung limpasan (Q):** Q = (P − Ia)² / (P + S − Ia) [jika P > Ia]
5. **Hitung koefisien limpasan (C):** C = Q / P

### Output
Koefisien limpasan (C) per piksel → digunakan sebagai input Metode Rasional.

### Kelebihan
- Sudah digunakan dan divalidasi secara luas di seluruh dunia.
- Berbasis data yang tersedia secara global (tutupan lahan + tanah + curah hujan).

### Keterbatasan
- Nilai CN dari tabel referensi, bukan dari kalibrasi lokal.
- Tidak memperhitungkan kondisi kelembapan tanah awal yang berubah.

---

## 4. Analisis GIS (Geographic Information System)

### Apa itu?
Analisis GIS adalah cara mengolah data yang memiliki informasi lokasi (koordinat) menggunakan komputer. Dalam AQUAVISION, GIS digunakan untuk mengintegrasikan berbagai data spasial (curah hujan, geologi, tutupan lahan, elevasi) dan menghasilkan peta.

### Teknik GIS yang Digunakan

| Teknik | Fungsi |
|---|---|
| Reprojeksi | Menyamakan sistem koordinat semua data ke UTM Zona 49S |
| Clip | Memotong data sesuai batas wilayah studi |
| Resampling | Menyamakan resolusi piksel semua raster ke 30 m atau 10 m |
| Rasterisasi | Mengubah data vektor (geologi) menjadi raster untuk weighted overlay |
| Weighted Overlay | Menggabungkan beberapa layer dengan bobot berbeda menjadi satu peta hasil |
| Fill Sink | Menghilangkan cekungan palsu pada DEM sebelum analisis hidrologi |
| Flow Direction | Menentukan arah aliran air dari setiap piksel DEM |
| Flow Accumulation | Menghitung jumlah piksel yang berkontribusi ke setiap titik aliran |
| Stream Extraction | Mengidentifikasi jaringan sungai dari nilai flow accumulation |
| Watershed Delineation | Menentukan batas DAS berdasarkan topografi |

---

## 5. Analisis Ketersediaan Air (Neraca Air)

### Apa itu?
Perhitungan untuk membandingkan berapa banyak air yang tersedia (dari sumber air) dengan berapa banyak yang dibutuhkan (oleh penduduk, hotel, dan restoran).

### Mengapa Digunakan?
Untuk mengetahui apakah pasokan air di Desa Wonotoro cukup untuk semua penggunanya, dan mengidentifikasi potensi kekurangan air.

### Input
- **Ketersediaan (Supply):** Total debit semua sumber air yang terdaftar (L/dtk)
- **Kebutuhan (Demand):**
  - Domestik: Jumlah penduduk × 120 L/orang/hari
  - Hotel/Homestay: Jumlah kamar × 250 L/kamar/hari
  - Restoran: Jumlah kursi × 25 L/kursi/hari

### Output
- Total ketersediaan vs total kebutuhan (L/hari)
- Persentase pemanfaatan = (demand/supply) × 100%
- Status: Aman (<50%), Waspada (50–80%), Kritis (>80%)

### Kelebihan
- Mudah dipahami oleh non-teknis.
- Real-time berdasarkan data yang tersimpan di sistem.
- Bisa disimulasikan untuk skenario berbeda.

### Keterbatasan
- Akurasi bergantung pada kelengkapan data sumber air dan fasilitas yang diinputkan.
- Parameter standar nasional digunakan (bukan survei kebutuhan air lokal).

---

## 6. Simulasi Sistem (Simulasi Skenario)

### Apa itu?
Fitur yang memungkinkan pengguna mengubah parameter kebutuhan air (jumlah penduduk, kamar hotel, kapasitas restoran, luas pertanian) dan melihat hasilnya terhadap neraca air secara instan.

### Mengapa Digunakan?
Untuk mendukung perencanaan berbasis data: sebelum membangun fasilitas baru, kita bisa cek dulu apakah air akan cukup.

### Input
Parameter yang dapat diubah pengguna: jumlah penduduk, jumlah kamar hotel/homestay, kapasitas restoran (kursi), luas lahan pertanian.

### Proses
Sistem menghitung ulang total kebutuhan air menggunakan parameter baru → membandingkan dengan ketersediaan → menampilkan status baru.

### Output
Status neraca air hasil simulasi + persentase pemanfaatan baru.

### Kelebihan
- Memberikan gambaran kondisi masa depan tanpa perlu survei.
- Mudah digunakan oleh pengguna non-teknis.
- Mendukung pengambilan keputusan perencanaan pembangunan desa wisata.

### Keterbatasan
- Tidak memperhitungkan variasi musiman ketersediaan air.
- Bergantung pada data inventarisasi yang terisi lengkap dan akurat.
