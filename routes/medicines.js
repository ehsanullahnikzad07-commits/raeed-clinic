const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../database');

router.get('/', async (req, res) => {
  try {
    res.json(await dbAll(null, `SELECT * FROM medicines ORDER BY name ASC`));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/search', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    res.json(await dbAll(null, `SELECT * FROM medicines WHERE name LIKE ? OR type LIKE ? ORDER BY name ASC LIMIT 20`, [q, q]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet(null, `SELECT * FROM medicines WHERE id=?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name, type, default_dose, description } = req.body;
  try {
    const r = await dbRun(null, `INSERT INTO medicines (name,type,default_dose,description) VALUES (?,?,?,?)`, [name, type, default_dose || '', description || '']);
    res.json({ success: true, id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { name, type, default_dose, description } = req.body;
  try {
    await dbRun(null, `UPDATE medicines SET name=?,type=?,default_dose=?,description=? WHERE id=?`, [name, type, default_dose || '', description || '', req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await dbRun(null, `DELETE FROM medicines WHERE id=?`, [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/delete-multiple', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    await dbRun(null, `DELETE FROM medicines WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
