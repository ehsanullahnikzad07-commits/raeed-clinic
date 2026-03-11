const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun } = require('../database');

router.get('/', async (req, res) => {
  try {
    res.json(await dbAll(null, `SELECT user_id,username,position,created_at FROM users ORDER BY created_at DESC`));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { username, password, position } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = await dbRun(null, `INSERT INTO users (username,password,position) VALUES (?,?,?)`, [username, hash, position || 'user']);
    res.json({ success: true, id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { username, password, position } = req.body;
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      await dbRun(null, `UPDATE users SET username=?,password=?,position=? WHERE user_id=?`, [username, hash, position, req.params.id]);
    } else {
      await dbRun(null, `UPDATE users SET username=?,position=? WHERE user_id=?`, [username, position, req.params.id]);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await dbRun(null, `DELETE FROM users WHERE user_id=?`, [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
