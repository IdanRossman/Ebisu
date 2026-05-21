import { ReactNode, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Opacity, Radius } from '../../constants/theme';

type JewelButtonProps = {
  label?: string;
  onPress: () => void;
  children?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  touchableStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  accessibilityLabel?: string;
};

export function JewelButton({
  label,
  onPress,
  children,
  disabled = false,
  style,
  touchableStyle,
  textStyle,
  activeOpacity = Opacity.buttonPressed,
  accessibilityLabel,
}: JewelButtonProps) {
  const shimmerTranslate = useRef(new Animated.Value(-260)).current;

  useEffect(() => {
    if (disabled) return;

    let mounted = true;
    let shimmer: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;

      shimmerTranslate.setValue(-260);
      shimmer = Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(shimmerTranslate, {
            toValue: 260,
            duration: 1150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(1800),
          Animated.timing(shimmerTranslate, {
            toValue: -260,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      shimmer.start();
    });

    return () => {
      mounted = false;
      shimmer?.stop();
    };
  }, [disabled, shimmerTranslate]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={touchableStyle}
    >
      <LinearGradient
        colors={disabled ? [Colors.action.disabled, Colors.action.disabled] : [Colors.action.primary, Colors.action.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, style]}
      >
        {children ?? <Text style={[styles.text, textStyle]}>{label}</Text>}
        {!disabled && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }, { rotate: '18deg' }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.72)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 220,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  text: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.inverse,
  },
  shimmer: {
    position: 'absolute',
    top: -16,
    bottom: -16,
    width: 74,
  },
});
