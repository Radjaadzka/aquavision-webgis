# 25 – KONTEKS DAN DISAMBIGUASI

*File ini berisi aturan-aturan yang wajib diikuti AI Assistant untuk menghindari kesalahan routing dan memilih jawaban yang paling tepat berdasarkan konteks pertanyaan. Dibaca bersamaan dengan file 23 (Intent) dan 24 (Entity Relationships).*

---

## PRINSIP UTAMA

```
SEBELUM MENJAWAB, AI WAJIB:

1. SCAN seluruh pertanyaan (jangan berhenti di kata pertama)
2. IDENTIFIKASI topik utama (apa yang ingin diketahui)
3. IDENTIFIKASI konteks/pembatas (wilayah, waktu, kondisi)
4. PILIH sumber jawaban yang tepat
5. BARU susun jawaban

DILARANG:
× Menjawab hanya dari kata pertama / paling dominan
× Menganggap kata wilayah = selalu topik lokasi
× Mengabaikan kata-kata setelah nama tempat
× Memberikan jawaban default tanpa mengecek konteks
```

---

## ATURAN DISAMBIGUASI UTAMA

---

### ATURAN D01: "WONOTORO" BUKAN SELALU LOKASI

**Masalah:**
> Ketika AI melihat kata "Wonotoro", ia cenderung menjawab dengan informasi lokasi/administrasi desa.

**Aturan:**
> Jika pertanyaan mengandung "Wonotoro" BERSAMA kata lain yang merupakan topik, maka Wonotoro berperan sebagai KONTEKS, bukan TOPIK UTAMA.

**Tabel Keputusan:**

| Pertanyaan | Topik Utama | Konteks | Jawaban Yang Benar |
|-----------|-------------|---------|-------------------|
| "dimana wonotoro" | lokasi | — | Info letak desa |
| "wonotoro itu dimana" | lokasi | — | Info letak desa |
| "air tanah wonotoro" | air tanah | wonotoro | Potensi Air Tanah di Wonotoro |
| "debit puncak wonotoro" | debit puncak | wonotoro | Debit Puncak Aliran di Wonotoro |
| "hotel wonotoro" | hotel/wisata | wonotoro | Layer Hotel & Penginapan |
| "das wonotoro" | DAS | wonotoro | Layer DAS & luasnya |
| "sumber air wonotoro" | sumber air | wonotoro | Layer Sumber Air |
| "pipa wonotoro" | jaringan pipa | wonotoro | Layer Jaringan Pipa |
| "warga wonotoro butuh air berapa" | kebutuhan air | wonotoro | Neraca Air & Demand |
| "simulasi air wonotoro" | simulasi | wonotoro | Fitur Simulasi |

---

### ATURAN D02: "AIR" BISA BERMAKNA BANYAK

**Masalah:**
> Kata "air" saja ambigu. Bisa berarti: air tanah, air permukaan, sumber air, ketersediaan air, dll.

**Aturan:**
> Lihat kata-kata sebelum/sesudah "air" untuk menentukan intent yang tepat.

**Tabel Keputusan:**

| Frasa | Maksud | Route ke |
|-------|--------|----------|
| "air tanah" | Potensi Air Tanah (GWP) | 08_pemodelan_gwp |
| "air bersih" | Sumber Air / Infrastruktur | 20_layer → Sumber Air |
| "air cukup" / "air kurang" | Neraca Air / Ketersediaan | 10_implementasi |
| "air wonotoro" (ambigu) | → lihat konteks lebih lanjut | Tanya klarifikasi ATAU jawab ketersediaan air umum |
| "ketersediaan air" | Neraca Air | 10_implementasi, 11_fitur |
| "air permukaan" | Debit Puncak / DAS | 09_pemodelan_debit |
| "air hujan" | Curah hujan / Debit | 09_pemodelan_debit |
| "sumber air" | Layer Sumber Air (mata air) | 20_layer |

---

### ATURAN D03: "DEBIT" BUKAN SELALU DEBIT PUNCAK

**Masalah:**
> Ada dua konteks "debit" yang berbeda: debit sumber air (L/detik) dan debit puncak aliran (m³/s).

**Tabel Keputusan:**

| Frasa | Maksud | Route ke |
|-------|--------|----------|
| "debit puncak" | Debit Puncak Aliran (layer pemodelan) | 09_pemodelan_debit |
| "debit sumber air" | Debit keluaran mata air (L/dtk) | 20_layer → Sumber Air |
| "debit aliran" | Bisa keduanya → cek konteks | Cek apakah ada "sungai" atau "puncak" |
| "debit banjir" | Debit Puncak Aliran | 09_pemodelan_debit |
| "debit air wonotoro" | Ambigu → Route default ke Debit Puncak | 09_pemodelan_debit |

---

### ATURAN D04: PERTANYAAN SINGKAT / TANPA PREDIKAT

**Masalah:**
> Pengguna sering bertanya dengan sangat singkat: "air tanah?", "debit puncak", "peta gwp".

**Aturan:**
> Untuk pertanyaan sangat singkat, anggap pengguna ingin **informasi umum** tentang topik tersebut. Berikan ringkasan singkat dan tawarkan detail lebih lanjut.

**Tabel Keputusan:**

| Pertanyaan Singkat | Interpretasi | Jawaban |
|-------------------|--------------|---------|
| "air tanah?" | Ingin tahu tentang potensi air tanah | Ringkasan GWP + tawaran detail |
| "debit puncak" | Ingin tahu debit puncak | Ringkasan + nilai Februari & September |
| "gwp" | Sama dengan air tanah | Ringkasan GWP |
| "das?" | Ingin tahu tentang DAS | Definisi + luas DAS |
| "simulasi" | Ingin tahu/pakai fitur simulasi | Penjelasan fitur simulasi |
| "layer apa aja" | Ingin tahu daftar layer | Daftar 11 layer |

---

### ATURAN D05: PERTANYAAN DENGAN BULAN / WAKTU

**Masalah:**
> Ketika pengguna menyebut bulan atau musim, biasanya konteksnya adalah debit puncak atau ketersediaan air.

**Tabel Keputusan:**

| Frasa | Topik | Route ke |
|-------|-------|----------|
| "bulan februari air" | Debit Puncak Februari | 09_pemodelan_debit |
| "musim kemarau air" | Debit rendah + Neraca Air | 09_pemodelan_debit + 10_implementasi |
| "musim hujan debit" | Debit Puncak (tinggi) | 09_pemodelan_debit |
| "kapan debit tertinggi" | Debit Puncak bulanan | 09_pemodelan_debit |

---

### ATURAN D06: PERTANYAAN TENTANG "PETA" ATAU "LAYER"

**Masalah:**
> Kata "peta" bisa merujuk ke banyak hal: dashboard umum, layer tertentu, atau sistem secara umum.

**Tabel Keputusan:**

| Pertanyaan | Topik | Route ke |
|-----------|-------|----------|
| "peta air tanah" | Layer GWP | 20_layer → GWP |
| "peta debit puncak" | Layer Debit Puncak | 20_layer → Debit Puncak |
| "buka peta" | Cara pakai dashboard | 11_fitur → Dashboard |
| "layer apa yang tersedia" | Daftar layer | 20_layer |
| "peta wonotoro" | Dashboard/peta umum | 11_fitur → Peta Interaktif |
| "cara aktifkan layer" | Tutorial penggunaan | 11_fitur → Cara Penggunaan |

---

### ATURAN D07: PERTANYAAN "DIMANA" – LOKASI vs LAYER

**Masalah:**
> "Dimana" bisa berarti lokasi geografis ATAU posisi di peta/layer.

**Tabel Keputusan:**

| Pertanyaan | Maksud "Dimana" | Route ke |
|-----------|----------------|----------|
| "dimana wonotoro" | Lokasi geografis desa | Info administratif |
| "dimana sumber air" | Lokasi di peta | Layer Sumber Air |
| "dimana zona very high gwp" | Posisi di layer | 08_pemodelan_gwp → Hasil |
| "dimana tandon air" | Lokasi di peta | Layer Tandon Air |
| "dimana DAS wonotoro" | Batas di peta | Layer DAS |

---

### ATURAN D08: PERTANYAAN TENTANG "KONDISI"

**Masalah:**
> "Kondisi" bisa merujuk ke kondisi infrastruktur, kondisi ketersediaan air, atau kondisi lingkungan.

**Tabel Keputusan:**

| Pertanyaan | Topik | Route ke |
|-----------|-------|----------|
| "kondisi pipa wonotoro" | Kondisi infrastruktur pipa | Layer Jaringan Pipa |
| "kondisi air wonotoro" | Ketersediaan / Neraca Air | Neraca Air |
| "kondisi sumber air" | Status mata air | Layer Sumber Air |
| "kondisi air tanah" | Potensi GWP | 08_pemodelan_gwp |

---

### ATURAN D09: PERTANYAAN TENTANG "CUKUP" / "AMAN" / "KRITIS"

**Aturan:**
> Pertanyaan tentang kecukupan, keamanan, atau krisis air SELALU route ke Neraca Air dan Simulasi.

**Contoh:**

| Pertanyaan | Route ke |
|-----------|----------|
| "air cukup ga buat warga?" | Neraca Air |
| "apakah wonotoro kekurangan air?" | Neraca Air |
| "status air wonotoro aman?" | Neraca Air |
| "air kritis ga?" | Neraca Air |
| "air cukup kalau wisatawan bertambah?" | Simulasi |
| "kalau musim kemarau air habis ga?" | Neraca Air + Debit Puncak |

---

### ATURAN D10: PERTANYAAN AMBIGU TOTAL

**Aturan:**
> Jika pertanyaan terlalu singkat DAN tidak ada kata kunci yang cukup untuk routing, AI boleh:
> 1. Memberikan jawaban terbaik berdasarkan probabilitas intent tertinggi
> 2. Menyertakan kalimat klarifikasi di akhir jawaban

**Contoh Pertanyaan Ambigu:**
- "air wonotoro" → Probabilitas: Neraca Air (40%) | Air Tanah (35%) | Sumber Air (25%)
  - Jawaban: Berikan info ketersediaan air + tawaran detail GWP atau infrastruktur
- "wonotoro" saja → Probabilitas: Info umum (50%) | Lokasi (30%) | AQUAVISION (20%)
  - Jawaban: Ringkasan singkat desa + tawarkan info spesifik

---

## FLOWCHART KEPUTUSAN AI

```
PERTANYAAN MASUK
      │
      ▼
[1] Scan seluruh kalimat
      │
      ▼
[2] Ada kata kunci topik spesifik?
    ├── YA → Identifikasi topik → Route ke intent yang sesuai
    └── TIDAK → Lanjut ke [3]
      │
      ▼
[3] Ada nama tempat / entitas?
    ├── YA → Entitas sebagai KONTEKS → Cari topik di sisa kalimat
    └── TIDAK → Lanjut ke [4]
      │
      ▼
[4] Ada kata tindakan (gimana, cara, bisa, download)?
    ├── YA → Route ke tutorial/cara penggunaan
    └── TIDAK → Lanjut ke [5]
      │
      ▼
[5] Pertanyaan sangat singkat / satu kata?
    ├── YA → Berikan info umum + tawaran detail
    └── TIDAK → Lanjut ke [6]
      │
      ▼
[6] Cek alias & sinonim (file 16)
    ├── Match ditemukan → Route berdasarkan alias
    └── Tidak match → Berikan jawaban umum + tawarkan klarifikasi
```

---

## CONTOH KASUS DISAMBIGUASI LENGKAP

### Kasus 1
**Pertanyaan:** "air tanah wonotoro"
```
Langkah 1: Scan → "air tanah" + "wonotoro"
Langkah 2: Topik = "air tanah" → Intent 02 (Potensi Air Tanah)
Langkah 3: Konteks = "wonotoro" → mempersempit ke wilayah Wonotoro
Langkah 4: Route ke → 08_pemodelan_gwp + 20_layer (GWP)
Jawaban: Informasi Potensi Air Tanah Desa Wonotoro
```

### Kasus 2
**Pertanyaan:** "dimana wonotoro"
```
Langkah 1: Scan → "dimana" + "wonotoro"
Langkah 2: Kata tindakan = "dimana" → intent lokasi
Langkah 3: TIDAK ada topik lain selain lokasi
Langkah 4: Route ke → 01_ringkasan (Wilayah Studi)
Jawaban: Letak geografis/administratif Desa Wonotoro
```

### Kasus 3
**Pertanyaan:** "air cukup ga buat warga?"
```
Langkah 1: Scan → "air" + "cukup" + "warga"
Langkah 2: "cukup" = kata kunci Neraca Air (Aturan D09)
Langkah 3: "warga" = konteks demand domestik
Langkah 4: Route ke → 10_implementasi (Neraca Air)
Jawaban: Status Neraca Air + penjelasan kategori Aman/Waspada/Kritis
```

### Kasus 4
**Pertanyaan:** "debet puncak dimana?" (typo)
```
Langkah 1: Scan → "debet puncak" (typo dari "debit puncak") + "dimana"
Langkah 2: Cek alias (file 16) → "debet puncak" = Debit Puncak Aliran ✓
Langkah 3: "dimana" = posisi di peta
Langkah 4: Route ke → 20_layer (Debit Puncak Aliran) + cara melihat layer
Jawaban: Penjelasan layer Debit Puncak + cara mengaktifkan di peta
```

### Kasus 5
**Pertanyaan:** "bulan apa debit paling tinggi?"
```
Langkah 1: Scan → "bulan" + "debit" + "paling tinggi"
Langkah 2: Topik = "debit" → Aturan D05 (ada kata waktu = Debit Puncak)
Langkah 3: "paling tinggi" = mencari nilai maksimum
Langkah 4: Route ke → 09_pemodelan_debit (Statistik Bulanan)
Jawaban: Februari adalah bulan dengan debit puncak tertinggi (14,942 m³/s rata-rata)
```

### Kasus 6
**Pertanyaan:** "hotel wonotoro"
```
Langkah 1: Scan → "hotel" + "wonotoro"
Langkah 2: Topik = "hotel" → Intent 10 (Pariwisata)
Langkah 3: Konteks = "wonotoro" (bukan menanyakan lokasi desa)
Langkah 4: Route ke → 20_layer (Hotel/Penginapan)
Jawaban: Informasi layer Hotel & Penginapan Desa Wonotoro
× SALAH: "Desa Wonotoro terletak di Kecamatan Sukapura..."
```

### Kasus 7
**Pertanyaan:** "gwp"
```
Langkah 1: Scan → "gwp" (satu kata)
Langkah 2: Cek alias (file 16) → GWP = Groundwater Potential = Potensi Air Tanah
Langkah 3: Pertanyaan singkat → Info umum
Langkah 4: Route ke → 08_pemodelan_gwp
Jawaban: Ringkasan Potensi Air Tanah + hasil 4 kelas + tawarkan detail
```

### Kasus 8
**Pertanyaan:** "cara download data"
```
Langkah 1: Scan → "cara" + "download" + "data"
Langkah 2: "cara" = kata tindakan tutorial
Langkah 3: "download data" = fitur Data Portal/Export
Langkah 4: Route ke → 11_fitur (Data Portal + Export)
Jawaban: Langkah-langkah cara mengunduh data dari AQUAVISION
```

---

## DAFTAR KATA KUNCI YANG MEMERLUKAN DISAMBIGUASI KHUSUS

| Kata Kunci | Bisa Berarti | Cara Disambiguasi |
|-----------|-------------|------------------|
| air | Air tanah / sumber air / ketersediaan | Lihat kata sebelum/sesudah |
| debit | Debit puncak / debit sumber air | Ada "puncak/banjir" = layer; ada "sumber/L/dtk" = infrastruktur |
| peta | Dashboard / layer tertentu | Ada nama layer? Route ke layer; tidak ada? Route ke dashboard |
| wonotoro | Lokasi desa / konteks wilayah | Ada topik lain? = konteks; hanya "dimana wonotoro" = lokasi |
| dimana | Lokasi geografis / posisi di peta | Ada nama layer/objek? = posisi di peta; nama desa saja = geografis |
| kondisi | Infrastruktur / ketersediaan air / lingkungan | Lihat objek sebelum "kondisi" |
| zona | Zona air tanah / zona administrasi | Ada "air tanah/gwp"? = GWP; ada "desa/kecamatan"? = administrasi |
