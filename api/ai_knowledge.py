"""
AQUAVISION — AI Knowledge Base
Data pengetahuan untuk AI Assistant pada fitur Hubungi Admin: alias/sinonim,
glosarium, metadata layer, FAQ, classifier kategori, dan database context engine.

Sumber konten: static/pencerdasan/ (15_glosarium, 16_alias_dan_sinonim, 18_faq,
20_layer_dan_metadata, 11_fitur_produk) — dokumentasi yang sudah ditulis untuk
keperluan AI Assistant/RAG, dipindahkan & diperluas ke sini agar tidak terjadi
duplikasi/kontradiksi antara dokumentasi thesis dan engine yang berjalan.

Modul ini murni data + helper functions. Tidak mengubah alur request/response
Hubungi Admin yang sudah berjalan — dikonsumsi oleh _ai_respond() di views.py.
"""

import re

# ================================================================
# 1) ALIAS & SINONIM — normalisasi sebelum keyword matching
# ================================================================
# Hanya memuat varian/typo yang cukup spesifik (multi-kata atau typo jelas)
# untuk menghindari false-positive pada kata umum (low/high/aman/kritis/dst
# sengaja TIDAK dimasukkan karena terlalu generik untuk di-auto-replace).
ALIASES = {
    'aquavision': ['aqua vision', 'aqua-vision', 'sisda'],
    'potensi air tanah': [
        # NB: "air tanah" (dengan spasi) SENGAJA TIDAK dimasukkan karena ia
        # adalah substring literal dari frasa kanonik "potensi air tanah"
        # sendiri — re.sub akan mencocokkannya ulang di dalam teks yang
        # sudah benar dan menghasilkan duplikasi ("potensi potensi air tanah").
        'airtanah', 'groundwater potential zone', 'groundwater potential',
        'gwpz', 'gwp', 'pontensi air tanah', 'pontensi airtanah', 'potansi air tanah',
        'zona potensi air tanah', 'potensi airtanah',
    ],
    'debit puncak': [
        'debet puncak', 'debir puncak', 'debet aliran', 'peak flow', 'debit banjir',
        'debit puncak aliran',
    ],
    'daerah aliran sungai': [
        'watershed', 'catchment area', 'sub-das', 'sub das', 'tangkapan air',
        'daerah tangkapan air',
    ],
    'sumber air': ['mata air', 'titik mata air', 'sumber mata air', 'spring'],
    'tandon air': ['tangki air', 'bak penampungan', 'penampungan air', 'reservoir'],
    'jaringan pipa': [
        'pipa distribusi', 'jaringan distribusi', 'saluran pipa', 'instalasi pipa', 'pipa air',
    ],
    'data portal': ['portal data', 'pusat data', 'repository data'],
    'ekspor': ['export'],
    'neraca air': [
        'water balance', 'balance air', 'supply demand', 'supply dan demand',
        'supply vs demand', 'supai air', 'keseimbangan air',
    ],
    'simulasi': ['simulasi air', 'skenario air', 'proyeksi air', 'prediksi air'],
    'wonotoro': ['wonoroto', 'wono toro'],
    'ahp': ['analytical hierarchy process', 'pairwise comparison'],
    'scs-cn': ['scs cn', 'curve number', 'soil conservation service'],
    'hotel': [
        'penginapan', 'homestay', 'home stay', 'guest house', 'guesthouse', 'losmen', 'wisma',
    ],
    'restoran': ['warung makan', 'rumah makan', 'kedai', 'tempat makan'],
    'permukiman': ['pemukiman'],
}


def _build_alias_pattern():
    """Bangun satu regex gabungan (alternation) dari semua varian alias,
    diurutkan terpanjang-dulu agar varian yang lebih spesifik menang saat
    tumpang tindih. Dibangun sekali saat modul di-load."""
    pairs = []
    for canonical, alts in ALIASES.items():
        for alt in alts:
            pairs.append((alt, canonical))
    pairs.sort(key=lambda pair: len(pair[0]), reverse=True)
    mapping = dict(pairs)
    pattern = re.compile('|'.join(re.escape(alt) for alt, _ in pairs))
    return pattern, mapping


_ALIAS_PATTERN, _ALIAS_MAP = _build_alias_pattern()


def normalize_aliases(text):
    """Ganti varian alias/typo dengan istilah kanonik agar FAQ/intent matching
    (berbasis substring) mengenali variasi penulisan tanpa perlu menambah
    keyword satu-per-satu di tiap entri. Hanya MENAMBAH kecocokan baru —
    istilah kanonik yang sudah dipakai entri lama tidak pernah diubah.

    Dilakukan dalam SATU pass (re.sub) di atas teks asli — bukan replace()
    berurutan — agar teks yang baru disisipkan tidak ikut tercocokkan ulang
    (mencegah duplikasi seperti "potensi air tanah" -> "potensi potensi air tanah"
    yang terjadi jika "air tanah" dicocokkan lagi setelah disisipkan)."""
    return _ALIAS_PATTERN.sub(lambda m: _ALIAS_MAP[m.group(0)], text.lower())


# ================================================================
# 2) GLOSARIUM — istilah teknis & hidrologi (dari 15_glosarium.md)
# ================================================================
GLOSSARY = {
    'ahp': 'Metode pengambilan keputusan multikriteria yang membandingkan tingkat kepentingan antarparameter secara berpasangan (pairwise comparison) untuk menghasilkan bobot prioritas.',
    'akuifer': 'Lapisan tanah atau batuan yang mampu menyimpan dan mengalirkan air tanah dalam jumlah signifikan.',
    'basemap': 'Peta dasar yang menjadi latar belakang visualisasi data spasial. AQUAVISION menyediakan OpenStreetMap, Satelit ESRI, dan Topografi ESRI.',
    'bcr': 'Benefit Cost Ratio — rasio manfaat terhadap biaya proyek. BCR ≥ 1 berarti proyek layak secara finansial.',
    'chirps': 'Climate Hazards Group InfraRed Precipitation with Station Data — dataset curah hujan global berbasis kombinasi citra satelit dan data stasiun, resolusi ~5 km.',
    'cn': 'Curve Number — nilai empiris (0–100) yang menunjukkan kemampuan suatu area menghasilkan limpasan. CN tinggi berarti limpasan besar, CN rendah berarti infiltrasi lebih besar.',
    'curve number': 'Nilai empiris (0–100) yang menunjukkan kemampuan suatu area menghasilkan limpasan permukaan, dipakai dalam metode SCS-CN.',
    'das': 'Daerah Aliran Sungai — wilayah daratan yang secara alami menampung air hujan dan mengalirkannya ke satu titik outlet (sungai/muara). Sinonim: watershed, catchment area.',
    'dem': 'Digital Elevation Model — model digital permukaan bumi yang menyimpan informasi ketinggian. AQUAVISION menggunakan SRTM 30m dan DEMNAS 8,1m.',
    'demnas': 'Digital Elevation Model Nasional — produk DEM Indonesia dari Badan Informasi Geospasial (BIG), resolusi ~8,1 m.',
    'debit': 'Volume air yang mengalir per satuan waktu, biasanya dalam m³/detik atau L/detik.',
    'debit puncak': 'Debit maksimum yang dapat terjadi pada suatu DAS sebagai respons terhadap curah hujan tertentu, disimbolkan Qp.',
    'drainage density': 'Kerapatan jaringan aliran permukaan per satuan luas wilayah. Semakin tinggi, air lebih cepat mengalir di permukaan (bukan meresap).',
    'epsg:4326': 'Kode sistem referensi koordinat WGS 84 (lintang/bujur) — standar seluruh data spasial AQUAVISION.',
    'esa worldcover': 'Produk tutupan lahan global resolusi 10 m dari European Space Agency berbasis data Sentinel-1 dan Sentinel-2 (tahun 2021).',
    'geojson': 'Format data spasial berbasis JSON standar (RFC 7946) yang dipakai AQUAVISION untuk pertukaran data antara backend dan frontend.',
    'geodjango': 'Ekstensi Django (django.contrib.gis) yang mendukung pengelolaan data spasial dan interaksi dengan PostGIS.',
    'geotiff': 'Format file raster geospasial yang menyimpan informasi koordinat di dalam file TIFF, dipakai untuk data debit puncak bulanan.',
    'gis': 'Geographic Information System — sistem untuk mengelola, menganalisis, dan memvisualisasikan data yang memiliki referensi geografis.',
    'groundwater potential zone': 'Model spasial yang menunjukkan tingkat potensi relatif wilayah dalam mendukung keberadaan dan pengisian air tanah. Kelas: Rendah, Sedang, Tinggi, Sangat Tinggi.',
    'gwp': 'Groundwater Potential (Potensi Air Tanah) — hasil pemodelan zona potensi air tanah AQUAVISION, diklasifikasikan Rendah/Sedang/Tinggi/Sangat Tinggi.',
    'initial abstraction': 'Kehilangan awal air hujan sebelum limpasan permukaan terbentuk (infiltrasi awal, intersepsi vegetasi, tampungan permukaan). Ia = 0,2 × S.',
    'kml': 'Keyhole Markup Language — format file berbasis XML untuk data geospasial yang dapat dibuka di Google Earth.',
    'leaflet': 'Pustaka JavaScript open-source untuk peta interaktif berbasis web. AQUAVISION memakai versi 1.9.',
    'lineament': 'Kelurusan morfologi di permukaan bumi yang mengindikasikan rekahan, patahan, atau zona lemah batuan — berkaitan dengan jalur air tanah.',
    'lithology': 'Sifat fisik batuan (tekstur, komposisi mineral, warna) yang menentukan kemampuan batuan meloloskan dan menyimpan air.',
    'lulc': 'Land Use/Land Cover — klasifikasi tutupan dan penggunaan lahan (hutan, pertanian, permukiman, dll).',
    'metode rasional': 'Metode hidrologi untuk menghitung debit puncak: Qp = 0,278 × C × I × A, di mana C = koefisien limpasan, I = intensitas hujan, A = luas DAS.',
    'mcdm': 'Multi Criteria Decision Making — metode pengambilan keputusan yang mempertimbangkan banyak kriteria sekaligus.',
    'neraca air': 'Perbandingan antara ketersediaan air (supply) dan kebutuhan air (demand) di suatu wilayah.',
    'npv': 'Net Present Value — nilai sekarang bersih dari arus kas investasi. NPV positif berarti investasi menguntungkan.',
    'pairwise comparison': 'Perbandingan berpasangan antarparameter dalam metode AHP untuk menentukan bobot relatif tiap parameter.',
    'postgis': 'Ekstensi PostgreSQL yang menambahkan kemampuan penyimpanan dan pengolahan data spasial (geometri, topologi, raster). AQUAVISION memakai versi 3.3.',
    'rbac': 'Role-Based Access Control — sistem kontrol akses berdasarkan peran pengguna (User, Admin).',
    'roi': 'Return on Investment — persentase keuntungan dari total investasi. ROI tinggi berarti investasi efisien.',
    'scs-cn': 'Soil Conservation Service – Curve Number — metode perhitungan limpasan permukaan dari curah hujan berdasarkan jenis tanah dan tutupan lahan.',
    'shapefile': 'Format file data spasial vektor yang umum dipakai di software SIG desktop (ekstensi .shp disertai .dbf, .shx, .prj).',
    'simulasi skenario': 'Fitur AQUAVISION yang memungkinkan pengguna mengubah parameter kebutuhan air untuk melihat dampaknya terhadap neraca air.',
    'slope': 'Kemiringan lereng dalam derajat, diturunkan dari DEM — salah satu parameter pemodelan potensi air tanah.',
    'srtm': 'Shuttle Radar Topography Mission — dataset elevasi digital global resolusi ~30 m dari NASA.',
    'supply': 'Ketersediaan air — dalam AQUAVISION berasal dari total debit sumber air yang terdaftar.',
    'demand': 'Kebutuhan air — dalam AQUAVISION dihitung dari jumlah penduduk, fasilitas akomodasi, dan restoran.',
    'three-tier client-server': 'Arsitektur sistem yang memisahkan presentasi (frontend), logika aplikasi (backend), dan penyimpanan data (database) ke tiga lapisan terpisah.',
    'utm zone 49s': 'Universal Transverse Mercator zona 49 Selatan — sistem koordinat proyeksi untuk analisis spasial bersatuan meter di wilayah Jawa Timur.',
    'webgis': 'Web-based Geographic Information System — sistem GIS yang dapat diakses melalui browser internet.',
    'weighted overlay': 'Proses penggabungan beberapa raster parameter dengan mengalikan masing-masing dengan bobotnya (weight) lalu menjumlahkan hasilnya.',
    'wgs 84': 'World Geodetic System 1984 — sistem referensi koordinat global berbasis lintang dan bujur, standar data spasial AQUAVISION.',
}


_DEFINITION_PREFIX_TRIGGERS = ('apa itu ', 'definisi ', 'pengertian ', 'maksud dari ', 'maksudnya ')
_DEFINITION_SUFFIX_TRIGGERS = (' itu apa', ' artinya apa', ' maksudnya apa')


def _extract_definition_subject(msg_lower):
    """Ambil teks SUBJEK pertanyaan definisi (bagian setelah "apa itu " atau
    sebelum " itu apa"), bukan keseluruhan kalimat. Mengembalikan None jika
    tidak ada frasa pemicu definisi sama sekali."""
    for prefix in _DEFINITION_PREFIX_TRIGGERS:
        idx = msg_lower.find(prefix)
        if idx != -1:
            return msg_lower[idx + len(prefix):].strip(' ?!.,')
    for suffix in _DEFINITION_SUFFIX_TRIGGERS:
        idx = msg_lower.find(suffix)
        if idx != -1:
            return msg_lower[:idx].strip(' ?!.,')
    return None


def lookup_glossary_term(msg_lower):
    """Cari istilah glosarium HANYA jika istilah tersebut adalah SUBJEK
    pertanyaan (mengikuti "apa itu X" atau mendahului "X itu apa"), bukan
    substring yang kebetulan muncul di bagian lain kalimat. Ini mencegah AI
    menjawab istilah yang salah — misal "apa itu NFV dalam analisis debit?"
    TIDAK boleh terjawab sebagai "debit" hanya karena kata itu kebetulan ada
    di akhir kalimat.

    Strategi: cocokkan SELURUH subjek dulu (menangani istilah multi-kata
    seperti "groundwater potential zone" atau "curve number"). Hanya jika
    subjek pendek (<=2 kata) dan tidak cocok utuh, coba kata pertama/terakhir
    saja (menangani pola "metode ahp" -> istilah sebenarnya "ahp"). Subjek
    PANJANG (>2 kata, biasanya ada klausa tambahan seperti "... dalam
    analisis debit") TIDAK dipecah sama sekali — mencegah AI menyambar kata
    terakhir yang kebetulan ada di glosarium padahal bukan yang ditanya.
    Mengembalikan None (bukan jawaban yang dikarang) jika istilah yang
    diminta benar-benar tidak ada di glosarium."""
    subject = _extract_definition_subject(msg_lower)
    if not subject:
        return None
    words = subject.split()
    if not words:
        return None

    full = ' '.join(words)
    if full in GLOSSARY:
        return full, GLOSSARY[full]

    if len(words) <= 2:
        if words[-1] in GLOSSARY:
            return words[-1], GLOSSARY[words[-1]]
        if words[0] in GLOSSARY:
            return words[0], GLOSSARY[words[0]]

    return None


# ================================================================
# 3) METADATA LAYER (dari 20_layer_dan_metadata.md)
# ================================================================
LAYER_METADATA = {
    'potensi_air_tanah': {
        'nama': 'Potensi Air Tanah (Groundwater Potential Zone)',
        'tipe_geometri': 'MultiPolygon (Vektor)',
        'deskripsi': 'Peta zonasi potensi air tanah hasil analisis AHP berbasis parameter fisik berbobot (sumber data: DaerahResapan.geojson).',
        'kelas': 'Rendah (12,4%, ~43,2 km²) | Sedang (43,5%, ~151,6 km²) | Tinggi (33,4%, ~116,5 km²) | Sangat Tinggi (10,6%, ~37,0 km²)',
        'akses': 'Login required',
    },
    'debit_puncak': {
        'nama': 'Debit Puncak Aliran',
        'tipe_geometri': 'Raster GeoTIFF (12 file bulanan)',
        'deskripsi': 'Estimasi debit puncak bulanan (m³/s) berbasis SCS-CN + Metode Rasional, klimatologis 1996–2025.',
        'tertinggi': 'Februari (rata-rata 14,942 m³/s)',
        'terendah': 'September (rata-rata 0,138 m³/s)',
        'akses': 'Login required',
    },
    'sumber_air': {
        'nama': 'Sumber Air',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Titik mata air/sumber air terdaftar di Desa Wonotoro.',
        'field_utama': 'nama, debit (L/dtk), jenis_sumber, kondisi, tahun_pendataan',
        'akses': 'Login required',
    },
    'tandon_air': {
        'nama': 'Tandon Air',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Lokasi tandon/reservoir penyimpanan air.',
        'field_utama': 'nama, kapasitas_m3, elevasi',
        'akses': 'Login required',
    },
    'jaringan_pipa': {
        'nama': 'Jaringan Pipa',
        'tipe_geometri': 'MultiLineString (Vektor)',
        'deskripsi': 'Jaringan distribusi pipa air yang menghubungkan sumber air ke permukiman dan fasilitas.',
        'field_utama': 'nama, diameter_mm, kondisi, tahun_pasang',
        'akses': 'Login required',
    },
    'jaringan_sungai': {
        'nama': 'Daerah Aliran Sungai (Jaringan Sungai)',
        'tipe_geometri': 'MultiLineString (Vektor)',
        'deskripsi': 'Jaringan sungai (stream network) hasil ekstraksi DEM. Batas polygon DAS (289,164 km²) tersimpan sebagai referensi internal, belum diekspos sebagai layer terpisah.',
        'akses': 'Login required',
    },
    'administrasi_desa': {
        'nama': 'Administrasi Desa',
        'tipe_geometri': 'MultiPolygon (Vektor)',
        'deskripsi': 'Batas wilayah administratif Desa Wonotoro dan sekitarnya di Kecamatan Sukapura.',
        'field_utama': 'wadmkd, wadmkc, wadmkk, wadmpr, luas',
        'akses': 'Login required',
    },
    'hotel': {
        'nama': 'Hotel / Akomodasi',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Lokasi penginapan/hotel/homestay. Kebutuhan air = jumlah kamar × 250 L/hari.',
        'akses': 'Login required',
    },
    'tempat_makan': {
        'nama': 'Tempat Makan',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Lokasi restoran/warung makan. Kebutuhan air = jumlah kursi × 25 L/hari.',
        'akses': 'Login required',
    },
    'jasa': {
        'nama': 'Jasa (Fasilitas Jasa Wisata)',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Lokasi fasilitas jasa pendukung pariwisata (pemandu, jeep, ticketing, dll).',
        'akses': 'Login required',
    },
    'permukiman': {
        'nama': 'Permukiman',
        'tipe_geometri': 'Point (Vektor)',
        'deskripsi': 'Lokasi dusun/permukiman warga beserta data kependudukan. Kebutuhan air domestik = 120 L/orang/hari.',
        'field_utama': 'nama_dusun, jumlah_kk, jumlah_penduduk, kategori_pelanggan',
        'akses': 'Login required',
    },
}


# ================================================================
# 4) FAQ — diperluas dari 16 entri menjadi knowledge base penuh
#    (16 entri pertama dipertahankan VERBATIM dari views.py untuk
#    menjamin nol regresi; entri setelahnya adalah ekstensi baru)
# ================================================================
# Entri "catch-all" (aquavision/apa itu/tentang/platform/sistem) DIPISAH dari
# FAQ_ENTRIES karena audit 109 pertanyaan (lihat percakapan) membuktikan ia
# membajak terlalu banyak pertanyaan spesifik akibat tie-break berbasis bobot
# panjang keyword (cth. "Apa itu DAS?"/"Apa itu AHP?" dijawab definisi
# AQUAVISION secara umum, bukan topik yang ditanya). Sekarang HANYA dicoba
# sebagai fallback PALING TERAKHIR, setelah semua entri spesifik & glosarium
# gagal — lihat match_faq() dan urutan pemanggilan di views.py:_ai_respond().
GENERIC_FALLBACK_ENTRY = (
    ('aquavision', 'apa itu', 'tentang', 'platform', 'sistem'),
    "AQUAVISION adalah platform WebGIS (Web Geographic Information System) untuk pemantauan dan pengelolaan sumber daya air di Desa Wonotoro, Kecamatan Sukapura, Kabupaten Probolinggo. Platform ini dikembangkan sebagai Capstone Design Project Teknik Geodesi dan Geomatika ITB 2026.",
)

FAQ_ENTRIES = [
    (('dashboard', 'peta', 'cara buka', 'cara akses', 'bagaimana masuk'),
     "Dashboard AQUAVISION dapat diakses dari menu utama atau melalui tombol 'Buka Dashboard'. Dashboard menampilkan peta interaktif dengan berbagai lapisan data spasial sumber daya air Desa Wonotoro."),

    (('layer', 'lapisan', 'daftar layer', 'aktifkan layer', 'tampilkan layer'),
     "Untuk mengelola layer, klik tombol 'Daftar Layer' di sidebar kiri Dashboard. Anda dapat mengaktifkan atau menonaktifkan lapisan data seperti Potensi Air Tanah, Debit Puncak Aliran, Infrastruktur Air, dan lainnya secara bersamaan."),

    (('potensi air tanah', 'recharge', 'resapan', 'zonasi', 'ahp'),
     "Layer Daerah Potensi Air Tanah menampilkan zonasi resapan air tanah dengan resolusi 10m × 10m. Data dihasilkan menggunakan metode AHP (Analytical Hierarchy Process) berdasarkan tutupan lahan, kemiringan lereng, jenis tanah, dan curah hujan. Warna menunjukkan tingkat potensi dari rendah hingga sangat tinggi."),

    (('debit puncak', 'catchment', 'aliran', 'curah hujan', 'bulan'),
     "Layer Debit Puncak Aliran menampilkan peta debit puncak (m³/s) dengan resolusi 30m × 30m. Data tersedia untuk 12 bulan (Januari–Desember). Pilih bulan dari dropdown di panel layer, kemudian klik area pada peta untuk membaca nilai debit di lokasi tersebut."),

    (('infrastruktur', 'sumber air', 'pipa', 'tandon', 'reservoir', 'fasilitas'),
     "Layer Infrastruktur Air menampilkan lokasi sumber mata air, jaringan pipa distribusi, tandon air, permukiman, dan fasilitas wisata (hotel, restoran, jasa). Klik titik atau garis di peta untuk melihat atribut detail setiap objek."),

    (('neraca air', 'ketersediaan', 'kebutuhan air', 'status aman', 'status kritis', 'waspada'),
     "Ketersediaan Air membandingkan total ketersediaan air dari sumber dengan kebutuhan harian. Status AMAN berarti pemanfaatan di bawah 50% dari ketersediaan, WASPADA berarti 50–80%, dan KRITIS berarti 80% ke atas. Data diperbarui secara berkala dari sistem AQUAVISION."),

    (('simulasi', 'skenario', 'proyeksi', 'hitung kebutuhan', 'penduduk', 'hotel'),
     "Fitur Simulasi Skenario memungkinkan Anda memasukkan parameter hipotetis — jumlah penduduk, kamar hotel, kursi restoran, atau luas pertanian — untuk menghitung proyeksi kebutuhan air. Berguna untuk perencanaan pengembangan wisata dan infrastruktur."),

    (('data portal', 'unduh', 'download', 'ekspor', 'csv', 'geojson', 'shapefile', 'kml'),
     "Data Portal AQUAVISION menyediakan akses ke seluruh dataset spasial. Anda dapat mengunduh data dalam format CSV, GeoJSON, KML, atau Shapefile untuk analisis lanjutan di perangkat lunak GIS desktop atau spreadsheet. Kunjungi menu 'Data Portal' di navbar."),

    (('akun', 'login', 'daftar', 'register', 'password', 'lupa password', 'username'),
     "Untuk mengakses fitur lengkap AQUAVISION, buat akun melalui halaman Daftar. Gunakan username dan password yang Anda buat untuk masuk. Jika lupa password, hubungi admin AQUAVISION melalui pesan ini."),

    (('bantuan', 'faq', 'panduan', 'cara menggunakan', 'tutorial', 'petunjuk'),
     "Pusat Bantuan AQUAVISION tersedia di menu navbar dan sidebar. Di sana terdapat FAQ lengkap dalam 6 kategori: Tentang AQUAVISION, Dashboard, Data & Layer, Ketersediaan Air, Akun & Akses, dan Teknis. Gunakan fitur pencarian untuk menemukan jawaban dengan cepat."),

    (('wonotoro', 'desa', 'lokasi', 'bromo', 'probolinggo', 'sukapura'),
     "Desa Wonotoro terletak di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Desa ini berada di kawasan penyangga KSPN (Kawasan Strategis Pariwisata Nasional) Bromo Tengger Semeru, koordinat sekitar 7°53' LS dan 112°59' BT (WGS84/EPSG:4326)."),

    (('health', 'status sistem', 'sistem online', 'database status', 'layer status'),
     "Panel Status Sistem di sidebar Dashboard menampilkan kondisi komponen utama AQUAVISION secara langsung: koneksi data, ketersediaan layer GIS, dan penyimpanan file. Status hijau berarti semua berjalan normal. Jika ada komponen berwarna merah, silakan hubungi tim pengelola melalui menu Hubungi Admin."),

    (('riwayat download', 'log download', 'siapa yang download', 'rekam jejak unduh'),
     "Setiap unduhan data di AQUAVISION dicatat secara otomatis. Tim pengelola dapat memantau riwayat unduhan untuk menjaga keamanan dan penggunaan data. Jika Anda memiliki pertanyaan tentang data yang pernah diunduh, silakan hubungi tim pengelola melalui menu Hubungi Admin."),

    (('panduan dashboard', 'tour', 'lihat panduan', 'cara mulai', 'onboarding', 'mulai dari mana'),
     "AQUAVISION menyediakan “Panduan Dashboard” interaktif yang dapat diakses melalui tombol “ⓘ Lihat Panduan Dashboard” di bagian bawah panel kiri. Panduan ini akan menjelaskan semua fitur utama satu per satu. Klik tombol tersebut untuk memulai atau mengulang panduan kapan saja."),

    (('jumlah sungai', 'berapa sungai', 'jaringan sungai', 'daerah aliran sungai', 'segmen sungai', 'sungai'),
     "AQUAVISION memetakan jaringan Daerah Aliran Sungai (DAS) di Desa Wonotoro pada layer 'Sungai'. Aktifkan layer tersebut di Dashboard untuk melihat seluruh segmen sungai secara interaktif beserta atribut tipe, kelas, dan DAS-nya."),

    # ── Ekstensi baru (dari 18_faq.md, 11_fitur_produk.md, 20_layer_dan_metadata.md) ──

    (('feedback', 'masukan', 'saran', 'kritik', 'tanpa login'),
     "Feedback Publik memungkinkan siapa saja — termasuk yang belum login — mengirim masukan, saran, atau kritik satu arah melalui formulir di landing page AQUAVISION. Berbeda dengan Hubungi Admin yang dua arah dan memerlukan login, Feedback tidak menghasilkan balasan langsung dari admin."),

    (('pengukuran jarak', 'ukur jarak', 'jarak dua titik', 'jarak kilometer'),
     "Fitur Pengukuran Jarak memungkinkan Anda memperkirakan jarak antara dua lokasi di peta, misalnya jarak sumber air ke permukiman untuk estimasi panjang pipa yang dibutuhkan. Klik dua titik di peta dan sistem akan menampilkan jaraknya dalam meter dan kilometer, atau masukkan koordinat secara manual."),

    (('das', 'catchment area', 'tangkapan air', 'luas das'),
     "DAS (Daerah Aliran Sungai) adalah wilayah yang menampung air hujan dan mengalirkannya ke satu titik outlet, ditentukan oleh topografi — bukan batas administratif desa. DAS yang dianalisis AQUAVISION untuk perhitungan Debit Puncak Aliran memiliki luas 289,164 km², berbeda dari luas administratif Desa Wonotoro."),

    (('browser', 'kompatibel', 'chrome', 'firefox', 'safari', 'edge'),
     "AQUAVISION dapat diakses melalui browser Chrome 90+, Firefox 88+, Edge 90+, atau Safari 14+, baik di desktop maupun smartphone, selama tersedia koneksi internet."),

    (('hak akses', 'bedanya user dan admin', 'peran pengguna', 'super admin'),
     "AQUAVISION memiliki tiga level pengguna: (1) User — akses peta, analisis, data portal umum, dan Hubungi Admin; (2) Admin — semua akses User ditambah kelola data (tambah/ubah/hapus), akses dataset sensitif, dan membalas pesan pengguna; (3) Super Admin — akses penuh termasuk Panel Admin Django dan kelola user/grup."),

    (('ahp', 'metode ahp', 'analytical hierarchy process', 'pairwise comparison', 'bobot parameter gwp'),
     "AHP (Analytical Hierarchy Process) adalah metode pengambilan keputusan berbasis perbandingan berpasangan antarkriteria. Dalam AQUAVISION, AHP memberikan bobot pada 7 parameter penentu potensi air tanah: curah hujan (40%), geologi (23%), kepadatan kelurusan (13%), tutupan lahan (10%), kelerengan (7%), kerapatan drainase (4%), dan jenis tanah (3%)."),

    (('rumus debit puncak', 'formula debit', 'qp = 0.278'),
     "Debit puncak dihitung dengan Metode Rasional: Qp = 0,278 × C × I × A, di mana C = koefisien limpasan (dari SCS-CN), I = intensitas hujan (mm/jam), dan A = luas DAS (km²). Koefisien limpasan C diperoleh dari perhitungan SCS-CN berdasarkan jenis tanah dan tutupan lahan."),

    (('kelas sangat tinggi', 'kelas tinggi gwp', 'persentase potensi air tanah', 'luas zona potensi'),
     "Hasil pemodelan Potensi Air Tanah AQUAVISION (DaerahResapan.geojson): Rendah 12,4% (~43,2 km²), Sedang 43,5% (~151,6 km²) — kelas dominan, Tinggi 33,4% (~116,5 km²), dan Sangat Tinggi 10,6% (~37,0 km²). Sekitar 44% wilayah studi berada pada kelas Tinggi atau Sangat Tinggi."),

    (('debit tertinggi', 'debit terendah', 'musim hujan debit', 'musim kemarau debit'),
     "Debit puncak tertinggi terjadi Februari (rata-rata 14,942 m³/s), diikuti Januari (14,477 m³/s) dan Desember (13,595 m³/s) — periode puncak musim hujan. Debit terendah terjadi September (0,138 m³/s) dan Agustus (0,143 m³/s) — puncak musim kemarau."),

    (('sistem koordinat', 'epsg', 'utm zone', 'wgs84', 'wgs 84'),
     "AQUAVISION menggunakan WGS 84 (EPSG:4326) untuk penyimpanan dan pertukaran data spasial, serta UTM Zone 49S untuk analisis yang membutuhkan satuan meter (seperti perhitungan jarak dan luas)."),

    (('siapa membuat', 'pengembang aquavision', 'tim aquavision', 'mahasiswa itb'),
     "AQUAVISION dikembangkan oleh tiga mahasiswa Teknik Geodesi dan Geomatika ITB (Institut Teknologi Bandung): Najwa Maharani, Rayhan Fadhil Muhamad, dan Muhammad Radja Adzka, sebagai Tugas Akhir Capstone tahun 2026."),

    (('kenapa aquavision dibuat', 'tujuan aquavision', 'latar belakang aquavision', 'kebakaran bromo'),
     "AQUAVISION dibuat untuk menjawab masalah krisis air bersih Desa Wonotoro: lokasi sumber air yang sulit diakses, jaringan pipa tidak terstruktur (sempat tertelusur manual belasan kilometer pasca kebakaran Bromo 2023), penurunan debit saat kemarau, dan data sumber daya air yang tersebar tidak terintegrasi."),

    (('legenda', 'arti warna peta', 'arti warna layer', 'simbol peta'),
     "Setiap layer memiliki legenda warna berbeda. Aktifkan layer yang diinginkan, lalu lihat panel legenda di peta. Misalnya pada layer Potensi Air Tanah: merah = Rendah, oranye = Sedang, kuning = Tinggi, hijau = Sangat Tinggi."),

    (('basemap', 'citra satelit', 'peta dasar', 'topografi', 'ganti tampilan peta'),
     "AQUAVISION menyediakan tiga pilihan basemap (peta dasar): OpenStreetMap (peta jalan standar), Citra Satelit ESRI (foto udara), dan Topografi ESRI (kontur ketinggian). Pilih basemap melalui selector di pojok kanan peta pada Dashboard."),

    (('cari lokasi', 'fitur pencarian', 'cari dataset'),
     "Gunakan kolom pencarian di Data Portal untuk menemukan dataset, sumber air, dusun, atau fasilitas tertentu secara cepat tanpa perlu menelusuri seluruh peta atau daftar data."),

    (('ai assistant', 'asisten ai', 'apakah ai bisa jawab semua', 'batas kemampuan ai', 'ai assistant bisa apa'),
     "Pusat Bantuan AQUAVISION menjawab pertanyaan seputar fitur, data, dan informasi sumber daya air Desa Wonotoro berdasarkan basis pengetahuan sistem. Untuk pertanyaan di luar topik ini, laporan bug, masalah akun, atau permintaan data spesifik, sistem akan menawarkan untuk meneruskan pertanyaan Anda ke Admin."),

    (('cara menghubungi admin', 'menghubungi admin', 'kontak admin'),
     "Untuk menghubungi Admin AQUAVISION: login ke akun Anda, lalu klik menu 'Hubungi Admin'. Tulis pesan Anda — AI akan mencoba menjawab dahulu, dan jika diperlukan, pesan akan diteruskan ke Admin (lengkap dengan nomor tiket dan estimasi waktu respons)."),

    (('cara logout', 'keluar dari akun', 'sign out'),
     "Untuk logout, klik menu profil/akun Anda di pojok kanan atas navbar, lalu pilih 'Logout' atau 'Keluar'."),

    (('upload data', 'admin input data', 'upload shapefile'),
     "Penambahan atau pembaruan data (termasuk upload Shapefile) hanya dapat dilakukan oleh Admin melalui panel pengelolaan data. Pengguna biasa dapat mengajukan permintaan penambahan/perbaikan data melalui menu Hubungi Admin."),

    (('akurasi data', 'data aquavision akurat', 'kapan data diperbarui'),
     "Data Debit Puncak Aliran adalah estimasi klimatologis berdasarkan rata-rata curah hujan 1996–2025, bukan pengukuran debit aktual harian — gunakan untuk memahami pola musiman, bukan kondisi sungai hari ini. Data lain (sumber air, infrastruktur) berasal dari pendataan lapangan dan diperbarui berkala oleh Admin."),

    (('kelayakan aquavision', 'bcr aquavision', 'npv aquavision', 'roi aquavision'),
     "Berdasarkan analisis kelayakan finansial, AQUAVISION sangat layak secara ekonomi: BCR = 5,19 (>1 berarti layak), NPV = Rp 320,6 juta (positif berarti menguntungkan), ROI = 485,79% dalam 5 tahun."),
]


# ================================================================
# 4b) DISAMBIGUASI KRITIS — dijalankan SEBELUM FAQ scoring
# ================================================================
# Sumber: 24_entity_relationships.md, 25_konteks_dan_disambiguasi.md, dan
# kasus berlabel "KASUS KRITIS" (A07, A08) di 26_contoh_percakapan.md.
# "wonotoro" sering muncul sebagai KONTEKS (pembatas wilayah), bukan TOPIK
# UTAMA pertanyaan. Tanpa pre-check ini, FAQ scoring biasa akan menangkap
# kata "wonotoro" (ada di entri lokasi desa) dan salah menjawab info lokasi
# generik untuk pertanyaan yang sebenarnya tentang topik lain. Audit 109
# pertanyaan membuktikan ini terjadi tepat seperti yang diperingatkan di
# dokumentasi sumber, untuk dua kasus berikut.
CRITICAL_DISAMBIGUATION = (
    (('air tanah wonotoro', 'wonotoro air tanah', 'gwp wonotoro', 'wonotoro gwp'),
     "Berdasarkan pemodelan Groundwater Potential (GWP) AQUAVISION, potensi air tanah Desa Wonotoro didominasi kelas Sedang (43,5% wilayah), diikuti Tinggi (33,4%), Rendah (12,4%), dan Sangat Tinggi (10,6%) — sekitar 44% wilayah studi berkategori Tinggi atau Sangat Tinggi. Lihat layer 'Potensi Air Tanah' di peta untuk detail persebaran zonanya."),

    (('hotel wonotoro', 'wonotoro hotel'),
     "Informasi hotel dan penginapan di Wonotoro tersedia melalui layer 'Hotel/Akomodasi' di AQUAVISION — menampilkan lokasi, jumlah kamar, kapasitas, dan kebutuhan air harian setiap fasilitas. Aktifkan layer tersebut di panel layer control Dashboard."),
)


def check_critical_disambiguation(msg_lower):
    """Cek pola pertanyaan yang didokumentasikan sebagai 'KASUS KRITIS', di
    mana 'wonotoro' adalah KONTEKS bukan TOPIK UTAMA, sehingga TIDAK boleh
    dijawab dengan info lokasi desa generik. Dipanggil sebelum FAQ scoring."""
    for keywords, answer in CRITICAL_DISAMBIGUATION:
        if any(kw in msg_lower for kw in keywords):
            return answer
    return None


# ================================================================
# 4c) FAQ SCORING ENGINE
# ================================================================
# Aturan LAMA ("butuh >=2 keyword cocok jika pertanyaan >5 kata") terbukti
# salah arah lewat audit 109 pertanyaan: confidence seharusnya bergantung
# pada SPESIFISITAS keyword yang cocok, bukan pada panjang KALIMAT
# pertanyaan — dua hal yang tidak berhubungan.
#
# Percobaan pertama mengganti "panjang kalimat" dengan "jumlah kata pada
# keyword" (>=2 kata = percaya diri) JUGA SALAH ARAH: kata jumlah bukan
# proxy yang valid untuk "spesifik". Frasa 2-kata seperti "apa itu" atau
# "cara menggunakan" hanyalah BENTUK pertanyaan (muncul di hampir semua
# pertanyaan apapun topiknya), sementara kata 1-kata seperti "simulasi",
# "browser", "das" sudah sangat spesifik untuk domain AQUAVISION walau
# pendek. Audit ulang membuktikan ini: ambang ">=2 kata" membuat entri
# catch-all membajak lagi semua pertanyaan "Apa itu X?" (lewat keyword
# "apa itu" yang kebetulan 2 kata), padahal seharusnya "X"-nya yang dicek.
#
# Aturan final: confidence TIDAK dihitung dari jumlah kata sama sekali,
# melainkan dari KURASI eksplisit — apakah keyword yang cocok termasuk
# GENERIC_KEYWORDS (bentuk pertanyaan umum, atau kata umum yang juga lazim
# dipakai di luar topik AQUAVISION). Keyword apapun di LUAR daftar itu
# (apapun panjangnya) dianggap cukup spesifik untuk berdiri sendiri; kalau
# SEMUA keyword yang cocok ada di GENERIC_KEYWORDS, baru dibutuhkan >=2
# keyword (korroborasi) sebelum dianggap percaya diri.
GENERIC_KEYWORDS = frozenset({
    # Keyword milik entri catch-all sendiri — lihat GENERIC_FALLBACK_ENTRY
    'aquavision', 'apa itu', 'tentang', 'platform', 'sistem',
    # Bentuk pertanyaan umum (menjelaskan CARA bertanya, bukan topik apa)
    'itu apa', 'cara menggunakan', 'bagaimana cara', 'cara buka',
    'cara akses', 'bagaimana masuk', 'cara mulai', 'mulai dari mana',
    'onboarding', 'tutorial', 'petunjuk', 'panduan', 'bantuan', 'faq',
    # Kata umum yang juga lazim dipakai di luar topik AQUAVISION, atau yang
    # muncul di hampir semua pertanyaan spasial apapun topiknya ("peta")
    # sehingga gampang membajak entri lain saat ikut campur lewat tie-break
    'login', 'daftar', 'register', 'password', 'username', 'tour',
    'hotel', 'fasilitas', 'kompatibel', 'peta',
    # "wonotoro" & sejenisnya sering jadi KONTEKS bukan TOPIK (lihat
    # CRITICAL_DISAMBIGUATION) — jangan biarkan berdiri sendiri di sini
    'wonotoro', 'desa', 'lokasi', 'bromo', 'probolinggo', 'sukapura',
})


def _faq_match_score(keywords, msg_lower):
    matched = [kw for kw in keywords if kw in msg_lower]
    if not matched:
        return None
    score = len(matched)
    weight = sum(len(kw) for kw in matched)
    has_specific_match = any(kw not in GENERIC_KEYWORDS for kw in matched)
    confident = has_specific_match or score >= 2
    return confident, score, weight


def match_faq(msg_lower, entries):
    """Cari entri FAQ dengan keyword paling cocok & paling spesifik di
    antara `entries`. Hanya mengembalikan entri yang lolos confidence check
    (lihat _faq_match_score) — entri yang cocok tapi tidak percaya diri
    diabaikan sepenuhnya (tidak ikut tie-break), bukan sekadar diberi skor
    rendah. Mengembalikan jawaban (str) atau None."""
    best = None  # (score, weight, answer)
    for keywords, answer in entries:
        result = _faq_match_score(keywords, msg_lower)
        if result is None:
            continue
        confident, score, weight = result
        if not confident:
            continue
        if best is None or (score, weight) > (best[0], best[1]):
            best = (score, weight, answer)
    return best[2] if best else None


# ================================================================
# 5) CLASSIFIER — Kategori B (wajib eskalasi, skip FAQ/Gemini)
# ================================================================
# Kategori A (AI jawab langsung) dan Kategori C (AI tidak yakin) TIDAK
# diklasifikasi di sini secara terpisah — keduanya adalah hasil natural
# dari proses matching di _ai_respond(): cocok di Tier 1/2 = Kategori A,
# tidak cocok sama sekali = Kategori C (jatuh ke _AI_UNSURE_TEXT yang sudah
# ada). Hanya Kategori B yang perlu dideteksi LEBIH DULU, karena pesan
# berisi laporan bug/data error/masalah akun TIDAK BOLEH dijawab oleh FAQ
# yang kebetulan cocok sebagian — pesan semacam itu harus selalu diarahkan
# ke jalur eskalasi (konfirmasi Ya/Tidak) yang sudah berjalan.
CATEGORY_B_KEYWORDS = (
    'bug', 'error sistem', 'tidak berfungsi', 'tidak bisa dibuka', 'gagal upload',
    'gagal diunggah', 'rusak', 'crash', 'macet total',
    'data salah', 'data keliru', 'data tidak akurat', 'data tidak sesuai',
    'salah input data', 'minta tambah data', 'minta update data', 'minta perbarui data',
    'tolong perbaiki data',
    'akun saya diblokir', 'akun saya bermasalah', 'akun saya error', 'tidak bisa masuk akun',
    'ingin bicara admin', 'ingin bicara dengan admin', 'mau bicara dengan admin',
    'sambungkan ke admin', 'sambungkan saya', 'hubungkan saya ke admin',
    'komplain', 'keluhan', 'laporkan masalah', 'lapor masalah', 'laporkan bug',
    'input salah', 'saya input',
)


def classify_question(message):
    """Deteksi Kategori B (wajib eskalasi) sebelum pertanyaan diproses lebih lanjut.
    Mengembalikan 'B' jika pesan terindikasi laporan bug/data error/masalah akun/
    permintaan eskalasi langsung; None jika tidak (lanjut ke alur Kategori A/C seperti biasa)."""
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in CATEGORY_B_KEYWORDS):
        return 'B'
    return None


# ================================================================
# 6) DATABASE CONTEXT ENGINE (Tahap 5 — fondasi untuk Gemini di Tahap 9)
# ================================================================
# Belum dipanggil dari alur chat manapun saat ini (Gemini belum dipasang).
# Disediakan sebagai unit terpisah yang sudah bisa diuji & dipakai nanti
# tanpa mengubah _ai_respond()/hubungi_send() yang sudah berjalan.

def get_db_context(water_status=None):
    """Bangun ringkasan kondisi sistem AQUAVISION saat ini dari database —
    tidak ada nilai hardcode, seluruhnya hasil query langsung. `water_status`
    adalah dict hasil _compute_water_status() di views.py (opsional, di-pass
    oleh caller agar modul ini tidak perlu re-import dari views.py)."""
    from .models import (
        SumberAir, Reservoir, JaringanPipa, FasilitasWisata,
        Permukiman, RechargeArea, CatchmentArea,
    )
    context = {
        'jumlah_sumber_air':            SumberAir.objects.count(),
        'jumlah_tandon_air':             Reservoir.objects.count(),
        'jumlah_jaringan_pipa':          JaringanPipa.objects.count(),
        'jumlah_fasilitas_wisata':       FasilitasWisata.objects.count(),
        'jumlah_permukiman':             Permukiman.objects.count(),
        'jumlah_zona_potensi_air_tanah': RechargeArea.objects.count(),
        'jumlah_dataset_debit_puncak':   CatchmentArea.objects.count(),
    }
    if water_status:
        context['status_ketersediaan_air'] = water_status.get('status')
        context['ketersediaan_air_m3']     = water_status.get('ketersediaan_m3')
        context['kebutuhan_air_m3']        = water_status.get('kebutuhan_m3')
        context['pemanfaatan_persen']      = water_status.get('pemanfaatan_persen')
    return context


def format_db_context_text(context):
    """Format dict konteks DB jadi teks ringkas siap disisipkan ke prompt LLM
    (dipakai pada Tahap 9 — Gemini — belum aktif saat ini)."""
    lines = [
        f"- Jumlah sumber air terdaftar: {context.get('jumlah_sumber_air', 0)}",
        f"- Jumlah tandon air: {context.get('jumlah_tandon_air', 0)}",
        f"- Jumlah segmen jaringan pipa: {context.get('jumlah_jaringan_pipa', 0)}",
        f"- Jumlah fasilitas wisata terdaftar: {context.get('jumlah_fasilitas_wisata', 0)}",
        f"- Jumlah permukiman terdaftar: {context.get('jumlah_permukiman', 0)}",
        f"- Jumlah zona potensi air tanah: {context.get('jumlah_zona_potensi_air_tanah', 0)}",
        f"- Jumlah dataset debit puncak (DAS): {context.get('jumlah_dataset_debit_puncak', 0)}",
    ]
    if 'status_ketersediaan_air' in context:
        lines.append(
            f"- Status ketersediaan air saat ini: {context.get('status_ketersediaan_air')} "
            f"(ketersediaan ≈ {context.get('ketersediaan_air_m3', 0):.0f} m³/hari, "
            f"kebutuhan ≈ {context.get('kebutuhan_air_m3', 0):.0f} m³/hari, "
            f"pemanfaatan {context.get('pemanfaatan_persen', 0)}%)"
        )
    return "\n".join(lines)
