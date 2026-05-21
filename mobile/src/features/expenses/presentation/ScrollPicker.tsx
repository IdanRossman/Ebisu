import { useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../../../constants/theme';

const ITEM_HEIGHT = 36;
const VISIBLE = 3;

type Props = {
  items: { value: number; label: string }[];
  selectedValue: number;
  onSelect: (value: number) => void;
};

export function ScrollPicker({ items, selectedValue, onSelect }: Props) {
  const ref = useRef<ScrollView>(null);
  const initialized = useRef(false);

  const scrollToIndex = (index: number, animated: boolean) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  };

  const handleLayout = () => {
    if (initialized.current) return;
    initialized.current = true;
    const idx = items.findIndex((i) => i.value === selectedValue);
    scrollToIndex(idx >= 0 ? idx : 0, false);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    onSelect(items[clamped].value);
  };

  return (
    <View style={styles.root}>
      <View style={styles.highlight} />
      <ScrollView
        ref={ref}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.value}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(item.value);
              scrollToIndex(index, true);
            }}
          >
            <Text style={[styles.label, item.value === selectedValue && styles.labelSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: ITEM_HEIGHT * VISIBLE,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(79,175,143,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.22)',
  },
  content: {
    paddingVertical: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  labelSelected: {
    color: Colors.palette.green,
    fontSize: 14,
  },
});
