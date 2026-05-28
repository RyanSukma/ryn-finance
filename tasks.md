# tasks.md
# Rencana Pengerjaan — Sistem Rekap Keuangan Keluarga

> **Status**: Belum dimulai
> **Legend**: ⬜ Belum · 🔄 Sedang dikerjakan · ✅ Selesai

---

## FASE 0 — Persiapan & Setup (Estimasi: 1–2 jam)

### 0.1 Akun & Tools
- ⬜ Install Node.js v20+ di komputer
- ⬜ Install Git
- ⬜ Install VS Code (atau editor pilihan)
- ⬜ Buat akun GitHub (jika belum ada)
- ⬜ Buat akun Railway (https://railway.app) — login via GitHub
- ⬜ Buat akun Vercel (https://vercel.com) — login via GitHub
- ⬜ Buat akun Supabase (https://supabase.com)
- ⬜ Buat akun Google Cloud (https://console.cloud.google.com)

### 0.2 Telegram Bot
- ⬜ Buka Telegram, cari `@BotFather`
- ⬜ Kirim `/newbot` → ikuti instruksi
- ⬜ Simpan `BOT_TOKEN` yang diberikan
- ⬜ Set deskripsi bot via `/setdescription`
- ⬜ Catat Telegram ID semua anggota keluarga (via @userinfobot)

### 0.3 Supabase
- ⬜ Buat project baru di Supabase
- ⬜ Jalankan SQL schema (dari design.md bagian 4)
- ⬜ Salin `SUPABASE_URL` dan `SUPABASE_KEY`
- ⬜ Insert data awal: semua anggota keluarga ke tabel `users`

### 0.4 Google Cloud Vision
- ⬜ Buat project baru di Google Cloud Console
- ⬜ Enable "Cloud Vision API"
- ⬜ Buat API Key → simpan sebagai `GOOGLE_VISION_KEY`

---

## FASE 1 — Backend Inti (Estimasi: 3–4 jam)

### 1.1 Setup Project Backend
- ⬜ Inisialisasi project: `npm init -y`
- ⬜ Install dependencies: `grammy`, `express`, `@supabase/supabase-js`, `dotenv`
- ⬜ Buat file `.env` dari `.env.example`
- ⬜ Buat struktur folder sesuai design.md bagian 3
- ⬜ Setup `index.js` — jalankan Express + Grammy bersamaan

### 1.2 Whitelist Middleware
- ⬜ Buat `middleware/whitelist.js`
- ⬜ Query Supabase: cek `telegram_id` di tabel `users`
- ⬜ Jika tidak ada → balas pesan penolakan, stop eksekusi
- ⬜ Jika ada → attach data user ke context, lanjutkan

### 1.3 Text Parser Service
- ⬜ Buat `services/parser.js`
- ⬜ Implementasi regex untuk format: angka biasa, titik ribuan, rb/ribu, jt/juta
- ⬜ Unit test manual: `50000`, `50.000`, `50rb`, `1.5jt`, `2juta`
- ⬜ Return `{ amount: Number, description: String }` atau `null` jika tidak valid

### 1.4 Handler Pesan Teks
- ⬜ Buat `handlers/text.js`
- ⬜ Panggil `parser.js` untuk ekstrak amount + description
- ⬜ Jika parsing gagal → balas panduan format
- ⬜ Jika berhasil → simpan ke Supabase → balas konfirmasi
- ⬜ Format pesan konfirmasi sesuai design.md bagian 8

### 1.5 Handler Perintah Bot
- ⬜ Buat `handlers/commands.js`
- ⬜ `/start` → sambutan + panduan singkat
- ⬜ `/bantuan` → tampilkan semua format dan perintah
- ⬜ `/rekap` → query transaksi bulan ini, format ringkasan
- ⬜ `/hapus` → tampilkan transaksi terakhir + tombol konfirmasi inline keyboard
- ⬜ Callback handler untuk konfirmasi hapus

---

## FASE 2 — OCR & Foto (Estimasi: 2–3 jam)

### 2.1 OCR Service
- ⬜ Buat `services/ocr.js`
- ⬜ Implementasi call ke Google Cloud Vision API (TEXT_DETECTION)
- ⬜ Buat fungsi `extractTotal(textAnnotations)`:
  - Prioritas: cari kata "TOTAL", "GRAND TOTAL", "JUMLAH"
  - Fallback: ambil angka terbesar dalam dokumen
- ⬜ Return `{ amount: Number, confidence: 'high'|'low' }`

### 2.2 Handler Foto
- ⬜ Buat `handlers/photo.js`
- ⬜ Download foto dari Telegram: `getFile()` → `fetch(fileUrl)`
- ⬜ Kirim buffer ke `ocr.js`
- ⬜ Jika confidence `high`:
  - Tampilkan hasil + tombol konfirmasi inline keyboard [✅ Ya] [✏️ Koreksi]
- ⬜ Jika confidence `low`:
  - Minta input manual
- ⬜ Handle callback konfirmasi: simpan ke Supabase
- ⬜ Handle state "menunggu koreksi manual" dari pengguna

---

## FASE 3 — Express API untuk Dashboard (Estimasi: 2 jam)

### 3.1 Setup Express Router
- ⬜ Buat `api/middleware/auth.js` — validasi `API_KEY` di header
- ⬜ Setup router di `api/routes/`

### 3.2 Endpoints Transaksi
- ⬜ `GET /api/v1/transactions` — dengan query params: `user_id`, `date_from`, `date_to`
- ⬜ `GET /api/v1/transactions/summary` — total per user + total keluarga
- ⬜ `DELETE /api/v1/transactions/:id`

### 3.3 Endpoints Users
- ⬜ `GET /api/v1/users`
- ⬜ `POST /api/v1/users` — tambah anggota baru

### 3.4 Endpoints Reports
- ⬜ `GET /api/v1/reports` — daftar semua laporan bulanan
- ⬜ `GET /api/v1/reports/:period` — detail laporan (format: 2026-05)

---

## FASE 4 — PDF Generator & Scheduler (Estimasi: 3 jam)

### 4.1 PDF Generator
- ⬜ Install Puppeteer: `npm install puppeteer`
- ⬜ Buat `services/pdf.js`
- ⬜ Buat template HTML laporan bulanan (`templates/report.html`)
  - Header: nama bulan, logo/judul keluarga
  - Ringkasan: total keluarga, total per anggota
  - Tabel: daftar semua transaksi (tanggal, nama, keterangan, nominal)
- ⬜ Fungsi `generatePDF(data)` → return Buffer PDF
- ⬜ Upload PDF ke Supabase Storage → return URL
- ⬜ Test generate PDF secara manual

### 4.2 Rekap Engine (Scheduler)
- ⬜ Install node-cron: `npm install node-cron`
- ⬜ Buat `services/scheduler.js`
- ⬜ Setup cron job: `0 7 1 * *` (pukul 07:00 tanggal 1 tiap bulan, WIB)
- ⬜ Implementasi fungsi `runMonthlyRecap()`:
  1. Query semua transaksi bulan lalu
  2. Generate PDF
  3. Kirim ke semua user aktif via Telegram
  4. Insert ke tabel `monthly_reports`
- ⬜ Buat endpoint manual trigger: `POST /api/v1/reports/generate` (untuk testing)

---

## FASE 5 — Dashboard Web (Estimasi: 4–5 jam)

### 5.1 Setup Next.js
- ⬜ `npx create-next-app@latest dashboard --tailwind --app`
- ⬜ Install dependencies: `recharts` (grafik), `date-fns` (format tanggal)
- ⬜ Buat `lib/api.js` — wrapper fetch ke backend API

### 5.2 Halaman Overview (/)
- ⬜ Buat komponen `SummaryCard.jsx` — total bulan ini
- ⬜ Tampilkan total pengeluaran keluarga bulan berjalan
- ⬜ Tampilkan kartu per anggota keluarga + total masing-masing
- ⬜ Tampilkan 10 transaksi terbaru

### 5.3 Halaman Riwayat (/riwayat)
- ⬜ Buat komponen `TransactionTable.jsx`
- ⬜ Filter berdasarkan: anggota, tanggal dari, tanggal sampai
- ⬜ Pagination (20 transaksi per halaman)
- ⬜ Tombol hapus per transaksi (dengan konfirmasi)

### 5.4 Halaman Analisis (/analisis)
- ⬜ Install dan setup Recharts
- ⬜ Grafik bar: pengeluaran mingguan bulan ini
- ⬜ Grafik line: tren pengeluaran 6 bulan terakhir
- ⬜ Tabel perbandingan antar anggota keluarga

---

## FASE 6 — Deploy & Testing (Estimasi: 2 jam)

### 6.1 Deploy Backend ke Railway
- ⬜ Push kode ke GitHub
- ⬜ Hubungkan repo ke Railway
- ⬜ Set semua environment variables di Railway dashboard
- ⬜ Set Telegram Webhook ke URL Railway: `setWebhook`
- ⬜ Verifikasi bot merespons di Telegram

### 6.2 Deploy Dashboard ke Vercel
- ⬜ Push folder `dashboard` ke GitHub (repo terpisah atau subfolder)
- ⬜ Hubungkan ke Vercel
- ⬜ Set environment variables
- ⬜ Verifikasi dashboard bisa load data dari backend

### 6.3 Testing End-to-End
- ⬜ Test kirim teks: `50000 makan` → cek konfirmasi + database
- ⬜ Test kirim foto struk → cek OCR + konfirmasi
- ⬜ Test semua perintah: `/rekap`, `/hapus`, `/bantuan`
- ⬜ Test manual trigger PDF: `POST /api/v1/reports/generate`
- ⬜ Test dashboard: semua halaman load dengan benar
- ⬜ Test dari nomor Telegram anggota keluarga lain
- ⬜ Test nomor tidak dikenal → pastikan ditolak

### 6.4 Onboarding Keluarga
- ⬜ Share link/username bot ke semua anggota keluarga
- ⬜ Buat pesan panduan singkat untuk dikirim ke grup keluarga
- ⬜ Pantau 3 hari pertama, cek log Railway jika ada error

---

## Ringkasan Estimasi Total

| Fase | Deskripsi | Estimasi |
|---|---|---|
| Fase 0 | Persiapan & setup akun | 1–2 jam |
| Fase 1 | Backend inti + bot | 3–4 jam |
| Fase 2 | OCR & handler foto | 2–3 jam |
| Fase 3 | Express API | 2 jam |
| Fase 4 | PDF + scheduler | 3 jam |
| Fase 5 | Dashboard web | 4–5 jam |
| Fase 6 | Deploy & testing | 2 jam |
| **Total** | | **17–21 jam** |

> Dikerjakan santai sambil belajar: estimasi 2–3 minggu (1–2 jam per hari)
> Dikerjakan intensif: bisa selesai dalam 3–4 hari
