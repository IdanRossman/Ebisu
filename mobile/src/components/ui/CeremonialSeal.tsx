import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Fonts } from '../../constants/theme';

type Props = {
  style?: ViewStyle;
};

export function CeremonialSeal({ style }: Props) {
  return (
    <View style={[styles.seal, style]}>
      <View style={styles.innerRing}>
        <Text style={styles.glyph}>福</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,162,76,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212,162,76,0.48)',
  },
  innerRing: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(227,197,110,0.28)',
  },
  glyph: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    lineHeight: 17,
    color: '#E3C56E',
  },
});
