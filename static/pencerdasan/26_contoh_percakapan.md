# 26 – CONTOH PERCAKAPAN

*File ini berisi 110 contoh percakapan antara pengguna dan AI Assistant AQUAVISION. Digunakan sebagai data latihan untuk few-shot learning, fine-tuning, dan evaluasi kualitas respons. Setiap contoh menunjukkan cara AI seharusnya mengidentifikasi intent dan memberikan jawaban yang tepat.*

---

## FORMAT

```
[ID] KATEGORI
Q: [Pertanyaan pengguna]
INTENT: [Intent yang teridentifikasi]
TOPIK: [Topik utama] | KONTEKS: [Konteks/entitas]
A: [Jawaban ideal AI]
```

---

## KATEGORI A – LOKASI & WILAYAH (10 contoh)

---

**[A01]** Lokasi – formal
Q: "Di mana letak Desa Wonotoro?"
INTENT: I01 – Lokasi Wilayah
TOPIK: lokasi | KONTEKS: Wonotoro
A: Desa Wonotoro terletak di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Desa ini merupakan kawasan pegunungan di sekitar Taman Nasional Bromo Tengger Semeru dan berfungsi sebagai desa penyangga wisata internasional Gunung Bromo.

---

**[A02]** Lokasi – informal
Q: "wonotoro ada di mana?"
INTENT: I01 – Lokasi Wilayah
TOPIK: lokasi | KONTEKS: Wonotoro
A: Wonotoro ada di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Lokasinya di kawasan pegunungan dekat Bromo.

---

**[A03]** Lokasi – typo
Q: "wontoro dimana?"
INTENT: I01 – Lokasi Wilayah (via alias/fuzzy match)
TOPIK: lokasi | KONTEKS: Wonotoro (wontoro = typo)
A: Desa Wonotoro terletak di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur. Berada di kawasan pegunungan dekat Taman Nasional Bromo Tengger Semeru.

---

**[A04]** Lokasi – singkatan
Q: "kec wonotoro apa?"
INTENT: I01 – Lokasi Wilayah
TOPIK: kecamatan | KONTEKS: Wonotoro
A: Desa Wonotoro berada di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur.

---

**[A05]** Luas wilayah
Q: "berapa luas wilayah wonotoro?"
INTENT: I01 – Lokasi Wilayah
TOPIK: luas | KONTEKS: Wonotoro
A: Informasi luas administratif Desa Wonotoro tidak tersedia secara eksplisit dalam dokumen AQUAVISION. Yang tercatat adalah luas Daerah Aliran Sungai (DAS) yang dianalisis, yaitu 289,164 km². Luas DAS berbeda dari luas desa karena mengikuti batas alami topografi, bukan batas administratif.

---

**[A06]** Konteks geografis
Q: "wonotoro dekat gunung bromo?"
INTENT: I01 – Lokasi Wilayah
TOPIK: lokasi relatif | KONTEKS: Wonotoro, Bromo
A: Ya. Desa Wonotoro berada di kawasan pegunungan sekitar Taman Nasional Bromo Tengger Semeru dan merupakan salah satu desa penyangga wisata internasional Gunung Bromo di Kabupaten Probolinggo, Jawa Timur.

---

**[A07]** Lokasi vs topik air (KASUS KRITIS)
Q: "wonotoro air tanah"
INTENT: I02 – Potensi Air Tanah
TOPIK: air tanah | KONTEKS: Wonotoro
A: Berdasarkan pemodelan Groundwater Potential (GWP) AQUAVISION, Desa Wonotoro memiliki potensi air tanah yang cukup baik: 33,4% wilayah berpotensi Tinggi dan 10,6% Sangat Tinggi. Zona dengan potensi tertinggi umumnya berada di area batuan vulkanik berpori dengan curah hujan tinggi. Hanya 12,4% wilayah yang berpotensi Rendah.
*[Catatan AI: "wonotoro" di sini adalah konteks wilayah, bukan pertanyaan lokasi.]*

---

**[A08]** Lokasi vs topik hotel (KASUS KRITIS)
Q: "hotel wonotoro"
INTENT: I10 – Pariwisata
TOPIK: hotel | KONTEKS: Wonotoro
A: Informasi hotel dan penginapan di Wonotoro tersedia di AQUAVISION melalui layer Hotel/Penginapan. Layer ini menampilkan titik lokasi hotel, homestay, dan akomodasi di wilayah Desa Wonotoro beserta atribut seperti jenis fasilitas, jumlah kamar, kapasitas, dan kebutuhan air harian. Aktifkan layer "Hotel" di panel layer control untuk melihatnya di peta.
*[Catatan AI: "wonotoro" adalah konteks, bukan topik lokasi.]*

---

**[A09]** Kabupaten Probolinggo
Q: "wonotoro kabupaten apa?"
INTENT: I01 – Lokasi Wilayah
TOPIK: kabupaten | KONTEKS: Wonotoro
A: Desa Wonotoro termasuk dalam Kabupaten Probolinggo, Jawa Timur.

---

**[A10]** DAS vs wilayah desa
Q: "luas DAS wonotoro berapa?"
INTENT: I07 – DAS
TOPIK: luas DAS | KONTEKS: Wonotoro
A: Luas Daerah Aliran Sungai (DAS) yang dianalisis dalam studi AQUAVISION adalah 289,164 km². Perlu diperhatikan bahwa luas ini berbeda dari luas administratif Desa Wonotoro karena DAS mengikuti batas alami topografi dan bukan batas desa.

---

## KATEGORI B – PETA & DASHBOARD (8 contoh)

---

**[B01]** Cara buka peta
Q: "bagaimana cara membuka peta AQUAVISION?"
INTENT: I14 – Cara Penggunaan
TOPIK: dashboard/peta | KONTEKS: —
A: Setelah login ke AQUAVISION, halaman Dashboard otomatis terbuka menampilkan peta interaktif wilayah Desa Wonotoro. Anda bisa langsung menjelajahi peta dengan scroll untuk zoom in/out, klik-tahan untuk menggeser, dan klik objek di peta untuk melihat informasi detailnya.

---

**[B02]** Aktifkan layer
Q: "cara aktifkan layer peta"
INTENT: I14 – Cara Penggunaan
TOPIK: layer control | KONTEKS: —
A: Untuk mengaktifkan atau menonaktifkan layer di AQUAVISION: (1) Buka Dashboard peta. (2) Lihat panel layer control di sisi kiri/kanan peta. (3) Centang/klik layer yang ingin ditampilkan, misalnya "Potensi Air Tanah" atau "Sumber Air". Layer akan langsung muncul di peta.

---

**[B03]** Layer tersedia apa saja
Q: "layer apa saja yang ada di AQUAVISION?"
INTENT: I02/I03/… – Layer
TOPIK: daftar layer | KONTEKS: —
A: AQUAVISION menyediakan 11 layer data, yaitu: (1) Potensi Air Tanah, (2) Debit Puncak Aliran, (3) Sumber Air, (4) Tandon Air, (5) Jaringan Pipa, (6) Daerah Aliran Sungai (DAS), (7) Administrasi Desa, (8) Hotel/Penginapan, (9) Tempat Makan, (10) Jasa, dan (11) Permukiman.

---

**[B04]** Basemap
Q: "bisa ganti tampilan peta?"
INTENT: I14 – Cara Penggunaan
TOPIK: basemap | KONTEKS: —
A: Ya. AQUAVISION menyediakan tiga pilihan basemap: OpenStreetMap (peta jalan standar), Citra Satelit ESRI (foto udara), dan Topografi ESRI (kontur ketinggian). Pilih basemap melalui selector di pojok kanan peta.

---

**[B05]** Klik objek
Q: "cara lihat info titik di peta"
INTENT: I14 – Cara Penggunaan
TOPIK: popup info | KONTEKS: —
A: Klik langsung pada titik/objek di peta. Akan muncul popup/popup yang menampilkan informasi atribut objek tersebut, misalnya nama sumber air, debit, kondisi, dan data lainnya sesuai layer yang aktif.

---

**[B06]** Akses dari HP
Q: "bisa akses AQUAVISION dari HP?"
INTENT: I14 – Cara Penggunaan
TOPIK: kompatibilitas mobile | KONTEKS: —
A: AQUAVISION dapat diakses melalui browser di HP. Namun berdasarkan pengujian yang tersedia, optimasi khusus untuk tampilan mobile belum diuji secara menyeluruh. Untuk pengalaman terbaik, disarankan menggunakan laptop atau komputer dengan browser Chrome, Firefox, atau Edge terbaru.

---

**[B07]** Basemap satelit
Q: "mau lihat foto satelit wonotoro"
INTENT: I14 – Cara Penggunaan
TOPIK: basemap satelit | KONTEKS: Wonotoro
A: Di AQUAVISION, Anda bisa beralih ke tampilan citra satelit dengan memilih basemap "Citra Satelit ESRI" melalui selector basemap di pojok kanan peta. Peta akan langsung berubah menampilkan foto udara wilayah Wonotoro.

---

**[B08]** Legenda
Q: "arti warna di peta apa?"
INTENT: I14 – Cara Penggunaan
TOPIK: legenda | KONTEKS: —
A: Setiap layer memiliki legenda warna yang berbeda. Untuk melihat arti warna: aktifkan layer yang diinginkan, kemudian lihat panel legenda yang tersedia di peta. Misalnya, pada layer Potensi Air Tanah: hijau = Sangat Tinggi, kuning = Tinggi, oranye = Sedang, merah = Rendah.

---

## KATEGORI C – POTENSI AIR TANAH (12 contoh)

---

**[C01]** Info dasar
Q: "apa itu potensi air tanah?"
INTENT: I02 – Potensi Air Tanah
TOPIK: definisi | KONTEKS: —
A: Potensi air tanah adalah perkiraan seberapa besar kemungkinan suatu area memiliki cadangan air di bawah tanah yang bisa dimanfaatkan. Di AQUAVISION, potensi air tanah dipetakan berdasarkan analisis 7 faktor seperti curah hujan, jenis batuan, kelerengan, dan tutupan lahan menggunakan metode AHP.

---

**[C02]** Hasil pemodelan
Q: "potensi air tanah wonotoro bagaimana?"
INTENT: I02 – Potensi Air Tanah
TOPIK: hasil GWP | KONTEKS: Wonotoro
A: Berdasarkan pemodelan AQUAVISION, potensi air tanah di wilayah studi Wonotoro terbagi menjadi 4 kelas: Sangat Tinggi (10,6%), Tinggi (33,4%), Sedang (43,5%), dan Rendah (12,4%). Sebagian besar wilayah memiliki potensi air tanah sedang hingga tinggi, terutama di area dengan batuan vulkanik berpori dan curah hujan tinggi.

---

**[C03]** Zona terbaik
Q: "air tanah paling bagus dimana?"
INTENT: I02 – Potensi Air Tanah
TOPIK: zona Sangat Tinggi | KONTEKS: —
A: Zona potensi air tanah tertinggi (Sangat Tinggi) mencakup 10,6% wilayah studi dan umumnya berada di area dengan kombinasi: curah hujan tinggi, batuan vulkanik berpori, dan kelerengan sedang yang mendukung infiltrasi. Detail lokasi spesifik dapat dilihat pada layer Potensi Air Tanah di peta AQUAVISION.

---

**[C04]** Informal
Q: "airtanah wonotoro"
INTENT: I02 – Potensi Air Tanah
TOPIK: air tanah | KONTEKS: Wonotoro
A: Potensi air tanah Wonotoro cukup baik. Sekitar 43% wilayah berpotensi Tinggi dan 17% Sangat Tinggi. Cek layer "Potensi Air Tanah" di peta AQUAVISION untuk melihat persebaran zonanya.

---

**[C05]** Typo
Q: "pontensi airtanah wonotoro"
INTENT: I02 – Potensi Air Tanah (via alias: "pontensi airtanah" = "potensi air tanah")
TOPIK: air tanah | KONTEKS: Wonotoro
A: Potensi air tanah Desa Wonotoro: 10,6% Sangat Tinggi, 33,4% Tinggi, 43,5% Sedang, 12,4% Rendah. Mayoritas wilayah memiliki potensi sedang hingga tinggi. Lihat layer GWP di peta untuk detail lokasinya.

---

**[C06]** Metode GWP
Q: "bagaimana cara menghitung potensi air tanah?"
INTENT: I12 – Metodologi
TOPIK: metode GWP/AHP | KONTEKS: —
A: Potensi air tanah di AQUAVISION dihitung menggunakan metode AHP (Analytical Hierarchy Process) berbasis GIS. Tujuh parameter digunakan: curah hujan (bobot 40%), geologi (23%), kepadatan kelurusan (13%), tutupan lahan (10%), kelerengan (7%), kerapatan drainase (4%), dan jenis tanah (3%). Setiap parameter direklasifikasi ke skala 1–5 lalu digabungkan dengan pembobotan tersebut menggunakan Weighted Overlay.

---

**[C07]** Singkatan
Q: "gwp itu apa?"
INTENT: I02 – Potensi Air Tanah
TOPIK: definisi GWP | KONTEKS: —
A: GWP adalah singkatan dari Groundwater Potential, atau dalam Bahasa Indonesia: Potensi Air Tanah. Dalam AQUAVISION, GWP merujuk pada peta hasil pemodelan yang menunjukkan zona potensi air tanah di wilayah studi Wonotoro, diklasifikasikan ke dalam 4 kelas: Rendah, Sedang, Tinggi, dan Sangat Tinggi.

---

**[C08]** Hujan dan air tanah
Q: "curah hujan pengaruh ke air tanah?"
INTENT: I02 + I12 – Potensi Air Tanah + Metodologi
TOPIK: hubungan hujan-GWP | KONTEKS: —
A: Ya, curah hujan adalah faktor paling berpengaruh dalam menentukan potensi air tanah di model AQUAVISION, dengan bobot 40% dalam analisis AHP. Semakin tinggi curah hujan di suatu area, semakin besar kemungkinan air meresap ke tanah dan mengisi cadangan air bawah tanah, terutama jika jenis batuannya berpori dan kelerengannya landai.

---

**[C09]** Sangat Tinggi vs Tinggi
Q: "apa bedanya zona high dan very high di peta air tanah?"
INTENT: I02 – Potensi Air Tanah
TOPIK: interpretasi kelas GWP | KONTEKS: —
A: Zona Sangat Tinggi menunjukkan potensi tertinggi untuk menemukan air tanah dalam jumlah signifikan, dengan kondisi sangat mendukung resapan (batuan sangat berpori, curah hujan sangat tinggi, lereng landai). Zona Tinggi memiliki potensi tinggi namun satu atau lebih faktor tidak seoptimal Sangat Tinggi. Secara praktis, kedua zona ini adalah prioritas utama untuk mencari sumber air baru atau sumur bor.

---

**[C10]** Zona Rendah
Q: "kalau zona low air tanah artinya apa?"
INTENT: I02 – Potensi Air Tanah
TOPIK: interpretasi kelas Rendah | KONTEKS: —
A: Zona Rendah berarti area tersebut memiliki potensi kecil untuk menyimpan air tanah yang signifikan. Biasanya karena kombinasi: lereng curam (air mengalir, tidak meresap), batuan kedap air, atau curah hujan rendah. Zona Rendah mencakup 12,4% wilayah studi Wonotoro.

---

**[C11]** Parameter GWP
Q: "apa saja yang dipakai buat hitung gwp?"
INTENT: I12 – Metodologi
TOPIK: parameter AHP | KONTEKS: GWP
A: Tujuh parameter digunakan untuk menghitung GWP: (1) Curah Hujan – bobot 40%, (2) Geologi/Litologi – 23%, (3) Kepadatan Kelurusan – 13%, (4) Tutupan Lahan – 10%, (5) Kelerengan – 7%, (6) Kerapatan Drainase – 4%, (7) Jenis Tanah – 3%. Total bobot = 100%.

---

**[C12]** Sumber data GWP
Q: "data gwp dari mana?"
INTENT: I22 – Sumber Data
TOPIK: sumber data GWP | KONTEKS: —
A: Data untuk pemodelan GWP bersumber dari: curah hujan (CHIRPS v.03, 2016–2025), geologi (ESDM GeoMap skala 1:100.000), DEM/lereng/drainase (SRTM 30m + DEMNAS 8,1m dari BIG), tutupan lahan (ESA WorldCover 10m), dan jenis tanah (FAO DSMW skala 1:5.000.000).

---

## KATEGORI D – DEBIT PUNCAK (10 contoh)

---

**[D01]** Definisi
Q: "debit puncak itu apa?"
INTENT: I03 – Debit Puncak
TOPIK: definisi | KONTEKS: —
A: Debit puncak adalah jumlah air terbesar yang mengalir di suatu sungai/DAS dalam waktu tertentu, biasanya sebagai respons terhadap hujan lebat. Diukur dalam m³/detik. Di AQUAVISION, debit puncak dihitung setiap bulan menggunakan metode SCS-CN dan Metode Rasional untuk wilayah DAS Wonotoro seluas 289,164 km².

---

**[D02]** Nilai tertinggi
Q: "kapan debit paling tinggi?"
INTENT: I03 – Debit Puncak
TOPIK: debit tertinggi | KONTEKS: waktu/bulan
A: Debit puncak tertinggi terjadi pada bulan Februari, dengan rata-rata 14,942 m³/s dan nilai maksimum 40,828 m³/s. Ini sesuai dengan puncak musim hujan di Jawa Timur.

---

**[D03]** Nilai terendah
Q: "bulan apa debit paling rendah?"
INTENT: I03 – Debit Puncak
TOPIK: debit terendah | KONTEKS: waktu/bulan
A: Debit puncak paling rendah terjadi pada bulan September, dengan rata-rata hanya 0,138 m³/s. Ini adalah periode puncak musim kemarau di wilayah Wonotoro.

---

**[D04]** Typo
Q: "debet puncak dimana?"
INTENT: I03 – Debit Puncak (debet = typo)
TOPIK: lokasi layer debit | KONTEKS: —
A: Layer Debit Puncak Aliran tersedia di AQUAVISION. Aktifkan melalui panel layer control di Dashboard. Layer ini menampilkan 12 peta debit bulanan (Januari–Desember) yang bisa Anda pilih sesuai bulan yang ingin dilihat.

---

**[D05]** Musim hujan
Q: "debit puncak musim hujan gimana?"
INTENT: I03 – Debit Puncak
TOPIK: pola musiman | KONTEKS: musim hujan
A: Pada musim hujan (November–April), debit puncak meningkat signifikan. Puncaknya di bulan Februari (rata-rata 14,942 m³/s, maks 40,828 m³/s). Debit tinggi ini menunjukkan potensi banjir atau aliran permukaan besar yang perlu diperhatikan dalam perencanaan infrastruktur.

---

**[D06]** Informal singkat
Q: "debit februari berapa?"
INTENT: I03 – Debit Puncak
TOPIK: debit bulan Februari | KONTEKS: —
A: Debit puncak Februari: rata-rata 14,942 m³/s, maksimum 40,828 m³/s. Ini adalah bulan dengan debit tertinggi dalam setahun.

---

**[D07]** Hubungan DAS
Q: "DAS berpengaruh ke debit puncak?"
INTENT: I03 + I07 – Debit Puncak + DAS
TOPIK: relasi DAS-debit | KONTEKS: —
A: Ya, DAS adalah wilayah yang menghasilkan aliran air menuju satu titik. Semakin luas DAS dan semakin tinggi curah hujan, semakin besar potensi debit puncaknya. DAS dalam studi AQUAVISION seluas 289,164 km² menjadi area perhitungan debit menggunakan metode SCS-CN dan Metode Rasional.

---

**[D08]** Limpasan
Q: "limpasan permukaan wonotoro"
INTENT: I03 – Debit Puncak
TOPIK: limpasan | KONTEKS: Wonotoro
A: Limpasan permukaan di wilayah Wonotoro dihitung menggunakan metode SCS-CN yang mempertimbangkan jenis tanah dan tutupan lahan. Limpasan terbesar terjadi di bulan Februari, dan terendah di September. Nilai limpasan ini menjadi dasar perhitungan Debit Puncak Aliran di layer AQUAVISION.

---

**[D09]** Banjir
Q: "rawan banjir ga wonotoro?"
INTENT: I03 – Debit Puncak
TOPIK: risiko banjir | KONTEKS: Wonotoro
A: Berdasarkan data Debit Puncak Aliran AQUAVISION, debit puncak di musim hujan (terutama Desember–Februari) bisa sangat tinggi, dengan nilai maksimum mencapai 40,828 m³/s di Februari. Ini menunjukkan potensi aliran permukaan yang besar. Analisis risiko banjir spesifik belum tersedia dalam sistem, namun pola debit ini bisa menjadi acuan kewaspadaan.

---

**[D10]** Metode
Q: "SCS-CN itu metode apa?"
INTENT: I12 – Metodologi
TOPIK: SCS-CN | KONTEKS: —
A: SCS-CN (Soil Conservation Service – Curve Number) adalah metode hidrologi untuk memperkirakan limpasan permukaan berdasarkan curah hujan, jenis tanah, dan tutupan lahan. Nilai CN (0–100) menentukan seberapa besar hujan yang menjadi limpasan. Di AQUAVISION, SCS-CN dikombinasikan dengan Metode Rasional untuk menghitung Debit Puncak Aliran bulanan.

---

## KATEGORI E – DAS (6 contoh)

---

**[E01]** Definisi
Q: "das itu apa?"
INTENT: I07 – DAS
TOPIK: definisi DAS | KONTEKS: —
A: DAS (Daerah Aliran Sungai) adalah wilayah daratan yang secara alami menampung air hujan dan mengalirkannya ke satu titik (sungai atau muara). Batas DAS ditentukan oleh topografi (punggungan bukit), bukan oleh batas administratif desa. DAS dalam studi AQUAVISION luasnya 289,164 km².

---

**[E02]** Luas
Q: "berapa km2 DAS wonotoro?"
INTENT: I07 – DAS
TOPIK: luas DAS | KONTEKS: Wonotoro
A: Luas DAS dalam wilayah studi AQUAVISION adalah 289,164 km².

---

**[E03]** Informal
Q: "watershed wonotoro"
INTENT: I07 – DAS (watershed = sinonim DAS)
TOPIK: DAS | KONTEKS: Wonotoro
A: Watershed (Daerah Aliran Sungai/DAS) Wonotoro dalam studi AQUAVISION memiliki luas 289,164 km². Layer DAS tersedia di peta AQUAVISION untuk melihat batas dan wilayahnya secara visual.

---

**[E04]** Bedanya DAS dan desa
Q: "batas DAS sama batas desa beda ya?"
INTENT: I07 – DAS
TOPIK: perbedaan DAS vs administrasi | KONTEKS: —
A: Benar. Batas DAS ditentukan oleh punggungan topografi (titik tertinggi yang memisahkan aliran air), sehingga bisa melampaui batas administratif desa. Luas DAS yang dianalisis AQUAVISION (289,164 km²) belum tentu sama dengan luas administratif Desa Wonotoro.

---

**[E05]** Layer DAS
Q: "peta DAS ada ga di AQUAVISION?"
INTENT: I07 – DAS
TOPIK: layer DAS | KONTEKS: —
A: Ada. Layer "Daerah Aliran Sungai (DAS)" tersedia di AQUAVISION. Aktifkan melalui panel layer control untuk melihat batas DAS yang dianalisis dalam studi ini.

---

**[E06]** Fungsi DAS
Q: "DAS buat apa dalam sistem ini?"
INTENT: I07 – DAS
TOPIK: fungsi DAS | KONTEKS: AQUAVISION
A: DAS berfungsi sebagai unit analisis hidrologi. Dalam AQUAVISION, batas DAS digunakan sebagai area perhitungan Debit Puncak Aliran menggunakan metode SCS-CN dan Metode Rasional. Seluruh curah hujan yang jatuh di dalam DAS dianalisis untuk menghitung potensi limpasan dan debit puncaknya.

---

## KATEGORI F – SUMBER AIR & INFRASTRUKTUR (8 contoh)

---

**[F01]** Sumber air
Q: "dimana sumber air wonotoro?"
INTENT: I04 – Sumber Air
TOPIK: lokasi sumber air | KONTEKS: Wonotoro
A: Lokasi sumber air (mata air) Desa Wonotoro dapat dilihat pada layer "Sumber Air" di peta AQUAVISION. Layer ini menampilkan titik-titik mata air beserta informasi nama, debit (L/detik), jenis sumber, dan kondisinya.

---

**[F02]** Tandon
Q: "tandon air wonotoro ada berapa?"
INTENT: I05 – Tandon Air
TOPIK: jumlah/lokasi tandon | KONTEKS: Wonotoro
A: Informasi jumlah dan lokasi tandon air tersedia di layer "Tandon Air" AQUAVISION. Aktifkan layer tersebut di peta untuk melihat titik-titik tandon beserta kapasitas (m³) dan ketinggiannya.

---

**[F03]** Pipa
Q: "peta jaringan pipa wonotoro"
INTENT: I06 – Jaringan Pipa
TOPIK: layer jaringan pipa | KONTEKS: Wonotoro
A: Layer "Jaringan Pipa" tersedia di AQUAVISION, menampilkan jalur distribusi pipa air di Desa Wonotoro. Informasi yang tersedia mencakup diameter pipa, kondisi, dan tahun pemasangan. Aktifkan layer ini di panel layer control Dashboard.

---

**[F04]** Setelah kebakaran Bromo
Q: "pipa pasca kebakaran bromo 2023 gimana?"
INTENT: I06 – Jaringan Pipa
TOPIK: kondisi pipa | KONTEKS: pasca kebakaran Bromo 2023
A: Salah satu latar belakang pembuatan AQUAVISION adalah kejadian kebakaran Bromo 2023 yang mengakibatkan jalur pipa air harus ditelusuri manual sejauh belasan kilometer. Dengan AQUAVISION, peta jaringan pipa kini tersedia digital sehingga kondisi dan lokasi pipa bisa diidentifikasi tanpa harus survei lapangan manual.

---

**[F05]** Pengukuran jarak pipa
Q: "gimana cara tau panjang pipa yang perlu dipasang?"
INTENT: I18 – Pengukuran Jarak
TOPIK: fitur ukur jarak | KONTEKS: pipa
A: AQUAVISION memiliki fitur Pengukuran Jarak yang bisa digunakan untuk mengukur jarak antara dua titik di peta. Misalnya, dari lokasi sumber air ke tandon atau ke permukiman, sehingga bisa memperkirakan panjang pipa yang dibutuhkan tanpa perlu survei lapangan.

---

**[F06]** Neraca air
Q: "air cukup ga buat warga wonotoro?"
INTENT: I08 – Neraca Air
TOPIK: kecukupan air | KONTEKS: Wonotoro, warga
A: AQUAVISION menyediakan fitur Neraca Air yang membandingkan total ketersediaan air (dari sumber air) dengan total kebutuhan (warga, hotel, tempat makan, dll). Hasilnya ditampilkan sebagai status: Aman (penggunaan <50%), Waspada (50–80%), atau Kritis (>80%). Lihat panel Neraca Air di Dashboard untuk status terkini.

---

**[F07]** Informal – kritis
Q: "air kritis ga?"
INTENT: I08 – Neraca Air
TOPIK: status neraca air | KONTEKS: —
A: Status neraca air (Aman/Waspada/Kritis) bisa dilihat langsung di panel Neraca Air pada Dashboard AQUAVISION. Kritis berarti penggunaan sudah melebihi 80% kapasitas ketersediaan air.

---

**[F08]** Supply demand
Q: "supply demand air wonotoro"
INTENT: I08 – Neraca Air
TOPIK: neraca air | KONTEKS: Wonotoro
A: Neraca air AQUAVISION menghitung selisih antara supply (debit total sumber air dalam L/dtk) dan demand (kebutuhan air warga + fasilitas wisata). Hasilnya menentukan status: Aman, Waspada, atau Kritis. Gunakan fitur Neraca Air di Dashboard untuk melihat angkanya.

---

## KATEGORI G – SIMULASI (6 contoh)

---

**[G01]** Cara simulasi
Q: "cara pakai simulasi ketersediaan air"
INTENT: I09 – Simulasi
TOPIK: cara penggunaan simulasi | KONTEKS: —
A: Fitur Simulasi di AQUAVISION memungkinkan Anda memproyeksikan ketersediaan air berdasarkan skenario. Caranya: (1) Buka halaman Simulasi. (2) Masukkan parameter skenario: jumlah wisatawan, jumlah kamar hotel baru, atau penambahan penduduk. (3) Klik Hitung/Simulasi. (4) Sistem akan menampilkan proyeksi neraca air berdasarkan skenario tersebut.

---

**[G02]** Skenario wisatawan
Q: "bagaimana kalau wisatawan bertambah 500 orang?"
INTENT: I09 – Simulasi
TOPIK: skenario simulasi | KONTEKS: wisatawan
A: Gunakan fitur Simulasi AQUAVISION. Masukkan jumlah wisatawan tambahan (500 orang) sebagai parameter. Sistem akan menghitung tambahan kebutuhan air dan memperlihatkan apakah neraca air tetap Aman, berubah menjadi Waspada, atau Kritis.

---

**[G03]** Informal
Q: "kalau ada hotel baru air masih cukup?"
INTENT: I09 – Simulasi
TOPIK: skenario hotel baru | KONTEKS: —
A: Pertanyaan ini bisa dijawab menggunakan fitur Simulasi AQUAVISION. Masukkan jumlah kamar hotel baru sebagai input, lalu sistem akan memproyeksikan dampaknya terhadap ketersediaan air. Hasilnya menunjukkan apakah kondisi tetap Aman atau berubah.

---

**[G04]** Musim kemarau
Q: "simulasi musim kemarau"
INTENT: I09 + I03 – Simulasi + Debit Puncak
TOPIK: simulasi kemarau | KONTEKS: —
A: Kondisi musim kemarau di Wonotoro ditunjukkan oleh data Debit Puncak bulan September (rata-rata 0,138 m³/s) – terendah dalam setahun. Fitur Simulasi AQUAVISION bisa digunakan untuk memproyeksikan apakah ketersediaan air pada kondisi kemarau ini masih mencukupi kebutuhan warga dan wisatawan.

---

**[G05]** Singkat
Q: "simulasi"
INTENT: I09 – Simulasi
TOPIK: fitur simulasi | KONTEKS: —
A: Fitur Simulasi AQUAVISION memungkinkan Anda memproyeksikan ketersediaan air berdasarkan skenario seperti penambahan wisatawan, hotel baru, atau perubahan jumlah penduduk. Hasilnya menampilkan proyeksi status Aman/Waspada/Kritis. Apakah Anda ingin informasi cara menggunakannya?

---

**[G06]** Proyeksi jangka panjang
Q: "bisa prediksi air untuk 5 tahun ke depan?"
INTENT: I09 – Simulasi / I23 – Keterbatasan
TOPIK: simulasi jangka panjang | KONTEKS: —
A: Fitur Simulasi AQUAVISION saat ini difokuskan pada proyeksi skenario berbasis kondisi saat ini (parameter wisatawan, hotel, penduduk). Proyeksi jangka panjang 5 tahun dengan mempertimbangkan perubahan iklim atau pertumbuhan desa belum tersedia sebagai fitur eksplisit. Ini merupakan salah satu area pengembangan yang direkomendasikan untuk versi berikutnya.

---

## KATEGORI H – DATA PORTAL & DOWNLOAD (6 contoh)

---

**[H01]** Cara download
Q: "cara download data"
INTENT: I13 – Download/Export
TOPIK: cara unduh data | KONTEKS: —
A: Untuk mengunduh data dari AQUAVISION: (1) Buka fitur Data Portal. (2) Pilih layer data yang ingin diunduh. (3) Pilih format: CSV, GeoJSON, KML, atau Shapefile. (4) Klik tombol Download/Unduh.

---

**[H02]** Format tersedia
Q: "data tersedia dalam format apa aja?"
INTENT: I13 – Download/Export
TOPIK: format data | KONTEKS: —
A: AQUAVISION mendukung unduhan dalam format: CSV (tabel), GeoJSON (data spasial), KML (untuk Google Earth), dan Shapefile (untuk GIS desktop seperti QGIS/ArcGIS).

---

**[H03]** Shapefile
Q: "bisa download shapefile ga?"
INTENT: I13 – Download/Export
TOPIK: format shapefile | KONTEKS: —
A: Ya, AQUAVISION mendukung ekspor data dalam format Shapefile (.shp), yang bisa langsung digunakan di perangkat lunak GIS seperti QGIS atau ArcGIS.

---

**[H04]** Informal
Q: "ambil data gwp"
INTENT: I13 – Download/Export
TOPIK: unduh data GWP | KONTEKS: —
A: Data layer Potensi Air Tanah (GWP) bisa diunduh melalui fitur Data Portal AQUAVISION dalam format GeoJSON atau Shapefile. Buka Data Portal, pilih layer GWP, pilih format, lalu unduh.

---

**[H05]** CSV
Q: "data sumber air bisa di export ke csv?"
INTENT: I13 – Download/Export
TOPIK: ekspor CSV sumber air | KONTEKS: —
A: Ya. Data layer Sumber Air dapat diekspor ke format CSV yang berisi tabel atribut (nama, debit, jenis, kondisi, koordinat). Gunakan fitur Data Portal dan pilih format CSV.

---

**[H06]** Siapa bisa download
Q: "semua pengguna bisa download data?"
INTENT: I13 + I16 – Download + Akun
TOPIK: hak akses download | KONTEKS: —
A: Hak akses download bergantung pada level akun. Pengguna terdaftar umumnya memiliki akses lebih luas dibanding pengunjung umum. Detail hak akses per level tersedia pada dokumentasi spesifikasi sistem AQUAVISION.

---

## KATEGORI I – AI ASSISTANT (4 contoh)

---

**[I01]** Fitur AI
Q: "AI assistant di AQUAVISION bisa apa?"
INTENT: I19 – AI Assistant
TOPIK: kemampuan AI Assistant | KONTEKS: AQUAVISION
A: AI Assistant AQUAVISION dirancang untuk menjawab pertanyaan seputar sistem, data, dan informasi sumber daya air Desa Wonotoro. Anda bisa bertanya tentang potensi air tanah, debit puncak, cara penggunaan fitur, metodologi, atau informasi layer peta.

---

**[I02]** Cara akses AI
Q: "gimana cara tanya ke AI assistant?"
INTENT: I19 – AI Assistant
TOPIK: cara akses | KONTEKS: —
A: Fitur AI Assistant tersedia di dalam sistem AQUAVISION. Klik ikon atau menu AI Assistant, lalu ketik pertanyaan Anda di kolom chat yang tersedia.

---

**[I03]** Batas kemampuan AI
Q: "AI bisa jawab semua pertanyaan?"
INTENT: I19 – AI Assistant
TOPIK: keterbatasan AI | KONTEKS: —
A: AI Assistant AQUAVISION dapat menjawab pertanyaan yang berkaitan dengan sistem, data, dan informasi sumber daya air Desa Wonotoro berdasarkan knowledge base yang tersedia. Untuk pertanyaan di luar cakupan ini (misalnya pertanyaan umum yang tidak terkait AQUAVISION), AI mungkin tidak memiliki jawaban yang spesifik.

---

**[I04]** Bahasa
Q: "AI assistant bisa bahasa inggris?"
INTENT: I19 – AI Assistant
TOPIK: bahasa | KONTEKS: —
A: AI Assistant AQUAVISION utamanya dirancang untuk melayani dalam Bahasa Indonesia. Kemampuan menjawab dalam Bahasa Inggris bergantung pada konfigurasi sistem yang aktif.

---

## KATEGORI J – FAQ UMUM (10 contoh)

---

**[J01]** Tentang sistem
Q: "AQUAVISION itu apa?"
INTENT: I15 – Tentang AQUAVISION
TOPIK: definisi sistem | KONTEKS: —
A: AQUAVISION adalah sistem informasi sumber daya air berbasis WebGIS yang dikembangkan khusus untuk Desa Wisata Wonotoro, Kabupaten Probolinggo, Jawa Timur. Sistem ini memungkinkan pengguna mengakses peta interaktif, data hidrologi, dan hasil analisis potensi air tanah serta debit puncak aliran secara online melalui browser.

---

**[J02]** Pembuat sistem
Q: "siapa yang buat AQUAVISION?"
INTENT: I15 – Tentang AQUAVISION
TOPIK: pengembang | KONTEKS: —
A: AQUAVISION dikembangkan oleh tim mahasiswa Institut Teknologi Bandung (ITB) tahun 2026 sebagai proyek capstone: Najwa Maharani, Rayhan Fadhil Sukmana, dan M. Radja Adzka Fitrawan.

---

**[J03]** Login
Q: "cara login aquavision"
INTENT: I16 – Akun & Akses
TOPIK: cara login | KONTEKS: —
A: Untuk login ke AQUAVISION: (1) Buka halaman login sistem. (2) Masukkan username dan password akun Anda. (3) Klik Login. Jika belum memiliki akun, hubungi administrator sistem untuk pendaftaran.

---

**[J04]** Hak akses
Q: "siapa saja yang bisa pakai sistem ini?"
INTENT: I16 – Akun & Akses
TOPIK: hak akses | KONTEKS: —
A: AQUAVISION memiliki tiga level pengguna: (1) Administrator – akses penuh termasuk kelola data, (2) Pengguna Terdaftar – akses peta, analisis, dan download data, (3) Pengunjung Umum – akses terbatas untuk melihat informasi dasar.

---

**[J05]** Gratis/berbayar
Q: "AQUAVISION gratis?"
INTENT: I15 – Tentang AQUAVISION
TOPIK: biaya akses | KONTEKS: —
A: Informasi mengenai apakah AQUAVISION tersedia gratis atau berbayar untuk publik tidak disebutkan secara eksplisit dalam dokumentasi yang tersedia. Hubungi administrator sistem untuk informasi akses.

---

**[J06]** Lapor masalah
Q: "ada bug gimana lapor?"
INTENT: I24 – Kontak/Hubungi Admin
TOPIK: lapor masalah | KONTEKS: —
A: Untuk melaporkan bug atau masalah teknis, gunakan fitur "Hubungi Admin" yang tersedia di AQUAVISION. Isi formulir laporan dengan deskripsi masalah yang Anda alami.

---

**[J07]** Kelayakan sistem
Q: "AQUAVISION layak ga dipakai?"
INTENT: I20 – Analisis Finansial
TOPIK: kelayakan | KONTEKS: —
A: Berdasarkan analisis kelayakan finansial, AQUAVISION sangat layak secara ekonomi: BCR = 5,19 (>1 = layak), NPV = Rp 320,6 juta (positif = menguntungkan), ROI = 485,79% dalam 5 tahun. Secara fungsional, ketercapaian fitur mencapai 85,7% dari target awal.

---

**[J08]** Teknologi
Q: "AQUAVISION dibuat pakai teknologi apa?"
INTENT: I15 – Tentang AQUAVISION
TOPIK: teknologi | KONTEKS: —
A: AQUAVISION dibangun dengan: Backend – Django 4.2 + GeoDjango; Frontend – Leaflet.js 1.9 + HTML5 + CSS3; Database – PostgreSQL 14 + PostGIS 3.3; Sistem koordinat – EPSG:4326 (WGS84); Format data – GeoJSON (RFC 7946).

---

**[J09]** Fitur belum ada
Q: "ada fitur yang belum selesai?"
INTENT: I23 – Keterbatasan
TOPIK: fitur tidak terselesaikan | KONTEKS: —
A: Dua fitur yang direncanakan namun belum diimplementasikan: (1) Integrasi GeoServer untuk publikasi layer geospasial standar OGC, dan (2) Layer entitas persil lahan. Ketercapaian fitur keseluruhan adalah 85,7% (11 dari 14 fitur utama + 2 fitur tambahan).

---

**[J10]** Pengembangan selanjutnya
Q: "rencananya AQUAVISION mau dikembangkan apa lagi?"
INTENT: I23 – Keterbatasan + Saran
TOPIK: saran pengembangan | KONTEKS: —
A: Beberapa rekomendasi pengembangan AQUAVISION ke depan: integrasi GeoServer, pembaruan data real-time (sensor IoT), pengembangan aplikasi mobile, perluasan cakupan wilayah studi, integrasi kualitas air (selain kuantitas), dan peningkatan akurasi model dengan data yang lebih resolusi tinggi.

---

## KATEGORI K – METODOLOGI (6 contoh)

---

**[K01]** AHP
Q: "AHP itu metode apa?"
INTENT: I12 – Metodologi
TOPIK: AHP | KONTEKS: —
A: AHP (Analytical Hierarchy Process) adalah metode pengambilan keputusan berbasis perbandingan berpasangan antara beberapa kriteria. Dalam AQUAVISION, AHP digunakan untuk memberikan bobot pada 7 parameter penentu potensi air tanah, berdasarkan tingkat kepentingan masing-masing faktor menurut referensi ilmiah (Tesfa & Sewnet, 2025).

---

**[K02]** Metode Rasional
Q: "metode rasional itu apa?"
INTENT: I12 – Metodologi
TOPIK: Metode Rasional | KONTEKS: —
A: Metode Rasional adalah rumus Q = C × I × A / 360, yang digunakan untuk menghitung debit puncak aliran dari suatu DAS. Q = debit puncak (m³/s), C = koefisien limpasan, I = intensitas hujan (mm/jam), A = luas DAS (ha). Di AQUAVISION, rumus ini dikombinasikan dengan SCS-CN untuk menghasilkan 12 layer debit bulanan.

---

**[K03]** Neraca air
Q: "bagaimana cara hitung neraca air?"
INTENT: I12 – Metodologi
TOPIK: cara hitung neraca air | KONTEKS: —
A: Neraca air dihitung dengan membandingkan Total Supply (jumlah debit semua sumber air aktif dalam L/dtk) vs Total Demand (kebutuhan air warga + hotel + restoran + jasa). Status: Aman jika penggunaan <50% supply, Waspada jika 50–80%, Kritis jika >80%.

---

**[K04]** Reklasifikasi
Q: "reklasifikasi dalam GWP itu apa?"
INTENT: I12 – Metodologi
TOPIK: reklasifikasi | KONTEKS: GWP
A: Reklasifikasi adalah proses mengubah nilai asli setiap parameter (misalnya curah hujan dalam mm) ke dalam skala 1–5 yang seragam, di mana 1 = potensi paling rendah dan 5 = potensi paling tinggi. Setelah reklasifikasi, semua parameter bisa digabungkan dengan pembobotan AHP menggunakan Weighted Overlay.

---

**[K05]** Weighted overlay
Q: "weighted overlay itu apa?"
INTENT: I12 – Metodologi
TOPIK: weighted overlay | KONTEKS: —
A: Weighted Overlay adalah teknik GIS untuk menggabungkan beberapa layer peta dengan bobot berbeda. Setiap piksel pada layer diberi nilai berbobot, lalu dijumlahkan menghasilkan nilai indeks akhir. Dalam AQUAVISION, digunakan untuk menghasilkan Peta Potensi Air Tanah dari 7 parameter berbobot AHP.

---

**[K06]** DEM
Q: "DEM itu apa dipakai buat apa?"
INTENT: I12 – Metodologi + I22 – Sumber Data
TOPIK: DEM | KONTEKS: —
A: DEM (Digital Elevation Model) adalah model digital permukaan bumi yang menyimpan data ketinggian. AQUAVISION menggunakan dua sumber DEM: SRTM 30m (resolusi global) dan DEMNAS 8,1m (resolusi nasional dari BIG). DEM digunakan untuk: menghitung kelerengan (parameter GWP), kerapatan drainase, delineasi DAS, dan waktu konsentrasi aliran.

---

## KATEGORI L – PERTANYAAN AMBIGU (4 contoh)

---

**[L01]** Ambigu: "air wonotoro"
Q: "air wonotoro"
INTENT: Ambigu (Neraca Air 40% | GWP 35% | Sumber Air 25%)
TOPIK: tidak jelas | KONTEKS: Wonotoro
A: Pertanyaan ini bisa merujuk ke beberapa topik tentang air di Wonotoro. Berikut ringkasannya:
- **Ketersediaan air:** Lihat Neraca Air di Dashboard (status Aman/Waspada/Kritis)
- **Potensi air tanah:** 33,4% Tinggi, 10,6% Sangat Tinggi – cukup baik
- **Sumber air:** Lihat layer Sumber Air di peta untuk lokasi mata air
Ingin saya jelaskan salah satunya lebih detail?

---

**[L02]** Ambigu: "wonotoro" saja
Q: "wonotoro"
INTENT: Ambigu (Info Umum 50% | Lokasi 30% | AQUAVISION 20%)
TOPIK: tidak jelas | KONTEKS: Wonotoro
A: Wonotoro adalah desa wisata di Kecamatan Sukapura, Kabupaten Probolinggo, Jawa Timur – kawasan penyangga wisata Gunung Bromo. AQUAVISION adalah sistem informasi sumber daya air yang dikembangkan khusus untuk desa ini. Apa yang ingin Anda ketahui tentang Wonotoro – lokasinya, kondisi airnya, atau fasilitas wisatanya?

---

**[L03]** Ambigu: "peta wonotoro"
Q: "peta wonotoro"
INTENT: Ambigu (Dashboard 60% | Layer tertentu 40%)
TOPIK: peta | KONTEKS: Wonotoro
A: Peta Wonotoro tersedia di AQUAVISION dalam bentuk peta interaktif multi-layer. Anda bisa melihat berbagai informasi seperti sumber air, jaringan pipa, potensi air tanah, debit puncak, hotel, dan banyak lagi. Buka Dashboard AQUAVISION untuk mulai menjelajahi petanya. Layer mana yang ingin Anda tampilkan?

---

**[L04]** Ambigu: "kondisi wonotoro"
Q: "kondisi wonotoro"
INTENT: Ambigu (bisa kondisi air, kondisi wisata, kondisi infrastruktur)
TOPIK: tidak jelas | KONTEKS: Wonotoro
A: "Kondisi Wonotoro" bisa merujuk ke beberapa hal. Di AQUAVISION, informasi yang tersedia mencakup: kondisi ketersediaan air (Neraca Air), kondisi infrastruktur (pipa, tandon, sumber air), dan fasilitas wisata (hotel, tempat makan). Kondisi apa yang ingin Anda ketahui?
