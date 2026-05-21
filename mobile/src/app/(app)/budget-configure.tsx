import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  ActivityIndicator,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../../components/ui';
import { Colors, Fonts, Radius, Space } from '../../constants/theme';
import {
  categoryPlannedAmount,
  parseMoneyInput,
} from '../../lib/budget';
import { useBudgetConfiguration } from '../../features/budget/application/useBudgetConfiguration';
import type { BudgetSectionKey } from '../../types';
import { monthLabel } from '../../features/budget/presentation/format';
import { BudgetBalancePanel } from '../../features/budget/presentation/BudgetBalancePanel';
import { BudgetCategoryCard } from '../../features/budget/presentation/BudgetCategoryCard';

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

export default function BudgetConfigureScreen() {
  const insets = useSafeAreaInsets();
  const {
    budget,
    watchTargets,
    editing,
    editName,
    setEditName,
    editAmount,
    setEditAmount,
    activeCategories,
    canEditAmount,
    hasUnsavedChanges,
    savingChanges,
    refresh,
    toggleWatch,
    startEditCategory,
    startEditSubcategory,
    cancelEdit,
    saveEdit: persistEdit,
    archiveCategory: persistArchiveCategory,
    archiveSubcategory: persistArchiveSubcategory,
    createCategory,
    createSubcategory,
    updateReserveTarget,
    updateFundingAmount,
    saveChanges,
  } = useBudgetConfiguration();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerDrop = useRef(new Animated.Value(-10)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listDrop = useRef(new Animated.Value(-8)).current;
  const hasPlayedEntrance = useRef(false);

  useEffect(() => {
    refresh().then((savedBudget) => {
    if (!savedBudget) {
      router.replace('/budget-setup');
    }
    });
  }, [refresh]);

  useEffect(() => {
    if (!budget) return;
    if (hasPlayedEntrance.current) return;
    hasPlayedEntrance.current = true;

    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerDrop.setValue(0);
        listOpacity.setValue(1);
        listDrop.setValue(0);
        return;
      }

      headerOpacity.setValue(0);
      headerDrop.setValue(-10);
      listOpacity.setValue(0);
      listDrop.setValue(-8);

      animation = Animated.sequence([
        dropIn(headerOpacity, headerDrop, 520),
        Animated.delay(140),
        dropIn(listOpacity, listDrop, 460),
      ]);
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [budget, headerDrop, headerOpacity, listDrop, listOpacity]);

  const saveEdit = async () => {
    if (!budget || !editing) return;

    const name = editName.trim();
    const amount = parseMoneyInput(editAmount);

    if (!name) {
      Alert.alert('Name needed', 'Give this vessel a name.');
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('Amount needed', 'Use a clear planned amount.');
      return;
    }

    await persistEdit({ name, plannedAmount: amount });
  };

  const savePendingChanges = async () => {
    try {
      await saveChanges();
      router.replace('/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again in a moment.';
      Alert.alert('Could not save changes', message);
    }
  };

  const archiveCategory = (section: BudgetSectionKey, categoryId: string) => {
    Alert.alert(
      'Remove this vessel?',
      'Past entries stay in the ledger, but this vessel will no longer appear in active planning.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await persistArchiveCategory(section, categoryId);
          },
        },
      ],
    );
  };

  const archiveSubcategory = (section: BudgetSectionKey, categoryId: string, subcategoryId: string) => {
    Alert.alert(
      'Remove this smaller vessel?',
      'Past entries stay in the ledger, but this smaller vessel will no longer appear in active planning.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await persistArchiveSubcategory(section, categoryId, subcategoryId);
          },
        },
      ],
    );
  };

  if (!budget) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Preparing the vessels.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steadyCategories = activeCategories.filter(({ section }) => section === 'steady_obligations');
  const householdCategories = activeCategories.filter(({ section }) => section === 'household_vessels');
  const assignedTotal = activeCategories.reduce((sum, { item }) => sum + categoryPlannedAmount(item), 0);

  const renderSection = (
    title: string,
    categories: typeof activeCategories,
    sectionKey: BudgetSectionKey,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader} accessible accessibilityRole="header">
        <View style={styles.goldDividerStack}>
          <View style={styles.goldDividerStrong} />
          <View style={styles.goldDividerSoft} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.goldDividerStack}>
          <View style={styles.goldDividerSoft} />
          <View style={styles.goldDividerStrong} />
        </View>
      </View>
      <View style={styles.sectionList}>
        {categories.map(({ section, item: category }) => (
          <BudgetCategoryCard
            key={`${section}:${category.id}`}
            section={section}
            category={category}
            currency={budget.currency}
            editing={editing}
            editName={editName}
            editAmount={editAmount}
            canEditAmount={canEditAmount}
            watchTargets={watchTargets}
            onChangeEditName={setEditName}
            onChangeEditAmount={setEditAmount}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onToggleWatch={toggleWatch}
            onEditCategory={startEditCategory}
            onEditSubcategory={startEditSubcategory}
            onRemoveCategory={archiveCategory}
            onRemoveSubcategory={archiveSubcategory}
            onCreateSubcategory={createSubcategory}
          />
        ))}
      </View>
      <TouchableOpacity
        onPress={() => createCategory(sectionKey)}
        activeOpacity={0.78}
        style={styles.addVesselButton}
        accessibilityRole="button"
        accessibilityLabel={`Add ${title.toLowerCase()} vessel`}
      >
        <MaterialIcons name="add" size={18} color={Colors.palette.green} />
        <Text style={styles.addVesselText}>
          {sectionKey === 'steady_obligations' ? 'Add steady obligation' : 'Add household vessel'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.month}>{monthLabel(budget.periodKey)}</Text>
            <Text style={styles.ebisuLine}>
              <Text style={styles.ebisuWord}>Ebisu</Text> lays the vessels in view.
            </Text>
            <Text style={styles.support}>Edit what should change. Past entries remain safe in the ledger.</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.list,
              { opacity: listOpacity, transform: [{ translateY: listDrop }] },
            ]}
          >
            <BudgetBalancePanel
              currency={budget.currency}
              assignedTotal={assignedTotal}
              fundingAmount={budget.fundingAmount}
              reserveTargetAmount={budget.reserveTargetAmount}
              onChangeFundingAmount={updateFundingAmount}
              onChangeReserveTarget={updateReserveTarget}
            />

            {renderSection(
              'Steady obligations',
              steadyCategories,
              'steady_obligations',
            )}

            {renderSection(
              'Household vessels',
              householdCategories,
              'household_vessels',
            )}

            {hasUnsavedChanges && (
              <GradientButton
                onPress={savePendingChanges}
                disabled={savingChanges}
                style={styles.savePlanButton}
              >
                {savingChanges ? (
                  <View style={styles.savingContent}>
                    <ActivityIndicator color={Colors.text.inverse} />
                    <Text style={styles.savePlanText}>Saving</Text>
                  </View>
                ) : (
                  <Text style={styles.savePlanText}>Save changes</Text>
                )}
              </GradientButton>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
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
  month: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  ebisuLine: {
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
  support: {
    maxWidth: 310,
    marginTop: 8,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    gap: 16,
  },
  overviewCard: {
    borderRadius: Radius.lg,
    backgroundColor: '#20243A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  overviewEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.60)',
  },
  overviewRows: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewMetric: {
    flex: 1,
    gap: 3,
  },
  overviewLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.62)',
  },
  overviewValue: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.text.inverse,
  },
  overviewFoot: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  overviewFootText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    color: '#75D5B4',
  },
  overviewUnset: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.62)',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 7,
    paddingHorizontal: 2,
    paddingTop: 4,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.palette.green,
    textAlign: 'center',
  },
  goldDividerStack: {
    gap: 3,
  },
  goldDividerStrong: {
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(212,162,76,0.58)',
  },
  goldDividerSoft: {
    width: '72%',
    height: 1,
    alignSelf: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(212,162,76,0.22)',
  },
  sectionList: {
    gap: 12,
  },
  addVesselButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1.3,
    borderColor: 'rgba(79,175,143,0.22)',
    backgroundColor: 'rgba(79,175,143,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addVesselText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.palette.green,
  },
  savePlanButton: {
    marginTop: 6,
    minHeight: 58,
    height: 58,
    borderRadius: Radius.lg,
  },
  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savePlanText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text.inverse,
  },
});
