-- Aktifkan ekstensi pgcrypto untuk hashing password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Tabel Courses
CREATE TABLE courses (
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

-- Tabel Report (untuk keluhan, kendala resep, tiket teknis)
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

-- Tabel Review (untuk ulasan & rating bintang dari siswa)
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


-- Index untuk relasi Foreign Key (mempercepat proses JOIN tabel courses dengan categories & users)
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);

-- Index untuk pencarian & filter pada tabel courses (mempercepat pencarian berdasarkan status dan judul)
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_title ON courses(title);

-- Index untuk tabel users (mempercepat filtering berdasarkan role dan pencarian email/nama)
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Index untuk tabel categories (mempercepat pencarian nama kategori)
CREATE INDEX idx_categories_name ON categories(name);

-- Menambah kolom untuk gambar yg diupload
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

