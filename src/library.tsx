import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { confirm } from '@/src/haptics';
import { getPhotoBytes, objectUrlFromBytes } from '@/src/idbPhotos';
import { ensureCameraPermission, ensureLibraryPermission } from '@/src/permissions';
import { createPhotoFromUri, deletePhotoFile, loadSampleInputs } from '@/src/photos';
import { loadShelf, saveShelf } from '@/src/storage';
import { createId, EMPTY_SHELF, type Board, type Photo, type ShelfData } from '@/src/types';

type ImportOutcome = {
  status: 'added' | 'canceled' | 'denied' | 'empty';
  added: number;
  failed: number;
};

type LibraryContextValue = {
  ready: boolean;
  activity: string | null;
  onboarded: boolean;
  photos: Photo[];
  boards: Board[];
  completeOnboarding: () => Promise<void>;
  importFromLibrary: () => Promise<ImportOutcome>;
  importFromCamera: () => Promise<ImportOutcome>;
  importSamples: () => Promise<ImportOutcome>;
  deletePhoto: (id: string) => Promise<void>;
  createBoard: (name: string) => Promise<Board>;
  renameBoard: (id: string, name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  setBoardPhotoIds: (id: string, photoIds: string[]) => Promise<void>;
  photoById: (id: string) => Photo | undefined;
  boardById: (id: string) => Board | undefined;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [shelf, setShelf] = useState<ShelfData>(EMPTY_SHELF);
  const [ready, setReady] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const shelfRef = useRef(shelf);
  const queue = useRef(Promise.resolve());
  const busy = useRef(false);
  shelfRef.current = shelf;

  useEffect(() => {
    let active = true;
    loadShelf()
      .then((data) => hydratePhotos(data))
      .then((data) => {
        if (!active) return;
        shelfRef.current = data;
        setShelf(data);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((recipe: (prev: ShelfData) => ShelfData) => {
    const run = queue.current.then(async () => {
      const next = recipe(shelfRef.current);
      shelfRef.current = next;
      setShelf(next);
      await saveShelf(next);
    });
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  const importItems = useCallback(
    async (
      items: { uri: string; width?: number; height?: number; sampleKey?: string }[],
      label: string,
    ): Promise<ImportOutcome> => {
      if (busy.current) return { status: 'empty', added: 0, failed: 0 };
      busy.current = true;
      const created: Photo[] = [];
      let failed = 0;
      try {
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          if (item.sampleKey && shelfRef.current.photos.some((photo) => photo.sampleKey === item.sampleKey)) {
            continue;
          }
          setActivity(`${label} ${index + 1} of ${items.length}`);
          try {
            created.push(await createPhotoFromUri(item));
          } catch (error) {
            failed += 1;
            console.warn('VibeShelf could not read a photo', error);
          }
        }
        if (created.length) {
          await commit((prev) => ({
            ...prev,
            photos: [...created].reverse().concat(prev.photos),
          }));
          confirm();
        }
        return {
          status: created.length ? 'added' : 'empty',
          added: created.length,
          failed,
        };
      } finally {
        setActivity(null);
        busy.current = false;
      }
    },
    [commit],
  );

  const importFromLibrary = useCallback(async (): Promise<ImportOutcome> => {
    const allowed = await ensureLibraryPermission();
    if (!allowed) return { status: 'denied', added: 0, failed: 0 };
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 12,
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || result.assets.length === 0) return { status: 'canceled', added: 0, failed: 0 };
    return importItems(
      result.assets.map((asset) => ({ uri: asset.uri, width: asset.width, height: asset.height })),
      'Reading color',
    );
  }, [importItems]);

  const importFromCamera = useCallback(async (): Promise<ImportOutcome> => {
    const allowed = await ensureCameraPermission();
    if (!allowed) return { status: 'denied', added: 0, failed: 0 };
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || result.assets.length === 0) return { status: 'canceled', added: 0, failed: 0 };
    const asset = result.assets[0];
    return importItems([{ uri: asset.uri, width: asset.width, height: asset.height }], 'Reading color');
  }, [importItems]);

  const importSamples = useCallback(async (): Promise<ImportOutcome> => {
    const inputs = await loadSampleInputs();
    const fresh = inputs.filter((item) => !shelfRef.current.photos.some((photo) => photo.sampleKey === item.sampleKey));
    if (fresh.length === 0) return { status: 'empty', added: 0, failed: 0 };
    return importItems(fresh, 'Adding samples');
  }, [importItems]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready,
      activity,
      onboarded: shelf.onboarded,
      photos: shelf.photos,
      boards: shelf.boards,
      completeOnboarding: () => commit((prev) => ({ ...prev, onboarded: true })).then(() => undefined),
      importFromLibrary,
      importFromCamera,
      importSamples,
      deletePhoto: async (id: string) => {
        const photo = shelfRef.current.photos.find((item) => item.id === id);
        await commit((prev) => ({
          ...prev,
          photos: prev.photos.filter((item) => item.id !== id),
          boards: prev.boards.map((board) => ({
            ...board,
            photoIds: board.photoIds.filter((photoId) => photoId !== id),
            updatedAt: board.photoIds.includes(id) ? Date.now() : board.updatedAt,
          })),
        }));
        if (photo) await deletePhotoFile(photo.uri, photo.id);
      },
      createBoard: async (name: string) => {
        const board: Board = {
          id: createId(),
          name: name.trim(),
          photoIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await commit((prev) => ({ ...prev, boards: [board, ...prev.boards] }));
        confirm();
        return board;
      },
      renameBoard: (id: string, name: string) =>
        commit((prev) => ({
          ...prev,
          boards: prev.boards.map((board) =>
            board.id === id ? { ...board, name: name.trim(), updatedAt: Date.now() } : board,
          ),
        })).then(() => undefined),
      deleteBoard: (id: string) =>
        commit((prev) => ({ ...prev, boards: prev.boards.filter((board) => board.id !== id) })).then(() => undefined),
      setBoardPhotoIds: (id: string, photoIds: string[]) =>
        commit((prev) => ({
          ...prev,
          boards: prev.boards.map((board) =>
            board.id === id ? { ...board, photoIds, updatedAt: Date.now() } : board,
          ),
        })).then(() => undefined),
      photoById: (id: string) => shelfRef.current.photos.find((photo) => photo.id === id),
      boardById: (id: string) => shelfRef.current.boards.find((board) => board.id === id),
    }),
    [activity, commit, importFromCamera, importFromLibrary, importSamples, ready, shelf],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

async function hydratePhotos(data: ShelfData): Promise<ShelfData> {
  if (Platform.OS !== 'web') return data;
  const photos: Photo[] = [];
  for (const photo of data.photos) {
    if (!photo.uri.startsWith('idb:')) {
      photos.push(photo);
      continue;
    }
    const bytes = await getPhotoBytes(photo.id);
    if (!bytes) continue;
    photos.push({ ...photo, uri: objectUrlFromBytes(bytes) });
  }
  return { ...data, photos };
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used within LibraryProvider');
  return value;
}
