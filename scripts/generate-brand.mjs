import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = crcTable[(c ^ buffer[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * (width * 4 + 1);
    raw[start] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(raw, start + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function blend(pixels, index, r, g, b, alpha) {
  if (alpha <= 0) return;
  if (alpha >= 1) {
    pixels[index] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = 255;
    return;
  }
  const dstA = pixels[index + 3] / 255;
  const outA = alpha + dstA * (1 - alpha);
  if (outA <= 0) return;
  pixels[index] = Math.round((r * alpha + pixels[index] * dstA * (1 - alpha)) / outA);
  pixels[index + 1] = Math.round((g * alpha + pixels[index + 1] * dstA * (1 - alpha)) / outA);
  pixels[index + 2] = Math.round((b * alpha + pixels[index + 2] * dstA * (1 - alpha)) / outA);
  pixels[index + 3] = Math.round(outA * 255);
}

function sdRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - halfW + radius;
  const dy = Math.abs(py - cy) - halfH + radius;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - radius;
}

function fillRoundRect(pixels, width, height, x, y, w, h, radius, color, erase = false) {
  const [r, g, b, a] = color;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(radius, hw, hh);
  const minX = Math.max(0, Math.floor(x - 1));
  const maxX = Math.min(width - 1, Math.ceil(x + w + 1));
  const minY = Math.max(0, Math.floor(y - 1));
  const maxY = Math.min(height - 1, Math.ceil(y + h + 1));
  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const coverage = Math.max(0, Math.min(1, 0.5 - sdRoundRect(px + 0.5, py + 0.5, cx, cy, hw, hh, rad)));
      if (coverage <= 0) continue;
      const index = (py * width + px) * 4;
      if (erase) pixels[index + 3] = Math.round(pixels[index + 3] * (1 - a * coverage));
      else blend(pixels, index, r, g, b, a * coverage);
    }
  }
}

function fillCircle(pixels, width, height, cx, cy, radius, color) {
  const [r, g, b, a] = color;
  const minX = Math.max(0, Math.floor(cx - radius - 1));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius + 1));
  const minY = Math.max(0, Math.floor(cy - radius - 1));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius + 1));
  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const coverage = Math.max(0, Math.min(1, radius - Math.hypot(px + 0.5 - cx, py + 0.5 - cy) + 0.5));
      if (coverage <= 0) continue;
      blend(pixels, (py * width + px) * 4, r, g, b, a * coverage);
    }
  }
}

function canvas(size, background) {
  const pixels = new Uint8Array(size * size * 4);
  if (background) {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = background[0];
      pixels[i + 1] = background[1];
      pixels[i + 2] = background[2];
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const PLATE = [201, 184, 255, 1];
const INK = [22, 20, 28, 1];
const WARM = [240, 180, 138, 1];
const COOL = [143, 212, 196, 1];
const MINT = [158, 230, 200, 1];
const WHITE = [255, 255, 255, 1];

function drawMark(pixels, size, { mono = false } = {}) {
  const plate = mono ? WHITE : PLATE;
  const x = size * 0.2;
  const y = size * 0.2;
  const w = size * 0.6;
  fillRoundRect(pixels, size, size, x, y, w, w, w * 0.22, plate);
  const cardX = size * 0.3;
  const cardY = size * 0.3;
  const cardW = size * 0.4;
  const cardH = size * 0.24;
  if (mono) {
    fillRoundRect(pixels, size, size, cardX, cardY, cardW, cardH, size * 0.04, [0, 0, 0, 1], true);
    fillRoundRect(pixels, size, size, cardX, size * 0.6, cardW, size * 0.035, size * 0.02, [0, 0, 0, 1], true);
    return;
  }
  fillRoundRect(pixels, size, size, cardX, cardY, cardW, cardH, size * 0.045, INK);
  const pad = size * 0.018;
  fillRoundRect(pixels, size, size, cardX + pad, cardY + pad, cardW * 0.46, cardH - pad * 2, size * 0.03, WARM);
  fillRoundRect(
    pixels,
    size,
    size,
    cardX + cardW * 0.5,
    cardY + pad,
    cardW * 0.46,
    cardH - pad * 2,
    size * 0.03,
    COOL,
  );
  fillRoundRect(pixels, size, size, cardX, size * 0.59, cardW, size * 0.04, size * 0.02, INK);
  fillCircle(pixels, size, size, size * 0.68, size * 0.7, size * 0.045, MINT);
}

function writePng(relativePath, size, background, mark) {
  const pixels = canvas(size, background);
  if (mark) drawMark(pixels, size, mark);
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(size, size, pixels));
}

writePng('assets/images/icon.png', 1024, [9, 8, 13], {});
writePng('assets/images/favicon.png', 48, [9, 8, 13], {});
writePng('assets/images/splash-icon.png', 512, null, {});
writePng('assets/images/android-icon-foreground.png', 1024, null, {});
writePng('assets/images/android-icon-monochrome.png', 1024, null, { mono: true });
writePng('assets/images/android-icon-background.png', 1024, [9, 8, 13], null);

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

console.log('Wrote icons and sample photos');
