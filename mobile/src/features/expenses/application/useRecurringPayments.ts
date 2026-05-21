import { useCallback, useMemo, useState } from 'react';
import { loadRemoteBudgetPlan, loadRemoteExpenseOccurrences, loadRemoteExpenseSchedules, processRemoteDueSchedules } from '../../budget/application/budgetApi';
import type { BudgetPlan, ExpenseOccurrence, ExpenseSchedule } from '../../../types';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

export function useRecurringPayments() {
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [schedules, setSchedules] = useState<ExpenseSchedule[]>([]);
  const [occurrences, setOccurrences] = useState<ExpenseOccurrence[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const horizon = toDateKey(endOfMonth(addMonths(visibleMonth, 1)));
    await processRemoteDueSchedules(horizon);
    const [nextBudget, nextSchedules, nextOccurrences] = await Promise.all([
      loadRemoteBudgetPlan(),
      loadRemoteExpenseSchedules(),
      loadRemoteExpenseOccurrences(),
    ]);
    setBudget(nextBudget);
    setSchedules(nextSchedules);
    setOccurrences(nextOccurrences.filter((occurrence) => occurrence.status === 'planned'));
    setLoading(false);
  }, [visibleMonth]);

  const itemLabels = useMemo(() => {
    if (!budget) return new Map<string, string>();
    const rows = [...budget.steadyObligations, ...budget.householdVessels];
    const map = new Map<string, string>();
    rows.forEach((row) => {
      map.set(row.id, row.name);
      row.subcategories?.forEach((subcategory) => {
        map.set(subcategory.id, `${row.name} / ${subcategory.name}`);
      });
    });
    return map;
  }, [budget]);

  return {
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
  };
}
