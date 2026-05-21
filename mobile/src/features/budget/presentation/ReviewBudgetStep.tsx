import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JewelButton } from '../../../components/ui';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import type { CurrencyCode, DraftBudgetCategory, DraftBudgetPlan } from '../../../types';
import { formatMoney, parseMoneyInput } from '../../../lib/budget';

type Motion = {
  summaryOpacity: Animated.Value;
  summaryDrop: Animated.Value;
  actionOpacity: Animated.Value;
  actionDrop: Animated.Value;
};

type Props = {
  currency: CurrencyCode;
  draftBudget: DraftBudgetPlan;
  steadyTotal: number;
  householdTotal: number;
  remainingAmount: number | null;
  onBegin: () => void;
  saving?: boolean;
  onReturnToVessels: () => void;
  motion: Motion;
};

function rhythmLabel(rhythm: DraftBudgetPlan['rhythm']) {
  switch (rhythm) {
    case 'weekly':
      return 'Weekly';
    case 'biweekly':
      return 'Every two weeks';
    case 'monthly':
      return 'Monthly';
    case 'one_time':
      return 'One-time journey';
    default:
      return 'Not chosen';
  }
}

function amountFor(category: DraftBudgetCategory) {
  if (category.subcategories.length > 0) {
    return category.subcategories.reduce((sum, subcategory) => sum + parseMoneyInput(subcategory.amount), 0);
  }
  return parseMoneyInput(category.amount) || 0;
}

function ReviewSection({
  title,
  categories,
  currency,
}: {
  title: string;
  categories: DraftBudgetCategory[];
  currency: CurrencyCode;
}) {
  const activeCategories = categories.filter((category) => amountFor(category) > 0);
  if (!activeCategories.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rows}>
        {activeCategories.map((category) => {
          const activeSubcategories = category.subcategories.filter((subcategory) => parseMoneyInput(subcategory.amount) > 0);
          return (
            <View key={category.id} style={styles.categoryBlock}>
              <View style={styles.row}>
                <Text style={styles.rowName}>{category.name}</Text>
                <Text style={styles.rowAmount}>{formatMoney(amountFor(category), currency)}</Text>
              </View>

              {activeSubcategories.map((subcategory) => (
                <View key={subcategory.id} style={[styles.row, styles.subcategoryRow]}>
                  <Text style={styles.subcategoryName}>{subcategory.name}</Text>
                  <Text style={styles.rowAmount}>{formatMoney(parseMoneyInput(subcategory.amount), currency)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ReviewBudgetStep({
  currency,
  draftBudget,
  steadyTotal,
  householdTotal,
  remainingAmount,
  onBegin,
  saving = false,
  onReturnToVessels,
  motion,
}: Props) {
  const assignedTotal = steadyTotal + householdTotal;
  const hasFunding = draftBudget.fundingAmount !== null;
  const overBudget = remainingAmount !== null && remainingAmount < 0;

  return (
    <>
      <Animated.View style={{ opacity: motion.summaryOpacity, transform: [{ translateY: motion.summaryDrop }] }}>
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Plan</Text>
            <Text style={styles.metaValue}>{draftBudget.name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Rhythm</Text>
            <Text style={styles.metaValue}>{rhythmLabel(draftBudget.rhythm)}</Text>
          </View>
          {hasFunding ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Available</Text>
              <Text style={styles.metaValue}>{formatMoney(draftBudget.fundingAmount!, currency)}</Text>
            </View>
          ) : null}
          {draftBudget.reserveTargetAmount !== null ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Keep untouched</Text>
              <Text style={styles.metaValue}>{formatMoney(draftBudget.reserveTargetAmount, currency)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Shaped for this plan</Text>
          <Text style={styles.totalAmount}>{formatMoney(assignedTotal, currency)}</Text>
          {remainingAmount !== null ? (
            <Text style={[styles.remainingText, overBudget && styles.remainingOver]}>
              {overBudget ? 'Over by ' : 'Still unshaped '}
              {formatMoney(Math.abs(remainingAmount), currency)}
            </Text>
          ) : null}
        </View>

        <ReviewSection title="Steady obligations" categories={draftBudget.steadyObligations} currency={currency} />
        <ReviewSection title="Household vessels" categories={draftBudget.householdVessels} currency={currency} />
      </Animated.View>

      <Animated.View style={{ opacity: motion.actionOpacity, transform: [{ translateY: motion.actionDrop }] }}>
        <View style={styles.actions}>
          <JewelButton
            label="Begin the Month"
            onPress={onBegin}
            disabled={saving}
            accessibilityLabel="Begin the month"
          >
            {saving ? (
              <View style={styles.savingContent}>
                <ActivityIndicator size="small" color={Colors.text.inverse} />
                <Text style={styles.savingText}>Shaping your plan</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Begin the Month</Text>
            )}
          </JewelButton>
          <TouchableOpacity
            onPress={onReturnToVessels}
            activeOpacity={0.78}
            disabled={saving}
            style={[styles.textButton, saving && styles.textButtonDisabled]}
          >
            <Text style={styles.textButtonLabel}>Shape the vessels again</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  metaValue: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  totalCard: {
    marginTop: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(79,175,143,0.22)',
    backgroundColor: 'rgba(79,175,143,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  totalAmount: {
    marginTop: 4,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.palette.green,
  },
  remainingText: {
    marginTop: 3,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  remainingOver: {
    color: Colors.feedback.danger,
  },
  section: {
    marginTop: 16,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text.primary,
  },
  rows: {
    gap: 8,
  },
  categoryBlock: {
    gap: 4,
  },
  row: {
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,26,26,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowName: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  subcategoryRow: {
    minHeight: 38,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(79,175,143,0.18)',
  },
  subcategoryName: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  rowAmount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.palette.green,
  },
  actions: {
    marginTop: 16,
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.inverse,
  },
  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text.inverse,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textButtonDisabled: {
    opacity: 0.45,
  },
  textButtonLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
