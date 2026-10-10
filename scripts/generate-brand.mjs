import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function hex(value) {
  return [Number.parseInt(value.slice(1, 3), 16), Number.parseInt(value.slice(3, 5), 16), Number.parseInt(value.slice(5, 7), 16)];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function paint(width, height, shader) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = shader(x, y, width, height);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return data;
}

const samples = {
  'golden-hour.jpg': (x, y, w, h) => {
    let color = mix(hex('#F8D7A4'), hex('#D85A32'), y / h);
    const dx = x - w * 0.68;
    const dy = y - h * 0.3;
    const radius = w * 0.28;
    const distance = Math.hypot(dx, dy);
    if (distance < radius) color = mix(color, hex('#FFF1D0'), (1 - distance / radius) * 0.9);
    return color;
  },
  'tidepool.jpg': (x, y, w, h) => {
    const t = y / h;
    let color = mix(hex('#1F8F98'), hex('#D7F4EF'), t * 0.85);
    const dx = x - w * 0.35;
    const dy = y - h * 0.42;
    if (Math.hypot(dx, dy) < w * 0.22) color = mix(color, hex('#7ED0E0'), 0.55);
    return color;
  },
  'night-window.jpg': (x, y, w, h) => {
    let color = mix(hex('#07080E'), hex('#141824'), y / h);
    const inside = x > w * 0.58 && x < w * 0.86 && y > h * 0.18 && y < h * 0.42;
    if (inside) color = hex('#E7B15A');
    return color;
  },
  'pastel-room.jpg': (x, y, w, h) => {
    let color = mix(hex('#F8E7EE'), hex('#F3D5E4'), y / h);
    if (x > w * 0.12 && x < w * 0.48 && y > h * 0.2 && y < h * 0.72) color = hex('#F7D7E4');
    if (Math.hypot(x - w * 0.72, y - h * 0.38) < w * 0.16) color = hex('#E4EEF8');
    return color;
  },
  'market-day.jpg': (x, y, w, h) => {
    if (y < h * 0.46) return x < w * 0.55 ? hex('#E23B3B') : hex('#F2C14E');
    return x < w * 0.4 ? hex('#F08A2A') : hex('#C81E4A');
  },
  'fog-linen.jpg': (x, y, _w, h) => mix(hex('#C9C6C1'), hex('#8E8C89'), (x + y) / (h * 1.6)),
};

const sampleDir = path.join(root, 'assets', 'samples');
fs.mkdirSync(sampleDir, { recursive: true });
const width = 720;
const height = 960;
for (const [name, shader] of Object.entries(samples)) {
  const data = paint(width, height, shader);
  const encoded = jpeg.encode({ data, width, height }, 78);
  fs.writeFileSync(path.join(sampleDir, name), encoded.data);
}

console.log('Wrote sample photos');
