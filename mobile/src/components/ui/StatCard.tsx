import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';

type StatCardProps = {
  value: string;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({ value, label, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 5,
  },
  value: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
    lineHeight: 27,
    color: Colors.palette.green,
    textAlign: 'center',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
