import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Animated, Easing, AccessibilityInfo } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../lib/auth';
import { Colors, Fonts } from '../../constants/theme';
import {
  dropIn,
  fadeOut,
  revealQuickly,
  settleHidden,
  settleVisible,
} from '../../features/motion/application/entranceMotion';
import { SkippableIntroRegion } from '../../features/motion/presentation/SkippableIntroRegion';
import { SkippableIntroOverlay } from '../../features/motion/presentation/SkippableIntroOverlay';

type AuthAction = 'apple' | 'google' | 'discord';

const MOCK_AUTH_SUCCESS = {
  apple: false,
  google: true,
  discord: true,
} satisfies Record<AuthAction, boolean>;

function GoogleLogo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.3 5.3C37.1 39 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  );
}

export default function SignInScreen() {
  const { user, isLoading, signInWithMockProvider, signInWithApple, signInWithGoogleIdToken, signInWithDiscord } = useAuth();
  const insets = useSafeAreaInsets();
  const [authAction, setAuthAction] = useState<AuthAction | null>(null);
  const [isIntroSkippable, setIsIntroSkippable] = useState(false);
  const introAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const ebisuOpacity = useRef(new Animated.Value(0)).current;
  const ebisuLift = useRef(new Animated.Value(10)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeLift = useRef(new Animated.Value(8)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introLift = useRef(new Animated.Value(8)).current;
  const selectionOpacity = useRef(new Animated.Value(0)).current;
  const selectionLift = useRef(new Animated.Value(8)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsLift = useRef(new Animated.Value(8)).current;

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'placeholder',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'placeholder',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? 'placeholder',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (!id_token) {
        setAuthAction(null);
        Alert.alert('Sign in failed', 'Google did not return a token. Please try again.');
        return;
      }
      signInWithGoogleIdToken(id_token).catch(() => {
        setAuthAction(null);
        Alert.alert('Sign in failed', 'Could not sign in with Google. Please try again.');
      });
    } else if (googleResponse?.type === 'error') {
      setAuthAction(null);
      Alert.alert('Sign in failed', 'Could not sign in with Google. Please try again.');
    } else if (googleResponse) {
      setAuthAction(null);
    }
  }, [googleResponse, signInWithGoogleIdToken]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      let animation: Animated.CompositeAnimation | null = null;

      settleHidden({ opacity: ebisuOpacity, translateY: ebisuLift }, 10);
      settleHidden({ opacity: welcomeOpacity, translateY: welcomeLift }, 8);
      settleHidden({ opacity: introOpacity, translateY: introLift }, 8);
      settleHidden({ opacity: selectionOpacity, translateY: selectionLift }, 8);
      settleHidden({ opacity: actionsOpacity, translateY: actionsLift }, 8);
      setAuthAction(null);

      AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (!mounted) return;

        if (reduceMotion) {
          settleVisible({ opacity: ebisuOpacity, translateY: ebisuLift });
          settleHidden({ opacity: welcomeOpacity, translateY: welcomeLift }, 0);
          settleHidden({ opacity: introOpacity, translateY: introLift }, 0);
          settleVisible({ opacity: selectionOpacity, translateY: selectionLift });
          settleVisible({ opacity: actionsOpacity, translateY: actionsLift });
          setIsIntroSkippable(false);
          return;
        }

        setIsIntroSkippable(true);
        animation = Animated.sequence([
          dropIn({ opacity: ebisuOpacity, translateY: ebisuLift }, 760),
          Animated.delay(120),
          dropIn({ opacity: welcomeOpacity, translateY: welcomeLift }, 520),
          Animated.delay(2400),
          fadeOut({ opacity: welcomeOpacity, translateY: welcomeLift }, 320),
          Animated.delay(120),
          dropIn({ opacity: introOpacity, translateY: introLift }, 460),
          Animated.delay(2200),
          fadeOut({ opacity: introOpacity, translateY: introLift }, 320),
          Animated.delay(120),
          dropIn({ opacity: selectionOpacity, translateY: selectionLift }, 460),
          Animated.delay(700),
          dropIn({ opacity: actionsOpacity, translateY: actionsLift }, 460),
        ]);

        introAnimationRef.current = animation;
        animation.start(({ finished }) => {
          if (finished) setIsIntroSkippable(false);
        });
      });

      return () => {
        mounted = false;
        animation?.stop();
        introAnimationRef.current = null;
      };
    }, [
      actionsLift,
      actionsOpacity,
      ebisuLift,
      ebisuOpacity,
      introLift,
      introOpacity,
      selectionLift,
      selectionOpacity,
      welcomeLift,
      welcomeOpacity,
    ]),
  );

  const authLocked = authAction !== null || isLoading || !!user;

  const transitionAfterAuth = () => {
    Animated.stagger(90, [
      Animated.timing(actionsOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(selectionOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ebisuOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/onboarding');
    });
  };

  const completeMockAuth = async (action: AuthAction) => {
    if (authLocked) return;
    setAuthAction(action);
    await signInWithMockProvider(action);
    transitionAfterAuth();
  };

  const handleApple = async () => {
    if (authLocked) return;
    if (MOCK_AUTH_SUCCESS.apple) {
      await completeMockAuth('apple');
      return;
    }
    setAuthAction('apple');
    try {
      await signInWithApple();
      transitionAfterAuth();
    } catch (e: any) {
      setAuthAction(null);
      if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_CANCELED') {
        Alert.alert('Sign in failed', 'Could not sign in with Apple. Please try again.');
      }
    }
  };

  const handleGoogle = () => {
    if (authLocked) return;
    if (MOCK_AUTH_SUCCESS.google) {
      completeMockAuth('google');
      return;
    }
    if (!googleRequest) {
      Alert.alert('Not ready', 'Google sign in is still loading. Please try again.');
      return;
    }
    setAuthAction('google');
    promptGoogleAsync().catch(() => {
      setAuthAction(null);
      Alert.alert('Sign in failed', 'Could not open Google sign in. Please try again.');
    });
  };

  const handleDiscord = async () => {
    if (authLocked) return;
    if (MOCK_AUTH_SUCCESS.discord) {
      await completeMockAuth('discord');
      return;
    }
    setAuthAction('discord');
    try {
      await signInWithDiscord();
    } catch (e: any) {
      setAuthAction(null);
      if (!e?.message?.toLowerCase?.().includes('cancelled')) {
        Alert.alert('Sign in failed', 'Could not sign in with Discord. Please try again.');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <SkippableIntroRegion enabled={isIntroSkippable} onSkip={() => {
          if (!isIntroSkippable) return;
          introAnimationRef.current?.stop();
          introAnimationRef.current = Animated.parallel([
            fadeOut({ opacity: welcomeOpacity, translateY: welcomeLift }, 220),
            fadeOut({ opacity: introOpacity, translateY: introLift }, 220),
            revealQuickly([
              { opacity: ebisuOpacity, translateY: ebisuLift },
              { opacity: selectionOpacity, translateY: selectionLift },
              { opacity: actionsOpacity, translateY: actionsLift },
            ], 280),
          ]);
          introAnimationRef.current.start(() => {
            setIsIntroSkippable(false);
            introAnimationRef.current = null;
          });
        }} style={styles.introRegion}>
          <Animated.View style={[styles.ebisuWrap, { opacity: ebisuOpacity, transform: [{ translateY: ebisuLift }] }]}>
          <Image
            source={require('../../../assets/ebisu-sitting-transparent.png')}
            style={styles.ebisuMark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          </Animated.View>

          <View style={styles.promptSlot}>
          <Animated.View style={[styles.prompt, { opacity: welcomeOpacity, transform: [{ translateY: welcomeLift }] }]}>
            <Text style={styles.promptText}>Welcome, keeper of this household.</Text>
          </Animated.View>

          <Animated.View style={[styles.prompt, { opacity: introOpacity, transform: [{ translateY: introLift }] }]}>
            <Text style={styles.promptText}>
              I am <Text style={styles.ebisuName}>Ebisu</Text>, the god of fortune and business.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.prompt, { opacity: selectionOpacity, transform: [{ translateY: selectionLift }] }]}>
            <Text style={styles.promptText}>Prosperity begins with knowing who enters.</Text>
          </Animated.View>
          </View>
        </SkippableIntroRegion>

        <Animated.View style={[styles.actions, { opacity: actionsOpacity, transform: [{ translateY: actionsLift }] }]}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.btnApple, authLocked && styles.btnDisabled]}
            onPress={handleApple}
            activeOpacity={0.85}
            disabled={authLocked}
            accessibilityRole="button"
            accessibilityLabel="Identify with Apple"
          >
            <MaterialIcons name="apple" size={23} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, styles.btnGoogle, (authLocked || !googleRequest) && styles.btnDisabled]}
            onPress={handleGoogle}
            activeOpacity={0.85}
            disabled={authLocked || !googleRequest}
            accessibilityRole="button"
            accessibilityLabel="Identify with Google"
          >
            <GoogleLogo />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, styles.btnDiscord, authLocked && styles.btnDisabled]}
            onPress={handleDiscord}
            activeOpacity={0.85}
            disabled={authLocked}
            accessibilityRole="button"
            accessibilityLabel="Identify with Discord"
          >
            <FontAwesome6 name="discord" size={21} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>

      </View>
      <SkippableIntroOverlay enabled={isIntroSkippable} onSkip={() => {
        if (!isIntroSkippable) return;
        introAnimationRef.current?.stop();
        introAnimationRef.current = Animated.parallel([
          fadeOut({ opacity: welcomeOpacity, translateY: welcomeLift }, 220),
          fadeOut({ opacity: introOpacity, translateY: introLift }, 220),
          revealQuickly([
            { opacity: ebisuOpacity, translateY: ebisuLift },
            { opacity: selectionOpacity, translateY: selectionLift },
            { opacity: actionsOpacity, translateY: actionsLift },
          ], 280),
        ]);
        introAnimationRef.current.start(() => {
          setIsIntroSkippable(false);
          introAnimationRef.current = null;
        });
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introRegion: {
    width: '100%',
    height: '70%',
    alignItems: 'center',
  },
  ebisuWrap: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ebisuMark: {
    width: '100%',
    height: '100%',
  },
  promptSlot: {
    width: '100%',
    minHeight: 58,
    marginTop: -12,
    position: 'relative',
  },
  prompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  ebisuName: {
    color: Colors.palette.green,
    fontFamily: Fonts.heading,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 22,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  btnApple: { backgroundColor: Colors.palette.midnightIndigo },
  btnGoogle: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
  },
  btnDiscord: { backgroundColor: '#5865F2' },
  btnDisabled: { opacity: 0.55 },
  legal: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});
