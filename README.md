# PKBM Digital Dar El Iman - Frontend Web App

Aplikasi antarmuka web modern berbasis **React 18**, **Vite**, dan **Tailwind CSS** untuk platform PKBM Digital Yayasan Dar El Iman Padang.

---

## 🌟 Fitur Utama
- **12 Modul Terpadu**:
  - Landing Page Publik
  - Overview & Health Monitoring
  - PPDB Online (Penerimaan Santri Baru)
  - KBM & Modul Kurikulum Merdeka (Paket A, B, C)
  - Halaqah Tahfizh Interaktif (Setoran Hafalan & Tajwid)
  - Computer Based Test (CBT) & Validasi Token Ujian
  - Presensi Santri/Ustadz & Ekspor PDF Otomatis
  - Rapor Digital Kurikulum Kesetaraan
  - Keuangan & Pembayaran SPP
  - Balanced Scorecard (BSC) & Penjaminan Mutu Internal
  - Kemitraan & Program Diaspora
  - Sinkronisasi Dapodik Kemendikbudristek
  - Tutor AI Berbasis LLM (Groq) & Konsultasi Asatidzah Dua Arah
- **Role-Based Access Control (RBAC)**: Tampilan UI dinamis yang menyesuaikan 18 peran pengguna.
- **Dark Mode & Tema Adaptif**: Desain UI Islami modern yang ramah mata.

---

## 🛠️ Konfigurasi Environment (`.env`)
Salin file `.env.example` ke `.env.local` atau `.env`:
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_GROQ_API_KEY=
```

---

## 💻 Menjalankan Secara Lokal

```bash
# Instal dependensi
npm install

# Jalankan server development
npm run dev
```
Buka peramban di `http://localhost:5173`.

---

## 🐳 Deployment (Docker / Easypanel)

Repository ini telah dilengkapi dengan `Dockerfile` (multi-stage build dengan Nginx) dan `nginx.conf`:
```bash
docker build -t pkbm-frontend:latest .
docker run -p 80:80 pkbm-frontend:latest
```
Aplikasi akan aktif di port 80 dengan penanganan SPA routing dan kompresi Gzip.
