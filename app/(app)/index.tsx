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
import { VIBE_IDS, vibeLabel, type VibeId } from '@/src/vibe/analyze';

export default function LibraryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { photos, importFromLibrary, importFromCamera, importSamples } = useLibrary();
  const [filter, setFilter] = useState<VibeId | 'all'>('all');
  const [about, setAbout] = useState(false);

  const present = useMemo(() => {
    const tags = new Set<VibeId>();
    photos.forEach((photo) => photo.tags.forEach((tag) => tags.add(tag)));
    return VIBE_IDS.filter((tag) => tags.has(tag));
  }, [photos]);

  const visible = filter === 'all' ? photos : photos.filter((photo) => photo.tags.includes(filter));
  const tile = (width - 20 * 2 - 10) / 2;

  async function runImport(action: () => Promise<{ status: string; added: number; failed: number }>) {
    let outcome: { status: string; added: number; failed: number };
    try {
      outcome = await action();
    } catch {
      Alert.alert('Could not add photos', 'Something went wrong reading those pictures on this device.');
      return;
    }
    if (outcome.failed > 0) {
      Alert.alert(
        'Some photos were skipped',
        outcome.added
          ? `${outcome.added} added. ${outcome.failed} could not be read on this device.`
          : 'Those photos could not be read on this device.',
      );
    } else if (outcome.status === 'empty' && outcome.added === 0) {
      Alert.alert('Nothing new', 'Those photos are already on your shelf, or none could be added.');
    }
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 28,
          gap: 18,
        }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.wordmark, { color: theme.text, fontFamily: fonts.display }]}>VibeShelf</Text>
            <Text style={[styles.sub, { color: theme.textSoft, fontFamily: fonts.body }]}>
              {photos.length === 0 ? 'On this device' : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} on this device`}
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
            body="Import a photo, take one, or drop in a sample set. Tags are read from the pixels here. The pictures never leave the phone.">
            <Button label="Choose photos" onPress={() => runImport(importFromLibrary)} icon={<Icon name="image" color={theme.mode === 'dark' ? '#1A1524' : '#FFFFFF'} size={18} />} />
            <Button label="Take a photo" variant="secondary" onPress={() => runImport(importFromCamera)} icon={<Icon name="camera" color={theme.text} size={18} />} />
            <Button label="Add sample photos" variant="ghost" onPress={() => runImport(importSamples)} />
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState title={`No ${vibeLabel(filter as VibeId).toLowerCase()} photos`} body="Try another vibe, or add a picture with a different kind of light." />
        ) : (
          <View style={styles.grid}>
            {visible.map((photo) => (
              <Pressable
                key={photo.id}
                accessibilityRole="button"
                accessibilityLabel={`Open photo tagged ${photo.tags.map(vibeLabel).join(', ')}`}
                onPress={() => router.push(`/photo/${photo.id}` as Href)}
                style={({ pressed }) => [styles.tile, { width: tile, height: tile, opacity: pressed ? 0.88 : 1 }]}>
                <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
                <LinearGradient colors={['transparent', 'rgba(9,8,13,0.78)']} style={styles.scrim} />
                <View style={styles.tileTags}>
                  {photo.tags.slice(0, 2).map((tag) => (
                    <Tag key={tag} id={tag} onPhoto />
                  ))}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={about} title="About this shelf" onClose={() => setAbout(false)}>
        <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }}>
          Vibe tags come from on-device color and brightness. Nothing is sent to a server. Boards and copies of your
          photos live in app storage on this phone.
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
  wordmark: { fontSize: 34, lineHeight: 38 },
  sub: { marginTop: 2, fontSize: 14 },
  filters: { gap: 8, paddingRight: 8 },
  filter: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#221F2A' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%' },
  tileTags: { position: 'absolute', left: 8, right: 8, bottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
