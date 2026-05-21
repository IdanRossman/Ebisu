import { PropsWithChildren } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

type Props = PropsWithChildren<{
  enabled: boolean;
  onSkip: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function SkippableIntroRegion({ enabled, onSkip, style, children }: Props) {
  return (
    <Pressable
      disabled={!enabled}
      onPress={onSkip}
      style={style}
      accessibilityRole={enabled ? 'button' : undefined}
      accessibilityLabel={enabled ? 'Skip introduction' : undefined}
    >
      {children}
    </Pressable>
  );
}
