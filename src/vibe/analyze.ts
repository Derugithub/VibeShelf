export const VIBE_IDS = [
  'golden',
  'warm',
  'cool',
  'pastel',
  'night',
  'moody',
  'bright',
  'airy',
  'vivid',
  'muted',
] as const;

export type VibeId = (typeof VIBE_IDS)[number];

export type VibeAnalysis = {
  tags: VibeId[];
  colors: string[];
  brightness: number;
  saturation: number;
};

const LABELS: Record<VibeId, string> = {
  golden: 'Golden',
  warm: 'Warm',
  cool: 'Cool',
  pastel: 'Pastel',
  night: 'Night',
  moody: 'Moody',
  bright: 'Bright',
  airy: 'Airy',
  vivid: 'Vivid',
  muted: 'Muted',
};

export function vibeLabel(id: VibeId): string {
  return LABELS[id];
}

export function isVibeId(value: string): value is VibeId {
  return (VIBE_IDS as readonly string[]).includes(value);
}

export function normalizeTags(tags: readonly VibeId[]): VibeId[] {
  const found = new Set(tags);
  if (found.has('pastel') || found.has('vivid')) found.delete('muted');
  const next = VIBE_IDS.filter((id) => found.has(id));
  return next.length ? next : ['muted'];
}

export function lightLabel(brightness: number): string {
  if (brightness < 0.28) return 'Dim light';
  if (brightness < 0.62) return 'Even light';
  return 'Bright light';
}

export function colorLabel(saturation: number): string {
  if (saturation < 0.08) return 'Soft color';
  if (saturation > 0.42) return 'Strong color';
  return 'Gentle color';
}

type Rgb = { r: number; g: number; b: number };

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function toHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorDistance(a: string, b: string): number {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b);
}

function circularMean(hues: number[]): number {
  if (hues.length === 0) return 0;
  let x = 0;
  let y = 0;
  for (const hue of hues) {
    const rad = (hue * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  }
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  return angle < 0 ? angle + 360 : angle;
}

const NAMED_COLORS: { hex: string; name: string }[] = [
  { hex: '#F7F4EF', name: 'Paper' },
  { hex: '#F4E7D4', name: 'Cream' },
  { hex: '#E7B48A', name: 'Sand' },
  { hex: '#F2C14E', name: 'Gold' },
  { hex: '#C46A3A', name: 'Ember' },
  { hex: '#D64545', name: 'Poppy' },
  { hex: '#E7A0B4', name: 'Blush' },
  { hex: '#C9B8FF', name: 'Lilac' },
  { hex: '#7D9AD4', name: 'Dusk' },
  { hex: '#8FD4C4', name: 'Mint' },
  { hex: '#1C6E78', name: 'Tide' },
  { hex: '#6E8A62', name: 'Sage' },
  { hex: '#8A8680', name: 'Stone' },
  { hex: '#2A2C33', name: 'Ink' },
];

export function nearestColorName(hex: string): string {
  let best = NAMED_COLORS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of NAMED_COLORS) {
    const distance = colorDistance(hex, entry.hex);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best.name;
}

/**
 * Local color and brightness heuristics. No model and no network.
 * `data` is tightly packed RGBA.
 */
export function analyzeRgba(data: Uint8Array, width: number, height: number): VibeAnalysis {
  const pixelCount = Math.max(0, Math.floor(data.length / 4));
  if (pixelCount === 0 || width <= 0 || height <= 0) {
    return { tags: ['muted'], colors: ['#8E8A96'], brightness: 0.5, saturation: 0 };
  }

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  let luminance = 0;
  let saturation = 0;
  let chroma = 0;
  let counted = 0;
  let warm = 0;
  let cool = 0;
  const hues: number[] = [];

  const step = pixelCount > 64 * 64 ? 2 : 1;
  for (let p = 0; p < pixelCount; p += step) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 20) continue;

    const hsl = rgbToHsl(r, g, b);
    luminance += hsl.l;
    saturation += hsl.s;
    chroma += (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    counted += 1;

    if (hsl.s > 0.12) {
      if (hsl.h < 55 || hsl.h >= 330) warm += 1;
      if (hsl.h >= 160 && hsl.h < 265) cool += 1;
      hues.push(hsl.h);
    }

    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${qr},${qg},${qb}`;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  if (counted === 0) {
    return { tags: ['muted'], colors: ['#8E8A96'], brightness: 0.5, saturation: 0 };
  }

  const brightness = luminance / counted;
  const meanSaturation = saturation / counted;
  const meanChroma = chroma / counted;
  const warmRatio = warm / counted;
  const coolRatio = cool / counted;
  const meanHue = circularMean(hues);

  const found = new Set<VibeId>();
  if (brightness < 0.22) found.add('night');
  else if (brightness < 0.38) found.add('moody');
  else if (brightness > 0.72) found.add('bright');

  if (meanChroma < 0.08) found.add('muted');
  else if (meanChroma > 0.42 && brightness > 0.16 && brightness < 0.86) found.add('vivid');

  if (brightness > 0.68 && meanChroma > 0.035 && meanChroma < 0.22) found.add('pastel');

  if (warmRatio > coolRatio && warmRatio > 0.28) found.add('warm');
  if (coolRatio > warmRatio && coolRatio > 0.28) found.add('cool');

  if (
    found.has('warm') &&
    brightness > 0.32 &&
    brightness < 0.78 &&
    meanSaturation > 0.22 &&
    meanSaturation < 0.86 &&
    meanHue > 18 &&
    meanHue < 58
  ) {
    found.add('golden');
  }

  if (brightness > 0.68 && coolRatio > 0.2 && meanSaturation < 0.42) found.add('airy');

  if (found.size === 0) found.add(brightness >= 0.5 ? 'bright' : 'moody');

  const tags = normalizeTags(VIBE_IDS.filter((id) => found.has(id))).slice(0, 4);

  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);
  const colors: string[] = [];
  for (const bucket of ranked) {
    const hex = toHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count);
    if (colors.every((existing) => colorDistance(existing, hex) > 32)) colors.push(hex);
    if (colors.length === 4) break;
  }
  if (colors.length === 0) colors.push('#8E8A96');

  return {
    tags,
    colors,
    brightness: round(brightness),
    saturation: round(meanChroma),
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function fillRgba(width: number, height: number, color: Rgb): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = 255;
  }
  return data;
}
