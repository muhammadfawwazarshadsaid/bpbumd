# BPBUMD Control Tower — Sistem Monitoring BUMD Terpadu

Sistem untuk monitoring dan manajemen BUMD (Badan Usaha Milik Daerah).

## 🛠 Tech Stack
- **Backend:** Node.js (Express.js)
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript (Vanilla)

## 📋 Prasyarat
Sebelum menjalankan proyek ini, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (Versi >= 18.0.0)
- [Docker](https://www.docker.com/) & Docker Compose (Disarankan untuk menjalankan PostgreSQL secara lokal)
- PostgreSQL Client (DBeaver, pgAdmin, atau psql) untuk menjalankan file migrasi database.

## 🚀 Panduan Setup Lokal

### 1. Install Dependencies
Pastikan Anda berada di direktori utama (root) proyek, lalu jalankan perintah berikut untuk menginstal seluruh dependency:
```bash
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Aplikasi membutuhkan konfigurasi *environment variables*. Buat file bernama `.env` di direktori utama, lalu isi dengan konfigurasi berikut (sesuaikan port jika bentrok):

```env
PORT=8080
DB_HOST=localhost (ganti dengan host BUMD jika bukan setup lokal)
DB_PORT=5484
DB_USER=bpbumd
DB_PASSWORD=bpbumd
DB_NAME=bpbumd

JWT_SECRET=02b4619318e9ba8c4fad882097a53062261b41e970d8449852f590e0e06017cb666a5334919922bdb53c03a0b14e692806394c1b08a09ff2e3a9c28100548374
JWT_EXPIRES_IN=1d
```

### 3. Setup Database Menggunakan Docker
Jika Anda ingin menjalankan database secara lokal menggunakan Docker, jalankan perintah berikut:
```bash
docker-compose -f docker-compose-local-pg.yml up -d
```
Perintah ini akan menjalankan *container* PostgreSQL di background menggunakan credentials dan port yang disesuaikan pada file `docker-compose-local-pg.yml`.

### 4. Menjalankan Migrasi Database (Setup Database Lokal)
Proyek ini mengatur *schema* database menggunakan file SQL murni yang berada di direktori `src/migrations/`.
1. Buka database client pilihan Anda (pgAdmin, DBeaver, dll) lalu hubungkan ke database PostgreSQL lokal (`localhost:5484` sesuai `.env`).
2. Buat database baru bernama `bpbumd` (jika belum otomatis dibuat).
3. Jalankan file migrasi secara berurutan:
   - `001_create_initial_schema.sql`
   - `002_index_initial_schema.sql`
   - `003_trigger_auto_updated_at.sql`
   - dst.
4. **(Opsional)** Jika Anda membutuhkan *mock data* (data dummy), jalankan file SQL yang berada di dalam folder `src/migrations/mock/`. *Terdapat juga script `node generate_mock_final.js` jika Anda ingin *generate* data mock baru dari file Excel.*

### 5. Menjalankan Aplikasi
Setelah database siap, Anda bisa menjalankan server aplikasi Node.js:

```bash
npm start
# atau
npm run dev
```

Aplikasi akan berjalan dan bisa diakses melalui browser pada alamat:
👉 **[http://localhost:8080/diagnosticreview-demo/login.html](http://localhost:8080/diagnosticreview-demo/login.html)** *(Sesuaikan port jika berbeda di `.env`)*

---

## 📁 Penjelasan Direktori Utama
- `public/`: Direktori yang berisi seluruh file frontend (HTML, CSS, JS, Gambar). File di-serve secara statis oleh Express.
- `src/`: Source code inti backend Node.js (Controllers, Routes, Middleware, Migrasi, dll).
- `uploads/`: Direktori tempat penyimpanan file-file dokumen yang diunggah oleh pengguna aplikasi.
- `deploy/` files: Kumpulan *script* terkait deployment untuk environment pada server.
