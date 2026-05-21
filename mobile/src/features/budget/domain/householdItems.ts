import type { HouseholdBudgetItem } from '../../../types';

export function starterHouseholdBudgetItems(): HouseholdBudgetItem[] {
  return [
    { id: 'housing', name: 'Housing', sectionKey: 'steady_obligations', sortOrder: 0, parentId: null },
    { id: 'groceries', name: 'Groceries', sectionKey: 'household_vessels', sortOrder: 1, parentId: null },
    { id: 'utilities', name: 'Utilities', sectionKey: 'steady_obligations', sortOrder: 2, parentId: null },
    { id: 'subscriptions', name: 'Monthly subscriptions', sectionKey: 'steady_obligations', sortOrder: 3, parentId: null },
    { id: 'netflix', name: 'Netflix', sectionKey: 'steady_obligations', sortOrder: 0, parentId: 'subscriptions' },
    { id: 'disney-plus', name: 'Disney+', sectionKey: 'steady_obligations', sortOrder: 1, parentId: 'subscriptions' },
    { id: 'other-subscriptions', name: 'Other subscriptions', sectionKey: 'steady_obligations', sortOrder: 2, parentId: 'subscriptions' },
    { id: 'transport', name: 'Transport', sectionKey: 'household_vessels', sortOrder: 4, parentId: null },
    { id: 'savings', name: 'Savings', sectionKey: 'household_vessels', sortOrder: 5, parentId: null },
    { id: 'other', name: 'Other', sectionKey: 'household_vessels', sortOrder: 6, parentId: null },
  ];
}

export function activeHouseholdItems(items: HouseholdBudgetItem[]) {
  return items.filter((item) => !item.archivedAt);
}

export function householdItemDepth(items: HouseholdBudgetItem[], itemId: string) {
  const byId = new Map(items.map((item) => [item.id, item]));
  let depth = 1;
  let current = byId.get(itemId);

  while (current?.parentId) {
    depth += 1;
    current = byId.get(current.parentId);
  }

  return depth;
}

export function leafHouseholdItems(items: HouseholdBudgetItem[]) {
  const active = activeHouseholdItems(items);
  const parents = new Set(active.flatMap((item) => item.parentId ? [item.parentId] : []));
  return active.filter((item) => !parents.has(item.id));
}

export function householdItemLabel(items: HouseholdBudgetItem[], itemId: string) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const labels: string[] = [];
  let current = byId.get(itemId);

  while (current) {
    labels.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return labels.join(' / ');
}

export function householdItemGroups(items: HouseholdBudgetItem[]) {
  const active = activeHouseholdItems(items).filter((item) => item.name.trim().length > 0);
  const roots = active.filter((item) => !item.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  return roots.map((root) => {
    const children = active
      .filter((item) => item.parentId === root.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      root,
      children,
    };
  });
}
