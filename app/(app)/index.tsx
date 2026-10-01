import { type Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { Sheet } from '@/src/components/Sheet';
import { Tag } from '@/src/components/Tag';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';
import { normalizeTags, VIBE_IDS, vibeLabel, type VibeId } from '@/src/vibe/analyze';
import { photosMatching, tagsForDisplay } from '@/src/vibe/match';

export default function LibraryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { photos, importFromLibrary, importFromCamera, importSamples, deletePhoto } = useLibrary();
  const [filter, setFilter] = useState<VibeId | 'all'>('all');
  const [about, setAbout] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const present = useMemo(() => {
    const tags = new Set<VibeId>();
    photos.forEach((photo) => normalizeTags(photo.tags).forEach((tag) => tags.add(tag)));
    return VIBE_IDS.filter((tag) => tags.has(tag));
  }, [photos]);

  const visible = photosMatching(photos, filter);
  const columns = width >= 720 ? 3 : 2;
  const gutter = 6;
  const pad = 12;
  const tile = Math.floor((width - pad * 2 - gutter * (columns - 1)) / columns);
  const rows: typeof visible[] = [];
  for (let index = 0; index < visible.length; index += columns) {
    rows.push(visible.slice(index, index + columns));
  }

  async function runImport(action: () => Promise<{ status: string; added: number; failed: number }>) {
    let outcome: { status: string; added: number; failed: number };
    try {
      outcome = await action();
    } catch {
      Alert.alert('Could not add photos', 'Something went wrong with those pictures. Try again in a moment.');
      return;
    }
    if (outcome.failed > 0) {
      Alert.alert(
        'Some photos were skipped',
        outcome.added
          ? `${outcome.added} added. ${outcome.failed} could not be added.`
          : 'Those photos could not be added.',
      );
    } else if (outcome.status === 'empty' && outcome.added === 0) {
      Alert.alert('Nothing new', 'Those photos are already on your shelf, or none could be added.');
    }
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: pad,
          paddingBottom: 20,
          gap: 12,
        }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.wordmark, { color: theme.text, fontFamily: fonts.display }]}>VibeShelf</Text>
            <Text style={[styles.sub, { color: theme.textSoft, fontFamily: fonts.body }]}>
              {photos.length === 0 ? 'Your photos' : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
            </Text>
          </View>
          <IconButton label="About VibeShelf" onPress={() => setAbout(true)}>
            <Icon name="info" color={theme.text} />
          </IconButton>
          <IconButton label="Take a photo" onPress={() => runImport(importFromCamera)}>
            <Icon name="camera" color={theme.text} />
          </IconButton>
          <IconButton label="Import photos" onPress={() => runImport(importFromLibrary)}>
            <Icon name="image" color={theme.text} />
          </IconButton>
        </View>

        {present.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterChip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            {present.map((tag) => (
              <Tag key={tag} id={tag} selected={filter === tag} onPress={() => setFilter(filter === tag ? 'all' : tag)} />
            ))}
          </ScrollView>
        ) : null}

        {photos.length === 0 ? (
          <EmptyState
            title="Nothing on the shelf yet"
            body="Choose a photo, take one, or start with a few samples. Each picture gets a short vibe from its color and light. Your photos stay on your phone.">
            <Button label="Choose photos" onPress={() => runImport(importFromLibrary)} icon={<Icon name="image" color={theme.mode === 'dark' ? '#1A1524' : '#FFFFFF'} size={18} />} />
            <Button label="Take a photo" variant="secondary" onPress={() => runImport(importFromCamera)} icon={<Icon name="camera" color={theme.text} size={18} />} />
            <Button label="Add sample photos" variant="ghost" onPress={() => runImport(importSamples)} />
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState title={`No ${vibeLabel(filter as VibeId).toLowerCase()} photos`} body="Try another vibe, or add a picture with a different kind of light." />
        ) : (
          <View style={{ gap: gutter }}>
            {rows.map((row) => (
              <View key={row[0].id} style={[styles.gridRow, { gap: gutter }]}>
                {row.map((photo) => (
                  <View key={photo.id} style={[styles.tile, { width: tile, height: tile }]}>
                    <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(9,8,13,0.72)']} style={styles.scrim} pointerEvents="none" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open photo tagged ${photo.tags.map(vibeLabel).join(', ')}`}
                      onPress={() => router.push(`/photo/${photo.id}` as Href)}
                      style={({ pressed }) => [StyleSheet.absoluteFill, { opacity: pressed ? 0.88 : 1 }]}
                    />
                    <View style={styles.tileTags} pointerEvents="none">
                      {tagsForDisplay(photo.tags, filter).map((tag) => (
                        <Tag key={tag} id={tag} onPhoto />
                      ))}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove from shelf"
                      onPress={() => setPendingDelete(photo.id)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.tileDelete, { opacity: pressed ? 0.7 : 1 }]}>
                      <Icon name="trash" color="#F6F3EE" size={13} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={about} title="About VibeShelf" onClose={() => setAbout(false)}>
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }}>
          Each photo gets a few words from its color and light. Your pictures and boards stay on this phone. Removing a
          photo here leaves the original in your photo library.
        </Text>
        <Button label="Add sample photos" variant="secondary" onPress={() => runImport(importSamples)} />
        <Button
          label="Show the intro again"
          variant="ghost"
          onPress={() => {
            setAbout(false);
            router.push('/onboarding');
          }}
        />
      </Sheet>

      <Sheet
        visible={pendingDelete !== null}
        title="Remove this photo?"
        onClose={() => {
          if (!removing) setPendingDelete(null);
        }}>
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }}>
          It leaves your shelf and any boards. The original in your photo library stays where it is.
        </Text>
        <Button
          label={removing ? 'Removing…' : 'Remove from shelf'}
          variant="danger"
          disabled={removing}
          onPress={() => {
            if (!pendingDelete || removing) return;
            const id = pendingDelete;
            setRemoving(true);
            deletePhoto(id)
              .then(() => setPendingDelete(null))
              .finally(() => setRemoving(false));
          }}
        />
        <Button label="Keep photo" variant="secondary" onPress={() => setPendingDelete(null)} disabled={removing} />
      </Sheet>
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.filter,
        {
          backgroundColor: selected ? (theme.mode === 'dark' ? '#C9B8FF' : theme.accent) : theme.card,
          borderColor: selected ? 'transparent' : theme.border,
        },
      ]}>
      <Text
        style={{
          color: selected ? (theme.mode === 'dark' ? '#1A1524' : '#FFFFFF') : theme.text,
          fontFamily: fonts.medium,
          fontSize: 13,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 32, lineHeight: 36 },
  sub: { marginTop: 2, fontSize: 14 },
  filters: { gap: 8, paddingRight: 8 },
  filter: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gridRow: { flexDirection: 'row' },
  tile: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#221F2A' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%' },
  tileTags: { position: 'absolute', left: 6, right: 6, bottom: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tileDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,8,13,0.62)',
  },
});
