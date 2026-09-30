import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image, Platform } from 'react-native';

import { deletePhotoBytes, objectUrlFromBytes, putPhotoBytes } from '@/src/idbPhotos';
import { SAMPLES } from '@/src/samples';
import { createId, type Photo } from '@/src/types';
import { analyzeRgba } from '@/src/vibe/analyze';
import { base64ToBytes, decodeJpeg } from '@/src/vibe/decode';

const MAX_EDGE = 1800;

function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function readSize(uri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

async function saveJpeg(uri: string, resizeWidth?: number) {
  const context = ImageManipulator.manipulate(uri);
  if (resizeWidth) context.resize({ width: resizeWidth });
  const rendered = await context.renderAsync();
  return rendered.saveAsync({
    compress: 0.86,
    format: SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });
}

async function readVibe(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 48 });
  const rendered = await context.renderAsync();
  const thumb = await rendered.saveAsync({
    compress: 0.72,
    format: SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });
  const bytes = thumb.base64 ? base64ToBytes(thumb.base64) : await new File(thumb.uri).bytes();
  const decoded = decodeJpeg(bytes);
  return analyzeRgba(decoded.data, decoded.width, decoded.height);
}

export async function createPhotoFromUri(input: {
  uri: string;
  width?: number;
  height?: number;
  sampleKey?: string;
}): Promise<Photo> {
  const known = input.width ?? (await readSize(input.uri))?.width;
  const resizeWidth = known && known > MAX_EDGE ? MAX_EDGE : undefined;
  const saved = await saveJpeg(input.uri, resizeWidth);
  const vibe = await readVibe(saved.uri);
  const id = createId();
  if (Platform.OS === 'web') {
    const bytes = saved.base64 ? base64ToBytes(saved.base64) : new Uint8Array(await (await fetch(saved.uri)).arrayBuffer());
    await putPhotoBytes(id, bytes);
    return {
      id,
      uri: objectUrlFromBytes(bytes),
      width: saved.width,
      height: saved.height,
      createdAt: Date.now(),
      tags: vibe.tags,
      colors: vibe.colors,
      brightness: vibe.brightness,
      saturation: vibe.saturation,
      sampleKey: input.sampleKey,
    };
  }
  const dest = new File(photosDirectory(), `${id}.jpg`);
  new File(saved.uri).copySync(dest, { overwrite: true });
  return {
    id,
    uri: dest.uri,
    width: saved.width,
    height: saved.height,
    createdAt: Date.now(),
    tags: vibe.tags,
    colors: vibe.colors,
    brightness: vibe.brightness,
    saturation: vibe.saturation,
    sampleKey: input.sampleKey,
  };
}

export async function deletePhotoFile(uri: string, id?: string): Promise<void> {
  if (Platform.OS === 'web') {
    const key = uri.startsWith('idb:') ? uri.slice(4) : id;
    if (key) await deletePhotoBytes(key).catch(() => undefined);
    if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The shelf record is removed even if the file is already gone.
  }
}

export async function loadSampleInputs(): Promise<{ uri: string; sampleKey: string }[]> {
  const assets = SAMPLES.map((sample) => Asset.fromModule(sample.module));
  await Promise.all(assets.map((asset) => asset.downloadAsync()));
  return SAMPLES.map((sample, index) => ({
    sampleKey: sample.key,
    uri: assets[index].localUri ?? assets[index].uri,
  }));
}
