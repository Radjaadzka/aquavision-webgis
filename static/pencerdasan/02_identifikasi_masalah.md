# 02 – IDENTIFIKASI MASALAH

## Konteks Wilayah

Desa Wonotoro di Kabupaten Probolinggo merupakan desa wisata yang diakui oleh Kementerian Pariwisata dan Ekonomi Kreatif (Jadesta). Desa ini berada di kawasan penyangga wisata internasional Gunung Bromo (Taman Nasional Bromo Tengger Semeru). Pengembangan pariwisata yang pesat menambah tekanan pada ketersediaan air bersih yang sudah terbatas.

---

## Masalah 1 – Aksesibilitas Sumber Air yang Sulit

**Deskripsi:**
Lokasi sumber mata air utama Desa Wonotoro terletak pada topografi pegunungan yang curam dan berjarak jauh dari permukiman penduduk. Kondisi medan ekstrem ini menyulitkan akses pengambilan air secara fisik maupun perawatan jalur distribusi.

**Dampak:**
- Biaya investasi sangat tinggi untuk pembangunan infrastruktur penyaluran air ke permukiman.
- Distribusi air tidak merata antar-dusun.

**Sumber Data:** BPS Kabupaten Probolinggo, 2024.

---

## Masalah 2 – Ketidaktersediaan Jaringan Pipa Terstruktur

**Deskripsi:**
Belum tersedia jaringan pipa distribusi formal yang terhubung secara merata ke seluruh rumah tangga. Infrastruktur yang ada didominasi instalasi swadaya masyarakat yang rentan bocor dan rusak.

**Dampak:**
- Inefisiensi distribusi air.
- Konflik sosial antarwarga akibat rebutan aliran air.
- Tidak adanya peta aset digital; pasca kebakaran Bromo 2023, warga harus menelusuri jalur pipa belasan kilometer secara manual.

**Sumber Data:** Dinas Pemberdayaan Masyarakat dan Desa, 2023; TIMES Indonesia, 2023.

---

## Masalah 3 – Penurunan Debit Air

**Deskripsi:**
Desa Wonotoro mengalami krisis air parah saat musim kemarau. Debit air alami menurun tajam, sementara permintaan air dari sektor pertanian hortikultura dan layanan wisata justru meningkat.

**Dampak:**
- Kompetisi penggunaan air yang tidak seimbang antara kebutuhan ekonomi (wisata, pertanian) dan kebutuhan domestik.
- Penurunan kualitas manajemen wisata.
- Ancaman terhadap keberlanjutan desa wisata.

**Sumber Data:** RRI, 2025; Tadatodays, 2025.

---

## Masalah 4 – Data Sumber Daya Air Tidak Terintegrasi

**Deskripsi:**
Fragmentasi data sumber daya air (lokasi sumber air, jaringan pipa, tandon, debit) menyebabkan data tersebar di berbagai pihak dan format berbeda, tanpa ada sistem informasi terpadu.

**Dampak:**
- Manajemen infrastruktur terhambat.
- Pasca kebakaran Bromo 2023, tidak ada peta aset digital sehingga pemulihan jalur pipa dilakukan secara manual dan memakan waktu lama.
- Pengambilan keputusan terkait pengelolaan air tidak dapat dilakukan secara berbasis data.

**Sumber Data:** TIMES Indonesia, 2023.

---

## Rangkuman Keterkaitan Masalah

```
Topografi curam
  → Sumber air jauh dari permukiman
  → Infrastruktur distribusi mahal & tidak terstruktur
  → Data aset tersebar, tidak terintegrasi
  → Saat krisis (kebakaran, kemarau) → respons lambat
```

```
Pertumbuhan wisata
  → Kebutuhan air meningkat
  → Penurunan debit musiman memperburuk ketidakseimbangan
  → Tanpa data terpadu → perencanaan tidak efektif
```

---

## Solusi yang Dipilih: WebGIS

Dari tiga alternatif solusi yang dievaluasi (Peta Cetak, Dashboard QGIS, WebGIS), dipilih **WebGIS** karena:

| Aspek | Alasan Pemilihan WebGIS |
|---|---|
| Aksesibilitas | Dapat diakses via browser tanpa instalasi perangkat lunak |
| Integrasi Data | Menggabungkan semua data spasial dan non-spasial dalam satu platform |
| Multi-pengguna | Dapat diakses bersamaan oleh berbagai pihak |
| Kemudahan Penggunaan | Antarmuka visual yang mudah dipahami non-teknis |
| Pembaruan Data | Data dapat diperbarui tanpa mendistribusikan ulang produk fisik |
| Pengembangan Lanjutan | Struktur sistem memungkinkan penambahan fitur di masa depan |
