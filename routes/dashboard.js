const express = require('express');
const router = express.Router();
const { dbGet, dbAll } = require('../database');

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const year  = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0, 10);

    const [todayRx, weekRx, monthRx, yearRx, totalDoctors, monthlyChart] = await Promise.all([
      dbGet(null, `SELECT COUNT(*) as count FROM prescriptions WHERE date(created_at)=?`, [today]),
      dbGet(null, `SELECT COUNT(*) as count FROM prescriptions WHERE date(created_at)>=?`, [weekAgo]),
      dbGet(null, `SELECT COUNT(*) as count FROM prescriptions WHERE strftime('%Y-%m', created_at)=?`, [`${year}-${String(month).padStart(2,'0')}`]),
      dbGet(null, `SELECT COUNT(*) as count FROM prescriptions WHERE strftime('%Y', created_at)=?`, [String(year)]),
      dbGet(null, `SELECT COUNT(*) as count FROM doctors`),
      dbAll(null, `SELECT strftime('%m', created_at) as month, COUNT(*) as count FROM prescriptions WHERE strftime('%Y', created_at)=? GROUP BY month ORDER BY month ASC`, [String(year)]),
    ]);

    res.json({
      today:        todayRx?.count  || 0,
      week:         weekRx?.count   || 0,
      month:        monthRx?.count  || 0,
      year:         yearRx?.count   || 0,
      doctors:      totalDoctors?.count || 0,
      monthlyChart: monthlyChart || [],
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
