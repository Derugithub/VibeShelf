import type { ShelfData } from '@/src/types';

export function withoutPhoto(shelf: ShelfData, id: string, now = Date.now()): ShelfData {
  return {
    ...shelf,
    photos: shelf.photos.filter((photo) => photo.id !== id),
    boards: shelf.boards.map((board) =>
      board.photoIds.includes(id)
        ? { ...board, photoIds: board.photoIds.filter((photoId) => photoId !== id), updatedAt: now }
        : board,
    ),
  };
}

export function withoutBoard(shelf: ShelfData, id: string): ShelfData {
  return {
    ...shelf,
    boards: shelf.boards.filter((board) => board.id !== id),
    photos: shelf.photos,
  };
}
