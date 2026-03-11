const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR  = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'raeed_clinic.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let _db = null;
function getDb() {
  if (!_db) _db = new Database(DB_PATH);
  return _db;
}

function dbRun(_, sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    const r = stmt.run(...(params || []));
    return Promise.resolve({ lastID: r.lastInsertRowid, changes: r.changes });
  } catch(e) { return Promise.reject(e); }
}

function dbGet(_, sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return Promise.resolve(stmt.get(...(params || [])));
  } catch(e) { return Promise.reject(e); }
}

function dbAll(_, sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return Promise.resolve(stmt.all(...(params || [])));
  } catch(e) { return Promise.reject(e); }
}

async function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, position TEXT NOT NULL DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, doctor TEXT NOT NULL, specialist TEXT NOT NULL, contact TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS medicines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, type TEXT NOT NULL, default_dose TEXT DEFAULT '', description TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS prescriptions (rescription_id INTEGER PRIMARY KEY AUTOINCREMENT, doctor_id INTEGER, doctor_name TEXT NOT NULL, specialist_in TEXT NOT NULL, contact TEXT NOT NULL, patient_name TEXT NOT NULL, age TEXT NOT NULL, gender TEXT NOT NULL, bp TEXT, sh TEXT, wt TEXT, cc TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS rx (id INTEGER PRIMARY KEY AUTOINCREMENT, rescription_id INTEGER NOT NULL, medicine_id INTEGER, type_medicine TEXT NOT NULL DEFAULT '', name_medicine TEXT NOT NULL DEFAULT '', quantity TEXT NOT NULL DEFAULT '', dose TEXT NOT NULL DEFAULT '');
  `);

  try { db.exec(`ALTER TABLE rx ADD COLUMN medicine_id INTEGER`); } catch(e) {}
  try { db.exec(`ALTER TABLE rx ADD COLUMN type_medicine TEXT NOT NULL DEFAULT ''`); } catch(e) {}
  try { db.exec(`ALTER TABLE rx ADD COLUMN name_medicine TEXT NOT NULL DEFAULT ''`); } catch(e) {}
  try { db.exec(`ALTER TABLE rx ADD COLUMN quantity TEXT NOT NULL DEFAULT ''`); } catch(e) {}
  try { db.exec(`ALTER TABLE rx ADD COLUMN dose TEXT NOT NULL DEFAULT ''`); } catch(e) {}

  const defs = [
    ['always_require_login','false'],
    ['clinic_name','Raeed OPD Clinic'],
    ['clinic_name_fa','کلینیک سراپا رائید'],
    ['clinic_address','چهارراهی کارته پروان نارسیده به درمسال سیکها کوچه اول خانه سوم کابل - افغانستان'],
    ['clinic_phone','0782202051 / 0796202087 / 0774259282']
  ];
  for (const [k,v] of defs) await dbRun(null, `INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, [k,v]);

  const admin = await dbGet(null, `SELECT * FROM users WHERE position='admin'`);
  if (!admin) {
    const h = bcrypt.hashSync('admin123', 10);
    await dbRun(null, `INSERT INTO users (username,password,position) VALUES (?,?,?)`, ['admin',h,'admin']);
  }

  const meds = [
    ['Paracetamol','Tablet','500mg 3x/day after meal','For fever and pain'],
    ['Amoxicillin','Capsule','500mg 3x/day','Antibiotic'],
    ['Ibuprofen','Tablet','400mg 3x/day after meal','Anti-inflammatory'],
    ['Metronidazole','Tablet','500mg 2x/day','Antibiotic'],
    ['Omeprazole','Capsule','20mg 1x/day before meal','For stomach acidity'],
    ['Ciprofloxacin','Tablet','500mg 2x/day','Antibiotic'],
    ['Diclofenac','Tablet','50mg 2x/day after meal','Pain relief'],
    ['Dexamethasone','Tablet','4mg 2x/day','Anti-inflammatory'],
    ['Cetirizine','Tablet','10mg 1x/day at night','Antihistamine'],
    ['Azithromycin','Tablet','500mg 1x/day','Antibiotic'],
    ['Metformin','Tablet','500mg 2x/day after meal','Diabetes'],
    ['Amlodipine','Tablet','5mg 1x/day','Blood pressure'],
    ['Vitamin C','Tablet','1000mg 1x/day','Supplement'],
    ['Zinc','Tablet','20mg 1x/day','Supplement'],
    ['ORS','Powder','1 sachet in 1L water','Rehydration'],
    ['Antacid','Syrup','10ml 3x/day after meal','Acidity'],
    ['Multivitamin','Tablet','1 tablet 1x/day','Supplement'],
    ['Cough Syrup','Syrup','10ml 3x/day','For cough'],
    ['Paracetamol Injection','Injection','1g IV slowly','Fever/pain IV'],
    ['Normal Saline','Serum','500ml IV drip','Rehydration IV'],
  ];
  for (const [n,t,d,desc] of meds)
    await dbRun(null, `INSERT OR IGNORE INTO medicines (name,type,default_dose,description) VALUES (?,?,?,?)`, [n,t,d,desc]);

  console.log('✅ Database ready');
}

module.exports = { getDb, initDb, dbRun, dbGet, dbAll };
