import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { indexAfterDrag } from '@/src/arrange';
import { IconButton } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { Tag } from '@/src/components/Tag';
import { fonts, useTheme } from '@/src/theme';
import type { Photo } from '@/src/types';
import { normalizeTags } from '@/src/vibe/analyze';

export function ArrangeList({
  photos,
  onReorder,
  onRemove,
  onDraggingChange,
}: {
  photos: Photo[];
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const theme = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const [dy, setDy] = useState(0);
  const heights = useRef<number[]>([]);

  return (
    <View style={styles.list}>
      <Text style={{ color: theme.textSoft, fontFamily: fonts.body, fontSize: 14 }}>
        Drag a photo, or use the arrows.
      </Text>
      {photos.map((photo, index) => (
        <ArrangeRow
          key={photo.id}
          photo={photo}
          index={index}
          count={photos.length}
          dragging={active === index}
          offset={active === index ? dy : 0}
          onLayout={(height) => {
            heights.current[index] = height;
          }}
          onDragStart={() => {
            setActive(index);
            setDy(0);
            onDraggingChange?.(true);
          }}
          onDragMove={setDy}
          onDragEnd={(delta) => {
            const span = (heights.current[index] || 80) + 10;
            const next = indexAfterDrag(index, delta, span, photos.length);
            setActive(null);
            setDy(0);
            onDraggingChange?.(false);
            if (next !== index) onReorder(index, next);
          }}
          onMove={(direction) => {
            const next = index + direction;
            if (next >= 0 && next < photos.length) onReorder(index, next);
          }}
          onRemove={() => onRemove(photo.id)}
        />
      ))}
    </View>
  );
}

function ArrangeRow({
  photo,
  index,
  count,
  dragging,
  offset,
  onLayout,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMove,
  onRemove,
}: {
  photo: Photo;
  index: number;
  count: number;
  dragging: boolean;
  offset: number;
  onLayout: (height: number) => void;
  onDragStart: () => void;
  onDragMove: (dy: number) => void;
  onDragEnd: (dy: number) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const dragEnd = useRef(onDragEnd);
  const dragMove = useRef(onDragMove);
  const dragStart = useRef(onDragStart);
  dragEnd.current = onDragEnd;
  dragMove.current = onDragMove;
  dragStart.current = onDragStart;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => dragStart.current(),
      onPanResponderMove: (_, gesture) => dragMove.current(gesture.dy),
      onPanResponderRelease: (_, gesture) => dragEnd.current(gesture.dy),
      onPanResponderTerminate: () => dragEnd.current(0),
    }),
  ).current;

  return (
    <View
      onLayout={(event) => onLayout(event.nativeEvent.layout.height)}
      style={[
        styles.row,
        {
          backgroundColor: dragging ? theme.bgElevated : theme.card,
          borderColor: dragging ? theme.accent : theme.border,
          transform: [{ translateY: offset }],
          zIndex: dragging ? 3 : 0,
          elevation: dragging ? 8 : 0,
        },
      ]}>
      <View
        {...pan.panHandlers}
        accessibilityLabel="Drag to reorder"
        accessibilityHint="Move this photo up or down in the board"
        style={styles.drag}>
        <View style={styles.handle}>
          <View style={[styles.grip, { backgroundColor: theme.textFaint }]} />
          <View style={[styles.grip, { backgroundColor: theme.textFaint }]} />
          <View style={[styles.grip, { backgroundColor: theme.textFaint }]} />
        </View>
        <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.tags}>
          {normalizeTags(photo.tags)
            .slice(0, 2)
            .map((tag) => (
              <Tag key={tag} id={tag} />
            ))}
        </View>
      </View>
      <View style={styles.actions}>
        <IconButton label="Move earlier" onPress={() => onMove(-1)}>
          <Icon name="up" color={index === 0 ? theme.textFaint : theme.text} size={18} />
        </IconButton>
        <IconButton label="Move later" onPress={() => onMove(1)}>
          <Icon name="down" color={index === count - 1 ? theme.textFaint : theme.text} size={18} />
        </IconButton>
        <IconButton label="Remove from board" onPress={onRemove}>
          <Icon name="close" color={theme.danger} size={18} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    width: 22,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  grip: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { gap: 6 },
});
