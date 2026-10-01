import assert from 'node:assert/strict';
import test from 'node:test';

import { indexAfterDrag, reorderIds } from './arrange';

test('reorder moves an id up or down', () => {
  assert.deepEqual(reorderIds(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(reorderIds(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c']);
  assert.deepEqual(reorderIds(['a', 'b'], 0, 0), ['a', 'b']);
});

test('a drag lands on the nearest row', () => {
  assert.equal(indexAfterDrag(1, 90, 80, 4), 2);
  assert.equal(indexAfterDrag(1, -90, 80, 4), 0);
  assert.equal(indexAfterDrag(0, -200, 80, 4), 0);
  assert.equal(indexAfterDrag(3, 400, 80, 4), 3);
});
