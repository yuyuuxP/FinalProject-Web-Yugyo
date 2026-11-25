# YUGYO Academy Atelier

YUGYO Academy Atelier adalah aplikasi pembelajaran dan pengelolaan kursus
pâtisserie serta bakery. Aplikasi menyediakan katalog kursus publik dan
dashboard terpisah untuk admin, instruktur, dan siswa.

## Fitur

- **Publik:** melihat katalog kursus, mendaftar sebagai siswa atau instruktur,
  dan masuk ke akun.
- **Admin:** mengelola akun dan kategori, meninjau pendaftaran, menyetujui atau
  menolak kursus, mengelola jadwal, melihat laporan, serta mengatur profil admin.
- **Instruktur:** mengelola kursus dan materi, mengunggah CV/portofolio, serta
  mengatur jadwal sesi.
- **Siswa:** melihat kursus, jadwal, materi, ulasan, dan profil akun.

Pendaftaran siswa dan instruktur dapat menunggu persetujuan admin sebelum akun
aktif.

## Teknologi

- Next.js 16 App Router
- React 19
- PostgreSQL
- Tailwind CSS 4
- `pg` untuk koneksi database

## Persyaratan

- Node.js 20.9 atau lebih baru
- npm
- PostgreSQL

## Menjalankan Secara Lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buat database PostgreSQL, misalnya `yugyo_atelier`, lalu buat file `.env.local`
   di root proyek:

   ```env
   DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/yugyo_atelier
   ```

   Ganti `USERNAME` dan `PASSWORD` dengan kredensial database lokal Anda.
   Jangan masukkan `.env.local` atau kredensial ke Git.

3. Buat tabel dan struktur database:

   ```bash
   psql -d yugyo_atelier -f src/database/yugyo_schema.sql
   ```

   Skema menggunakan ekstensi PostgreSQL `pgcrypto`. Pastikan pengguna
   PostgreSQL memiliki izin untuk mengaktifkannya.

4. (Opsional) Isi database dengan data contoh:

   ```bash
   psql -d yugyo_atelier -f src/database/yugyo_seed.sql
   ```

   Seed hanya untuk pengembangan lokal. Jalankan satu kali pada database kosong
   dan jangan gunakan data maupun kata sandi contoh di lingkungan produksi.

5. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000).

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan hasil build produksi |

## Halaman Utama

- `/` — beranda
- `/courses` — katalog kursus publik
- `/login` — masuk
- `/register/student` — registrasi siswa
- `/register/instructor` — registrasi instruktur
- `/dashboard/admin` — dashboard dan pengelolaan admin
- `/dashboard/teacher` — dashboard instruktur
- `/dashboard/student` — dashboard siswa

## Struktur Proyek

```text
src/
├── app/
│   ├── (auth)/       # Halaman login dan registrasi
│   ├── (public)/     # Halaman publik, termasuk katalog kursus
│   ├── api/          # Route API
│   └── dashboard/    # Halaman admin, instruktur, dan siswa
├── components/       # Komponen antarmuka
├── database/         # Skema dan data awal PostgreSQL
└── lib/              # Koneksi database dan utilitas
public/               # Aset statis dan gambar kursus/kategori
```

## Penyimpanan File

- Gambar kursus dan kategori disimpan di `public/pictures/courses` dan
  `public/pictures/categories`.
- CV/portofolio instruktur disimpan di `.private_uploads/instructor-portfolios`
  dan tidak disajikan sebagai aset publik.

Pastikan proses aplikasi memiliki izin menulis ke direktori tersebut. Pada
deployment, gunakan penyimpanan persisten dan cadangkan file bersama database.
