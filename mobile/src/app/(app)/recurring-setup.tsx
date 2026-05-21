import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts, Radius } from '../../constants/theme';

function dropIn(opacity: Animated.Value, translateY: Animated.Value) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
}

export default function RecurringSetupScreen() {
  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const sceneDrop = useRef(new Animated.Value(-12)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentDrop = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        sceneOpacity.setValue(1);
        sceneDrop.setValue(0);
        contentOpacity.setValue(1);
        contentDrop.setValue(0);
        return;
      }
      Animated.sequence([
        dropIn(sceneOpacity, sceneDrop),
        Animated.delay(160),
        dropIn(contentOpacity, contentDrop),
      ]).start();
    });
    return () => {
      mounted = false;
    };
  }, [contentDrop, contentOpacity, sceneDrop, sceneOpacity]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Animated.View style={[styles.scene, { opacity: sceneOpacity, transform: [{ translateY: sceneDrop }] }]}>
          <Image
            source={require('../../../assets/ebisu-reading-transparent.png')}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>

        <Animated.View style={[styles.message, { opacity: contentOpacity, transform: [{ translateY: contentDrop }] }]}>
          <Text style={styles.prompt}>Which obligations return to your door?</Text>
          <Text style={styles.support}>
            The vessels are ready. Recurring expenses will be shaped here next.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/home')} style={styles.button}>
            <Text style={styles.buttonText}>Continue to home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scene: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  message: {
    alignItems: 'center',
    gap: 10,
  },
  prompt: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  support: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    minHeight: 48,
    minWidth: 180,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
  },
  buttonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.palette.green,
  },
});
