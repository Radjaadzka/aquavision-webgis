# 15 – GLOSARIUM

## Istilah Teknis dan Definisinya

| Istilah | Definisi |
|---|---|
| **AHP (Analytical Hierarchy Process)** | Metode pengambilan keputusan multikriteria yang membandingkan tingkat kepentingan antarparameter secara berpasangan (pairwise comparison) untuk menghasilkan bobot prioritas. |
| **Akuifer** | Lapisan tanah atau batuan yang mampu menyimpan dan mengalirkan air tanah dalam jumlah signifikan. |
| **AOI (Area of Interest)** | Wilayah studi atau area analisis yang menjadi fokus penelitian. |
| **API (Application Programming Interface)** | Antarmuka yang memungkinkan komponen perangkat lunak berkomunikasi satu sama lain. AQUAVISION menggunakan REST API berbasis Django REST Framework. |
| **Basemap** | Peta dasar yang menjadi latar belakang visualisasi data spasial. AQUAVISION menyediakan OpenStreetMap, Satelit ESRI, dan Topografi ESRI. |
| **BCR (Benefit Cost Ratio)** | Rasio manfaat terhadap biaya proyek. BCR ≥ 1 = proyek layak. |
| **CAPEX** | Capital Expenditure; biaya investasi awal untuk membangun sistem. |
| **CHIRPS** | Climate Hazards Group InfraRed Precipitation with Station Data; dataset curah hujan global berbasis kombinasi citra satelit dan data stasiun; resolusi 0,05° (~5 km). |
| **CLS (Cumulative Layout Shift)** | Metrik pengalaman pengguna web yang mengukur stabilitas visual halaman selama pemuatan. |
| **CN (Curve Number)** | Nilai empiris (0–100) yang menunjukkan kemampuan suatu area dalam menghasilkan limpasan. CN tinggi = limpasan besar; CN rendah = infiltrasi lebih besar. |
| **CRUD** | Create, Read, Update, Delete; empat operasi dasar pengelolaan data dalam sistem basis data. |
| **CSRF (Cross-Site Request Forgery)** | Jenis serangan keamanan web yang memanfaatkan sesi pengguna yang aktif. AQUAVISION menggunakan CSRF Protection Django. |
| **DAS (Daerah Aliran Sungai)** | Wilayah daratan yang secara alami menampung air hujan dan mengalirkannya ke satu titik outlet (sungai/muara). Sinonim: watershed, catchment area. |
| **DEM (Digital Elevation Model)** | Model digital permukaan bumi yang menyimpan informasi ketinggian. AQUAVISION menggunakan SRTM 30m dan DEMNAS 8,1m. |
| **DEMNAS** | Digital Elevation Model Nasional; produk DEM Indonesia dari Badan Informasi Geospasial (BIG) dengan resolusi ~8,1 m. |
| **Debit** | Volume air yang mengalir per satuan waktu, biasanya dalam m³/detik atau L/detik. |
| **Debit Puncak (Qp)** | Debit maksimum yang dapat terjadi pada suatu DAS sebagai respons terhadap curah hujan tertentu. |
| **Django** | Framework web Python yang digunakan sebagai backend AQUAVISION. Versi: Django 4.2. |
| **Drainage Density** | Kerapatan jaringan aliran permukaan per satuan luas wilayah. Semakin tinggi = air lebih cepat mengalir di permukaan. |
| **EPSG:4326** | Kode sistem referensi koordinat WGS 84 (lintang/bujur); digunakan sebagai standar seluruh data spasial AQUAVISION. |
| **ESA WorldCover** | Produk tutupan lahan global resolusi 10 m dari European Space Agency berbasis data Sentinel-1 dan Sentinel-2 (tahun 2021). |
| **ESDM GeoMap** | Portal peta geologi Indonesia dari Kementerian Energi dan Sumber Daya Mineral; digunakan sebagai sumber data geology/lithology. |
| **FAO DSMW** | FAO Digital Soil Map of the World; peta tanah global skala 1:5.000.000 dari Food and Agriculture Organization. |
| **FCP (First Contentful Paint)** | Waktu yang dibutuhkan browser untuk menampilkan konten pertama di layar; indikator kecepatan web. |
| **GeoJSON** | Format data spasial berbasis JSON standar (RFC 7946); digunakan AQUAVISION untuk pertukaran data antar backend dan frontend. |
| **GeoDjango** | Ekstensi Django (django.contrib.gis) yang mendukung pengelolaan data spasial dan interaksi dengan PostGIS. |
| **GeoTIFF** | Format file raster geospasial yang menyimpan informasi koordinat di dalam file TIFF; digunakan untuk data debit puncak bulanan. |
| **GIS (Geographic Information System)** | Sistem Informasi Geografis; sistem untuk mengelola, menganalisis, dan memvisualisasikan data yang memiliki referensi geografis. |
| **GIS-MCDM** | Geographic Information System – Multi Criteria Decision Making; pendekatan pengambilan keputusan multikriteria berbasis GIS. |
| **Groundwater Potential Zone (GWP)** | Model spasial yang menunjukkan tingkat potensi relatif wilayah dalam mendukung keberadaan dan pengisian air tanah. Kelas: Low, Moderate, High, Very High. |
| **Initial Abstraction (Ia)** | Kehilangan awal air hujan sebelum limpasan permukaan terbentuk; meliputi infiltrasi awal, intersepsi vegetasi, dan tampungan permukaan. Ia = 0,2 × S. |
| **Intensitas Hujan (I)** | Besarnya curah hujan per satuan waktu (mm/jam). |
| **ISO/IEC 25010:2011** | Standar kualitas perangkat lunak internasional; mencakup 8 karakteristik termasuk functional suitability, performance efficiency, compatibility, dan usability. |
| **KML (Keyhole Markup Language)** | Format file berbasis XML untuk data geospasial; dapat dibuka di Google Earth. |
| **LCP (Largest Contentful Paint)** | Waktu hingga elemen konten terbesar (gambar/teks) selesai dimuat di layar. |
| **Leaflet.js** | Pustaka JavaScript open-source untuk peta interaktif berbasis web; versi 1.9 digunakan AQUAVISION. |
| **Layer** | Lapisan data tematik dalam peta GIS. Setiap layer mewakili satu jenis data spasial. |
| **Lineament** | Kelurusan morfologi di permukaan bumi yang mengindikasikan rekahan, patahan, atau zona lemah batuan. |
| **Lineament Density** | Kerapatan kelurusan morfologi/rekahan per satuan luas. Tinggi = potensi jalur air tanah lebih banyak. |
| **Lithology** | Sifat fisik batuan, termasuk tekstur, komposisi mineral, dan warna; menentukan kemampuan batuan meloloskan dan menyimpan air. |
| **LULC (Land Use/Land Cover)** | Tutupan dan Penggunaan Lahan; klasifikasi kondisi permukaan bumi (hutan, pertanian, permukiman, dll.). |
| **MCDM** | Multi Criteria Decision Making; metode pengambilan keputusan yang mempertimbangkan banyak kriteria sekaligus. |
| **Metode Rasional** | Metode hidrologi untuk menghitung debit puncak berdasarkan: Qp = 0,278 × C × I × A. |
| **Neraca Air** | Perbandingan antara ketersediaan air (supply) dan kebutuhan air (demand). |
| **NFV (Normalized Flow Variability)** | Indeks ternormalisasi yang membandingkan debit maksimum dan minimum: NFV = (Qmax − Qmin)/(Qmax + Qmin). |
| **NPV (Net Present Value)** | Nilai sekarang bersih dari arus kas investasi; NPV positif berarti investasi menguntungkan. |
| **OGC (Open Geospatial Consortium)** | Organisasi internasional yang menetapkan standar interoperabilitas data geospasial. |
| **OPEX** | Operational Expenditure; biaya operasional rutin tahunan. |
| **OWASP** | Open Worldwide Application Security Project; komunitas yang menyusun pedoman keamanan aplikasi web. |
| **Pairwise Comparison** | Perbandingan berpasangan antar parameter dalam metode AHP untuk menentukan bobot relatif. |
| **PostGIS** | Ekstensi PostgreSQL yang menambahkan kemampuan penyimpanan dan pengolahan data spasial (geometri, topologi, raster). Versi: 3.3. |
| **PostgreSQL** | Sistem manajemen basis data relasional open-source; versi 14 digunakan AQUAVISION. |
| **RBAC** | Role-Based Access Control; sistem kontrol akses berdasarkan peran pengguna (User, Admin). |
| **REST API** | Representational State Transfer Application Programming Interface; antarmuka layanan data berbasis HTTP. |
| **RFC 7946** | Spesifikasi format GeoJSON yang menjadi standar resmi pertukaran data spasial berbasis JSON. |
| **ROI (Return on Investment)** | Persentase keuntungan dari total investasi; ROI tinggi = investasi efisien. |
| **SCS-CN** | Soil Conservation Service – Curve Number; metode perhitungan limpasan permukaan dari curah hujan berdasarkan jenis tanah dan tutupan lahan. |
| **Shapefile** | Format file data spasial vektor yang umum digunakan di SIG desktop; ekstensi .shp disertai file pendukung (.dbf, .shx, .prj). |
| **SIG (Sistem Informasi Geografis)** | Lihat: GIS. |
| **Simulasi Skenario** | Fitur AQUAVISION yang memungkinkan pengguna mengubah parameter kebutuhan air untuk melihat dampaknya terhadap neraca air. |
| **Slope** | Kemiringan lereng dalam derajat; diturunkan dari DEM. |
| **SRTM** | Shuttle Radar Topography Mission; dataset elevasi digital global resolusi 1 arc-second (~30 m) dari NASA. |
| **Supply** | Ketersediaan air; dalam AQUAVISION berasal dari total debit sumber air yang terdaftar. |
| **Demand** | Kebutuhan air; dalam AQUAVISION dihitung dari jumlah penduduk, fasilitas akomodasi, dan restoran. |
| **TBT (Total Blocking Time)** | Waktu pemblokiran interaktivitas halaman web akibat aktivitas JavaScript. |
| **Three-Tier Client-Server** | Arsitektur sistem yang memisahkan presentasi (frontend), logika aplikasi (backend), dan penyimpanan data (database) ke dalam tiga lapisan terpisah. |
| **UTM Zone 49S** | Universal Transverse Mercator zona 49 Selatan; sistem koordinat proyeksi yang digunakan untuk analisis spasial (satuan meter) di wilayah Jawa Timur. |
| **Verifikasi Model** | Proses evaluasi kesesuaian hasil pemodelan dengan kondisi aktual atau referensi; berbeda dari validasi lapangan. |
| **WebGIS** | Web-based Geographic Information System; sistem GIS yang dapat diakses melalui browser internet. |
| **Weighted Overlay** | Proses penggabungan beberapa raster parameter dengan mengalikan masing-masing dengan bobotnya (weight) lalu menjumlahkan hasilnya. |
| **WGS 84 (EPSG:4326)** | World Geodetic System 1984; sistem referensi koordinat global berbasis lintang dan bujur; standar data spasial AQUAVISION. |
