import { decode } from 'jpeg-js';

export function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
  const binary = globalThis.atob(clean);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function decodeJpeg(bytes: Uint8Array): { width: number; height: number; data: Uint8Array } {
  const decoded = decode(bytes, {
    useTArray: true,
    formatAsRGBA: true,
    tolerantDecoding: true,
  });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
  };
}
