--Memasukkan Data Kategori Spesifik
INSERT INTO categories (name, slug) VALUES 
('Web Development', 'web-development'),
('Artificial Intelligence', 'artificial-intelligence'),
('Graphic Design', 'graphic-design'),
('Business & Marketing', 'business-marketing'),
('Language & Speaking', 'language-speaking'),
('Database Systems', 'database-systems')
ON CONFLICT (slug) DO NOTHING;

--Memasukkan Data Users (Admin & Instruktur)
INSERT INTO users (full_name, email, password_hash, role, status) VALUES 
('Admin Yugyo', 'admin@yugyo.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'admin', 'active'),
('Nurhayu Fiantika', 'yuyu@gmail.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Dr. Ahmad Zaki', 'zaki@gmail.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'pending')
ON CONFLICT (email) DO NOTHING;

--Memasukkan Data Kursus Sesuai Kategori Spesifik
INSERT INTO courses (title, description, status, instructor_id, category_id) VALUES 
-- Kategori: Web Development
('Pemrograman Frontend dengan React dan Tailwind CSS', 'Membangun antarmuka web interaktif yang responsif menggunakan komponen modern React serta utilitas penataan gaya dari Tailwind CSS.', 'active', 2, (SELECT id FROM categories WHERE slug = 'web-development')),

-- Kategori: Artificial Intelligence
('Artificial Intelligence Bootcamp', 'Pengantar kecerdasan buatan, machine learning, dan implementasi python.', 'active', 2, (SELECT id FROM categories WHERE slug = 'artificial-intelligence')),
('Struktur Kontrol dan Pemrosesan Data dengan Python', 'Memahami logika pemrograman dasar menggunakan Python, mulai dari penggunaan variabel, percabangan, perulangan, hingga manipulasi data menggunakan pustaka Pandas.', 'active', 2, (SELECT id FROM categories WHERE slug = 'artificial-intelligence')),

-- Kategori: Graphic Design
('Complete Graphic Design Course', 'Belajar desain grafis dari dasar hingga mahir menggunakan berbagai tools modern.', 'active', 2, (SELECT id FROM categories WHERE slug = 'graphic-design')),
('Teknik Ilustrasi Digital dan Karakter Desain', 'Memahami prinsip dasar proporsi tubuh, pewarnaan digital, dan teknik shading untuk menciptakan karya seni ilustrasi bergaya komik atau chibi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'graphic-design')),

-- Kategori: Business & Marketing
('Penyusunan Business Model Canvas (BMC)', 'Membedah sembilan blok utama dalam kerangka model bisnis mulai dari value proposition, customer segments, hingga revenue streams untuk merintis usaha.', 'active', 2, (SELECT id FROM categories WHERE slug = 'business-marketing')),
('Strategi Branding dan Social Media Marketing', 'Mempelajari cara membangun identitas merek (branding), pembuatan konten kreatif, dan optimalisasi platform digital untuk meningkatkan penjualan produk.', 'active', 2, (SELECT id FROM categories WHERE slug = 'business-marketing')),
('Pencatatan Laporan Laba Rugi dan Arus Kas', 'Menguasai dasar-dasar pembukuan keuangan sederhana bagi usaha kecil dan menengah agar arus kas bisnis terpantau dengan sehat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'business-marketing')),

-- Kategori: Language & Speaking
('Advance Spoken English & Business', 'Kursus bahasa Inggris profesional untuk kebutuhan dunia kerja dan bisnis.', 'Pending Review', 2, (SELECT id FROM categories WHERE slug = 'language-speaking')),
('Tata Bahasa Dasar (Bunpou) dan Aksara Kana', 'Mengenal huruf Hiragana dan Katakana, pola kalimat dasar (Joshi), serta percakapan sehari-hari dalam konteks sosial masyarakat Jepang.', 'active', 2, (SELECT id FROM categories WHERE slug = 'language-speaking')),

-- Kategori: Database Systems
('Database Systems & PostgreSQL Masterclass', 'Belajar perancangan skema relasional, query kompleks, dan normalisasi database.', 'active', 2, (SELECT id FROM categories WHERE slug = 'database-systems')),
('Perancangan Skema Relasional dan PostgreSQL', 'Mempelajari cara membuat tabel, menulis query SQL, melakukan operasi JOIN, serta menerapkan batasan integritas data pada sistem manajemen database relasional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'database-systems'));


-- Kosongkan relasi kategori pada courses sementara
UPDATE courses SET category_id = NULL;

-- Masukkan kategori mata pelajaran
INSERT INTO categories (name, slug) VALUES 
('Matematika', 'matematika'),
('Biologi', 'biologi'),
('Kimia', 'kimia'),
('Fisika', 'fisika'),
('Bahasa Inggris', 'bahasa-inggris'),
('Bahasa Indonesia', 'bahasa-indonesia'),
('Sejarah', 'sejarah'),
('Sosiologi', 'sosiologi'),
('Ekonomi', 'ekonomi'),
('Geografi', 'geografi'),
('Seni dan Budaya', 'seni-dan-budaya'),
('Teknologi', 'teknologi')
ON CONFLICT (slug) DO NOTHING;

-- Memasukkan data materi disetiap kursus/kategori
INSERT INTO courses (title, description, status, instructor_id, category_id) VALUES 
-- Matematika
('Aljabar Linear dan Fungsi Kuadrat', 'Mempelajari konsep dasar matriks, sistem persamaan linear dua variabel (SPLDV), serta grafik dan aplikasi fungsi kuadrat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),

-- Biologi
('Struktur dan Fungsi Sel Tumbuhan & Hewan', 'Membedakan organel-organel sel, mekanisme transpor membran, serta proses metabolisme seluler.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),

-- Kimia
('Stoikiometri dan Ikatan Kimia', 'Memahami hukum-hukum dasar kimia, perhitungan mol, rumus molekul, serta proses terbentuknya ikatan kimia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),

-- Fisika
('Kinematika Gerak Lurus dan Hukum Newton', 'Menganalisis pergerakan benda melalui besaran jarak, kecepatan, percepatan, serta hukum Newton.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),

-- Bahasa Inggris
('Academic Essay Writing and Public Speaking', 'Mengembangkan kemampuan menyusun esai analitis berbahasa Inggris serta melatih teknik komunikasi publik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),

-- Bahasa Indonesia
('Teks Negosiasi dan Debat Ilmiah', 'Mempelajari kaidah kebahasaan, struktur teks negosiasi bisnis, serta teknik berargumentasi secara logis.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),

-- Sejarah
('Dinamika Pergerakan Nasional Indonesia', 'Menelaah latar belakang lahirnya pergerakan nasional, organisasi awal abad ke-20, hingga Proklamasi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),

-- Sosiologi
('Konflik, Integrasi, dan Perubahan Sosial', 'Mempelajari bentuk-bentuk konflik dalam masyarakat multikultural serta penyelesaiannya melalui mediasi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),

-- Ekonomi
('Permintaan, Penawaran, dan Keseimbangan Pasar', 'Menganalisis hukum permintaan dan penawaran serta cara terbentuknya harga keseimbangan (equilibrium).', 'active', 2, (SELECT id FROM categories WHERE slug = 'Ekonomi')),

-- Geografi
('Dinamika Litosfer dan Mitigasi Bencana', 'Memahami struktur lapisan bumi, tenaga endogen dan eksogen, serta langkah mitigasi bencana alam.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),

-- Seni dan Budaya
('Teknik Ilustrasi Digital dan Karakter Desain', 'Memahami prinsip dasar proporsi tubuh, pewarnaan digital, dan teknik shading untuk seni ilustrasi komik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),

-- Teknologi
('Pemrograman Frontend dengan React & Tailwind', 'Membangun antarmuka web interaktif yang responsif menggunakan komponen modern React dan Tailwind CSS.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi'));


-- Penambahan materi masing-masing 10 setiap kategori
INSERT INTO courses (title, description, status, instructor_id, category_id) VALUES 

-- --- 1. MATEMATIKA ---
('Aljabar Linear dan Fungsi Kuadrat', 'Mempelajari konsep dasar matriks, sistem persamaan linear dua variabel (SPLDV), serta grafik dan aplikasi fungsi kuadrat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Kalkulus Diferensial: Turunan dan Aplikasi', 'Mempelajari konsep limit, turunan fungsi aljabar, dan aplikasinya dalam optimasi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Integral Tentu dan Tak Tentu', 'Memahami teknik pengintegralan fungsi dan aplikasinya untuk menghitung luas daerah.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Trigonometri Lanjut dan Identitas Sudut', 'Mempelajari rumus jumlah dan selisih sudut, serta persamaan trigonometri.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Matriks dan Operasi Transformasi Linear', 'Melakukan operasi hitung matriks, determinan, invers, dan transformasi geometri.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Statistika Inferensial dan Probabilitas', 'Menganalisis data statistik, peluang kejadian, dan distribusi normal.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Barisan dan Deret Aritmatika Geometri', 'Menghitung pola bilangan, suku ke-n, dan jumlah deret tak hingga.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Logika Matematika dan Teori Himpunan', 'Mempelajari tabel kehabisan, implikasi, biimplikasi, dan diagram Venn.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Geometri Bidang Datar dan Ruang 3D', 'Menghitung jarak titik ke garis dan bidang pada bangun ruang.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),
('Program Linear untuk Optimasi Masalah', 'Menentukan nilai maksimum dan minimum fungsi objektif pada daerah penyelesaian.', 'active', 2, (SELECT id FROM categories WHERE slug = 'matematika')),

-- --- 2. BIOLOGI ---
('Struktur dan Fungsi Sel Tumbuhan & Hewan', 'Membedakan organel-organel sel, mekanisme transpor membran, serta metabolisme sel.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Genetika Dasar dan Hukum Mendel', 'Mempelajari pola pewarisan sifat makhluk hidup berdasarkan hukum Mendel I dan II.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Sistem Koordinasi dan Indra Manusia', 'Mempelajari sistem saraf, hormon, dan panca indra pada manusia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Sistem Kekebalan Tubuh (Imunologi)', 'Memahami mekanisme pertahanan tubuh non-spesifik dan spesifik terhadap patogen.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Metabolisme Sel: Enzim, Respirasi, dan Fotosintesis', 'Mempelajari proses katabolisme dan anabolisme pembentukan energi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Ekologi dan Keseimbangan Lingkungan Hidup', 'Menganalisis aliran energi dalam ekosistem dan daur biogeokimia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Evolusi dan Asal-Usul Kehidupan di Bumi', 'Memahami teori seleksi alam Darwin dan bukti-bukti evolusi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Bioteknologi Modern dan Rekayasa Genetik', 'Mempelajari kultur jaringan, kloning, dan teknologi plasmid DNA.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Anatomi Fisiologi Sistem Peredaran Darah', 'Memahami struktur jantung, pembuluh darah, dan sistem limfatik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),
('Pertumbuhan dan Perkembangan Tumbuhan', 'Mempelajari pengaruh aukson, giberelin, dan faktor lingkungan pada tanaman.', 'active', 2, (SELECT id FROM categories WHERE slug = 'biologi')),

-- --- 3. KIMIA ---
('Stoikiometri dan Konsep Mol Lanjut', 'Menghitung kadar zat, pereaksi pembatas, dan rumus empiris molekul.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Ikatan Ion, Kovalen, dan Logam', 'Memahami proses pembentukan ikatan kimia dan kepolaran senyawa.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Termokimia: Entalpi dan Hukum Hess', 'Menghitung perubahan entalpi reaksi kimia eksoterm dan endoterm.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Laju Reaksi dan Faktor Penentu', 'Menganalisis orde reaksi, suhu, katalis, dan luas permukaan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Kesetimbangan Kimia dalam Industri', 'Memahami pergeseran kesetimbangan kimia azas Le Chatelier.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Larutan Asam, Basa, dan Titrasi pH', 'Menghitung konsentrasi larutan penyangga (buffer) dan hidrolisis garam.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Elektrokimia: Sel Volta dan Sel Elektrolisis', 'Mempelajari potensial sel standar dan hukum Faraday pada penyepuhan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Kimia Unsur Golongan Utama dan Transisi', 'Mempelajari sifat kelimpahan unsur alkali, halogen, dan periode 3.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Senyawa Karbon dan Gugus Fungsi Organik', 'Mempelajari alkana, alkena, alkuna, alkohol, hingga asam karboksilat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),
('Polimer, Karbohidrat, dan Protein', 'Mempelajari struktur makromolekul alami dan sintetis.', 'active', 2, (SELECT id FROM categories WHERE slug = 'kimia')),

-- --- 4. FISIKA ---
('Kinematika Gerak Lurus Berubah Beraturan', 'Menganalisis besaran posisi, kecepatan, dan percepatan pada GLBB.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Penerapan Hukum Newton pada Dinamika Gerak', 'Menghitung gaya gesek, tegangan tali, dan gerak pada bidang miring.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Usaha, Energi, dan Hukum Kekekalan Energi', 'Menghitung energi kinetik, potensial, dan daya mesin.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Momentum, Impuls, dan Tumbukan Benda', 'Menerapkan hukum kekekalan momentum pada berbagai jenis tumbukan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Dinamika Rotasi dan Keseimbangan Benda Tegar', 'Mempelajari momen gaya (torsi), momen inersia, dan titik berat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Fluida Statis dan Dinamis dalam Pipa', 'Memahami hukum Archimedes, Pascal, dan persamaan kontinuitas Bernoulli.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Termodinamika: Hukum Gas Ideal & Mesin Carnot', 'Mempelajari siklus termodinamika dan efisiensi mesin kalor.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Gelombang Mekanik dan Osilasi Harmonik', 'Menganalisis cepat rambat gelombang, pantulan, dan interferensi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Medan Listrik dan Hukum Coulomb', 'Menghitung besar gaya listrik, kuat medan, dan potensial listrik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),
('Induksi Elektromagnetik dan Hukum Faraday', 'Mempelajari prinsip kerja generator, transformator, dan arus bolak-balik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'fisika')),

-- --- 5. BAHASA INGGRIS ---
('Academic Essay Writing and Public Speaking', 'Menyusun esai analitis berbahasa Inggris dan teknik komunikasi publik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Mastering TOEFL & IELTS Speaking Strategies', 'Strategi sukses menghadapi ujian kecakapan bahasa Inggris internasional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Advanced Grammar and Syntax Structures', 'Memperdalam struktur kalimat kompleks dan klausa subordinat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Business English Correspondence & Emailing', 'Teknik penulisan surel formal dan negosiasi bisnis global.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Critical Reading and Literature Analysis', 'Menganalisis teks sastra dan artikel jurnal ilmiah internasional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Professional Presentation & Pitching Skills', 'Cara membawakan presentasi bisnis yang memukau dan persuasif.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Idioms, Phrasal Verbs, and Everyday Slang', 'Memahami ungkapan idiomatis dalam percakapan sehari-hari penutur asli.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Listening Comprehension for Global Media', 'Melatih ketajaman pendengaran melalui siaran podcast dan berita asing.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Creative Storytelling and Narrative Writing', 'Menulis cerita pendek dan skenario kreatif berbahasa Inggris.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),
('Cross-Cultural Communication in Workplace', 'Memahami etika komunikasi lintas budaya di lingkungan kerja multinasional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-inggris')),

-- --- 6. BAHASA INDONESIA ---
('Teks Negosiasi dan Debat Ilmiah', 'Mempelajari kaidah kebahasaan, struktur teks negosiasi, dan tata cara debat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Penyusunan Karya Tulis Ilmiah dan Skripsi', 'Panduan lengkap penulisan bab pendahuluan hingga daftar pustaka.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Analisis Novel dan Apresiasi Sastra Klasik', 'Mengupas unsur intrinsik dan ekstrinsik karya sastra Indonesia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Ejaan Yang Disempurnakan (EYD) & PUEBI', 'Aturan penulisan huruf, kata, dan tanda baca yang baku.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Jurnalistik Dasar dan Teknik Wawancara', 'Teknik peliputan berita, penulisan lead, dan kode etik jurnalistik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Retorika dan Seni Berpidato yang Efektif', 'Melatih intonasi, gestur, dan teknik berbicara di depan umum.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Resensi Buku dan Artikel Opini Media', 'Cara menulis ulasan kritis terhadap buku atau isu sosial di koran.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Drama: Penulisan Naskah dan Pementasan', 'Membimbing pembuatan naskah lakon teater sekolah.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Surat Menyurat Resmi dan Administrasi', 'Format penulisan surat dinas, nota kesepahaman, dan proposal kegiatan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),
('Puisi: Struktur Fisik, Batin, dan Makna', 'Menganalisis majas, rima, dan pesan tersirat dalam karya puisi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'bahasa-indonesia')),

-- --- 7. SEJARAH ---
('Dinamika Pergerakan Nasional Indonesia', 'Menelaah organisasi pergerakan awal abad ke-20 hingga sumpah pemuda.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Peradaban Kuno Dunia: Mesir, Mesopotamia, Yunani', 'Mempelajari sejarah awal mula peradaban besar umat manusia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Kolonialisme dan Imperialisme di Nusantara', 'Dampak pendudukan bangsa Eropa terhadap sistem politik lokal.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Detik-Detik Proklamasi dan Revolusi Fisik', 'Perjuanganpertahanan kemerdekaan Indonesia tahun 1945–1949.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Perang Dunia I dan II: Dampak Global', 'Latar belakang geopolitik dan pembentukan Liga Bangsa-Bangsa.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Masa Demokrasi Parlementer dan Terpimpin', 'Kondisi politik Indonesia pasca pengakuan kedaulatan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Era Orde Baru hingga Reformasi 1998', 'Perjalanan sejarah politik modern Indonesia menjelang era keterbukaan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Kerajaan Hindu-Buddha di Nusantara', 'Menelusuri jejak peninggalan kerajaan Kutai, Sriwijaya, dan Majapahit.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Masuk dan Berkembangnya Islam di Indonesia', 'Peran para wali dan jalur rempah dalam penyebaran agama Islam.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),
('Perang Dingin dan Peta Politik Dunia Modern', 'Persaingan blok barat dan blok timur pasca perang dunia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sejarah')),

-- --- 8. SOSIOLOGI ---
('Konflik, Integrasi, dan Perubahan Sosial', 'Bentuk konflik dalam masyarakat majemuk dan upaya penyelesaiannya.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Stratifikasi dan Mobilitas Sosial Masyarakat', 'Mempelajari sistem kelas sosial dan saluran gerak sosial.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Lembaga Sosial dan Peran Keluarga', 'Fungsi pranata keluarga, agama, ekonomi, dan pendidikan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Penyimpangan Sosial dan Pengendaliannya', 'Menganalisis perilaku menyimpang dan peran lembaga penegak hukum.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Metodologi Penelitian Sosial Kualitatif', 'Teknik pengumpulan data wawancara, observasi, dan studi pustaka.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Globalisasi dan Modernisasi Budaya Lokal', 'Dampak masuknya budaya asing terhadap eksistensi kearifan lokal.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Kelompok Sosial dan Masyarakat Multikultural', 'Dinamika interaksi dalam kelompok primodial dan modern.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Sosiologi Perkotaan dan Pedesaan', 'Perbedaan pola kehidupan masyarakat agraris dan industrial.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Ketimpangan Sosial dan Kesejahteraan', 'Menganalisis kesenjangan pembangunan ekonomi antarwilayah.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),
('Gerakan Sosial dan Perubahan Kebijakan Publik', 'Peran aksi massa dalam mempengaruhi regulasi pemerintah.', 'active', 2, (SELECT id FROM categories WHERE slug = 'sosiologi')),

-- --- 9. EKONOMI ---
('Permintaan, Penawaran, dan Keseimbangan Pasar', 'Hukum pasar, elastisitas harga, dan titik equilibrium.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Pendapatan Nasional dan Pertumbuhan Ekonomi', 'Cara menghitung PDB, PNB, dan pendapatan per kapita.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Inflasi, Pengangguran, dan Kebijakan Fiskal', 'Dampak kenaikan harga umum terhadap daya beli masyarakat.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Perbankan, OJK, dan Kebijakan Moneter', 'Peran bank sentral dalam mengatur peredaran uang.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Perdagangan Internasional dan Kurs Valas', 'Analisis neraca pembayaran dan tarif bea masuk ekspor-impor.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Koperasi dan Kewirausahaan Mandiri', 'Prinsip pengelolaan sisa hasil usaha (SHU) dalam koperasi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Akuntansi Dasar: Laporan Laba Rugi & Neraca', 'Penyusunan siklus akuntansi perusahaan jasa dan dagang.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Pasar Modal dan Investasi Saham Pemula', 'Mengenal instrumen reksa dana, obligasi, dan bursa efek.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Ekonomi Mikro: Perilaku Produsen & Konsumen', 'Teori utilitas marginal dan biaya produksi jangka pendek.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),
('Manajemen Keuangan Pribadi dan Bisnis', 'Strategi pengelolaan anggaran, tabungan, dan manajemen utang.', 'active', 2, (SELECT id FROM categories WHERE slug = 'ekonomi')),

-- --- 10. GEOGRAFI ---
('Dinamika Litosfer dan Mitigasi Bencana', 'Struktur lapisan bumi, tektonik lempeng, dan mitigasi gempa.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Atmosfer: Cuaca, Iklim, dan Pemanasan Global', 'Lapisan udara, unsur cuaca, dan fenomena El Nino/La Nina.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Hidrosfer: Siklus Air dan Konservasi DAS', 'Pengelolaan daerah aliran sungai dan potensi air tanah.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Biosfer: Sebaran Flora dan Fauna Dunia', 'Faktor iklim dan relief yang mempengaruhi bioma di bumi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Sistem Informasi Geografis (SIG) & Penginderaan Jauh', 'Pemanfaatan citra satelit dan peta digital spasial.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Antroposfer: Dinamika Penduduk dan Demografi', 'Menghitung laju pertumbuhan penduduk dan migrasi.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Tata Guna Lahan dan Perencanaan Wilayah', 'Analisis pusat pertumbuhan ekonomi dan wilayah hinterland.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Sumber Daya Alam dan Pembangunan Berkelanjutan', 'Eksplorasi tambang ramah lingkungan dan energi terbarukan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Mitigasi Bencana Alam Gempa dan Tsunami', 'Sistem peringatan dini dan jalur evakuasi bencana.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),
('Geografi Regional Indonesia dan Dunia', 'Karakteristik fisik dan sosial negara-negara di dunia.', 'active', 2, (SELECT id FROM categories WHERE slug = 'geografi')),

-- --- 11. SENI DAN BUDAYA ---
('Teknik Ilustrasi Digital dan Karakter Desain', 'Prinsip proporsi tubuh, pewarnaan digital, dan shading komik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Seni Musik Tradisional dan Modern Akustik', 'Memahami tangga nada pentatonis dan diatonis alat musik.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Seni Tari Nusantara dan Koreografi Kreatif', 'Eksplorasi gerak tubuh dalam tarian daerah tradisional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Teater: Olah Tubuh, Vokal, dan Penokohan', 'Teknik pernapasan diafragma dan penjiwaan karakter panggung.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Seni Rupa 2D dan 3D: Lukisan & Patung', 'Teknik melukis kanvas, sketsa arsir, dan pematungan.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Fotografi Komersial dan Teknik Pencahayaan', 'Pengaturan segitiga exposure (ISO, Shutter Speed, Aperture).', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Kriya Tradisional dan Desain Produk Lokal', 'Pemanfaatan bahan alam untuk kerajinan tangan bernilai seni.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Sejarah Seni Rupa Dunia dan Indonesia', 'Mengenal aliran seni rupa dari masa klasik hingga kontemporer.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Sinematografi dan Penyutradaraan Film Pendek', 'Teknik pengambilan sudut kamera (camera angles) dan editing.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),
('Konservasi Warisan Budaya Tak Benda', 'Upaya pelestarian adat istiadat dan ritual tradisional.', 'active', 2, (SELECT id FROM categories WHERE slug = 'seni-dan-budaya')),

-- --- 12. TEKNOLOGI ---
('Pemrograman Frontend dengan React & Tailwind', 'Membangun antarmuka web interaktif dengan React dan Tailwind CSS.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Next.js App Router dan Server Actions', 'Membangun aplikasi web fullstack modern dengan kerangka Next.js.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Database PostgreSQL dan Relasi Kompleks', 'Perancangan skema relasional tabel dan penulisan query SQL lanjut.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Artificial Intelligence & Machine Learning Dasar', 'Pengenalan algoritma kecerdasan buatan dan pelatihan model data.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Python untuk Analisis Data dengan Pandas', 'Manipulasi dataset besar menggunakan pustaka Python Pandas.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Pengembangan Aplikasi Mobile dengan Flutter', 'Membuat aplikasi lintas platform untuk Android dan iOS.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('DevOps Dasar: Git, GitHub, dan CI/CD Pipeline', 'Manajemen versi kode sumber dan otomatisasi deployment.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Keamanan Siber dan Enkripsi Data Web', 'Mencegah celah kerentanan aplikasi dari serangan siber.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('UI/UX Design Masterclass dengan Figma', 'Membuat wireframe, prototype, dan desain antarmuka pengguna.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi')),
('Cloud Computing dan Arsitektur Server', 'Pengelolaan layanan peladen awan untuk aplikasi web.', 'active', 2, (SELECT id FROM categories WHERE slug = 'teknologi'));


--Menambahkan beberapa instructor lagi
INSERT INTO users (full_name, email, password_hash, role, status) VALUES 
('Salwa', 'salwa@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Firah', 'firah@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Fatimah', 'fatimah@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Andre', 'andre@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Diva', 'diva@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Syahrul', 'syahrul@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Teguh', 'teguh@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Fadhiyah', 'fadhiyah@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Rasyah', 'rasyah@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Cika', 'cika@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('Ayu', 'ayu@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active'),
('KING Tsaqif', 'tsaqif@instructor.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'instructor', 'active')
ON CONFLICT (email) DO NOTHING;


--Mengubah instructor_id pada tabel course sesuai kategori
UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Salwa')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Bahasa Indonesia%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Firah')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Bahasa Inggris%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Fatimah')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Biologi%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Andre')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Ekonomi%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Diva')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Fisika%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Syahrul')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Geografi%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Teguh')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Kimia%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Fadhiyah')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Matematika%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Rasyah')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Sejarah%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Cika')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Seni dan Budaya%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'Ayu')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Sosiologi%');

UPDATE courses SET instructor_id = (SELECT id FROM users WHERE full_name = 'KING Tsaqif')
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Teknologi%');


--Reset semua kursus menjadi Lifetime Access (NULL) terlebih dahulu
UPDATE courses 
SET start_date = NULL, end_date = NULL;

--Masukkan rentang waktu pada beberapa kelas
UPDATE courses
SET start_date = '2026-11-20', end_date = '2026-12-20'
WHERE id = (
  SELECT c.id FROM courses c 
  JOIN categories cat ON c.category_id = cat.id 
  WHERE LOWER(cat.name) = 'teknologi' 
  ORDER BY c.id DESC LIMIT 1 OFFSET 0
);

UPDATE courses
SET start_date = '2026-12-01', end_date = '2027-01-15'
WHERE id = (
  SELECT c.id FROM courses c 
  JOIN categories cat ON c.category_id = cat.id 
  WHERE LOWER(cat.name) = 'teknologi' 
  ORDER BY c.id DESC LIMIT 1 OFFSET 1
);

UPDATE courses
SET start_date = '2026-12-10', end_date = '2027-02-10'
WHERE id = (
  SELECT c.id FROM courses c 
  JOIN categories cat ON c.category_id = cat.id 
  WHERE LOWER(cat.name) = 'teknologi' 
  ORDER BY c.id DESC LIMIT 1 OFFSET 2
);

UPDATE courses
SET start_date = '2026-11-25', end_date = '2026-12-30'
WHERE id = (
  SELECT c.id FROM courses c 
  JOIN categories cat ON c.category_id = cat.id 
  WHERE LOWER(cat.name) = 'ekonomi' 
  ORDER BY c.id DESC LIMIT 1 OFFSET 0
);

UPDATE courses
SET start_date = '2027-01-05', end_date = '2027-02-28'
WHERE id = (
  SELECT c.id FROM courses c 
  JOIN categories cat ON c.category_id = cat.id 
  WHERE LOWER(cat.name) = 'ekonomi' 
  ORDER BY c.id DESC LIMIT 1 OFFSET 1
);