-- 1. Tabel USERS (Menampung Admin, Instructor, dan Student dengan RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    status_approval VARCHAR(20) DEFAULT 'approved' CHECK (status_approval IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel CATEGORIES (Master data rumpun mata pelajaran / kategori kursus)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel COURSES (Manajemen kelas oleh Instructor / Admin)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    instructor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NULL,
    end_date DATE NULL,
    is_lifetime BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel CONTENTS (Materi pembelajaran per course dengan Order Index & Rich Text HTML)
CREATE TABLE IF NOT EXISTS contents (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body_content TEXT NOT NULL, -- Menyimpan string HTML dari Rich Text Editor
    order_index INT NOT NULL,   -- Mengatur urutan materi agar berurutan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel ENROLLMENTS (Relasi siswa yang mengikuti kursus / per-user isolation)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id) -- Satu siswa hanya bisa enroll 1 kali per course yang sama
);

-- 6. Tabel STUDENT_PROGRESS (Rekam jejak centang materi "Mark as Done" per akun)
CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id INT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, content_id)
);

-- 7. Tabel DISCUSSIONS (Forum komentar/diskusi di setiap materi pelajaran)
CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    content_id INT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks database untuk optimalisasi pencarian & performa query
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_contents_course ON contents(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);