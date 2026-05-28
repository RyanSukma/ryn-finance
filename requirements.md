# requirements.md
# Sistem Rekap Keuangan Keluarga via Telegram

> **Status**: Draft v1.0
> **Tanggal**: 2026-05-26
> **Scope**: MVP (Minimum Viable Product)

---

## 1. Gambaran Produk

Sistem yang memungkinkan anggota keluarga mencatat pengeluaran harian melalui Telegram Bot — baik berupa teks maupun foto struk belanjaan — lalu merekap semua data tersebut secara otomatis setiap akhir bulan dalam bentuk PDF yang dikirim balik ke Telegram, serta dapat dipantau melalui dashboard web.

---

## 2. Pengguna Sistem

| Peran | Deskripsi |
|---|---|
| **Anggota Keluarga** | Pengirim data pengeluaran via Telegram |
| **Admin (pemilik sistem)** | Mengelola whitelist anggota, melihat semua data |

---

## 3. Kebutuhan Fungsional (Format EARS)

### 3.1 — Registrasi & Akses

**REQ-01**
SAAT anggota keluarga pertama kali mengirim pesan ke bot,
MAKA SISTEM HARUS memeriksa apakah nomor Telegram ID mereka ada di daftar whitelist.

**REQ-02**
SAAT Telegram ID pengguna tidak ada di whitelist,
MAKA SISTEM HARUS membalas dengan pesan penolakan dan menginstruksikan untuk menghubungi admin.

**REQ-03**
SAAT Telegram ID pengguna ada di whitelist,
MAKA SISTEM HARUS menyambut pengguna dengan nama mereka dan menampilkan panduan singkat penggunaan.

---

### 3.2 — Pencatatan via Teks

**REQ-04**
SAAT anggota keluarga mengirim teks dengan format `[nominal] [keterangan]`
contoh: `50000 makan siang`, `25rb bensin`, `1.5jt belanja bulanan`,
MAKA SISTEM HARUS mem-parsing nominal dan keterangan, menyimpan ke database, dan membalas konfirmasi.

**REQ-05**
SAAT SISTEM menerima format nominal,
MAKA SISTEM HARUS mampu mengenali format berikut:
- Angka biasa: `50000`
- Titik ribuan: `50.000`
- Suffix rb/ribu: `50rb`, `50ribu`
- Suffix jt/juta: `1.5jt`, `2juta`

**REQ-06**
SAAT format pesan tidak dikenali oleh sistem,
MAKA SISTEM HARUS membalas dengan pesan panduan format yang benar, disertai contoh.

**REQ-07**
SAAT penyimpanan transaksi berhasil,
MAKA SISTEM HARUS membalas konfirmasi yang mencantumkan: nominal, keterangan, waktu, dan nama pengirim.

---

### 3.3 — Pencatatan via Foto Struk

**REQ-08**
SAAT anggota keluarga mengirim foto ke bot,
MAKA SISTEM HARUS memproses foto tersebut melalui OCR untuk mengekstrak nominal total.

**REQ-09**
SAAT OCR berhasil mendeteksi nominal dari foto,
MAKA SISTEM HARUS menampilkan nominal yang terdeteksi dan meminta konfirmasi pengguna sebelum menyimpan.

**REQ-10**
SAAT OCR gagal mendeteksi nominal atau hasilnya ambigu,
MAKA SISTEM HARUS meminta pengguna mengetik nominal secara manual disertai keterangan.

**REQ-11**
SAAT pengguna mengirim foto beserta caption (contoh: foto struk + caption "belanja mingguan"),
MAKA SISTEM HARUS menggunakan caption tersebut sebagai keterangan transaksi.

---

### 3.4 — Perintah Bot

**REQ-12**
SAAT pengguna mengirim perintah `/rekap`,
MAKA SISTEM HARUS membalas ringkasan pengeluaran bulan berjalan milik pengguna tersebut.

**REQ-13**
SAAT pengguna mengirim perintah `/rekap bulan [nama_bulan]` contoh `/rekap bulan april`,
MAKA SISTEM HARUS membalas ringkasan pengeluaran bulan yang diminta.

**REQ-14**
SAAT pengguna mengirim perintah `/hapus`,
MAKA SISTEM HARUS menampilkan transaksi terakhir dan meminta konfirmasi sebelum menghapus.

**REQ-15**
SAAT pengguna mengirim perintah `/bantuan` atau `/help`,
MAKA SISTEM HARUS menampilkan daftar perintah dan contoh format penggunaan.

---

### 3.5 — Rekap Otomatis Akhir Bulan

**REQ-16**
SAAT tanggal berubah menjadi hari pertama bulan baru (pukul 07.00 WIB),
MAKA SISTEM HARUS secara otomatis membuat laporan PDF rekap bulan lalu untuk seluruh keluarga.

**REQ-17**
SAAT PDF rekap selesai dibuat,
MAKA SISTEM HARUS mengirimkan PDF tersebut ke seluruh anggota keluarga yang terdaftar di whitelist.

**REQ-18**
SAAT PDF rekap dikirim,
MAKA PDF tersebut HARUS mencantumkan: total pengeluaran keluarga, rincian per anggota, daftar transaksi harian, dan grafik sederhana.

---

### 3.6 — Dashboard Web

**REQ-19**
SAAT admin membuka dashboard web,
MAKA SISTEM HARUS menampilkan total pengeluaran keluarga bulan berjalan.

**REQ-20**
SAAT admin membuka dashboard web,
MAKA SISTEM HARUS menampilkan riwayat transaksi harian yang dapat difilter berdasarkan anggota dan rentang tanggal.

**REQ-21**
SAAT admin membuka halaman analisis dashboard,
MAKA SISTEM HARUS menampilkan grafik tren pengeluaran mingguan dan bulanan.

---

## 4. Kebutuhan Non-Fungsional

**REQ-22** — Kecepatan
SISTEM HARUS membalas setiap pesan teks dalam waktu kurang dari 3 detik.

**REQ-23** — Ketersediaan
SISTEM HARUS berjalan 24 jam sehari, 7 hari seminggu (dengan toleransi downtime free tier Railway).

**REQ-24** — Keamanan
SISTEM HARUS menolak semua pesan dari Telegram ID yang tidak terdaftar di whitelist.

**REQ-25** — Bahasa
SISTEM HARUS merespons dalam Bahasa Indonesia.

---

## 5. Di Luar Scope MVP (Fitur Fase Berikutnya)

- Kategorisasi otomatis (makan, transport, belanja, dll)
- Budget limit per kategori dengan notifikasi
- Multi-bahasa (Inggris)
- Login dashboard dengan autentikasi
- Export Excel
