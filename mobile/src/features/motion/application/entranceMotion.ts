import { Animated, Easing } from 'react-native';

export type MotionPair = {
  opacity: Animated.Value;
  translateY: Animated.Value;
};

export function dropIn({ opacity, translateY }: MotionPair, duration = 460) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
}

export function fadeOut({ opacity, translateY }: MotionPair, duration = 280) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: -8,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
}

export function settleVisible(pair: MotionPair) {
  pair.opacity.setValue(1);
  pair.translateY.setValue(0);
}

export function settleHidden(pair: MotionPair, offset = -8) {
  pair.opacity.setValue(0);
  pair.translateY.setValue(offset);
}

export function revealQuickly(pairs: MotionPair[], duration = 280) {
  return Animated.parallel(pairs.map((pair) => dropIn(pair, duration)));
}
