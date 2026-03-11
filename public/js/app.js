// ============== STATE ==============
let currentUser = null;
let doctorsData = [];
let allMedicines = [];
let reportSortField = 'created_at';
let reportSortOrder = 'DESC';
let confirmCallback = null;
let editingPrescriptionId = null;
let monthlyChartInstance = null;

// ============== INIT ==============
document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  if (data.loggedIn) { currentUser = data.user; showApp(); }
  else showLoginPage();
});

function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginUsername').focus();
  document.getElementById('loginPassword').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
}

function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('sidebarUser').textContent = `👤 ${currentUser.username}`;
  if (currentUser.position !== 'admin') {
    const el = document.getElementById('adminUserCard');
    if (el) el.style.display = 'none';
  }
  loadMedicines().then(() => showPage('dashboard'));
}

// ============== AUTH ==============
async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  if (!username || !password) { errEl.textContent = 'Please enter username and password'; errEl.classList.remove('hidden'); return; }
  try {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (data.success) { currentUser = data.user; showApp(); }
    else { errEl.textContent = data.error || 'Login failed'; errEl.classList.remove('hidden'); }
  } catch { errEl.textContent = 'Connection error'; errEl.classList.remove('hidden'); }
}

async function doLogout() {
  confirm2('Are you sure you want to logout?', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    document.getElementById('loginPassword').value = '';
    showLoginPage();
  });
}

// ============== NAVIGATION ==============
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageId = 'page' + page.charAt(0).toUpperCase() + page.slice(1);
  const pageEl = document.getElementById(pageId);
  if (pageEl) { pageEl.classList.remove('hidden'); pageEl.classList.add('active'); }

  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick')?.includes(`'${page}'`)) n.classList.add('active');
  });

  if (page === 'dashboard') loadDashboard();
  else if (page === 'doctors') loadDoctors();
  else if (page === 'prescriptions') { if (!editingPrescriptionId) initPrescriptionForm(); }
  else if (page === 'reports') loadReports();
  else if (page === 'settings') loadSettings();
  else if (page === 'medicines') loadMedicinesPage();
}

// ============== DASHBOARD ==============
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    document.getElementById('statToday').textContent = data.today;
    document.getElementById('statWeek').textContent = data.week;
    document.getElementById('statMonth').textContent = data.month;
    document.getElementById('statYear').textContent = data.year;
    document.getElementById('statDoctors').textContent = data.doctors;
    document.getElementById('dashWelcome').textContent = `Welcome, ${currentUser.username}! | Raeed OPD Clinic`;
    const chartData = new Array(12).fill(0);
    data.monthlyChart.forEach(m => { chartData[parseInt(m.month) - 1] = m.count; });
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [{ label: 'Prescriptions', data: chartData, backgroundColor: chartData.map((_, i) => i === new Date().getMonth() ? '#1a7f7f' : i === new Date().getMonth()-1 ? '#2a9d9d' : '#b2d8d8'), borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  } catch(e) { showToast('Failed to load dashboard', 'error'); }
}

// ============== DOCTORS ==============
async function loadDoctors() {
  const res = await fetch('/api/doctors');
  doctorsData = await res.json();
  renderDoctors(doctorsData);
}

function renderDoctors(data) {
  const tbody = document.getElementById('doctorsBody');
  tbody.innerHTML = data.length ? data.map(d => `
    <tr>
      <td><input type="checkbox" class="doc-check" value="${d.id}" onchange="updateDeleteBtn()"></td>
      <td>${d.id}</td>
      <td><strong>${d.doctor}</strong></td>
      <td>${d.specialist}</td>
      <td>${d.contact}</td>
      <td><div class="action-btns">
        <button class="btn btn-primary btn-sm" onclick="editDoctor(${d.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDoctor(${d.id}, '${d.doctor.replace(/'/g,"\\'")}')">🗑</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px">No doctors found</td></tr>';
}

function filterDoctors() {
  const q = document.getElementById('doctorSearch').value.toLowerCase();
  renderDoctors(doctorsData.filter(d => d.doctor.toLowerCase().includes(q) || d.specialist.toLowerCase().includes(q) || d.contact.includes(q)));
}

function toggleAllDoctors(cb) { document.querySelectorAll('.doc-check').forEach(c => c.checked = cb.checked); updateDeleteBtn(); }
function updateDeleteBtn() { document.getElementById('btnDeleteDoctors').disabled = document.querySelectorAll('.doc-check:checked').length === 0; }

function openDoctorModal(doctor = null) {
  document.getElementById('modalTitle').textContent = doctor ? 'Edit Doctor' : 'Add New Doctor';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Doctor Name *</label><input type="text" id="mDoctorName" class="form-control" value="${doctor?.doctor||''}" placeholder="Full name"></div>
    <div class="form-group"><label>Specialist *</label><input type="text" id="mSpecialist" class="form-control" value="${doctor?.specialist||''}" placeholder="e.g. General, Cardiology..."></div>
    <div class="form-group"><label>Contact *</label><input type="text" id="mContact" class="form-control" value="${doctor?.contact||''}" placeholder="Phone number"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeAllModals()">Cancel</button>
    <button class="btn btn-primary" onclick="saveDoctor(${doctor?.id||'null'})">💾 Save</button>`;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

async function saveDoctor(id) {
  const name = document.getElementById('mDoctorName').value.trim();
  const spec = document.getElementById('mSpecialist').value.trim();
  const cont = document.getElementById('mContact').value.trim();
  if (!name || !spec || !cont) { showToast('All fields are required', 'error'); return; }
  confirm2(`${id ? 'Update' : 'Add'} doctor "${name}"?`, async () => {
    const url = id ? `/api/doctors/${id}` : '/api/doctors';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctor: name, specialist: spec, contact: cont }) });
    const data = await res.json();
    if (data.success || data.id) { closeAllModals(); loadDoctors(); showToast(id ? 'Doctor updated!' : 'Doctor added!', 'success'); }
    else showToast(data.error || 'Failed', 'error');
  });
}

async function editDoctor(id) {
  const res = await fetch(`/api/doctors/${id}`);
  const doctor = await res.json();
  openDoctorModal(doctor);
}

function deleteDoctor(id, name) {
  confirm2(`Delete doctor "${name}"?`, async () => {
    const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
    if ((await res.json()).success) { loadDoctors(); showToast('Doctor deleted!', 'success'); }
  });
}

async function deleteSelectedDoctors() {
  const ids = [...document.querySelectorAll('.doc-check:checked')].map(c => parseInt(c.value));
  confirm2(`Delete ${ids.length} selected doctor(s)?`, async () => {
    const res = await fetch('/api/doctors/delete-multiple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    if ((await res.json()).success) { loadDoctors(); showToast('Doctors deleted!', 'success'); }
  });
}

// ============== MEDICINES ==============
let medSortField = 'name';
let medSortOrder = 'ASC';

async function loadMedicines() {
  const res = await fetch('/api/medicines');
  allMedicines = await res.json();
}

async function loadMedicinesPage() {
  await loadMedicines();
  applyMedicineTable();
}

function applyMedicineTable() {
  const q    = (document.getElementById('medicineSearch')?.value || '').toLowerCase();
  const type = document.getElementById('medicineTypeFilter')?.value || '';

  let data = allMedicines.filter(m =>
    (!q    || m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || (m.default_dose||'').toLowerCase().includes(q) || (m.description||'').toLowerCase().includes(q)) &&
    (!type || m.type === type)
  );

  data.sort((a, b) => {
    let va = medSortField === 'id' ? a.id : (a[medSortField] || '').toString().toLowerCase();
    let vb = medSortField === 'id' ? b.id : (b[medSortField] || '').toString().toLowerCase();
    if (va < vb) return medSortOrder === 'ASC' ? -1 : 1;
    if (va > vb) return medSortOrder === 'ASC' ?  1 : -1;
    return 0;
  });

  // Update header arrows
  ['id','name','type','default_dose'].forEach(f => {
    const th = document.getElementById('medTh_' + f);
    if (!th) return;
    const base = { id:'ID', name:'Name', type:'Type', default_dose:'Default Dose' }[f];
    th.textContent = base + (medSortField === f ? (medSortOrder === 'ASC' ? ' ↑' : ' ↓') : ' ↕');
  });

  const tbody = document.getElementById('medicinesBody');
  if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(m => `
    <tr>
      <td style="width:40px;text-align:center"><input type="checkbox" class="med-check" value="${m.id}" onchange="updateMedDeleteBtn()"></td>
      <td style="width:45px">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td style="width:90px"><span style="background:#e0f4f4;color:#1a7f7f;padding:2px 8px;border-radius:10px;font-size:0.8rem;white-space:nowrap">${m.type}</span></td>
      <td style="width:170px">${m.default_dose || '-'}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(m.description||'').replace(/"/g,'')}">${m.description || '-'}</td>
      <td style="width:120px"><div class="action-btns">
        <button class="btn btn-primary btn-sm" onclick="editMedicine(${m.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMedicine(${m.id},'${m.name.replace(/'/g,"\\'")}')">🗑</button>
      </div></td>
    </tr>`).join('') :
    `<tr><td colspan="7" style="text-align:center;color:#888;padding:20px">No medicines found</td></tr>`;

  updateMedDeleteBtn();
}

function filterMedicines()  { applyMedicineTable(); }

function sortMedicines(field) {
  if (medSortField === field) medSortOrder = medSortOrder === 'ASC' ? 'DESC' : 'ASC';
  else { medSortField = field; medSortOrder = 'ASC'; }
  applyMedicineTable();
}

function clearMedicineFilters() {
  const s = document.getElementById('medicineSearch');    if (s) s.value = '';
  const t = document.getElementById('medicineTypeFilter'); if (t) t.value = '';
  medSortField = 'name'; medSortOrder = 'ASC';
  applyMedicineTable();
}

function toggleAllMedicines(cb) {
  document.querySelectorAll('.med-check').forEach(c => c.checked = cb.checked);
  updateMedDeleteBtn();
}

function updateMedDeleteBtn() {
  const btn = document.getElementById('btnDeleteMedicines');
  if (btn) btn.disabled = document.querySelectorAll('.med-check:checked').length === 0;
}

async function deleteSelectedMedicines() {
  const ids = [...document.querySelectorAll('.med-check:checked')].map(c => parseInt(c.value));
  if (!ids.length) return;
  confirm2(`Delete ${ids.length} selected medicine(s)?`, async () => {
    const res = await fetch('/api/medicines/delete-multiple', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
    if ((await res.json()).success) { await loadMedicinesPage(); showToast('Medicines deleted!', 'success'); }
    else showToast('Failed to delete', 'error');
  });
}

function openMedicineModal(med = null) {
  const types = ['Tablet','Capsule','Syrup','Injection','Serum','Drop','Cream','Inhaler','Powder'];
  document.getElementById('modalTitle').textContent = med ? 'Edit Medicine' : 'Add New Medicine';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Medicine Name *</label><input type="text" id="mMedName" class="form-control" value="${med?.name||''}" placeholder="e.g. Paracetamol"></div>
    <div class="form-group"><label>Type *</label>
      <select id="mMedType" class="form-control">${types.map(t => `<option value="${t}" ${med?.type===t?'selected':''}>${t}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Default Dose</label><input type="text" id="mMedDose" class="form-control" value="${med?.default_dose||''}" placeholder="e.g. 500mg 3x/day"></div>
    <div class="form-group"><label>Description</label><textarea id="mMedDesc" class="form-control" rows="2">${med?.description||''}</textarea></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeAllModals()">Cancel</button>
    <button class="btn btn-primary" onclick="saveMedicine(${med?.id||'null'})">💾 Save</button>`;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

async function saveMedicine(id) {
  const name = document.getElementById('mMedName').value.trim();
  const type = document.getElementById('mMedType').value;
  const dose = document.getElementById('mMedDose').value.trim();
  const desc = document.getElementById('mMedDesc').value.trim();
  if (!name) { showToast('Medicine name is required', 'error'); return; }
  confirm2(`${id ? 'Update' : 'Add'} medicine "${name}"?`, async () => {
    const url = id ? `/api/medicines/${id}` : '/api/medicines';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, default_dose: dose, description: desc }) });
    const data = await res.json();
    if (data.success || data.id) { closeAllModals(); await loadMedicinesPage(); showToast(id ? 'Medicine updated!' : 'Medicine added!', 'success'); }
    else showToast(data.error || 'Failed', 'error');
  });
}

async function editMedicine(id) {
  const res = await fetch(`/api/medicines/${id}`);
  openMedicineModal(await res.json());
}

function deleteMedicine(id, name) {
  confirm2(`Delete medicine "${name}"?`, async () => {
    const res = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
    if ((await res.json()).success) { await loadMedicinesPage(); showToast('Medicine deleted!', 'success'); }
  });
}

// ============== PRESCRIPTIONS ==============
async function initPrescriptionForm(keepEditId = false) {
  if (!keepEditId) editingPrescriptionId = null;
  const res = await fetch('/api/doctors');
  doctorsData = await res.json();
  const sel = document.getElementById('pDoctorId');
  sel.innerHTML = '<option value="">-- Select Doctor --</option>' + doctorsData.map(d =>
    `<option value="${d.id}" data-specialist="${d.specialist}" data-contact="${d.contact}">${d.doctor}</option>`).join('');
  document.getElementById('rxContainer').innerHTML = '';
  addRxRow();
}

function fillDoctorInfo() {
  const sel = document.getElementById('pDoctorId');
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('pSpecialist').value = opt.dataset.specialist || '';
  document.getElementById('pContact').value = opt.dataset.contact || '';
}

function addRxRow(prefill = {}) {
  const container = document.getElementById('rxContainer');
  const row = document.createElement('div');
  row.className = 'rx-row';
  row.innerHTML = `
    <div class="rx-col rx-col-name">
      <label>Medicine Name *</label>
      <select class="form-control rx-med-select" onchange="onMedicineSelect(this)">
        <option value="">-- Select Medicine --</option>
        ${allMedicines.map(m => `<option value="${m.id}" data-type="${m.type}" data-dose="${m.default_dose||''}">${m.name}</option>`).join('')}
        <option value="__custom__">✏️ Custom</option>
      </select>
      <input type="text" class="form-control rx-name" style="display:none;margin-top:4px" placeholder="Type medicine name...">
    </div>
    <div class="rx-col rx-col-type">
      <label>Type</label>
      <input type="text" class="form-control rx-type" placeholder="e.g. Tablet">
    </div>
    <div class="rx-col rx-col-qty">
      <label>Qty</label>
      <input type="text" class="form-control rx-qty" placeholder="e.g. 10">
    </div>
    <div class="rx-col rx-col-dose">
      <label>Dose</label>
      <input type="text" class="form-control rx-dose" placeholder="e.g. 500mg 3x/day">
    </div>
    <button type="button" class="rx-remove" onclick="this.closest('.rx-row').remove()" title="Remove">✕</button>`;
  container.appendChild(row);

  if (prefill.medicine_id) {
    const s = row.querySelector('.rx-med-select');
    s.value = String(prefill.medicine_id);
    row.querySelector('.rx-type').value = prefill.type_medicine || '';
    row.querySelector('.rx-dose').value = prefill.dose || '';
    row.querySelector('.rx-qty').value = prefill.quantity || '';
  } else if (prefill.name_medicine) {
    row.querySelector('.rx-med-select').value = '__custom__';
    const ni = row.querySelector('.rx-name');
    ni.style.display = 'block';
    ni.value = prefill.name_medicine;
    row.querySelector('.rx-type').value = prefill.type_medicine || '';
    row.querySelector('.rx-dose').value = prefill.dose || '';
    row.querySelector('.rx-qty').value = prefill.quantity || '';
  }
}

function onMedicineSelect(sel) {
  const row = sel.closest('.rx-row');
  const nameInput = row.querySelector('.rx-name');
  if (sel.value === '__custom__') {
    nameInput.style.display = 'block';
    nameInput.focus();
    row.querySelector('.rx-type').value = '';
    row.querySelector('.rx-dose').value = '';
  } else if (sel.value) {
    nameInput.style.display = 'none';
    const opt = sel.options[sel.selectedIndex];
    row.querySelector('.rx-type').value = opt.dataset.type || '';
    row.querySelector('.rx-dose').value = opt.dataset.dose || '';
  } else {
    nameInput.style.display = 'none';
  }
}

function clearPrescriptionForm() {
  ['pPatientName','pAge','pBP','pSH','pWT','pCC','pSpecialist','pContact'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const ds = document.getElementById('pDoctorId'); if (ds) ds.value = '';
  const gs = document.getElementById('pGender'); if (gs) gs.value = '';
  document.getElementById('rxContainer').innerHTML = '';
  addRxRow();
  editingPrescriptionId = null;
}

async function savePrescription(printAfter = false) {
  const doctorSel = document.getElementById('pDoctorId');
  const doctorId = doctorSel.value;
  const doctorName = doctorSel.options[doctorSel.selectedIndex]?.text || '';
  const specialist = document.getElementById('pSpecialist').value;
  const contact = document.getElementById('pContact').value;
  const patientName = document.getElementById('pPatientName').value.trim();
  const age = document.getElementById('pAge').value.trim();
  const gender = document.getElementById('pGender').value;
  if (!patientName || !age || !gender || !doctorId) { showToast('Please fill all required fields (*)', 'error'); return; }

  const medicines = [];
  document.querySelectorAll('.rx-row').forEach(row => {
    const sel = row.querySelector('.rx-med-select');
    let medName = '', medType = '', medId = null;
    if (sel.value === '__custom__') {
      medName = row.querySelector('.rx-name').value.trim();
      medType = row.querySelector('.rx-type').value.trim();
    } else if (sel.value) {
      medName = sel.options[sel.selectedIndex].text;
      medType = row.querySelector('.rx-type').value.trim();
      medId = parseInt(sel.value);
    }
    const qty = row.querySelector('.rx-qty').value.trim();
    const dose = row.querySelector('.rx-dose').value.trim();
    if (medName) medicines.push({ medicine_id: medId, type_medicine: medType, name_medicine: medName, quantity: qty, dose });
  });

  const payload = { doctor_id: doctorId, doctor_name: doctorName === '-- Select Doctor --' ? '' : doctorName, specialist_in: specialist, contact, patient_name: patientName, age, gender, bp: document.getElementById('pBP').value, sh: document.getElementById('pSH').value, wt: document.getElementById('pWT').value, cc: document.getElementById('pCC').value, medicines };

  // Capture ID NOW before any async/confirm delay
  const capturedEditId = editingPrescriptionId;
  const confirmMsg = capturedEditId ? 'Update this prescription?' : 'Save this prescription?';

  // Show Save & Print vs Save Only dialog
  showSavePrintDialog(async (shouldPrint) => {
    const url = capturedEditId ? `/api/prescriptions/${capturedEditId}` : '/api/prescriptions';
    const method = capturedEditId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.success || data.id) {
      const pid = capturedEditId || data.id;
      showToast(capturedEditId ? 'Prescription updated!' : 'Prescription saved!', 'success');
      clearPrescriptionForm();
      if (shouldPrint) {
        window.open(`/api/prescriptions/${pid}/view?print=1`, '_blank');
      }
    } else showToast(data.error || 'Failed to save', 'error');
  });
}

// ============== REPORTS ==============
async function loadReports() {
  const search = document.getElementById('reportSearch').value;
  const doctor = document.getElementById('reportDoctor').value;
  const from = document.getElementById('reportFrom').value;
  const to = document.getElementById('reportTo').value;
  const params = new URLSearchParams({ search, doctor, from, to, sort: reportSortField, order: reportSortOrder });
  const res = await fetch(`/api/prescriptions?${params}`);
  const data = await res.json();

  const docFilter = document.getElementById('reportDoctor');
  if (docFilter.options.length <= 1) {
    const dRes = await fetch('/api/doctors');
    const docs = await dRes.json();
    docs.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.doctor; docFilter.appendChild(o); });
  }

  document.getElementById('reportsBody').innerHTML = data.length ? data.map(p => `
    <tr>
      <td><input type="checkbox" class="rep-check" value="${p.rescription_id}" onchange="updateDeleteReportsBtn()"></td>
      <td><strong>#${p.rescription_id}</strong></td>
      <td>${p.patient_name}</td>
      <td>${p.doctor_name}</td>
      <td>${p.specialist_in}</td>
      <td>${new Date(p.created_at).toLocaleDateString('en-GB')}</td>
      <td><div class="action-btns">
        <button class="btn btn-primary btn-sm" onclick="viewPrescription(${p.rescription_id})">👁</button>
        <button class="btn btn-success btn-sm" onclick="window.open('/api/prescriptions/${p.rescription_id}/view','_blank')">📄</button>
        <button class="btn btn-secondary btn-sm" onclick="editPrescription(${p.rescription_id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deletePrescription(${p.rescription_id})">🗑</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px">No records found</td></tr>';
}

function sortReports(field) {
  if (reportSortField === field) reportSortOrder = reportSortOrder === 'ASC' ? 'DESC' : 'ASC';
  else { reportSortField = field; reportSortOrder = 'DESC'; }
  loadReports();
}

function clearReportFilters() {
  ['reportSearch','reportFrom','reportTo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('reportDoctor').value = '';
  loadReports();
}

function exportCSV() { window.location.href = '/api/prescriptions/export/csv'; }
function toggleAllReports(cb) { document.querySelectorAll('.rep-check').forEach(c => c.checked = cb.checked); updateDeleteReportsBtn(); }
function updateDeleteReportsBtn() { document.getElementById('btnDeletePrescriptions').disabled = document.querySelectorAll('.rep-check:checked').length === 0; }

function deletePrescription(id) {
  confirm2('Delete this prescription?', async () => {
    await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
    loadReports(); showToast('Deleted!', 'success');
  });
}

async function deleteSelectedPrescriptions() {
  const ids = [...document.querySelectorAll('.rep-check:checked')].map(c => parseInt(c.value));
  confirm2(`Delete ${ids.length} prescription(s)?`, async () => {
    await fetch('/api/prescriptions/delete-multiple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    loadReports(); showToast('Deleted!', 'success');
  });
}

async function viewPrescription(id) {
  const res = await fetch(`/api/prescriptions/${id}`);
  const p = await res.json();
  document.getElementById('modalTitle').textContent = `Prescription #${id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.9rem">
      <div><strong>Patient:</strong> ${p.patient_name}</div><div><strong>Age:</strong> ${p.age}</div>
      <div><strong>Gender:</strong> ${p.gender}</div><div><strong>Doctor:</strong> ${p.doctor_name}</div>
      <div><strong>Specialist:</strong> ${p.specialist_in}</div><div><strong>Contact:</strong> ${p.contact}</div>
      <div><strong>BP:</strong> ${p.bp||'-'}</div><div><strong>SH:</strong> ${p.sh||'-'}</div>
      <div><strong>WT:</strong> ${p.wt||'-'}</div><div style="grid-column:1/-1"><strong>CC:</strong> ${p.cc||'-'}</div>
    </div>
    <hr style="margin:12px 0">
    <strong>Rx:</strong>
    <table class="data-table" style="margin-top:8px">
      <thead><tr><th>Type</th><th>Name</th><th>Qty</th><th>Dose</th></tr></thead>
      <tbody>${p.medicines?.length ? p.medicines.map(m => `<tr><td>${m.type_medicine}</td><td>${m.name_medicine}</td><td>${m.quantity}</td><td>${m.dose}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center">No medicines</td></tr>'}</tbody>
    </table>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeAllModals()">Close</button>
    <button class="btn btn-success" onclick="window.open('/api/prescriptions/${id}/view','_blank')">📄 Download PDF</button>`;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

async function editPrescription(id) {
  const res = await fetch(`/api/prescriptions/${id}`);
  const p = await res.json();

  // Set ID first, THEN navigate (showPage checks this value)
  editingPrescriptionId = id;
  showPage('prescriptions');

  // Load doctors dropdown (keepEditId=true so ID stays intact)
  await initPrescriptionForm(true);

  // Fill form fields
  document.getElementById('pDoctorId').value = p.doctor_id || '';
  document.getElementById('pSpecialist').value = p.specialist_in || '';
  document.getElementById('pContact').value = p.contact || '';
  document.getElementById('pPatientName').value = p.patient_name || '';
  document.getElementById('pAge').value = p.age || '';
  document.getElementById('pGender').value = p.gender || '';
  document.getElementById('pBP').value = p.bp || '';
  document.getElementById('pSH').value = p.sh || '';
  document.getElementById('pWT').value = p.wt || '';
  document.getElementById('pCC').value = p.cc || '';

  // Fill Rx rows
  document.getElementById('rxContainer').innerHTML = '';
  if (p.medicines && p.medicines.length) { p.medicines.forEach(m => addRxRow(m)); }
  else addRxRow();

  // Scroll to top of prescription form
  document.getElementById('pagePrescriptions').scrollIntoView({ behavior: 'smooth' });
}

// ============== SETTINGS ==============
async function loadSettings() {
  const res = await fetch('/api/settings');
  const settings = await res.json();
  document.getElementById('settingLoginMode').value = settings.always_require_login || 'false';
  if (currentUser.position === 'admin') loadUsers();
}

async function saveLoginSettings() {
  confirm2('Save login settings?', async () => {
    const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ always_require_login: document.getElementById('settingLoginMode').value }) });
    if ((await res.json()).success) showToast('Settings saved!', 'success');
  });
}

function downloadBackup() {
  confirm2('Download database backup?', () => window.location.href = '/api/settings/backup');
}

async function restoreBackup() {
  const file = document.getElementById('restoreFile').files[0];
  if (!file) { showToast('Please select a backup file', 'error'); return; }
  confirm2('⚠️ This will REPLACE the current database! Are you sure?', async () => {
    const fd = new FormData(); fd.append('dbfile', file);
    const res = await fetch('/api/settings/restore', { method: 'POST', body: fd });
    const data = await res.json();
    showToast(data.success ? 'Database restored!' : (data.error || 'Failed'), data.success ? 'success' : 'error');
  });
}

// ============== USERS ==============
async function loadUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  document.getElementById('usersBody').innerHTML = users.map(u => `
    <tr>
      <td>${u.user_id}</td>
      <td><strong>${u.username}</strong></td>
      <td><span class="badge badge-${u.position}">${u.position}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString('en-GB')}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteUser(${u.user_id},'${u.username}')" ${u.user_id===currentUser.user_id?'disabled':''}>🗑</button></td>
    </tr>`).join('');
}

function openUserModal() {
  document.getElementById('modalTitle').textContent = 'Add New User';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Username *</label><input type="text" id="mUsername" class="form-control"></div>
    <div class="form-group"><label>Password *</label><input type="password" id="mPassword" class="form-control"></div>
    <div class="form-group"><label>Position</label>
      <select id="mPosition" class="form-control"><option value="user">User</option><option value="admin">Admin</option></select>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeAllModals()">Cancel</button>
    <button class="btn btn-primary" onclick="createUser()">💾 Create</button>`;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

async function createUser() {
  const username = document.getElementById('mUsername').value.trim();
  const password = document.getElementById('mPassword').value;
  const position = document.getElementById('mPosition').value;
  if (!username || !password) { showToast('All fields required', 'error'); return; }
  confirm2(`Create user "${username}"?`, async () => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, position }) });
    const data = await res.json();
    if (data.success) { closeAllModals(); loadUsers(); showToast('User created!', 'success'); }
    else showToast(data.error || 'Failed', 'error');
  });
}

async function deleteUser(id, username) {
  confirm2(`Delete user "${username}"?`, async () => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    loadUsers(); showToast('User deleted!', 'success');
  });
}

async function changeMyPassword() {
  const current = document.getElementById('currentPassword').value;
  const newP = document.getElementById('newPassword').value;
  const conf = document.getElementById('confirmPassword').value;
  if (!newP || newP !== conf) { showToast('Passwords do not match', 'error'); return; }
  confirm2('Update your password?', async () => {
    const res = await fetch(`/api/users/${currentUser.user_id}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: current, new_password: newP }) });
    const data = await res.json();
    if (data.success) { showToast('Password updated!', 'success'); ['currentPassword','newPassword','confirmPassword'].forEach(id => document.getElementById(id).value = ''); }
    else showToast(data.error || 'Failed', 'error');
  });
}

async function changeMyUsername() {
  const newUsername = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('currentPasswordForUsername').value;
  if (!newUsername) { showToast('Enter new username', 'error'); return; }
  confirm2(`Change username to "${newUsername}"?`, async () => {
    const res = await fetch(`/api/users/${currentUser.user_id}/username`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_username: newUsername, password }) });
    const data = await res.json();
    if (data.success) { currentUser.username = newUsername; document.getElementById('sidebarUser').textContent = `👤 ${newUsername}`; showToast('Username updated!', 'success'); }
    else showToast(data.error || 'Failed', 'error');
  });
}

// ============== MODALS ==============
function closeModal(e) { if (e.target === document.getElementById('modalOverlay')) closeAllModals(); }
function closeAllModals() { document.getElementById('modalOverlay').classList.add('hidden'); }
function confirm2(message, callback, confirmText='Confirm', cancelText='Cancel') {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmBtn').textContent = confirmText;
  document.querySelectorAll('#confirmOverlay .btn-secondary')[0].textContent = cancelText;
  confirmCallback = callback;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}
function confirmAction() { closeConfirm(); if (confirmCallback) { confirmCallback(); confirmCallback = null; } }
function closeConfirm() { document.getElementById('confirmOverlay').classList.add('hidden'); }

function showSavePrintDialog(callback) {
  document.getElementById('savePrintOverlay').classList.remove('hidden');
  document.getElementById('btnSaveAndPrint').onclick = () => {
    document.getElementById('savePrintOverlay').classList.add('hidden');
    callback(true);
  };
  document.getElementById('btnSaveOnly').onclick = () => {
    document.getElementById('savePrintOverlay').classList.add('hidden');
    callback(false);
  };
  document.getElementById('btnSavePrintCancel').onclick = () => {
    document.getElementById('savePrintOverlay').classList.add('hidden');
  };
}

// ============== TOAST ==============
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}
