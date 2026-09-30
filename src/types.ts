import type { VibeId } from '@/src/vibe/analyze';

export type Photo = {
  id: string;
  uri: string;
  width: number;
  height: number;
  createdAt: number;
  tags: VibeId[];
  colors: string[];
  brightness: number;
  saturation: number;
  sampleKey?: string;
};

export type Board = {
  id: string;
  name: string;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type ShelfData = {
  version: 1;
  onboarded: boolean;
  photos: Photo[];
  boards: Board[];
};

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const EMPTY_SHELF: ShelfData = {
  version: 1,
  onboarded: false,
  photos: [],
  boards: [],
};
