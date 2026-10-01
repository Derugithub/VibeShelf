import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { Sheet } from '@/src/components/Sheet';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';

export default function BoardsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { boards, photos, createBoard } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const board = await createBoard(trimmed);
    setName('');
    setOpen(false);
    router.push(`/board/${board.id}` as Href);
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 16,
        }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>Boards</Text>
            <Text style={[styles.sub, { color: theme.textSoft, fontFamily: fonts.body }]}>
              Group photos into a mood
            </Text>
          </View>
          <IconButton label="New board" onPress={() => setOpen(true)}>
            <Icon name="plus" color={theme.text} />
          </IconButton>
        </View>

        {boards.length === 0 ? (
          <EmptyState
            title="No boards yet"
            body="A board is a small collection — a room, a trip, a color story. Photos stay in your library until you pin them.">
            <Button label="New board" onPress={() => setOpen(true)} />
          </EmptyState>
        ) : (
          boards.map((board) => {
            const covers = board.photoIds
              .map((id) => photos.find((photo) => photo.id === id))
              .filter((photo) => photo !== undefined)
              .slice(0, 3);
            return (
              <Pressable
                key={board.id}
                accessibilityRole="button"
                accessibilityLabel={`Open board ${board.name}`}
                onPress={() => router.push(`/board/${board.id}` as Href)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
                ]}>
                <View style={styles.covers}>
                  {covers.length === 0 ? (
                    <View style={[styles.coverEmpty, { backgroundColor: theme.bg }]}>
                      <Text style={{ color: theme.textFaint, fontFamily: fonts.medium }}>Empty board</Text>
                    </View>
                  ) : (
                    covers.map((photo) => (
                      <Image key={photo.id} source={{ uri: photo.uri }} style={styles.cover} contentFit="cover" />
                    ))
                  )}
                  <LinearGradient colors={['transparent', 'rgba(9,8,13,0.15)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.name, { color: theme.text, fontFamily: fonts.displaySoft }]} numberOfLines={1}>
                    {board.name}
                  </Text>
                  <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 14 }}>
                    {board.photoIds.length} {board.photoIds.length === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet
        visible={open}
        title="New board"
        onClose={() => {
          setOpen(false);
          setName('');
        }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Weekend light"
          placeholderTextColor={theme.textFaint}
          maxLength={40}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg, fontFamily: fonts.medium },
          ]}
        />
        <Button label="Create board" onPress={save} disabled={!name.trim()} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 34, lineHeight: 38 },
  sub: { marginTop: 2, fontSize: 14 },
  card: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  covers: { height: 168, flexDirection: 'row' },
  cover: { flex: 1 },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: { paddingHorizontal: 16, paddingVertical: 14, gap: 2 },
  name: { fontSize: 22 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
  },
});
