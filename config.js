// ══════════════════════════════════════════════════════
//  Raeed OPD Clinic — Configuration
//  Developer: Ehsanullah Nikzad | WhatsApp: 0708794358
// ══════════════════════════════════════════════════════

module.exports = {

  // ── SERVER ──────────────────────────────────────────
  PORT: process.env.PORT || 47291,

  // ── MODE ────────────────────────────────────────────
  // 'local'  → runs on localhost only (offline/private)
  // 'online' → runs on 0.0.0.0 (accessible over network/internet)
  MODE: process.env.MODE || 'local',

  // ── ONLINE SETTINGS (only used when MODE = 'online') ─
  // To go online:
  //   1. Change MODE to 'online'
  //   2. Set a strong SESSION_SECRET
  //   3. Configure your domain/IP in ALLOWED_ORIGINS
  //   4. Use a reverse proxy (nginx) with HTTPS
  SESSION_SECRET: process.env.SESSION_SECRET || 'raeed_clinic_secret_change_in_production',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:47291',

};
