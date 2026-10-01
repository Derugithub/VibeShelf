import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

import { analyzeRgba, fillRgba, type VibeId } from './analyze';
import { decodeJpeg } from './decode';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js') as {
  encode: (image: { data: Uint8Array; width: number; height: number }, quality?: number) => { data: Buffer };
  decode: (data: Uint8Array, opts: { useTArray: true; formatAsRGBA: true }) => { data: Uint8Array; width: number; height: number };
};

function solid(r: number, g: number, b: number) {
  return analyzeRgba(fillRgba(24, 24, { r, g, b }), 24, 24);
}

function has(tags: VibeId[], id: VibeId) {
  assert.ok(tags.includes(id), `expected ${id} in ${tags.join(', ')}`);
}

test('warm golden light', () => {
  const result = solid(230, 140, 60);
  has(result.tags, 'warm');
  has(result.tags, 'golden');
  assert.ok(result.colors[0]);
  assert.ok(result.brightness > 0.4 && result.brightness < 0.75);
});

test('night', () => {
  const result = solid(12, 16, 32);
  has(result.tags, 'night');
  has(result.tags, 'cool');
});

test('moody mid shadow', () => {
  const result = solid(62, 58, 70);
  has(result.tags, 'moody');
});

test('pastel pink', () => {
  const result = solid(244, 214, 222);
  has(result.tags, 'pastel');
  has(result.tags, 'bright');
  assert.equal(result.tags.includes('muted'), false);
});

test('washed light color is pastel, not muted', () => {
  const result = solid(240, 230, 228);
  assert.equal(result.tags.includes('muted'), false);
  assert.ok(result.tags.includes('pastel') || result.tags.includes('bright'));
});

test('vivid warm', () => {
  const result = solid(214, 36, 48);
  has(result.tags, 'vivid');
  has(result.tags, 'warm');
});

test('muted gray', () => {
  const result = solid(150, 148, 146);
  has(result.tags, 'muted');
  assert.equal(result.tags.includes('vivid'), false);
});

test('airy cool', () => {
  const result = solid(214, 230, 238);
  has(result.tags, 'cool');
  has(result.tags, 'airy');
});

test('jpeg round trip keeps the warm tag', () => {
  const width = 32;
  const height = 32;
  const data = fillRgba(width, height, { r: 230, g: 140, b: 60 });
  const encoded = jpeg.encode({ data, width, height }, 80);
  const decoded = decodeJpeg(new Uint8Array(encoded.data));
  const result = analyzeRgba(decoded.data, decoded.width, decoded.height);
  has(result.tags, 'warm');
  has(result.tags, 'golden');
});

test('sample photos carry distinct vibes', () => {
  const expected: Record<string, VibeId> = {
    'golden-hour.jpg': 'golden',
    'tidepool.jpg': 'cool',
    'night-window.jpg': 'night',
    'pastel-room.jpg': 'pastel',
    'market-day.jpg': 'vivid',
    'fog-linen.jpg': 'muted',
  };
  const dir = path.join(process.cwd(), 'assets', 'samples');
  for (const [file, tag] of Object.entries(expected)) {
    const bytes = fs.readFileSync(path.join(dir, file));
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    const result = analyzeRgba(decoded.data, decoded.width, decoded.height);
    has(result.tags, tag);
  }
});
