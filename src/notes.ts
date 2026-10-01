export const PHOTO_NOTE_LIMIT = 140;

export function clampNote(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > PHOTO_NOTE_LIMIT ? trimmed.slice(0, PHOTO_NOTE_LIMIT).trim() : trimmed;
}
