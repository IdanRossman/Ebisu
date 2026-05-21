import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { useAuth } from '../../lib/auth';
import {
  CURRENCY_OPTIONS,
  DISPLAY_NAME_KEY,
  GUIDANCE_GOALS_KEY,
  HOUSEHOLD_CURRENCY_KEY,
  ONBOARDING_COMPLETE_KEY,
} from '../../lib/budget';
import { supabase } from '../../lib/supabase';
import { CurrencyCode } from '../../types';
import { completeOnboardingRemote } from '../../features/onboarding/application/onboardingApi';
import {
  dropIn,
  fadeOut,
  revealQuickly,
  settleHidden,
  settleVisible,
} from '../../features/motion/application/entranceMotion';
import { SkippableIntroRegion } from '../../features/motion/presentation/SkippableIntroRegion';
import { SkippableIntroOverlay } from '../../features/motion/presentation/SkippableIntroOverlay';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
};

type OnboardingStage = 'name' | 'confirm' | 'currency';

type OnboardingData = {
  displayName: string;
  currency: CurrencyCode | null;
};

export default function OnboardingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditing = mode === 'edit';
  const { user } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    displayName: '',
    currency: null,
  });
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<OnboardingStage>('name');
  const [confirmedName, setConfirmedName] = useState('');
  const [isIntroSkippable, setIsIntroSkippable] = useState(false);
  const introAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const ebisuOpacity = useRef(new Animated.Value(0)).current;
  const ebisuDrop = useRef(new Animated.Value(-12)).current;
  const promptOpacity = useRef(new Animated.Value(0)).current;
  const promptDrop = useRef(new Animated.Value(-10)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputDrop = useRef(new Animated.Value(-10)).current;
  const confirmOpacity = useRef(new Animated.Value(0)).current;
  const confirmDrop = useRef(new Animated.Value(-10)).current;
  const currencyOpacity = useRef(new Animated.Value(0)).current;
  const currencyDrop = useRef(new Animated.Value(-10)).current;
  const currencyAnimations = useRef(
    CURRENCY_OPTIONS.map(() => ({
      opacity: new Animated.Value(0),
      drop: new Animated.Value(-8),
    })),
  ).current;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      if (reduceMotion) {
        settleVisible({ opacity: ebisuOpacity, translateY: ebisuDrop });
        settleVisible({ opacity: promptOpacity, translateY: promptDrop });
        settleVisible({ opacity: inputOpacity, translateY: inputDrop });
        settleHidden({ opacity: confirmOpacity, translateY: confirmDrop }, 0);
        settleHidden({ opacity: currencyOpacity, translateY: currencyDrop }, 0);
        setIsIntroSkippable(false);
        return;
      }

      setIsIntroSkippable(true);
      animation = Animated.sequence([
        dropIn({ opacity: ebisuOpacity, translateY: ebisuDrop }),
        Animated.delay(140),
        dropIn({ opacity: promptOpacity, translateY: promptDrop }),
        Animated.delay(620),
        dropIn({ opacity: inputOpacity, translateY: inputDrop }),
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
    confirmDrop,
    confirmOpacity,
    currencyDrop,
    currencyOpacity,
    ebisuDrop,
    ebisuOpacity,
    inputDrop,
    inputOpacity,
    promptDrop,
    promptOpacity,
  ]);

  const showCurrencyStage = () => {
    setStage('currency');
    currencyOpacity.setValue(0);
    currencyDrop.setValue(-10);
    currencyAnimations.forEach(({ opacity, drop }) => {
      opacity.setValue(0);
      drop.setValue(-8);
    });

    Animated.sequence([
      dropIn({ opacity: currencyOpacity, translateY: currencyDrop }),
      Animated.stagger(
        90,
        currencyAnimations.map(({ opacity, drop }) => dropIn({ opacity, translateY: drop })),
      ),
    ]).start();
  };

  const handleContinue = async () => {
    const cleanName = onboardingData.displayName.trim();
    if (!cleanName) {
      Alert.alert('Name required', 'Tell me what name to keep for you.');
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(DISPLAY_NAME_KEY, cleanName);
      setOnboardingData((current) => ({ ...current, displayName: cleanName }));
      setConfirmedName(cleanName);
      setSaving(false);

      Animated.parallel([
        fadeOut({ opacity: promptOpacity, translateY: promptDrop }),
        fadeOut({ opacity: inputOpacity, translateY: inputDrop }),
      ]).start(() => {
        setStage('confirm');
        confirmOpacity.setValue(0);
        confirmDrop.setValue(-10);

        Animated.sequence([
          dropIn({ opacity: confirmOpacity, translateY: confirmDrop }),
          Animated.delay(1400),
          fadeOut({ opacity: confirmOpacity, translateY: confirmDrop }),
        ]).start(showCurrencyStage);
      });
    } catch {
      Alert.alert('Could not save', 'Please try again in a moment.');
      setSaving(false);
    }
  };

  const completeOnboarding = async (currency: CurrencyCode) => {
    const cleanName = onboardingData.displayName.trim();
    setSaving(true);
    setOnboardingData((current) => ({ ...current, currency }));

    try {
      await AsyncStorage.multiSet([
        [DISPLAY_NAME_KEY, cleanName],
        [GUIDANCE_GOALS_KEY, JSON.stringify([])],
        [HOUSEHOLD_CURRENCY_KEY, currency],
        [ONBOARDING_COMPLETE_KEY, 'true'],
      ]);
      if (user && user.id !== 'prototype-user') {
        await completeOnboardingRemote({
          displayName: cleanName,
          guidanceGoals: [],
          currencyCode: currency,
        });

        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            name: cleanName,
            display_name: cleanName,
            guidance_goals: [],
            household_currency: currency,
            onboarding_complete: true,
          },
        });
        if (error) throw error;
      }

      router.replace('/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again in a moment.';
      Alert.alert('Could not save', message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <SkippableIntroRegion enabled={isIntroSkippable} onSkip={() => {
            if (!isIntroSkippable) return;
            introAnimationRef.current?.stop();
            introAnimationRef.current = revealQuickly([
              { opacity: ebisuOpacity, translateY: ebisuDrop },
              { opacity: promptOpacity, translateY: promptDrop },
              { opacity: inputOpacity, translateY: inputDrop },
            ], 280);
            introAnimationRef.current.start(() => {
              setIsIntroSkippable(false);
              introAnimationRef.current = null;
            });
          }} style={styles.introRegion}>
            <Animated.View style={[styles.ebisuScene, { opacity: ebisuOpacity, transform: [{ translateY: ebisuDrop }] }]}>
              <Image
                source={require('../../../assets/ebisu-reading-transparent.png')}
                style={styles.ebisuImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </Animated.View>

            {stage === 'name' && (
              <Animated.View style={[styles.promptBlock, { opacity: promptOpacity, transform: [{ translateY: promptDrop }] }]}>
                <Text style={styles.promptText}>
                  {isEditing ? 'What name should I keep?' : 'What shall I call you?'}
                </Text>
              </Animated.View>
            )}
          </SkippableIntroRegion>

          {stage === 'name' && (
            <Animated.View style={[styles.inputBlock, { opacity: inputOpacity, transform: [{ translateY: inputDrop }] }]}>
              <Text style={styles.assistLabel}>
                This is how <Text style={styles.ebisuWord}>Ebisu</Text> will address you in the app.
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={onboardingData.displayName}
                  onChangeText={(displayName) => setOnboardingData((current) => ({ ...current, displayName }))}
                  placeholder="Your name"
                  placeholderTextColor={`${Colors.textSecondary}80`}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={24}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  style={styles.nameInput}
                />
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.85}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={isEditing ? 'Keep this name' : 'Continue with this name'}
                  style={[styles.keepButton, saving && styles.keepButtonDisabled]}
                >
                  <MaterialIcons name="arrow-forward" size={22} color={Colors.palette.green} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {stage === 'confirm' && (
            <Animated.View style={[styles.confirmBlock, { opacity: confirmOpacity, transform: [{ translateY: confirmDrop }] }]}>
              <Text style={styles.promptText}>It is a pleasure to meet you, {confirmedName}.</Text>
            </Animated.View>
          )}

          {stage === 'currency' && (
            <>
              <Animated.View style={[styles.currencyPromptBlock, { opacity: currencyOpacity, transform: [{ translateY: currencyDrop }] }]}>
                <Text style={styles.promptText}>Which coin should this household count in?</Text>
              </Animated.View>

              <View style={styles.currencyBlock}>
                {CURRENCY_OPTIONS.map((option, index) => (
                  <Animated.View
                    key={option.code}
                    style={{
                      opacity: currencyAnimations[index].opacity,
                      transform: [{ translateY: currencyAnimations[index].drop }],
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => completeOnboarding(option.code)}
                      activeOpacity={0.82}
                      disabled={saving}
                      style={[styles.currencyButton, saving && styles.keepButtonDisabled]}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${option.label}`}
                    >
                      <Text style={styles.currencySymbol}>{CURRENCY_SYMBOLS[option.code]}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      <SkippableIntroOverlay enabled={isIntroSkippable} onSkip={() => {
        if (!isIntroSkippable) return;
        introAnimationRef.current?.stop();
        introAnimationRef.current = revealQuickly([
          { opacity: ebisuOpacity, translateY: ebisuDrop },
          { opacity: promptOpacity, translateY: promptDrop },
          { opacity: inputOpacity, translateY: inputDrop },
        ], 280);
        introAnimationRef.current.start(() => {
          setIsIntroSkippable(false);
          introAnimationRef.current = null;
        });
      }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  introRegion: {
    width: '100%',
  },
  ebisuScene: {
    width: '100%',
    height: 285,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ebisuImage: {
    width: '100%',
    height: '100%',
  },
  promptBlock: {
    alignItems: 'center',
    minHeight: 58,
    justifyContent: 'center',
  },
  promptText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  assistLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  ebisuWord: {
    fontFamily: Fonts.heading,
    color: Colors.palette.green,
  },
  inputBlock: {
    marginTop: 18,
    marginBottom: 8,
  },
  confirmBlock: {
    alignItems: 'center',
    minHeight: 58,
    justifyContent: 'center',
    marginTop: 18,
  },
  currencyPromptBlock: {
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    paddingHorizontal: 18,
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.text.primary,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  keepButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  keepButtonDisabled: {
    opacity: 0.55,
  },
  currencyBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  currencyButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
  },
  currencySymbol: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Colors.palette.green,
    textAlign: 'center',
  },
});
