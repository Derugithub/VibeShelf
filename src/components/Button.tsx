import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tap } from '@/src/haptics';
import { fonts, useTheme } from '@/src/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.mode === 'dark' ? '#C9B8FF' : theme.accent, fg: theme.mode === 'dark' ? '#1A1524' : '#FFFFFF', border: 'transparent' },
    secondary: { bg: theme.card, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.textSoft, border: 'transparent' },
    danger: { bg: 'transparent', fg: theme.danger, border: theme.border },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, { color: palette.fg, fontFamily: fonts.semibold }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
  icon: {
    marginTop: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
