import { Pressable, StyleSheet } from 'react-native';

type Props = {
  enabled: boolean;
  onSkip: () => void;
};

export function SkippableIntroOverlay({ enabled, onSkip }: Props) {
  if (!enabled) return null;

  return (
    <Pressable
      onPress={onSkip}
      style={StyleSheet.absoluteFill}
      accessibilityRole="button"
      accessibilityLabel="Skip introduction"
    />
  );
}
