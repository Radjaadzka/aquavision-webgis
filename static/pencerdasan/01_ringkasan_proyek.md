# 01 – RINGKASAN PROYEK AQUAVISION

## Apa itu AQUAVISION?

AQUAVISION adalah sistem informasi sumber daya air berbasis WebGIS (Web-based Geographic Information System) yang dikembangkan untuk mendukung pengelolaan dan keberlanjutan Desa Wisata Wonotoro, Kabupaten Probolinggo, Jawa Timur. Sistem ini memungkinkan pengguna mengakses peta interaktif, data hidrologi, dan hasil analisis spasial langsung melalui browser tanpa perlu menginstal perangkat lunak khusus.

## Tujuan Sistem

1. Menyajikan informasi sumber daya air (sumber air, jaringan pipa, tandon air, potensi air tanah, debit puncak aliran) dalam satu platform terpadu dan mudah diakses.
2. Mendukung pengambilan keputusan berbasis data bagi pemerintah desa, pengelola wisata, dan masyarakat.
3. Membantu perencanaan pengelolaan air yang berkelanjutan di kawasan penyangga wisata Gunung Bromo.

## Wilayah Studi

- **Lokasi utama:** Desa Wonotoro, Kabupaten Probolinggo, Jawa Timur.
- **Konteks geografis:** Kawasan pegunungan di sekitar Taman Nasional Bromo Tengger Semeru; desa penyangga wisata internasional Gunung Bromo.
- **Luas DAS yang dianalisis:** 289,164 km² (mengikuti batas alami daerah tangkapan air, bukan batas administrasi desa).

## Permasalahan yang Diselesaikan

| Masalah | Dampak |
|---|---|
| Aksesibilitas sumber air yang sulit (topografi curam) | Biaya infrastruktur tinggi, distribusi tidak merata |
| Ketidaktersediaan jaringan pipa terstruktur | Inefisiensi distribusi, konflik sosial antarwarga |
| Penurunan debit air pada musim kemarau | Krisis air saat permintaan wisata puncak meningkat |
| Data sumber daya air tersebar dan tidak terintegrasi | Pasca kebakaran Bromo 2023, jalur pipa harus ditelusuri manual belasan km |

## Pengguna Sasaran

1. **Pemerintah Desa / BUMDes** – pengambilan keputusan dan perencanaan infrastruktur.
2. **Pengelola Wisata (hotel, homestay, restoran)** – perencanaan kebutuhan air operasional.
3. **Masyarakat Umum / Wisatawan** – informasi kondisi sumber air dan fasilitas desa.
4. **Administrator Sistem** – pengelolaan dan pembaruan data.

## Manfaat Utama

- Informasi lokasi sumber air, pipa, dan tandon dapat diakses kapan saja via browser.
- Peta potensi air tanah membantu identifikasi zona resapan dan sumber air baru.
- Analisis neraca air (supply vs demand) otomatis dengan status Aman / Waspada / Kritis.
- Simulasi skenario membantu perencanaan jika ada penambahan fasilitas wisata atau penduduk.
- Pengukuran jarak langsung di peta untuk estimasi panjang pipa tanpa survei lapangan.
- Download data multi-format (CSV, GeoJSON, KML, Shapefile) untuk analisis lanjutan.

## Ringkasan Fitur

| Kategori | Fitur |
|---|---|
| Visualisasi Spasial | Dashboard peta interaktif, 8 layer vektor + 1 layer raster |
| Analisis Air | Neraca air (supply-demand), simulasi skenario, status Aman/Waspada/Kritis |
| Pemodelan | Peta Potensi Air Tanah (GWP), Peta Debit Puncak Aliran Bulanan (12 bulan) |
| Alat Bantu | Pengukuran jarak (klik peta & koordinat manual), pencarian lokasi |
| Data | Data Portal, download multi-format, upload shapefile |
| Komunikasi | Feedback publik, Hubungi Admin (percakapan dua arah) |

## Ringkasan Metodologi

1. **Potensi Air Tanah (Groundwater Potential Zone / GWP):** Metode GIS-MCDM berbasis AHP dengan 7 parameter fisik (rainfall, geology/lithology, lineament density, elevation, slope, drainage density, land use/cover). Mengacu pada Tesfa & Sewnet (2025).
2. **Debit Puncak Aliran:** Metode SCS-CN (Soil Conservation Service – Curve Number) dan Metode Rasional. Data: DEM DEMNAS, curah hujan CHIRPS 1996–2025, tutupan lahan ESA WorldCover, jenis tanah FAO DSMW. Mengacu pada Nst/Nasution (2022).
3. **WebGIS:** Arsitektur Three-Tier Client-Server; Django + GeoDjango (backend), Leaflet.js (frontend), PostgreSQL + PostGIS (database).

## Ringkasan Hasil

| Komponen | Hasil |
|---|---|
| Groundwater Potential Zone | Low: 11%, Moderate: 29%, High: 43%, Very High: 17% dari wilayah studi |
| Debit Puncak Tertinggi | Rata-rata Februari 14,942 m³/s; nilai maks Desember 40,828 m³/s |
| Debit Puncak Terendah | Rata-rata September 0,138 m³/s (musim kemarau) |
| Ketercapaian Fitur WebGIS | 85,7% dari rancangan; 11 dari 14 fitur berhasil penuh atau diperluas |
| Kompatibilitas | Chrome, Firefox, Edge, Safari – desktop & smartphone |
| Analisis Finansial | BCR 5,19; NPV Rp 320.659.655; ROI 485,79% dalam 5 tahun |

## Informasi Pengembang

- **Tim:** Najwa Maharani (15122103), Rayhan Fadhil Muhamad (15122106), Muhammad Radja Adzka (15122115)
- **Program Studi:** Teknik Geodesi dan Geomatika, FITB, Institut Teknologi Bandung
- **Tahun:** 2026
- **Pembimbing:** Dr. Ratri Widyastuti, S.T., M.T. (Koordinator); Miga Magentika Julian, S.T., M.T.; Dr. Ir. Bambang Setyadji, M.Si
