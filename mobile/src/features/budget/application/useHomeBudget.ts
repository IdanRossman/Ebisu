import { useCallback, useMemo, useRef, useState } from 'react';
import { activePlanItems, aggregateWatchCard, fallbackWatchCard, resolveWatchCards } from '../domain/budget';
import { parseMoneyInput } from '../domain/money';
import { deleteBudgetPlan, loadBudgetPlan, saveBudgetPlan } from '../infrastructure/budgetRepository';
import { deleteBudgetWatchTargets, loadBudgetWatchTargets } from '../infrastructure/watchRepository';
import { BudgetPlan, BudgetSectionKey, BudgetWatchCard, HomeProgressScope } from '../../../types';
import { createRemoteExpense, createRemoteExpenseSchedule, loadRemoteBudgetPlan, loadRemoteWatchTargets } from './budgetApi';
import { loadHomeProgressScope } from '../../preferences/infrastructure/homePreferencesRepository';
import {
  dayOfMonth,
  nextMonthlyDueDate,
  nextWeeklyDueDate,
  weekdayIndex,
  type RecurrenceFrequency,
} from '../../expenses/domain/recurrence';

export type ExpenseTarget = {
  id: string;
  label: string;
  displayLabel: string;
  parentLabel?: string;
  depth: 0 | 1;
  section: BudgetSectionKey;
  categoryId: string;
  subcategoryId?: string | null;
};

function expenseTargetsForPlan(plan: BudgetPlan): ExpenseTarget[] {
  return activePlanItems(plan).flatMap<ExpenseTarget>(({ section, item }) => {
    const rootTarget: ExpenseTarget = {
      id: item.id,
      label: item.name,
      displayLabel: item.name,
      depth: 0,
      section,
      categoryId: item.id,
      subcategoryId: null,
    };

    const subcategoryTargets = item.subcategories?.map((subcategory) => ({
        id: subcategory.id,
        label: `${item.name} / ${subcategory.name}`,
        displayLabel: subcategory.name,
        parentLabel: item.name,
        depth: 1,
        section,
        categoryId: item.id,
        subcategoryId: subcategory.id,
    } satisfies ExpenseTarget)) ?? [];

    return [rootTarget, ...subcategoryTargets];
  });
}

function rankExpenseTargets(plan: BudgetPlan, targets: ExpenseTarget[]) {
  const recentIds = plan.expenses.map((expense) => expense.subcategoryId ?? expense.categoryId);
  const firstSeen = new Map<string, number>();
  const counts = new Map<string, number>();
  recentIds.forEach((id, index) => {
    if (!firstSeen.has(id)) firstSeen.set(id, index);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return [...targets].sort((a, b) => {
    const aHouseholdBias = a.section === 'household_vessels' ? 1 : 0;
    const bHouseholdBias = b.section === 'household_vessels' ? 1 : 0;
    const aCount = counts.get(a.id) ?? 0;
    const bCount = counts.get(b.id) ?? 0;
    if (aCount !== bCount) return bCount - aCount;
    if (aHouseholdBias !== bHouseholdBias) return bHouseholdBias - aHouseholdBias;
    const aSeen = firstSeen.get(a.id) ?? Number.POSITIVE_INFINITY;
    const bSeen = firstSeen.get(b.id) ?? Number.POSITIVE_INFINITY;
    return aSeen - bSeen;
  });
}

export function useHomeBudget() {
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryOpen, setEntryOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayeeName, setExpensePayeeName] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [recurringExpense, setRecurringExpense] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly');
  const [recurrenceMonthlyDay, setRecurrenceMonthlyDay] = useState(() => dayOfMonth(new Date().toISOString().slice(0, 10)));
  const [recurrenceWeeklyDay, setRecurrenceWeeklyDay] = useState(() => weekdayIndex(new Date().toISOString().slice(0, 10)));
  const [recurrenceEndsOn, setRecurrenceEndsOn] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [watchCards, setWatchCards] = useState<BudgetWatchCard[]>([]);
  const [homeProgressScope, setHomeProgressScope] = useState<HomeProgressScope>('living_money');
  const refreshInFlightRef = useRef<Promise<BudgetPlan | null> | null>(null);

  const expenseTargets = useMemo<ExpenseTarget[]>(() => budget ? expenseTargetsForPlan(budget) : [], [budget]);
  const rankedExpenseTargets = useMemo(() => {
    return budget ? rankExpenseTargets(budget, expenseTargets) : expenseTargets;
  }, [budget, expenseTargets]);
  const watchedStatCard = useMemo(() => aggregateWatchCard(watchCards), [watchCards]);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    refreshInFlightRef.current = (async () => {
      setHomeProgressScope(await loadHomeProgressScope());
      const savedBudget = await loadRemoteBudgetPlan().catch(() => loadBudgetPlan());
      if (!savedBudget) {
        setBudget(null);
        setLoading(false);
        return null;
      }

      await saveBudgetPlan(savedBudget);
      const watchedTargets = await loadRemoteWatchTargets(savedBudget).catch(() => loadBudgetWatchTargets());
      const resolvedCards = resolveWatchCards(savedBudget, watchedTargets);
      const fallbackCard = fallbackWatchCard(savedBudget);
      setBudget(savedBudget);
      setWatchCards(resolvedCards.length ? resolvedCards : fallbackCard ? [fallbackCard] : []);
      const savedTargets = expenseTargetsForPlan(savedBudget);
      const firstTarget = rankExpenseTargets(savedBudget, savedTargets)[0] ?? savedTargets[0];
      setSelectedTargetId((current) => current ?? firstTarget?.id ?? null);
      setLoading(false);
      return savedBudget;
    })().finally(() => {
      refreshInFlightRef.current = null;
    });

    return refreshInFlightRef.current;
  }, []);

  const recordExpense = async () => {
    if (savingExpense) return { ok: false as const, reason: 'save-failed' as const };
    if (!budget || !selectedTargetId) return { ok: false as const, reason: 'missing-target' as const };
    const selectedTarget = expenseTargets.find((target) => target.id === selectedTargetId);
    if (!selectedTarget) return { ok: false as const, reason: 'missing-target' as const };
    const amount = parseMoneyInput(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, reason: 'invalid-amount' as const };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || Number.isNaN(new Date(expenseDate).getTime())) {
      return { ok: false as const, reason: 'invalid-date' as const };
    }
    if (
      recurringExpense
      && recurrenceEndsOn
      && (!/^\d{4}-\d{2}-\d{2}$/.test(recurrenceEndsOn)
        || Number.isNaN(new Date(recurrenceEndsOn).getTime())
        || recurrenceEndsOn < expenseDate)
    ) {
      return { ok: false as const, reason: 'invalid-end-date' as const };
    }

    setSavingExpense(true);
    try {
      const nextBudget = await createRemoteExpense(budget, {
        amount,
        section: selectedTarget.section,
        categoryId: selectedTarget.categoryId,
        subcategoryId: selectedTarget.subcategoryId,
        categoryNameSnapshot: selectedTarget.parentLabel ?? selectedTarget.displayLabel,
        subcategoryNameSnapshot: selectedTarget.parentLabel ? selectedTarget.displayLabel : null,
        payeeName: expensePayeeName.trim(),
        note: expenseNote.trim(),
        date: expenseDate,
      });
      if (!nextBudget) throw new Error('Expense saved but plan could not be refreshed.');
      if (recurringExpense) {
        const budgetItemId = selectedTarget.subcategoryId ?? selectedTarget.categoryId;
        const nextDueOn = recurrenceFrequency === 'monthly'
          ? nextMonthlyDueDate(expenseDate, recurrenceMonthlyDay)
          : nextWeeklyDueDate(expenseDate, recurrenceWeeklyDay);
        try {
          await createRemoteExpenseSchedule({
            budgetItemId,
            name: expensePayeeName.trim() || selectedTarget.displayLabel,
            amount,
            frequency: recurrenceFrequency,
            ...(recurrenceFrequency === 'monthly' ? { recurrenceDayOfMonth: recurrenceMonthlyDay } : {}),
            ...(recurrenceFrequency === 'weekly' ? { recurrenceWeekday: recurrenceWeeklyDay } : {}),
            startsOn: expenseDate,
            nextDueOn,
            ...(recurrenceEndsOn ? { endsOn: recurrenceEndsOn } : {}),
            note: expenseNote.trim(),
          });
        } catch {
          await saveBudgetPlan(nextBudget);
          setBudget(nextBudget);
          setExpenseAmount('');
          setExpensePayeeName('');
          setExpenseNote('');
          setExpenseDate(new Date().toISOString().slice(0, 10));
          setRecurringExpense(false);
          setRecurrenceFrequency('monthly');
          setRecurrenceMonthlyDay(dayOfMonth(new Date().toISOString().slice(0, 10)));
          setRecurrenceWeeklyDay(weekdayIndex(new Date().toISOString().slice(0, 10)));
          setRecurrenceEndsOn('');
          setEntryOpen(false);
          setSavingExpense(false);
          return { ok: false as const, reason: 'schedule-save-failed' as const };
        }
      }
      await saveBudgetPlan(nextBudget);
      setBudget(nextBudget);
      setExpenseAmount('');
      setExpensePayeeName('');
      setExpenseNote('');
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setRecurringExpense(false);
      setRecurrenceFrequency('monthly');
      setRecurrenceMonthlyDay(dayOfMonth(new Date().toISOString().slice(0, 10)));
      setRecurrenceWeeklyDay(weekdayIndex(new Date().toISOString().slice(0, 10)));
      setRecurrenceEndsOn('');
      setEntryOpen(false);
      setSavingExpense(false);
      return { ok: true as const };
    } catch (error) {
      setSavingExpense(false);
      return {
        ok: false as const,
        reason: 'save-failed' as const,
        message: error instanceof Error ? error.message : undefined,
      };
    }
  };

  const closeExpenseSheet = () => {
    setEntryOpen(false);
    setRecurringExpense(false);
    setRecurrenceFrequency('monthly');
    setRecurrenceMonthlyDay(dayOfMonth(new Date().toISOString().slice(0, 10)));
    setRecurrenceWeeklyDay(weekdayIndex(new Date().toISOString().slice(0, 10)));
    setRecurrenceEndsOn('');
  };

  const clearBudget = async () => {
    await Promise.all([deleteBudgetPlan(), deleteBudgetWatchTargets()]);
    setBudget(null);
  };

  return {
    budget,
    loading,
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
    watchedStatCard,
    homeProgressScope,
    refresh,
    recordExpense,
    closeExpenseSheet,
    clearBudget,
  };
}
