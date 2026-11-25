-- Data dummy untuk pengembangan lokal, mengikuti tabel pada yugyo_schema.sql.
-- Jalankan setelah schema. Tidak menghapus atau mengosongkan data yang sudah ada.
-- Akun dan password di bawah hanya untuk development; jangan gunakan di produksi.
--
-- Login demo:
--   dummy.admin@yugyo.test   / DummyAdmin2026!
--   dummy.chef@yugyo.test    / DummyChef2026!
--   dummy.student@yugyo.test / DummyStudent2026!

BEGIN;

INSERT INTO users (full_name, email, password, role, status, specialty)
VALUES
  ('Dummy Admin', 'dummy.admin@yugyo.test', crypt('DummyAdmin2026!', gen_salt('bf')), 'admin', 'active', NULL),
  ('Dummy Chef', 'dummy.chef@yugyo.test', crypt('DummyChef2026!', gen_salt('bf')), 'teacher', 'active', 'Dummy - Roti & Pastry'),
  ('Dummy Student', 'dummy.student@yugyo.test', crypt('DummyStudent2026!', gen_salt('bf')), 'student', 'active', NULL),
  ('Dummy Student Pending', 'dummy.pending@yugyo.test', crypt('DummyStudent2026!', gen_salt('bf')), 'student', 'pending', NULL)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  specialty = EXCLUDED.specialty;

INSERT INTO categories (name, description, image_url)
VALUES
  ('Dummy - Roti & Pastry', 'Kategori contoh untuk data pengembangan.', NULL),
  ('Dummy - Dekorasi Kue', 'Kategori contoh untuk latihan dekorasi kue.', NULL)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

INSERT INTO instructor_profiles (
  user_id,
  display_name_title,
  academic_email,
  whatsapp_number,
  account_status,
  badge_role_label,
  specialties,
  credentials_text,
  bio_text
)
SELECT
  u.id,
  'Dummy Chef, Instruktur Pastry',
  u.email,
  '+62 812-0000-0001',
  'ACTIVE',
  'Dummy Atelier Instructor',
  '["Roti", "Pastry"]'::jsonb,
  'Kredensial dummy untuk pengembangan lokal.',
  'Profil contoh instruktur untuk menguji tampilan dan fitur.'
FROM users u
WHERE u.email = 'dummy.chef@yugyo.test'
ON CONFLICT (user_id) DO UPDATE SET
  display_name_title = EXCLUDED.display_name_title,
  academic_email = EXCLUDED.academic_email,
  whatsapp_number = EXCLUDED.whatsapp_number,
  account_status = EXCLUDED.account_status,
  badge_role_label = EXCLUDED.badge_role_label,
  specialties = EXCLUDED.specialties,
  credentials_text = EXCLUDED.credentials_text,
  bio_text = EXCLUDED.bio_text,
  updated_at = CURRENT_TIMESTAMP;

WITH sample_courses AS (
  SELECT *
  FROM (VALUES
    (
      '[DUMMY] Dasar Sourdough',
      'Kursus contoh untuk menguji katalog dan pendaftaran siswa.',
      'Dummy - Roti & Pastry',
      'active',
      'https://example.invalid/dummy-sourdough',
      7,
      21
    ),
    (
      '[DUMMY] Croissant untuk Pemula',
      'Kursus contoh dengan status menunggu persetujuan.',
      'Dummy - Roti & Pastry',
      'pending',
      'https://example.invalid/dummy-croissant',
      14,
      28
    ),
    (
      '[DUMMY] Dekorasi Buttercream',
      'Kursus contoh berstatus draft.',
      'Dummy - Dekorasi Kue',
      'draft',
      'https://example.invalid/dummy-buttercream',
      30,
      44
    )
  ) AS data(title, description, category_name, status, video_url, start_days, end_days)
)
INSERT INTO courses (
  title,
  description,
  category_id,
  instructor_id,
  status,
  video_url,
  start_date,
  end_date,
  thumbnail_url
)
SELECT
  sample.title,
  sample.description,
  category.id,
  instructor.id,
  sample.status,
  sample.video_url,
  CURRENT_DATE + sample.start_days,
  CURRENT_DATE + sample.end_days,
  NULL
FROM sample_courses sample
JOIN categories category ON category.name = sample.category_name
JOIN users instructor ON instructor.email = 'dummy.chef@yugyo.test'
WHERE NOT EXISTS (
  SELECT 1
  FROM courses existing
  WHERE existing.title = sample.title
);

WITH sample_contents AS (
  SELECT *
  FROM (VALUES
    (
      '[DUMMY] Dasar Sourdough',
      'Pengenalan Starter',
      'Mengenal starter, hidrasi, dan tanda fermentasi aktif.',
      'Video & Bacaan',
      12,
      1,
      'published',
      'Materi dummy: amati aroma starter, gelembung, dan kenaikan volumenya.',
      'https://example.invalid/dummy-starter-video'
    ),
    (
      '[DUMMY] Dasar Sourdough',
      'Latihan Fermentasi',
      'Latihan membaca perkembangan fermentasi adonan.',
      'Video & Bacaan',
      20,
      2,
      'published',
      'Materi dummy: catat waktu, suhu, dan perubahan bentuk adonan.',
      'https://example.invalid/dummy-fermentation-video'
    ),
    (
      '[DUMMY] Croissant untuk Pemula',
      'Pengenalan Laminasi',
      'Mengenal proses laminasi dan pengaturan suhu mentega.',
      'Video & Bacaan',
      18,
      1,
      'published',
      'Materi dummy: jaga adonan dan mentega tetap dingin saat laminasi.',
      'https://example.invalid/dummy-lamination-video'
    )
  ) AS data(course_title, title, description, content_type, duration_minutes, order_index, status, content_text, video_url)
)
INSERT INTO course_contents (
  course_id,
  title,
  description,
  content_type,
  duration_minutes,
  order_index,
  status,
  content_text,
  video_url,
  updated_at
)
SELECT
  course.id,
  sample.title,
  sample.description,
  sample.content_type,
  sample.duration_minutes,
  sample.order_index,
  sample.status,
  sample.content_text,
  sample.video_url,
  CURRENT_TIMESTAMP
FROM sample_contents sample
JOIN courses course ON course.title = sample.course_title
WHERE NOT EXISTS (
  SELECT 1
  FROM course_contents existing
  WHERE existing.course_id = course.id
    AND existing.title = sample.title
);

WITH sample_sessions AS (
  SELECT *
  FROM (VALUES
    (
      '[DUMMY] Sesi Sourdough Terjadwal',
      '[DUMMY] Dasar Sourdough',
      7,
      FALSE,
      FALSE,
      'scheduled',
      'Sesi praktik contoh untuk pengujian kalender.'
    ),
    (
      '[DUMMY] Sesi Croissant Dadakan',
      '[DUMMY] Croissant untuk Pemula',
      2,
      TRUE,
      FALSE,
      'scheduled',
      'Sesi dadakan contoh untuk pengujian jadwal.'
    ),
    (
      '[DUMMY] Sesi Sourdough Selesai',
      '[DUMMY] Dasar Sourdough',
      -1,
      FALSE,
      TRUE,
      'completed',
      'Sesi contoh yang sudah selesai.'
    )
  ) AS data(title, course_title, date_offset, is_popup, is_done, status, notes)
)
INSERT INTO course_sessions (
  course_id,
  instructor_id,
  title,
  notes,
  session_date,
  session_time,
  location_label,
  is_popup,
  is_done,
  completed_at,
  status
)
SELECT
  course.id,
  instructor.id,
  sample.title,
  sample.notes,
  CURRENT_DATE + sample.date_offset,
  '10:00 WIB',
  'Atelier Dummy',
  sample.is_popup,
  sample.is_done,
  CASE WHEN sample.is_done THEN CURRENT_TIMESTAMP ELSE NULL END,
  sample.status
FROM sample_sessions sample
JOIN courses course ON course.title = sample.course_title
JOIN users instructor ON instructor.email = 'dummy.chef@yugyo.test'
WHERE NOT EXISTS (
  SELECT 1
  FROM course_sessions existing
  WHERE existing.course_id = course.id
    AND existing.title = sample.title
);

INSERT INTO student_enrollments (
  student_id,
  course_id,
  progress_percentage,
  status
)
SELECT
  student.id,
  course.id,
  35,
  'active'
FROM users student
CROSS JOIN courses course
WHERE student.email = 'dummy.student@yugyo.test'
  AND course.title = '[DUMMY] Dasar Sourdough'
ON CONFLICT (student_id, course_id) DO UPDATE SET
  progress_percentage = EXCLUDED.progress_percentage,
  status = EXCLUDED.status;

INSERT INTO reports (
  student_id,
  course_id,
  title,
  content,
  category,
  status,
  severity,
  admin_reply
)
SELECT
  student.id,
  course.id,
  '[DUMMY] Pertanyaan jadwal kursus',
  'Ini adalah laporan contoh untuk menguji alur tindak lanjut admin.',
  'schedule',
  'Sedang Ditinjau',
  'Normal',
  NULL
FROM users student
CROSS JOIN courses course
WHERE student.email = 'dummy.student@yugyo.test'
  AND course.title = '[DUMMY] Dasar Sourdough'
  AND NOT EXISTS (
    SELECT 1 FROM reports existing
    WHERE existing.title = '[DUMMY] Pertanyaan jadwal kursus'
  );

INSERT INTO reviews (student_id, course_id, rating, content, status)
SELECT
  student.id,
  course.id,
  5,
  '[DUMMY] Materi jelas dan mudah diikuti.',
  'published'
FROM users student
CROSS JOIN courses course
WHERE student.email = 'dummy.student@yugyo.test'
  AND course.title = '[DUMMY] Dasar Sourdough'
  AND NOT EXISTS (
    SELECT 1 FROM reviews existing
    WHERE existing.content = '[DUMMY] Materi jelas dan mudah diikuti.'
  );

INSERT INTO system_settings (key_name, key_value)
VALUES
  ('dummy_seed_version', '1'),
  ('dummy_data_environment', 'development-only')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO session_student_completions (session_id, student_id, xp_earned, notes)
SELECT
  course_session.id,
  student.id,
  25,
  'Penyelesaian sesi dummy untuk pengujian progres.'
FROM course_sessions course_session
CROSS JOIN users student
WHERE course_session.title = '[DUMMY] Sesi Sourdough Selesai'
  AND student.email = 'dummy.student@yugyo.test'
ON CONFLICT (session_id, student_id) DO UPDATE SET
  xp_earned = EXCLUDED.xp_earned,
  notes = EXCLUDED.notes;

INSERT INTO chat_threads (
  category,
  student_id,
  student_name,
  student_avatar,
  course_title,
  is_online,
  review_status,
  unread_count,
  last_preview,
  last_time_label,
  student_progress,
  teacher_notes,
  formula_title,
  formula_subtitle,
  formula_body,
  instructor_id
)
SELECT
  'recipe',
  student.id,
  student.full_name,
  NULL,
  '[DUMMY] Dasar Sourdough',
  TRUE,
  'pending_review',
  1,
  '[DUMMY] Siswa menanyakan kondisi starter.',
  'Baru saja',
  35,
  'Balas dengan panduan mengecek aroma dan aktivitas starter.',
  'Panduan Starter Dummy',
  'Pemeriksaan starter sebelum digunakan',
  'Starter aktif menunjukkan gelembung dan aroma fermentasi yang segar.',
  instructor.id
FROM users student
CROSS JOIN users instructor
WHERE student.email = 'dummy.student@yugyo.test'
  AND instructor.email = 'dummy.chef@yugyo.test'
  AND NOT EXISTS (
    SELECT 1 FROM chat_threads existing
    WHERE existing.last_preview = '[DUMMY] Siswa menanyakan kondisi starter.'
  );

INSERT INTO chat_messages (
  thread_id,
  sender_role,
  sender_name,
  time_label,
  body,
  message,
  image_url,
  image_caption,
  is_formula_card,
  is_read
)
SELECT
  thread.id,
  'student',
  student.full_name,
  '10:00',
  '[DUMMY] Apakah starter ini sudah siap digunakan?',
  '[DUMMY] Apakah starter ini sudah siap digunakan?',
  NULL,
  NULL,
  FALSE,
  TRUE
FROM chat_threads thread
CROSS JOIN users student
WHERE thread.last_preview = '[DUMMY] Siswa menanyakan kondisi starter.'
  AND student.email = 'dummy.student@yugyo.test'
  AND NOT EXISTS (
    SELECT 1 FROM chat_messages existing
    WHERE existing.thread_id = thread.id
      AND existing.body = '[DUMMY] Apakah starter ini sudah siap digunakan?'
  );

INSERT INTO messages (
  sender_id,
  receiver_id,
  course_id,
  message_text,
  attachment_url,
  attachment_name,
  is_read
)
SELECT
  sender.id,
  receiver.id,
  course.id,
  '[DUMMY] Selamat datang di kelas praktik.',
  NULL,
  NULL,
  FALSE
FROM users sender
CROSS JOIN users receiver
CROSS JOIN courses course
WHERE sender.email = 'dummy.chef@yugyo.test'
  AND receiver.email = 'dummy.student@yugyo.test'
  AND course.title = '[DUMMY] Dasar Sourdough'
  AND NOT EXISTS (
    SELECT 1 FROM messages existing
    WHERE existing.sender_id = sender.id
      AND existing.receiver_id = receiver.id
      AND existing.course_id = course.id
      AND existing.message_text = '[DUMMY] Selamat datang di kelas praktik.'
  );

INSERT INTO student_content_completions (student_id, course_id, content_key)
SELECT
  student.id,
  course.id,
  'dummy-pengenalan-starter'
FROM users student
CROSS JOIN courses course
WHERE student.email = 'dummy.student@yugyo.test'
  AND course.title = '[DUMMY] Dasar Sourdough'
ON CONFLICT (student_id, course_id, content_key) DO NOTHING;

COMMIT;
