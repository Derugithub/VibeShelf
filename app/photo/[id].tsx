import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { Sheet } from '@/src/components/Sheet';
import { Tag } from '@/src/components/Tag';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';
import { colorLabel, lightLabel, nearestColorName, normalizeTags } from '@/src/vibe/analyze';

export default function PhotoScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoId = Array.isArray(id) ? id[0] : id;
  const { photos, boards, deletePhoto, createBoard, setBoardPhotoIds } = useLibrary();
  const photo = photos.find((item) => item.id === photoId);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function closeBoards() {
    setBoardsOpen(false);
    setNaming(false);
    setName('');
  }

  function openBoards() {
    if (!photo) return;
    setDraft(boards.filter((board) => board.photoIds.includes(photo.id)).map((board) => board.id));
    setNaming(false);
    setName('');
    setBoardsOpen(true);
  }

  if (!photo) {
    return (
      <View style={[styles.fill, styles.missing, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <Text style={{ color: theme.text, fontFamily: fonts.display, fontSize: 28 }}>This photo is gone.</Text>
        <Button label="Back to library" onPress={goBack} />
      </View>
    );
  }

  function toggleDraft(boardId: string) {
    setDraft((current) => (current.includes(boardId) ? current.filter((item) => item !== boardId) : [...current, boardId]));
  }

  async function savePins() {
    if (!photo) return;
    const wanted = new Set(draft);
    const jobs = boards.map((board) => {
      const has = board.photoIds.includes(photo.id);
      const should = wanted.has(board.id);
      if (has === should) return Promise.resolve();
      const next = should ? [...board.photoIds, photo.id] : board.photoIds.filter((item) => item !== photo.id);
      return setBoardPhotoIds(board.id, next);
    });
    await Promise.all(jobs);
    closeBoards();
  }

  async function createAndPin() {
    const trimmed = name.trim();
    if (!trimmed || !photo) return;
    const board = await createBoard(trimmed);
    await setBoardPhotoIds(board.id, [photo.id]);
    closeBoards();
    router.push(`/board/${board.id}` as Href);
  }

  async function removePhoto() {
    if (!photo || removing) return;
    setRemoving(true);
    try {
      await deletePhoto(photo.id);
      setConfirming(false);
      goBack();
    } finally {
      setRemoving(false);
    }
  }

  const onBoards = boards.filter((board) => board.photoIds.includes(photo.id));

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <Image source={{ uri: photo.uri }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Text style={[styles.kicker, { color: theme.textFaint, fontFamily: fonts.semibold }]}>
            {lightLabel(photo.brightness)} · {colorLabel(photo.saturation)}
          </Text>
          <View style={styles.tags}>
            {normalizeTags(photo.tags).map((tag) => (
              <Tag key={tag} id={tag} />
            ))}
          </View>
          <Text style={[styles.section, { color: theme.text, fontFamily: fonts.displaySoft }]}>Palette</Text>
          <View style={styles.swatches}>
            {photo.colors.map((color) => (
              <View key={color} style={styles.swatch}>
                <View style={[styles.chip, { backgroundColor: color, borderColor: theme.border }]} />
                <Text style={{ color: theme.text, fontFamily: fonts.medium, fontSize: 13 }}>{nearestColorName(color)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.section, { color: theme.text, fontFamily: fonts.displaySoft }]}>Boards</Text>
          {onBoards.length === 0 ? (
            <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 15 }}>Not on a board yet.</Text>
          ) : (
            <View style={styles.tags}>
              {onBoards.map((board) => (
                <Pressable key={board.id} onPress={() => router.push(`/board/${board.id}` as Href)}>
                  <Text style={[styles.boardLink, { color: theme.text, borderColor: theme.border, fontFamily: fonts.medium }]}>
                    {board.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Button label="Add to a board" onPress={openBoards} />
          <Button label="Remove from shelf" variant="danger" onPress={() => setConfirming(true)} />
        </View>
      </ScrollView>
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <IconButton label="Back" onPress={goBack}>
          <Icon name="back" color={theme.text} />
        </IconButton>
        <IconButton label="Remove from shelf" onPress={() => setConfirming(true)}>
          <Icon name="trash" color={theme.danger} />
        </IconButton>
      </View>

      <Sheet visible={boardsOpen} title={naming ? 'New board' : 'Add to a board'} onClose={closeBoards}>
        {naming ? (
          <>
            <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16 }}>
              Name the board. This photo will be the first one on it.
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Board name"
              placeholderTextColor={theme.textFaint}
              maxLength={40}
              autoFocus
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg, fontFamily: fonts.medium }]}
            />
            <Button label="Create board" onPress={createAndPin} disabled={!name.trim()} />
            <Button
              label="Back"
              variant="ghost"
              onPress={() => {
                setNaming(false);
                setName('');
              }}
            />
          </>
        ) : (
          <>
            {boards.length === 0 ? (
              <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16 }}>
                You do not have a board yet. Name one and this photo will be first.
              </Text>
            ) : (
              <ScrollView style={styles.boardList} contentContainerStyle={{ paddingBottom: 4 }}>
                {boards.map((board) => {
                  const selected = draft.includes(board.id);
                  return (
                    <Pressable
                      key={board.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${selected ? 'Selected' : 'Not selected'} ${board.name}`}
                      onPress={() => toggleDraft(board.id)}
                      style={[styles.row, { borderColor: theme.border }]}>
                      <Text style={{ color: theme.text, fontFamily: fonts.medium, fontSize: 16, flex: 1 }}>{board.name}</Text>
                      {selected ? <Icon name="check" color={theme.accent} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {boards.length > 0 ? <Button label="Done" onPress={savePins} /> : null}
            <Button label="New board" variant="secondary" onPress={() => setNaming(true)} />
            <Button label="Cancel" variant="ghost" onPress={closeBoards} />
          </>
        )}
      </Sheet>

      <Sheet visible={confirming} title="Remove this photo?" onClose={() => setConfirming(false)}>
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }}>
          It leaves your shelf and any boards. The original in your photo library stays where it is.
        </Text>
        <Button label={removing ? 'Removing…' : 'Remove from shelf'} variant="danger" onPress={removePhoto} disabled={removing} />
        <Button label="Keep photo" variant="secondary" onPress={() => setConfirming(false)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  missing: { padding: 24, gap: 16, justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    zIndex: 4,
    elevation: 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#221F2A' },
  body: { padding: 20, gap: 14 },
  kicker: { letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { fontSize: 22, marginTop: 6 },
  swatches: { flexDirection: 'row', gap: 12 },
  swatch: { flex: 1, gap: 6 },
  chip: { height: 54, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  boardLink: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  boardList: { maxHeight: 280 },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
  },
});
