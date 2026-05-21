import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Colors, Fonts } from '../../../constants/theme';

type Props = {
  selected: boolean;
};

export function SelectionSeal({ selected }: Props) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.96)).current;
  const glyphOpacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: selected ? 1 : 0.96,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(glyphOpacity, {
        toValue: selected ? 1 : 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [glyphOpacity, scale, selected]);

  return (
    <Animated.View style={[styles.seal, selected && styles.sealSelected, { transform: [{ scale }] }]}>
      <Animated.View style={{ opacity: glyphOpacity }}>
        <Text style={styles.sealText}>巡</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  seal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  sealSelected: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: Colors.palette.green,
  },
  sealText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.text.inverse,
  },
});
