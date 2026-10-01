import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeTags } from './analyze';
import { photosMatching, tagsForDisplay } from './match';

const photos = [
  { id: 'pastel', tags: ['pastel', 'bright'] },
  { id: 'muted', tags: ['bright', 'muted'] },
  { id: 'vivid', tags: ['vivid', 'warm'] },
];

test('a selected vibe keeps only photos that carry that tag', () => {
  const muted = photosMatching(photos, 'muted');
  assert.deepEqual(
    muted.map((photo) => photo.id),
    ['muted'],
  );
  assert.equal(
    muted.some((photo) => photo.tags.includes('pastel')),
    false,
  );

  const pastel = photosMatching(photos, 'pastel');
  assert.deepEqual(
    pastel.map((photo) => photo.id),
    ['pastel'],
  );
});

test('all keeps every photo', () => {
  assert.equal(photosMatching(photos, 'all').length, photos.length);
});

test('pastel and vivid photos are not also muted', () => {
  assert.deepEqual(normalizeTags(['pastel', 'bright', 'muted']), ['pastel', 'bright']);
  assert.deepEqual(normalizeTags(['vivid', 'warm', 'muted']), ['warm', 'vivid']);
  assert.deepEqual(normalizeTags(['bright', 'muted']), ['bright', 'muted']);
});

test('muted filter hides a photo that shows pastel and bright', () => {
  const shelf = [{ id: 'hermes', tags: ['pastel', 'bright', 'muted'] as const }];
  assert.deepEqual(photosMatching(shelf, 'muted'), []);
  assert.deepEqual(
    photosMatching(shelf, 'pastel').map((photo) => photo.id),
    ['hermes'],
  );
  assert.deepEqual(
    photosMatching(shelf, 'bright').map((photo) => photo.id),
    ['hermes'],
  );
  assert.deepEqual(tagsForDisplay(shelf[0].tags, 'all'), ['pastel', 'bright']);
});

test('tiles lead with the active filter tag', () => {
  assert.deepEqual(tagsForDisplay(['bright', 'muted'], 'muted'), ['muted', 'bright']);
  assert.deepEqual(tagsForDisplay(['pastel', 'bright'], 'all'), ['pastel', 'bright']);
  assert.deepEqual(tagsForDisplay(['pastel', 'bright', 'muted'], 'muted'), ['pastel', 'bright']);
});
