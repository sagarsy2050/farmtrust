import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { convertToKg, validateRecord } from './market/normalize.js';

const DB_PATH = process.env.DB_PATH || './farmtrust.db';
fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  phone TEXT,
  account_type TEXT NOT NULL DEFAULT 'customer' CHECK(account_type IN ('customer','farmer')),
  village TEXT, district TEXT, state TEXT, country TEXT DEFAULT 'India',
  preferred_language TEXT DEFAULT 'en', -- i18next language code, see app/src/lib/indianLanguages.js
  date_of_birth TEXT,
  verification_level TEXT NOT NULL DEFAULT 'none'
    CHECK(verification_level IN ('none','identity','location','documents','fully_verified')),
  verified_farmer INTEGER NOT NULL DEFAULT 0,
  bio TEXT, farming_since TEXT, avatar_url TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  payload TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT,
  village TEXT, district TEXT, state TEXT, country TEXT DEFAULT 'India',
  center_lat REAL, center_lng REAL,
  boundary TEXT DEFAULT '[]',
  declared_area_hectares REAL,
  calculated_area_hectares REAL,
  crops TEXT DEFAULT '[]',
  farming_methods TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK(verification_status IN ('unverified','location_submitted','documents_submitted','under_review','verified','rejected')),
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  name TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT,
  farm_id TEXT, farm_name TEXT,
  category TEXT CHECK(category IN ('vegetables','fruits','grains','spices','dairy','other')),
  description TEXT,
  name_local TEXT,
  photo_url TEXT,
  price_per_unit REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  available_quantity REAL NOT NULL,
  unit TEXT DEFAULT 'kg' CHECK(unit IN ('kg','litre','dozen','piece','quintal')),
  minimum_order REAL DEFAULT 1,
  harvest_date TEXT,
  expected_availability TEXT,
  pickup_available INTEGER DEFAULT 1,
  delivery_available INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','sold_out','archived')),
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  order_number TEXT,
  customer_id TEXT NOT NULL,
  customer_name TEXT, customer_email TEXT, customer_phone TEXT,
  farmer_id TEXT NOT NULL, farmer_name TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  subtotal REAL, delivery_fee REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  fulfilment_type TEXT DEFAULT 'delivery' CHECK(fulfilment_type IN ('delivery','pickup')),
  delivery_address TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded')),
  delivery_status TEXT NOT NULL DEFAULT 'placed'
    CHECK(delivery_status IN ('placed','accepted','preparing','dispatched','delivered','completed','cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL, farmer_name TEXT,
  farm_id TEXT, farm_name TEXT,
  document_type TEXT NOT NULL CHECK(document_type IN ('land_ownership','lease_tenancy','farmer_registration','identity_proof','other')),
  file_url TEXT NOT NULL,
  document_language TEXT,
  confirmation INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','needs_info')),
  review_notes TEXT,
  reviewed_by TEXT,
  ocr_extracted TEXT,
  ai_flagged INTEGER DEFAULT 0,
  ai_check_confidence REAL,
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

-- Structured, masked-only output of the identity-document OCR pipeline
-- (python-ocr/extraction/aadhaar.py, kisan_card.py). No column here ever
-- holds a full Aadhaar/Kisan Card number — only masked forms and a
-- checksum boolean. One row per upload/extraction attempt; id is the
-- unique key per record, farmer_id links it to the user it belongs to.
CREATE TABLE IF NOT EXISTS document_extractions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  document_type TEXT CHECK(document_type IN ('kisan_card','aadhaar','other')),
  name TEXT, address TEXT, village TEXT, taluka TEXT, district TEXT, state TEXT, pincode TEXT,
  kisan_card_number_masked TEXT,
  aadhaar_number_masked TEXT,
  aadhaar_checksum_valid INTEGER,
  ocr_confidence REAL,
  fields_found TEXT DEFAULT '[]',
  fields_missing TEXT DEFAULT '[]',
  requires_manual_review INTEGER NOT NULL DEFAULT 1,
  created_date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_document_extractions_farmer ON document_extractions(farmer_id);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL, customer_name TEXT,
  farmer_id TEXT NOT NULL, farmer_name TEXT,
  product_id TEXT, product_name TEXT,
  product_quality_rating REAL, farmer_communication_rating REAL, delivery_rating REAL,
  overall_rating REAL NOT NULL,
  comment TEXT,
  would_buy_again INTEGER,
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_checks (
  id TEXT PRIMARY KEY,
  created_by_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL, farmer_name TEXT,
  farm_id TEXT, farm_name TEXT,
  check_type TEXT NOT NULL CHECK(check_type IN ('identity','farm_location','land_documents','satellite','area_match','duplicate','final')),
  result TEXT NOT NULL DEFAULT 'pending' CHECK(result IN ('pending','pass','flag','fail')),
  notes TEXT,
  reviewer TEXT,
  flagged_issues TEXT DEFAULT '[]',
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_prices (
  id TEXT PRIMARY KEY,
  city_region TEXT NOT NULL,
  state TEXT,
  market_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('vegetables','fruits','grains','spices','dairy')),
  commodity TEXT NOT NULL,
  variety TEXT,
  grade TEXT,
  min_price_kg REAL,
  modal_price_kg REAL,
  max_price_kg REAL,
  source_unit TEXT,
  min_price_source REAL,
  modal_price_source REAL,
  max_price_source REAL,
  arrival_quantity REAL,
  arrival_unit TEXT,
  image_url TEXT,
  source_name TEXT NOT NULL,
  source_record_id TEXT,
  source_date TEXT,
  source_updated_at TEXT,
  fetched_at TEXT,
  normalized_at TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','quarantined')),
  created_date TEXT NOT NULL, updated_date TEXT NOT NULL
);
`);

// Migration: add products.name_local to a DB created before this column
// existed. PRAGMA table_info is cheap; safe to check on every boot.
const productCols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
if (!productCols.includes('name_local')) {
  db.exec('ALTER TABLE products ADD COLUMN name_local TEXT');
}
const marketPriceCols = db.prepare("PRAGMA table_info(market_prices)").all().map(c => c.name);
if (marketPriceCols.length && !marketPriceCols.includes('image_url')) {
  db.exec('ALTER TABLE market_prices ADD COLUMN image_url TEXT');
}
const documentCols = db.prepare("PRAGMA table_info(documents)").all().map(c => c.name);
if (documentCols.length && !documentCols.includes('ai_flagged')) {
  db.exec('ALTER TABLE documents ADD COLUMN ai_flagged INTEGER DEFAULT 0');
  db.exec('ALTER TABLE documents ADD COLUMN ai_check_confidence REAL');
}
// Old rows predate the language picker and carry the literal word 'English'
// instead of the 'en' code the i18n system now expects.
db.prepare(`UPDATE users SET preferred_language = 'en' WHERE preferred_language = 'English' OR preferred_language IS NULL`).run();

// Bootstrap admin account on first boot
const adminEmail = process.env.ADMIN_EMAIL || 'admin@farmtrust.local';
const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!existingAdmin) {
  const now = new Date().toISOString();
  // preferred_language set explicitly — see the same note on the
  // register/Google-OAuth inserts in routes/auth.js.
  db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, account_type, preferred_language, created_date, updated_date)
              VALUES (?,?,?,?,?,?,?,?,?)`).run(
    uuidv4(), adminEmail,
    bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10),
    'FarmTrust Admin', 'admin', 'customer', 'en', now, now
  );
  console.log(`[db] bootstrap admin created: ${adminEmail}`);
}

// Bootstrap a small demo marketplace (farmers + farms + products) on first
// boot so the storefront isn't empty on a fresh clone. Fixed IDs + INSERT OR
// IGNORE make this idempotent — safe to run every boot, never duplicates.
// Product photos are real photographs from Wikimedia Commons (public
// domain / CC-licensed), fetched directly by the browser via Commons'
// stable Special:FilePath redirect — not synthetic placeholders. This is
// the one deliberate exception to this app's local-only design: real
// produce photography can't be generated locally, and the browser (not
// the server) makes the request, same category as the existing OSM map
// tiles in FarmBoundaryMap.jsx/FarmDetail.jsx. Real farmers uploading
// their own photos via the UI (accept="image/*") simply overwrite
// photo_url the normal way; this only fills the gap for a fresh, empty DB.
function commonsImage(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=480`;
}

const demoNow = new Date().toISOString();
const DEMO_FARMERS = [
  { id: 'demo-farmer-1', email: 'ramesh.patel@demo.farmtrust.local', full_name: 'Ramesh Patel', village: 'Sanand', district: 'Ahmedabad', state: 'Gujarat' },
  { id: 'demo-farmer-2', email: 'lakshmi.reddy@demo.farmtrust.local', full_name: 'Lakshmi Reddy', village: 'Kondapur', district: 'Ranga Reddy', state: 'Telangana' },
  { id: 'demo-farmer-3', email: 'arjun.singh@demo.farmtrust.local', full_name: 'Arjun Singh', village: 'Khanna', district: 'Ludhiana', state: 'Punjab' },
];
const insertDemoFarmer = db.prepare(`INSERT OR IGNORE INTO users
  (id, email, password_hash, full_name, role, account_type, village, district, state, country,
   verification_level, verified_farmer, email_verified, preferred_language, created_date, updated_date)
  VALUES (@id, @email, NULL, @full_name, 'user', 'farmer', @village, @district, @state, 'India',
   'fully_verified', 1, 1, 'en', @created_date, @updated_date)`);
for (const f of DEMO_FARMERS) insertDemoFarmer.run({ ...f, created_date: demoNow, updated_date: demoNow });

const DEMO_FARMS = [
  { id: 'demo-farm-1', farmer_id: 'demo-farmer-1', farmer_name: 'Ramesh Patel', farm_name: 'Green Valley Farm', village: 'Sanand', district: 'Ahmedabad', state: 'Gujarat', crops: ['Tomato', 'Potato', 'Milk'] },
  { id: 'demo-farm-2', farmer_id: 'demo-farmer-2', farmer_name: 'Lakshmi Reddy', farm_name: 'Sunrise Organic Farm', village: 'Kondapur', district: 'Ranga Reddy', state: 'Telangana', crops: ['Mango', 'Banana', 'Turmeric'] },
  { id: 'demo-farm-3', farmer_id: 'demo-farmer-3', farmer_name: 'Arjun Singh', farm_name: 'Golden Fields Farm', village: 'Khanna', district: 'Ludhiana', state: 'Punjab', crops: ['Onion', 'Rice', 'Wheat'] },
];
const insertDemoFarm = db.prepare(`INSERT OR IGNORE INTO farms
  (id, created_by_id, farm_name, farmer_id, farmer_name, village, district, state, country,
   declared_area_hectares, calculated_area_hectares, crops, verification_status, created_date, updated_date)
  VALUES (@id, @farmer_id, @farm_name, @farmer_id, @farmer_name, @village, @district, @state, 'India',
   3.5, 3.5, @crops, 'verified', @created_date, @updated_date)`);
for (const f of DEMO_FARMS) insertDemoFarm.run({ ...f, crops: JSON.stringify(f.crops), created_date: demoNow, updated_date: demoNow });

// Filenames verified to resolve on Wikimedia Commons before use — see
// commit history / conversation for the verification pass (each was
// HTTP-checked, not guessed). Hindi names transcribed from the user-supplied
// "List of Vegetable Names in English and Hindi with Pictures" reference PDF.
const DEMO_PRODUCTS = [
  { id: 'demo-product-tomato', farm_id: 'demo-farm-1', name: 'Fresh Tomato', name_local: 'टमाटर', category: 'vegetables', price: 28, qty: 300, unit: 'kg', image: 'Tomato_je.jpg' },
  { id: 'demo-product-potato', farm_id: 'demo-farm-1', name: 'Farm Potato', name_local: 'आलू', category: 'vegetables', price: 22, qty: 500, unit: 'kg', image: 'Patates.jpg' },
  { id: 'demo-product-milk', farm_id: 'demo-farm-1', name: 'Fresh Cow Milk', category: 'dairy', price: 55, qty: 100, unit: 'litre', image: 'Glass_of_Milk_(33657535532).jpg' },
  { id: 'demo-product-mango', farm_id: 'demo-farm-2', name: 'Alphonso Mango', category: 'fruits', price: 120, qty: 150, unit: 'kg', image: 'Mangos_-_single_and_halved.jpg' },
  { id: 'demo-product-banana', farm_id: 'demo-farm-2', name: 'Robusta Banana', category: 'fruits', price: 45, qty: 400, unit: 'dozen', image: 'Bananavarieties.jpg' },
  { id: 'demo-product-turmeric', farm_id: 'demo-farm-2', name: 'Finger Turmeric', name_local: 'हल्दी', category: 'spices', price: 180, qty: 80, unit: 'kg', image: 'Turmeric-powder.jpg' },
  { id: 'demo-product-onion', farm_id: 'demo-farm-3', name: 'Nashik Red Onion', name_local: 'प्याज', category: 'vegetables', price: 26, qty: 600, unit: 'kg', image: 'Mixed_onions.jpg' },
  { id: 'demo-product-rice', farm_id: 'demo-farm-3', name: 'Basmati Rice', category: 'grains', price: 65, qty: 350, unit: 'kg', image: '20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg' },
  { id: 'demo-product-wheat', farm_id: 'demo-farm-3', name: 'Sharbati Wheat', category: 'grains', price: 32, qty: 450, unit: 'kg', image: 'Vehnäpelto_6.jpg' },
  { id: 'demo-product-garlic', farm_id: 'demo-farm-3', name: 'Fresh Garlic', name_local: 'लहसुन', category: 'vegetables', price: 65, qty: 200, unit: 'kg', image: 'Garlic_bulbs_and_cloves.jpg' },
  { id: 'demo-product-ginger', farm_id: 'demo-farm-3', name: 'Fresh Ginger', name_local: 'अदरक', category: 'vegetables', price: 70, qty: 180, unit: 'kg', image: 'Ginger_Root.jpg' },
  { id: 'demo-product-greenchilli', farm_id: 'demo-farm-3', name: 'Green Chilli', name_local: 'हरी मिर्च', category: 'vegetables', price: 40, qty: 150, unit: 'kg', image: 'Hatch_green_chile.jpg' },
  { id: 'demo-product-carrot', farm_id: 'demo-farm-1', name: 'Fresh Carrot', name_local: 'गाजर', category: 'vegetables', price: 30, qty: 350, unit: 'kg', image: 'Vegetable-Carrot-Bundle-wStalks.jpg' },
  { id: 'demo-product-cauliflower', farm_id: 'demo-farm-1', name: 'Cauliflower', name_local: 'फूलगोभी', category: 'vegetables', price: 24, qty: 250, unit: 'kg', image: 'Chou-fleur_02.jpg' },
  { id: 'demo-product-cucumber', farm_id: 'demo-farm-1', name: 'Fresh Cucumber', name_local: 'खीरा', category: 'vegetables', price: 20, qty: 400, unit: 'kg', image: 'ARS_cucumber.jpg' },
  { id: 'demo-product-brinjal', farm_id: 'demo-farm-1', name: 'Brinjal', name_local: 'बैगन', category: 'vegetables', price: 26, qty: 300, unit: 'kg', image: 'Solanum_melongena_24_08_2012_(1).JPG' },
  { id: 'demo-product-cabbage', farm_id: 'demo-farm-2', name: 'Fresh Cabbage', name_local: 'पत्ता गोभी', category: 'vegetables', price: 18, qty: 350, unit: 'kg', image: 'Cabbage_and_cross_section_on_white.jpg' },
  { id: 'demo-product-peas', farm_id: 'demo-farm-2', name: 'Green Peas', name_local: 'मटर', category: 'vegetables', price: 45, qty: 200, unit: 'kg', image: 'Peas_in_pods_-_Studio.jpg' },
  { id: 'demo-product-spinach', farm_id: 'demo-farm-2', name: 'Fresh Spinach', name_local: 'पालक', category: 'vegetables', price: 22, qty: 220, unit: 'kg', image: 'Spinacia_oleracea_Spinazie_bloeiend.jpg' },
  { id: 'demo-product-corn', farm_id: 'demo-farm-3', name: 'Sweet Corn', name_local: 'मक्का', category: 'vegetables', price: 25, qty: 300, unit: 'kg', image: 'Corn_on_the_cob_(sweet_corn).jpg' },
  { id: 'demo-product-pumpkin', farm_id: 'demo-farm-3', name: 'Fresh Pumpkin', name_local: 'कद्दू', category: 'vegetables', price: 20, qty: 280, unit: 'kg', image: 'FrenchMarketPumpkinsB.jpg' },
  { id: 'demo-product-sweetpotato', farm_id: 'demo-farm-1', name: 'Sweet Potato', name_local: 'शकरकंद', category: 'vegetables', price: 35, qty: 260, unit: 'kg', image: 'Ipomoea_batatas_006.JPG' },
  { id: 'demo-product-beetroot', farm_id: 'demo-farm-1', name: 'Fresh Beetroot', name_local: 'चुकंदर', category: 'vegetables', price: 28, qty: 240, unit: 'kg', image: 'Detroitdarkredbeets.png' },
  { id: 'demo-product-okra', farm_id: 'demo-farm-2', name: 'Lady Finger (Okra)', name_local: 'भिंडी', category: 'vegetables', price: 32, qty: 260, unit: 'kg', image: 'Hong_Kong_Okra_Aug_25_2012.JPG' },
  // Rounding out fruits/grains/spices/dairy, which were thin (2/2/1/1 items).
  { id: 'demo-product-apple', farm_id: 'demo-farm-2', name: 'Shimla Apple', name_local: 'सेब', category: 'fruits', price: 180, qty: 200, unit: 'kg', image: 'Pink_lady_and_cross_section.jpg' },
  { id: 'demo-product-grapes', farm_id: 'demo-farm-2', name: 'Fresh Grapes', name_local: 'अंगूर', category: 'fruits', price: 90, qty: 220, unit: 'kg', image: 'Grapes, Rostov-on-Don, Russia.jpg' },
  { id: 'demo-product-orange', farm_id: 'demo-farm-2', name: 'Nagpur Orange', name_local: 'संतरा', category: 'fruits', price: 60, qty: 280, unit: 'kg', image: 'Oranges_-_whole-halved-segment.jpg' },
  { id: 'demo-product-watermelon', farm_id: 'demo-farm-3', name: 'Fresh Watermelon', name_local: 'तरबूज', category: 'fruits', price: 25, qty: 350, unit: 'kg', image: 'Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg' },
  { id: 'demo-product-papaya', farm_id: 'demo-farm-2', name: 'Ripe Papaya', name_local: 'पपीता', category: 'fruits', price: 40, qty: 180, unit: 'kg', image: 'Carica_papaya_005.JPG' },
  { id: 'demo-product-cumin', farm_id: 'demo-farm-3', name: 'Cumin Seeds', name_local: 'जीरा', category: 'spices', price: 320, qty: 60, unit: 'kg', image: 'Cumin_Seeds.jpg' },
  { id: 'demo-product-blackpepper', farm_id: 'demo-farm-2', name: 'Black Pepper', name_local: 'काली मिर्च', category: 'spices', price: 550, qty: 40, unit: 'kg', image: '4_color_mix_of_peppercorns.jpg' },
  { id: 'demo-product-cardamom', farm_id: 'demo-farm-2', name: 'Green Cardamom', name_local: 'इलायची', category: 'spices', price: 1400, qty: 25, unit: 'kg', image: 'Cardomom_pods.jpg' },
  { id: 'demo-product-cinnamon', farm_id: 'demo-farm-2', name: 'Cinnamon Sticks', name_local: 'दालचीनी', category: 'spices', price: 480, qty: 35, unit: 'kg', image: 'Cinnamomum_verum_spices.jpg' },
  { id: 'demo-product-paneer', farm_id: 'demo-farm-1', name: 'Fresh Paneer', name_local: 'पनीर', category: 'dairy', price: 320, qty: 60, unit: 'kg', image: 'Panir_Paneer_Indian_cheese_fresh.jpg' },
  { id: 'demo-product-curd', farm_id: 'demo-farm-1', name: 'Fresh Curd', name_local: 'दही', category: 'dairy', price: 60, qty: 150, unit: 'kg', image: 'Joghurt.jpg' },
  { id: 'demo-product-ghee', farm_id: 'demo-farm-1', name: 'Pure Cow Ghee', name_local: 'घी', category: 'dairy', price: 650, qty: 40, unit: 'kg', image: 'Desi_ghee.JPG' },
  { id: 'demo-product-barley', farm_id: 'demo-farm-3', name: 'Barley', name_local: 'जौ', category: 'grains', price: 28, qty: 300, unit: 'kg', image: 'Barley (Hordeum vulgare) - United States National Arboretum - 24 May 2009.jpg' },
  { id: 'demo-product-jowar', farm_id: 'demo-farm-3', name: 'Jowar (Sorghum)', name_local: 'ज्वार', category: 'grains', price: 30, qty: 320, unit: 'kg', image: 'Sorghum_bicolor03.jpg' },
  // Full fruit-market pass — all images individually HTTP-verified against
  // Wikimedia Commons before use (curl'd for a 200, including a retry pass
  // for ones that came back rate-limited on the first sweep).
  { id: 'demo-product-guava', farm_id: 'demo-farm-2', name: 'Fresh Guava', name_local: 'अमरूद', category: 'fruits', price: 40, qty: 220, unit: 'kg', image: 'Guava_pink_fruit.jpg' },
  { id: 'demo-product-pineapple', farm_id: 'demo-farm-3', name: 'Fresh Pineapple', name_local: 'अनानास', category: 'fruits', price: 35, qty: 200, unit: 'kg', image: 'Pineapple_and_cross_section.jpg' },
  { id: 'demo-product-muskmelon', farm_id: 'demo-farm-1', name: 'Muskmelon', name_local: 'खरबूजा', category: 'fruits', price: 30, qty: 250, unit: 'kg', image: 'Cantaloupe_and_canary_melon.jpg' },
  { id: 'demo-product-pomegranate', farm_id: 'demo-farm-2', name: 'Fresh Pomegranate', name_local: 'अनार', category: 'fruits', price: 140, qty: 160, unit: 'kg', image: 'Pomegranate_Juice_(2019).jpg' },
  { id: 'demo-product-pear', farm_id: 'demo-farm-1', name: 'Fresh Pear', name_local: 'नाशपाती', category: 'fruits', price: 120, qty: 150, unit: 'kg', image: 'Pears.jpg' },
  { id: 'demo-product-peach', farm_id: 'demo-farm-2', name: 'Fresh Peach', name_local: 'आड़ू', category: 'fruits', price: 150, qty: 140, unit: 'kg', image: 'Assorted Peaches 2816px.jpg' },
  { id: 'demo-product-plum', farm_id: 'demo-farm-1', name: 'Fresh Plum', name_local: 'आलूबुखारा', category: 'fruits', price: 130, qty: 140, unit: 'kg', image: 'Plums_African_Rose_-_whole,_halved_and_slice.jpg' },
  { id: 'demo-product-apricot', farm_id: 'demo-farm-2', name: 'Fresh Apricot', name_local: 'खुबानी', category: 'fruits', price: 400, qty: 80, unit: 'kg', image: 'Apricot_and_cross_section.jpg' },
  { id: 'demo-product-cherry', farm_id: 'demo-farm-1', name: 'Fresh Cherry', name_local: 'चेरी', category: 'fruits', price: 600, qty: 60, unit: 'kg', image: 'Cherry_season_(48216568227).jpg' },
  { id: 'demo-product-strawberry', farm_id: 'demo-farm-2', name: 'Fresh Strawberry', name_local: 'स्ट्रॉबेरी', category: 'fruits', price: 200, qty: 120, unit: 'kg', image: 'Garden_strawberry_(Fragaria_×_ananassa)_single2.jpg' },
  { id: 'demo-product-blueberry', farm_id: 'demo-farm-1', name: 'Fresh Blueberry', name_local: 'ब्लूबेरी', category: 'fruits', price: 800, qty: 50, unit: 'kg', image: 'Blueberries.jpg' },
  { id: 'demo-product-raspberry', farm_id: 'demo-farm-2', name: 'Fresh Raspberry', name_local: 'रास्पबेरी', category: 'fruits', price: 700, qty: 50, unit: 'kg', image: 'Raspberry - halved (Rubus idaeus).jpg' },
  { id: 'demo-product-blackberry', farm_id: 'demo-farm-1', name: 'Fresh Blackberry', name_local: 'ब्लैकबेरी', category: 'fruits', price: 500, qty: 60, unit: 'kg', image: 'Ripe, ripening, and green blackberries.jpg' },
  { id: 'demo-product-kiwi', farm_id: 'demo-farm-2', name: 'Fresh Kiwi', name_local: 'कीवी', category: 'fruits', price: 250, qty: 100, unit: 'kg', image: 'Actinidia_fruits.jpg' },
  { id: 'demo-product-dragonfruit', farm_id: 'demo-farm-3', name: 'Dragon Fruit', name_local: 'ड्रैगन फ्रूट', category: 'fruits', price: 300, qty: 90, unit: 'kg', image: 'Pitaya_cross_section_ed2.jpg' },
  { id: 'demo-product-avocado', farm_id: 'demo-farm-2', name: 'Fresh Avocado', name_local: 'एवोकाडो', category: 'fruits', price: 250, qty: 100, unit: 'kg', image: 'Persea_americana_fruit_2.JPG' },
  { id: 'demo-product-coconut', farm_id: 'demo-farm-3', name: 'Fresh Coconut', name_local: 'नारियल', category: 'fruits', price: 30, qty: 400, unit: 'piece', image: 'Kokosnuss-Coconut.jpg' },
  { id: 'demo-product-jackfruit', farm_id: 'demo-farm-3', name: 'Fresh Jackfruit', name_local: 'कटहल', category: 'fruits', price: 150, qty: 60, unit: 'piece', image: 'The_jackfruit_is_holding_on_to_the_tree.jpg' },
  { id: 'demo-product-custardapple', farm_id: 'demo-farm-2', name: 'Custard Apple', name_local: 'सीताफल', category: 'fruits', price: 100, qty: 150, unit: 'kg', image: 'Annona squamosa (custard apple) fruit 03.JPG' },
  { id: 'demo-product-sapota', farm_id: 'demo-farm-2', name: 'Sapota (Chikoo)', name_local: 'चीकू', category: 'fruits', price: 60, qty: 200, unit: 'kg', image: 'Sapodilla fruit.jpg' },
  { id: 'demo-product-fig', farm_id: 'demo-farm-1', name: 'Fresh Fig', name_local: 'अंजीर', category: 'fruits', price: 300, qty: 80, unit: 'kg', image: 'Fig fruit.jpg' },
  { id: 'demo-product-dates', farm_id: 'demo-farm-3', name: 'Fresh Dates', name_local: 'खजूर', category: 'fruits', price: 350, qty: 100, unit: 'kg', image: 'Mazafati_dates_-_whole,_halved_and_seed.jpg' },
  { id: 'demo-product-lychee', farm_id: 'demo-farm-2', name: 'Fresh Lychee', name_local: 'लीची', category: 'fruits', price: 180, qty: 130, unit: 'kg', image: 'Litchi_chinensis_fruits.JPG' },
  { id: 'demo-product-jamun', farm_id: 'demo-farm-1', name: 'Fresh Jamun', name_local: 'जामुन', category: 'fruits', price: 120, qty: 100, unit: 'kg', image: 'Ripe Jamun Fruits.JPG' },
  { id: 'demo-product-amla', farm_id: 'demo-farm-1', name: 'Fresh Amla', name_local: 'आंवला', category: 'fruits', price: 80, qty: 180, unit: 'kg', image: 'Phyllanthus_emblica_-_whole_and_cross_section.jpg' },
  { id: 'demo-product-tamarind', farm_id: 'demo-farm-3', name: 'Fresh Tamarind', name_local: 'इमली', category: 'fruits', price: 90, qty: 150, unit: 'kg', image: 'Tamarindus_indica_pods.JPG' },
  { id: 'demo-product-lemon', farm_id: 'demo-farm-1', name: 'Fresh Lemon', name_local: 'नींबू', category: 'fruits', price: 60, qty: 300, unit: 'kg', image: 'Lemon - whole and split.jpg' },
  { id: 'demo-product-grapefruit', farm_id: 'demo-farm-2', name: 'Grapefruit', name_local: 'चकोतरा', category: 'fruits', price: 90, qty: 150, unit: 'kg', image: 'Grapefruits_-_whole-halved-segments.jpg' },
  { id: 'demo-product-pomelo', farm_id: 'demo-farm-2', name: 'Fresh Pomelo', name_local: 'पोमेलो', category: 'fruits', price: 70, qty: 160, unit: 'kg', image: 'Pomelo_fruit.jpg' },
  { id: 'demo-product-passionfruit', farm_id: 'demo-farm-2', name: 'Passion Fruit', name_local: 'कृष्ण फल', category: 'fruits', price: 200, qty: 90, unit: 'kg', image: 'Passion fruits - whole and halved.jpg' },
  { id: 'demo-product-starfruit', farm_id: 'demo-farm-2', name: 'Star Fruit', name_local: 'कमरख', category: 'fruits', price: 80, qty: 120, unit: 'kg', image: 'Averrhoa_carambola_ARS_k5735-7.jpg' },
  { id: 'demo-product-mulberry', farm_id: 'demo-farm-1', name: 'Fresh Mulberry', name_local: 'शहतूत', category: 'fruits', price: 250, qty: 80, unit: 'kg', image: 'Morus_alba_FrJPG.jpg' },
  { id: 'demo-product-persimmon', farm_id: 'demo-farm-1', name: 'Fresh Persimmon', name_local: 'पर्सिमन', category: 'fruits', price: 150, qty: 100, unit: 'kg', image: 'Fuyu_persimmon_fruits,_one_cut_open.jpg' },
  { id: 'demo-product-rambutan', farm_id: 'demo-farm-3', name: 'Fresh Rambutan', name_local: 'रामबुटान', category: 'fruits', price: 400, qty: 70, unit: 'kg', image: 'Rambutan_white_background_alt.jpg' },
  { id: 'demo-product-mangosteen', farm_id: 'demo-farm-3', name: 'Fresh Mangosteen', name_local: 'मैंगोस्टीन', category: 'fruits', price: 500, qty: 60, unit: 'kg', image: 'Fresh mangosteen fruit.jpg' },
  { id: 'demo-product-longan', farm_id: 'demo-farm-3', name: 'Fresh Longan', name_local: 'लॉन्गन', category: 'fruits', price: 450, qty: 60, unit: 'kg', image: 'Dimocarpus longan fruits.jpg' },
  { id: 'demo-product-durian', farm_id: 'demo-farm-3', name: 'Fresh Durian', name_local: 'ड्यूरियन', category: 'fruits', price: 800, qty: 30, unit: 'piece', image: 'Durian_in_black.jpg' },
  { id: 'demo-product-bael', farm_id: 'demo-farm-1', name: 'Fresh Bael', name_local: 'बेल', category: 'fruits', price: 50, qty: 120, unit: 'kg', image: 'Bael.jpg' },
  { id: 'demo-product-woodapple', farm_id: 'demo-farm-1', name: 'Wood Apple', name_local: 'कैथा', category: 'fruits', price: 60, qty: 100, unit: 'kg', image: 'Wood-apple_dec2007.jpg' },
  { id: 'demo-product-gooseberry', farm_id: 'demo-farm-1', name: 'Fresh Gooseberry', name_local: 'गूसबेरी', category: 'fruits', price: 90, qty: 130, unit: 'kg', image: 'Stachelbeeren.jpg' },
  { id: 'demo-product-cranberry', farm_id: 'demo-farm-2', name: 'Fresh Cranberry', name_local: 'क्रैनबेरी', category: 'fruits', price: 900, qty: 40, unit: 'kg', image: 'Cranberry_bog.jpg' },
  { id: 'demo-product-olive', farm_id: 'demo-farm-2', name: 'Fresh Olive', name_local: 'जैतून', category: 'fruits', price: 400, qty: 70, unit: 'kg', image: 'Olivesfromjordan.jpg' },
  // Cereals, millets, pulses & flour products — all images individually
  // HTTP-verified against Wikimedia Commons before use.
  { id: 'demo-product-maize', farm_id: 'demo-farm-3', name: 'Maize (Corn)', name_local: 'मक्का', category: 'grains', price: 22, qty: 400, unit: 'kg', image: 'Corn_on_the_cob_(sweet_corn).jpg' },
  { id: 'demo-product-oats', farm_id: 'demo-farm-1', name: 'Oats', name_local: 'जई', category: 'grains', price: 90, qty: 200, unit: 'kg', image: 'AvenaSativa3.jpg' },
  { id: 'demo-product-rye', farm_id: 'demo-farm-1', name: 'Rye', name_local: 'राई', category: 'grains', price: 85, qty: 180, unit: 'kg', image: 'Ear_of_rye.jpg' },
  { id: 'demo-product-bajra', farm_id: 'demo-farm-3', name: 'Pearl Millet (Bajra)', name_local: 'बाजरा', category: 'grains', price: 26, qty: 350, unit: 'kg', image: 'Grain_millet,_early_grain_fill,_Tifton,_7-3-02.jpg' },
  { id: 'demo-product-ragi', farm_id: 'demo-farm-3', name: 'Finger Millet (Ragi)', name_local: 'रागी', category: 'grains', price: 45, qty: 260, unit: 'kg', image: 'Finger_millet_3_11-21-02.jpg' },
  { id: 'demo-product-foxtailmillet', farm_id: 'demo-farm-3', name: 'Foxtail Millet', name_local: 'कंगनी', category: 'grains', price: 60, qty: 180, unit: 'kg', image: 'Japanese_Foxtail_millet_02.jpg' },
  { id: 'demo-product-littlemillet', farm_id: 'demo-farm-3', name: 'Little Millet', name_local: 'कुटकी', category: 'grains', price: 65, qty: 150, unit: 'kg', image: 'Millet.jpg' },
  { id: 'demo-product-kodomillet', farm_id: 'demo-farm-3', name: 'Kodo Millet', name_local: 'कोदो', category: 'grains', price: 65, qty: 150, unit: 'kg', image: 'Paspalum_scrobiculatum_224164066.jpg' },
  { id: 'demo-product-barnyardmillet', farm_id: 'demo-farm-3', name: 'Barnyard Millet', name_local: 'सांवा', category: 'grains', price: 70, qty: 140, unit: 'kg', image: 'Echinochloa_esculenta_sl2.jpg' },
  { id: 'demo-product-prosomillet', farm_id: 'demo-farm-3', name: 'Proso Millet', name_local: 'चेना', category: 'grains', price: 65, qty: 140, unit: 'kg', image: 'Mature_Proso_Millet_Panicles.jpg' },
  { id: 'demo-product-buckwheat', farm_id: 'demo-farm-1', name: 'Buckwheat', name_local: 'कुट्टू', category: 'grains', price: 110, qty: 130, unit: 'kg', image: 'Fagopyrum_esculentum_seed_001.jpg' },
  { id: 'demo-product-quinoa', farm_id: 'demo-farm-1', name: 'Quinoa', name_local: 'क्विनोआ', category: 'grains', price: 450, qty: 60, unit: 'kg', image: 'Reismelde.jpg' },
  { id: 'demo-product-amaranth', farm_id: 'demo-farm-1', name: 'Amaranth', name_local: 'राजगिरा', category: 'grains', price: 140, qty: 100, unit: 'kg', image: 'Amaranth_und_WW.jpg' },
  { id: 'demo-product-chana', farm_id: 'demo-farm-2', name: 'Chickpeas (Chana)', name_local: 'चना', category: 'grains', price: 75, qty: 300, unit: 'kg', image: 'Chickpea_BNC.jpg' },
  { id: 'demo-product-bengalgram', farm_id: 'demo-farm-2', name: 'Bengal Gram', name_local: 'बंगाल चना', category: 'grains', price: 75, qty: 250, unit: 'kg', image: 'Chickpea_BNC.jpg' },
  { id: 'demo-product-urad', farm_id: 'demo-farm-2', name: 'Black Gram (Urad)', name_local: 'उड़द', category: 'grains', price: 110, qty: 220, unit: 'kg', image: 'Black_gram.jpg' },
  { id: 'demo-product-moong', farm_id: 'demo-farm-2', name: 'Green Gram (Moong)', name_local: 'मूंग', category: 'grains', price: 100, qty: 240, unit: 'kg', image: 'Mung_beans_(Vigna_radiata).jpg' },
  { id: 'demo-product-toor', farm_id: 'demo-farm-2', name: 'Red Gram (Toor)', name_local: 'तूर/अरहर', category: 'grains', price: 115, qty: 230, unit: 'kg', image: 'Pigeon_Pea_(Toor_Dal)_(49683602388).jpg' },
  { id: 'demo-product-masoor', farm_id: 'demo-farm-1', name: 'Lentils (Masoor)', name_local: 'मसूर', category: 'grains', price: 95, qty: 220, unit: 'kg', image: '3_types_of_lentil.png' },
  { id: 'demo-product-rajma', farm_id: 'demo-farm-1', name: 'Kidney Beans (Rajma)', name_local: 'राजमा', category: 'grains', price: 130, qty: 180, unit: 'kg', image: 'Red_Rajma_BNC.jpg' },
  { id: 'demo-product-lobia', farm_id: 'demo-farm-1', name: 'Black-Eyed Peas (Lobia)', name_local: 'लोबिया', category: 'grains', price: 90, qty: 170, unit: 'kg', image: 'BlackEyedPeas.JPG' },
  { id: 'demo-product-cowpea', farm_id: 'demo-farm-1', name: 'Cowpea', name_local: 'लोबिया', category: 'grains', price: 85, qty: 160, unit: 'kg', image: 'BlackEyedPeas.JPG' },
  { id: 'demo-product-matki', farm_id: 'demo-farm-2', name: 'Moth Beans (Matki)', name_local: 'मटकी', category: 'grains', price: 95, qty: 150, unit: 'kg', image: 'Matki.JPG' },
  { id: 'demo-product-kulith', farm_id: 'demo-farm-2', name: 'Horse Gram (Kulith)', name_local: 'कुलथी', category: 'grains', price: 80, qty: 160, unit: 'kg', image: 'Horse_Gram_BNC.jpg' },
  { id: 'demo-product-val', farm_id: 'demo-farm-2', name: 'Field Beans (Val)', name_local: 'वाल', category: 'grains', price: 90, qty: 140, unit: 'kg', image: 'Lablabpod.jpg' },
  { id: 'demo-product-hyacinthbean', farm_id: 'demo-farm-2', name: 'Hyacinth Beans', name_local: 'वाल', category: 'grains', price: 85, qty: 140, unit: 'kg', image: 'Lablabpod.jpg' },
  { id: 'demo-product-soybean', farm_id: 'demo-farm-3', name: 'Soybeans', name_local: 'सोयाबीन', category: 'grains', price: 70, qty: 300, unit: 'kg', image: 'Soybeanvarieties.jpg' },
  { id: 'demo-product-driedpeas', farm_id: 'demo-farm-3', name: 'Dried Peas', name_local: 'मटर', category: 'grains', price: 60, qty: 200, unit: 'kg', image: 'Peas_in_pods_-_Studio.jpg' },
  { id: 'demo-product-fava', farm_id: 'demo-farm-1', name: 'Broad Beans (Fava)', name_local: 'बाकला', category: 'grains', price: 100, qty: 150, unit: 'kg', image: 'Fava_beans_1.jpg' },
  { id: 'demo-product-pintobean', farm_id: 'demo-farm-1', name: 'Pinto Beans', category: 'grains', price: 140, qty: 130, unit: 'kg', image: 'Pinto_bean.jpg' },
  { id: 'demo-product-navybean', farm_id: 'demo-farm-1', name: 'Navy Beans', category: 'grains', price: 130, qty: 130, unit: 'kg', image: 'Phaseolus_vulgaris_white_beans, witte_boon.jpg' },
  { id: 'demo-product-adzukibean', farm_id: 'demo-farm-2', name: 'Adzuki Beans', category: 'grains', price: 160, qty: 110, unit: 'kg', image: 'Azuki_Beans.jpg' },
  { id: 'demo-product-mungbean', farm_id: 'demo-farm-2', name: 'Mung Beans', name_local: 'मूंग', category: 'grains', price: 100, qty: 200, unit: 'kg', image: 'Mung_beans_(Vigna_radiata).jpg' },
  { id: 'demo-product-limabean', farm_id: 'demo-farm-2', name: 'Lima Beans', category: 'grains', price: 150, qty: 110, unit: 'kg', image: 'Phaseoulus_lunatus.jpg' },
  { id: 'demo-product-brokenrice', farm_id: 'demo-farm-3', name: 'Broken Rice', name_local: 'टूटा चावल', category: 'grains', price: 40, qty: 250, unit: 'kg', image: 'Broken rice brisée.jpg' },
  { id: 'demo-product-riceflour', farm_id: 'demo-farm-3', name: 'Rice Flour', name_local: 'चावल का आटा', category: 'grains', price: 45, qty: 180, unit: 'kg', image: 'Rice flour 2.jpg' },
  { id: 'demo-product-wheatflour', farm_id: 'demo-farm-1', name: 'Wheat Flour', name_local: 'गेहूं का आटा', category: 'grains', price: 40, qty: 300, unit: 'kg', image: 'Wheat-flour.jpg' },
  { id: 'demo-product-semolina', farm_id: 'demo-farm-1', name: 'Semolina (Rava)', name_local: 'रवा/सूजी', category: 'grains', price: 45, qty: 200, unit: 'kg', image: 'Sa_semolina_far.jpg' },
  { id: 'demo-product-cornmeal', farm_id: 'demo-farm-3', name: 'Cornmeal', name_local: 'मक्के का आटा', category: 'grains', price: 50, qty: 180, unit: 'kg', image: 'Polenta_uncooked.jpg' },
  { id: 'demo-product-oatmeal', farm_id: 'demo-farm-1', name: 'Oatmeal', category: 'grains', price: 120, qty: 120, unit: 'kg', image: 'Cooked oatmeal in bowl (low angle).jpg' },
  { id: 'demo-product-besan', farm_id: 'demo-farm-2', name: 'Gram Flour (Besan)', name_local: 'बेसन', category: 'grains', price: 90, qty: 200, unit: 'kg', image: 'Gram_flour_AvL.jpg' },
  { id: 'demo-product-milletflour', farm_id: 'demo-farm-3', name: 'Millet Flour', name_local: 'बाजरे का आटा', category: 'grains', price: 55, qty: 150, unit: 'kg', image: 'Millet.jpg' },
  { id: 'demo-product-barleyflour', farm_id: 'demo-farm-1', name: 'Barley Flour', name_local: 'जौ का आटा', category: 'grains', price: 60, qty: 150, unit: 'kg', image: 'Barley_Seeds.jpg' },
];
const insertDemoProduct = db.prepare(`INSERT OR IGNORE INTO products
  (id, created_by_id, name, name_local, farmer_id, farmer_name, farm_id, farm_name, category, description,
   photo_url, price_per_unit, currency, available_quantity, unit, minimum_order,
   pickup_available, delivery_available, status, created_date, updated_date)
  VALUES (@id, @farmer_id, @name, @name_local, @farmer_id, @farmer_name, @farm_id, @farm_name, @category, @description,
   @photo_url, @price, 'INR', @qty, @unit, 1, 1, 1, 'published', @created_date, @updated_date)`);
const farmById = Object.fromEntries(DEMO_FARMS.map(f => [f.id, f]));
for (const p of DEMO_PRODUCTS) {
  const farm = farmById[p.farm_id];
  insertDemoProduct.run({
    id: p.id, farmer_id: farm.farmer_id, farmer_name: farm.farmer_name,
    farm_id: farm.id, farm_name: farm.farm_name, name: p.name, name_local: p.name_local || null, category: p.category,
    description: `${p.name} grown at ${farm.farm_name}, ${farm.village}.`,
    photo_url: commonsImage(p.image),
    price: p.price, qty: p.qty, unit: p.unit,
    created_date: demoNow, updated_date: demoNow,
  });
}

// Bootstrap local market-price sample data on first boot (see server/src/market/*).
// This is honest local seed data, not a live feed — see ingest.js and the
// "FarmTrust Sample Data" source_name below. AGMARKNET-style mandi prices are
// quoted per quintal, so source_unit is 'quintal' and min/modal/max are
// normalized to ₹/kg by dividing by 100 (see market/normalize.js).
const existingMarketPrices = db.prepare('SELECT id FROM market_prices LIMIT 1').get();
if (!existingMarketPrices) {
  const REGIONS = [
    { city: 'Ahmedabad', state: 'Gujarat', markets: ['Ahmedabad APMC', 'Jamalpur Market'] },
    { city: 'Mumbai', state: 'Maharashtra', markets: ['Vashi APMC', 'Dadar Market'] },
    { city: 'Delhi NCR', state: 'Delhi', markets: ['Azadpur Mandi', 'Ghazipur Mandi'] },
    { city: 'Bengaluru', state: 'Karnataka', markets: ['Yeshwanthpur APMC', 'K R Market'] },
    { city: 'Hyderabad', state: 'Telangana', markets: ['Bowenpally Market', 'Gudimalkapur Market'] },
    { city: 'Chennai', state: 'Tamil Nadu', markets: ['Koyambedu Market', 'Pallavaram Market'] },
    { city: 'Kolkata', state: 'West Bengal', markets: ['Sealdah Koley Market', 'Mechua Fruit Market'] },
    { city: 'Pune', state: 'Maharashtra', markets: ['Market Yard Gultekdi', 'Manjari Mandai'] },
    { city: 'Jaipur', state: 'Rajasthan', markets: ['Muhana Mandi', 'Chandpole Market'] },
    { city: 'Lucknow', state: 'Uttar Pradesh', markets: ['Dubagga Mandi', 'Sitapur Road Mandi'] },
    { city: 'Bhopal', state: 'Madhya Pradesh', markets: ['Karond Mandi', 'Bittan Market'] },
    { city: 'Nagpur', state: 'Maharashtra', markets: ['Kalamna Market', 'Cotton Market'] },
    { city: 'Indore', state: 'Madhya Pradesh', markets: ['Chhawni Mandi', 'Devi Ahilya Mandi'] },
    { city: 'Patna', state: 'Bihar', markets: ['Mandiri Mandi', 'Gulzarbagh Market'] },
    { city: 'Chandigarh', state: 'Punjab', markets: ['Sector 26 Grain Market', 'Sector 20 Market'] },
    { city: 'Surat', state: 'Gujarat', markets: ['Surat APMC', 'Katargam Market'] },
    { city: 'Kanpur', state: 'Uttar Pradesh', markets: ['Naveen Mandi Sthal', 'Chunniganj Market'] },
    { city: 'Coimbatore', state: 'Tamil Nadu', markets: ['Uzhavar Sandhai', 'Gandhipuram Market'] },
    { city: 'Nashik', state: 'Maharashtra', markets: ['Nashik APMC (Pimpalgaon)', 'Lasalgaon Market'] },
    { city: 'Vadodara', state: 'Gujarat', markets: ['Vadodara APMC', 'Sayajigunj Market'] },
    { city: 'Rajkot', state: 'Gujarat', markets: ['Rajkot APMC', 'Gondal Market'] },
    { city: 'Ludhiana', state: 'Punjab', markets: ['Ludhiana Grain Market', 'Sabzi Mandi'] },
    { city: 'Varanasi', state: 'Uttar Pradesh', markets: ['Varanasi Mandi', 'Pandeypur Market'] },
    { city: 'Vijayawada', state: 'Andhra Pradesh', markets: ['Rythu Bazaar', 'Gudivada Market'] },
    { city: 'Guwahati', state: 'Assam', markets: ['Fancy Bazaar Market', 'Betkuchi Market'] },
    { city: 'Bhubaneswar', state: 'Odisha', markets: ['Unit 1 Market', 'Patia Market'] },
    { city: 'Raipur', state: 'Chhattisgarh', markets: ['Raipur Mandi', 'Telibandha Market'] },
  ];
  // ₹/quintal modal reference used as the seed baseline per commodity.
  // Data-driven, not a frontend hardcode — /api/market-prices/meta derives
  // its city/category/commodity options from this table via a DB query.
  // `image` filenames are individually HTTP-verified Wikimedia Commons
  // filenames (same verification pass as the Product demo images).
  const COMMODITIES = [
    // Vegetables
    { category: 'vegetables', commodity: 'Tomato', variety: 'Hybrid', modalSource: 2500, image: 'Tomato_je.jpg' },
    { category: 'vegetables', commodity: 'Potato', variety: 'Local', modalSource: 1800, image: 'Patates.jpg' },
    { category: 'vegetables', commodity: 'Onion', variety: 'Nashik Red', modalSource: 2200, image: 'Mixed_onions.jpg' },
    { category: 'vegetables', commodity: 'Brinjal', variety: 'Long', modalSource: 2000, image: 'Solanum_melongena_24_08_2012_(1).JPG' },
    { category: 'vegetables', commodity: 'Cabbage', variety: 'Local', modalSource: 1200, image: 'Cabbage_and_cross_section_on_white.jpg' },
    { category: 'vegetables', commodity: 'Cauliflower', variety: 'Local', modalSource: 1600, image: 'Chou-fleur_02.jpg' },
    { category: 'vegetables', commodity: 'Okra', variety: 'Bhindi', modalSource: 2800, image: 'Hong_Kong_Okra_Aug_25_2012.JPG' },
    { category: 'vegetables', commodity: 'Carrot', variety: 'Local', modalSource: 2400, image: 'Vegetable-Carrot-Bundle-wStalks.jpg' },
    { category: 'vegetables', commodity: 'Green Peas', variety: 'Local', modalSource: 4500, image: 'Peas_in_pods_-_Studio.jpg' },
    { category: 'vegetables', commodity: 'Spinach', variety: 'Local', modalSource: 1500, image: 'Spinacia_oleracea_Spinazie_bloeiend.jpg' },
    { category: 'vegetables', commodity: 'Cucumber', variety: 'Local', modalSource: 1400, image: 'ARS_cucumber.jpg' },
    { category: 'vegetables', commodity: 'Pumpkin', variety: 'Local', modalSource: 1000, image: 'FrenchMarketPumpkinsB.jpg' },
    { category: 'vegetables', commodity: 'Green Chilli', variety: 'Local', modalSource: 3500, image: 'Hatch_green_chile.jpg' },
    { category: 'vegetables', commodity: 'Capsicum', variety: 'Local', modalSource: 3000, image: 'Green-Yellow-Red-Pepper-2009.jpg' },
    { category: 'vegetables', commodity: 'Bottle Gourd', variety: 'Local', modalSource: 1300, image: 'Courge_encore_verte.jpg' },
    // Fruits
    { category: 'fruits', commodity: 'Mango', variety: 'Alphonso', modalSource: 8000, image: 'Mangos_-_single_and_halved.jpg' },
    { category: 'fruits', commodity: 'Banana', variety: 'Robusta', modalSource: 3500, image: 'Bananavarieties.jpg' },
    { category: 'fruits', commodity: 'Apple', variety: 'Shimla', modalSource: 9000, image: 'Pink_lady_and_cross_section.jpg' },
    { category: 'fruits', commodity: 'Grapes', variety: 'Thompson Seedless', modalSource: 6000, image: 'Grapes, Rostov-on-Don, Russia.jpg' },
    { category: 'fruits', commodity: 'Orange', variety: 'Nagpur', modalSource: 4500, image: 'Oranges_-_whole-halved-segment.jpg' },
    { category: 'fruits', commodity: 'Papaya', variety: 'Local', modalSource: 2500, image: 'Carica_papaya_005.JPG' },
    { category: 'fruits', commodity: 'Watermelon', variety: 'Local', modalSource: 1800, image: 'Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg' },
    { category: 'fruits', commodity: 'Pomegranate', variety: 'Bhagwa', modalSource: 9500, image: 'Pomegranate_Juice_(2019).jpg' },
    { category: 'fruits', commodity: 'Guava', variety: 'Local', modalSource: 3200, image: 'Guava_pink_fruit.jpg' },
    { category: 'fruits', commodity: 'Pineapple', variety: 'Local', modalSource: 2800, image: 'Pineapple_and_cross_section.jpg' },
    { category: 'fruits', commodity: 'Sweet Lime', variety: 'Mosambi', modalSource: 4000, image: '(Citrus_limetta)_Mosambi_at_a_market_in_Seethammadhara.jpg' },
    // Grains
    { category: 'grains', commodity: 'Rice', variety: 'Basmati', modalSource: 4200, image: '20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg' },
    { category: 'grains', commodity: 'Wheat', variety: 'Sharbati', modalSource: 2800, image: 'Vehnäpelto_6.jpg' },
    { category: 'grains', commodity: 'Maize', variety: 'Local', modalSource: 2200, image: 'Corn_on_the_cob_(sweet_corn).jpg' },
    { category: 'grains', commodity: 'Bajra', variety: 'Local', modalSource: 2400, image: 'Grain_millet,_early_grain_fill,_Tifton,_7-3-02.jpg' },
    { category: 'grains', commodity: 'Jowar', variety: 'Local', modalSource: 3000, image: 'Sorghum_bicolor03.jpg' },
    { category: 'grains', commodity: 'Barley', variety: 'Local', modalSource: 2100, image: 'Barley (Hordeum vulgare) - United States National Arboretum - 24 May 2009.jpg' },
    { category: 'grains', commodity: 'Gram', variety: 'Chana', modalSource: 5500, image: 'Chickpea_BNC.jpg' },
    { category: 'grains', commodity: 'Moong', variety: 'Local', modalSource: 8000, image: 'Mung_beans_(Vigna_radiata).jpg' },
    { category: 'grains', commodity: 'Tur', variety: 'Arhar', modalSource: 9000, image: 'Pigeon_Pea_(Toor_Dal)_(49683602388).jpg' },
    // Spices
    { category: 'spices', commodity: 'Chilli', variety: 'Dry Red', modalSource: 11000, image: 'Kashmiri_Red_Chilli.JPG' },
    { category: 'spices', commodity: 'Turmeric', variety: 'Finger', modalSource: 12500, image: 'Turmeric-powder.jpg' },
    { category: 'spices', commodity: 'Coriander', variety: 'Local', modalSource: 8500, image: 'A_scene_of_Coriander_leaves.JPG' },
    { category: 'spices', commodity: 'Cumin', variety: 'Jeera', modalSource: 25000, image: 'Cumin_Seeds.jpg' },
    { category: 'spices', commodity: 'Ginger', variety: 'Local', modalSource: 6000, image: 'Ginger_Root.jpg' },
    { category: 'spices', commodity: 'Garlic', variety: 'Local', modalSource: 9000, image: 'Garlic_bulbs_and_cloves.jpg' },
    { category: 'spices', commodity: 'Cardamom', variety: 'Small', modalSource: 120000, image: 'Cardomom_pods.jpg' },
    { category: 'spices', commodity: 'Black Pepper', variety: 'Local', modalSource: 55000, image: '4_color_mix_of_peppercorns.jpg' },
    // Dairy
    { category: 'dairy', commodity: 'Milk', variety: 'Cow', modalSource: 5000, image: 'Glass_of_Milk_(33657535532).jpg' },
    { category: 'dairy', commodity: 'Ghee', variety: 'Cow', modalSource: 55000, image: 'Desi_ghee.JPG' },
    { category: 'dairy', commodity: 'Paneer', variety: 'Local', modalSource: 32000, image: 'Panir_Paneer_Indian_cheese_fresh.jpg' },
    { category: 'dairy', commodity: 'Curd', variety: 'Local', modalSource: 6000, image: 'Joghurt.jpg' },
    { category: 'dairy', commodity: 'Butter', variety: 'Local', modalSource: 45000, image: 'Butter_block.JPG' },
  ];

  // Deterministic pseudo-variation so re-seeding (fresh DB) always produces
  // the same demo data — not real randomness, just spreads values a bit.
  function variance(seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (((h >>> 0) % 2000) / 1000) - 1; // -1..1
  }

  const ts = new Date().toISOString();
  const sourceDate = ts.slice(0, 10);
  const insertPrice = db.prepare(`
    INSERT INTO market_prices (
      id, city_region, state, market_name, category, commodity, variety, grade,
      min_price_kg, modal_price_kg, max_price_kg,
      source_unit, min_price_source, modal_price_source, max_price_source,
      arrival_quantity, arrival_unit, image_url,
      source_name, source_record_id, source_date, source_updated_at,
      fetched_at, normalized_at, status, created_date, updated_date
    ) VALUES (
      @id, @city_region, @state, @market_name, @category, @commodity, @variety, @grade,
      @min_price_kg, @modal_price_kg, @max_price_kg,
      @source_unit, @min_price_source, @modal_price_source, @max_price_source,
      @arrival_quantity, @arrival_unit, @image_url,
      @source_name, @source_record_id, @source_date, @source_updated_at,
      @fetched_at, @normalized_at, @status, @created_date, @updated_date
    )
  `);

  let recordIndex = 0;
  for (const region of REGIONS) {
    region.markets.forEach((market, marketIdx) => {
      // Only the primary market per region carries the full commodity list;
      // secondary markets carry a representative subset spanning all 5
      // categories — keeps total seed rows in the low thousands (trivial for
      // SQLite) instead of a full region x market x commodity cross-product.
      const commodities = marketIdx === 0 ? COMMODITIES : COMMODITIES.slice(0, 15);
      for (const c of commodities) {
        const v = variance(`${region.city}-${market}-${c.commodity}`);
        const modalSource = Math.round(c.modalSource * (1 + v * 0.12));
        const minSource = Math.round(modalSource * 0.85);
        const maxSource = Math.round(modalSource * 1.15);
        const arrivalQty = Math.round(50 + Math.abs(v) * 200);
        recordIndex++;
        const minKg = convertToKg(minSource, 'quintal');
        const modalKg = convertToKg(modalSource, 'quintal');
        const maxKg = convertToKg(maxSource, 'quintal');
        const { valid } = validateRecord({ minPriceKg: minKg, modalPriceKg: modalKg, maxPriceKg: maxKg });
        insertPrice.run({
          id: uuidv4(),
          city_region: region.city,
          state: region.state,
          market_name: market,
          category: c.category,
          commodity: c.commodity,
          variety: c.variety,
          grade: 'FAQ',
          min_price_kg: minKg,
          modal_price_kg: modalKg,
          max_price_kg: maxKg,
          source_unit: 'quintal',
          min_price_source: minSource,
          modal_price_source: modalSource,
          max_price_source: maxSource,
          arrival_quantity: arrivalQty,
          arrival_unit: 'quintal',
          image_url: c.image ? commonsImage(c.image) : null,
          source_name: 'FarmTrust Sample Data',
          source_record_id: `seed-${recordIndex}`,
          source_date: sourceDate,
          source_updated_at: ts,
          fetched_at: ts,
          normalized_at: ts,
          status: valid ? 'published' : 'quarantined',
          created_date: ts,
          updated_date: ts,
        });
      }
    });
  }

  // One deliberately-invalid record (min > modal) so the validation pipeline
  // and the admin console's "quarantined records" count are demonstrably real,
  // not just always-zero decoration. Never served by the public list route.
  // Status is derived from validateRecord() like every other row above —
  // this row exists to prove that path actually rejects bad data.
  {
    const badMin = convertToKg(3000, 'quintal'); // 30 — deliberately > modal
    const badModal = convertToKg(2500, 'quintal'); // 25
    const badMax = convertToKg(3500, 'quintal'); // 35
    const { valid: badValid } = validateRecord({ minPriceKg: badMin, modalPriceKg: badModal, maxPriceKg: badMax });
    insertPrice.run({
      id: uuidv4(),
      city_region: 'Ahmedabad',
      state: 'Gujarat',
      market_name: 'Unverified Feed Sample',
      category: 'vegetables',
      commodity: 'Tomato',
      variety: 'Hybrid',
      grade: 'FAQ',
      min_price_kg: badMin,
      modal_price_kg: badModal,
      max_price_kg: badMax,
      source_unit: 'quintal',
      min_price_source: 3000,
      modal_price_source: 2500,
      max_price_source: 3500,
      arrival_quantity: 40,
      arrival_unit: 'quintal',
      image_url: commonsImage('Tomato_je.jpg'),
      source_name: 'FarmTrust Sample Data',
      source_record_id: 'seed-invalid-1',
      source_date: sourceDate,
      source_updated_at: ts,
      fetched_at: ts,
      normalized_at: ts,
      status: badValid ? 'published' : 'quarantined',
      created_date: ts,
      updated_date: ts,
    });
  }

  console.log('[db] bootstrap market_prices sample data seeded');
}

export { uuidv4 };
