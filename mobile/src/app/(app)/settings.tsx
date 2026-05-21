import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Space } from '../../constants/theme';
import { useAuth } from '../../lib/auth';
import {
  deleteAllBudgetPrototypeData,
  deleteBudgetPlan,
  CURRENCY_OPTIONS,
  DISPLAY_NAME_KEY,
  GUIDANCE_GOALS_KEY,
  HOUSEHOLD_CURRENCY_KEY,
  ONBOARDING_FIRST_PATH_KEY,
  ONBOARDING_COMPLETE_KEY,
} from '../../lib/budget';
import { GUEST_ID_KEY } from '../../lib/guestIdentity';
import type { CurrencyCode, HomeProgressScope, WeekStartsOn } from '../../types';
import { loadBudgetPlan, saveBudgetPlan } from '../../features/budget/infrastructure/budgetRepository';
import { updateRemoteBudgetPlan } from '../../features/budget/application/budgetApi';
import { loadBootstrap } from '../../features/bootstrap/application/bootstrapApi';
import { deleteCurrentProfileRemote, updateBudgetSpaceRemote, updateCurrentProfilePreferencesRemote } from '../../features/profiles/application/profileApi';
import {
  HOME_PROGRESS_SCOPE_KEY,
  loadHomeProgressScope,
  loadWeekStartsOn,
  saveHomeProgressScope,
  saveWeekStartsOn,
  WEEK_STARTS_ON_KEY,
} from '../../features/preferences/infrastructure/homePreferencesRepository';

function dropIn(opacity: Animated.Value, translateY: Animated.Value, duration = 460) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [savedDisplayName, setSavedDisplayName] = useState('');
  const [savedCurrency, setSavedCurrency] = useState<CurrencyCode | null>(null);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [homeProgressScope, setHomeProgressScope] = useState<HomeProgressScope>('living_money');
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStartsOn>('sunday');
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerDrop = useRef(new Animated.Value(-10)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyDrop = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Promise.all([
      loadBootstrap().catch(() => null),
      AsyncStorage.getItem(DISPLAY_NAME_KEY),
      AsyncStorage.getItem(HOUSEHOLD_CURRENCY_KEY),
      loadHomeProgressScope(),
      loadWeekStartsOn(),
    ]).then(([bootstrap, name, storedCurrency, storedScope, storedWeekStart]) => {
      const nextName = bootstrap?.profile?.display_name?.trim() || name?.trim() || '';
      const nextCurrency = (bootstrap?.currentPlan?.currency_code ?? bootstrap?.currentSpace?.currency_code ?? storedCurrency ?? null) as CurrencyCode | null;
      setDisplayName(nextName);
      setSavedDisplayName(nextName);
      setCurrency(nextCurrency);
      setSavedCurrency(nextCurrency);
      setCurrentSpaceId(bootstrap?.currentSpace?.id ?? null);
      setCurrentPlanId(bootstrap?.currentPlan?.id ?? null);
      if (nextName) AsyncStorage.setItem(DISPLAY_NAME_KEY, nextName);
      if (nextCurrency) AsyncStorage.setItem(HOUSEHOLD_CURRENCY_KEY, nextCurrency);
      setHomeProgressScope(bootstrap?.profile?.home_progress_scope ?? storedScope);
      setWeekStartsOn(bootstrap?.profile?.week_starts_on ?? storedWeekStart);
    });
  }, []);

  const householdChanged = displayName.trim() !== savedDisplayName || currency !== savedCurrency;

  const saveHouseholdSettings = useCallback(async () => {
    const nextName = displayName.trim();
    if (!nextName) {
      Alert.alert('Name needed', 'Give this household a display name.');
      return;
    }
    if (!currency) {
      Alert.alert('Coin needed', 'Choose the household coin.');
      return;
    }

    setSavingHousehold(true);
    try {
      await AsyncStorage.multiSet([
        [DISPLAY_NAME_KEY, nextName],
        [HOUSEHOLD_CURRENCY_KEY, currency],
      ]);
      await updateCurrentProfilePreferencesRemote({ displayName: nextName });
      if (currentSpaceId) {
        await updateBudgetSpaceRemote(currentSpaceId, { currencyCode: currency });
      }
      if (currentPlanId) {
        await updateRemoteBudgetPlan(currentPlanId, { currencyCode: currency });
      }
      const localPlan = await loadBudgetPlan();
      if (localPlan) {
        await saveBudgetPlan({ ...localPlan, currency });
      }
      setDisplayName(nextName);
      setSavedDisplayName(nextName);
      setSavedCurrency(currency);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again in a moment.';
      Alert.alert('Could not save household', message);
    } finally {
      setSavingHousehold(false);
    }
  }, [currentPlanId, currentSpaceId, currency, displayName, homeProgressScope, weekStartsOn]);

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerDrop.setValue(0);
        bodyOpacity.setValue(1);
        bodyDrop.setValue(0);
        return;
      }

      animation = Animated.sequence([
        dropIn(headerOpacity, headerDrop, 500),
        Animated.delay(130),
        dropIn(bodyOpacity, bodyDrop, 430),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [bodyDrop, bodyOpacity, headerDrop, headerOpacity]);

  const clearBudget = useCallback(() => {
    Alert.alert(
      'Clear this month?',
      'This removes the local prototype budget and returns you to setup.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
      await deleteBudgetPlan();
            router.replace('/budget-setup');
          },
        },
      ],
    );
  }, []);

  const resetPrototypeFlow = useCallback(() => {
    Alert.alert(
      'Reset the prototype?',
      'This clears local sign-in, onboarding, household coin, and budget data so you can test the first-run flow again.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              DISPLAY_NAME_KEY,
              GUIDANCE_GOALS_KEY,
              HOUSEHOLD_CURRENCY_KEY,
              ONBOARDING_FIRST_PATH_KEY,
              ONBOARDING_COMPLETE_KEY,
              GUEST_ID_KEY,
              HOME_PROGRESS_SCOPE_KEY,
              WEEK_STARTS_ON_KEY,
            ]);
            await deleteAllBudgetPrototypeData();
            await signOut();
            router.replace('/sign-in');
          },
        },
      ],
    );
  }, [signOut]);

  const deleteAccount = useCallback(() => {
    Alert.alert(
      'Delete this account?',
      'This permanently removes your profile, household, budgets, and sign-in account. This cannot be undone.',
      [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.id !== 'prototype-user') {
                await deleteCurrentProfileRemote();
              }
              await AsyncStorage.multiRemove([
                DISPLAY_NAME_KEY,
                GUIDANCE_GOALS_KEY,
                HOUSEHOLD_CURRENCY_KEY,
                ONBOARDING_FIRST_PATH_KEY,
                ONBOARDING_COMPLETE_KEY,
                GUEST_ID_KEY,
                HOME_PROGRESS_SCOPE_KEY,
                WEEK_STARTS_ON_KEY,
              ]);
              await deleteAllBudgetPrototypeData();
              await signOut();
              router.replace('/sign-in');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Please try again in a moment.';
              Alert.alert('Could not delete account', message);
            }
          },
        },
      ],
    );
  }, [signOut, user?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerDrop }] },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.78} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.palette.green} />
          </TouchableOpacity>
          <Text style={styles.ebisuLine}>
            Let <Text style={styles.ebisuWord}>Ebisu</Text> remember how this household is kept.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.body,
            { opacity: bodyOpacity, transform: [{ translateY: bodyDrop }] },
          ]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Household</Text>
            <View style={styles.editBlock}>
              <Text style={styles.detailLabel}>Display name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Household name"
                placeholderTextColor={`${Colors.textSecondary}70`}
                maxLength={48}
                style={styles.nameInput}
                selectTextOnFocus
              />
            </View>
            <View style={styles.editBlock}>
              <Text style={styles.detailLabel}>Household coin</Text>
              <View style={styles.coinGrid}>
                {CURRENCY_OPTIONS.map((option) => {
                  const selected = currency === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      onPress={() => setCurrency(option.code)}
                      activeOpacity={0.82}
                      style={[styles.coinChoice, selected && styles.coinChoiceSelected]}
                    >
                      <Text style={[styles.coinSymbol, selected && styles.coinSymbolSelected]}>{option.symbol}</Text>
                      <Text style={[styles.coinCode, selected && styles.coinCodeSelected]}>{option.code}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {householdChanged ? (
              <TouchableOpacity
                onPress={saveHouseholdSettings}
                activeOpacity={0.84}
                disabled={savingHousehold}
                style={[styles.saveHouseholdButton, savingHousehold && styles.saveHouseholdButtonDisabled]}
              >
                {savingHousehold ? (
                  <ActivityIndicator color={Colors.text.inverse} />
                ) : (
                  <Text style={styles.saveHouseholdText}>Save household</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Home</Text>
            <PreferenceChoice
              title="Progress view"
              note="Choose whether Home watches daily living money or the whole plan."
              value={homeProgressScope}
              options={[
                { value: 'living_money', label: 'Living money' },
                { value: 'whole_plan', label: 'Whole plan' },
              ]}
              onChange={async (value) => {
                setHomeProgressScope(value);
                await saveHomeProgressScope(value);
                await updateCurrentProfilePreferencesRemote({ homeProgressScope: value }).catch(() => undefined);
              }}
            />
            <PreferenceChoice
              title="Week starts on"
              note="Used when weekly and biweekly plans measure their pace."
              value={weekStartsOn}
              options={[
                { value: 'sunday', label: 'Sunday' },
                { value: 'monday', label: 'Monday' },
              ]}
              onChange={async (value) => {
                setWeekStartsOn(value);
                await saveWeekStartsOn(value);
                await updateCurrentProfilePreferencesRemote({ weekStartsOn: value }).catch(() => undefined);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prototype tools</Text>
            <TouchableOpacity onPress={clearBudget} activeOpacity={0.8} style={styles.toolRow}>
              <Text style={styles.toolText}>Clear this month</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetPrototypeFlow} activeOpacity={0.8} style={styles.toolRow}>
              <Text style={styles.toolText}>Reset sign-in and onboarding</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity onPress={deleteAccount} activeOpacity={0.8} style={styles.toolRow}>
              <Text style={[styles.toolText, styles.dangerText]}>Delete my account</Text>
              <MaterialIcons name="delete-outline" size={20} color={Colors.palette.red} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceChoice<T extends string>({
  title,
  note,
  value,
  options,
  onChange,
}: {
  title: string;
  note: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.preferenceBlock}>
      <Text style={styles.futureTitle}>{title}</Text>
      <Text style={styles.futureNote}>{note}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.82}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: Space['2xl'],
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    marginBottom: 8,
  },
  ebisuLine: {
    maxWidth: 310,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
    lineHeight: 29,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  ebisuWord: {
    fontFamily: Fonts.heading,
    color: Colors.palette.green,
  },
  body: {
    gap: 14,
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 23,
    color: Colors.text.primary,
  },
  detailRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.primary,
  },
  editBlock: {
    gap: 7,
  },
  nameInput: {
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    paddingHorizontal: 14,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  coinGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  coinChoice: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  coinChoiceSelected: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: 'rgba(79,175,143,0.12)',
  },
  coinSymbol: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  coinSymbolSelected: {
    color: Colors.palette.green,
  },
  coinCode: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.text.secondary,
  },
  coinCodeSelected: {
    color: Colors.palette.green,
  },
  saveHouseholdButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.palette.green,
  },
  saveHouseholdButtonDisabled: {
    opacity: 0.62,
  },
  saveHouseholdText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text.inverse,
  },
  futureRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  futureCopy: {
    flex: 1,
  },
  futureTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  futureNote: {
    marginTop: 2,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
  },
  futureTag: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.palette.green,
  },
  preferenceBlock: {
    gap: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  choice: {
    flex: 1,
    minHeight: 38,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.08)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: {
    borderColor: 'rgba(79,175,143,0.34)',
    backgroundColor: 'rgba(79,175,143,0.12)',
  },
  choiceText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  choiceTextSelected: {
    color: Colors.palette.green,
  },
  toolRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  dangerSection: {
    borderColor: 'rgba(178,67,67,0.16)',
  },
  dangerText: {
    color: Colors.palette.red,
  },
});
