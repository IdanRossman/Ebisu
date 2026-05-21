import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Opacity, Radius, Size, Space, Typography } from '../../constants/theme';

type GradientButtonProps = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  showDisabledStyle?: boolean;
  children?: ReactNode;
  iconRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
  touchableStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabledTextStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
};

export function GradientButton({
  label,
  onPress,
  disabled = false,
  showDisabledStyle = disabled,
  children,
  iconRight,
  style,
  touchableStyle,
  textStyle,
  disabledTextStyle,
  activeOpacity = Opacity.buttonPressed,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={touchableStyle}
    >
      <LinearGradient
        colors={showDisabledStyle ? Gradients.disabled : Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, style]}
      >
        {children ?? (
          <>
            <Text style={[styles.text, textStyle, showDisabledStyle && [styles.textDisabled, disabledTextStyle]]}>
              {label}
            </Text>
            {iconRight}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Size.buttonHeight,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
  },
  text: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
  textDisabled: {
    color: Colors.text.secondary,
  },
});
