# 18 – FAQ (FREQUENTLY ASKED QUESTIONS)

---

## TENTANG AQUAVISION

**Q: Apa itu AQUAVISION?**
A: AQUAVISION adalah sistem informasi sumber daya air berbasis WebGIS (peta interaktif berbasis web) yang dikembangkan untuk mendukung pengelolaan air bersih di Desa Wisata Wonotoro, Kabupaten Probolinggo, Jawa Timur. Sistem ini memungkinkan pengguna melihat peta sumber air, jaringan pipa, potensi air tanah, dan analisis ketersediaan air langsung melalui browser.

**Q: Mengapa AQUAVISION dibuat?**
A: Desa Wonotoro menghadapi beberapa masalah terkait air bersih: lokasi sumber air yang sulit diakses, jaringan pipa yang tidak terstruktur, penurunan debit air saat musim kemarau, dan data sumber daya air yang tersebar tidak terintegrasi. AQUAVISION hadir sebagai solusi terpadu untuk mengelola dan menyajikan informasi ini dalam satu platform yang mudah diakses.

**Q: Siapa yang membuat AQUAVISION?**
A: AQUAVISION dikembangkan oleh tiga mahasiswa Teknik Geodesi dan Geomatika ITB (Institut Teknologi Bandung): Najwa Maharani, Rayhan Fadhil Muhamad, dan Muhammad Radja Adzka, sebagai Tugas Akhir Capstone tahun 2026.

**Q: Apakah AQUAVISION bisa diakses secara online?**
A: Ya, AQUAVISION sudah dideploy dan dapat diakses melalui browser tanpa perlu menginstal perangkat lunak apapun, selama tersedia koneksi internet.

**Q: Browser apa yang didukung?**
A: Chrome 90+, Firefox 88+, Edge 90+, dan Safari 14+, baik di desktop maupun smartphone.

---

## AKUN DAN AKSES

**Q: Apakah perlu login untuk menggunakan AQUAVISION?**
A: Landing page dan peta (dashboard WebGIS) dapat dilihat setelah login. Fitur feedback publik dapat digunakan tanpa login. Untuk akses Data Portal, download data, dan fitur analisis penuh, diperlukan login.

**Q: Bagaimana cara membuat akun?**
A: Klik tombol "Daftar" atau "Registrasi" di halaman utama. Isi username dan password. Setelah berhasil, akun otomatis terdaftar sebagai pengguna reguler (User) dan langsung dapat mengakses WebGIS.

**Q: Bisa login pakai Google?**
A: Ya, tersedia opsi login via akun Google jika fitur ini sudah dikonfigurasi di server AQUAVISION yang Anda akses.

**Q: Apa bedanya akun User dan Admin?**
A: User dapat melihat peta, mengakses data portal publik, mengunduh dataset umum, dan mengirim pesan ke admin. Admin memiliki tambahan kemampuan: mengelola data (tambah/ubah/hapus), mengakses dataset sensitif, mengupload shapefile, dan membalas pesan pengguna.

---

## PETA DAN LAYER

**Q: Layer data apa saja yang tersedia?**
A: Terdapat 8 layer vektor dan 1 layer raster (total 12 raster per bulan untuk debit puncak):
- Sumber Air, Tandon Air, Permukiman, Fasilitas Wisata (Hotel, Tempat Makan, Jasa) – tipe titik
- Jaringan Pipa – tipe garis
- Administrasi Desa, Potensi Air Tanah – tipe poligon
- Debit Puncak Aliran (12 bulan, Januari–Desember) – tipe raster GeoTIFF

**Q: Cara menampilkan/menyembunyikan layer?**
A: Di panel kiri Dashboard WebGIS, centang atau hapus centang nama layer yang diinginkan.

**Q: Cara melihat informasi detail suatu objek di peta?**
A: Klik objek (titik, garis, atau area) di peta, maka akan muncul popup informasi yang menampilkan atribut objek tersebut.

---

## POTENSI AIR TANAH

**Q: Apa itu Potensi Air Tanah di AQUAVISION?**
A: Layer Potensi Air Tanah menampilkan hasil pemodelan Groundwater Potential Zone (GWP) yang menunjukkan tingkat potensi relatif suatu wilayah untuk mendukung keberadaan dan penyimpanan air tanah. Kelas: Low, Moderate, High, Very High.

**Q: Apa arti kelas "Very High" pada peta potensi air tanah?**
A: Area dengan kelas Very High memiliki kombinasi kondisi fisik (curah hujan tinggi, litologi permeabel, kemiringan lereng rendah, dan kondisi lain) yang paling mendukung infiltrasi dan penyimpanan air tanah. Wilayah ini adalah prioritas untuk konservasi dan pencarian sumber air baru.

**Q: Apakah peta potensi air tanah berarti pasti ada air di sana?**
A: TIDAK. Peta GWP adalah potensi relatif berdasarkan analisis faktor fisik, bukan bukti langsung keberadaan air tanah. Untuk memastikan ada air tanah di titik tertentu, tetap diperlukan survei lapangan (sumur bor, geolistrik, atau verifikasi mata air).

**Q: Berapa persen wilayah Wonotoro yang memiliki potensi air tanah tinggi?**
A: Berdasarkan hasil analisis: Low 11%, Moderate 29%, High 43%, Very High 17%. Jadi sekitar 60% wilayah studi berada di kelas High atau Very High.

---

## DEBIT PUNCAK ALIRAN

**Q: Apa itu Debit Puncak Aliran?**
A: Debit puncak aliran adalah estimasi nilai debit air tertinggi yang dapat terjadi di jaringan sungai pada suatu bulan tertentu, berdasarkan kondisi curah hujan rata-rata jangka panjang (klimatologis 1996–2025) dan karakteristik fisik DAS.

**Q: Bulan apa debit air paling tinggi di Wonotoro?**
A: Debit rata-rata tertinggi terjadi pada bulan Februari (14,942 m³/s), diikuti Januari (14,477 m³/s) dan Desember (13,595 m³/s). Ini merupakan periode puncak musim hujan.

**Q: Bulan apa debit air paling rendah?**
A: Debit terendah terjadi pada bulan September (rata-rata 0,138 m³/s) dan Agustus (rata-rata 0,143 m³/s). Ini adalah puncak musim kemarau.

**Q: Apakah data debit ini adalah debit aktual saat ini?**
A: Tidak. Nilai debit puncak yang ditampilkan adalah estimasi klimatologis (berdasarkan rata-rata 30 tahun), bukan pengukuran debit aktual saat ini. Gunakan data ini untuk memahami pola musiman, bukan untuk mengetahui debit sungai hari ini.

---

## NERACA AIR & SIMULASI

**Q: Apa itu Neraca Air di AQUAVISION?**
A: Neraca air adalah perbandingan antara total ketersediaan air (dari seluruh sumber air terdaftar) dengan total kebutuhan air (permukiman + hotel/homestay + restoran). Hasilnya ditampilkan dengan status: Aman, Waspada, atau Kritis.

**Q: Apa arti status "Kritis"?**
A: Status Kritis berarti kebutuhan air sudah melebihi 80% dari ketersediaan air yang ada. Artinya pasokan air mulai sangat tipis dan perlu tindakan segera (efisiensi penggunaan air, pencarian sumber baru, atau pengurangan demand).

**Q: Bagaimana cara menggunakan fitur Simulasi?**
A: Di Dashboard WebGIS, buka panel "Simulasi Neraca Air". Ubah parameter (jumlah penduduk, jumlah kamar hotel, kapasitas restoran, atau luas pertanian). Klik "Jalankan Simulasi" untuk melihat dampaknya terhadap neraca air.

---

## DATA PORTAL & DOWNLOAD

**Q: Apa itu Data Portal?**
A: Data Portal adalah halaman yang menampilkan semua dataset yang tersedia di AQUAVISION beserta deskripsi dan jumlah datanya. Pengguna dapat mengakses detail dan mengunduh data dari sini.

**Q: Format apa saja yang bisa diunduh?**
A: CSV (untuk tabel/spreadsheet), GeoJSON (data spasial berbasis web), KML (untuk Google Earth), dan Shapefile ZIP (untuk software GIS desktop seperti QGIS atau ArcGIS).

**Q: Kenapa beberapa dataset tidak bisa saya akses?**
A: Dataset yang bersifat sensitif (seperti data potensi air tanah detail, data jaringan pipa, dan DAS) hanya dapat diakses oleh Administrator. Jika Anda membutuhkan akses, hubungi admin sistem.

---

## PENGUKURAN JARAK

**Q: Fitur pengukuran jarak bisa digunakan untuk apa?**
A: Untuk memperkirakan jarak antara dua lokasi, misalnya: jarak antara sumber air dan permukiman (estimasi panjang pipa yang dibutuhkan), jarak antara dua titik fasilitas wisata, dll.

**Q: Cara menggunakan pengukuran jarak?**
A: Ada dua cara: (1) Klik dua titik di peta, sistem otomatis menghitung dan menampilkan jaraknya dalam meter dan kilometer. (2) Masukkan koordinat manual di form pengukuran jarak.

---

## HUBUNGI ADMIN & FEEDBACK

**Q: Bedanya "Hubungi Admin" dan "Feedback" apa?**
A: Hubungi Admin memungkinkan percakapan dua arah (admin bisa membalas); perlu login; untuk pertanyaan/laporan spesifik. Feedback publik di landing page tidak perlu login; satu arah (hanya kirim pesan, tidak ada balasan langsung).

**Q: Cara menghubungi admin?**
A: Login ke AQUAVISION → klik menu "Hubungi Admin" → buat percakapan baru → tulis pesan Anda.

---

## TEKNIS & METODOLOGI

**Q: Metode apa yang digunakan untuk membuat peta potensi air tanah?**
A: Metode GIS-MCDM (Geographic Information System – Multi Criteria Decision Making) berbasis AHP (Analytical Hierarchy Process), mengacu pada penelitian Tesfa & Sewnet (2025). Tujuh parameter fisik dikombinasikan dengan bobot AHP untuk menghasilkan indeks Groundwater Potential Zone.

**Q: Metode apa yang digunakan untuk menghitung debit puncak?**
A: SCS-CN (Soil Conservation Service – Curve Number) untuk menghitung limpasan permukaan, dan Metode Rasional (Qp = 0,278 × C × I × A) untuk menghitung debit puncak.

**Q: Sistem koordinat apa yang digunakan?**
A: WGS 84 (EPSG:4326) untuk penyimpanan dan pertukaran data. UTM Zone 49S untuk analisis spasial yang membutuhkan satuan meter.
