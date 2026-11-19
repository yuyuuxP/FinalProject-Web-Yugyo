-- ==========================================
-- YUGYO ATELIER - DATABASE SCHEMA
-- ==========================================

-- 1. Aktifkan ekstensi pgcrypto untuk hashing password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabel Users (Menyimpan data admin, teacher, dan student)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Categories (Kategori kursus baking)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255)
);

-- 4. Tabel Courses (Data kelas masterclass)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    instructor_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'draft')),
    video_url VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Reports (Keluhan, kendala resep, tiket teknis oleh siswa)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE SET NULL,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'complaint', -- 'complaint', 'technical', 'schedule'
    status VARCHAR(50) DEFAULT 'Sedang Ditinjau', -- 'Sedang Ditinjau', 'Urgent', 'Belum Dibaca', 'Selesai'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Reviews (Ulasan & rating bintang dari siswa)
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE SET NULL,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
    content TEXT NOT NULL,
    image_proof VARCHAR(255), -- Foto hasil praktek siswa (opsional)
    status VARCHAR(50) DEFAULT 'published', -- 'published', 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel System Settings (Pengaturan sistem website)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Student Enrollments (Pendaftaran siswa ke kursus)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    progress_percentage INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'dropped'
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Contents (Data materi kursus)
CREATE TABLE IF NOT EXISTS course_contents (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(100) DEFAULT 'Video & Bacaan',
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- DATABASE INDEXING (OPTIMASI PERFORMA QUERY)
-- ==========================================

-- Index untuk Tabel Courses & Categories
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_title ON courses(title);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Index untuk Tabel Users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index untuk Tabel Reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_student_id ON reports(student_id);

-- Index untuk Tabel Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON reviews(student_id);

-- Index untuk Tabel System Settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key_name ON system_settings(key_name);

-- Index untuk Tabel Student Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON student_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_enrollments(status);


-- ==========================================
-- PENAMBAHAN KOLOM
-- ==========================================

-- Tambah Kolom Pendukung Gambar dan Video untuk Materi Belajar
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Tambah Kolom Pendukung Gambar untuk Tabel Kategor dan Kursus
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;