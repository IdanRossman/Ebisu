import { ComponentProps } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Opacity, Size } from '../../constants/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type BackButtonProps = {
  onPress?: () => void;
  color?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({
  onPress = () => router.back(),
  color = Colors.textPrimary,
  icon = 'arrow-back',
  style,
}: BackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]} activeOpacity={Opacity.pressed}>
      <MaterialIcons name={icon} size={22} color={color} />
    </TouchableOpacity>
  );
}

export function BackButtonPlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.button, style]} />;
}

const styles = StyleSheet.create({
  button: {
    width: Size.iconButton,
    height: Size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
