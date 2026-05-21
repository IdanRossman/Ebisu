import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../../constants/theme';

type Props = {
  stepLabel: string;
  onBack?: () => void;
  onForward?: () => void;
  forwardDisabled?: boolean;
};

export function BudgetFlowHeader({
  stepLabel,
  onBack,
  onForward,
  forwardDisabled = false,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.78}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={20} color={Colors.palette.green} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.stepLabel}>{stepLabel}</Text>

      <View style={[styles.side, styles.sideEnd]}>
        {onForward ? (
          <TouchableOpacity
            onPress={onForward}
            activeOpacity={0.78}
            disabled={forwardDisabled}
            style={[styles.iconButton, forwardDisabled && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Go forward"
          >
            <MaterialIcons name="arrow-forward" size={20} color={Colors.palette.green} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  side: {
    width: 42,
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  stepLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.palette.green,
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  disabled: {
    opacity: 0.45,
  },
});
