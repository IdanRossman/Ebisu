import { apiRequest } from '../../../lib/api';
import { loadBootstrap } from '../../bootstrap/application/bootstrapApi';
import type {
  BudgetPlan,
  BudgetSectionItem,
  BudgetSectionKey,
  BudgetWatchTarget,
  DraftBudgetPlan,
  ExpenseEntry,
  ExpenseOccurrence,
  ExpenseSchedule,
} from '../../../types';
import { createBudgetSectionItemsFromDraft, periodBoundsForRhythm, targetId, toDateKey } from '../domain/budget';
import { loadWeekStartsOn } from '../../preferences/infrastructure/homePreferencesRepository';
import type { RecurrenceFrequency } from '../../expenses/domain/recurrence';

type RemoteBudgetPlan = {
  id: string;
  name: string;
  period_type: BudgetPlan['rhythm'];
  starts_on: string;
  ends_on: string;
  currency_code: BudgetPlan['currency'];
  funding_amount: number | string | null;
  reserve_target_amount: number | string | null;
  created_at: string;
  updated_at: string;
};

type RemoteBudgetItem = {
  id: string;
  parent_id: string | null;
  section_key: BudgetSectionKey;
  name: string;
  sort_order: number;
  archived_at: string | null;
};

type RemoteAllocation = {
  budget_item_id: string;
  planned_amount: number | string;
};

type RemoteExpense = {
  id: string;
  budget_item_id: string;
  category_name_snapshot: string | null;
  subcategory_name_snapshot: string | null;
  amount: number | string;
  payee_name: string;
  note: string;
  spent_on: string;
  created_at: string;
};

type RemoteWatchTarget = {
  id: string;
  budget_item_id: string;
};

type RemoteExpenseSchedule = {
  id: string;
  budget_item_id: string;
  name: string;
  amount: number | string;
  recurrence_frequency: ExpenseSchedule['recurrenceFrequency'];
  recurrence_interval: number | string;
  recurrence_day_of_month: number | null;
  recurrence_weekday: number | null;
  next_due_on: string;
  note: string;
};

type RemoteExpenseOccurrence = {
  id: string;
  budget_item_id: string;
  source_schedule_id: string;
  name: string;
  amount: number | string;
  due_on: string;
  note: string;
  status: ExpenseOccurrence['status'];
};

type RemoteShapeResponse = {
  plan: RemoteBudgetPlan;
};

function money(value: number | string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function buildSectionItems(
  section: BudgetSectionKey,
  items: RemoteBudgetItem[],
  allocations: RemoteAllocation[],
  expenses: RemoteExpense[],
): BudgetSectionItem[] {
  const allocationByItem = new Map(allocations.map((allocation) => [allocation.budget_item_id, Number(allocation.planned_amount)]));
  const spentByItem = new Map<string, number>();
  expenses.forEach((expense) => {
    spentByItem.set(expense.budget_item_id, (spentByItem.get(expense.budget_item_id) ?? 0) + Number(expense.amount));
  });

  const sectionItems = items.filter((item) => item.section_key === section);
  const childrenByParent = new Map<string, RemoteBudgetItem[]>();
  sectionItems.forEach((item) => {
    if (!item.parent_id) return;
    childrenByParent.set(item.parent_id, [...(childrenByParent.get(item.parent_id) ?? []), item]);
  });

  return sectionItems
    .filter((item) => !item.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const children = (childrenByParent.get(item.id) ?? []).sort((a, b) => a.sort_order - b.sort_order);
      const subcategories = children.map((child) => ({
        id: child.id,
        name: child.name,
        plannedAmount: allocationByItem.get(child.id) ?? 0,
        spentAmount: spentByItem.get(child.id) ?? 0,
        ...(child.archived_at ? { archivedAt: child.archived_at } : {}),
      }));
      const plannedAmount = subcategories.length
        ? subcategories.reduce((sum, child) => sum + child.plannedAmount, 0)
        : allocationByItem.get(item.id) ?? 0;
      const spentAmount = subcategories.length
        ? subcategories.reduce((sum, child) => sum + child.spentAmount, 0)
        : spentByItem.get(item.id) ?? 0;

      return {
        id: item.id,
        name: item.name,
        plannedAmount,
        spentAmount,
        skipped: false,
        ...(subcategories.length ? { subcategories } : {}),
        ...(item.archived_at ? { archivedAt: item.archived_at } : {}),
      };
    });
}

export async function loadRemoteBudgetPlan() {
  const bootstrap = await loadBootstrap();
  if (!bootstrap.currentSpace || !bootstrap.currentPlan) return null;

  const [items, allocations, expenses] = await Promise.all([
    apiRequest<RemoteBudgetItem[]>(`/budgets/items?spaceId=${bootstrap.currentSpace.id}`),
    apiRequest<RemoteAllocation[]>(`/budgets/${bootstrap.currentPlan.id}/allocations`),
    apiRequest<RemoteExpense[]>(`/expenses?planId=${bootstrap.currentPlan.id}`),
  ]);

  return {
    id: bootstrap.currentPlan.id,
    name: bootstrap.currentPlan.name,
    rhythm: bootstrap.currentPlan.period_type,
    periodKey: bootstrap.currentPlan.starts_on.slice(0, 7),
    periodStart: bootstrap.currentPlan.starts_on,
    periodEnd: bootstrap.currentPlan.ends_on,
    currency: bootstrap.currentPlan.currency_code,
    fundingAmount: money(bootstrap.currentPlan.funding_amount),
    reserveTargetAmount: money(bootstrap.currentPlan.reserve_target_amount),
    steadyObligations: buildSectionItems('steady_obligations', items, allocations, expenses),
    householdVessels: buildSectionItems('household_vessels', items, allocations, expenses),
    expenses: expenses.map((expense): ExpenseEntry => {
      const item = items.find((candidate) => candidate.id === expense.budget_item_id);
      const parent = item?.parent_id ? items.find((candidate) => candidate.id === item.parent_id) : null;
      return {
        id: expense.id,
        section: item?.section_key ?? 'household_vessels',
        categoryId: parent?.id ?? item?.id ?? expense.budget_item_id,
        subcategoryId: parent ? item?.id ?? null : null,
        categoryNameSnapshot: expense.category_name_snapshot ?? parent?.name ?? item?.name ?? 'Household',
        subcategoryNameSnapshot: expense.subcategory_name_snapshot ?? (parent ? item?.name ?? null : null),
        amount: Number(expense.amount),
        payeeName: expense.payee_name,
        note: expense.note,
        date: expense.spent_on,
        createdAt: expense.created_at,
      };
    }),
    createdAt: bootstrap.currentPlan.created_at,
    updatedAt: bootstrap.currentPlan.updated_at,
  } satisfies BudgetPlan;
}

export async function createRemoteShapedPlan(draft: DraftBudgetPlan) {
  const steady = createBudgetSectionItemsFromDraft(draft.steadyObligations);
  const vessels = createBudgetSectionItemsFromDraft(draft.householdVessels);
  const weekStartsOn = await loadWeekStartsOn();
  const bounds = periodBoundsForRhythm(draft.rhythm ?? 'monthly', weekStartsOn);
  const startsOn = toDateKey(bounds.start);
  const endsOn = toDateKey(bounds.end);

  const flatten = (sectionKey: BudgetSectionKey, categories: BudgetSectionItem[]) => categories.flatMap((category, sortOrder) => [
    {
      clientId: category.id,
      sectionKey,
      name: category.name,
      sortOrder,
      plannedAmount: category.subcategories?.length ? 0 : category.plannedAmount,
    },
    ...(category.subcategories ?? []).map((subcategory, childSortOrder) => ({
      clientId: subcategory.id,
      parentClientId: category.id,
      sectionKey,
      name: subcategory.name,
      sortOrder: childSortOrder,
      plannedAmount: subcategory.plannedAmount,
    })),
  ]);

  await apiRequest<RemoteShapeResponse>('/budgets/shaped-plan', {
    method: 'POST',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      name: draft.name.trim(),
      periodType: draft.rhythm ?? 'monthly',
      startsOn,
      endsOn,
      currencyCode: draft.currency ?? 'ILS',
      fundingAmount: draft.fundingAmount,
      reserveTargetAmount: draft.reserveTargetAmount,
      items: [
        ...flatten('steady_obligations', steady),
        ...flatten('household_vessels', vessels),
      ],
    }),
  });
  return loadRemoteBudgetPlan();
}

export async function loadRemoteWatchTargets(plan: BudgetPlan) {
  const spaceId = await loadCurrentSpaceId();
  const items = await apiRequest<RemoteBudgetItem[]>(`/budgets/items?spaceId=${spaceId}`);
  const remoteTargets = await apiRequest<RemoteWatchTarget[]>(`/budgets/watch-targets?spaceId=${spaceId}`);
  return remoteTargets.flatMap((target): BudgetWatchTarget[] => {
    const item = items.find((candidate) => candidate.id === target.budget_item_id);
    if (!item) return [];
    const parent = item.parent_id ? items.find((candidate) => candidate.id === item.parent_id) : null;
    const section = item.section_key;
    const categoryId = parent?.id ?? item.id;
    const subcategoryId = parent ? item.id : null;
    return [{ id: targetId(section, categoryId, subcategoryId), section, categoryId, subcategoryId }];
  });
}

export async function saveRemoteWatchTargets(targets: BudgetWatchTarget[]) {
  const spaceId = await loadCurrentSpaceId();
  await apiRequest('/budgets/watch-targets', {
    method: 'PUT',
    body: JSON.stringify({
      budgetSpaceId: spaceId,
      targets: targets.map((target) => ({ budgetItemId: target.subcategoryId ?? target.categoryId })),
    }),
  });
}

export async function createRemoteBudgetItem(input: {
  section: BudgetSectionKey;
  name: string;
  plannedAmount: number;
  parentId?: string | null;
  sortOrder?: number;
}) {
  const created = await apiRequest<RemoteBudgetItem>('/budgets/items', {
    method: 'POST',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      parentId: input.parentId ?? undefined,
      sectionKey: input.section,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
    }),
  });

  const plan = await loadRemoteBudgetPlan();
  if (plan) {
    await updateRemoteAllocation(plan, created.id, input.plannedAmount);
  }

  return created;
}

export async function createRemoteExpense(plan: BudgetPlan, expense: Omit<ExpenseEntry, 'id' | 'createdAt'>) {
  await apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      budgetPlanId: plan.id,
      budgetItemId: expense.subcategoryId ?? expense.categoryId,
      categoryNameSnapshot: expense.categoryNameSnapshot,
      subcategoryNameSnapshot: expense.subcategoryNameSnapshot,
      amount: expense.amount,
      payeeName: expense.payeeName,
      note: expense.note,
      spentOn: expense.date,
    }),
  });
  return loadRemoteBudgetPlan();
}

export async function updateRemoteExpense(plan: BudgetPlan, expenseId: string, expense: Omit<ExpenseEntry, 'id' | 'createdAt'>) {
  await apiRequest(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      budgetItemId: expense.subcategoryId ?? expense.categoryId,
      categoryNameSnapshot: expense.categoryNameSnapshot,
      subcategoryNameSnapshot: expense.subcategoryNameSnapshot,
      amount: expense.amount,
      payeeName: expense.payeeName,
      note: expense.note,
      spentOn: expense.date,
    }),
  });
  return loadRemoteBudgetPlan();
}

export async function deleteRemoteExpense(expenseId: string) {
  await apiRequest(`/expenses/${expenseId}`, { method: 'DELETE' });
  return loadRemoteBudgetPlan();
}

export async function createRemoteExpenseSchedule(input: {
  budgetItemId: string;
  name: string;
  amount: number;
  frequency: RecurrenceFrequency;
  recurrenceDayOfMonth?: number;
  recurrenceWeekday?: number;
  startsOn: string;
  nextDueOn: string;
  endsOn?: string;
  note?: string;
}) {
  await apiRequest('/expenses/schedules', {
    method: 'POST',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      budgetItemId: input.budgetItemId,
      name: input.name,
      amount: input.amount,
      scheduleType: 'recurring',
      recurrenceFrequency: input.frequency,
      recurrenceInterval: 1,
      ...(input.recurrenceDayOfMonth ? { recurrenceDayOfMonth: input.recurrenceDayOfMonth } : {}),
      ...(input.recurrenceWeekday !== undefined ? { recurrenceWeekday: input.recurrenceWeekday } : {}),
      startsOn: input.startsOn,
      nextDueOn: input.nextDueOn,
      ...(input.endsOn ? { endsOn: input.endsOn } : {}),
      note: input.note ?? '',
    }),
  });
}

export async function processRemoteDueSchedules(throughDate: string) {
  await apiRequest('/expenses/schedules/process-due', {
    method: 'POST',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      throughDate,
    }),
  });
}

export async function loadRemoteExpenseSchedules() {
  const spaceId = await loadCurrentSpaceId();
  const rows = await apiRequest<RemoteExpenseSchedule[]>(`/expenses/schedules?spaceId=${spaceId}`);
  return rows.map((row): ExpenseSchedule => ({
    id: row.id,
    budgetItemId: row.budget_item_id,
    name: row.name,
    amount: Number(row.amount),
    recurrenceFrequency: row.recurrence_frequency,
    recurrenceInterval: Number(row.recurrence_interval),
    recurrenceDayOfMonth: row.recurrence_day_of_month,
    recurrenceWeekday: row.recurrence_weekday,
    nextDueOn: row.next_due_on,
    note: row.note,
  }));
}

export async function loadRemoteExpenseOccurrences() {
  const spaceId = await loadCurrentSpaceId();
  const rows = await apiRequest<RemoteExpenseOccurrence[]>(`/expenses/occurrences?spaceId=${spaceId}`);
  return rows.map((row): ExpenseOccurrence => ({
    id: row.id,
    budgetItemId: row.budget_item_id,
    sourceScheduleId: row.source_schedule_id,
    name: row.name,
    amount: Number(row.amount),
    dueOn: row.due_on,
    note: row.note,
    status: row.status,
  }));
}

export async function updateRemoteBudgetItem(itemId: string, input: { name: string }) {
  await apiRequest(`/budgets/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function updateRemoteAllocation(plan: BudgetPlan, itemId: string, plannedAmount: number) {
  await apiRequest('/budgets/allocations', {
    method: 'PUT',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      budgetPlanId: plan.id,
      budgetItemId: itemId,
      plannedAmount,
    }),
  });
}

export async function updateRemoteBudgetPlan(
  planId: string,
  input: { reserveTargetAmount?: number | null; fundingAmount?: number | null; currencyCode?: BudgetPlan['currency'] },
) {
  await apiRequest(`/budgets/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function saveRemoteBudgetConfiguration(plan: BudgetPlan) {
  const flatten = (sectionKey: BudgetSectionKey, categories: BudgetSectionItem[]) => categories.flatMap((category, sortOrder) => {
    if (category.id.startsWith('draft-') && category.archivedAt) return [];
    return [
      {
        id: category.id,
        sectionKey,
        name: category.name,
        sortOrder,
        plannedAmount: category.subcategories?.length ? 0 : category.plannedAmount,
        archivedAt: category.archivedAt ?? null,
      },
      ...(category.subcategories ?? []).flatMap((subcategory, childSortOrder) => (
        subcategory.id.startsWith('draft-') && subcategory.archivedAt
          ? []
          : [{
              id: subcategory.id,
              parentId: category.id,
              sectionKey,
              name: subcategory.name,
              sortOrder: childSortOrder,
              plannedAmount: subcategory.plannedAmount,
              archivedAt: subcategory.archivedAt ?? null,
            }]
      )),
    ];
  });

  await apiRequest(`/budgets/${plan.id}/configuration`, {
    method: 'PUT',
    body: JSON.stringify({
      budgetSpaceId: await loadCurrentSpaceId(),
      fundingAmount: plan.fundingAmount,
      reserveTargetAmount: plan.reserveTargetAmount,
      items: [
        ...flatten('steady_obligations', plan.steadyObligations),
        ...flatten('household_vessels', plan.householdVessels),
      ],
    }),
  });
  return loadRemoteBudgetPlan();
}

export async function archiveRemoteBudgetItem(itemId: string) {
  await apiRequest(`/budgets/items/${itemId}`, {
    method: 'DELETE',
  });
}

async function loadCurrentSpaceId() {
  const bootstrap = await loadBootstrap();
  if (!bootstrap.currentSpace) throw new Error('No current budget space found.');
  return bootstrap.currentSpace.id;
}
