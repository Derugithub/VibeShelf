import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { fonts, useTheme } from '@/src/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Missing', headerShown: true }} />
      <Link href="/" style={[styles.wrap, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>That page is not on the shelf.</Text>
        <Text style={[styles.link, { color: theme.accent, fontFamily: fonts.medium }]}>Back home</Text>
      </Link>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  link: {
    fontSize: 16,
  },
});
