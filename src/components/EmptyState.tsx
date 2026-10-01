import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme } from '@/src/theme';

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text, fontFamily: fonts.display }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.textSoft, fontFamily: fonts.body }]}>{body}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    gap: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
});
