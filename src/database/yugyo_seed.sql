-- ==========================================
-- YUGYO ATELIER - DATABASE SEED DATA
-- ==========================================

-- 1. SEEDING USERS
-- Admin (Password: admin123)
INSERT INTO users (full_name, email, password, role, status) 
VALUES ('Admin Yugyo', 'admin@yugyo.com', crypt('admin123', gen_salt('bf')), 'admin', 'active');

-- Guru / Teachers (Password: nama1234, di-hash dengan pgcrypto)
INSERT INTO users (full_name, email, password, role, status, specialty) VALUES 
('Firah', 'firah@gmail.com', crypt('firah1234', gen_salt('bf')), 'teacher', 'active', 'Bread & Yeast Goods'),
('Diva', 'diva@gmail.com', crypt('diva1234', gen_salt('bf')), 'teacher', 'active', 'Traditional Indonesian Cakes'),
('Fadhiyah', 'fadhiyah@gmail.com', crypt('fadhiyah1234', gen_salt('bf')), 'teacher', 'active', 'Cookies & Small Bites'),
('Rasyah', 'rasyah@gmail.com', crypt('rasyah1234', gen_salt('bf')), 'teacher', 'active', 'Cakes Decorating'),
('Ayu', 'ayu@gmail.com', crypt('ayu1234', gen_salt('bf')), 'teacher', 'active', 'French Patisserie & Pastry'),
-- Guru Pending (Andre & Cika)
('Andre', 'andre@gmail.com', crypt('andre1234', gen_salt('bf')), 'teacher', 'pending', 'Artisan Bread'),
('Cika', 'cika@gmail.com', crypt('cika1234', gen_salt('bf')), 'teacher', 'pending', 'Modern Pastry');

-- 40 Murid / Students (Password: nama1234)
INSERT INTO users (full_name, email, password, role, status) VALUES
('Afdhol', 'afdhol@gmail.com', crypt('afdhol1234', gen_salt('bf')), 'student', 'active'),
('Mawaddah', 'mawaddah@gmail.com', crypt('mawaddah1234', gen_salt('bf')), 'student', 'active'),
('Naufal', 'naufal@gmail.com', crypt('naufal1234', gen_salt('bf')), 'student', 'active'),
('Jayandis', 'jayandis@gmail.com', crypt('jayandis1234', gen_salt('bf')), 'student', 'active'),
('Rahel', 'rahel@gmail.com', crypt('rahel1234', gen_salt('bf')), 'student', 'active'),
('Salwa', 'salwa@gmail.com', crypt('salwa1234', gen_salt('bf')), 'student', 'active'),
('Khalyfa', 'khalyfa@gmail.com', crypt('khalyfa1234', gen_salt('bf')), 'student', 'active'),
('NurAini', 'nuraini@gmail.com', crypt('nuraini1234', gen_salt('bf')), 'student', 'active'),
('SitiAliyyah', 'sitialiyyah@gmail.com', crypt('sitialiyyah1234', gen_salt('bf')), 'student', 'active'),
('Rahma', 'rahma@gmail.com', crypt('rahma1234', gen_salt('bf')), 'student', 'active'),
('Mulaheri', 'mulaheri@gmail.com', crypt('mulaheri1234', gen_salt('bf')), 'student', 'active'),
('Alika', 'alika@gmail.com', crypt('alika1234', gen_salt('bf')), 'student', 'active'),
('Sekar', 'sekar@gmail.com', crypt('sekar1234', gen_salt('bf')), 'student', 'active'),
('Derlian', 'derlian@gmail.com', crypt('derlian1234', gen_salt('bf')), 'student', 'active'),
('Rafika', 'rafika@gmail.com', crypt('rafika1234', gen_salt('bf')), 'student', 'active'),
('Anisya', 'anisya@gmail.com', crypt('anisya1234', gen_salt('bf')), 'student', 'active'),
('Jihan', 'jihan@gmail.com', crypt('jihan1234', gen_salt('bf')), 'student', 'active'),
('Antasari', 'antasari@gmail.com', crypt('antasari1234', gen_salt('bf')), 'student', 'active'),
('Naila', 'naila@gmail.com', crypt('naila1234', gen_salt('bf')), 'student', 'active'),
('DwiVeny', 'dwiveny@gmail.com', crypt('dwiveny1234', gen_salt('bf')), 'student', 'active'),
('Melisa', 'melisa@gmail.com', crypt('melisa1234', gen_salt('bf')), 'student', 'active'),
('Cindy', 'cindy@gmail.com', crypt('cindy1234', gen_salt('bf')), 'student', 'active'),
('Salsabillah', 'salsabillah@gmail.com', crypt('salsabillah1234', gen_salt('bf')), 'student', 'active'),
('Rijal', 'rijal@gmail.com', crypt('rijal1234', gen_salt('bf')), 'student', 'active'),
('Zahra', 'zahra@gmail.com', crypt('zahra1234', gen_salt('bf')), 'student', 'active'),
('Fauzan', 'fauzan@gmail.com', crypt('fauzan1234', gen_salt('bf')), 'student', 'active'),
('Rizky', 'rizky@gmail.com', crypt('rizky1234', gen_salt('bf')), 'student', 'active'),
('Amalia', 'amalia@gmail.com', crypt('amalia1234', gen_salt('bf')), 'student', 'active'),
('Putri', 'putri@gmail.com', crypt('putri1234', gen_salt('bf')), 'student', 'active'),
('Dimas', 'dimas@gmail.com', crypt('dimas1234', gen_salt('bf')), 'student', 'active'),
('Aulia', 'aulia@gmail.com', crypt('aulia1234', gen_salt('bf')), 'student', 'active'),
('Rehan', 'rehan@gmail.com', crypt('rehan1234', gen_salt('bf')), 'student', 'active'),
('Nabila', 'nabila@gmail.com', crypt('nabila1234', gen_salt('bf')), 'student', 'active'),
('Yusuf', 'yusuf@gmail.com', crypt('yusuf1234', gen_salt('bf')), 'student', 'active'),
('Tania', 'tania@gmail.com', crypt('tania1234', gen_salt('bf')), 'student', 'active'),
('Ilham', 'ilham@gmail.com', crypt('ilham1234', gen_salt('bf')), 'student', 'active'),
('Wahyuni', 'wahyuni@gmail.com', crypt('wahyuni1234', gen_salt('bf')), 'student', 'active'),
('Bayu', 'bayu@gmail.com', crypt('bayu1234', gen_salt('bf')), 'student', 'active'),
('Sintia', 'sintia@gmail.com', crypt('sintia1234', gen_salt('bf')), 'student', 'active'),
('Eko', 'eko@gmail.com', crypt('eko1234', gen_salt('bf')), 'student', 'active');


-- 2. SEEDING CATEGORIES
INSERT INTO categories (name, description) VALUES
('Bread & Yeast Goods', 'Teknik fermentasi ragi, sourdough, dan pengembangan struktur roti.'),
('Traditional Indonesian Cakes', 'Kue tradisional nusantara dengan tekstur legit dan cita rasa autentik.'),
('Cookies & Small Bites', 'Aneka kue kering modern, biskuit renyah, dan kudapan gigitan kecil.'),
('Cakes Decorating', 'Estetika dekorasi kue, teknik pelapisan, icing, dan seni menghias.'),
('French Patisserie & Pastry', 'Seni pastry klasik Prancis dengan teknik laminasi mentega dan presisi tinggi.');


-- 3. SEEDING COURSES (50 Materi: 10 per Kategori)
-- Guru 1: Firah (Category ID: 1 - Bread & Yeast Goods)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Dasar Fermentasi Ragi Roti', 'Pengenalan ragi aktif, suhu ideal, dan proses proofing awal.', 1, 2, 'active', '/videos/bread/Dasar Fermentasi Ragi Roti.mp4'),
('Mastering Sourdough Starter', 'Cara merawat dan menumbuhkan ragi alami dari tepung dan air.', 1, 2, 'active', '/videos/bread/Mastering Sourdough Starter.mp4'),
('Ciabatta dengan Hidrasi Tinggi', 'Teknik menghasilkan rongga udara besar pada roti khas Italia.', 1, 2, 'active', '/videos/bread/Ciabatta dengan Hidrasi Tinggi.mp4'),
('Brioche Roti Mewah Prancis', 'Pencampuran mentega masif untuk tekstur roti selembut sutra.', 1, 2, 'pending', '/videos/bread/Brioche Roti Mewah Prancis.mp4'),
('Bagel ala New York', 'Teknik rebus sebelum panggang untuk tekstur kenyal luar dalam.', 1, 2, 'active', '/videos/bread/Bagel ala New York.mp4'),
('Roti Tawar Gandum Utuh', 'Pilihan sehat sarapan pagi kaya serat dan nutrisi.', 1, 2, 'draft', '/videos/bread/Roti Tawar Gandum Utuh.mp4'),
('Focaccia Art & Rosemary', 'Seni menghias permukaan roti focaccia dengan sayuran segar.', 1, 2, 'active', '/videos/bread/Focaccia Art & Rosemary.mp4'),
('Pain de Campagne Klasik', 'Roti pedesaan Prancis dengan campuran tepung gandum hitam.', 1, 2, 'active', '/videos/bread/Pain de Campagne Klasik.mp4'),
('Milk Bread Hokkaido', 'Teknik tangzhong untuk roti super empuk tahan lama.', 1, 2, 'pending', '/videos/bread/Milk Bread Hokkaido.mp4'),
('Pretzel Jerman Tradisional', 'Pencelupan larutan lindi untuk warna cokelat khas pretzel.', 1, 2, 'active', '/videos/bread/Pretzel Jerman Tradisional.mp4');

-- Guru 2: Diva (Category ID: 2 - Traditional Indonesian Cakes)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Bolu Kukus Mekar Klasik', 'Tips agar bolu kukus merekah sempurna tanpa bahan pengawet.', 2, 3, 'active', '/videos/indo_cakes/bolu kukus.mp4'),
('Kue Lapis Legit Spesial', 'Teknik panggang berlapis lapis dengan rempah spekuk.', 2, 3, 'active', '/videos/indo_cakes/kue lapis.mp4'),
('Klepon Pandan Lumer', 'Membuat isian gula merah cair yang meledak di mulut.', 2, 3, 'active', '/videos/indo_cakes/klepon.mp4'),
('Onde-Onde Ketan Hijau', 'Kulit renyah berbalur wijen dengan isian kacang hijau lembut.', 2, 3, 'pending', '/videos/indo_cakes/onde-onde.mp4'),
('Nagasari Pisang Wangi', 'Kue tradisional bungkus daun pisang aroma santan kelapa.', 2, 3, 'active', '/videos/indo_cakes/nagasari.mp4'),
('Putu Ayu Lembut', 'Kue basah kukus aroma pandan tabur kelapa parut.', 2, 3, 'draft', '/videos/indo_cakes/putu ayu.mp4'),
('Serabi Solo Kuah Santan', 'Teknik cetak serabi teflon bersarang sempurna.', 2, 3, 'active', '/videos/indo_cakes/serabi.mp4'),
('Kue Talam Ubi Ungu', 'Kombinasi gurih santan dan manis ubi ungu legit.', 2, 3, 'active', '/videos/indo_cakes/kue talam.mp4'),
('Dadar Gulung Unti Kelapa', 'Kulit dadar berpori cantik isi gula kelapa manis.', 2, 3, 'pending', '/videos/indo_cakes/dadar.mp4'),
('Getuk Lindri Tradisional', 'Pengolahan singkong rebus menjadi camilan cantik berwarna.', 2, 3, 'active', '/videos/indo_cakes/getuk salindri.mp4');

-- Guru 3: Fadhiyah (Category ID: 3 - Cookies & Small Bites)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Classic Choco Chip Cookies', 'Tekstur renyah di luar dan chewy di bagian tengah.', 3, 4, 'active', '/videos/cookies/Classic Choco Chip Cookies.mp4'),
('Nastar Selai Nanas Premium', 'Membuat selai nanas padat dan bulatan adonan lumer.', 3, 4, 'active', '/videos/cookies/Nastar Selai Nanas Premium.mp4'),
('Kastengel Gurih Keju Edam', 'Taburan keju melimpah dengan aroma mentega harum.', 3, 4, 'active', '/videos/cookies/Kastengel Gurih Keju Edam.mp4'),
('Putri Salju Mentega', 'Cookies lembut berselimut gula dingin manis.', 3, 4, 'pending', '/videos/cookies/Putri Salju Mentega.mp4'),
('Matcha Green Tea Sablé', 'Biskuit mentega Prancis rasa teh hijau jepang.', 3, 4, 'active', '/videos/cookies/Matcha Sablé Cookies.mp4'),
('Almond Florentine Cookies', 'Kue kering karamel tipis bertabur irisan almond.', 3, 4, 'draft', '/videos/cookies/Almond Florentine Cookies.mp4'),
('Red Velvet Crinkles', 'Cookies berbentuk retak estetik warna merah pekat.', 3, 4, 'active', '/videos/cookies/Red Velvet Crinkles.mp4'),
('Peanut Butter Cookies', 'Camilan gurih kacang tanah panggang klasik.', 3, 4, 'active', '/videos/cookies/Peanut Butter Cookies.mp4'),
('Biscotti Italia Double Choc', 'Kue panggang dua kali yang renyah celup kopi.', 3, 4, 'pending', '/videos/cookies/Biscotti Italia Double Choc.mp4'),
('Thumbprint Strawberry Jam', 'Biskuit cantik berlubang tengah isi selai buah.', 3, 4, 'active', '/videos/cookies/Thumbprint Strawberry Jam.mp4');

-- Guru 4: Rasyah (Category ID: 4 - Cakes Decorating)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Dasar Ice Cream & Buttercream', 'Membuat krim mentega halus tanpa butiran gula.', 4, 5, 'active', '/videos/cakes_decor/Dasar Ice Cream & Buttercream.mp4'),
('Smoothing Kue Tepi Tajam', 'Teknik meratakan kue ulang tahun dengan scraper logam.', 4, 5, 'active', '/videos/cakes_decor/Smoothing Kue Tepi Tajam.mp4'),
('Korean Vintage Cake Piping', 'Seni menghias kue gaya korea dengan spuit rumit.', 4, 5, 'active', '/videos/cakes_decor/Korean Vintage Cake Piping.mp4'),
('Floral Buttercream Painting', 'Melukis bunga mawar langsung di atas kue tart.', 4, 5, 'pending', '/videos/cakes_decor/Floral Buttercream Painting.mp4'),
('Mirror Glaze Cake Modern', 'Teknik melapisi kue dengan efek cermin mengkilap.', 4, 5, 'active', '/videos/cakes_decor/Mirror Glaze Cake Modern.mp4'),
('Chocolate Ganache Drip', 'Aplikasi tetesan cokelat estetik di pinggiran kue.', 4, 5, 'draft', '/videos/cakes_decor/Chocolate Ganache Drip.mp4'),
('Fondant Sugar Flowers', 'Membuat kelopak bunga peony dari bahan fondant elastis.', 4, 5, 'active', '/videos/cakes_decor/Fondant Sugar Flowers.mp4'),
('Ombre Buttercream Shading', 'Gradasi warna artistik dari gelap ke terang.', 4, 5, 'active', '/videos/cakes_decor/Ombre Buttercream Shading.mp4'),
('Wafer Paper Butterfly Decor', 'Membuat hiasan kupu-kupu transparan dari kertas wafer.', 4, 5, 'pending', '/videos/cakes_decor/Wafer Paper Butterfly Decor.mp4'),
('Geometric Metallic Cakes', 'Sentuhan cat emas mewah pada dekorasi kue modern.', 4, 5, 'active', '/videos/cakes_decor/Geometric Metallic Cakes.mp4');

-- Guru 5: Ayu (Category ID: 5 - French Patisserie & Pastry)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Masterclass Classic Croissant', 'Teknik laminasi lipatan mentega untuk croissant berongga sarang laba-laba.', 5, 6, 'active', '/videos/french_pastry/Masterclass Classic Croissant.mp4'),
('Pain au Chocolat Otentik', 'Baluran batangan cokelat premium dalam balutan pastry renyah.', 5, 6, 'active', '/videos/french_pastry/Pain au Chocolat Otentik.mp4'),
('Kouign-Amann Bretons', 'Kue mentega karamel berlapis asal wilayah Brittany.', 5, 6, 'active', '/videos/french_pastry/Kouign-Amann Bretons.mp4'),
('Fruit Tartlet Crème Patissière', 'Kulit pie renyah isi vla vanila custard dan buah segar.', 5, 6, 'pending', '/videos/french_pastry/Fruit Tartlet Crème Pâtissière.mp4'),
('Choux à la Crème & Craquelin', 'Kue sus renyah dengan topping biskuit craquelin di atasnya.', 5, 6, 'active', '/videos/french_pastry/Choux à la Crème & Craquelin.mp4'),
('Éclairs Cokelat Berkilau', 'Pastry panjang isi krim diplomat lembut berlapis fondant.', 5, 6, 'draft', '/videos/french_pastry/Éclairs Cokelat Berkilau.mp4'),
('Mille-Feuille Napoleon Klasik', 'Tiga lapis puff pastry renyah berselang-seling vla custard.', 5, 6, 'active', '/videos/french_pastry/Mille-Feuille Napoleon Klasik.mp4'),
('Opera Cake Mewah Prancis', 'Kue espong almond berendam kopi dengan ganache cokelat.', 5, 6, 'active', '/videos/french_pastry/Opera Cake Mewah Prancis.mp4'),
('Macaron Prancis Anti Gagal', 'Kunci kaki macaron (feet) mengembang dan kulit mulus.', 5, 6, 'pending', '/videos/french_pastry/Macaron Prancis Anti Gagal.mp4'),
('Madeleine Lemon Keik Cangkang', 'Kue spons kecil khas Prancis berbentuk kerang laut.', 5, 6, 'active', '/videos/french_pastry/Madeleine Lemon Keik Cangkang.mp4');


-- 4. SEEDING REPORTS DAN REVIEWS (Menggunakan ID dari tabel users yang ber-role 'student')
INSERT INTO reports (student_id, course_id, title, content, category, status, created_at) 
VALUES 
(
  (SELECT id FROM users WHERE role = 'student' ORDER BY RANDOM() LIMIT 1), 
  1, 
  'Permintaan Ubah Jadwal Sesi Sourdough', 
  'Halo Chef, apakah saya bisa memindahkan jadwal pembuktian adonan ke akhir pekan karena ada kendala mendadak?', 
  'schedule', 
  'Selesai', 
  NOW() - INTERVAL '1 day'
),
(
  (SELECT id FROM users WHERE role = 'student' ORDER BY RANDOM() LIMIT 1), 
  1, 
  'Konsultasi Rasio Tepung Protein Tinggi', 
  'Terima kasih atas tanggapan cepatnya kemarin, rasio air pada adonan viennoiserie saya sekarang sudah jauh lebih stabil.', 
  'complaint', 
  'Selesai', 
  NOW() - INTERVAL '3 days'
),
(
  (SELECT id FROM users WHERE role = 'student' ORDER BY RANDOM() LIMIT 1), 
  2, 
  'Tautan Live Session Hilang', 
  'Saya belum menerima link zoom live session untuk sesi tanya jawab starter ragi liar besok pagi jam 08:30 WIT.', 
  'complaint', 
  'Belum Dibaca', 
  NOW() - INTERVAL '2 hours'
);

INSERT INTO reviews (student_id, course_id, rating, content, status, created_at) 
VALUES 
(
  (SELECT id FROM users WHERE role = 'student' ORDER BY RANDOM() LIMIT 1), 
  2, 
  5, 
  'Penjelasan rasio almond flour dan meringue Italia sangat presisi! Kaki macaron keluar sempurna tanpa rongga kopong pada percobaan pertama.', 
  'published', 
  NOW() - INTERVAL '4 hours'
),
(
  (SELECT id FROM users WHERE role = 'student' ORDER BY RANDOM() LIMIT 1), 
  3, 
  4, 
  'Materi sangat detail dan resep pastry cream vanilla bean sangat harum. Saran: tambahkan tips alternatif jika oven tidak memiliki kipas konveksi.', 
  'published', 
  NOW() - INTERVAL '2 days'
);


-- 5. SEEDING SYSTEM SETTINGS
INSERT INTO system_settings (key_name, key_value) VALUES 
('auto_approval', 'false'),
('studio_capacity', '20'),
('submission_deadline', '14 Hari Kerja (Sourdough & Viennoiserie Lanjut)'),
('wa_notification', 'true'),
('email_notification', 'true'),
('oven_reminder', 'true'),
('language', 'id'),
('timezone', 'WIT')
ON CONFLICT (key_name) DO NOTHING;

-- 6. UPDATE GAMBAR PROFILE KATEGORI
UPDATE categories
SET image_url = CASE
  WHEN LOWER(name) LIKE '%bread%' OR LOWER(name) LIKE '%yeast%' OR LOWER(name) LIKE '%roti%'
    THEN '/pictures/categories/bread&yeast_goods.png'
  WHEN LOWER(name) LIKE '%cake%' OR LOWER(name) LIKE '%decor%' OR LOWER(name) LIKE '%dekor%'
    THEN '/pictures/categories/cakes_decorating.png'
  WHEN LOWER(name) LIKE '%cookie%' OR LOWER(name) LIKE '%kukis%'
    THEN '/pictures/categories/cookies.png'
  WHEN LOWER(name) LIKE '%indo%' OR LOWER(name) LIKE '%nusantara%'
    THEN '/pictures/categories/indonesian_cakes.png'
  ELSE '/pictures/categories/french_patisserie.png'
END;

-- 7. UPDATE THUMBNAIL KURSUS BERDASARKAN JUDUL KURSUS
UPDATE courses
SET thumbnail_url = CASE
  -- Bread
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

  -- Cakes Decor
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

  -- Cookies
  WHEN LOWER(title) LIKE '%biscotti%' THEN '/pictures/courses/cookies/biscotti.png'
  WHEN LOWER(title) LIKE '%crinckle%' OR LOWER(title) LIKE '%crinkle%' THEN '/pictures/courses/cookies/crinckle.png'
  WHEN LOWER(title) LIKE '%florentine%' THEN '/pictures/courses/cookies/florentines.png'
  WHEN LOWER(title) LIKE '%kastengel%' THEN '/pictures/courses/cookies/kastengel.png'
  WHEN LOWER(title) LIKE '%matcha%' OR LOWER(title) LIKE '%sable%' THEN '/pictures/courses/cookies/matcha_sable.png'
  WHEN LOWER(title) LIKE '%nastar%' THEN '/pictures/courses/cookies/nastar.png'
  WHEN LOWER(title) LIKE '%peanut%' OR LOWER(title) LIKE '%kacang%' THEN '/pictures/courses/cookies/peanut_cookie.png'
  WHEN LOWER(title) LIKE '%putri salju%' THEN '/pictures/courses/cookies/putri_salju.png'
  WHEN LOWER(title) LIKE '%thumbprint%' THEN '/pictures/courses/cookies/thumbprint_jam.png'
  WHEN LOWER(title) LIKE '%cookie%' OR LOWER(title) LIKE '%kukis%' THEN '/pictures/courses/cookies/cookie.png'

  -- French Pastry
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

  -- Indo Cakes
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
WHERE thumbnail_url IS NULL;

-- 7B. SEEDING COURSE CONTENTS DARI VIDEO LOKAL
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


-- Isi instructor_id pada chat_threads berdasarkan nama guru yang disebut di last_preview / course_title
UPDATE chat_threads ct
SET instructor_id = u.id
FROM users u
WHERE u.role = 'teacher'
  AND u.status = 'active'
  AND ct.instructor_id IS NULL
  AND (
    COALESCE(ct.last_preview, '') || ' ' || COALESCE(ct.course_title, '')
  ) ILIKE '%' || u.full_name || '%';

-- Jika masih ada thread NULL dan terkait kategori/topik Ayu (id = 6: French Patisserie / Kue Lapis / Lamination / Croissant)
UPDATE chat_threads
SET instructor_id = 6
WHERE instructor_id IS NULL
  AND (
    COALESCE(last_preview, '') || ' ' || COALESCE(course_title, '')
  ) ILIKE ANY (ARRAY['%ayu%', '%kue lapis%', '%lapis%', '%lamination%', '%croissant%']);


-- Sampel reports
INSERT INTO reports (
  student_id,
  course_id,
  title,
  content,
  category,
  status,
  image_proof,
  created_at
)
VALUES
(
  (SELECT id FROM users WHERE full_name = 'Antasari' AND role = 'student' LIMIT 1),
  2,
  'Tautan Live Session Hilang',
  'Saya belum menerima link zoom live session untuk sesi tanya jawab starter ragi liar besok pagi jam 08:30 WIT.',
  'complaint',
  'Belum Dibaca',
  NULL,
  NOW() - INTERVAL '15 minutes'
),
(
  (SELECT id FROM users WHERE full_name = 'Tania' AND role = 'student' LIMIT 1),
  1,
  'Permintaan Ubah Jadwal Sesi Sourdough',
  'Halo Chef, apakah saya bisa memindahkan jadwal pembuktian adonan ke akhir pekan karena ada kendala mendadak?',
  'schedule',
  'Selesai',
  NULL,
  NOW() - INTERVAL '1 day'
),
(
  (SELECT id FROM users WHERE full_name = 'Dimas' AND role = 'student' LIMIT 1),
  1,
  'Konsultasi Rasio Tepung Protein Tinggi',
  'Terima kasih atas tanggapan cepatnya kemarin, rasio air pada adonan viennoiserie saya sekarang sudah jauh lebih stabil.',
  'complaint',
  'Selesai',
  NULL,
  NOW() - INTERVAL '3 days'
);