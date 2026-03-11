const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dbGet, dbAll, dbRun } = require('../database');

const upload = multer({ dest: 'uploads/' });

router.get('/', async (req, res) => {
  try {
    const rows = await dbAll(null, `SELECT * FROM settings`);
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await dbRun(null, `INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)`, [key, String(value)]);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/backup', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '..', 'database', 'raeed_clinic.db');
    res.download(dbPath, 'raeed_clinic_backup.db');
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/restore', upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const dbPath = path.join(__dirname, '..', 'database', 'raeed_clinic.db');
    fs.copyFileSync(req.file.path, dbPath);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: 'Database restored. Please restart the server.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
