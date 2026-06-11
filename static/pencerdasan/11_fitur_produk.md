# 11 – FITUR PRODUK AQUAVISION

---

## 1. DASHBOARD WEBGIS

### Fungsi
Halaman utama AQUAVISION yang menjadi pusat interaksi pengguna dengan seluruh informasi sumber daya air. Menampilkan peta interaktif multi-layer yang terintegrasi dengan berbagai fitur analisis dan pengelolaan data.

### Manfaat
- Semua informasi sumber daya air Desa Wonotoro tersaji dalam satu tampilan.
- Tidak perlu berpindah ke aplikasi lain untuk eksplorasi data.
- Membantu pengambilan keputusan berbasis lokasi secara visual.

### Cara Penggunaan
1. Login ke AQUAVISION dengan akun terdaftar.
2. Dashboard otomatis terbuka dengan peta wilayah Desa Wonotoro.
3. Gunakan panel kiri untuk mengaktifkan/menonaktifkan layer.
4. Klik objek di peta untuk melihat informasi atributnya.

### Komponen Utama
- Peta interaktif (Leaflet.js)
- Panel layer control (toggle layer on/off)
- Basemap selector (OSM, Satelit, Topografi)
- Panel neraca air (supply vs demand)
- Panel simulasi skenario

---

## 2. PETA INTERAKTIF (INTERACTIVE MAP)

### Fungsi
Komponen visual utama yang menampilkan semua data sumber daya air dalam bentuk peta yang dapat dieksplorasi (zoom, pan, klik).

### Manfaat
- Melihat lokasi dan persebaran objek sumber daya air secara visual.
- Memahami hubungan spasial antarobjek (sumber air vs permukiman vs pipa).

### Cara Penggunaan
- **Zoom in/out:** Scroll mouse atau tombol +/- di peta.
- **Pan:** Klik dan geser peta.
- **Pilih objek:** Klik objek (titik, garis, poligon) untuk melihat popup informasi.

### Contoh Penggunaan
- Melihat apakah sumber air X cukup dekat dengan dusun Y untuk dibangun jaringan pipa.
- Mengecek letak tandon air terdekat dari sebuah hotel.

---

## 3. LAYER (PENGELOLAAN LAYER)

### Fungsi
Mengatur tampilan data di peta; pengguna dapat menampilkan atau menyembunyikan layer tertentu sesuai kebutuhan analisis.

### Daftar Layer yang Tersedia

| Nama Layer | Tipe Geometri | Deskripsi |
|---|---|---|
| Sumber Air | Titik (Point) | Lokasi mata air, sumur, atau sumber air lain |
| Tandon Air | Titik (Point) | Lokasi infrastruktur penyimpanan air |
| Permukiman | Titik (Point) | Lokasi dusun/permukiman warga |
| Fasilitas Wisata (Hotel) | Titik (Point) | Lokasi penginapan dan akomodasi |
| Fasilitas Wisata (Tempat Makan) | Titik (Point) | Lokasi restoran dan warung makan |
| Fasilitas Wisata (Jasa) | Titik (Point) | Lokasi fasilitas jasa wisata |
| Jaringan Pipa | Garis (MultiLineString) | Jalur distribusi air |
| Administrasi Desa | Poligon (MultiPolygon) | Batas wilayah desa |
| Potensi Air Tanah | Poligon Tematik (MultiPolygon) | Zona potensi air tanah (Low/Moderate/High/Very High) |
| Debit Puncak Aliran | Raster (GeoTIFF) | Peta debit puncak bulanan (12 layer, Jan–Des) |

### Cara Penggunaan
- Di panel kiri dashboard, centang/hapus centang nama layer untuk tampilkan/sembunyikan.
- Untuk layer raster debit puncak: pilih bulan yang diinginkan dari dropdown.

---

## 4. LEGENDA

### Fungsi
Menjelaskan arti simbol, warna, dan kelas yang digunakan pada peta.

### Cara Membaca
- **Warna merah/oranye/kuning/hijau** pada layer Potensi Air Tanah: menunjukkan kelas dari Low (rendah) hingga Very High (sangat tinggi).
- **Gradasi warna** pada layer Debit Puncak: menunjukkan nilai debit dari rendah hingga tinggi.
- **Ikon berbeda** untuk setiap jenis fasilitas wisata dan sumber air.

---

## 5. CARI LOKASI (SEARCH FEATURE)

### Fungsi
Membantu pengguna menemukan objek atau lokasi tertentu secara cepat tanpa harus menelusuri seluruh peta.

### Manfaat
- Menghemat waktu saat mencari objek spesifik.
- Berguna saat jumlah data semakin banyak.

### Cara Penggunaan
1. Klik ikon pencarian atau kolom pencarian di Data Portal.
2. Ketik nama sumber air, dusun, fasilitas, atau dataset yang dicari.
3. Sistem menampilkan hasil yang cocok.

---

## 6. EXPORT / UNDUH DATA

### Fungsi
Memungkinkan pengguna mengunduh dataset untuk kebutuhan analisis lanjutan, pelaporan, atau penggunaan di perangkat lunak lain.

### Format yang Tersedia

| Format | Kegunaan |
|---|---|
| CSV | Analisis tabular (Excel, statistik) |
| GeoJSON | Pertukaran data spasial berbasis web |
| KML | Visualisasi di Google Earth dan aplikasi sejenis |
| Shapefile (.zip) | Analisis di perangkat lunak SIG desktop (QGIS, ArcGIS) |

### Cara Penggunaan
1. Buka **Data Portal** dari menu.
2. Pilih dataset yang ingin diunduh.
3. Buka halaman Detail Dataset.
4. Klik tombol "Unduh" dan pilih format.

### Catatan Akses
- Dataset umum: dapat diunduh oleh semua pengguna (User dan Admin).
- Dataset sensitif (potensi air tanah, jaringan pipa, DAS): khusus Admin.

---

## 7. DATA PORTAL

### Fungsi
Pusat akses dataset AQUAVISION. Menampilkan semua dataset yang tersedia dalam bentuk daftar kartu informasi, dilengkapi pencarian, statistik, dan akses unduh.

### Manfaat
- Pengguna tidak perlu berinteraksi langsung dengan database untuk mengakses data.
- Informasi jumlah record selalu real-time.
- Pencarian cepat berdasarkan kata kunci.

### Cara Penggunaan
1. Login dan klik menu "Data Portal".
2. Lihat daftar dataset dengan jumlah data masing-masing.
3. Klik nama dataset untuk melihat detail dan mengunduh.
4. Gunakan kolom pencarian untuk mencari dataset tertentu.

---

## 8. HUBUNGI ADMIN

### Fungsi
Saluran komunikasi dua arah antara pengguna terdaftar dan administrator sistem. Memungkinkan pengiriman pertanyaan, laporan, dan permintaan informasi.

### Manfaat
- Pengguna dapat menyampaikan kebutuhan spesifik yang tidak terjawab oleh sistem.
- Riwayat percakapan tersimpan sehingga dapat ditinjau kembali.
- Respons admin lebih terorganisasi dibandingkan komunikasi via media lain.

### Cara Penggunaan
1. Login ke AQUAVISION.
2. Klik menu "Hubungi Admin".
3. Buat percakapan baru dan tulis pesan.
4. Tunggu balasan dari admin (sistem memperbarui otomatis).

---

## 9. FEEDBACK PUBLIK

### Fungsi
Sarana komunikasi satu arah dari pengguna (termasuk yang belum login) kepada pengelola sistem untuk menyampaikan masukan, saran, dan informasi.

### Perbedaan dengan Hubungi Admin
- **Feedback:** Tidak perlu login; satu arah; tersedia di landing page.
- **Hubungi Admin:** Perlu login; dua arah (ada balasan admin); tersedia di dashboard.

### Cara Penggunaan
1. Buka landing page AQUAVISION.
2. Gulir ke bagian bawah halaman (form feedback).
3. Isi nama dan pesan.
4. Klik "Kirim".

---

## 10. SIMULASI KETERSEDIAAN AIR (SIMULASI SKENARIO)

### Fungsi
Memungkinkan pengguna mengevaluasi dampak perubahan kebutuhan air terhadap kondisi neraca air Desa Wonotoro. Pengguna memasukkan parameter, sistem menghitung ulang neraca air secara otomatis.

### Manfaat
- Membantu perencanaan sebelum pembangunan fasilitas baru (hotel, restoran, perumahan).
- Memberikan gambaran apakah sumber daya air cukup untuk skenario tertentu.
- Mendukung pengambilan keputusan berbasis data.

### Parameter Simulasi

| Parameter | Pengaruh |
|---|---|
| Jumlah Penduduk | Mengubah kebutuhan air domestik |
| Jumlah Kamar Hotel/Homestay | Mengubah kebutuhan air sektor akomodasi |
| Kapasitas Restoran | Mengubah kebutuhan air sektor restoran |
| Luas Lahan Pertanian | Mengubah kebutuhan air sektor pertanian |

### Cara Penggunaan
1. Buka Dashboard WebGIS.
2. Klik panel "Simulasi Neraca Air".
3. Masukkan nilai parameter sesuai skenario yang ingin diuji.
4. Klik "Jalankan Simulasi".
5. Lihat hasilnya: total kebutuhan air, persentase pemanfaatan, dan status (Aman/Waspada/Kritis).

---

## 11. RINGKASAN DATA (NERACA AIR / INFORMASI KETERSEDIAAN AIR)

### Fungsi
Menampilkan kondisi neraca air aktual Desa Wonotoro secara real-time: total ketersediaan air (dari sumber air), total kebutuhan air (permukiman + wisata), dan status keseimbangan.

### Komponen Informasi yang Ditampilkan

| Informasi | Penjelasan |
|---|---|
| Ketersediaan Air (Supply) | Total debit seluruh sumber air yang terdaftar |
| Kebutuhan Air (Demand) | Total kebutuhan domestik + hotel/homestay + restoran |
| Persentase Pemanfaatan | (Demand / Supply) × 100% |
| Status Neraca Air | Aman (<50%), Waspada (50–80%), Kritis (>80%) |
| Gauge Chart | Visualisasi grafis tingkat pemanfaatan |

### Cara Membaca
- **Aman:** Air cukup untuk semua kebutuhan.
- **Waspada:** Air mulai mendekati batas; perlu efisiensi penggunaan.
- **Kritis:** Kebutuhan melebihi 80% ketersediaan; perlu tindakan segera.

---

## 12. STATISTIK SISTEM

### Fungsi
Menampilkan ringkasan statistik data yang tersimpan dalam sistem secara real-time.

### Data yang Ditampilkan (Landing Page)
- Jumlah sumber air yang terdaftar.
- Jumlah fasilitas wisata yang terdaftar.
- Jumlah permukiman yang terdaftar.

### Cara Kerja
Statistik diambil langsung dari database saat halaman dimuat, sehingga selalu mencerminkan data terkini.
