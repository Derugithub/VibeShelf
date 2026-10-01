import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { EMPTY_SHELF, type Board, type Photo, type ShelfData } from '@/src/types';
import { isVibeId, normalizeTags, type VibeId } from '@/src/vibe/analyze';

const KEY = 'vibeshelf.v1';

async function kv() {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage;
}

function asPhoto(value: unknown): Photo | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Photo>;
  if (typeof raw.id !== 'string' || typeof raw.uri !== 'string') return null;
  if (typeof raw.width !== 'number' || typeof raw.height !== 'number') return null;
  if (!Array.isArray(raw.tags) || !Array.isArray(raw.colors)) return null;
  const tags = raw.tags.filter((tag): tag is VibeId => typeof tag === 'string' && isVibeId(tag));
  const colors = raw.colors.filter((color): color is string => typeof color === 'string');
  return {
    id: raw.id,
    uri: raw.uri,
    width: raw.width,
    height: raw.height,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    tags: normalizeTags(tags.length ? tags : ['muted']),
    colors: colors.length ? colors : ['#8E8A96'],
    brightness: typeof raw.brightness === 'number' ? raw.brightness : 0.5,
    saturation: typeof raw.saturation === 'number' ? raw.saturation : 0,
    sampleKey: typeof raw.sampleKey === 'string' ? raw.sampleKey : undefined,
  };
}

function asBoard(value: unknown): Board | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Board>;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || !Array.isArray(raw.photoIds)) return null;
  return {
    id: raw.id,
    name: raw.name,
    photoIds: raw.photoIds.filter((id): id is string => typeof id === 'string'),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

function fileStillThere(uri: string): boolean {
  if (Platform.OS === 'web') return uri.startsWith('idb:') || uri.startsWith('blob:') || uri.startsWith('data:');
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

function forDisk(data: ShelfData): ShelfData {
  if (Platform.OS !== 'web') return data;
  return {
    ...data,
    photos: data.photos.map((photo) =>
      photo.uri.startsWith('blob:') || photo.uri.startsWith('data:') ? { ...photo, uri: `idb:${photo.id}` } : photo,
    ),
  };
}

export async function loadShelf(): Promise<ShelfData> {
  try {
    const raw = await (await kv()).getItem(KEY);
    if (!raw) return EMPTY_SHELF;
    const parsed = JSON.parse(raw) as Partial<ShelfData>;
    const photos = (Array.isArray(parsed.photos) ? parsed.photos : [])
      .map(asPhoto)
      .filter((photo): photo is Photo => photo !== null)
      .filter((photo) => fileStillThere(photo.uri));
    const live = new Set(photos.map((photo) => photo.id));
    const boards = (Array.isArray(parsed.boards) ? parsed.boards : [])
      .map(asBoard)
      .filter((board): board is Board => board !== null)
      .map((board) => ({ ...board, photoIds: board.photoIds.filter((id) => live.has(id)) }));
    return {
      version: 1,
      onboarded: Boolean(parsed.onboarded),
      photos,
      boards,
    };
  } catch {
    return EMPTY_SHELF;
  }
}

export async function saveShelf(data: ShelfData): Promise<void> {
  await (await kv()).setItem(KEY, JSON.stringify(forDisk(data)));
}
