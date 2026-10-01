import assert from 'node:assert/strict';
import test from 'node:test';

import { clampNote, PHOTO_NOTE_LIMIT } from './notes';

test('notes trim and stop at 140 characters', () => {
  assert.equal(clampNote('  morning light  '), 'morning light');
  assert.equal(clampNote('   '), '');
  const long = `${'a'.repeat(PHOTO_NOTE_LIMIT + 20)}   `;
  assert.equal(clampNote(long).length, PHOTO_NOTE_LIMIT);
  assert.equal(clampNote(long), 'a'.repeat(PHOTO_NOTE_LIMIT));
});
