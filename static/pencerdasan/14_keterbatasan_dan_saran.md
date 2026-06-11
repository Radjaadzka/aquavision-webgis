# 14 – KETERBATASAN DAN SARAN

## Keterbatasan Sistem Saat Ini

### 1. Keterbatasan Teknis WebGIS

| Keterbatasan | Penjelasan |
|---|---|
| Validasi spasial input | Sistem belum memverifikasi otomatis apakah koordinat yang diinput berada dalam wilayah relevan (batas Desa Wonotoro atau DAS). |
| Pengelolaan data raster | Data raster GeoTIFF (debit puncak) masih dikelola sebagai file eksternal, bukan di PostgreSQL/PostGIS. Pembaruan masih manual di server. |
| Fleksibilitas edit atribut | Tidak semua atribut dapat diubah via antarmuka web; beberapa memerlukan akses panel admin Django secara langsung. |
| Interoperabilitas OGC | GeoServer (WMS/WFS) tidak diimplementasikan; digantikan GeoJSON custom. Data belum sepenuhnya mendukung standar layanan spasial OGC. |
| Sistem notifikasi | Belum ada notifikasi/peringatan otomatis saat status neraca air berubah menjadi Waspada atau Kritis. |
| Skalabilitas | Pemuatan seluruh data bersamaan berpotensi memengaruhi performa jika jumlah objek spasial meningkat signifikan. |
| Panduan pengguna inline | Belum ada tutorial interaktif atau panduan kontekstual di setiap fitur; pengguna baru perlu mempelajari sendiri. |

### 2. Keterbatasan Data dan Model

| Keterbatasan | Penjelasan |
|---|---|
| GWP tanpa validasi lapangan | Verifikasi Groundwater Potential Zone tidak dilakukan dengan data borehole/well log karena tidak tersedia; hanya perbandingan komparatif dengan penelitian referensi. |
| Debit bukan kejadian ekstrem | Debit puncak dihitung dari curah hujan klimatologis rata-rata bulanan, bukan intensitas hujan rancangan periode ulang. Tidak cocok untuk perencanaan teknis bangunan air berbasis banjir rencana. |
| Data debit tanpa validasi lapangan | Tidak ada data observasi debit lapangan di DAS Wonotoro; verifikasi hanya melalui NFV komparatif. |
| Skala data tanah (FAO DSMW) | Bersifat global (1:5.000.000), bukan data tanah lokal rinci; CN yang dihasilkan memiliki ketidakpastian. |
| Data terbatas saat implementasi | Jumlah data inventarisasi lapangan masih terbatas saat pengembangan awal; akurasi analisis neraca air bergantung pada kelengkapan data. |
| Kelengkapan data sumber air | Jika sumber air yang belum terdaftar tidak dimasukkan, ketersediaan air yang ditampilkan menjadi tidak akurat. |

### 3. Keterbatasan Metodologi GWP

| Keterbatasan | Penjelasan |
|---|---|
| Bobot AHP dari literatur | Bobot diambil dari Tesfa & Sewnet (2025) yang dilakukan di wilayah berbeda (dataran tinggi Ethiopia), bukan dari survei ahli lokal. |
| Batas kelas diadaptasi | Rentang nilai klasifikasi disesuaikan ke data lokal dengan pendekatan faktor skala; hasil tetap merupakan potensi relatif. |
| Resolusi data rainfall kasar | CHIRPS memiliki resolusi 5 km; resampling ke 30 m hanya standardisasi grid, bukan peningkatan ketelitian. |

---

## Saran Pengembangan

### Jangka Pendek

1. **Tambahkan validasi spasial otomatis** saat input data (koordinat harus berada dalam wilayah studi).
2. **Lengkapi data lapangan** (inventarisasi sumber air, pipa, tandon) untuk meningkatkan akurasi neraca air.
3. **Kembangkan panduan pengguna inline** (guided tour, tooltip kontekstual, FAQ dalam sistem).
4. **Integrasikan data raster ke PostgreSQL/PostGIS** menggunakan PostGIS Raster agar pengelolaan raster setara dengan data vektor.

### Jangka Menengah

5. **Implementasikan layanan OGC (WMS/WFS)** via GeoServer atau MapServer untuk meningkatkan interoperabilitas.
6. **Kembangkan early warning system** yang mengirim notifikasi otomatis saat status neraca air mendekati Waspada atau Kritis.
7. **Optimasi performa** dengan lazy loading, server-side filtering, dan pagination layanan spasial untuk mendukung skala data yang lebih besar.
8. **Perbarui antarmuka admin** agar semua atribut dapat diubah langsung via WebGIS tanpa perlu panel admin Django.

### Jangka Panjang

9. **Validasi GWP dengan data lapangan** (borehole/well log, survei geolistrik, verifikasi titik mata air) untuk meningkatkan kepercayaan model.
10. **Kembangkan model prediktif** menggunakan data historis dan data lingkungan untuk mendukung perencanaan proaktif.
11. **Integrasi real-time** dengan sensor debit atau stasiun curah hujan jika infrastruktur tersedia.
12. **Replikasi model** ke desa wisata lain dengan karakteristik serupa di kawasan Bromo Tengger Semeru.
13. **Penguatan kapasitas pengelola** melalui pelatihan dan dokumentasi teknis agar sistem dapat dikelola secara mandiri oleh pemerintah desa.

---

## Hal yang Perlu Dipahami Pengguna

1. **Peta Potensi Air Tanah bukan jaminan ada air tanah** di suatu titik – ini adalah potensi relatif berdasarkan faktor fisik, bukan hasil survei lapangan.
2. **Nilai debit puncak adalah estimasi klimatologis** (kondisi rata-rata jangka panjang), bukan pengukuran aktual debit saat ini.
3. **Akurasi neraca air** bergantung pada kelengkapan data sumber air, fasilitas wisata, dan permukiman yang terdaftar di sistem.
4. **Informasi perlu diperbarui secara berkala** oleh administrator sesuai kondisi lapangan.
5. **Koneksi internet dibutuhkan** untuk mengakses AQUAVISION.
