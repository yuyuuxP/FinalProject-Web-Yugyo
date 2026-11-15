-- 1. Insert Categories (Rumpun Mata Pelajaran)
INSERT INTO categories (name, description) VALUES
('Matematika & Sains', 'Mata pelajaran mencakup Matematika, Fisika, Kimia, Biologi, dan Astronomi.'),
('Ilmu Pengetahuan Sosial', 'Mata pelajaran mencakup Geografi, Sejarah, Ekonomi, dan Sosiologi.'),
('Bahasa & Sastra', 'Mata pelajaran mencakup Bahasa Indonesia, Bahasa Inggris, dan Seni Budaya.'),
('Teknologi & Kewirausahaan', 'Mata pelajaran mencakup TIK (Teknologi Informasi & Komunikasi) serta PKWU.')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Users (Admin, Instructor, Student)
-- Password di-hash menggunakan bcrypt (Contoh hash untuk password: "password123")
INSERT INTO users (username, email, password_hash, role, status_approval, approved_at) VALUES
('Admin', 'admin123@yugyo.ac.id', 'admin123', 'admin', 'approved', CURRENT_TIMESTAMP),
('Diva', 'diva@gmail.com', 'diva1234', 'instructor', 'approved', CURRENT_TIMESTAMP),
('Fira', 'fira@gmail.com', 'fira1234', 'instructor', 'approved', CURRENT_TIMESTAMP),
('Fadhiyah', 'fadhiyah@gmail.com', 'fadhiyah1234', 'instructor', 'pending', CURRENT_TIMESTAMP),
('Aca', 'aca@gmail.com', 'aca1234', 'instructor', 'approved', CURRENT_TIMESTAMP),
('Cika', 'cika@gmail.com', 'cika1234', 'instructor', 'pending', NULL),
('Fatimah', 'fatimah@gmail.com', 'fatimah1234', 'instructor', 'pending', NULL),
('Ayu', 'ayu@gmail.com', 'ayu1234', 'instructor', 'approved', CURRENT_TIMESTAMP),
('Addah', 'addah@gmail.com', 'addah1234', 'student', 'approved', CURRENT_TIMESTAMP),
('Anita', 'anita@gmail.com', 'anita1234', 'student', 'approved', CURRENT_TIMESTAMP),
('Andre', 'andre@gmail.com', 'andre1234', 'student', 'approved', CURRENT_TIMESTAMP),
('Athalah', 'tata@gmail.com', 'tata1234', 'student', 'pending', NULL)
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Sample Courses (Kelas oleh Instructor Budi)
INSERT INTO courses (title, description, category_id, instructor_id, start_date, end_date, is_lifetime) VALUES
('Dasar Pemrograman Web Modern dengan Next.js', 'Belajar membangun aplikasi web interaktif dari nol menggunakan Next.js App Router dan Tailwind CSS.', 4, 2, '2026-11-01', NULL, TRUE),
('Matematika Dasar & Aljabar', 'Memahami konsep dasar bilangan, persamaan kuadrat, dan fungsi aljabar untuk tingkat lanjut.', 1, 2, '2026-11-05', '2026-12-31', FALSE)
ON CONFLICT DO NOTHING;

-- 4. Insert Sample Contents (Materi dengan Rich Text HTML & Order Index)
INSERT INTO contents (course_id, title, body_content, order_index) VALUES
(1, 'Pengenalan Next.js & App Router', '<p>Selamat datang di kursus <strong>Next.js</strong>! Di materi ini kita akan membahas dasar routing berbasis folder.</p>', 1),
(1, 'Styling dengan Tailwind CSS v4', '<p>Tailwind CSS menggunakan utility-class untuk mempercepat perancangan tata letak antarmuka.</p>', 2),
(2, 'Konsep Dasar Bilangan Real', '<p>Bilangan real mencakup bilangan rasional dan irasional yang sering digunakan dalam perhitungan analitik.</p>', 1)
ON CONFLICT DO NOTHING;