const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../database');

// GET all prescriptions with search/filter/sort
router.get('/', async (req, res) => {
  try {
    const { search, doctor, from, to, sort, order } = req.query;
    let sql = `SELECT * FROM prescriptions WHERE 1=1`;
    const params = [];

    if (search) { sql += ` AND (patient_name LIKE ? OR doctor_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (doctor) { sql += ` AND doctor_id=?`; params.push(doctor); }
    if (from)   { sql += ` AND date(created_at)>=?`; params.push(from); }
    if (to)     { sql += ` AND date(created_at)<=?`; params.push(to); }

    const validSort = ['rescription_id','patient_name','doctor_name','created_at'];
    const sortField = validSort.includes(sort) ? sort : 'rescription_id';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    res.json(await dbAll(null, sql, params));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const rows = await dbAll(null, `SELECT * FROM prescriptions ORDER BY rescription_id DESC`);
    const headers = ['ID','Patient','Doctor','Specialist','Age','Gender','BP','Date'];
    const csv = [headers.join(','), ...rows.map(r =>
      [r.rescription_id, `"${r.patient_name}"`, `"${r.doctor_name}"`, `"${r.specialist_in}"`, r.age, r.gender, r.bp || '', new Date(r.created_at).toLocaleDateString('en-GB')].join(',')
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=prescriptions.csv');
    res.send(csv);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET single prescription with medicines
router.get('/:id', async (req, res) => {
  try {
    const rx = await dbGet(null, `SELECT * FROM prescriptions WHERE rescription_id=?`, [req.params.id]);
    if (!rx) return res.status(404).json({ error: 'Not found' });
    const meds = await dbAll(null, `SELECT * FROM rx WHERE rescription_id=?`, [req.params.id]);
    res.json({ ...rx, medicines: meds });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST create
router.post('/', async (req, res) => {
  const { doctor_id, doctor_name, specialist_in, contact, patient_name, age, gender, bp, sh, wt, cc, medicines } = req.body;
  if (!patient_name || !doctor_name) return res.status(400).json({ error: 'Patient name and doctor name required' });
  try {
    const r = await dbRun(null,
      `INSERT INTO prescriptions (doctor_id,doctor_name,specialist_in,contact,patient_name,age,gender,bp,sh,wt,cc) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [doctor_id || null, doctor_name, specialist_in || '', contact || '', patient_name, age || '', gender || '', bp || '', sh || '', wt || '', cc || '']
    );
    const pid = r.lastID;
    if (medicines && medicines.length) {
      for (const m of medicines) {
        await dbRun(null,
          `INSERT INTO rx (rescription_id,medicine_id,type_medicine,name_medicine,quantity,dose) VALUES (?,?,?,?,?,?)`,
          [pid, m.medicine_id || null, m.type_medicine || '', m.name_medicine || '', m.quantity || '', m.dose || '']
        );
      }
    }
    res.json({ success: true, id: pid });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  const { doctor_id, doctor_name, specialist_in, contact, patient_name, age, gender, bp, sh, wt, cc, medicines } = req.body;
  try {
    await dbRun(null,
      `UPDATE prescriptions SET doctor_id=?,doctor_name=?,specialist_in=?,contact=?,patient_name=?,age=?,gender=?,bp=?,sh=?,wt=?,cc=? WHERE rescription_id=?`,
      [doctor_id || null, doctor_name, specialist_in || '', contact || '', patient_name, age || '', gender || '', bp || '', sh || '', wt || '', cc || '', req.params.id]
    );
    await dbRun(null, `DELETE FROM rx WHERE rescription_id=?`, [req.params.id]);
    if (medicines && medicines.length) {
      for (const m of medicines) {
        await dbRun(null,
          `INSERT INTO rx (rescription_id,medicine_id,type_medicine,name_medicine,quantity,dose) VALUES (?,?,?,?,?,?)`,
          [req.params.id, m.medicine_id || null, m.type_medicine || '', m.name_medicine || '', m.quantity || '', m.dose || '']
        );
      }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE single
router.delete('/:id', async (req, res) => {
  try {
    await dbRun(null, `DELETE FROM rx WHERE rescription_id=?`, [req.params.id]);
    await dbRun(null, `DELETE FROM prescriptions WHERE rescription_id=?`, [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE multiple
router.post('/delete-multiple', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs' });
  try {
    for (const id of ids) {
      await dbRun(null, `DELETE FROM rx WHERE rescription_id=?`, [id]);
      await dbRun(null, `DELETE FROM prescriptions WHERE rescription_id=?`, [id]);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// View / print prescription
router.get('/:id/view', async (req, res) => {
  try {
    const rx = await dbGet(null, `SELECT * FROM prescriptions WHERE rescription_id=?`, [req.params.id]);
    if (!rx) return res.status(404).json({ error: 'Not found' });
    const meds = await dbAll(null, `SELECT * FROM rx WHERE rescription_id=?`, [req.params.id]);
    const data = encodeURIComponent(JSON.stringify({ ...rx, medicines: meds }));
    const print = req.query.print || '0';
    res.redirect(`/prescription-template.html?print=${print}&data=${data}`);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
