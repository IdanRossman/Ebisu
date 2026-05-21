import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts, Radius, Space } from '../../../constants/theme';
import { monthLabel } from '../../budget/presentation/format';
import type { ExpenseTarget } from '../../budget/application/useHomeBudget';
import type { BudgetPlan, HomeProgressScope } from '../../../types';
import { QuickAddExpenseSheet } from '../../expenses/presentation/QuickAddExpenseSheet';
import { BudgetProgressWidget } from './BudgetProgressWidget';
import { HomePondFooter } from './HomePondFooter';
import { buildHomeGreeting } from '../application/homeGreetingService';
import type { RecurrenceFrequency } from '../../expenses/domain/recurrence';
import { SkippableIntroRegion } from '../../motion/presentation/SkippableIntroRegion';

const teaEbisu = require('../../../../assets/ebisu-drinking-tea-gif.gif');

type Props = {
  budget: BudgetPlan;
  displayName: string;
  entryOpen: boolean;
  setEntryOpen: (next: boolean | ((open: boolean) => boolean)) => void;
  expenseAmount: string;
  setExpenseAmount: (value: string) => void;
  expensePayeeName: string;
  setExpensePayeeName: (value: string) => void;
  expenseNote: string;
  setExpenseNote: (value: string) => void;
  expenseDate: string;
  setExpenseDate: (value: string) => void;
  recurringExpense: boolean;
  setRecurringExpense: (value: boolean) => void;
  recurrenceFrequency: RecurrenceFrequency;
  setRecurrenceFrequency: (value: RecurrenceFrequency) => void;
  recurrenceMonthlyDay: number;
  setRecurrenceMonthlyDay: (value: number) => void;
  recurrenceWeeklyDay: number;
  setRecurrenceWeeklyDay: (value: number) => void;
  recurrenceEndsOn: string;
  setRecurrenceEndsOn: (value: string) => void;
  selectedTargetId: string | null;
  setSelectedTargetId: (value: string | null) => void;
  savingExpense: boolean;
  expenseTargets: ExpenseTarget[];
  rankedExpenseTargets: ExpenseTarget[];
  homeProgressScope: HomeProgressScope;
  onCloseExpenseSheet: () => void;
  recordExpense: () => Promise<
    | { ok: true }
    | { ok: false; reason: 'missing-target' | 'invalid-amount' | 'invalid-date' | 'invalid-end-date' | 'save-failed' | 'schedule-save-failed'; message?: string }
  >;
  motion: {
    ebisuOpacity: Animated.Value;
    ebisuDrop: Animated.Value;
    greetingOpacity: Animated.Value;
    greetingDrop: Animated.Value;
    progressOpacity: Animated.Value;
    progressDrop: Animated.Value;
    actionOpacity: Animated.Value;
    actionDrop: Animated.Value;
    isSkippable: boolean;
    skipEntrance: () => void;
  };
};

export function ConfiguredHomeState({
  budget,
  displayName,
  entryOpen,
  setEntryOpen,
  expenseAmount,
  setExpenseAmount,
  expensePayeeName,
  setExpensePayeeName,
  expenseNote,
  setExpenseNote,
  expenseDate,
  setExpenseDate,
  recurringExpense,
  setRecurringExpense,
  recurrenceFrequency,
  setRecurrenceFrequency,
  recurrenceMonthlyDay,
  setRecurrenceMonthlyDay,
  recurrenceWeeklyDay,
  setRecurrenceWeeklyDay,
  recurrenceEndsOn,
  setRecurrenceEndsOn,
  selectedTargetId,
  setSelectedTargetId,
  savingExpense,
  expenseTargets,
  rankedExpenseTargets,
  homeProgressScope,
  onCloseExpenseSheet,
  recordExpense,
  motion,
}: Props) {
  const insets = useSafeAreaInsets();
  const greeting = buildHomeGreeting({ displayName, budget });

  const saveExpense = async () => {
    const result = await recordExpense();
    if (!result.ok && result.reason === 'missing-target') {
      Alert.alert('Vessel needed', 'Choose where this expense belongs.');
      return;
    }
    if (!result.ok && result.reason === 'invalid-amount') {
      Alert.alert('Amount needed', 'Enter the amount that left the household.');
      return;
    }
    if (!result.ok && result.reason === 'invalid-date') {
      Alert.alert('Date needed', 'Use a clear date in YYYY-MM-DD format.');
      return;
    }
    if (!result.ok && result.reason === 'invalid-end-date') {
      Alert.alert('End date needed', 'Choose an end date on or after the first payment.');
      return;
    }
    if (!result.ok && result.reason === 'schedule-save-failed') {
      Alert.alert('Expense recorded', 'The expense was saved, but its recurring schedule could not be created.');
      return;
    }
    if (!result.ok && result.reason === 'save-failed') {
      Alert.alert('Could not save', result.message ?? 'Please try again in a moment.');
    }
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SkippableIntroRegion enabled={motion.isSkippable} onSkip={motion.skipEntrance} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            activeOpacity={0.78}
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <MaterialIcons name="settings" size={19} color={Colors.palette.green} />
          </TouchableOpacity>
          <Animated.Image
            source={teaEbisu}
            resizeMode="contain"
            style={[
              styles.ebisuImage,
              { opacity: motion.ebisuOpacity, transform: [{ translateY: motion.ebisuDrop }] },
            ]}
          />
          <Animated.Text
            style={[
              styles.month,
              { opacity: motion.greetingOpacity, transform: [{ translateY: motion.greetingDrop }] },
            ]}
          >
            {monthLabel(greeting.periodLabel)}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.ebisuLine,
              { opacity: motion.greetingOpacity, transform: [{ translateY: motion.greetingDrop }] },
            ]}
          >
            {greeting.message}
          </Animated.Text>
        </SkippableIntroRegion>

        <Animated.View
          style={[
            styles.progressWidget,
            { opacity: motion.progressOpacity, transform: [{ translateY: motion.progressDrop }] },
          ]}
        >
          <BudgetProgressWidget budget={budget} scope={homeProgressScope} />
        </Animated.View>

        <Animated.View
          style={[
            styles.actionStack,
            { opacity: motion.actionOpacity, transform: [{ translateY: motion.actionDrop }] },
          ]}
        >
          <View style={styles.navigationActions}>
            <JewelButton
              onPress={() => setEntryOpen(true)}
              style={styles.navigationAction}
              touchableStyle={styles.navigationActionWrap}
              accessibilityLabel="Record expense"
            >
              <MaterialIcons name="add-card" size={18} color={Colors.text.inverse} />
              <Text style={styles.navigationActionText}>Record</Text>
            </JewelButton>
            <JewelButton
              onPress={() => router.push('/budget-configure')}
              style={styles.navigationAction}
              touchableStyle={styles.navigationActionWrap}
              accessibilityLabel="Shape monthly plan"
            >
              <MaterialIcons name="tune" size={18} color={Colors.text.inverse} />
              <Text style={styles.navigationActionText}>Shape</Text>
            </JewelButton>
            <JewelButton
              onPress={() => router.push('/ledger')}
              style={styles.navigationAction}
              touchableStyle={styles.navigationActionWrap}
              accessibilityLabel="Review ledger"
            >
              <MaterialIcons name="receipt-long" size={18} color={Colors.text.inverse} />
              <Text style={styles.navigationActionText}>Review</Text>
            </JewelButton>
          </View>
          <HomePondFooter />
        </Animated.View>
      </ScrollView>
      <QuickAddExpenseSheet
        visible={entryOpen}
        currency={budget.currency}
        amount={expenseAmount}
        setAmount={setExpenseAmount}
        payeeName={expensePayeeName}
        setPayeeName={setExpensePayeeName}
        note={expenseNote}
        setNote={setExpenseNote}
        spentOn={expenseDate}
        setSpentOn={setExpenseDate}
        recurringExpense={recurringExpense}
        setRecurringExpense={setRecurringExpense}
        recurrenceFrequency={recurrenceFrequency}
        setRecurrenceFrequency={setRecurrenceFrequency}
        recurrenceMonthlyDay={recurrenceMonthlyDay}
        setRecurrenceMonthlyDay={setRecurrenceMonthlyDay}
        recurrenceWeeklyDay={recurrenceWeeklyDay}
        setRecurrenceWeeklyDay={setRecurrenceWeeklyDay}
        recurrenceEndsOn={recurrenceEndsOn}
        setRecurrenceEndsOn={setRecurrenceEndsOn}
        selectedTargetId={selectedTargetId}
        setSelectedTargetId={setSelectedTargetId}
        targets={rankedExpenseTargets.length ? rankedExpenseTargets : expenseTargets}
        saving={savingExpense}
        onClose={onCloseExpenseSheet}
        onSave={saveExpense}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: Space.lg,
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  ebisuImage: {
    width: '100%',
    height: 228,
    marginBottom: -4,
  },
  month: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text.secondary,
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
  progressWidget: { marginBottom: Space.lg },
  actionStack: {
    marginBottom: 0,
  },
  navigationActions: {
    flexDirection: 'row',
    gap: 9,
  },
  navigationActionWrap: {
    flex: 1,
    minWidth: 0,
  },
  navigationAction: {
    width: '100%',
    minWidth: 0,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: 8,
    gap: 7,
  },
  navigationActionText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text.inverse,
    textAlign: 'center',
  },
});
