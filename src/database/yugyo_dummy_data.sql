-- Data dummy untuk pengembangan lokal, mengikuti tabel pada yugyo_schema.sql.
-- Jalankan setelah schema. Tidak menghapus atau mengosongkan data yang sudah ada.
-- Seluruh media (gambar kategori, thumbnail kursus, dan video materi) mengarah
-- ke file lokal pada public/pictures/ dan public/videos/.
-- Untuk sinkronisasi otomatis apabila ada file baru yang diinput manual ke
-- folder public/pictures/ atau public/videos/, jalankan: npm run db:sync
--
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
  ('Dummy - Roti & Pastry', 'Kategori contoh untuk data pengembangan.', '/pictures/categories/bread&yeast_goods.png'),
  ('Dummy - Dekorasi Kue', 'Kategori contoh untuk latihan dekorasi kue.', '/pictures/categories/cakes_decorating.png')
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
      '/videos/bread/Mastering Sourdough Starter.mp4',
      '/pictures/courses/bread/sourdough.png',
      7,
      21
    ),
    (
      '[DUMMY] Croissant untuk Pemula',
      'Kursus contoh dengan status menunggu persetujuan.',
      'Dummy - Roti & Pastry',
      'pending',
      '/videos/french_pastry/Masterclass Classic Croissant.mp4',
      '/pictures/courses/french_pastry/croissant.png',
      14,
      28
    ),
    (
      '[DUMMY] Dekorasi Buttercream',
      'Kursus contoh berstatus draft.',
      'Dummy - Dekorasi Kue',
      'draft',
      '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4',
      '/pictures/courses/cakes_decor/cake_piping.png',
      30,
      44
    )
  ) AS data(title, description, category_name, status, video_url, thumbnail_url, start_days, end_days)
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
  sample.thumbnail_url
FROM sample_courses sample
JOIN categories category ON category.name = sample.category_name
JOIN users instructor ON instructor.email = 'dummy.chef@yugyo.test'
WHERE NOT EXISTS (
  SELECT 1
  FROM courses existing
  WHERE existing.title = sample.title
);

-- Perbarui kursus [DUMMY] yang sudah ada jika masih memakai URL placeholder atau thumbnail NULL
WITH sample_courses AS (
  SELECT *
  FROM (VALUES
    (
      '[DUMMY] Dasar Sourdough',
      '/videos/bread/Mastering Sourdough Starter.mp4',
      '/pictures/courses/bread/sourdough.png'
    ),
    (
      '[DUMMY] Croissant untuk Pemula',
      '/videos/french_pastry/Masterclass Classic Croissant.mp4',
      '/pictures/courses/french_pastry/croissant.png'
    ),
    (
      '[DUMMY] Dekorasi Buttercream',
      '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4',
      '/pictures/courses/cakes_decor/cake_piping.png'
    )
  ) AS data(title, video_url, thumbnail_url)
)
UPDATE courses c
SET
  video_url = sample.video_url,
  thumbnail_url = sample.thumbnail_url
FROM sample_courses sample
WHERE c.title = sample.title
  AND (
    c.video_url IS NULL
    OR c.video_url = ''
    OR c.video_url LIKE 'https://example.invalid/%'
    OR c.thumbnail_url IS NULL
    OR c.thumbnail_url = ''
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
      '/videos/bread/Mastering Sourdough Starter.mp4',
      '/pictures/courses/bread/sourdough.png'
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
      '/videos/bread/Dasar Fermentasi Ragi Roti.mp4',
      '/pictures/courses/bread/ragi_roti.png'
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
      '/videos/french_pastry/Masterclass Classic Croissant.mp4',
      '/pictures/courses/french_pastry/croissant.png'
    ),
    (
      '[DUMMY] Dekorasi Buttercream',
      'Dasar Ice Cream & Buttercream',
      'Mengenal teknik membuat buttercream halus dan stabil.',
      'Video & Bacaan',
      15,
      1,
      'published',
      'Materi dummy: kendalikan suhu mentega agar buttercream tidak pecah.',
      '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4',
      '/pictures/courses/cakes_decor/ice_cream.png'
    )
  ) AS data(course_title, title, description, content_type, duration_minutes, order_index, status, content_text, video_url, cover_image_url)
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
  cover_image_url,
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
  sample.cover_image_url,
  CURRENT_TIMESTAMP
FROM sample_contents sample
JOIN courses course ON course.title = sample.course_title
WHERE NOT EXISTS (
  SELECT 1
  FROM course_contents existing
  WHERE existing.course_id = course.id
    AND existing.title = sample.title
);

-- Perbarui course_contents [DUMMY] yang masih memakai URL placeholder
WITH sample_contents AS (
  SELECT *
  FROM (VALUES
    ('[DUMMY] Dasar Sourdough', 'Pengenalan Starter', '/videos/bread/Mastering Sourdough Starter.mp4', '/pictures/courses/bread/sourdough.png'),
    ('[DUMMY] Dasar Sourdough', 'Latihan Fermentasi', '/videos/bread/Dasar Fermentasi Ragi Roti.mp4', '/pictures/courses/bread/ragi_roti.png'),
    ('[DUMMY] Croissant untuk Pemula', 'Pengenalan Laminasi', '/videos/french_pastry/Masterclass Classic Croissant.mp4', '/pictures/courses/french_pastry/croissant.png'),
    ('[DUMMY] Dekorasi Buttercream', 'Dasar Ice Cream & Buttercream', '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4', '/pictures/courses/cakes_decor/ice_cream.png')
  ) AS data(course_title, title, video_url, cover_image_url)
)
UPDATE course_contents cc
SET
  video_url = sample.video_url,
  cover_image_url = COALESCE(NULLIF(cc.cover_image_url, ''), sample.cover_image_url),
  updated_at = CURRENT_TIMESTAMP
FROM sample_contents sample
JOIN courses c ON c.title = sample.course_title
WHERE cc.course_id = c.id
  AND cc.title = sample.title
  AND (
    cc.video_url IS NULL
    OR cc.video_url = ''
    OR cc.video_url LIKE 'https://example.invalid/%'
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
  ('dummy_seed_version', '2'),
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

-- =========================================================================
-- SINKRONISASI GAMBAR KATEGORI, THUMBNAIL & VIDEO LOKAL (public/pictures & public/videos)
-- =========================================================================

UPDATE categories
SET image_url = CASE
  WHEN LOWER(name) LIKE '%bread%' OR LOWER(name) LIKE '%yeast%' OR LOWER(name) LIKE '%roti%'
    THEN '/pictures/categories/bread&yeast_goods.png'
  WHEN LOWER(name) LIKE '%cake%' OR LOWER(name) LIKE '%decor%' OR LOWER(name) LIKE '%dekor%'
    THEN '/pictures/categories/cakes_decorating.png'
  WHEN LOWER(name) LIKE '%cookie%' OR LOWER(name) LIKE '%kukis%'
    THEN '/pictures/categories/cookies.png'
  WHEN LOWER(name) LIKE '%indo%' OR LOWER(name) LIKE '%nusantara%' OR LOWER(name) LIKE '%tradisional%'
    THEN '/pictures/categories/indonesian_cakes.png'
  ELSE '/pictures/categories/french_patisserie.png'
END
WHERE image_url IS NULL OR TRIM(image_url) = '';

UPDATE courses
SET thumbnail_url = CASE
  WHEN LOWER(title) LIKE '%bagel%' THEN '/pictures/courses/bread/bagel.png'
  WHEN LOWER(title) LIKE '%brioche%' THEN '/pictures/courses/bread/brioche.png'
  WHEN LOWER(title) LIKE '%ciabatta%' THEN '/pictures/courses/bread/ciabatta.png'
  WHEN LOWER(title) LIKE '%focaccia%' THEN '/pictures/courses/bread/focaccia.png'
  WHEN LOWER(title) LIKE '%milk bread%' OR LOWER(title) LIKE '%roti susu%' THEN '/pictures/courses/bread/milk_bread.png'
  WHEN LOWER(title) LIKE '%campagne%' THEN '/pictures/courses/bread/Pain_de_Campagne.png'
  WHEN LOWER(title) LIKE '%pretzel%' THEN '/pictures/courses/bread/pretzel.png'
  WHEN LOWER(title) LIKE '%ragi%' THEN '/pictures/courses/bread/ragi_roti.png'
  WHEN LOWER(title) LIKE '%roti tawar%' THEN '/pictures/courses/bread/roti_tawar.png'
  WHEN LOWER(title) LIKE '%sourdough%' THEN '/pictures/courses/bread/sourdough.png'

  WHEN LOWER(title) LIKE '%piping%' OR LOWER(title) LIKE '%spuit%' THEN '/pictures/courses/cakes_decor/cake_piping.png'
  WHEN LOWER(title) LIKE '%floral%' OR LOWER(title) LIKE '%bunga%' THEN '/pictures/courses/cakes_decor/floral_painting.png'
  WHEN LOWER(title) LIKE '%fondan%' OR LOWER(title) LIKE '%fondant%' THEN '/pictures/courses/cakes_decor/fondan_sugar.png'
  WHEN LOWER(title) LIKE '%ganache%' OR LOWER(title) LIKE '%drip%' THEN '/pictures/courses/cakes_decor/ganache_drip.png'
  WHEN LOWER(title) LIKE '%geomatric%' OR LOWER(title) LIKE '%geometric%' OR LOWER(title) LIKE '%metallic%' THEN '/pictures/courses/cakes_decor/geomatric_metallic.png'
  WHEN LOWER(title) LIKE '%ice cream%' OR LOWER(title) LIKE '%es krim%' THEN '/pictures/courses/cakes_decor/ice_cream.png'
  WHEN LOWER(title) LIKE '%mirror glaze%' OR LOWER(title) LIKE '%glaze%' THEN '/pictures/courses/cakes_decor/mirror_glaze.png'
  WHEN LOWER(title) LIKE '%ombre%' THEN '/pictures/courses/cakes_decor/ombre_shadding.png'
  WHEN LOWER(title) LIKE '%smoothing%' THEN '/pictures/courses/cakes_decor/smoothing_kue.png'
  WHEN LOWER(title) LIKE '%wafer%' THEN '/pictures/courses/cakes_decor/wafer_paper.png'
  WHEN LOWER(title) LIKE '%buttercream%' THEN '/pictures/courses/cakes_decor/cake_piping.png'

  WHEN LOWER(title) LIKE '%biscotti%' THEN '/pictures/courses/cookies/biscotti.png'
  WHEN LOWER(title) LIKE '%crinckle%' OR LOWER(title) LIKE '%crinkle%' THEN '/pictures/courses/cookies/crinckle.png'
  WHEN LOWER(title) LIKE '%florentine%' THEN '/pictures/courses/cookies/florentines.png'
  WHEN LOWER(title) LIKE '%kastengel%' THEN '/pictures/courses/cookies/kastengel.png'
  WHEN LOWER(title) LIKE '%matcha%' OR LOWER(title) LIKE '%sabl%' THEN '/pictures/courses/cookies/matcha_sable.png'
  WHEN LOWER(title) LIKE '%nastar%' THEN '/pictures/courses/cookies/nastar.png'
  WHEN LOWER(title) LIKE '%peanut%' OR LOWER(title) LIKE '%kacang%' THEN '/pictures/courses/cookies/peanut_cookie.png'
  WHEN LOWER(title) LIKE '%putri salju%' THEN '/pictures/courses/cookies/putri_salju.png'
  WHEN LOWER(title) LIKE '%thumbprint%' THEN '/pictures/courses/cookies/thumbprint_jam.png'
  WHEN LOWER(title) LIKE '%cookie%' OR LOWER(title) LIKE '%kukis%' THEN '/pictures/courses/cookies/cookie.png'

  WHEN LOWER(title) LIKE '%choux%' OR LOWER(title) LIKE '%craquelin%' THEN '/pictures/courses/french_pastry/Choux_à_la_Crème_&Craquelin.png'
  WHEN LOWER(title) LIKE '%croissant%' OR LOWER(title) LIKE '%lamination%' THEN '/pictures/courses/french_pastry/croissant.png'
  WHEN LOWER(title) LIKE '%eclair%' OR LOWER(title) LIKE '%éclair%' THEN '/pictures/courses/french_pastry/eclair.png'
  WHEN LOWER(title) LIKE '%tart%' THEN '/pictures/courses/french_pastry/Fruits_tartle.png'
  WHEN LOWER(title) LIKE '%kouign%' THEN '/pictures/courses/french_pastry/Kouign-Amann_Bretons.png'
  WHEN LOWER(title) LIKE '%macaron%' THEN '/pictures/courses/french_pastry/macaron.png'
  WHEN LOWER(title) LIKE '%madeleine%' THEN '/pictures/courses/french_pastry/Madeleines.png'
  WHEN LOWER(title) LIKE '%mille%' THEN '/pictures/courses/french_pastry/Mille-Feuille.png'
  WHEN LOWER(title) LIKE '%opera%' THEN '/pictures/courses/french_pastry/opera_cake.png'
  WHEN LOWER(title) LIKE '%pain au chocolat%' THEN '/pictures/courses/french_pastry/Pain_au_Chocolat.png'

  WHEN LOWER(title) LIKE '%bolu kukus%' THEN '/pictures/courses/Indo_cakes/bolu_kukus.png'
  WHEN LOWER(title) LIKE '%dadar%' THEN '/pictures/courses/Indo_cakes/dadar.png'
  WHEN LOWER(title) LIKE '%getuk%' THEN '/pictures/courses/Indo_cakes/getuk_lindri.png'
  WHEN LOWER(title) LIKE '%klepon%' THEN '/pictures/courses/Indo_cakes/klepon.png'
  WHEN LOWER(title) LIKE '%lapis%' THEN '/pictures/courses/Indo_cakes/kue_lapis.png'
  WHEN LOWER(title) LIKE '%talam%' THEN '/pictures/courses/Indo_cakes/kue_talam.png'
  WHEN LOWER(title) LIKE '%nagasari%' THEN '/pictures/courses/Indo_cakes/nagasari.png'
  WHEN LOWER(title) LIKE '%onde%' THEN '/pictures/courses/Indo_cakes/onde_onde.png'
  WHEN LOWER(title) LIKE '%putu%' THEN '/pictures/courses/Indo_cakes/putu_ayu.png'
  WHEN LOWER(title) LIKE '%serabi%' THEN '/pictures/courses/Indo_cakes/serabi.png'
  ELSE '/pictures/courses/french_pastry/croissant.png'
END
WHERE thumbnail_url IS NULL OR TRIM(thumbnail_url) = '';

UPDATE courses
SET video_url = CASE
  WHEN LOWER(title) LIKE '%bagel%' THEN '/videos/bread/Bagel ala New York.mp4'
  WHEN LOWER(title) LIKE '%brioche%' THEN '/videos/bread/Brioche Roti Mewah Prancis.mp4'
  WHEN LOWER(title) LIKE '%ciabatta%' THEN '/videos/bread/Ciabatta dengan Hidrasi Tinggi.mp4'
  WHEN LOWER(title) LIKE '%ragi%' THEN '/videos/bread/Dasar Fermentasi Ragi Roti.mp4'
  WHEN LOWER(title) LIKE '%focaccia%' THEN '/videos/bread/Focaccia Art & Rosemary.mp4'
  WHEN LOWER(title) LIKE '%sourdough%' THEN '/videos/bread/Mastering Sourdough Starter.mp4'
  WHEN LOWER(title) LIKE '%milk bread%' THEN '/videos/bread/Milk Bread Hokkaido.mp4'
  WHEN LOWER(title) LIKE '%campagne%' THEN '/videos/bread/Pain de Campagne Klasik.mp4'
  WHEN LOWER(title) LIKE '%pretzel%' THEN '/videos/bread/Pretzel Jerman Tradisional.mp4'
  WHEN LOWER(title) LIKE '%roti tawar%' THEN '/videos/bread/Roti Tawar Gandum Utuh.mp4'

  WHEN LOWER(title) LIKE '%ganache%' THEN '/videos/cakes_decor/Chocolate Ganache Drip.mp4'
  WHEN LOWER(title) LIKE '%ice cream%' OR LOWER(title) LIKE '%buttercream%' AND LOWER(title) NOT LIKE '%floral%' AND LOWER(title) NOT LIKE '%ombre%' THEN '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4'
  WHEN LOWER(title) LIKE '%floral%' THEN '/videos/cakes_decor/Floral Buttercream Painting.mp4'
  WHEN LOWER(title) LIKE '%fondant%' OR LOWER(title) LIKE '%fondan%' THEN '/videos/cakes_decor/Fondant Sugar Flowers.mp4'
  WHEN LOWER(title) LIKE '%geometric%' OR LOWER(title) LIKE '%geomatric%' OR LOWER(title) LIKE '%metallic%' THEN '/videos/cakes_decor/Geometric Metallic Cakes.mp4'
  WHEN LOWER(title) LIKE '%piping%' THEN '/videos/cakes_decor/Korean Vintage Cake Piping.mp4'
  WHEN LOWER(title) LIKE '%mirror glaze%' THEN '/videos/cakes_decor/Mirror Glaze Cake Modern.mp4'
  WHEN LOWER(title) LIKE '%ombre%' THEN '/videos/cakes_decor/Ombre Buttercream Shading.mp4'
  WHEN LOWER(title) LIKE '%smoothing%' THEN '/videos/cakes_decor/Smoothing Kue Tepi Tajam.mp4'
  WHEN LOWER(title) LIKE '%wafer%' THEN '/videos/cakes_decor/Wafer Paper Butterfly Decor.mp4'

  WHEN LOWER(title) LIKE '%florentine%' THEN '/videos/cookies/Almond Florentine Cookies.mp4'
  WHEN LOWER(title) LIKE '%biscotti%' THEN '/videos/cookies/Biscotti Italia Double Choc.mp4'
  WHEN LOWER(title) LIKE '%choco chip%' THEN '/videos/cookies/Classic Choco Chip Cookies.mp4'
  WHEN LOWER(title) LIKE '%kastengel%' THEN '/videos/cookies/Kastengel Gurih Keju Edam.mp4'
  WHEN LOWER(title) LIKE '%matcha%' THEN '/videos/cookies/Matcha Sablé Cookies.mp4'
  WHEN LOWER(title) LIKE '%nastar%' THEN '/videos/cookies/Nastar Selai Nanas Premium.mp4'
  WHEN LOWER(title) LIKE '%peanut%' THEN '/videos/cookies/Peanut Butter Cookies.mp4'
  WHEN LOWER(title) LIKE '%putri salju%' THEN '/videos/cookies/Putri Salju Mentega.mp4'
  WHEN LOWER(title) LIKE '%crinkle%' OR LOWER(title) LIKE '%crinckle%' THEN '/videos/cookies/Red Velvet Crinkles.mp4'
  WHEN LOWER(title) LIKE '%thumbprint%' THEN '/videos/cookies/Thumbprint Strawberry Jam.mp4'

  WHEN LOWER(title) LIKE '%choux%' THEN '/videos/french_pastry/Choux à la Crème & Craquelin.mp4'
  WHEN LOWER(title) LIKE '%tart%' THEN '/videos/french_pastry/Fruit Tartlet Crème Pâtissière.mp4'
  WHEN LOWER(title) LIKE '%kouign%' THEN '/videos/french_pastry/Kouign-Amann Bretons.mp4'
  WHEN LOWER(title) LIKE '%macaron%' THEN '/videos/french_pastry/Macaron Prancis Anti Gagal.mp4'
  WHEN LOWER(title) LIKE '%madeleine%' THEN '/videos/french_pastry/Madeleine Lemon Keik Cangkang.mp4'
  WHEN LOWER(title) LIKE '%croissant%' THEN '/videos/french_pastry/Masterclass Classic Croissant.mp4'
  WHEN LOWER(title) LIKE '%mille%' THEN '/videos/french_pastry/Mille-Feuille Napoleon Klasik.mp4'
  WHEN LOWER(title) LIKE '%opera%' THEN '/videos/french_pastry/Opera Cake Mewah Prancis.mp4'
  WHEN LOWER(title) LIKE '%pain au chocolat%' THEN '/videos/french_pastry/Pain au Chocolat Otentik.mp4'
  WHEN LOWER(title) LIKE '%clair%' THEN '/videos/french_pastry/Éclairs Cokelat Berkilau.mp4'

  WHEN LOWER(title) LIKE '%bolu kukus%' THEN '/videos/indo_cakes/bolu kukus.mp4'
  WHEN LOWER(title) LIKE '%dadar%' THEN '/videos/indo_cakes/dadar.mp4'
  WHEN LOWER(title) LIKE '%getuk%' THEN '/videos/indo_cakes/getuk salindri.mp4'
  WHEN LOWER(title) LIKE '%klepon%' THEN '/videos/indo_cakes/klepon.mp4'
  WHEN LOWER(title) LIKE '%lapis%' THEN '/videos/indo_cakes/kue lapis.mp4'
  WHEN LOWER(title) LIKE '%talam%' THEN '/videos/indo_cakes/kue talam.mp4'
  WHEN LOWER(title) LIKE '%nagasari%' THEN '/videos/indo_cakes/nagasari.mp4'
  WHEN LOWER(title) LIKE '%onde%' THEN '/videos/indo_cakes/onde-onde.mp4'
  WHEN LOWER(title) LIKE '%putu%' THEN '/videos/indo_cakes/putu ayu.mp4'
  WHEN LOWER(title) LIKE '%serabi%' THEN '/videos/indo_cakes/serabi.mp4'
  ELSE video_url
END
WHERE video_url IS NULL
   OR TRIM(video_url) = ''
   OR video_url LIKE 'https://youtube.com/watch?v=sample%'
   OR video_url LIKE 'https://example.invalid/%';

INSERT INTO course_contents (
  course_id,
  title,
  description,
  content_type,
  duration_minutes,
  order_index,
  status,
  cover_image_url,
  video_url,
  updated_at
)
SELECT
  c.id,
  c.title,
  COALESCE(NULLIF(TRIM(c.description), ''), 'Video pembelajaran ' || c.title || '.'),
  'Video & Bacaan',
  20,
  1,
  'published',
  c.thumbnail_url,
  c.video_url,
  CURRENT_TIMESTAMP
FROM courses c
WHERE c.video_url LIKE '/videos/%'
  AND NOT EXISTS (
    SELECT 1
    FROM course_contents existing
    WHERE existing.course_id = c.id
      AND existing.video_url = c.video_url
  );

COMMIT;
