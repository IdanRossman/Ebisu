import { StyleSheet, View } from 'react-native';
import { StatCard } from '../../../components/ui';
import { formatMoney } from '../domain/money';
import { BudgetPlan, BudgetWatchCard, CurrencyCode } from '../../../types';

type Props = {
  watchedCard: BudgetWatchCard | null;
  currency: CurrencyCode;
  budget: BudgetPlan;
};

function totalSpent(plan: BudgetPlan) {
  return [...plan.steadyObligations, ...plan.householdVessels].reduce((sum, item) => sum + item.spentAmount, 0);
}

function reserveCard(plan: BudgetPlan, currency: CurrencyCode) {
  if (plan.reserveTargetAmount == null) {
    return { value: '-', label: 'No reserve set' };
  }
  if (plan.fundingAmount == null) {
    return { value: formatMoney(plan.reserveTargetAmount, currency), label: 'Reserve target' };
  }

  const availableFunds = plan.fundingAmount - totalSpent(plan);
  const safeBeforeReserve = availableFunds - plan.reserveTargetAmount;

  if (safeBeforeReserve > 0) {
    return { value: formatMoney(safeBeforeReserve, currency), label: 'Safe before reserve' };
  }
  if (safeBeforeReserve === 0) {
    return { value: formatMoney(0, currency), label: 'Reserve reached' };
  }
  return { value: formatMoney(Math.abs(safeBeforeReserve), currency), label: 'Into reserve' };
}

export function HomeStatCards({ watchedCard, currency, budget }: Props) {
  const reserve = reserveCard(budget, currency);
  return (
    <View style={styles.glimpse}>
      <StatCard
        value={watchedCard ? formatMoney(watchedCard.remaining, currency) : '-'}
        label={watchedCard?.label ?? 'No vessel chosen'}
      />
      <StatCard value={reserve.value} label={reserve.label} />
    </View>
  );
}

const styles = StyleSheet.create({
  glimpse: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
});
