<div align="center">

# YUGYO Academy Atelier

### Belajar pastry, kelola kelas, dan tumbuh bersama para chef.

Platform pembelajaran pâtisserie dan bakery dengan katalog kursus publik serta
portal khusus untuk admin, instruktur, dan siswa.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169e1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-not%20specified-lightgrey)](#lisensi)

**[Mulai](#mulai) · [Fitur](#fitur) · [Panduan](#panduan-penggunaan) · [Struktur](#struktur-proyek)**

</div>

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur](#fitur)
- [Preview](#preview)
- [Teknologi](#teknologi)
- [Mulai](#mulai)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Pengembang](#pengembang)

## Tentang Proyek

YUGYO Academy Atelier adalah aplikasi untuk menemukan dan mengelola kelas
pâtisserie serta bakery. Platform ini menyatukan katalog kursus, proses
verifikasi akun, pengelolaan materi dan jadwal, serta aktivitas belajar siswa
dalam satu aplikasi.

Proyek ini dibuat untuk memberi setiap peran alur kerja yang sesuai: admin
mengelola operasional, instruktur menyiapkan kelas, dan siswa mengikuti materi
serta memantau progresnya.

### Alur Pengguna

```mermaid
flowchart LR
    Visitor[Pengunjung] --> Catalog[Katalog Kursus]
    Visitor --> Register[Registrasi Siswa atau Instruktur]
    Register --> Pending[Menunggu Persetujuan Admin]
    Pending --> Approved[Akun Disetujui]
    Approved --> Login[Masuk]
    Login --> Student[Portal Siswa]
    Login --> Teacher[Portal Instruktur]
    Admin[Portal Admin] --> Pending
    Admin --> CourseApproval[Persetujuan Kursus]
```

## Fitur

<details open>
<summary><strong>Publik dan autentikasi</strong></summary>

- Jelajahi katalog kursus tanpa harus masuk.
- Daftar sebagai siswa atau instruktur.
- Tampilkan notifikasi setelah registrasi berhasil.
- Akun yang menunggu persetujuan tidak dapat masuk sebelum disetujui admin.
- Form login menyediakan opsi untuk menampilkan atau menyembunyikan kata sandi.

</details>

<details>
<summary><strong>Portal admin</strong></summary>

- Kelola akun aktif serta pendaftaran siswa dan instruktur yang menunggu
  persetujuan.
- Kelola kategori dan informasi kursus.
- Setujui atau tolak kursus yang diajukan.
- Kelola jadwal, laporan, dan profil admin.

</details>

<details>
<summary><strong>Portal instruktur</strong></summary>

- Kelola kursus dan materi pembelajaran.
- Tambah atau edit materi melalui dialog.
- Buat sesi terjadwal; sesi dadakan tetap tersedia di halaman jadwal.
- Unggah CV atau portofolio instruktur.

</details>

<details>
<summary><strong>Portal siswa</strong></summary>

- Lihat kursus dan materi belajar.
- Pantau jadwal dan progres penyelesaian materi.
- Kelola profil serta ulasan kursus.

</details>

## Preview

Screenshot antarmuka belum disertakan di repository. Untuk menambahkannya,
simpan gambar, misalnya di `docs/screenshots/`, lalu masukkan tautan Markdown:

```md
![Dashboard admin](docs/screenshots/admin-dashboard.png)
```

<!-- Tambahkan screenshot aplikasi di sini setelah tersedia. -->

## Teknologi

| Area | Teknologi |
| --- | --- |
| Frontend | Next.js App Router, React, Tailwind CSS |
| Backend | Next.js Route Handlers, Node.js |
| Database | PostgreSQL, `pg` |
| Ikon | React Icons |
| Kualitas kode | ESLint |

## Mulai

### Persyaratan

- Node.js **20.9 atau lebih baru**
- npm
- PostgreSQL

### Instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/yuyuuxP/FinalProject-Web-Yugyo.git
   cd FinalProject-Web-Yugyo
   ```

2. Pasang dependensi:

   ```bash
   npm install
   ```

3. Buat database PostgreSQL, misalnya `yugyo_atelier`, lalu buat `.env.local` di
   root proyek:

   ```env
   DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/yugyo_atelier
   ```

   Ganti `USERNAME` dan `PASSWORD` dengan kredensial PostgreSQL lokal Anda.
   File `.env.local` diabaikan Git—jangan pernah membagikan atau meng-commit
   kredensial database.

4. Buat tabel dan struktur database:

   ```bash
   psql -h localhost -p 5432 -U postgres -d yugyo_atelier -f src/database/yugyo_schema.sql
   ```

   Schema memakai ekstensi PostgreSQL `pgcrypto`. Pengguna database harus
   memiliki izin untuk mengaktifkannya. Jika `psql` tidak tersedia, jalankan
   file schema melalui Query Tool di pgAdmin.

5. Pilih **satu** dataset pengembangan berikut:

   **Dataset ringkas untuk menguji seluruh tabel:**

   ```bash
   psql -h localhost -p 5432 -U postgres -d yugyo_atelier -f src/database/yugyo_dummy_data.sql
   ```

   File ini memakai akun `@yugyo.test`, tidak mengosongkan tabel, dan aman
   dijalankan ulang.

   **Dataset sampel yang lebih besar:**

   ```bash
   psql -h localhost -p 5432 -U postgres -d yugyo_atelier -f src/database/yugyo_seed.sql
   ```

   File seed sampel sebaiknya dijalankan satu kali pada database kosong. Semua
   akun dan kata sandi seed hanya untuk pengembangan lokal—jangan gunakan di
   produksi.

6. Jalankan server:

   ```bash
   npm run dev
   ```

7. Buka [http://localhost:3000](http://localhost:3000).

### Akun Demo Dataset Ringkas

Kredensial berikut hanya berlaku setelah menjalankan
`src/database/yugyo_dummy_data.sql`.

<details>
<summary>Lihat akun demo</summary>

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `dummy.admin@yugyo.test` | `DummyAdmin2026!` |
| Instruktur | `dummy.chef@yugyo.test` | `DummyChef2026!` |
| Siswa aktif | `dummy.student@yugyo.test` | `DummyStudent2026!` |

</details>

> **Peringatan:** akun demo dan data seed tidak aman untuk deployment produksi.

### Perintah NPM

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan build produksi |

## Struktur Proyek

```text
FinalProject-Web-Yugyo/
├── data/                          # Data JSON pendukung aplikasi
├── public/
│   ├── pictures/                  # Gambar kursus dan kategori
│   └── videos/                    # Aset video publik
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login dan registrasi
│   │   ├── (public)/              # Halaman publik, termasuk katalog
│   │   ├── api/                   # API autentikasi dan fitur aplikasi
│   │   ├── dashboard/
│   │   │   ├── admin/             # Dashboard dan halaman admin
│   │   │   ├── student/           # Portal siswa
│   │   │   └── teacher/           # Portal instruktur
│   │   └── forbidden/             # Halaman akses ditolak
│   ├── components/
│   │   ├── admin/
│   │   ├── chat/
│   │   ├── student/
│   │   └── teacher/
│   ├── database/
│   │   ├── yugyo_schema.sql       # Struktur database
│   │   ├── yugyo_seed.sql         # Dataset sampel
│   │   └── yugyo_dummy_data.sql   # Dataset dummy ringkas
│   └── lib/                       # Koneksi database dan utilitas
├── .private_uploads/              # CV/portofolio privat (dibuat saat runtime)
├── package.json
└── README.md
```

> `.private_uploads/` diabaikan Git. Pastikan direktori tersebut dapat ditulis
> oleh aplikasi dan gunakan penyimpanan persisten saat deployment.

## Panduan Penggunaan

| Halaman | URL |
| --- | --- |
| Beranda | `/` |
| Katalog kursus | `/courses` |
| Login | `/login` |
| Registrasi siswa | `/register/student` |
| Registrasi instruktur | `/register/instructor` |
| Dashboard admin | `/dashboard/admin` |
| Dashboard instruktur | `/dashboard/teacher` |
| Dashboard siswa | `/dashboard/student` |

Setelah registrasi, tunggu persetujuan admin bila akun berstatus menunggu.
Admin dapat meninjau akun dari **Users Management** dan pengajuan kelas dari
**Course Management**. Instruktur mengelola kelas, materi, serta jadwal melalui
portal instruktur, sedangkan siswa mengakses kelas dan progres belajarnya dari
portal siswa.

### Penyimpanan Upload

- Gambar kursus: `public/pictures/courses/`
- Gambar kategori: `public/pictures/categories/`
- CV/portofolio instruktur: `.private_uploads/instructor-portfolios/`

Pastikan direktori upload tersedia dan dapat ditulis oleh proses aplikasi.
Cadangkan database dan file upload secara terpisah.

## Kontribusi

Kontribusi, laporan masalah, dan saran fitur sangat diterima.

1. Buat fork dan branch untuk perubahan Anda.
2. Buat perubahan sekecil dan sejelas mungkin.
3. Jalankan pemeriksaan kode sebelum mengirim pull request:

   ```bash
   npm run lint
   npm run build
   ```

4. Sertakan ringkasan perubahan dan langkah pengujian pada pull request.

## Lisensi

Lisensi proyek **belum ditentukan** dan repository belum menyertakan file
`LICENSE`. Hubungi pemilik repository sebelum menggunakan atau mendistribusikan
ulang proyek ini.

## Pengembang

Dikembangkan sebagai proyek web YUGYO Academy Atelier.

[Repository GitHub](https://github.com/yuyuuxP/FinalProject-Web-Yugyo)
