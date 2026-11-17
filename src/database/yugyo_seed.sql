-- SEEDING USERS
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

-- SEEDING CATEGORIES
INSERT INTO categories (name, description) VALUES
('Bread & Yeast Goods', 'Teknik fermentasi ragi, sourdough, dan pengembangan struktur roti.'),
('Traditional Indonesian Cakes', 'Kue tradisional nusantara dengan tekstur legit dan cita rasa autentik.'),
('Cookies & Small Bites', 'Aneka kue kering modern, biskuit renyah, dan kudapan gigitan kecil.'),
('Cakes Decorating', 'Estetika dekorasi kue, teknik pelapisan, icing, dan seni menghias.'),
('French Patisserie & Pastry', 'Seni pastry klasik Prancis dengan teknik laminasi mentega dan presisi tinggi.');

-- SEEDING COURSES (50 Materi: 10 per Kategori)
-- Guru 1: Firah (Category ID: 1 - Bread & Yeast Goods)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Dasar Fermentasi Ragi Roti', 'Pengenalan ragi aktif, suhu ideal, dan proses proofing awal.', 1, 2, 'active', 'https://youtube.com/watch?v=sample1'),
('Mastering Sourdough Starter', 'Cara merawat dan menumbuhkan ragi alami dari tepung dan air.', 1, 2, 'active', 'https://youtube.com/watch?v=sample2'),
('Ciabatta dengan Hidrasi Tinggi', 'Teknik menghasilkan rongga udara besar pada roti khas Italia.', 1, 2, 'active', 'https://youtube.com/watch?v=sample3'),
('Brioche Roti Mewah Prancis', 'Pencampuran mentega masif untuk tekstur roti selembut sutra.', 1, 2, 'pending', 'https://youtube.com/watch?v=sample4'),
('Bagel ala New York', 'Teknik rebus sebelum panggang untuk tekstur kenyal luar dalam.', 1, 2, 'active', 'https://youtube.com/watch?v=sample5'),
('Roti Tawar Gandum Utuh', 'Pilihan sehat sarapan pagi kaya serat dan nutrisi.', 1, 2, 'draft', 'https://youtube.com/watch?v=sample6'),
('Focaccia Art & Rosemary', 'Seni menghias permukaan roti focaccia dengan sayuran segar.', 1, 2, 'active', 'https://youtube.com/watch?v=sample7'),
('Pain de Campagne Klasik', 'Roti pedesaan Prancis dengan campuran tepung gandum hitam.', 1, 2, 'active', 'https://youtube.com/watch?v=sample8'),
('Milk Bread Hokkaido', 'Teknik tangzhong untuk roti super empuk tahan lama.', 1, 2, 'pending', 'https://youtube.com/watch?v=sample9'),
('Pretzel Jerman Tradisional', 'Pencelupan larutan lindi untuk warna cokelat khas pretzel.', 1, 2, 'active', 'https://youtube.com/watch?v=sample10');

-- Guru 2: Diva (Category ID: 2 - Traditional Indonesian Cakes)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Bolu Kukus Mekar Klasik', 'Tips agar bolu kukus merekah sempurna tanpa bahan pengawet.', 2, 3, 'active', 'https://youtube.com/watch?v=sample11'),
('Kue Lapis Legit Spesial', 'Teknik panggang berlapis lapis dengan rempah spekuk.', 2, 3, 'active', 'https://youtube.com/watch?v=sample12'),
('Klepon Pandan Lumer', 'Membuat isian gula merah cair yang meledak di mulut.', 2, 3, 'active', 'https://youtube.com/watch?v=sample13'),
('Onde-Onde Ketan Hijau', 'Kulit renyah berbalur wijen dengan isian kacang hijau lembut.', 2, 3, 'pending', 'https://youtube.com/watch?v=sample14'),
('Nagasari Pisang Wangi', 'Kue tradisional bungkus daun pisang aroma santan kelapa.', 2, 3, 'active', 'https://youtube.com/watch?v=sample15'),
('Putu Ayu Lembut', 'Kue basah kukus aroma pandan tabur kelapa parut.', 2, 3, 'draft', 'https://youtube.com/watch?v=sample16'),
('Serabi Solo Kuah Santan', 'Teknik cetak serabi teflon bersarang sempurna.', 2, 3, 'active', 'https://youtube.com/watch?v=sample17'),
('Kue Talam Ubi Ungu', 'Kombinasi gurih santan dan manis ubi ungu legit.', 2, 3, 'active', 'https://youtube.com/watch?v=sample18'),
('Dadar Gulung Unti Kelapa', 'Kulit dadar berpori cantik isi gula kelapa manis.', 2, 3, 'pending', 'https://youtube.com/watch?v=sample19'),
('Getuk Lindri Tradisional', 'Pengolahan singkong rebus menjadi camilan cantik berwarna.', 2, 3, 'active', 'https://youtube.com/watch?v=sample20');

-- Guru 3: Fadhiyah (Category ID: 3 - Cookies & Small Bites)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Classic Choco Chip Cookies', 'Tekstur renyah di luar dan chewy di bagian tengah.', 3, 4, 'active', 'https://youtube.com/watch?v=sample21'),
('Nastar Selai Nanas Premium', 'Membuat selai nanas padat dan bulatan adonan lumer.', 3, 4, 'active', 'https://youtube.com/watch?v=sample22'),
('Kastengel Gurih Keju Edam', 'Taburan keju melimpah dengan aroma mentega harum.', 3, 4, 'active', 'https://youtube.com/watch?v=sample23'),
('Putri Salju Mentega', 'Cookies lembut berselimut gula dingin manis.', 3, 4, 'pending', 'https://youtube.com/watch?v=sample24'),
('Matcha Green Tea Sablé', 'Biskuit mentega Prancis rasa teh hijau jepang.', 3, 4, 'active', 'https://youtube.com/watch?v=sample25'),
('Almond Florentine Cookies', 'Kue kering karamel tipis bertabur irisan almond.', 3, 4, 'draft', 'https://youtube.com/watch?v=sample26'),
('Red Velvet Crinkles', 'Cookies berbentuk retak estetik warna merah pekat.', 3, 4, 'active', 'https://youtube.com/watch?v=sample27'),
('Peanut Butter Cookies', 'Camilan gurih kacang tanah panggang klasik.', 3, 4, 'active', 'https://youtube.com/watch?v=sample28'),
('Biscotti Italia Double Choc', 'Kue panggang dua kali yang renyah celup kopi.', 3, 4, 'pending', 'https://youtube.com/watch?v=sample29'),
('Thumbprint Strawberry Jam', 'Biskuit cantik berlubang tengah isi selai buah.', 3, 4, 'active', 'https://youtube.com/watch?v=sample30');

-- Guru 4: Rasyah (Category ID: 4 - Cakes Decorating)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Dasar Ice Cream & Buttercream', 'Membuat krim mentega halus tanpa butiran gula.', 4, 5, 'active', 'https://youtube.com/watch?v=sample31'),
('Smoothing Kue Tepi Tajam', 'Teknik meratakan kue ulang tahun dengan scraper logam.', 4, 5, 'active', 'https://youtube.com/watch?v=sample32'),
('Korean Vintage Cake Piping', 'Seni menghias kue gaya korea dengan spuit rumit.', 4, 5, 'active', 'https://youtube.com/watch?v=sample33'),
('Floral Buttercream Painting', 'Melukis bunga mawar langsung di atas kue tart.', 4, 5, 'pending', 'https://youtube.com/watch?v=sample34'),
('Mirror Glaze Cake Modern', 'Teknik melapisi kue dengan efek cermin mengkilap.', 4, 5, 'active', 'https://youtube.com/watch?v=sample35'),
('Chocolate Ganache Drip', 'Aplikasi tetesan cokelat estetik di pinggiran kue.', 4, 5, 'draft', 'https://youtube.com/watch?v=sample36'),
('Fondant Sugar Flowers', 'Membuat kelopak bunga peony dari bahan fondant elastis.', 4, 5, 'active', 'https://youtube.com/watch?v=sample37'),
('Ombre Buttercream Shading', 'Gradasi warna artistik dari gelap ke terang.', 4, 5, 'active', 'https://youtube.com/watch?v=sample38'),
('Wafer Paper Butterfly Decor', 'Membuat hiasan kupu-kupu transparan dari kertas wafer.', 4, 5, 'pending', 'https://youtube.com/watch?v=sample39'),
('Geometric Metallic Cakes', 'Sentuhan cat emas mewah pada dekorasi kue modern.', 4, 5, 'active', 'https://youtube.com/watch?v=sample40');

-- Guru 5: Ayu (Category ID: 5 - French Patisserie & Pastry)
INSERT INTO courses (title, description, category_id, instructor_id, status, video_url) VALUES
('Masterclass Classic Croissant', 'Teknik laminasi lipatan mentega untuk croissant berongga sarang laba-laba.', 5, 6, 'active', 'https://youtube.com/watch?v=sample41'),
('Pain au Chocolat Otentik', 'Baluran batangan cokelat premium dalam balutan pastry renyah.', 5, 6, 'active', 'https://youtube.com/watch?v=sample42'),
('Kouign-Amann Bretons', 'Kue mentega karamel berlapis asal wilayah Brittany.', 5, 6, 'active', 'https://youtube.com/watch?v=sample43'),
('Fruit Tartlet Crème Patissière', 'Kulit pie renyah isi vla vanila custard dan buah segar.', 5, 6, 'pending', 'https://youtube.com/watch?v=sample44'),
('Choux à la Crème & Craquelin', 'Kue sus renyah dengan topping biskuit craquelin di atasnya.', 5, 6, 'active', 'https://youtube.com/watch?v=sample45'),
('Éclairs Cokelat Berkilau', 'Pastry panjang isi krim diplomat lembut berlapis fondant.', 5, 6, 'draft', 'https://youtube.com/watch?v=sample46'),
('Mille-Feuille Napoleon Klasik', 'Tiga lapis puff pastry renyah berselang-seling vla custard.', 5, 6, 'active', 'https://youtube.com/watch?v=sample47'),
('Opera Cake Mewah Prancis', 'Kue espong almond berendam kopi dengan ganache cokelat.', 5, 6, 'active', 'https://youtube.com/watch?v=sample48'),
('Macaron Prancis Anti Gagal', 'Kunci kaki macaron (feet) mengembang dan kulit mulus.', 5, 6, 'pending', 'https://youtube.com/watch?v=sample49'),
('Madeleine Lemon Keik Cangkang', 'Kue spons kecil khas Prancis berbentuk kerang laut.', 5, 6, 'active', 'https://youtube.com/watch?v=sample50');




