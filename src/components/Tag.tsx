import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, tagColor, useTheme } from '@/src/theme';
import { vibeLabel, type VibeId } from '@/src/vibe/analyze';

export function Tag({
  id,
  onPress,
  selected = false,
  onPhoto = false,
}: {
  id: VibeId;
  onPress?: () => void;
  selected?: boolean;
  onPhoto?: boolean;
}) {
  const theme = useTheme();
  const tone = onPhoto ? '#F6F3EE' : tagColor(id, theme.mode);
  const body = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? (theme.mode === 'dark' ? '#C9B8FF' : theme.accent) : onPhoto ? 'rgba(9,8,13,0.45)' : theme.card,
          borderColor: selected ? 'transparent' : theme.border,
        },
      ]}>
      <View style={[styles.dot, { backgroundColor: selected ? theme.accentInk : tone }]} />
      <Text
        style={{
          color: selected ? (theme.mode === 'dark' ? '#1A1524' : '#FFFFFF') : tone,
          fontFamily: fonts.medium,
          fontSize: 13,
        }}>
        {vibeLabel(id)}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Filter ${vibeLabel(id)}`} onPress={onPress}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
