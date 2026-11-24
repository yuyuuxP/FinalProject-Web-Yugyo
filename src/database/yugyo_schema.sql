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

-- 10. Tabel SESSION (Menyimpan data sesi kursu yg dibuat oleh guru)
CREATE TABLE IF NOT EXISTS course_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  notes TEXT,
  session_date DATE NOT NULL,
  session_time VARCHAR(50),
  location_label VARCHAR(100) DEFAULT 'Atelier Live',
  is_popup BOOLEAN DEFAULT FALSE,
  is_done BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel COMPLETE SESSION (Menyimpan data sesi yg telah diselesaikan)
CREATE TABLE IF NOT EXISTS session_student_completions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marked_done_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, student_id)
);

-- 12. Tabel CHAT THREADS ()
CREATE TABLE IF NOT EXISTS chat_threads (
  id SERIAL PRIMARY KEY,
  category VARCHAR(40) NOT NULL DEFAULT 'recipe', -- 'recipe' | 'dm' | 'assignment'
  student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  student_name VARCHAR(120) NOT NULL,
  student_avatar TEXT,
  course_title VARCHAR(160) NOT NULL DEFAULT 'French Patisserie & Pastry',
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  review_status VARCHAR(30) NOT NULL DEFAULT 'pending_review', -- 'pending_review' | 'answered'
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_preview TEXT,
  last_time_label VARCHAR(40) DEFAULT 'Baru saja',
  student_progress INTEGER NOT NULL DEFAULT 65,
  teacher_notes TEXT DEFAULT 'Fokus pada kontrol suhu adonan dan tekstur remah.',
  formula_title VARCHAR(160) DEFAULT 'Formula: Suhu Laminasi Ideal (14–16°C)',
  formula_subtitle VARCHAR(220) DEFAULT 'Kartu acuan cepat kelembapan & elastisitas lemak',
  formula_body TEXT DEFAULT 'Jaga suhu mentega 14–16°C dan détrempe ±10–12°C; istirahatkan 20–30 menit di chiller tiap lipatan.',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 13. TABEL CHAT MESSAGE ()
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' | 'teacher' | 'system'
  sender_name VARCHAR(120) NOT NULL,
  time_label VARCHAR(30) NOT NULL DEFAULT '10:42 AM',
  body TEXT NOT NULL,
  image_url TEXT,
  image_caption VARCHAR(120),
  is_formula_card BOOLEAN NOT NULL DEFAULT FALSE,
  formula_title VARCHAR(160),
  formula_subtitle VARCHAR(220),
  is_read BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. TABEL INSTRUCTOR PROFILES (Profil khusus per akun instruktur/guru)
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name_title VARCHAR(180) NOT NULL DEFAULT '',
  academic_email VARCHAR(160) NOT NULL DEFAULT '',
  whatsapp_number VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
  account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'PENDING')),
  badge_role_label VARCHAR(120) NOT NULL DEFAULT 'Atelier Master Instructor',
  avatar_url TEXT,
  specialties JSONB NOT NULL DEFAULT '["Viennoiserie", "Laminated Dough", "Artisan Sourdough"]'::jsonb,
  credentials_text TEXT NOT NULL DEFAULT 'Sertifikasi Patisserie & Boulangerie Atelier',
  bio_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Tabel Messages (Menyimpan riwayat chat student dan teacher)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Tabel COMPLETE MODULE (Menyimpan progres penyelesaian modul materi per student)
CREATE TABLE IF NOT EXISTS student_content_completions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content_key VARCHAR(150) NOT NULL,
  completed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id, content_key)
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

-- Index untuk Tabel course_sessions
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_instructor_id ON course_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_session_date ON course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_course_sessions_is_done ON course_sessions(is_done);

-- Index untuk Kolom Status Sesi Kursus
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON course_sessions(status);

-- Index untuk Tabel session_student_completions
CREATE INDEX IF NOT EXISTS idx_session_completions_session_id ON session_student_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_completions_student_id ON session_student_completions(student_id);

-- Index Opsional untuk thumbnail_url di courses (bila sering difilter/dicek)
CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- Index untuk Tabel chat_threads
-- Mempercepat urutan antrean chat terbaru (ORDER BY updated_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at
  ON chat_threads (updated_at DESC, id DESC);

-- Mempercepat filter tab diskusi ('recipe', 'dm', 'assignment') dan urutan terbaru
CREATE INDEX IF NOT EXISTS idx_chat_threads_category_updated
  ON chat_threads (category, updated_at DESC);

-- Mempercepat filter antrean review ('pending_review' | 'answered')
CREATE INDEX IF NOT EXISTS idx_chat_threads_review_status
  ON chat_threads (review_status, updated_at DESC);

-- Mempercepat join / pencarian thread berdasarkan student_id (FK ke users.id)
CREATE INDEX IF NOT EXISTS idx_chat_threads_student_id
  ON chat_threads (student_id)
  WHERE student_id IS NOT NULL;

-- Index untuk Tabel chat_messages
-- Mempercepat pengambilan riwayat pesan per thread secara berurutan (WHERE thread_id = $1 ORDER BY id ASC)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id_id
  ON chat_messages (thread_id, id ASC);

-- Mempercepat query kronologis berdasarkan waktu pembuatan pesan
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created_at
  ON chat_messages (thread_id, created_at ASC);

-- Partial index untuk menghitung / mengambil pesan belum dibaca secara efisien
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON chat_messages (thread_id, is_read)
  WHERE is_read = FALSE;

-- Index untuk Tabel instructor_profile
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id
  ON instructor_profiles(user_id);

-- Indexing untuk mengoptimalkan query riwayat chat dan urutan waktu
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_pair
  ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread_receiver
  ON messages (receiver_id, is_read) WHERE is_read = FALSE;

-- Indexing untuk mencegah student mengikuti kursus yg sama (duplikat id_course)
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_enrollments_student_course
ON student_enrollments (student_id, course_id);
  

-- ==========================================
-- PENAMBAHAN KOLOM/QUERY
-- ==========================================

-- Tambah Kolom Pendukung Gambar dan Video untuk Materi Belajar
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE course_contents ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Tambah Kolom Pendukung Gambar untuk Tabel Kategor dan Kursus
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Tambah Kolom Pendukung Status Kelas
ALTER TABLE course_sessions
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
CHECK (status IN ('scheduled', 'completed', 'canceled'));

UPDATE course_sessions
SET status = CASE
  WHEN is_done = TRUE THEN 'completed'
  ELSE 'scheduled'
END
WHERE status IS NULL OR status = '';

-- Tambah Kolom di Tabel Chat dan Masssage
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message TEXT;

-- Tambah kolom pendukung bukti gambar & balasan ada di tabel reports
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS image_proof VARCHAR(255);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Tambahkan kolom pendukung untuk menyimpan report student secara permanen
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'Tinggi · Fitur Tidak Berfungsi',
ADD COLUMN IF NOT EXISTS image_proof TEXT,
ADD COLUMN IF NOT EXISTS admin_reply TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON reports (created_at DESC, id DESC);

-- Optimasi index untuk query berdasarkan student_id
CREATE INDEX IF NOT EXISTS idx_session_student_completions_student_id
ON session_student_completions (student_id);

-- Tambahkan kolom pencatatan XP & catatan sesi per siswa
ALTER TABLE session_student_completions
ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 25,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Cek pemetaan kursus, kategori, dan instruktur saat ini
SELECT c.id, c.title, cat.name AS kategori, c.instructor_id, u.full_name AS instruktur, u.specialty
FROM courses c
LEFT JOIN categories cat ON cat.id = c.category_id
LEFT JOIN users u ON u.id = c.instructor_id
ORDER BY c.id ASC;

-- Otomatis sinkronkan instructor_id pada courses berdasarkan kecocokan kategori & specialty guru
UPDATE courses c
SET instructor_id = u.id
FROM categories cat, users u
WHERE c.category_id = cat.id
  AND LOWER(COALESCE(u.role, '')) = 'teacher'
  AND LOWER(TRIM(COALESCE(u.specialty, ''))) = LOWER(TRIM(COALESCE(cat.name, '')))
  AND (c.instructor_id IS DISTINCT FROM u.id);