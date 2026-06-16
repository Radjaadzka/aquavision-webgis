# 23 – INTENT DAN ROUTING

*File ini digunakan AI Assistant untuk mengenali maksud (intent) pengguna dan memilih sumber pengetahuan yang tepat sebelum menjawab. AI wajib mengidentifikasi intent terlebih dahulu, bukan langsung menjawab berdasarkan keyword pertama yang ditemukan.*

---

## CARA MEMBACA FILE INI

Setiap intent memiliki:
- **Deskripsi** – penjelasan maksud pengguna
- **Sinyal Kata Kunci** – kata/frasa yang menunjukkan intent ini
- **Entitas Pendukung** – konteks tambahan yang sering muncul bersama
- **Sumber Jawaban** – file/bagian knowledge base yang harus dibuka
- **Contoh Pertanyaan** – variasi nyata yang sering ditemui

---

## ATURAN DASAR ROUTING

```
URUTAN IDENTIFIKASI (WAJIB DIIKUTI):
1. Identifikasi TOPIK UTAMA (apa yang ditanyakan)
2. Identifikasi ENTITAS (siapa/apa yang menjadi konteks)
3. Identifikasi AKSI (apa yang ingin dilakukan pengguna)
4. Baru route ke sumber jawaban yang tepat

JANGAN:
× Langsung route berdasarkan kata pertama
× Menganggap "Wonotoro" = selalu informasi lokasi
× Menganggap "air" = selalu potensi air tanah
× Mengabaikan kata sebelum/sesudah entitas wilayah
```

---

## DAFTAR INTENT

---

### INTENT 01 – LOKASI WILAYAH

**Deskripsi:** Pengguna ingin tahu letak geografis/administratif Desa Wonotoro.

**Sinyal Kata Kunci:**
- dimana, letak, lokasi, alamat, posisi, ada di mana, terletak
- (tanpa topik spesifik lain)

**Pola Kritis:**
- "dimana wonotoro" → LOKASI
- "wonotoro di mana" → LOKASI
- "letak desa wonotoro" → LOKASI
- "wonotoro itu dimana" → LOKASI

**Pola yang BUKAN LOKASI (ada topik utama lain):**
- "air tanah wonotoro" → INTENT 02 (Potensi Air Tanah)
- "hotel wonotoro" → INTENT 10 (Pariwisata)
- "debit puncak wonotoro" → INTENT 03 (Debit Puncak)

**Sumber Jawaban:** `01_ringkasan_proyek.md` → Wilayah Studi

**Jawaban Inti:**
> Desa Wonotoro terletak di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Merupakan desa penyangga kawasan wisata internasional Gunung Bromo, berada di kawasan pegunungan sekitar Taman Nasional Bromo Tengger Semeru.

---

### INTENT 02 – POTENSI AIR TANAH

**Deskripsi:** Pengguna ingin tahu kondisi, peta, atau zona potensi air tanah.

**Sinyal Kata Kunci:**
- air tanah, airtanah, groundwater, gwp, gwpz
- potensi air, zona air tanah, resapan air
- kondisi air tanah, kualitas air tanah, air bawah tanah

**Entitas Pendukung:** wonotoro, desa, wilayah, peta, zona, kelas

**Contoh Pertanyaan:**
- "air tanah wonotoro" → Topik: air tanah | Konteks: wonotoro
- "potensi airtanah desa wonotoro"
- "dimana zona air tanah paling bagus"
- "groundwater potential wonotoro"
- "peta gwp"
- "air tanah paling tinggi dimana"
- "daerah resapan air di wonotoro"

**Sumber Jawaban:**
- `08_pemodelan_potensi_air_tanah.md` – detail metodologi & hasil
- `20_layer_dan_metadata.md` → section Potensi Air Tanah

**Jawaban Inti:**
> 43% wilayah studi berpotensi Tinggi (High), 17% Sangat Tinggi (Very High), 29% Sedang (Moderate), 11% Rendah (Low). Zona Very High umumnya berada di area batuan vulkanik berpori tinggi dengan curah hujan lebat.

---

### INTENT 03 – DEBIT PUNCAK ALIRAN

**Deskripsi:** Pengguna ingin tahu besaran, pola, atau peta debit puncak aliran.

**Sinyal Kata Kunci:**
- debit puncak, debet puncak (typo), debit aliran, debit banjir
- peak flow, puncak aliran, debit sungai, limpasan
- banjir, aliran permukaan, debit bulanan, debit tertinggi

**Entitas Pendukung:** bulan, musim, hujan, kemarau, DAS, m³/s

**Contoh Pertanyaan:**
- "debit puncak wonotoro"
- "debet puncak dimana?" (typo)
- "bulan apa debit paling tinggi"
- "peta debit puncak"
- "limpasan permukaan wonotoro"
- "kapan debit tertinggi"
- "debit aliran bulan februari"

**Sumber Jawaban:**
- `09_pemodelan_debit_puncak.md` – detail metodologi & hasil
- `20_layer_dan_metadata.md` → section Debit Puncak Aliran

**Jawaban Inti:**
> Debit tertinggi terjadi bulan Februari (rata-rata 14,942 m³/s; maks 40,828 m³/s). Debit terendah terjadi bulan September (rata-rata 0,138 m³/s). Pola ini mengikuti musim hujan dan kemarau di wilayah Jawa Timur.

---

### INTENT 04 – SUMBER AIR

**Deskripsi:** Pengguna ingin mengetahui lokasi, kondisi, atau debit sumber air (mata air).

**Sinyal Kata Kunci:**
- sumber air, mata air, spring, air bersih
- mata air wonotoro, sumber air desa, lokasi air

**Entitas Pendukung:** lokasi, peta, debit (L/dtk), kondisi, nama sumber

**Contoh Pertanyaan:**
- "dimana sumber air wonotoro"
- "mata air di wonotoro ada berapa"
- "lokasi mata air desa"
- "sumber air aktif wonotoro"
- "peta sumber air"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Sumber Air
- `10_implementasi_webgis.md` → Neraca Air

---

### INTENT 05 – TANDON AIR

**Deskripsi:** Pengguna ingin tahu lokasi, kapasitas, atau kondisi tandon/reservoir air.

**Sinyal Kata Kunci:**
- tandon air, tangki air, bak air, reservoir, penampungan air
- water tank, bak penampung, tandon

**Entitas Pendukung:** kapasitas, m3, elevasi, lokasi

**Contoh Pertanyaan:**
- "tandon air wonotoro dimana"
- "berapa kapasitas tandon"
- "peta tangki air"
- "tandon ada di mana aja"
- "penampungan air desa"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Tandon Air

---

### INTENT 06 – JARINGAN PIPA

**Deskripsi:** Pengguna ingin tahu tentang jaringan distribusi pipa air.

**Sinyal Kata Kunci:**
- pipa, jaringan pipa, pipa air, distribusi air
- jaringan distribusi, saluran pipa, pipa distribusi

**Entitas Pendukung:** diameter, kondisi, lokasi, jalur

**Contoh Pertanyaan:**
- "peta pipa air wonotoro"
- "jaringan pipa dimana"
- "distribusi air pipa"
- "kondisi pipa desa"
- "pipa air wonotoro"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Jaringan Pipa

---

### INTENT 07 – DAERAH ALIRAN SUNGAI (DAS)

**Deskripsi:** Pengguna ingin tahu tentang DAS, batas tangkapan air, atau watershed.

**Sinyal Kata Kunci:**
- DAS, watershed, daerah aliran sungai, catchment
- daerah aliran, tangkapan air, wilayah aliran

**Entitas Pendukung:** luas, km², batas, outlet, hulu, hilir

**Contoh Pertanyaan:**
- "das itu apa?"
- "berapa luas DAS wonotoro"
- "watershed wonotoro"
- "daerah aliran sungai wonotoro"
- "batas DAS dimana"
- "das di peta"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section DAS
- `09_pemodelan_debit_puncak.md` → Wilayah Analisis DAS

**Jawaban Inti:**
> Luas DAS dalam wilayah studi: 289,164 km². Batas DAS mengikuti batas alami daerah tangkapan air, bukan batas administrasi desa.

---

### INTENT 08 – NERACA AIR / KETERSEDIAAN AIR

**Deskripsi:** Pengguna ingin tahu status ketersediaan vs kebutuhan air, atau apakah air cukup.

**Sinyal Kata Kunci:**
- neraca air, ketersediaan air, water balance
- status air, air cukup, kecukupan air
- supply demand, kebutuhan air, aman waspada kritis
- air kurang, krisis air, kekurangan air

**Pola Kritis:**
- "air cukup ga buat warga?" → INTENT 08 (Neraca Air)
- "apakah air wonotoro cukup" → INTENT 08
- "status ketersediaan air" → INTENT 08

**Entitas Pendukung:** warga, penduduk, wisatawan, hotel, musim

**Contoh Pertanyaan:**
- "air cukup ga buat warga"
- "ketersediaan air wonotoro cukup nggak"
- "status neraca air"
- "air kritis ga"
- "supply vs demand air wonotoro"
- "apakah air wonotoro aman"

**Sumber Jawaban:**
- `10_implementasi_webgis.md` → Neraca Air
- `11_fitur_produk.md` → Simulasi Ketersediaan Air

**Jawaban Inti:**
> Status neraca air ditampilkan dengan tiga kategori: Aman (<50% kapasitas terpakai), Waspada (50–80%), Kritis (>80%). Gunakan fitur Simulasi untuk melihat proyeksi berdasarkan skenario pengguna.

---

### INTENT 09 – SIMULASI

**Deskripsi:** Pengguna ingin menjalankan simulasi ketersediaan air berdasarkan skenario tertentu.

**Sinyal Kata Kunci:**
- simulasi, proyeksi, prediksi air, skenario
- bagaimana jika, kalau ditambah, jika ada hotel baru
- simulasi air, hitung kebutuhan, estimasi air

**Entitas Pendukung:** jumlah wisatawan, jumlah kamar, penduduk baru, bulan

**Contoh Pertanyaan:**
- "bagaimana kalau wisatawan bertambah"
- "simulasi kalau ada 5 hotel baru"
- "prediksi kebutuhan air tahun depan"
- "jika penduduk bertambah air cukup ga"
- "cara simulasi di aquavision"
- "hitung kebutuhan air untuk 1000 wisatawan"

**Sumber Jawaban:**
- `11_fitur_produk.md` → Simulasi Ketersediaan Air
- `10_implementasi_webgis.md` → Simulasi

---

### INTENT 10 – PARIWISATA / FASILITAS WISATA

**Deskripsi:** Pengguna ingin tahu tentang hotel, tempat makan, atau jasa di Wonotoro.

**Sinyal Kata Kunci:**
- hotel, penginapan, homestay, akomodasi
- tempat makan, restoran, rumah makan, warung
- jasa, toko, fasilitas wisata, wisata wonotoro

**Entitas Pendukung:** wonotoro, desa, lokasi, peta

**Contoh Pertanyaan:**
- "hotel wonotoro"
- "penginapan di wonotoro"
- "tempat makan dekat wonotoro"
- "homestay wonotoro"
- "ada restoran nggak"
- "jasa wisata wonotoro"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Hotel, Tempat Makan, Jasa

---

### INTENT 11 – PERMUKIMAN / PENDUDUK

**Deskripsi:** Pengguna ingin tahu tentang dusun, permukiman, atau data kependudukan.

**Sinyal Kata Kunci:**
- permukiman, dusun, warga, penduduk, kampung
- jumlah penduduk, pemukiman, rumah warga

**Entitas Pendukung:** jumlah, nama dusun, kebutuhan air

**Contoh Pertanyaan:**
- "peta permukiman wonotoro"
- "ada berapa dusun di wonotoro"
- "jumlah penduduk wonotoro"
- "warga wonotoro berapa"
- "dusun mana saja"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Permukiman

---

### INTENT 12 – METODOLOGI / CARA KERJA

**Deskripsi:** Pengguna ingin tahu bagaimana sistem menghitung/menganalisis data.

**Sinyal Kata Kunci:**
- bagaimana cara hitung, metode, metodologi
- AHP, SCS-CN, metode rasional, cara kerja
- rumus, perhitungan, analisis, parameter

**Contoh Pertanyaan:**
- "bagaimana cara menghitung potensi air tanah"
- "metode yang digunakan AQUAVISION apa"
- "AHP itu apa"
- "SCS-CN cara kerjanya gimana"
- "parameter apa yang dipakai"
- "metode rasional itu apa"

**Sumber Jawaban:**
- `21_metodologi_ringkas.md`
- `08_pemodelan_potensi_air_tanah.md`
- `09_pemodelan_debit_puncak.md`

---

### INTENT 13 – DOWNLOAD / EXPORT DATA

**Deskripsi:** Pengguna ingin mengunduh atau mengekspor data dari sistem.

**Sinyal Kata Kunci:**
- download, unduh, ekspor, export, simpan data
- ambil data, format data, csv, geojson, shapefile, kml

**Contoh Pertanyaan:**
- "cara download data"
- "bisa export ke shapefile ga"
- "unduh data layer"
- "minta data csv"
- "download peta air tanah"
- "data tersedia dalam format apa"

**Sumber Jawaban:**
- `11_fitur_produk.md` → Data Portal, Export

---

### INTENT 14 – CARA PENGGUNAAN SISTEM

**Deskripsi:** Pengguna ingin tahu cara menggunakan fitur tertentu di AQUAVISION.

**Sinyal Kata Kunci:**
- cara, bagaimana, gimana, how to, panduan
- cara pakai, cara buka, cara aktifkan, tutorial
- langkah, petunjuk, instruksi

**Entitas Pendukung:** nama fitur (peta, layer, simulasi, download, dll.)

**Contoh Pertanyaan:**
- "cara aktifkan layer peta"
- "gimana cara pakai simulasi"
- "langkah download data"
- "cara login AQUAVISION"
- "gimana cara ukur jarak di peta"

**Sumber Jawaban:**
- `11_fitur_produk.md` → Cara Penggunaan per fitur
- `18_faq.md`

---

### INTENT 15 – TENTANG AQUAVISION / SISTEM

**Deskripsi:** Pengguna ingin tahu apa itu AQUAVISION, siapa yang buat, tujuannya apa.

**Sinyal Kata Kunci:**
- aquavision itu apa, apa itu aquavision
- sistem ini apa, webgis ini buat apa
- siapa yang buat, dibuat oleh siapa, tujuan sistem

**Contoh Pertanyaan:**
- "aquavision itu apa?"
- "sistem ini untuk apa?"
- "AQUAVISION dibuat oleh siapa?"
- "webgis ini buat apa"
- "tujuan aquavision"
- "ini sistem apa"

**Sumber Jawaban:**
- `01_ringkasan_proyek.md`
- `04_solusi_dan_pemilihan_produk.md`

---

### INTENT 16 – AKUN & AKSES

**Deskripsi:** Pengguna ingin tahu cara daftar, login, atau hak akses ke sistem.

**Sinyal Kata Kunci:**
- login, daftar, akun, registrasi, masuk
- buat akun, hak akses, role, siapa bisa akses
- password, username, pengguna

**Contoh Pertanyaan:**
- "cara login AQUAVISION"
- "bisa daftar akun sendiri?"
- "siapa yang bisa akses peta"
- "hak akses admin"
- "login gagal gimana"

**Sumber Jawaban:**
- `18_faq.md` → Akun dan Akses
- `05_spesifikasi_dan_standar.md` → Hak Akses

---

### INTENT 17 – ADMINISTRASI DESA / BATAS WILAYAH

**Deskripsi:** Pengguna ingin tahu batas wilayah administratif desa.

**Sinyal Kata Kunci:**
- batas desa, batas wilayah, administrasi desa
- peta administrasi, batas kecamatan, batas kabupaten
- wilayah administrasi, peta batas

**Contoh Pertanyaan:**
- "peta batas desa wonotoro"
- "batas administrasi wonotoro"
- "wilayah wonotoro mencakup mana aja"
- "layer administrasi"

**Sumber Jawaban:**
- `20_layer_dan_metadata.md` → section Administrasi Desa

---

### INTENT 18 – PENGUKURAN JARAK

**Deskripsi:** Pengguna ingin mengukur jarak antar titik di peta.

**Sinyal Kata Kunci:**
- ukur jarak, jarak, berapa jauh, pengukuran
- jarak pipa, jarak sumber air, berapa meter

**Contoh Pertanyaan:**
- "cara ukur jarak di peta"
- "jarak dari sumber air ke tandon berapa"
- "fitur pengukuran jarak"
- "ukur panjang pipa"

**Sumber Jawaban:**
- `11_fitur_produk.md` → Pengukuran Jarak
- `18_faq.md` → Pengukuran Jarak

---

### INTENT 19 – AI ASSISTANT

**Deskripsi:** Pengguna ingin tahu tentang fitur AI Assistant dalam AQUAVISION atau cara menggunakannya.

**Sinyal Kata Kunci:**
- ai assistant, asisten, chatbot, tanya ai
- chat dengan ai, fitur ai, pertanyaan ke ai
- cara tanya, ai bisa apa

**Contoh Pertanyaan:**
- "ai assistant bisa apa?"
- "cara pakai fitur chat"
- "tanya ai soal air tanah"
- "fitur ai assistant aquavision"

**Sumber Jawaban:**
- `11_fitur_produk.md` → AI Assistant

---

### INTENT 20 – ANALISIS FINANSIAL / KELAYAKAN

**Deskripsi:** Pengguna ingin tahu tentang biaya, manfaat finansial, atau kelayakan proyek.

**Sinyal Kata Kunci:**
- biaya, investasi, bcr, npv, roi, capex
- kelayakan, cost benefit, manfaat finansial
- berapa harga, berapa biaya

**Contoh Pertanyaan:**
- "berapa biaya membangun AQUAVISION"
- "BCR AQUAVISION berapa"
- "ROI sistem ini"
- "layak tidak sistem ini"
- "NPV proyek"

**Sumber Jawaban:**
- `13_analisis_finansial.md`

---

### INTENT 21 – PENGUJIAN / KUALITAS SISTEM

**Deskripsi:** Pengguna ingin tahu tentang pengujian, kualitas, atau performa sistem.

**Sinyal Kata Kunci:**
- pengujian, testing, uji, kualitas, performa
- ISO 25010, UAT, uat, hasil tes, kompatibilitas

**Sumber Jawaban:**
- `12_pengujian_produk.md`

---

### INTENT 22 – SUMBER DATA / REFERENSI

**Deskripsi:** Pengguna ingin tahu data apa yang digunakan dalam sistem.

**Sinyal Kata Kunci:**
- sumber data, data dari mana, referensi data
- big, bmkg, esdm, chirps, dem, demnas
- data lapangan, survei, satelit

**Sumber Jawaban:**
- `19_sumber_data.md`
- `08_pemodelan_potensi_air_tanah.md` → Sumber Data
- `09_pemodelan_debit_puncak.md` → Sumber Data

---

### INTENT 23 – KETERBATASAN SISTEM

**Deskripsi:** Pengguna ingin tahu keterbatasan atau kekurangan sistem.

**Sinyal Kata Kunci:**
- keterbatasan, kekurangan, belum bisa, tidak tersedia
- limitasi, apa yang belum ada, fitur yang kurang

**Sumber Jawaban:**
- `14_keterbatasan_dan_saran.md`

---

### INTENT 24 – KONTAK / HUBUNGI ADMIN

**Deskripsi:** Pengguna ingin menghubungi admin atau melaporkan masalah.

**Sinyal Kata Kunci:**
- hubungi admin, kontak, lapor masalah, feedback
- ada yang rusak, fitur tidak bekerja, error, bug

**Sumber Jawaban:**
- `11_fitur_produk.md` → Hubungi Admin
- `18_faq.md` → Hubungi Admin & Feedback

---

## TABEL RINGKASAN ROUTING CEPAT

| Intent | Kata Kunci Utama | Route ke File |
|--------|-----------------|---------------|
| 01 – Lokasi | dimana, letak, lokasi (tanpa topik lain) | 01_ringkasan |
| 02 – Air Tanah | air tanah, groundwater, gwp, resapan | 08_pemodelan_gwp, 20_layer |
| 03 – Debit Puncak | debit puncak, limpasan, banjir, peak flow | 09_pemodelan_debit, 20_layer |
| 04 – Sumber Air | sumber air, mata air, spring | 20_layer |
| 05 – Tandon | tandon, tangki, reservoir, bak air | 20_layer |
| 06 – Pipa | pipa, jaringan pipa, distribusi air | 20_layer |
| 07 – DAS | DAS, watershed, daerah aliran | 20_layer, 09_pemodelan |
| 08 – Neraca Air | neraca air, cukup ga, aman kritis | 10_implementasi, 11_fitur |
| 09 – Simulasi | simulasi, proyeksi, skenario | 11_fitur, 10_implementasi |
| 10 – Pariwisata | hotel, tempat makan, jasa, homestay | 20_layer |
| 11 – Permukiman | permukiman, dusun, penduduk | 20_layer |
| 12 – Metodologi | metode, AHP, SCS-CN, rumus | 21_metodologi |
| 13 – Download | download, export, csv, shapefile | 11_fitur |
| 14 – Cara Pakai | cara, gimana, tutorial, langkah | 11_fitur, 18_faq |
| 15 – Tentang | apa itu aquavision, tujuan | 01_ringkasan |
| 16 – Akun | login, daftar, akun, hak akses | 18_faq, 05_spesifikasi |
| 17 – Administrasi | batas desa, administrasi | 20_layer |
| 18 – Ukur Jarak | ukur jarak, jarak, berapa jauh | 11_fitur |
| 19 – AI Assistant | ai assistant, chatbot, tanya ai | 11_fitur |
| 20 – Finansial | BCR, NPV, ROI, biaya, kelayakan | 13_finansial |
| 21 – Pengujian | testing, UAT, kualitas | 12_pengujian |
| 22 – Sumber Data | data dari mana, BIG, BMKG | 19_sumber_data |
| 23 – Keterbatasan | keterbatasan, belum bisa | 14_keterbatasan |
| 24 – Kontak | hubungi admin, lapor, feedback | 11_fitur, 18_faq |
