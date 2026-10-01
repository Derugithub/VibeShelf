import assert from 'node:assert/strict';
import test from 'node:test';

import { withoutBoard, withoutPhoto } from './shelf';
import type { ShelfData } from './types';

function shelf(): ShelfData {
  return {
    version: 1,
    onboarded: true,
    photos: [
      {
        id: 'a',
        uri: 'file://a.jpg',
        width: 10,
        height: 10,
        createdAt: 1,
        tags: ['muted'],
        colors: ['#888888'],
        brightness: 0.4,
        saturation: 0.02,
      },
      {
        id: 'b',
        uri: 'file://b.jpg',
        width: 10,
        height: 10,
        createdAt: 2,
        tags: ['pastel', 'bright'],
        colors: ['#F4D6DE'],
        brightness: 0.8,
        saturation: 0.1,
      },
    ],
    boards: [
      {
        id: 'board-1',
        name: 'Weekend',
        photoIds: ['a', 'b'],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'board-2',
        name: 'Empty',
        photoIds: [],
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  };
}

test('removing a photo drops it from the shelf and from every board', () => {
  const next = withoutPhoto(shelf(), 'a', 50);
  assert.deepEqual(
    next.photos.map((photo) => photo.id),
    ['b'],
  );
  assert.deepEqual(next.boards[0].photoIds, ['b']);
  assert.equal(next.boards[0].updatedAt, 50);
  assert.deepEqual(next.boards[1].photoIds, []);
  assert.equal(next.boards[1].updatedAt, 1);
});

test('removing a board leaves library photos in place', () => {
  const next = withoutBoard(shelf(), 'board-1');
  assert.equal(next.boards.length, 1);
  assert.equal(next.boards[0].id, 'board-2');
  assert.deepEqual(
    next.photos.map((photo) => photo.id),
    ['a', 'b'],
  );
});
