const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../database');

router.get('/', async (req, res) => {
  try {
    res.json(await dbAll(null, `SELECT * FROM doctors ORDER BY id DESC`));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet(null, `SELECT * FROM doctors WHERE id=?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { doctor, specialist, contact } = req.body;
  try {
    const r = await dbRun(null, `INSERT INTO doctors (doctor,specialist,contact) VALUES (?,?,?)`, [doctor, specialist, contact]);
    res.json({ success: true, id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { doctor, specialist, contact } = req.body;
  try {
    await dbRun(null, `UPDATE doctors SET doctor=?,specialist=?,contact=? WHERE id=?`, [doctor, specialist, contact, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await dbRun(null, `DELETE FROM doctors WHERE id=?`, [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/delete-multiple', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    await dbRun(null, `DELETE FROM doctors WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
