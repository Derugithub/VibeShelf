import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { Mark } from '@/src/components/Mark';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { onboarded, completeOnboarding } = useLibrary();
  const [page, setPage] = useState(0);

  async function finish() {
    if (!onboarded) await completeOnboarding();
    router.replace('/');
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg, paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Mark size={88} />
        {page === 0 ? (
          <>
            <Text style={[styles.eyebrow, { color: theme.accent, fontFamily: fonts.semibold }]}>Stays on this phone</Text>
            <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>
              A mood board with nowhere else to be.
            </Text>
            <Text style={[styles.body, { color: theme.textSoft, fontFamily: fonts.body }]}>
              VibeShelf looks at color and light and suggests words like warm, moody, or pastel. There is no account,
              and nothing leaves your phone.
            </Text>
            <Text style={[styles.fine, { color: theme.textFaint, fontFamily: fonts.body }]}>
              VibeShelf keeps its own copy. Removing a photo here leaves the original in your photo library.
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.eyebrow, { color: theme.accent, fontFamily: fonts.semibold }]}>How it works</Text>
            <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>Snap, tag, arrange, export.</Text>
            {[
              ['Add', 'Import from your library or take a photo.'],
              ['Tag', 'Each photo gets a few words from its color and light.'],
              ['Arrange', 'Pin photos to a board, reorder them, and export one collage.'],
            ].map(([title, body], index) => (
              <View key={title} style={styles.step}>
                <Text style={[styles.stepIndex, { color: theme.accent, fontFamily: fonts.semibold }]}>{index + 1}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.stepTitle, { color: theme.text, fontFamily: fonts.semibold }]}>{title}</Text>
                  <Text style={[styles.stepBody, { color: theme.textSoft, fontFamily: fonts.body }]}>{body}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.fine, { color: theme.textFaint, fontFamily: fonts.body }]}>
              Camera and photo access are asked only when you add a picture. If you skip that, you can still try the
              sample photos, and turn access on later in Settings.
            </Text>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.dots}>
          {[0, 1].map((dot) => (
            <Pressable
              key={dot}
              accessibilityRole="button"
              accessibilityLabel={`Intro page ${dot + 1}`}
              onPress={() => setPage(dot)}
              style={[
                styles.dot,
                { backgroundColor: dot === page ? theme.accent : theme.border, width: dot === page ? 22 : 8 },
              ]}
            />
          ))}
        </View>
        <Button
          label={page === 0 ? 'Next' : onboarded ? 'Back to the shelf' : 'Start your shelf'}
          onPress={() => {
            if (page === 0) setPage(1);
            else finish().catch(() => undefined);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12, gap: 14 },
  eyebrow: { letterSpacing: 0.4, textTransform: 'uppercase', fontSize: 13, marginTop: 8 },
  title: { fontSize: 38, lineHeight: 44 },
  body: { fontSize: 17, lineHeight: 25 },
  fine: { fontSize: 14, lineHeight: 21 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIndex: { width: 22, fontSize: 16, marginTop: 1 },
  stepTitle: { fontSize: 16 },
  stepBody: { fontSize: 15, lineHeight: 21 },
  footer: { paddingHorizontal: 24, paddingTop: 8, gap: 14 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 99 },
});
