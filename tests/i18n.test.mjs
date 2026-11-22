// My Virtual World — Copyright (c) 2026 My Virtual World. Licensed under the PolyForm Noncommercial License 1.0.0 (see LICENSE).
// The interface's language (client/js/core/i18n.js): a dictionary entry replaces its English text, a leading emoji and
// a trailing colon or ellipsis stay around it, patterns cover text with numbers in it, unknown text is left alone, and
// every language the picker offers is one the server accepts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { translate, LANGS, DEFAULT_LANG } from '../client/js/core/i18n.js';
import vi, { PATTERNS, CORE_KEYS } from '../client/js/i18n/vi.js';
import { SETTINGS } from '../server/settings.js';

const d = { Settings: 'Cài đặt', 'Loading the city': 'Đang tải thành phố', 'Build on your lot:': 'Xây trên lô đất của bạn:' };
const pats = [[/^Transparency: (\d+)%$/, 'Độ trong suốt: $1%']];

test('exact text, its whitespace kept', () => {
  assert.equal(translate('Settings', d, pats), 'Cài đặt');
  assert.equal(translate('  Settings ', d, pats), '  Cài đặt ');
});
test('a leading emoji and a trailing ellipsis or colon stay', () => {
  assert.equal(translate('⚙️ Settings', d, pats), '⚙️ Cài đặt');
  assert.equal(translate('Loading the city…', d, pats), 'Đang tải thành phố…');
  assert.equal(translate('Settings:', d, pats), 'Cài đặt:');
  assert.equal(translate('Build on your lot:', d, pats), 'Xây trên lô đất của bạn:');
});
test('patterns and unknown text', () => {
  assert.equal(translate('Transparency: 30%', d, pats), 'Độ trong suốt: 30%');
  assert.equal(translate('Hello Ann', d, pats), null);
  assert.equal(translate('', d, pats), null);
  assert.equal(translate('Settings', null, pats), null);
});
test('the Vietnamese dictionary: strings only, no empty translations, patterns compile', () => {
  for (const [k, v] of Object.entries(vi)) assert.ok(typeof v === 'string' && v.trim() && k.trim() === k, k);
  for (const [re, to] of PATTERNS) assert.ok(re instanceof RegExp && (typeof to === 'string' || typeof to === 'function'));
});
test('the picker\'s languages are the server\'s', () => {
  const row = SETTINGS.find(x => x.path === 'display.lang');
  assert.ok(row, 'display.lang is a setting');
  assert.deepEqual(row.values, LANGS.map(([c]) => c));
  assert.equal(row.default, DEFAULT_LANG);
});
test('every other language has a full dictionary and working patterns', async () => {
  for (const [code] of LANGS) {
    if (code === 'vi' || code === 'en') continue;
    const mod = await import(`../client/js/i18n/${code}.js`);
    const dict = mod.default;
    for (const k of CORE_KEYS) assert.ok(typeof dict[k] === 'string' && dict[k].trim(), `${code}: ${k}`);
    assert.equal(translate('Transparency: 30%', dict, mod.PATTERNS)?.includes('30'), true, `${code} pattern`);
    assert.match(translate('Mon · day 4 · paused', dict, mod.PATTERNS) ?? '', /4/, `${code} day pattern`);
  }
});
