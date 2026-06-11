# 03 – STUDI LITERATUR

## 1. Desa Wisata

**Definisi:**
Kementerian Pariwisata dan Ekonomi Kreatif mendefinisikan desa wisata sebagai wilayah yang memiliki keunikan daya tarik wisata khas dan komunitas masyarakat yang mampu menciptakan perpaduan daya tarik wisata dan fasilitas pendukung untuk menarik wisatawan.

**Prinsip Utama:**
- Berbasis masyarakat (Community-Based Tourism / CBT) menurut standar ASEAN (2015): dimiliki, dijalankan, dan dikelola oleh masyarakat.
- Berorientasi pada penguatan ekonomi lokal, pelestarian budaya, dan keberlanjutan lingkungan.
- Daya tarik utama: kondisi fisik lingkungan perdesaan + kehidupan sosial-budaya masyarakat.

**Relevansi terhadap AQUAVISION:**
- Pengembangan desa wisata membutuhkan tata kelola informasi spasial yang akurat.
- Data geospasial membantu wisatawan merencanakan kebutuhan selama berwisata dan pengelola dalam menginformasikan status kawasan.
- Sumber daya air merupakan faktor krusial dalam keberlanjutan aktivitas wisata.

**Referensi:** Pitana et al. (2009); Arida & Pujiani (2017); Zebua (2016); Bahaire & Elliott-White (1999); Srirejeki et al. (2020).

---

## 2. WebGIS

**Definisi:**
WebGIS (Web-based Geographic Information System) adalah sistem informasi terdistribusi yang menggabungkan kapabilitas analisis spasial GIS dengan aksesibilitas universal platform web, memungkinkan penyajian data secara interaktif, real-time, dan multi-pengguna melalui infrastruktur internet (Fu & Sun, 2011; Peng & Tsou, 2003).

**Keunggulan vs Alternatif Lain:**

| Aspek | Peta Cetak | Desktop GIS (QGIS) | WebGIS |
|---|---|---|---|
| Aksesibilitas | Terbatas fisik | Hanya di komputer terinstal | Via browser, multi-perangkat |
| Interaktivitas | Tidak ada | Tinggi (hanya operator) | Tinggi (semua pengguna) |
| Pembaruan Data | Cetak ulang berbayar | Manual, lokal | Online, terpusat |
| Analisis Spasial | Tidak ada | Canggih | Terbatas namun cukup |
| Target Pengguna | Semua (tanpa digital literacy) | Pengguna teknis SIG | Semua pengguna, termasuk awam |

**Referensi:** Peng & Tsou (2003); Fu & Sun (2011); Longley et al. (2015); Wibowo et al. (2017).

---

## 3. Sumber Daya Air

**Dasar Hukum:** Undang-Undang Nomor 17 Tahun 2019 tentang Sumber Daya Air.

### 3a. Air Tanah (Groundwater)

Air tanah tersimpan di ruang pori tanah, sedimen, dan rekahan batuan di bawah permukaan. Dipengaruhi oleh 7 faktor utama:
1. **Rainfall** – sumber suplai air masuk ke sistem air tanah.
2. **Geology/Lithology** – kemampuan batuan menyimpan dan meloloskan air.
3. **Lineament Density** – kerapatan rekahan/patahan sebagai jalur pergerakan air tanah.
4. **Elevation** – posisi topografis dan variasi morfologi.
5. **Slope** – keseimbangan infiltrasi vs limpasan permukaan.
6. **Drainage Density** – kerapatan jaringan aliran; tinggi = lebih sedikit infiltrasi.
7. **Land Use/Cover (LULC)** – pengaruh tutupan lahan terhadap proses resapan.

**Model yang digunakan:** Groundwater Potential Zone (GWP) dengan pendekatan GIS-MCDM berbasis AHP.

**Catatan penting:** Hasil GWP adalah **potensi relatif**, bukan bukti langsung keberadaan air tanah. Validasi lapangan (data sumur, survei geolistrik) tetap diperlukan.

**Referensi:** Schwartz & Zhang (2024); Tesfa & Sewnet (2025); Raza et al. (2022); Rehman et al. (2024); Lalngaihawma et al. (2024).

### 3b. Air Permukaan (Surface Water)

Air permukaan merupakan air yang dapat diamati melalui sungai, saluran, dan badan air. Limpasan permukaan terbentuk ketika air bergerak di atas permukaan tanah menuju saluran air; besarnya dipengaruhi oleh karakteristik tanah, vegetasi, kondisi permukaan, dan jaringan drainase.

**Indikator yang digunakan:** Debit puncak aliran (Qp) sebagai representasi potensi maksimum aliran permukaan terhadap curah hujan.

**Metode pemodelan:** SCS-CN (Soil Conservation Service – Curve Number) + Metode Rasional.

**Referensi:** USGS; Nst/Nasution (2022); Triatmodjo (2008); Ouyang & Bartholic (1997); Kartasapoetra (1991).

---

## 4. Ringkasan Referensi Utama

| Referensi | Kontribusi |
|---|---|
| Tesfa & Sewnet (2025) | Metode AHP-GIS MCDM untuk GWP; bobot parameter, klasifikasi, dan validasi |
| Nst/Nasution (2022) | Kerangka kerja pemodelan debit puncak berbasis SCS-CN dan Metode Rasional |
| Ouyang & Bartholic (1997) | Tabel nilai Curve Number (CN) berdasarkan tutupan lahan dan jenis tanah |
| Kartasapoetra (1991) | Tabel erodibilitas dan klasifikasi jenis tanah untuk CN |
| Peng & Tsou (2003) | Definisi dan konsep WebGIS |
| Fu & Sun (2011) | Prinsip dan aplikasi Web GIS |
| ISO/IEC 25010:2011 | Standar kualitas perangkat lunak (functional suitability, performance efficiency, compatibility, usability) |
| RFC 7946 | Standar format data GeoJSON |
| OGC Standards | Standar interoperabilitas data geospasial |
| OWASP | Standar keamanan aplikasi web |
