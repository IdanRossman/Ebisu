import type {
  BudgetPlan,
  BudgetPlanningRhythm,
  BudgetSectionItem,
  BudgetSectionKey,
  BudgetSubcategory,
  BudgetWatchCard,
  BudgetWatchTarget,
  CurrencyCode,
  DraftBudgetCategory,
  DraftBudgetPlan,
  ExpenseEntry,
  WeekStartsOn,
} from '../../../types';
import { parseMoneyInput } from './money';

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function periodBoundsForRhythm(
  rhythm: BudgetPlanningRhythm,
  weekStartsOn: WeekStartsOn = 'sunday',
  date = new Date(),
) {
  const atMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (rhythm === 'monthly') {
    const start = new Date(atMidnight.getFullYear(), atMidnight.getMonth(), 1);
    const end = new Date(atMidnight.getFullYear(), atMidnight.getMonth() + 1, 0);
    return { start, end };
  }
  if (rhythm === 'weekly' || rhythm === 'biweekly') {
    const targetDay = weekStartsOn === 'monday' ? 1 : 0;
    const diff = (atMidnight.getDay() - targetDay + 7) % 7;
    const start = new Date(atMidnight);
    start.setDate(start.getDate() - diff);
    const end = new Date(start);
    end.setDate(end.getDate() + (rhythm === 'weekly' ? 6 : 13));
    return { start, end };
  }
  return { start: atMidnight, end: atMidnight };
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function createBudgetSectionItem(
  id: string,
  name: string,
  plannedAmount: number,
  skipped = false,
  subcategories: BudgetSubcategory[] = [],
): BudgetSectionItem {
  const subcategoryTotal = subcategories.reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0);
  return {
    id,
    name,
    plannedAmount: subcategories.length > 0 ? subcategoryTotal : plannedAmount,
    spentAmount: 0,
    skipped,
    subcategories,
  };
}

export const createBudgetCategory = createBudgetSectionItem;

export function createDraftBudgetPlan(currency: CurrencyCode | null = null): DraftBudgetPlan {
  const now = new Date().toISOString();
  return {
    id: `draft-budget-${Date.now()}`,
    status: 'draft',
    name: 'My Budget Plan',
    rhythm: null,
    fundingAmount: null,
    reserveTargetAmount: null,
    currency,
    currentStep: 'metadata',
    categories: [],
    steadyObligations: [
      { id: 'rent', name: 'Rent / mortgage', amount: '', subcategories: [] },
      {
        id: 'utilities',
        name: 'Utilities',
        amount: '',
        subcategories: [
          { id: 'electricity', name: 'Electricity', amount: '' },
          { id: 'water', name: 'Water', amount: '' },
          { id: 'internet', name: 'Internet', amount: '' },
          { id: 'gas', name: 'Gas', amount: '' },
        ],
      },
      {
        id: 'insurance',
        name: 'Insurance',
        amount: '',
        subcategories: [
          { id: 'health-insurance', name: 'Health insurance', amount: '' },
          { id: 'car-insurance', name: 'Car insurance', amount: '' },
          { id: 'home-insurance', name: 'Home / renters insurance', amount: '' },
        ],
      },
    ],
    householdVessels: [
      { id: 'groceries', name: 'Groceries', amount: '', subcategories: [] },
      { id: 'transport', name: 'Transport', amount: '', subcategories: [] },
      { id: 'shopping', name: 'Shopping', amount: '', subcategories: [] },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateDraftBudgetPlan(
  draft: DraftBudgetPlan,
  patch: Partial<Omit<DraftBudgetPlan, 'id' | 'status' | 'createdAt'>>,
): DraftBudgetPlan {
  return {
    ...draft,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

function finalizedSubcategories(subcategories: DraftBudgetCategory['subcategories']) {
  return subcategories.flatMap((subcategory) => {
    const plannedAmount = roundMoney(parseMoneyInput(subcategory.amount) || 0);
    if (!subcategory.name.trim() || plannedAmount <= 0) return [];
    return [{
      id: subcategory.id,
      name: subcategory.name.trim(),
      plannedAmount,
      spentAmount: 0,
    }];
  });
}

export function createBudgetSectionItemsFromDraft(categories: DraftBudgetCategory[]) {
  return categories.flatMap((category) => {
    const subcategories = finalizedSubcategories(category.subcategories);
    const plannedAmount = roundMoney(
      subcategories.length
        ? subcategories.reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0)
        : parseMoneyInput(category.amount) || 0,
    );
    if (!category.name.trim() || plannedAmount <= 0) return [];
    return [createBudgetSectionItem(category.id, category.name.trim(), plannedAmount, false, subcategories)];
  });
}

export function createBudgetPlanFromDraft(draft: DraftBudgetPlan): BudgetPlan {
  const now = new Date().toISOString();
  const { start, end } = periodBoundsForRhythm(draft.rhythm ?? 'monthly');
  return {
    id: `plan-${currentMonthKey()}-${Date.now()}`,
    name: draft.name.trim(),
    rhythm: draft.rhythm ?? 'monthly',
    periodKey: toDateKey(start).slice(0, 7),
    periodStart: toDateKey(start),
    periodEnd: toDateKey(end),
    currency: draft.currency ?? 'ILS',
    fundingAmount: draft.fundingAmount,
    reserveTargetAmount: draft.reserveTargetAmount,
    steadyObligations: createBudgetSectionItemsFromDraft(draft.steadyObligations),
    householdVessels: createBudgetSectionItemsFromDraft(draft.householdVessels),
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function rollBudgetPlanForwardIfNeeded(
  plan: BudgetPlan,
  weekStartsOn: WeekStartsOn = 'sunday',
  date = new Date(),
): BudgetPlan {
  if (plan.rhythm === 'one_time') return plan;

  const todayKey = toDateKey(date);
  if (plan.periodEnd >= todayKey) return plan;

  let cursor = new Date(`${plan.periodEnd}T12:00:00`);
  cursor.setDate(cursor.getDate() + 1);
  let bounds = periodBoundsForRhythm(plan.rhythm, weekStartsOn, cursor);

  while (toDateKey(bounds.end) < todayKey) {
    cursor = new Date(bounds.end);
    cursor.setDate(cursor.getDate() + 1);
    bounds = periodBoundsForRhythm(plan.rhythm, weekStartsOn, cursor);
  }

  const now = new Date().toISOString();
  const resetSection = (items: BudgetSectionItem[]) => items.map((item) => ({
    ...item,
    spentAmount: 0,
    subcategories: item.subcategories?.map((subcategory) => ({ ...subcategory, spentAmount: 0 })),
  }));

  return {
    ...plan,
    id: `plan-${toDateKey(bounds.start)}-${Date.now()}`,
    periodKey: toDateKey(bounds.start).slice(0, 7),
    periodStart: toDateKey(bounds.start),
    periodEnd: toDateKey(bounds.end),
    steadyObligations: resetSection(plan.steadyObligations),
    householdVessels: resetSection(plan.householdVessels),
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function sectionItems(plan: BudgetPlan, section: BudgetSectionKey) {
  return section === 'steady_obligations' ? plan.steadyObligations : plan.householdVessels;
}

export function isActiveCategory(category: BudgetSectionItem) {
  return !category.skipped && !category.archivedAt;
}

export function isActiveSubcategory(subcategory: BudgetSubcategory) {
  return !subcategory.archivedAt;
}

export function activeSubcategories(category: BudgetSectionItem) {
  return category.subcategories?.filter(isActiveSubcategory) ?? [];
}

export function activeSectionItems(items: BudgetSectionItem[]) {
  return items
    .filter(isActiveCategory)
    .map((category) => ({
      ...category,
      subcategories: category.subcategories?.filter(isActiveSubcategory),
    }));
}

export function activePlanItems(plan: BudgetPlan) {
  return (['steady_obligations', 'household_vessels'] as const).flatMap((section) => (
    activeSectionItems(sectionItems(plan, section)).map((item) => ({ section, item }))
  ));
}

export function categoryPlannedAmount(category: BudgetSectionItem) {
  if (category.archivedAt || category.skipped) return 0;
  if (category.subcategories?.length) {
    return activeSubcategories(category).reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0);
  }
  return category.plannedAmount;
}

export function categorySpentAmount(category: BudgetSectionItem) {
  if (category.archivedAt || category.skipped) return 0;
  if (category.subcategories?.length) {
    return activeSubcategories(category).reduce((sum, subcategory) => sum + subcategory.spentAmount, 0);
  }
  return category.spentAmount;
}

export function budgetTotals(plan: BudgetPlan) {
  const items = activePlanItems(plan);
  const planned = items.reduce((sum, { item }) => sum + categoryPlannedAmount(item), 0);
  const spent = items.reduce((sum, { item }) => sum + categorySpentAmount(item), 0);
  return { planned, spent, remaining: planned - spent };
}

export function historicalSpentTotal(plan: BudgetPlan) {
  return roundMoney(plan.expenses.reduce((sum, expense) => sum + expense.amount, 0));
}

export function addExpenseToBudget(
  plan: BudgetPlan,
  expenseInput: Omit<ExpenseEntry, 'id' | 'createdAt'>,
): BudgetPlan {
  const now = new Date().toISOString();
  const expense: ExpenseEntry = {
    ...expenseInput,
    id: `expense-${Date.now()}`,
    createdAt: now,
  };

  return {
    ...plan,
    expenses: [expense, ...plan.expenses],
    [expense.section]: sectionItems(plan, expense.section).map((category) => {
      if (category.id !== expense.categoryId) return category;
      if (expense.subcategoryId && category.subcategories?.length) {
        const subcategories = category.subcategories.map((subcategory) => (
          subcategory.id === expense.subcategoryId
            ? { ...subcategory, spentAmount: roundMoney(subcategory.spentAmount + expense.amount) }
            : subcategory
        ));
        const spentAmount = subcategories.reduce((sum, subcategory) => sum + subcategory.spentAmount, 0);
        return { ...category, subcategories, spentAmount: roundMoney(spentAmount) };
      }
      return { ...category, spentAmount: roundMoney(category.spentAmount + expense.amount) };
    }),
    updatedAt: now,
  };
}

export function targetId(section: BudgetSectionKey, categoryId: string, subcategoryId?: string | null) {
  return subcategoryId ? `${section}:${categoryId}:${subcategoryId}` : `${section}:${categoryId}`;
}

export function resolveWatchCards(plan: BudgetPlan, targets: BudgetWatchTarget[]): BudgetWatchCard[] {
  return targets.flatMap((target) => {
    const category = sectionItems(plan, target.section).find((item) => item.id === target.categoryId);
    if (!category || !isActiveCategory(category)) return [];
    if (target.subcategoryId) {
      const subcategory = category.subcategories?.find((item) => item.id === target.subcategoryId);
      if (!subcategory || !isActiveSubcategory(subcategory)) return [];
      return [{
        ...target,
        label: subcategory.name,
        remaining: roundMoney(subcategory.plannedAmount - subcategory.spentAmount),
      }];
    }
    return [{
      ...target,
      label: category.name,
      remaining: roundMoney(categoryPlannedAmount(category) - categorySpentAmount(category)),
    }];
  });
}

export function fallbackWatchCard(plan: BudgetPlan): BudgetWatchCard | null {
  const candidates = activePlanItems(plan)
    .map(({ section, item }) => ({
      id: targetId(section, item.id),
      section,
      categoryId: item.id,
      subcategoryId: null,
      label: item.name,
      remaining: roundMoney(categoryPlannedAmount(item) - categorySpentAmount(item)),
    }))
    .filter((item) => item.remaining || categoryPlannedAmount(
      sectionItems(plan, item.section).find((category) => category.id === item.categoryId) as BudgetSectionItem,
    ) > 0);

  if (!candidates.length) return null;
  return candidates.filter((item) => item.remaining >= 0).sort((a, b) => a.remaining - b.remaining)[0]
    ?? candidates[0];
}

export function aggregateWatchCard(cards: BudgetWatchCard[]): BudgetWatchCard | null {
  if (!cards.length) return null;
  if (cards.length === 1) return cards[0];
  return {
    id: 'watched-categories',
    section: 'household_vessels',
    categoryId: 'watched-categories',
    subcategoryId: null,
    label: `Categories (${cards.length})`,
    remaining: cards.reduce((sum, card) => sum + card.remaining, 0),
  };
}

export function updateBudgetCategory(
  plan: BudgetPlan,
  section: BudgetSectionKey,
  categoryId: string,
  input: { name: string; plannedAmount: number },
): BudgetPlan {
  const now = new Date().toISOString();
  return {
    ...plan,
    [section]: sectionItems(plan, section).map((category) => {
      if (category.id !== categoryId) return category;
      if (category.subcategories?.length) return { ...category, name: input.name };
      return { ...category, name: input.name, plannedAmount: roundMoney(input.plannedAmount) };
    }),
    updatedAt: now,
  };
}

export function updateBudgetSubcategory(
  plan: BudgetPlan,
  section: BudgetSectionKey,
  categoryId: string,
  subcategoryId: string,
  input: { name: string; plannedAmount: number },
): BudgetPlan {
  const now = new Date().toISOString();
  return {
    ...plan,
    [section]: sectionItems(plan, section).map((category) => {
      if (category.id !== categoryId || !category.subcategories?.length) return category;
      const subcategories = category.subcategories.map((subcategory) => (
        subcategory.id === subcategoryId
          ? { ...subcategory, name: input.name, plannedAmount: roundMoney(input.plannedAmount) }
          : subcategory
      ));
      return {
        ...category,
        subcategories,
        plannedAmount: roundMoney(activeSubcategories({ ...category, subcategories }).reduce((sum, item) => sum + item.plannedAmount, 0)),
        spentAmount: roundMoney(activeSubcategories({ ...category, subcategories }).reduce((sum, item) => sum + item.spentAmount, 0)),
      };
    }),
    updatedAt: now,
  };
}

export function archiveBudgetCategory(plan: BudgetPlan, section: BudgetSectionKey, categoryId: string): BudgetPlan {
  const now = new Date().toISOString();
  return {
    ...plan,
    [section]: sectionItems(plan, section).map((category) => (
      category.id === categoryId ? { ...category, archivedAt: now } : category
    )),
    updatedAt: now,
  };
}

export function archiveBudgetSubcategory(
  plan: BudgetPlan,
  section: BudgetSectionKey,
  categoryId: string,
  subcategoryId: string,
): BudgetPlan {
  const now = new Date().toISOString();
  return {
    ...plan,
    [section]: sectionItems(plan, section).map((category) => {
      if (category.id !== categoryId || !category.subcategories?.length) return category;
      const subcategories = category.subcategories.map((subcategory) => (
        subcategory.id === subcategoryId ? { ...subcategory, archivedAt: now } : subcategory
      ));
      return {
        ...category,
        subcategories,
        plannedAmount: roundMoney(activeSubcategories({ ...category, subcategories }).reduce((sum, item) => sum + item.plannedAmount, 0)),
        spentAmount: roundMoney(activeSubcategories({ ...category, subcategories }).reduce((sum, item) => sum + item.spentAmount, 0)),
      };
    }),
    updatedAt: now,
  };
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
