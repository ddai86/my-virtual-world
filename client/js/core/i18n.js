// My Virtual World — Copyright (c) 2026 My Virtual World. Licensed under the PolyForm Noncommercial License 1.0.0 (see LICENSE).
// The interface's language. The code writes its text in English; in another language each text node and title /
// placeholder / aria-label under the watched root is swapped for its translation as it appears (the same way
// core/icons.js swaps emoji), so no module needs to change. Vietnamese is the default; English is the original.
// A language is one dictionary file in client/js/i18n/<code>.js: { "English text": "translation" } plus PATTERNS for
// text with numbers or names in it. Text with no entry stays English.
// shortcut: exact-text lookup misses text a template builds around a ${value} (unless a pattern covers it) and text
// drawn on canvases (3D signs, labels); upgrade to t() calls in those modules when it matters.

/** [code, name in its own language] — the Settings → Display picker. Add a language: a row here and its dictionary. */
export const LANGS = [
  ['vi', 'Tiếng Việt'], ['en', 'English'], ['zh', '中文（简体）'], ['zh-TW', '中文（繁體）'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย'],
  ['fr', 'Français'], ['ru', 'Русский'], ['de', 'Deutsch'], ['es', 'Español'], ['id', 'Bahasa Indonesia'],
  ['ms', 'Bahasa Melayu'], ['fil', 'Filipino'], ['km', 'ខ្មែរ'], ['lo', 'ລາວ'], ['my', 'မြန်မာ'],
];
export const DEFAULT_LANG = 'vi';
const KEY = 'mvw.lang';

export function currentLang() {
  try { const v = localStorage.getItem(KEY); if (LANGS.some(([c]) => c === v)) return v; } catch { /* private mode */ }
  return DEFAULT_LANG;
}

let dict = null, patterns = [];
const done = new Set();   // translations already put in, so a translated text is never looked up again
const ATTRS = ['title', 'placeholder', 'aria-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'KBD']);
// a leading emoji / symbol and a trailing colon, ellipsis or arrow stay as they are around the looked-up words
const SPLIT = /^([^\p{L}\p{N}]*)(.*?)([\s:…›»→.]*)$/su;

/** The translation of one piece of interface text, or null when the dictionary has none. */
export function translate(text, d = dict, pats = patterns) {
  if (!d || !text) return null;
  const core = text.trim();
  if (!core || done.has(core)) return null;
  if (d[core] !== undefined) return text.replace(core, () => d[core]);
  const m = SPLIT.exec(core);
  if (m && m[2]) {
    const hit = d[m[2] + m[3]] !== undefined ? d[m[2] + m[3]] : d[m[2]] !== undefined ? d[m[2]] + m[3] : undefined;
    if (hit !== undefined) return text.replace(core, () => m[1] + hit);
  }
  for (const [re, to] of pats) if (re.test(core)) return text.replace(core, () => core.replace(re, to));
  return null;
}

const skipped = el => !el || SKIP.has(el.nodeName) || el.isContentEditable || el.closest?.('[translate="no"], .no-i18n');

function swapText(node) {
  if (skipped(node.parentElement)) return;
  const to = translate(node.nodeValue);
  if (to !== null && to !== node.nodeValue) { done.add(to.trim()); node.nodeValue = to; }
}
function swapAttrs(el) {
  if (skipped(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    const to = v && translate(v);
    if (to !== null && to !== undefined && to !== v) { done.add(to.trim()); el.setAttribute(a, to); }
  }
}
function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) return swapText(root);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  swapAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) (n.nodeType === Node.TEXT_NODE ? swapText : swapAttrs)(n);
}

/** Loads the language's dictionary and keeps everything under root translated from then on. */
export async function watchI18n(root = document.body) {
  const lang = currentLang();
  document.documentElement.lang = lang;
  if (lang === 'en') return null;
  try {
    const mod = await import(`../i18n/${lang}.js`);
    dict = mod.default; patterns = mod.PATTERNS || [];
  } catch (err) { console.warn('[i18n] no dictionary for', lang, err.message); return null; }
  if (dict['My Virtual World']) document.title = dict['My Virtual World'];
  walk(root);
  const mo = new MutationObserver(list => {
    for (const r of list) {
      if (r.type === 'characterData') swapText(r.target);
      else if (r.type === 'attributes') swapAttrs(r.target);
      else for (const x of r.addedNodes) walk(x);
    }
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return mo;
}

/** Settings → Display: a new language takes effect on a fresh page, like graphics quality. */
export function setLang(code) {
  try { if (code === DEFAULT_LANG) localStorage.removeItem(KEY); else localStorage.setItem(KEY, code); } catch { /* private mode */ }
}
