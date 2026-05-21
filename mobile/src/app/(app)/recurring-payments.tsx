import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Space } from '../../constants/theme';
import { formatMoney } from '../../features/budget/domain/money';
import { monthLabel } from '../../features/budget/presentation/format';
import { useRecurringPayments } from '../../features/expenses/application/useRecurringPayments';
import { ordinalDay, weekdayLabel } from '../../features/expenses/domain/recurrence';

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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const firstWeekday = first.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: firstWeekday + days }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 ? new Date(month.getFullYear(), month.getMonth(), day, 12) : null;
  });
}

function cadenceLabel(schedule: {
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekday?: number | null;
}) {
  if (schedule.recurrenceFrequency === 'weekly') {
    return `Weekly · ${weekdayLabel(schedule.recurrenceWeekday ?? 0)}`;
  }
  if (schedule.recurrenceFrequency === 'monthly') {
    return `Monthly · ${ordinalDay(schedule.recurrenceDayOfMonth ?? 1)}`;
  }
  return 'Recurring';
}

export default function RecurringPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    budget,
    schedules,
    occurrences,
    visibleMonth,
    setVisibleMonth,
    selectedDate,
    setSelectedDate,
    itemLabels,
    loading,
    refresh,
  } = useRecurringPayments();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerDrop = useRef(new Animated.Value(-10)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyDrop = useRef(new Animated.Value(-8)).current;

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  useEffect(() => {
    if (!budget) return;
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return;
      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerDrop.setValue(0);
        bodyOpacity.setValue(1);
        bodyDrop.setValue(0);
        return;
      }
      headerOpacity.setValue(0);
      headerDrop.setValue(-10);
      bodyOpacity.setValue(0);
      bodyDrop.setValue(-8);
      Animated.sequence([
        dropIn(headerOpacity, headerDrop, 500),
        Animated.delay(130),
        dropIn(bodyOpacity, bodyDrop, 430),
      ]).start();
    });
    return () => {
      mounted = false;
    };
  }, [bodyDrop, bodyOpacity, budget, headerDrop, headerOpacity]);

  const monthOccurrences = useMemo(() => occurrences.filter((occurrence) => occurrence.dueOn.slice(0, 7) === dateKey(visibleMonth).slice(0, 7)), [occurrences, visibleMonth]);
  const selectedOccurrences = useMemo(() => monthOccurrences.filter((occurrence) => occurrence.dueOn === selectedDate), [monthOccurrences, selectedDate]);
  const sortedUpcoming = useMemo(() => [...occurrences].sort((a, b) => a.dueOn.localeCompare(b.dueOn)), [occurrences]);
  const nextThirtyDaysTotal = useMemo(() => {
    const today = dateKey(new Date());
    const horizon = dateKey(new Date(Date.now() + (30 * 86400000)));
    return occurrences
      .filter((occurrence) => occurrence.dueOn >= today && occurrence.dueOn <= horizon)
      .reduce((sum, occurrence) => sum + occurrence.amount, 0);
  }, [occurrences]);
  const occurrenceDays = useMemo(() => new Set(monthOccurrences.map((occurrence) => occurrence.dueOn)), [monthOccurrences]);

  if (loading || !budget) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Gathering recurring payments.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerDrop }] }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.78} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.palette.green} />
          </TouchableOpacity>
          <Text style={styles.month}>{monthLabel(dateKey(visibleMonth).slice(0, 7))}</Text>
          <Text style={styles.ebisuLine}><Text style={styles.ebisuWord}>Ebisu</Text> keeps watch over what returns.</Text>
          <Text style={styles.support}>These payments are expected to visit the household again.</Text>
        </Animated.View>

        <Animated.View style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodyDrop }] }]}>
          {occurrences.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No returning payments yet.</Text>
              <Text style={styles.emptyCopy}>When you mark an expense as recurring, Ebisu will gather it here.</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Next 30 days</Text>
                <Text style={styles.summaryAmount}>{formatMoney(nextThirtyDaysTotal, budget.currency)}</Text>
                <Text style={styles.summaryMeta}>{sortedUpcoming.length} expected payments</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Coming next</Text>
                <View style={styles.list}>
                  {sortedUpcoming.slice(0, 6).map((occurrence) => {
                    const schedule = schedules.find((candidate) => candidate.id === occurrence.sourceScheduleId);
                    return (
                      <View key={occurrence.id} style={styles.paymentRow}>
                        <View style={styles.paymentCopy}>
                          <Text style={styles.paymentName}>{occurrence.name}</Text>
                          <Text style={styles.paymentMeta}>
                            {occurrence.dueOn} · {itemLabels.get(occurrence.budgetItemId) ?? 'Household'}
                          </Text>
                          {schedule ? <Text style={styles.paymentCadence}>{cadenceLabel(schedule)}</Text> : null}
                        </View>
                        <Text style={styles.paymentAmount}>{formatMoney(occurrence.amount, budget.currency)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.calendarCard}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1, 12))} style={styles.calendarNav}>
                    <MaterialIcons name="chevron-left" size={21} color={Colors.palette.green} />
                  </TouchableOpacity>
                  <Text style={styles.calendarTitle}>{monthLabel(dateKey(visibleMonth).slice(0, 7))}</Text>
                  <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1, 12))} style={styles.calendarNav}>
                    <MaterialIcons name="chevron-right" size={21} color={Colors.palette.green} />
                  </TouchableOpacity>
                </View>
                <View style={styles.weekdays}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
                </View>
                <View style={styles.grid}>
                  {monthGrid(visibleMonth).map((day, index) => {
                    if (!day) return <View key={`blank-${index}`} style={styles.dayCell} />;
                    const key = dateKey(day);
                    const selected = key === selectedDate;
                    const hasOccurrence = occurrenceDays.has(key);
                    return (
                      <TouchableOpacity key={key} onPress={() => setSelectedDate(key)} style={[styles.dayCell, selected && styles.dayCellSelected]}>
                        <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{day.getDate()}</Text>
                        {hasOccurrence ? <View style={[styles.dayDot, selected && styles.dayDotSelected]} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.selectedDay}>
                  <Text style={styles.sectionLabel}>{selectedDate}</Text>
                  {selectedOccurrences.length ? selectedOccurrences.map((occurrence) => (
                    <View key={occurrence.id} style={styles.selectedDayRow}>
                      <Text style={styles.selectedDayName}>{occurrence.name}</Text>
                      <Text style={styles.selectedDayAmount}>{formatMoney(occurrence.amount, budget.currency)}</Text>
                    </View>
                  )) : <Text style={styles.selectedDayEmpty}>No recurring payments due this day.</Text>}
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface.warm },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { fontFamily: Fonts.headingSemiBold, fontSize: 16, color: Colors.text.secondary, textAlign: 'center' },
  header: { alignItems: 'center', marginBottom: Space['2xl'] },
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
  month: { fontFamily: Fonts.bodyMedium, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, marginBottom: 8 },
  ebisuLine: { fontFamily: Fonts.headingSemiBold, fontSize: 20, lineHeight: 29, color: Colors.text.primary, textAlign: 'center' },
  ebisuWord: { fontFamily: Fonts.heading, color: Colors.palette.green },
  support: { maxWidth: 300, marginTop: 8, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, textAlign: 'center' },
  body: { gap: Space.lg },
  emptyState: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  emptyTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 17, lineHeight: 24, color: Colors.text.primary, textAlign: 'center' },
  emptyCopy: { marginTop: 5, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20, color: Colors.text.secondary, textAlign: 'center' },
  summaryCard: {
    borderRadius: Radius.lg,
    backgroundColor: '#20243A',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.62)' },
  summaryAmount: { marginTop: 4, fontFamily: Fonts.headingSemiBold, fontSize: 28, lineHeight: 34, color: '#75D5B4' },
  summaryMeta: { marginTop: 2, fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.68)' },
  section: { gap: 10 },
  sectionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  list: { gap: 10 },
  paymentRow: {
    minHeight: 76,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentCopy: { flex: 1 },
  paymentName: { fontFamily: Fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: Colors.text.primary },
  paymentMeta: { marginTop: 2, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  paymentCadence: { marginTop: 3, fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.palette.green },
  paymentAmount: { fontFamily: Fonts.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.text.primary },
  calendarCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.07)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    padding: 16,
    gap: 12,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  calendarTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 16, color: Colors.text.primary },
  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.text.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.2857%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayCellSelected: { borderRadius: Radius.md, backgroundColor: 'rgba(79,175,143,0.12)' },
  dayNumber: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.primary },
  dayNumberSelected: { color: Colors.palette.green },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.palette.gold },
  dayDotSelected: { backgroundColor: Colors.palette.green },
  selectedDay: { gap: 8, paddingTop: 4 },
  selectedDayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  selectedDayName: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.primary },
  selectedDayAmount: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.palette.green },
  selectedDayEmpty: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text.secondary },
});
