# 🏥 Raeed OPD Clinic — ساخت EXE Installer

## پیش‌نیازها
1. **Node.js** نسخه 18 یا بالاتر — https://nodejs.org
2. **Git** (اختیاری)

---

## مراحل ساخت EXE

### مرحله ۱ — کپی فایل‌ها
```
package-electron.json  →  package.json  (جایگزین کنید)
```

### مرحله ۲ — نصب dependencies
```cmd
cd raeed-clinic
npm install
```

### مرحله ۳ — ساخت EXE
```cmd
npm run build-win
```

### مرحله ۴ — نتیجه
فایل installer در پوشه `dist` ساخته می‌شود:
```
dist/
  Raeed OPD Clinic Setup 1.0.0.exe   ← این را نصب کنید
```

---

## اجرای مستقیم (بدون ساخت)
```cmd
npm run electron
```

---

## نکات مهم
- اولین بار ساخت چند دقیقه طول می‌کشد (دانلود Electron ~100MB)
- نیاز به اینترنت برای دانلود Electron دارد
- بعد از نصب، برنامه در Start Menu و Desktop shortcut می‌سازد
- داده‌ها در `C:\Users\[نام کاربر]\AppData\Roaming\RaeedOPDClinic\` ذخیره می‌شوند
- اگر اینترنت ندارید، electron را جداگانه دانلود کنید از:
  https://github.com/electron/electron/releases

---

## مشکلات رایج

### خطای "node-gyp" یا "build tools"
```cmd
npm install --ignore-scripts
```

### خطای "sqlite3"
```cmd
npm install sqlite3 --build-from-source
```
یا از نسخه pre-built استفاده کنید:
```cmd
npm install sqlite3@5.1.6
```

---

Developer: Ehsanullah Nikzad | WhatsApp: 0708794358
