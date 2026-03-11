const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./database');
const config = require('./config');

initDb();

const app = express();
const PORT = config.PORT;
const MODE = config.MODE;

// ── CORS for online mode ─────────────────────────────
if (MODE === 'online') {
  const cors = require('cors');
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.xhr || req.headers.accept?.includes('application/json'))
    return res.status(401).json({ error: 'Unauthorized' });
  res.redirect('/');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.position === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', requireAuth, require('./routes/doctors'));
app.use('/api/prescriptions', requireAuth, require('./routes/prescriptions'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/api/settings', requireAuth, require('./routes/settings'));
app.use('/api/users', requireAuth, require('./routes/users'));
app.use('/api/medicines', requireAuth, require('./routes/medicines'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.session.user }));

const HOST = MODE === 'online' ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`\n🏥 Raeed OPD Clinic — Mode: ${MODE.toUpperCase()}`);
  console.log(`🌐 Running at http://${HOST === '0.0.0.0' ? 'YOUR_IP' : 'localhost'}:${PORT}`);
  console.log(`👤 Default login: admin / admin123\n`);
});
