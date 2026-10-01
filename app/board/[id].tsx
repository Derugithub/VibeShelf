import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/src/components/Button';
import { Collage } from '@/src/components/Collage';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { Sheet } from '@/src/components/Sheet';
import { Tag } from '@/src/components/Tag';
import { confirm } from '@/src/haptics';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';
import type { Photo } from '@/src/types';
import { normalizeTags } from '@/src/vibe/analyze';

export default function BoardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const boardId = Array.isArray(id) ? id[0] : id;
  const { photos, boards, renameBoard, deleteBoard, setBoardPhotoIds, pinPhotos, importFromCamera, importFromLibrary } =
    useLibrary();
  const board = boards.find((item) => item.id === boardId);
  const [arrange, setArrange] = useState(false);
  const [picker, setPicker] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [name, setName] = useState(board?.name ?? '');
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const collageRef = useRef<View>(null);

  const ordered = useMemo(() => {
    if (!board) return [];
    return board.photoIds
      .map((photoId) => photos.find((photo) => photo.id === photoId))
      .filter((photo): photo is Photo => photo !== undefined);
  }, [board, photos]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/boards' as Href);
  }

  if (!board) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <Text style={{ color: theme.text, fontFamily: fonts.display, fontSize: 28 }}>This board is gone.</Text>
        <Button label="Back to boards" onPress={goBack} />
      </View>
    );
  }

  const columnWidth = (width - 20 * 2 - 10) / 2;
  const columns: { photo: Photo; height: number }[][] = [[], []];
  const heights = [0, 0];
  ordered.forEach((photo) => {
    const ratio = photo.width > 0 ? photo.height / photo.width : 1;
    const height = Math.max(120, Math.min(280, columnWidth * ratio));
    const index = heights[0] <= heights[1] ? 0 : 1;
    columns[index].push({ photo, height });
    heights[index] += height + 10;
  });

  function move(index: number, direction: -1 | 1) {
    if (!board) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;
    const ids = ordered.map((photo) => photo.id);
    const [item] = ids.splice(index, 1);
    ids.splice(nextIndex, 0, item);
    setBoardPhotoIds(board.id, ids).catch(() => undefined);
  }

  function removeAt(photoId: string) {
    if (!board) return;
    setBoardPhotoIds(
      board.id,
      ordered.map((photo) => photo.id).filter((item) => item !== photoId),
    ).catch(() => undefined);
  }

  async function removeBoard() {
    if (!board || removing) return;
    setRemoving(true);
    try {
      await deleteBoard(board.id);
      setConfirming(false);
      goBack();
    } finally {
      setRemoving(false);
    }
  }

  async function addFresh(kind: 'camera' | 'library') {
    setPicker(false);
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const outcome = kind === 'camera' ? await importFromCamera() : await importFromLibrary();
      if (outcome.photoIds.length) await pinPhotos(boardId, outcome.photoIds);
      else if (outcome.failed > 0) Alert.alert('Could not add that photo', 'Try another one in a moment.');
    } catch {
      Alert.alert('Could not add that photo', 'Try again in a moment.');
    }
  }

  async function saveName() {
    if (!board) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await renameBoard(board.id, trimmed);
    setRenameOpen(false);
  }

  async function shareCollage() {
    if (!board || !collageRef.current || sharing) return;
    setSharing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 280));
      const captured = await captureRef(collageRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const slug = board.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'board';
      if (Platform.OS === 'web') {
        const doc = (globalThis as { document?: { createElement: (tag: string) => { href: string; download: string; click: () => void } } }).document;
        const anchor = doc?.createElement('a');
        if (anchor) {
          anchor.href = captured;
          anchor.download = `vibeshelf-${slug}.png`;
          anchor.click();
        }
        confirm();
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing is unavailable', 'Sharing is not available right now.');
        return;
      }
      const dest = new File(Paths.cache, `vibeshelf-${slug}.png`);
      new File(captured).copySync(dest, { overwrite: true });
      await Sharing.shareAsync(dest.uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Export mood board',
      });
      confirm();
    } catch (error) {
      console.warn('VibeShelf export failed', error);
      Alert.alert('Could not export', 'The collage could not be saved. Try again in a moment.');
    } finally {
      setSharing(false);
    }
  }

  const collageWidth = Math.min(width - 32, 420);

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 28,
          gap: 16,
        }}>
        <View style={styles.top}>
          <IconButton label="Back" onPress={goBack}>
            <Icon name="back" color={theme.text} />
          </IconButton>
          <View style={{ flex: 1 }} />
          <IconButton label="Edit board" onPress={() => { setName(board.name); setRenameOpen(true); }}>
            <Icon name="edit" color={theme.text} />
          </IconButton>
          <IconButton label="Export collage" onPress={() => setExporting(true)}>
            <Icon name="share" color={theme.text} />
          </IconButton>
          <IconButton label="Delete board" onPress={() => setConfirming(true)}>
            <Icon name="trash" color={theme.danger} />
          </IconButton>
        </View>
        <View>
          <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>{board.name}</Text>
          <Text style={{ color: theme.textSoft, fontFamily: fonts.body, marginTop: 4 }}>
            {ordered.length} {ordered.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label="Add photos" variant="secondary" onPress={() => setPicker(true)} style={styles.action} />
          <Button
            label={arrange ? 'Done arranging' : 'Arrange'}
            variant="secondary"
            onPress={() => setArrange((value) => !value)}
            style={styles.action}
            disabled={ordered.length < 2 && !arrange}
          />
        </View>

        {ordered.length === 0 ? (
          <EmptyState
            title="This board is empty"
            body="Take a photo, choose one from your library, or pin pictures already on your shelf.">
            <Button
              label="Take a photo"
              onPress={() => addFresh('camera')}
              icon={<Icon name="camera" color={theme.mode === 'dark' ? '#1A1524' : '#FFFFFF'} size={18} />}
            />
            <Button
              label="Choose photos"
              variant="secondary"
              onPress={() => addFresh('library')}
              icon={<Icon name="image" color={theme.text} size={18} />}
            />
            <Button label="Add from shelf" variant="ghost" onPress={() => setPicker(true)} />
          </EmptyState>
        ) : arrange ? (
          <View style={{ gap: 10 }}>
            {ordered.map((photo, index) => (
              <View key={photo.id} style={[styles.arrangeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.tags}>
                    {normalizeTags(photo.tags).slice(0, 2).map((tag) => (
                      <Tag key={tag} id={tag} />
                    ))}
                  </View>
                </View>
                <View style={styles.arrangeActions}>
                  <IconButton label="Move earlier" onPress={() => move(index, -1)}>
                    <Icon name="up" color={theme.text} size={18} />
                  </IconButton>
                  <IconButton label="Move later" onPress={() => move(index, 1)}>
                    <Icon name="down" color={theme.text} size={18} />
                  </IconButton>
                  <IconButton label="Remove from board" onPress={() => removeAt(photo.id)}>
                    <Icon name="close" color={theme.danger} size={18} />
                  </IconButton>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.masonry}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={{ flex: 1, gap: 10 }}>
                {column.map(({ photo, height }) => {
                  const lead = normalizeTags(photo.tags)[0];
                  return (
                  <Pressable
                    key={photo.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/photo/${photo.id}` as Href)}
                    onLongPress={() =>
                      Alert.alert(board.name, 'Remove this photo from the board?', [
                        { text: 'Keep', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeAt(photo.id) },
                      ])
                    }
                    style={({ pressed }) => [{ height, opacity: pressed ? 0.9 : 1 }]}>
                    <Image source={{ uri: photo.uri }} style={[styles.masonryImage, { height }]} contentFit="cover" />
                    <View style={styles.masonryTag}>
                      {lead ? <Tag id={lead} onPhoto /> : null}
                    </View>
                  </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
        <Button label="Delete board" variant="danger" onPress={() => setConfirming(true)} />
      </ScrollView>

      <PickerSheet
        visible={picker}
        photos={photos}
        selectedIds={board.photoIds}
        onClose={() => setPicker(false)}
        onImport={(kind) => {
          addFresh(kind).catch(() => undefined);
        }}
        onSave={(ids) => {
          setBoardPhotoIds(board.id, ids).catch(() => undefined);
          setPicker(false);
        }}
      />

      <Sheet visible={confirming} title="Delete this board?" onClose={() => setConfirming(false)}>
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }}>
          The board goes away. Your photos stay in the library.
        </Text>
        <Button label={removing ? 'Deleting…' : 'Delete board'} variant="danger" onPress={removeBoard} disabled={removing} />
        <Button label="Keep board" variant="secondary" onPress={() => setConfirming(false)} disabled={removing} />
      </Sheet>

      <Sheet visible={renameOpen} title="Edit board" onClose={() => setRenameOpen(false)}>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={40}
          autoFocus
          placeholder="Board name"
          placeholderTextColor={theme.textFaint}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg, fontFamily: fonts.medium }]}
        />
        <Button label="Save name" onPress={saveName} disabled={!name.trim()} />
      </Sheet>

      <Modal visible={exporting} animationType="slide" onRequestClose={() => setExporting(false)}>
        <View style={[styles.export, { backgroundColor: '#09080D', paddingTop: insets.top + 8 }]}>
          <View style={styles.top}>
            <IconButton label="Close preview" onPress={() => setExporting(false)}>
              <Icon name="close" color="#F6F3EE" />
            </IconButton>
            <View style={{ flex: 1 }} />
            <Button
              label={sharing ? 'Exporting…' : 'Share collage'}
              onPress={shareCollage}
              disabled={ordered.length === 0 || sharing}
              style={{ minHeight: 44 }}
            />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: insets.bottom + 24 }}>
            {ordered.length === 0 ? (
              <Text style={{ color: '#B7AFC6', fontFamily: fonts.body, fontSize: 16 }}>Add photos before exporting.</Text>
            ) : (
              <Collage ref={collageRef} title={board.name} photos={ordered} width={collageWidth} />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function PickerSheet({
  visible,
  photos,
  selectedIds,
  onClose,
  onSave,
  onImport,
}: {
  visible: boolean;
  photos: Photo[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
  onImport: (kind: 'camera' | 'library') => void;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (visible) setSelected(selectedIds);
  }, [visible, selectedIds]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function save() {
    const kept = selectedIds.filter((id) => selected.includes(id));
    const added = photos.filter((photo) => selected.includes(photo.id) && !kept.includes(photo.id)).map((photo) => photo.id);
    onSave([...kept, ...added]);
  }

  return (
    <Sheet visible={visible} title="Add photos" onClose={onClose}>
      <Button
        label="Take a photo"
        variant="secondary"
        onPress={() => onImport('camera')}
        icon={<Icon name="camera" color={theme.text} size={18} />}
      />
      <Button
        label="Choose photos"
        variant="secondary"
        onPress={() => onImport('library')}
        icon={<Icon name="image" color={theme.text} size={18} />}
      />
      {photos.length === 0 ? (
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16 }}>
          Nothing on your shelf yet. Take a photo or choose one to add it here.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {photos.map((photo) => {
            const on = selected.includes(photo.id);
            return (
              <Pressable key={photo.id} accessibilityRole="button" onPress={() => toggle(photo.id)} style={styles.pick}>
                <Image source={{ uri: photo.uri }} style={styles.pickImage} contentFit="cover" />
                {on ? (
                  <View style={styles.pickBadge}>
                    <Icon name="check" color="#1A1524" size={16} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <Button label={`Save ${selected.length} ${selected.length === 1 ? 'photo' : 'photos'}`} onPress={save} disabled={photos.length === 0} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  missing: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 36, lineHeight: 40 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  masonry: { flexDirection: 'row', gap: 10 },
  masonryImage: { width: '100%', borderRadius: 18 },
  masonryTag: { position: 'absolute', left: 8, bottom: 8 },
  arrangeRow: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  arrangeActions: { gap: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
  },
  export: { flex: 1 },
  pick: { width: 92, height: 92, borderRadius: 16, overflow: 'hidden' },
  pickImage: { width: '100%', height: '100%' },
  pickBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C9B8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
