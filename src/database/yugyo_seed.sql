SET search_path TO public;

-- Bersihkan data lama & reset urutan ID
TRUNCATE TABLE enrollments, course_modules, courses, categories, users RESTART IDENTITY CASCADE;

-- 1. Seed Users (Admin & 5 Chef/Instructors)
INSERT INTO users (full_name, email, password, role) VALUES
  ('Admin Yugyo', 'admin@yugyo.com', 'admin123', 'admin'),
  ('Chef Diva', 'diva@yugyo.com', 'diva1234', 'teacher'),
  ('Chef Firah', 'firah@yugyo.com', 'firah1234', 'teacher'),
  ('Chef Fadhiyah', 'fafa@yugyo.com', 'fafa1234', 'teacher'),
  ('Chef Rasyah', 'aca@yugyo.com', 'rasyah1234', 'teacher'),
  ('Chef Yuyu', 'yuyu@yugyo.com', 'yuyu1234', 'teacher');

-- 2. Seed 5 Kategori Utama Bakery
INSERT INTO categories (name, description) VALUES
  ('Bread & Yeast Goods', 'Kategori ini berfokus pada teknik pengulian, fermentasi ragi, dan pengembangan tekstur roti yang empuk maupun berongga.'),
  ('Cake Decorating', 'Kategori ini berfokus pada estetika, teknik pelapisan kue, seni menghias, serta pengaplikasian berbagai bahan icing dan dekorasi.'),
  ('Cookies & Small Bites', 'Kategori ini berfokus pada camilan berukuran gigitan (bite-sized) yang renyah, legit, atau tahan lama untuk hantaran maupun stok camilan.'),
  ('French Pâtisserie & Pastry', 'Kategori ini menekankan ketepatan pengukuran (precision), teknik klasik tingkat tinggi, serta estetika dessert mewah ala toko kue Prancis.'),
  ('Traditional Indonesian Cakes', 'Kategori ini berfokus pada pelestarian resep dan teknik pengolahan jajanan pasar serta kue basah/legendaris khas Indonesia menggunakan bahan-bahan lokal.');

-- 3. Seed 25 Kursus Lengkap beserta Kategori, Instruktur, & Jadwal
INSERT INTO courses (title, description, category_id, instructor_id, start_date, end_date, status)
SELECT
  v.title,
  v.description,
  c.id AS category_id,
  u.id AS instructor_id,
  v.start_date::DATE,
  v.end_date::DATE,
  'active'
FROM (VALUES
  -- 1. Bread & Yeast Goods (Chef Diva)
  ('Artisan Country Sourdough Bread', 'Mempelajari teknik pemeliharaan starter alami, pencampuran adonan (autolyse), teknik stretch and fold, hingga pembentukan pola sayatan (scoring) pada roti sourdough klasik.', 'Bread & Yeast Goods', 'diva@yugyo.com', '2026-11-25', '2026-12-20'),
  ('Classic Japanese Milk Bread (Shokupan)', 'Teknik membuat roti tawar super lembut dengan metode tangzhong (water roux) agar serat roti bertahan empuk lebih lama.', 'Bread & Yeast Goods', 'diva@yugyo.com', NULL, NULL),
  ('Stuffed Sweet Buns (Aneka Roti Manis Klasik & Modern)', 'Pembuatan adonan roti manis beragi dengan berbagai isian populer seperti cokelat lumer, keju manis, dan kelapa pandan.', 'Bread & Yeast Goods', 'diva@yugyo.com', NULL, NULL),
  ('Authentic Italian Focaccia', 'Teknik membuat roti datar (flatbread) Italia dengan taburan rosemary, minyak zaitun, tomat ceri, dan seni dekorasi permukaan (focaccia art).', 'Bread & Yeast Goods', 'diva@yugyo.com', '2026-12-02', '2026-12-22'),
  ('Flaky Cinnamon Rolls', 'Pembuatan gulungan roti manis berempah kayu manis yang dilapisi dengan cream cheese frosting di atasnya.', 'Bread & Yeast Goods', 'diva@yugyo.com', NULL, NULL),

  -- 2. Cake Decorating (Chef Firah)
  ('Basic Buttercream Piping Techniques', 'Mempelajari cara membuat buttercream yang stabil dan menguasai berbagai jenis spuit (nozzle) untuk membentuk hiasan bunga mawar, daun, serta border dekoratif pada kue.', 'Cake Decorating', 'firah@yugyo.com', NULL, NULL),
  ('Korean Minimalist Bento Cake', 'Teknik mendekorasi kue ukuran mini (lunch box cake) dengan gaya minimalis, sapuan warna pastel, dan tulisan pesan menggunakan gel icing.', 'Cake Decorating', 'firah@yugyo.com', NULL, NULL),
  ('Smooth Fondant Covering & Sharp Edges', 'Teknik melapis kue tart menggunakan fondant gula pasta secara rapi tanpa gelembung udara dan menghasilkan sudut tepi kue yang tajam (sharp edges).', 'Cake Decorating', 'firah@yugyo.com', '2026-12-05', '2027-01-10'),
  ('Chiffon Cake & Fresh Cream Coating', 'Teknik memanggang kue sifon yang ringan serta menguasai teknik memoles whipped cream secara rata dan mulus (smooth surface).', 'Cake Decorating', 'firah@yugyo.com', NULL, NULL),
  ('Chocolate Ganache Drip Cake', 'Teknik pembuatan kue bertingkat dengan hiasan tetesan ganache cokelat yang estetik di sisi kue beserta susunan topping dekoratif di bagian atasnya.', 'Cake Decorating', 'firah@yugyo.com', '2026-12-12', '2027-01-15'),

  -- 3. Cookies & Small Bites (Chef Fadhiyah)
  ('Authentic Indonesian Nastar & Kastengel', 'Pembuatan kue kering tradisional Lebaran dengan tekstur lumer di mulut, adonan selai nanas homemade, serta taburan keju edam/gouda yang gurih.', 'Cookies & Small Bites', 'fafa@yugyo.com', NULL, NULL),
  ('Chewy Chocolate Chip Cookies', 'Teknik membuat kue kering dengan tekstur pinggiran renyah namun bagian tengahnya lembut dan basah (chewy) ala kafe modern.', 'Cookies & Small Bites', 'fafa@yugyo.com', NULL, NULL),
  ('Fudgy Crinkle Brownies', 'Pembuatan brownies panggang mini dengan permukaan retak-retak putih gula (crinkle top) dan bagian dalam yang sangat padat serta nyokelat (fudgy).', 'Cookies & Small Bites', 'fafa@yugyo.com', NULL, NULL),
  ('Royal Iced Decorated Sugar Cookies', 'Teknik memanggang butter cookies bentuk kustom dan menghias permukaannya menggunakan teknik flooding dan piping royal icing warna-warni.', 'Cookies & Small Bites', 'fafa@yugyo.com', '2026-12-08', '2026-12-28'),
  ('Traditional Putri Salju (Snow White Cookies)', 'Pembuatan kue kering kacang berbentuk bulatan lembut yang diselimuti taburan gula halus dingin yang melimpah.', 'Cookies & Small Bites', 'fafa@yugyo.com', NULL, NULL),

  -- 4. French Pâtisserie & Pastry (Chef Rasyah)
  ('Classic Butter Croissant & Laminated Dough', 'Teknik melipat adonan berlapis lemak mentah (butter lamination) yang kompleks untuk menghasilkan rongga sarang lebah yang sempurna pada croissant.', 'French Pâtisserie & Pastry', 'aca@yugyo.com', '2026-12-01', '2027-01-05'),
  ('Authentic French Macarons', 'Teknik membuat cangkang makaron berbahan dasar tepung almond dengan kaki makaron (feet) yang mulus serta isian ganache atau fruit curd di tengahnya.', 'French Pâtisserie & Pastry', 'aca@yugyo.com', '2026-12-10', '2027-01-12'),
  ('Choux Pastry (Éclairs & Craquelin Choux)', 'Pembuatan sus berongga sempurna dengan tambahan lapisan kerenyahan craquelin di atasnya serta pengisian krim vla (pastry cream) vanila.', 'French Pâtisserie & Pastry', 'aca@yugyo.com', NULL, NULL),
  ('Classic Fruit Tartlets', 'Pembuatan kulit pai renyah (pâte sablée) berukuran kecil yang diisi dengan vla lembut serta susunan buah segar berkilau dengan olesan apricot glaze.', 'French Pâtisserie & Pastry', 'aca@yugyo.com', NULL, NULL),
  ('Opera Cake', 'Pembuatan kue lapis mewah berlapis biskuit joconde almond, sirup kopi, krim mentega kopi (coffee buttercream), dan lapisan cokelat ganache tipis.', 'French Pâtisserie & Pastry', 'aca@yugyo.com', '2026-12-15', '2027-01-20'),

  -- 5. Traditional Indonesian Cakes (Chef Yuyu)
  ('Authentic Lapis Legit (Spekkoek)', 'Teknik memanggang kue lapis tradisional berlapis-lapis dengan rempah spekuk, ketepatan suhu oven lapis per lapis, serta penggunaan kuning telur dalam jumlah banyak.', 'Traditional Indonesian Cakes', 'yuyu@yugyo.com', '2026-12-18', '2027-01-25'),
  ('Kue Lapis Surabaya (Spiku)', 'Teknik membuat bolu tiga lapis klasik khas Surabaya dengan warna kuning dan cokelat serta olesan selai nanas asli di antara lapisannya.', 'Traditional Indonesian Cakes', 'yuyu@yugyo.com', NULL, NULL),
  ('Klepon & Onde-Onde Klasik', 'Pembuatan jajanan pasar berbahan dasar tepung ketan dengan isian gula merah cair yang meletup di mulut serta balutan kelapa parut kukus.', 'Traditional Indonesian Cakes', 'yuyu@yugyo.com', NULL, NULL),
  ('Dadar Gulung & Nagasari', 'Teknik membuat kulit dadar tipis beraroma pandan dengan isian unti kelapa gula merah, serta kue nagasari pisang berbalut daun pisang.', 'Traditional Indonesian Cakes', 'yuyu@yugyo.com', NULL, NULL),
  ('Bolu Kukus Mekar Tradisional', 'Teknik membuat bolu kukus merekah sempurna menggunakan bantuan air soda atau teknik pengukusan suhu tinggi tanpa bahan pengembang buatan berlebih.', 'Traditional Indonesian Cakes', 'yuyu@yugyo.com', NULL, NULL)
) AS v(title, description, cat_name, chef_email, start_date, end_date)
JOIN categories c ON c.name = v.cat_name
JOIN users u ON u.email = v.chef_email;