import { normalizeTags, type VibeId } from '@/src/vibe/analyze';

export function photosMatching<T extends { tags: readonly VibeId[] }>(
  photos: readonly T[],
  filter: VibeId | 'all',
): T[] {
  if (filter === 'all') return [...photos];
  return photos.filter((photo) => normalizeTags(photo.tags).includes(filter));
}

export function tagsForDisplay(tags: readonly VibeId[], filter: VibeId | 'all', limit = 2): VibeId[] {
  const unique = normalizeTags(tags);
  if (filter === 'all' || !unique.includes(filter)) return unique.slice(0, limit);
  return [filter, ...unique.filter((tag) => tag !== filter)].slice(0, limit);
}
