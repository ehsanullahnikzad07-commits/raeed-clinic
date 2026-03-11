/**
 * Complete Arabic/Persian Text Reshaper for PDFKit
 * Handles: letter shaping, ligatures, RTL ordering
 */

// ── Joining types ────────────────────────────────────────────────────────────
// D = dual joining (connects both sides)
// R = right joining (connects right only, no next connection)
// T = transparent (ignored for joining)
// C = causing (like ZWNJ)

const JOINING_TYPE = {};
// Right-joining only (non-connecting to next)
for (const c of '\u0622\u0623\u0624\u0625\u0626\u0627\u062F\u0630\u0631\u0632\u0648\u0671\u0672\u0673\u0675\u0676\u0677\u0688\u0689\u068A\u068B\u068C\u068D\u068E\u068F\u0690\u0692\u0693\u0694\u0695\u0696\u0697\u0699\u06C0\u06C3\u06C4\u06C5\u06C6\u06C7\u06C8\u06C9\u06CA\u06CB\u06CD\u06CF\u06D2\u06D3\u06EE\u06EF\u0621\u0629\u0649') {
  JOINING_TYPE[c] = 'R';
}
// Dual-joining (connects both sides)
for (const c of '\u0628\u062A\u062B\u062C\u062D\u062E\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06BE\u06C1\u06C2\u06D0\u06D1\u0750\u0751\u0752\u0753\u0754\u0755\u0756\u0757\u0758\u0762\u0763\u0764') {
  JOINING_TYPE[c] = 'D';
}

// ── Presentation forms ────────────────────────────────────────────────────────
// For each base char: [isolated, final, initial, medial]
const FORMS = {
  '\u0621': ['\uFE80'],
  '\u0622': ['\uFE81', '\uFE82'],
  '\u0623': ['\uFE83', '\uFE84'],
  '\u0624': ['\uFE85', '\uFE86'],
  '\u0625': ['\uFE87', '\uFE88'],
  '\u0626': ['\uFE89', '\uFE8A', '\uFE8B', '\uFE8C'],
  '\u0627': ['\uFE8D', '\uFE8E'],
  '\u0628': ['\uFE8F', '\uFE90', '\uFE91', '\uFE92'],
  '\u0629': ['\uFE93', '\uFE94'],
  '\u062A': ['\uFE95', '\uFE96', '\uFE97', '\uFE98'],
  '\u062B': ['\uFE99', '\uFE9A', '\uFE9B', '\uFE9C'],
  '\u062C': ['\uFE9D', '\uFE9E', '\uFE9F', '\uFEA0'],
  '\u062D': ['\uFEA1', '\uFEA2', '\uFEA3', '\uFEA4'],
  '\u062E': ['\uFEA5', '\uFEA6', '\uFEA7', '\uFEA8'],
  '\u062F': ['\uFEA9', '\uFEAA'],
  '\u0630': ['\uFEAB', '\uFEAC'],
  '\u0631': ['\uFEAD', '\uFEAE'],
  '\u0632': ['\uFEAF', '\uFEB0'],
  '\u0633': ['\uFEB1', '\uFEB2', '\uFEB3', '\uFEB4'],
  '\u0634': ['\uFEB5', '\uFEB6', '\uFEB7', '\uFEB8'],
  '\u0635': ['\uFEB9', '\uFEBA', '\uFEBB', '\uFEBC'],
  '\u0636': ['\uFEBD', '\uFEBE', '\uFEBF', '\uFEC0'],
  '\u0637': ['\uFEC1', '\uFEC2', '\uFEC3', '\uFEC4'],
  '\u0638': ['\uFEC5', '\uFEC6', '\uFEC7', '\uFEC8'],
  '\u0639': ['\uFEC9', '\uFECA', '\uFECB', '\uFECC'],
  '\u063A': ['\uFECD', '\uFECE', '\uFECF', '\uFED0'],
  '\u0641': ['\uFED1', '\uFED2', '\uFED3', '\uFED4'],
  '\u0642': ['\uFED5', '\uFED6', '\uFED7', '\uFED8'],
  '\u0643': ['\uFED9', '\uFEDA', '\uFEDB', '\uFEDC'],
  '\u0644': ['\uFEDD', '\uFEDE', '\uFEDF', '\uFEE0'],
  '\u0645': ['\uFEE1', '\uFEE2', '\uFEE3', '\uFEE4'],
  '\u0646': ['\uFEE5', '\uFEE6', '\uFEE7', '\uFEE8'],
  '\u0647': ['\uFEE9', '\uFEEA', '\uFEEB', '\uFEEC'],
  '\u0648': ['\uFEED', '\uFEEE'],
  '\u0649': ['\uFEEF', '\uFEF0'],
  '\u064A': ['\uFEF1', '\uFEF2', '\uFEF3', '\uFEF4'],
  // Persian specific
  '\u067E': ['\uFB56', '\uFB57', '\uFB58', '\uFB59'], // پ
  '\u0686': ['\uFB7A', '\uFB7B', '\uFB7C', '\uFB7D'], // چ
  '\u0698': ['\uFB8A', '\uFB8B'],                     // ژ
  '\u06A9': ['\uFB8E', '\uFB8F', '\uFB90', '\uFB91'], // ک
  '\u06AF': ['\uFB92', '\uFB93', '\uFB94', '\uFB95'], // گ
  '\u06CC': ['\uFBFC', '\uFBFD', '\uFBFE', '\uFBFF'], // ی
  '\u06C1': ['\uFBA6', '\uFBA7', '\uFBA8', '\uFBA9'], // ہ
  '\u06BE': ['\uFBAA', '\uFBAB', '\uFBAC', '\uFBAD'], // ھ
};

// Lam-Alef ligatures
const LAM_ALEF = {
  '\u0622': ['\uFEF5', '\uFEF6'],
  '\u0623': ['\uFEF7', '\uFEF8'],
  '\u0625': ['\uFEF9', '\uFEFA'],
  '\u0627': ['\uFEFB', '\uFEFC'],
};

function isArabicChar(ch) {
  const c = ch.charCodeAt(0);
  return (c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB50 && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF);
}

function isArabicLetter(ch) {
  return isArabicChar(ch) && JOINING_TYPE[ch] !== undefined;
}

function canConnectRight(ch) {
  return ch && isArabicLetter(ch); // can receive connection from left side
}

function canConnectLeft(ch) {
  return ch && JOINING_TYPE[ch] === 'D'; // dual-joining: can connect to next char
}

function getForm(ch, prevConnects, nextConnects) {
  const forms = FORMS[ch];
  if (!forms) return ch;
  if (prevConnects && nextConnects && forms[3]) return forms[3]; // medial
  if (prevConnects && forms[1]) return forms[1];                  // final
  if (nextConnects && forms[2]) return forms[2];                  // initial
  return forms[0];                                                 // isolated
}

function reshapeWord(word) {
  const chars = [...word];
  const result = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isArabicLetter(ch)) { result.push(ch); continue; }

    // Find previous letter (skip non-letters like diacritics)
    let prev = null;
    for (let j = i - 1; j >= 0; j--) {
      if (isArabicLetter(chars[j])) { prev = chars[j]; break; }
    }
    // Find next letter
    let next = null;
    for (let j = i + 1; j < chars.length; j++) {
      if (isArabicLetter(chars[j])) { next = chars[j]; break; }
    }

    const prevConn = canConnectLeft(prev);
    const nextConn = canConnectRight(next) && JOINING_TYPE[ch] === 'D';

    // Lam-Alef ligature
    if (ch === '\u0644' && next && LAM_ALEF[next]) {
      const ligForms = LAM_ALEF[next];
      result.push(prevConn ? ligForms[1] : ligForms[0]);
      // skip next char (alef consumed)
      i++;
      continue;
    }

    result.push(getForm(ch, prevConn, nextConn));
  }
  return result.join('');
}

function isRTL(ch) {
  const c = ch.charCodeAt(0);
  return (c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB00 && c <= 0xFEFF) || (c >= 0x0590 && c <= 0x05FF);
}

function preparePersian(text) {
  if (!text) return '';

  // Split text into RTL and LTR runs
  const runs = [];
  let cur = '';
  let curRTL = null;

  for (const ch of text) {
    const rtl = isRTL(ch);
    if (curRTL === null) curRTL = rtl;
    if (rtl === curRTL || ch === ' ' || ch === '/' || ch === '-' || ch === '|') {
      cur += ch;
    } else {
      runs.push({ text: cur, rtl: curRTL });
      cur = ch;
      curRTL = rtl;
    }
  }
  if (cur) runs.push({ text: cur, rtl: curRTL });

  // Reshape each RTL run word by word
  const processed = runs.map(run => {
    if (!run.rtl) return run.text;
    const words = run.text.split(' ');
    return words.map(w => reshapeWord(w)).reverse().join(' ');
  });

  // Reverse run order for RTL rendering
  return processed.reverse().join('');
}

module.exports = { preparePersian, isRTL };
