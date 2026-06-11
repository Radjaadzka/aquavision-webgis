# 12 – PENGUJIAN PRODUK

## Metode Pengujian

Pengujian AQUAVISION mengacu pada standar **ISO/IEC 25010:2011** dengan 4 karakteristik:

| Karakteristik | Metode Pengujian |
|---|---|
| Functional Suitability | Manual Testing (Alpha) + Kuesioner (UAT) |
| Performance Efficiency | GTMetrix (Stress Testing + Load Testing) |
| Compatibility | Manual Testing lintas browser dan perangkat |
| Usability | Kuesioner (User Acceptance Testing) |

---

## Pengujian Internal (Alpha Testing)

### Functional Suitability

**Metode:** Manual Testing – setiap fungsi diuji langsung oleh tim pengembang.

**Rumus Feature Completeness:**
```
X = I / P
```
(I = jumlah fungsi yang berhasil; P = jumlah total fungsi yang dirancang)

**Hasil:** X mendekati 1 menunjukkan kualitas fungsional yang baik.

Dari evaluasi 14 fitur yang direncanakan:
- 11 fitur: berhasil diimplementasikan penuh atau diperluas ✅
- 1 fitur: terimplementasi sebagian (peran pengguna 3 → 2 peran operasional) ⚠️
- 2 fitur: tidak terimplementasi ❌

**Tingkat ketercapaian fungsional:** ~85,7%

### Performance Efficiency (GTMetrix)

GTMetrix menilai performa dengan kombinasi:
- **Performance Score (60%):** LCP, FCP, Speed Index, TBT, CLS
- **Structure Score (40%):** CDN, kompresi gambar, pengelolaan sumber daya

**Interpretasi Grade:**
| Grade | Rentang (%) |
|---|---|
| A | 90–100 |
| B | 80–89 |
| C | 70–79 |
| D | 60–69 |
| E | 50–59 |
| F | <50 |

*(Hasil pengujian performance: Nilai tabel dikosongkan dalam dokumen asli – nilai spesifik tidak tersedia)*

---

## Pengujian Penerimaan Pengguna (User Acceptance Testing / UAT)

### Metode: Kuesioner dengan Skala Likert 1–5

| Skor | Keterangan |
|---|---|
| 1 | Sangat Tidak Setuju (STS) |
| 2 | Tidak Setuju (TS) |
| 3 | Kurang Setuju (KS) |
| 4 | Setuju (S) |
| 5 | Sangat Setuju (SS) |

### Sampel

- **Pengguna Umum:** 100 responden (dari populasi ~368.000 masyarakat/wisatawan Desa Wonotoro). Dihitung menggunakan rumus Slovin dengan margin of error 0,1.
- **Admin & Super Admin:** Semua anggota tim pengembang (3 orang).

### Pernyataan Kuesioner

| Kode | Karakteristik | Sub-karakteristik | Pernyataan |
|---|---|---|---|
| A1 | Functional Suitability | Functional Completeness | Web yang digunakan telah sesuai dengan kebutuhan |
| A2 | Functional Suitability | Functional Correctness | Web yang digunakan telah menyediakan fungsi dengan baik |
| A3 | Functional Suitability | Functional Appropriateness | Web telah memiliki informasi dan fitur lengkap yang dibutuhkan pengguna |
| B1 | Performance Efficiency | Time Behavior | Web dapat merespons dengan cepat saat menampilkan informasi |
| B2 | Performance Efficiency | Resource Utilization & Capacity | Web dapat diakses pada jam sibuk |
| C1 | Compatibility | Co-existence | Web dapat digunakan pada browser Chrome dan Firefox |
| C2 | Compatibility | Interoperability | Fitur pengukuran jarak dapat berjalan dengan lancar |
| D1 | Usability | Appropriateness Recognizability | Ikon dan tombol dalam web mudah dikenali dan dimengerti |
| D2 | Usability | Learnability | Saya dapat dengan mudah mempelajari cara menggunakan web ini tanpa bantuan |
| D3 | Usability | Operability | Navigasi antar fitur dalam web berjalan lancar tanpa kebingungan |
| D4 | Usability | User Error Protection | Web memberi peringatan yang jelas saat terjadi kesalahan input |
| D5 | Usability | User Interface Aesthetics | Tampilan web menarik secara visual (warna, font, layout) |
| D6 | Usability | Accessibility | Kontras warna dan ukuran font cukup baik untuk dilihat dengan nyaman |

---

## Uji Validitas dan Reliabilitas

### Uji Validitas
Menggunakan korelasi Pearson (r). Item dinyatakan valid jika r_hitung > r_tabel.

Formula:
```
r = [n(Σxy) − (Σx)(Σy)] / √{[nΣx² − (Σx)²][nΣy² − (Σy)²]}
```

### Uji Reliabilitas
Menggunakan koefisien Alpha Cronbach (r₁₁). Data reliabel jika r₁₁ > 0,6.

Formula:
```
r₁₁ = [k/(k−1)] × [1 − (Σσb²/σt²)]
```

**Skala Interpretasi Alpha Cronbach:**
| Nilai | Keterangan |
|---|---|
| 0,00–0,20 | Kurang reliabel |
| 0,20–0,40 | Agak reliabel |
| 0,40–0,60 | Cukup reliabel |
| 0,60–0,80 | Reliabel |
| 0,80–1,00 | Sangat reliabel |

---

## Pengujian Kompatibilitas

**Metode:** Manual Testing pada berbagai kombinasi perangkat dan browser.

**Hasil:**

| Device | Browser | Sistem Operasi | Hasil |
|---|---|---|---|
| Desktop | Chrome | Windows | ✅ Berhasil |
| Desktop | Firefox | Windows | ✅ Berhasil |
| Desktop | Edge | Windows | ✅ Berhasil |
| Smartphone | Chrome | Android dan iOS | ✅ Berhasil |
| Smartphone | Firefox | Android dan iOS | ✅ Berhasil |
| Smartphone | Safari | Android dan iOS | ✅ Berhasil |

---

## Ringkasan Ketercapaian Fitur

| Fitur yang Direncanakan | Status | Catatan |
|---|---|---|
| Dashboard Peta (multi-layer) | ✅ Penuh | 8 layer data + 2 layer analitik tambahan |
| Input Data (manual & shapefile) | ✅ Penuh | 4 tipe data manual + upload SHP semua dataset |
| Pengukuran Jarak | ✅ Penuh | Mode klik + mode input koordinat manual |
| Neraca Air | ✅ Penuh + Diperluas | Real-time + simulasi skenario + gauge chart |
| Manajemen Hak Akses (3 peran) | ⚠️ Sebagian | 2 peran efektif (Admin & User); Super Admin via superuser Django |
| Basemap Switching | ✅ Penuh | OSM, Satelit ESRI, Topografi ESRI |
| Download Dataset Multi-format | ✅ Penuh | CSV, GeoJSON, KML, Shapefile (ZIP) |
| Visualisasi Debit Puncak Bulanan | ✅ Tambahan | 12 bulan, dengan tooltip nilai piksel TIFF |
| Peta Potensi Air Tanah | ✅ Tambahan | Layer GeoJSON dengan klasifikasi 4 kelas |
| Feedback Publik | ✅ Penuh | Submit & list feedback tanpa autentikasi |
| Data Portal Tabular | ✅ Penuh | Pagination, pencarian, role-based fields |
| Autentikasi Google OAuth2 | ⚠️ Kondisional | Aktif jika env var terkonfigurasi |
| WMS/WFS via GeoServer | ❌ Tidak | Digantikan GeoJSON custom endpoint |
| Entitas Data Persil (Status Lahan) | ❌ Tidak | Belum ada model persil terpisah |
