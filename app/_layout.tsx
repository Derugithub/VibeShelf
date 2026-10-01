import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { LibraryProvider, useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <LibraryProvider>
      <RootGate />
    </LibraryProvider>
  );
}

function RootGate() {
  const theme = useTheme();
  const { ready, activity } = useLibrary();
  const [loaded, error] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, ready]);

  if (!loaded || !ready) return null;

  const navigationTheme =
    theme.mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.bg,
            card: theme.bg,
            text: theme.text,
            border: theme.border,
            primary: theme.accent,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: theme.bg,
            card: theme.bg,
            text: theme.text,
            border: theme.border,
            primary: theme.accent,
          },
        };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.status} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="photo/[id]" />
        <Stack.Screen name="board/[id]" />
      </Stack>
      {activity ? (
        <View style={[styles.activity, { backgroundColor: theme.scrim }]} pointerEvents="auto">
          <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator color={theme.accent} />
            <Text style={{ color: theme.text, fontFamily: fonts.medium, fontSize: 16 }}>{activity}</Text>
          </View>
        </View>
      ) : null}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  activity: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  activityCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
