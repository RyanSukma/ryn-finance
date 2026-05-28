# design.md
# Desain Teknis Sistem Rekap Keuangan Keluarga

> **Status**: Draft v1.0
> **Tanggal**: 2026-05-26

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| **Telegram Bot** | Grammy.js (Node.js) | Modern, TypeScript-ready, dokumentasi lengkap |
| **Backend API** | Node.js + Express | Familiar, ekosistem besar, cocok untuk REST API |
| **Database** | Supabase (PostgreSQL) | Free tier 500MB, real-time, built-in REST API |
| **OCR** | Google Cloud Vision API | Akurasi tinggi, 1000 unit/bulan gratis |
| **Dashboard** | Next.js + Tailwind CSS | SSR, deploy gratis di Vercel |
| **PDF Generator** | Puppeteer | HTML-to-PDF, fleksibel untuk desain laporan |
| **Scheduler** | node-cron | Built-in, ringan, tidak perlu service tambahan |
| **Hosting Backend** | Railway | Free tier, auto-deploy dari GitHub |
| **Hosting Dashboard** | Vercel | Free tier, optimal untuk Next.js |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────┐
│           TELEGRAM CLIENTS              │
│    (Anggota keluarga via HP masing2)    │
└───────────────────┬─────────────────────┘
                    │ HTTPS (Webhook)
                    ▼
┌─────────────────────────────────────────┐
│           BACKEND (Railway)             │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │ Grammy Bot  │   │  Express API    │  │
│  │  Handler    │──▶│  /api/v1/...    │  │
│  └─────────────┘   └────────┬────────┘  │
│         │                   │           │
│  ┌──────▼──────┐   ┌────────▼────────┐  │
│  │ Text Parser │   │  OCR Service    │  │
│  │  (regex)    │   │ Google Vision   │  │
│  └──────┬──────┘   └────────┬────────┘  │
│         └─────────┬─────────┘           │
│                   ▼                     │
│          ┌─────────────────┐            │
│          │  Supabase SDK   │            │
│          └────────┬────────┘            │
│                   │                     │
│          ┌────────▼────────┐            │
│          │   node-cron     │            │
│          │ (rekap bulanan) │            │
│          └────────┬────────┘            │
│                   │                     │
│          ┌────────▼────────┐            │
│          │   Puppeteer     │            │
│          │ (PDF generator) │            │
│          └─────────────────┘            │
└─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌────────────────┐   ┌──────────────────┐
│   SUPABASE     │   │  VERCEL          │
│  (PostgreSQL)  │   │  Dashboard       │
│                │   │  Next.js         │
│  - users       │   │                  │
│  - transactions│   │  fetch ──────────┼──▶ Express API
│  - reports     │   │                  │
└────────────────┘   └──────────────────┘
```

---

## 3. Struktur Folder Project

```
rekap-keluarga/
├── backend/                    # Node.js + Express + Grammy Bot
│   ├── src/
│   │   ├── bot/
│   │   │   ├── index.js        # Entry point Grammy bot
│   │   │   ├── handlers/
│   │   │   │   ├── text.js     # Handler pesan teks
│   │   │   │   ├── photo.js    # Handler foto struk
│   │   │   │   └── commands.js # Handler /rekap /hapus /bantuan
│   │   │   └── middleware/
│   │   │       └── whitelist.js # Cek Telegram ID
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── transactions.js
│   │   │   │   ├── users.js
│   │   │   │   └── reports.js
│   │   │   └── middleware/
│   │   │       └── auth.js     # API key untuk dashboard
│   │   ├── services/
│   │   │   ├── parser.js       # Parse teks → {amount, description}
│   │   │   ├── ocr.js          # Google Vision API
│   │   │   ├── pdf.js          # Generate PDF rekap
│   │   │   └── scheduler.js    # node-cron jobs
│   │   ├── db/
│   │   │   └── supabase.js     # Supabase client
│   │   └── index.js            # Entry point Express
│   ├── .env.example
│   ├── package.json
│   └── railway.json
│
└── dashboard/                  # Next.js
    ├── src/
    │   ├── app/
    │   │   ├── page.jsx        # Halaman utama (overview)
    │   │   ├── riwayat/
    │   │   │   └── page.jsx    # Riwayat transaksi
    │   │   └── analisis/
    │   │       └── page.jsx    # Grafik & tren
    │   ├── components/
    │   │   ├── TransactionTable.jsx
    │   │   ├── SummaryCard.jsx
    │   │   └── Chart.jsx
    │   └── lib/
    │       └── api.js          # Fetch ke backend API
    └── package.json
```

---

## 4. Database Schema

### Tabel: `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,   -- ID unik dari Telegram
  name        VARCHAR(100) NOT NULL,    -- Nama anggota keluarga
  is_active   BOOLEAN DEFAULT true,     -- Whitelist toggle
  is_admin    BOOLEAN DEFAULT false,    -- Hak akses admin
  created_at  TIMESTAMP DEFAULT now()
);
```

### Tabel: `transactions`
```sql
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,         -- Dalam rupiah (tanpa desimal)
  description TEXT NOT NULL,
  source      VARCHAR(10) NOT NULL,     -- 'text' atau 'photo'
  photo_url   TEXT,                     -- URL foto jika dari struk (opsional)
  created_at  TIMESTAMP DEFAULT now()
);
```

### Tabel: `monthly_reports`
```sql
CREATE TABLE monthly_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period       VARCHAR(7) NOT NULL,     -- Format: '2026-05'
  total_amount INTEGER NOT NULL,        -- Total pengeluaran keluarga
  pdf_url      TEXT,                    -- URL file PDF di Supabase Storage
  generated_at TIMESTAMP DEFAULT now(),
  sent_at      TIMESTAMP               -- Kapan PDF dikirim ke Telegram
);
```

---

## 5. Alur Data Detail

### 5.1 — Alur Pesan Teks

```
Pengguna kirim: "50rb makan siang"
        │
        ▼
[Whitelist Check]
  Telegram ID ada? ──Tidak──▶ Balas "Akses ditolak"
        │ Ya
        ▼
[Text Parser]
  regex: /^(\d[\d.,]*\s*(rb|ribu|jt|juta)?)\s+(.+)$/i
  hasil: { amount: 50000, description: "makan siang" }
        │
        ▼
[Validasi]
  amount > 0? ──Tidak──▶ Balas "Format salah" + contoh
        │ Ya
        ▼
[Simpan ke Supabase]
  INSERT INTO transactions ...
        │
        ▼
[Balas Konfirmasi]
  "✅ Tercatat!
   💰 Rp 50.000
   📝 Makan siang
   👤 Budi · 26 Mei 2026 12:30"
```

### 5.2 — Alur Foto Struk

```
Pengguna kirim: [foto struk]  (+ caption opsional)
        │
        ▼
[Whitelist Check]
        │ Lolos
        ▼
[Download foto dari Telegram]
  getFile() → download buffer
        │
        ▼
[Google Vision API]
  TEXT_DETECTION → ekstrak semua teks
        │
        ▼
[Parser Nominal]
  Cari pola "TOTAL", "GRAND TOTAL", angka terbesar
  hasil: { amount: 125000, confidence: 'high'/'low' }
        │
        ├─ confidence: high ──▶ Tanya konfirmasi:
        │                       "Saya baca Rp 125.000, betul?"
        │                       [✅ Ya] [✏️ Koreksi]
        │
        └─ confidence: low  ──▶ Minta input manual:
                                "Tidak bisa baca total struk.
                                 Ketik nominalnya ya, contoh: 125000 belanja"
```

### 5.3 — Alur Rekap Bulanan (Cron Job)

```
[node-cron] Setiap tanggal 1, pukul 07.00 WIB
        │
        ▼
[Query Supabase]
  SELECT semua transactions bulan lalu
  GROUP BY user_id
        │
        ▼
[Generate HTML Report]
  Render template HTML dengan data rekap
        │
        ▼
[Puppeteer: HTML → PDF]
  Simpan PDF ke Supabase Storage
        │
        ▼
[Kirim PDF via Telegram Bot]
  Loop semua users aktif → sendDocument(pdf)
        │
        ▼
[Update monthly_reports]
  INSERT laporan dengan pdf_url dan sent_at
```

---

## 6. API Endpoints (untuk Dashboard)

```
Base URL: https://[backend-url].railway.app/api/v1

GET  /transactions              → Semua transaksi (filter: user, date_from, date_to)
GET  /transactions/summary      → Total per user, total keluarga bulan ini
GET  /transactions/:id          → Detail 1 transaksi
DELETE /transactions/:id        → Hapus transaksi

GET  /users                     → Daftar anggota keluarga
POST /users                     → Tambah anggota baru (admin)
PATCH /users/:id                → Update status aktif

GET  /reports                   → Daftar laporan bulanan
GET  /reports/:period           → Laporan bulan tertentu (format: 2026-05)
```

---

## 7. Environment Variables

```env
# Backend (.env)
BOT_TOKEN=          # Dari @BotFather Telegram
SUPABASE_URL=       # Dari dashboard Supabase
SUPABASE_KEY=       # Service role key Supabase
GOOGLE_VISION_KEY=  # Google Cloud API Key
DASHBOARD_API_KEY=  # Key custom untuk autentikasi dashboard
PORT=3000
TZ=Asia/Jakarta

# Dashboard (.env.local)
NEXT_PUBLIC_API_URL=  # URL backend Railway
API_KEY=              # Sama dengan DASHBOARD_API_KEY
```

---

## 8. Format Pesan Bot

### Konfirmasi berhasil simpan
```
✅ Tercatat!
💰 Rp 50.000
📝 Makan siang
👤 Budi  ·  Sel, 26 Mei 2026  ·  12:30 WIB

Total hari ini: Rp 125.000
```

### Rekap `/rekap`
```
📊 Rekap Mei 2026 — Budi

Total kamu  : Rp 1.250.000
Transaksi   : 24 kali

5 terakhir:
• 26 Mei — Makan siang       Rp 50.000
• 26 Mei — Bensin            Rp 80.000
• 25 Mei — Belanja mingguan  Rp 350.000
• 24 Mei — Nonton            Rp 100.000
• 24 Mei — Parkir            Rp 5.000

Lihat semua: [dashboard-url]
```
