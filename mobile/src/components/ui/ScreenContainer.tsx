import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Space } from '../../constants/theme';

type ScreenContainerProps = {
  children: ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ children, padded = false, style, contentStyle }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={[styles.content, padded && styles.padded, contentStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  content: {
    flex: 1,
  },
  padded: {
    flex: 1,
    paddingHorizontal: Space['2xl'],
  },
});
