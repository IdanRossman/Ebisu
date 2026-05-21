import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/theme';
import { DISPLAY_NAME_KEY } from '../../lib/budget';
import { useHomeBudget } from '../../features/budget/application/useHomeBudget';
import { useHomeEntranceMotion } from '../../features/home/application/useHomeEntranceMotion';
import { ConfiguredHomeState } from '../../features/home/presentation/ConfiguredHomeState';
import { EmptyHomeState } from '../../features/home/presentation/EmptyHomeState';
import { loadBootstrap } from '../../features/bootstrap/application/bootstrapApi';
import { SkippableIntroOverlay } from '../../features/motion/presentation/SkippableIntroOverlay';

export default function HomeScreen() {
  const homeBudget = useHomeBudget();
  const [displayName, setDisplayName] = useState('');
  const motion = useHomeEntranceMotion(homeBudget.loading, !homeBudget.budget);

  useFocusEffect(
    useCallback(() => {
      homeBudget.refresh();
    }, [homeBudget.refresh]),
  );

  useEffect(() => {
    loadBootstrap()
      .then((bootstrap) => {
        const remoteName = bootstrap.profile?.display_name?.trim();
        if (remoteName) {
          setDisplayName(remoteName);
          return;
        }
        return AsyncStorage.getItem(DISPLAY_NAME_KEY).then((name) => {
          setDisplayName(name?.trim() ?? '');
        });
      })
      .catch(() => {
        AsyncStorage.getItem(DISPLAY_NAME_KEY).then((name) => {
          setDisplayName(name?.trim() ?? '');
        });
      });
  }, []);

  if (homeBudget.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Preparing the household ledger.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {homeBudget.budget ? (
        <ConfiguredHomeState
          budget={homeBudget.budget}
          displayName={displayName}
          entryOpen={homeBudget.entryOpen}
          setEntryOpen={homeBudget.setEntryOpen}
          expenseAmount={homeBudget.expenseAmount}
          setExpenseAmount={homeBudget.setExpenseAmount}
          expensePayeeName={homeBudget.expensePayeeName}
          setExpensePayeeName={homeBudget.setExpensePayeeName}
          expenseNote={homeBudget.expenseNote}
          setExpenseNote={homeBudget.setExpenseNote}
          expenseDate={homeBudget.expenseDate}
          setExpenseDate={homeBudget.setExpenseDate}
          recurringExpense={homeBudget.recurringExpense}
          setRecurringExpense={homeBudget.setRecurringExpense}
          recurrenceFrequency={homeBudget.recurrenceFrequency}
          setRecurrenceFrequency={homeBudget.setRecurrenceFrequency}
          recurrenceMonthlyDay={homeBudget.recurrenceMonthlyDay}
          setRecurrenceMonthlyDay={homeBudget.setRecurrenceMonthlyDay}
          recurrenceWeeklyDay={homeBudget.recurrenceWeeklyDay}
          setRecurrenceWeeklyDay={homeBudget.setRecurrenceWeeklyDay}
          recurrenceEndsOn={homeBudget.recurrenceEndsOn}
          setRecurrenceEndsOn={homeBudget.setRecurrenceEndsOn}
          selectedTargetId={homeBudget.selectedTargetId}
          setSelectedTargetId={homeBudget.setSelectedTargetId}
          savingExpense={homeBudget.savingExpense}
          expenseTargets={homeBudget.expenseTargets}
          rankedExpenseTargets={homeBudget.rankedExpenseTargets}
          homeProgressScope={homeBudget.homeProgressScope}
          recordExpense={homeBudget.recordExpense}
          onCloseExpenseSheet={homeBudget.closeExpenseSheet}
          motion={motion}
        />
      ) : (
        <EmptyHomeState displayName={displayName} motion={motion} />
      )}
      <SkippableIntroOverlay enabled={motion.isSkippable} onSkip={motion.skipEntrance} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface.warm,
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
});
