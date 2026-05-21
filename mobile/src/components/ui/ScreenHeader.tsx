import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Colors, Space, Typography } from '../../constants/theme';
import { BackButtonPlaceholder } from './BackButton';

type ScreenHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export function ScreenHeader({
  title,
  left,
  right = <BackButtonPlaceholder />,
  bordered = true,
  style,
  titleStyle,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, bordered && styles.bordered, style]}>
      {left ?? <BackButtonPlaceholder />}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space['2xl'],
    paddingVertical: Space.lg,
    backgroundColor: Colors.surface.background,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.stroke.default,
  },
  title: {
    ...Typography.button,
    color: Colors.text.primary,
  },
});
