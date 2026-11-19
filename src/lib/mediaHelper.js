export const CATEGORY_IMAGE_MAP = [
  {
    keys: ['bread', 'yeast', 'roti'],
    image: '/pictures/categories/bread&yeast_goods.png',
    folder: 'bread',
  },
  {
    keys: ['cake', 'decor', 'dekor', 'frosting', 'glaze'],
    image: '/pictures/categories/cakes_decorating.png',
    folder: 'cakes_decor',
  },
  {
    keys: ['cookie', 'cookies', 'kue kering', 'sable', 'biscotti'],
    image: '/pictures/categories/cookies.png',
    folder: 'cookies',
  },
  {
    keys: ['french', 'patisserie', 'pastry', 'croissant', 'macaron', 'eclair', 'madeleine', 'mille', 'opera', 'choux', 'kouign'],
    image: '/pictures/categories/french_patisserie.png',
    folder: 'french_pastry',
  },
  {
    keys: ['indo', 'indonesia', 'tradisional', 'klepon', 'lapis', 'talam', 'nagasari', 'onde', 'putu', 'serabi', 'dadar', 'getuk', 'bolu'],
    image: '/pictures/categories/indonesian_cakes.png',
    folder: 'Indo_cakes',
  },
];

export const COURSE_IMAGE_RULES = [
  // Bread & Yeast Goods
  { folder: 'bread', file: 'bagel.png', keywords: ['bagel'] },
  { folder: 'bread', file: 'brioche.png', keywords: ['brioche'] },
  { folder: 'bread', file: 'ciabatta.png', keywords: ['ciabatta'] },
  { folder: 'bread', file: 'focaccia.png', keywords: ['focaccia'] },
  { folder: 'bread', file: 'milk_bread.png', keywords: ['milk bread', 'shokupan', 'roti susu'] },
  { folder: 'bread', file: 'Pain_de_Campagne.png', keywords: ['pain de campagne', 'campagne', 'country bread'] },
  { folder: 'bread', file: 'pretzel.png', keywords: ['pretzel'] },
  { folder: 'bread', file: 'ragi_roti.png', keywords: ['ragi', 'yeast', 'fermentasi ragi'] },
  { folder: 'bread', file: 'roti_tawar.png', keywords: ['roti tawar', 'white bread', 'sandwich bread'] },
  { folder: 'bread', file: 'sourdough.png', keywords: ['sourdough', 'levain', 'starter'] },

  // Cakes Decorating
  { folder: 'cakes_decor', file: 'cake_piping.png', keywords: ['piping', 'spuit', 'buttercream piping'] },
  { folder: 'cakes_decor', file: 'floral_painting.png', keywords: ['floral', 'bunga', 'painting', 'lukis'] },
  { folder: 'cakes_decor', file: 'fondan_sugar.png', keywords: ['fondan', 'fondant', 'sugar', 'gula'] },
  { folder: 'cakes_decor', file: 'ganache_drip.png', keywords: ['ganache', 'drip', 'cokelat leleh'] },
  { folder: 'cakes_decor', file: 'geomatric_metallic.png', keywords: ['geomatric', 'geometric', 'metallic', 'metalik', 'gold'] },
  { folder: 'cakes_decor', file: 'ice_cream.png', keywords: ['ice cream', 'es krim', 'gelato'] },
  { folder: 'cakes_decor', file: 'mirror_glaze.png', keywords: ['mirror glaze', 'glaze', 'cermin'] },
  { folder: 'cakes_decor', file: 'ombre_shadding.png', keywords: ['ombre', 'shadding', 'shading', 'gradasi'] },
  { folder: 'cakes_decor', file: 'smoothing_kue.png', keywords: ['smoothing', 'poles', 'rata', 'rapi'] },
  { folder: 'cakes_decor', file: 'wafer_paper.png', keywords: ['wafer paper', 'wafer'] },

  // Cookies
  { folder: 'cookies', file: 'biscotti.png', keywords: ['biscotti'] },
  { folder: 'cookies', file: 'crinckle.png', keywords: ['crinckle', 'crinkle'] },
  { folder: 'cookies', file: 'florentines.png', keywords: ['florentine', 'florentines', 'almond lace'] },
  { folder: 'cookies', file: 'kastengel.png', keywords: ['kastengel', 'kaastengels', 'keju'] },
  { folder: 'cookies', file: 'matcha_sable.png', keywords: ['matcha', 'sable', 'sablé'] },
  { folder: 'cookies', file: 'nastar.png', keywords: ['nastar', 'nanas', 'pineapple'] },
  { folder: 'cookies', file: 'peanut_cookie.png', keywords: ['peanut', 'kacang tanah'] },
  { folder: 'cookies', file: 'putri_salju.png', keywords: ['putri salju', 'snowball'] },
  { folder: 'cookies', file: 'thumbprint_jam.png', keywords: ['thumbprint', 'jam', 'selai'] },
  { folder: 'cookies', file: 'cookie.png', keywords: ['cookie', 'cookies', 'kukis'] },

  // French Pastry
  { folder: 'french_pastry', file: 'Choux_à_la_Crème_&Craquelin.png', keywords: ['choux', 'craquelin', 'soes'] },
  { folder: 'french_pastry', file: 'croissant.png', keywords: ['croissant', 'lamination', 'laminasi'] },
  { folder: 'french_pastry', file: 'eclair.png', keywords: ['eclair', 'éclair'] },
  { folder: 'french_pastry', file: 'Fruits_tartle.png', keywords: ['tart', 'tartle', 'tarte', 'buah', 'fruit'] },
  { folder: 'french_pastry', file: 'Kouign-Amann_Bretons.png', keywords: ['kouign', 'amann', 'breton'] },
  { folder: 'french_pastry', file: 'macaron.png', keywords: ['macaron', 'macarons'] },
  { folder: 'french_pastry', file: 'Madeleines.png', keywords: ['madeleine', 'madeleines'] },
  { folder: 'french_pastry', file: 'Mille-Feuille.png', keywords: ['mille-feuille', 'mille feuille', 'napoleon'] },
  { folder: 'french_pastry', file: 'opera_cake.png', keywords: ['opera'] },
  { folder: 'french_pastry', file: 'Pain_au_Chocolat.png', keywords: ['pain au chocolat', 'chocolatine'] },

  // Indonesian Cakes
  { folder: 'Indo_cakes', file: 'bolu_kukus.png', keywords: ['bolu kukus', 'bolu'] },
  { folder: 'Indo_cakes', file: 'dadar.png', keywords: ['dadar', 'dadar gulung'] },
  { folder: 'Indo_cakes', file: 'getuk_lindri.png', keywords: ['getuk', 'getuk lindri', 'singkong'] },
  { folder: 'Indo_cakes', file: 'klepon.png', keywords: ['klepon', 'onde air'] },
  { folder: 'Indo_cakes', file: 'kue_lapis.png', keywords: ['lapis', 'kue lapis', 'lapis legit', 'lapis pepe'] },
  { folder: 'Indo_cakes', file: 'kue_talam.png', keywords: ['talam', 'kue talam'] },
  { folder: 'Indo_cakes', file: 'nagasari.png', keywords: ['nagasari', 'nogosari', 'pisang'] },
  { folder: 'Indo_cakes', file: 'onde_onde.png', keywords: ['onde-onde', 'onde onde', 'wijen', 'sesame'] },
  { folder: 'Indo_cakes', file: 'putu_ayu.png', keywords: ['putu ayu', 'putu'] },
  { folder: 'Indo_cakes', file: 'serabi.png', keywords: ['serabi', 'surabi'] },
];

export function getCategoryImage(categoryName = '') {
  const normalized = categoryName.toLowerCase().trim();
  const matched = CATEGORY_IMAGE_MAP.find((entry) =>
    entry.keys.some((key) => normalized.includes(key))
  );
  return matched ? matched.image : '/pictures/categories/french_patisserie.png';
}

export function getCourseImage(courseTitle = '', categoryName = '') {
  const normalizedTitle = courseTitle.toLowerCase().trim();
  const normalizedCat = categoryName.toLowerCase().trim();

  const matchedRule = COURSE_IMAGE_RULES.find((rule) =>
    rule.keywords.some((kw) => normalizedTitle.includes(kw))
  );

  if (matchedRule) {
    return `/pictures/courses/${matchedRule.folder}/${matchedRule.file}`;
  }

  const matchedCat = CATEGORY_IMAGE_MAP.find((entry) =>
    entry.keys.some((key) => normalizedCat.includes(key))
  );

  if (matchedCat) {
    return matchedCat.image;
  }

  return '/pictures/categories/french_patisserie.png';
}