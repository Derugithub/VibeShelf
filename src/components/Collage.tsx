import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/src/theme';
import type { Photo } from '@/src/types';
import { vibeLabel, type VibeId } from '@/src/vibe/analyze';

const INK = '#100E16';
const CREAM = '#F6F3EE';
const LILAC = '#C9B8FF';
const SOFT = '#B7AFC6';

function layoutRows(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [1, 1];
  if (count === 3) return [1, 2];
  const rows: number[] = [];
  let left = count;
  while (left > 0) {
    if (left === 3 && rows.length > 0) {
      rows.push(3);
      break;
    }
    const take = Math.min(2, left);
    rows.push(take);
    left -= take;
  }
  return rows;
}

function rowHeight(columns: number, innerWidth: number, gap: number): number {
  if (columns <= 1) return Math.round(innerWidth * 0.78);
  const cell = (innerWidth - gap * (columns - 1)) / columns;
  return Math.round(cell * (columns === 2 ? 1.12 : 1.2));
}

function topTags(photos: Photo[]): VibeId[] {
  const counts = new Map<VibeId, number>();
  for (const photo of photos) {
    for (const tag of photo.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 4);
}

export const Collage = forwardRef<View, { title: string; photos: Photo[]; width: number }>(function Collage(
  { title, photos, width },
  ref,
) {
  const shown = photos.slice(0, 8);
  const rows = layoutRows(shown.length);
  const pad = 20;
  const gap = 8;
  const inner = width - pad * 2;
  const tags = topTags(shown);
  let cursor = 0;

  return (
    <View ref={ref} collapsable={false} style={[styles.canvas, { width, backgroundColor: INK }]}>
      <Text style={[styles.eyebrow, { fontFamily: fonts.semibold }]}>VIBESHELF</Text>
      <Text style={[styles.title, { fontFamily: fonts.display }]} numberOfLines={2}>
        {title}
      </Text>
      <View style={{ gap, marginTop: 16 }}>
        {rows.map((columns, rowIndex) => {
          const slice = shown.slice(cursor, cursor + columns);
          cursor += columns;
          const height = rowHeight(columns, inner, gap);
          return (
            <View key={`${rowIndex}-${columns}`} style={{ flexDirection: 'row', gap, height }}>
              {slice.map((photo) => (
                <View key={photo.id} style={styles.cell}>
                  <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
                </View>
              ))}
            </View>
          );
        })}
      </View>
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[styles.tagText, { fontFamily: fonts.medium }]}>{vibeLabel(tag)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={[styles.footer, { fontFamily: fonts.body }]}>
        {photos.length > shown.length
          ? `First ${shown.length} of ${photos.length} · made on this device`
          : `${shown.length} ${shown.length === 1 ? 'photo' : 'photos'} · made on this device`}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    padding: 20,
    borderRadius: 28,
  },
  eyebrow: {
    color: LILAC,
    letterSpacing: 2.4,
    fontSize: 11,
  },
  title: {
    color: CREAM,
    fontSize: 32,
    lineHeight: 38,
    marginTop: 8,
  },
  cell: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#221F2A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(201,184,255,0.16)',
  },
  tagText: {
    color: CREAM,
    fontSize: 13,
  },
  footer: {
    color: SOFT,
    marginTop: 14,
    fontSize: 13,
  },
});
