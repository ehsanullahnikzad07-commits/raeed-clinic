# 🏥 Raeed OPD Clinic - Prescription Management System
## کلینیک سراپا رائید

---

## ✅ Requirements (پیش نیاز ها)

- **Node.js** v16 or higher → https://nodejs.org

---

## 🚀 How to Run (چگونه اجرا کنیم)

### Step 1 — Extract the ZIP file

### Step 2 — Open CMD inside the `raeed-clinic` folder:
```
cd raeed-clinic
```

### Step 3 — Install dependencies:
```
npm install
```

### Step 4 — Start the app:
```
node app.js
```

### Step 5 — Open browser:
```
http://localhost:3000
```

---

## 🔐 Default Login

| Username | Password |
|----------|----------|
| admin    | admin123 |

> ⚠️ Please change the password after first login from Settings > Change My Credentials

---

## 🖼️ How to Add the Clinic Logo

To display the clinic logo in the app and on PDF prescriptions:

1. Prepare your logo image in **PNG format**
2. Rename the file to exactly: `logo.png`
3. Place it in this folder:

```
raeed-clinic\public\images\logo.png
```

**Full path example:**
```
C:\Users\YourName\Desktop\raeed-clinic\public\images\logo.png
```

> ✅ After adding the logo, restart the app with `node app.js` and refresh the browser.
> If no logo is found, the clinic name text will be displayed instead.

---

## 📁 Project Structure

```
raeed-clinic/
├── app.js                    ← Main server
├── database.js               ← Database setup
├── persian-helper.js         ← Persian text for PDF
├── package.json              ← Dependencies
├── routes/
│   ├── auth.js               ← Login/Logout
│   ├── doctors.js            ← Doctor management
│   ├── prescriptions.js      ← Prescriptions + PDF
│   ├── medicines.js          ← Medicines management
│   ├── dashboard.js          ← Statistics
│   ├── settings.js           ← Backup/Restore
│   └── users.js              ← User management
├── public/
│   ├── index.html            ← Main HTML
│   ├── css/style.css         ← Styles
│   ├── js/app.js             ← Frontend logic
│   ├── fonts/                ← Persian-support fonts
│   └── images/
│       └── logo.png          ← ⭐ Place your logo here!
└── database/                 ← SQLite database (auto-created)
```

---

## 📖 Features

- ✅ Login with Admin/User roles
- ✅ Dashboard with statistics and monthly chart
- ✅ Doctor registration (CRUD)
- ✅ Medicines database with auto-fill in prescriptions
- ✅ Prescription management with smart doctor & medicine auto-fill
- ✅ PDF generation (A4 format) with Persian text support
- ✅ Reports with Search, Filter, Sort
- ✅ Export to CSV
- ✅ Backup & Restore database
- ✅ User management (Admin only)
- ✅ Confirmation dialogs for all actions

---

## 🔧 Troubleshooting

**Port in use?**
```
set PORT=3001 && node app.js
```

**npm install fails with Build Tools error?**
Run this command:
```
npm install --ignore-scripts
```

---

## 👨‍💻 Developer Info

**Developer:** Ehsanullah Nikzad  
**Contact / WhatsApp:** 0708794358
