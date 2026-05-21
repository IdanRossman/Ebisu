import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CeremonialSeal, ExpandableCard } from '../../../components/ui';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import type { BudgetPlan, BudgetSectionItem, HomeProgressScope } from '../../../types';
import {
  activeSectionItems,
  activeSubcategories,
  categoryPlannedAmount,
  categorySpentAmount,
  historicalSpentTotal,
} from '../../budget/domain/budget';
import { formatMoney } from '../../budget/domain/money';

type Props = {
  budget: BudgetPlan;
  scope: HomeProgressScope;
};

type ProgressRow = {
  id: string;
  label: string;
  planned: number;
  spent: number;
  children?: ProgressRow[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function rowsFor(items: BudgetSectionItem[]) {
  return activeSectionItems(items).map((item) => ({
    id: item.id,
    label: item.name,
    planned: categoryPlannedAmount(item),
    spent: categorySpentAmount(item),
    children: activeSubcategories(item).map((subcategory) => ({
      id: subcategory.id,
      label: subcategory.name,
      planned: subcategory.plannedAmount,
      spent: subcategory.spentAmount,
    })),
  }));
}

function dayProgress(startKey: string, endKey: string) {
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const today = new Date();
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
  const elapsedDays = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  return clamp(elapsedDays / totalDays);
}

export function BudgetProgressWidget({ budget, scope }: Props) {
  const fillProgress = useRef(new Animated.Value(0)).current;
  const steadyOpacity = useRef(new Animated.Value(0)).current;
  const steadyDrop = useRef(new Animated.Value(-6)).current;
  const householdOpacity = useRef(new Animated.Value(0)).current;
  const householdDrop = useRef(new Animated.Value(-6)).current;
  const insightOpacity = useRef(new Animated.Value(0)).current;
  const insightDrop = useRef(new Animated.Value(-6)).current;
  const householdRows = useMemo(() => rowsFor(budget.householdVessels), [budget.householdVessels]);
  const steadyRows = useMemo(() => rowsFor(budget.steadyObligations), [budget.steadyObligations]);
  const visibleRows = scope === 'whole_plan' ? [...steadyRows, ...householdRows] : householdRows;
  const allRows = [...steadyRows, ...householdRows];
  const planned = visibleRows.reduce((sum, row) => sum + row.planned, 0);
  const spent = visibleRows.reduce((sum, row) => sum + row.spent, 0);
  const totalPlanned = allRows.reduce((sum, row) => sum + row.planned, 0);
  const totalSpent = allRows.reduce((sum, row) => sum + row.spent, 0);
  const historicalSpent = historicalSpentTotal(budget);
  const plannedRemaining = totalPlanned - totalSpent;
  const availableFunds = budget.fundingAmount === null ? plannedRemaining : budget.fundingAmount - historicalSpent;
  const reservePosition = budget.reserveTargetAmount === null ? null : availableFunds - budget.reserveTargetAmount;
  const headlineCapacity = budget.fundingAmount ?? totalPlanned;
  const spentProgress = headlineCapacity > 0 ? clamp(historicalSpent / headlineCapacity) : 0;
  const spentPercent = Math.round(spentProgress * 100);
  const paceRows = householdRows.filter((row) => row.label.toLowerCase() !== 'savings');
  const pacePlanned = paceRows.reduce((sum, row) => sum + row.planned, 0);
  const paceSpent = paceRows.reduce((sum, row) => sum + row.spent, 0);
  const elapsedProgress = dayProgress(budget.periodStart, budget.periodEnd);
  const paceSpentProgress = pacePlanned > 0 ? paceSpent / pacePlanned : 0;
  const paceDelta = Math.round((paceSpentProgress - elapsedProgress) * 100);
  const animatedFillWidth = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${spentProgress * 100}%`],
  });

  useEffect(() => {
    fillProgress.setValue(0);
    Animated.timing(fillProgress, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fillProgress, spentProgress]);

  useEffect(() => {
    steadyOpacity.setValue(0);
    steadyDrop.setValue(-6);
    householdOpacity.setValue(0);
    householdDrop.setValue(-6);
    insightOpacity.setValue(0);
    insightDrop.setValue(-6);
  }, [householdDrop, householdOpacity, insightDrop, insightOpacity, steadyDrop, steadyOpacity]);

  const revealExpandedSections = (reduceMotion: boolean) => {
    if (reduceMotion) {
      steadyOpacity.setValue(1);
      steadyDrop.setValue(0);
      householdOpacity.setValue(1);
      householdDrop.setValue(0);
      insightOpacity.setValue(1);
      insightDrop.setValue(0);
      return;
    }
    const reveal = (opacity: Animated.Value, translateY: Animated.Value) => Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.stagger(55, [
      reveal(steadyOpacity, steadyDrop),
      reveal(householdOpacity, householdDrop),
      reveal(insightOpacity, insightDrop),
    ]).start();
  };

  return (
    <ExpandableCard
      style={styles.card}
      detailsStyle={styles.details}
      collapseOnDetailsPress
      onExpandedChange={(expanded, reduceMotion) => {
        if (expanded) {
          revealExpandedSections(reduceMotion);
        } else {
          steadyOpacity.setValue(0);
          steadyDrop.setValue(-6);
          householdOpacity.setValue(0);
          householdDrop.setValue(-6);
          insightOpacity.setValue(0);
          insightDrop.setValue(-6);
        }
      }}
      summary={({ expanded, expansionProgress }) => (
        <>
        <View style={styles.reportCap}>
          <View style={styles.reportRule} />
          <Animated.View
            style={{
              transform: [{
                translateY: expansionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3],
                }),
              }],
            }}
          >
            <CeremonialSeal />
          </Animated.View>
          <View style={styles.reportRule} />
        </View>
        <View style={styles.header}>
          <SummaryMetric
            value={formatMoney(availableFunds, budget.currency)}
            label="Available"
            emphasized
          />
          <SummaryMetric
            value={formatMoney(historicalSpent, budget.currency)}
            label="Spent"
          />
          <SummaryMetric
            value={reservePosition === null ? '-' : formatMoney(Math.abs(reservePosition), budget.currency)}
            label={reservePosition === null ? 'Left' : reservePosition < 0 ? 'Over budget' : reservePosition > 0 ? 'Left' : 'At budget'}
            warning={reservePosition !== null && reservePosition < 0}
          />
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: animatedFillWidth }]} />
          <View style={[styles.paceMark, { left: `${elapsedProgress * 100}%` }]} />
          <Text style={styles.trackPercent}>{spentPercent}% spent</Text>
        </View>
        {!expanded ? (
          <View style={styles.expandRow}>
            <Text style={styles.expandText}>Open report</Text>
            <MaterialIcons name="expand-more" size={18} color="rgba(255,255,255,0.62)" />
          </View>
        ) : null}
        </>
      )}
    >
      {() => (
        <>
          {pacePlanned > 0 ? (
            <Animated.View style={[styles.insightCard, { opacity: insightOpacity, transform: [{ translateY: insightDrop }] }]}>
              <Text style={styles.insightLabel}>Expected spending</Text>
              <Text style={[styles.insightValue, paceDelta > 0 && styles.paceAhead]}>
                {paceDelta === 0
                  ? 'Right on expected spending'
                  : `${Math.abs(paceDelta)}% ${paceDelta > 0 ? 'ahead of' : 'behind'} expected spending`}
              </Text>
              <Text style={styles.insightText}>
                By this point in the period, your household vessels would be expected to use about {Math.round(elapsedProgress * 100)}% of their plan.
              </Text>
            </Animated.View>
          ) : null}
          {budget.reserveTargetAmount !== null ? (
            <Animated.View style={{ opacity: insightOpacity, transform: [{ translateY: insightDrop }] }}>
              <ReserveLine
                currency={budget.currency}
                targetAmount={budget.reserveTargetAmount}
                availableFunds={availableFunds}
                reservePosition={reservePosition}
              />
            </Animated.View>
          ) : null}
          {scope === 'whole_plan' && steadyRows.length ? (
            <Animated.View style={{ opacity: steadyOpacity, transform: [{ translateY: steadyDrop }] }}>
              <ProgressSection title="Steady obligations" rows={steadyRows} currency={budget.currency} />
            </Animated.View>
          ) : null}
          {householdRows.length ? (
            <Animated.View style={{ opacity: householdOpacity, transform: [{ translateY: householdDrop }] }}>
              <ProgressSection title="Household vessels" rows={householdRows} currency={budget.currency} />
            </Animated.View>
          ) : null}
          <View style={styles.collapseRow}>
            <Text style={styles.collapseText}>Seal report</Text>
            <MaterialIcons name="expand-less" size={18} color={Colors.text.secondary} />
          </View>
        </>
      )}
    </ExpandableCard>
  );
}

function ReserveLine({
  currency,
  targetAmount,
  availableFunds,
  reservePosition,
}: {
  currency: BudgetPlan['currency'];
  targetAmount: number;
  availableFunds: number;
  reservePosition: number | null;
}) {
  const isOver = reservePosition !== null && reservePosition < 0;
  const statusText =
    reservePosition === null
      ? 'Protected monthly floor'
      : reservePosition < 0
        ? `${formatMoney(Math.abs(reservePosition), currency)} over budget`
        : `${formatMoney(reservePosition, currency)} left before reserve`;

  return (
    <View style={styles.reserveLine}>
      <View style={styles.reserveCopy}>
        <Text style={styles.reserveLabel}>Reserve target</Text>
        <Text style={[styles.reserveStatus, isOver && styles.reserveStatusOver]}>{statusText}</Text>
      </View>
      <View style={styles.reserveValues}>
        <Text style={styles.reserveAmount}>{formatMoney(targetAmount, currency)}</Text>
        <Text style={styles.reserveMeta}>{formatMoney(availableFunds, currency)} available</Text>
      </View>
    </View>
  );
}

function SummaryMetric({
  value,
  label,
  emphasized = false,
  warning = false,
}: {
  value: string;
  label: string;
  emphasized?: boolean;
  warning?: boolean;
}) {
  return (
    <View style={[styles.summaryMetric, emphasized && styles.summaryMetricPrimary]}>
      <Text
        style={[styles.summaryValue, emphasized && styles.summaryValuePrimary, warning && styles.summaryValueWarning]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function ProgressSection({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: ProgressRow[];
  currency: BudgetPlan['currency'];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionRule} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionRule} />
      </View>
      {rows.map((row) => {
        return (
          <View key={row.id} style={styles.rowGroup}>
            <ProgressLine row={row} currency={currency} />
            {row.children?.length ? (
              <View style={styles.childRows}>
                {row.children.map((child) => (
                  <ProgressLine key={child.id} row={child} currency={currency} child />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function ProgressLine({
  row,
  currency,
  child = false,
}: {
  row: ProgressRow;
  currency: BudgetPlan['currency'];
  child?: boolean;
}) {
  const progress = row.planned > 0 ? clamp(row.spent / row.planned) : 0;
  const left = row.planned - row.spent;

  return (
    <View style={[styles.row, child && styles.childRow]}>
      <View style={styles.rowHeader}>
        <Text style={[styles.rowLabel, child && styles.childRowLabel]}>{row.label}</Text>
        <Text style={[styles.rowRemaining, left < 0 && styles.rowOver, child && styles.childRowRemaining]}>
          {left < 0 ? `${formatMoney(Math.abs(left), currency)} over` : `${formatMoney(left, currency)} left`}
        </Text>
      </View>
      <View style={[styles.rowTrack, child && styles.childRowTrack]}>
        <View style={[styles.rowFill, { width: `${progress * 100}%` }, progress > 0.9 && styles.rowFillWarning]} />
      </View>
      <Text style={[styles.rowMeta, child && styles.childRowMeta]}>
        {formatMoney(row.spent, currency)} of {formatMoney(row.planned, currency)} · {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    backgroundColor: '#20243A',
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  reportCap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  reportRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,162,76,0.30)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  summaryMetric: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
    paddingHorizontal: 9,
    paddingVertical: 9,
    gap: 3,
  },
  summaryMetricPrimary: {
    backgroundColor: 'rgba(117,213,180,0.105)',
    borderColor: 'rgba(117,213,180,0.20)',
  },
  summaryValue: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  summaryValuePrimary: { color: '#75D5B4' },
  summaryValueWarning: { color: '#F3A39C' },
  summaryLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.54)',
    textAlign: 'center',
  },
  track: {
    marginTop: 12,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { height: '100%', borderRadius: 10, backgroundColor: Colors.palette.green },
  paceMark: { position: 'absolute', top: -4, bottom: -4, width: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.9)' },
  trackPercent: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.86)',
  },
  paceAhead: { color: '#75D5B4' },
  expandRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  expandText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.62)' },
  details: { gap: 14, paddingTop: 2 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,162,76,0.28)',
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#75D5B4',
    textAlign: 'center',
  },
  rowGroup: { gap: 8 },
  row: { gap: 5 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.inverse },
  rowRemaining: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: '#75D5B4' },
  rowOver: { color: '#F3A39C' },
  rowTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  rowFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.palette.green },
  rowFillWarning: { backgroundColor: '#E3A343' },
  rowMeta: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.56)' },
  insightCard: {
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 3,
  },
  insightLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.56)', textTransform: 'uppercase' },
  insightValue: { fontFamily: Fonts.headingSemiBold, fontSize: 14, lineHeight: 20, color: Colors.palette.green },
  insightText: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.68)' },
  reserveLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(212,162,76,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(212,162,76,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  reserveCopy: { flex: 1, gap: 2 },
  reserveLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#E3C56E',
  },
  reserveStatus: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.64)',
  },
  reserveStatusOver: { color: '#F3A39C' },
  reserveValues: { alignItems: 'flex-end', gap: 2 },
  reserveAmount: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text.inverse,
  },
  reserveMeta: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.48)',
  },
  childRows: {
    marginLeft: 10,
    paddingLeft: 12,
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(117,213,180,0.18)',
  },
  childRow: { gap: 4 },
  childRowLabel: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  childRowRemaining: { fontSize: 11 },
  childRowTrack: { height: 4 },
  childRowMeta: { fontSize: 10, color: 'rgba(255,255,255,0.46)' },
  collapseRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingTop: 2 },
  collapseText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.62)' },
});


