const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet, dbRun } = require('../database');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const user = await dbGet(null, `SELECT * FROM users WHERE username = ?`, [username]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid username or password' });
    req.session.user = { user_id: user.user_id, username: user.username, position: user.position };
    res.json({ success: true, user: req.session.user });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/check', async (req, res) => {
  try {
    const s = await dbGet(null, `SELECT value FROM settings WHERE key = 'always_require_login'`);
    if (req.session && req.session.user)
      return res.json({ loggedIn: true, user: req.session.user });
    res.json({ loggedIn: false, alwaysRequireLogin: s?.value === 'true' });
  } catch(e) {
    res.json({ loggedIn: false, alwaysRequireLogin: false });
  }
});

module.exports = router;
